import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Calendar,
  Users,
  Clock,
  LayoutDashboard,
  Download,
  RefreshCw,
  CheckCircle,
  UploadCloud,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  onSnapshot,
  query
} from 'firebase/firestore';

// --- Global Variable Declarations ---
/* global __firebase_config __app_id __initial_auth_token */

// --- Firebase Configuration & Init ---
let firebaseConfig, app, auth, db, appId;

try {
  firebaseConfig = JSON.parse(__firebase_config);
  if (firebaseConfig.apiKey === 'demo-api-key' || !firebaseConfig.projectId || firebaseConfig.projectId === 'demo-project') {
    throw new Error('Firebase config not properly set up');
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
} catch (error) {
  console.warn('Firebase not configured properly. Running in demo mode:', error.message);
  firebaseConfig = null;
  app = null;
  auth = null;
  db = null;
  appId = 'demo-app-id';
}

// --- Components ---

const SectionHeader = ({ title, icon: Icon, description }) => (
  <div className="mb-6 border-b pb-4 border-slate-200">
    <div className="flex items-center gap-2 mb-1">
      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
        <Icon size={24} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
    </div>
    {description && <p className="text-slate-500 ml-12">{description}</p>}
  </div>
);

const InputField = ({ label, value, onChange, type = "text", placeholder, options, className = "" }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-sm font-semibold text-slate-700">{label}</label>
    {type === 'select' ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        <option value="">Select...</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    )}
  </div>
);

const initialData = {
  classInfo: {
    department: '',
    year: '',
    ccName: '',
    totalStudents: '',
  },
  date: new Date().toISOString().split('T')[0],
  students: [
    { id: 1, rollNo: '', name: '', status: 'present', remarks: '' },
    { id: 2, rollNo: '', name: '', status: 'present', remarks: '' },
    { id: 3, rollNo: '', name: '', status: 'present', remarks: '' },
  ],
  submittedAt: null
};

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState(initialData);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [submittedRecords, setSubmittedRecords] = useState([]);
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [isAdminView, setIsAdminView] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [callingRecords, setCallingRecords] = useState([]);
  const [newCall, setNewCall] = useState({ studentRollNo: '', date: new Date().toISOString().split('T')[0], contact: '', reason: '', notes: '' });

  // Departments and Classes
  const departments = ['CE', 'CO-A', 'CO-B', 'EE', 'EJ', 'IF'];
  const years = ['1st Year', '2nd Year', '3rd Year'];
  const absenceReasons = ['Medical', 'Leave', 'Family Emergency', 'Other', 'Not Specified'];

  // 1. Auth Setup
  useEffect(() => {
    if (!auth) {
      console.log('Firebase not available - running in offline mode');
      setUser({ uid: 'demo-user', isAnonymous: true });
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error('Auth failed:', error);
        setUser({ uid: 'demo-user', isAnonymous: true });
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Load Local Draft
  useEffect(() => {
    const saved = localStorage.getItem('attendanceData_Draft');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load local draft", e);
      }
    }
  }, []);

  // 3. Save Local Draft (Auto-save)
  useEffect(() => {
    localStorage.setItem('attendanceData_Draft', JSON.stringify(data));
  }, [data]);

  // 4. Fetch All Records (For Admin View)
  useEffect(() => {
    if (!user || !db) {
      const demoRecords = localStorage.getItem('demo-attendance-records');
      if (demoRecords) {
        try {
          setSubmittedRecords(JSON.parse(demoRecords));
        } catch (e) {
          console.error('Failed to load demo records:', e);
        }
      }
      return;
    }

    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'attendance_records'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      setSubmittedRecords(records);
    }, (error) => {
      console.error("Error fetching records:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Actions ---

  const handleSubmit = async () => {
    if (!user) {
      alert("Authenticating... please wait a moment and try again.");
      return;
    }
    if (!data.classInfo.className) {
      alert("Please select a class name before submitting.");
      return;
    }

    setSubmitStatus('submitting');
    try {
      if (!db) {
        // Demo mode
        const demoRecords = JSON.parse(localStorage.getItem('demo-attendance-records') || '[]');
        const docId = `${data.classInfo.className}_${data.date}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

        const newRecord = {
          id: docId,
          ...data,
          submittedAt: new Date().toISOString(),
          submittedBy: user.uid
        };

        const existingIndex = demoRecords.findIndex(r => r.id === docId);
        if (existingIndex >= 0) {
          demoRecords[existingIndex] = newRecord;
        } else {
          demoRecords.push(newRecord);
        }

        localStorage.setItem('demo-attendance-records', JSON.stringify(demoRecords));
        setSubmittedRecords(demoRecords);
      } else {
        // Firebase mode
        const docId = `${data.classInfo.className}_${data.date}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const recordRef = doc(db, 'artifacts', appId, 'public', 'data', 'attendance_records', docId);

        await setDoc(recordRef, {
          ...data,
          submittedAt: new Date().toISOString(),
          submittedBy: user.uid
        });
      }

      setSubmitStatus('success');
      setTimeout(() => setSubmitStatus('idle'), 3000);
      // Reset form
      setData({ ...initialData, date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error("Submission failed:", error);
      setSubmitStatus('error');
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `attendance_${data.classInfo.className}_${data.date}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const updateClassInfo = (field, value) => {
    setData(prev => ({
      ...prev,
      classInfo: { ...prev.classInfo, [field]: value }
    }));
  };

  const updateStudentField = (index, field, value) => {
    setData(prev => {
      const newStudents = [...prev.students];
      newStudents[index] = { ...newStudents[index], [field]: value };
      return { ...prev, students: newStudents };
    });
  };

  const addStudent = () => {
    setData(prev => ({
      ...prev,
      students: [...prev.students, { id: Date.now(), rollNo: '', name: '', status: 'present', remarks: '' }]
    }));
  };

  const removeStudent = (index) => {
    setData(prev => ({
      ...prev,
      students: prev.students.filter((_, i) => i !== index)
    }));
  };

  const sections = [
    { id: 'class', title: 'Class Information', icon: Users },
    { id: 'attendance', title: 'Mark Attendance', icon: Calendar },
    { id: 'calling', title: 'Calling Records', icon: Clock },
    { id: 'reports', title: 'Daily Reports & Analysis', icon: Download },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 0: // Class Info
        return (
          <div className="space-y-6">
            <SectionHeader title="Class Information" icon={Users} description="Enter class and CC details." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="Department" type="select" options={departments} value={data.classInfo.department} onChange={(v) => updateClassInfo('department', v)} />
              <InputField label="Year" type="select" options={years} value={data.classInfo.year} onChange={(v) => updateClassInfo('year', v)} />
              <InputField label="Class Coordinator" value={data.classInfo.ccName} onChange={(v) => updateClassInfo('ccName', v)} placeholder="e.g. Dr. Smith" />
              <InputField label="Total Strength" type="number" value={data.classInfo.totalStudents} onChange={(v) => updateClassInfo('totalStudents', v)} />
            </div>
          </div>
        );

      case 1: // Attendance
        return (
          <div className="space-y-6">
            <SectionHeader title="Mark Attendance" icon={Calendar} description="Record daily attendance for students." />
            <div className="mb-6">
              <InputField label="Attendance Date" type="date" value={data.date} onChange={(v) => setData({ ...data, date: v })} />
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-700">Student Attendance ({data.students.length})</h3>
              <button onClick={addStudent} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
                <Plus size={16} /> Add Student
              </button>
            </div>

            <div className="space-y-3">
              {data.students.map((student, idx) => (
                <div key={idx} className="bg-white p-4 border rounded-lg shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <InputField className="flex-1" label="Roll No" value={student.rollNo} onChange={(v) => updateStudentField(idx, 'rollNo', v)} placeholder="e.g. 01" />
                    <InputField className="flex-1" label="Name" value={student.name} onChange={(v) => updateStudentField(idx, 'name', v)} placeholder="Full Name" />
                    <InputField className="flex-1" label="Status" type="select" options={['Present', 'Absent', 'Leave', 'Medical']} value={student.status} onChange={(v) => updateStudentField(idx, 'status', v.toLowerCase())} />
                    <InputField className="flex-1" label="Remarks" value={student.remarks} onChange={(v) => updateStudentField(idx, 'remarks', v)} placeholder="Optional" />
                    <button onClick={() => removeStudent(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-8 bg-slate-900 text-white rounded-xl text-center shadow-xl">
              <h3 className="text-2xl font-bold mb-2">Ready to Submit</h3>
              <p className="text-slate-300 mb-6">Submit the attendance record for {data.classInfo.department || 'your class'} on {data.date}.</p>

              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button
                  onClick={handleSubmit}
                  disabled={submitStatus === 'submitting'}
                  className={`
                    ${submitStatus === 'success' ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}
                    text-white font-bold py-3 px-8 rounded-full shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100
                  `}
                >
                  {submitStatus === 'submitting' ? <RefreshCw className="animate-spin"/> : submitStatus === 'success' ? <CheckCircle /> : <UploadCloud size={24} />}
                  {submitStatus === 'submitting' ? 'Submitting...' : submitStatus === 'success' ? 'Submitted!' : 'Submit Attendance'}
                </button>

                <button onClick={handleExport} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center justify-center gap-2">
                  <Download size={20} /> Backup JSON
                </button>
              </div>
              {submitStatus === 'success' && <p className="mt-4 text-green-400 font-medium animate-pulse">Attendance submitted successfully!</p>}
              {submitStatus === 'error' && <p className="mt-4 text-red-400 font-medium">Error saving data. Please check connection.</p>}
            </div>
          </div>
        );

      case 2: // Calling Records
        return (
          <div className="space-y-6">
            <SectionHeader title="Calling Records" icon={Clock} description="Record student calls and reasons for absence." />
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-4">Add New Call Record</h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <InputField label="Roll No" value={newCall.studentRollNo} onChange={(v) => setNewCall({...newCall, studentRollNo: v})} placeholder="e.g. 01" />
                <InputField label="Date" type="date" value={newCall.date} onChange={(v) => setNewCall({...newCall, date: v})} />
                <InputField label="Contact" value={newCall.contact} onChange={(v) => setNewCall({...newCall, contact: v})} placeholder="Phone/Email" />
                <InputField label="Reason" type="select" options={absenceReasons} value={newCall.reason} onChange={(v) => setNewCall({...newCall, reason: v})} />
                <button onClick={() => {
                  if (newCall.studentRollNo && newCall.date && newCall.contact) {
                    setCallingRecords([...callingRecords, { ...newCall, id: Date.now() }]);
                    setNewCall({ studentRollNo: '', date: new Date().toISOString().split('T')[0], contact: '', reason: '', notes: '' });
                  }
                }} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold mt-6">
                  <Plus size={18} />
                </button>
              </div>
              <InputField label="Notes" type="textarea" value={newCall.notes} onChange={(v) => setNewCall({...newCall, notes: v})} placeholder="Additional details..." className="mt-4" />
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-lg text-slate-700">Call Records ({callingRecords.length})</h4>
              {callingRecords.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No call records yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {callingRecords.map((call, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded border">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold">Roll: {call.studentRollNo}</span> | <span className="text-sm text-slate-600">{call.date}</span>
                          <br />
                          <span className="text-sm"><strong>Contact:</strong> {call.contact}</span>
                          <br />
                          <span className="text-sm"><strong>Reason:</strong> <span className="bg-yellow-100 px-2 py-1 rounded text-yellow-800 font-semibold">{call.reason}</span></span>
                          {call.notes && <div className="text-sm text-slate-600 mt-2"><strong>Notes:</strong> {call.notes}</div>}
                        </div>
                        <button onClick={() => setCallingRecords(callingRecords.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-2 rounded">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 3: // Daily Reports & Analysis
        return (
          <div className="space-y-6">
            <SectionHeader title="Daily Reports & Analysis" icon={Download} description="View attendance reports and statistics." />
            
            {submittedRecords.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <UploadCloud size={48} className="mx-auto mb-4 opacity-30" />
                <p>No attendance records submitted yet. Submit attendance from the Mark Attendance tab.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 p-4 rounded border border-green-200">
                    <div className="text-xs text-green-600 font-semibold">Total Present</div>
                    <div className="text-3xl font-bold text-green-700">
                      {submittedRecords.reduce((sum, r) => sum + (r.students?.filter(s => s.status === 'present').length || 0), 0)}
                    </div>
                  </div>
                  <div className="bg-red-50 p-4 rounded border border-red-200">
                    <div className="text-xs text-red-600 font-semibold">Total Absent</div>
                    <div className="text-3xl font-bold text-red-700">
                      {submittedRecords.reduce((sum, r) => sum + (r.students?.filter(s => s.status === 'absent').length || 0), 0)}
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                    <div className="text-xs text-yellow-600 font-semibold">Leave</div>
                    <div className="text-3xl font-bold text-yellow-700">
                      {submittedRecords.reduce((sum, r) => sum + (r.students?.filter(s => s.status === 'leave').length || 0), 0)}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded border border-purple-200">
                    <div className="text-xs text-purple-600 font-semibold">Medical</div>
                    <div className="text-3xl font-bold text-purple-700">
                      {submittedRecords.reduce((sum, r) => sum + (r.students?.filter(s => s.status === 'medical').length || 0), 0)}
                    </div>
                  </div>
                </div>

                {/* Student-wise Report */}
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-bold text-lg text-slate-700 mb-4">Student-wise Attendance Record</h4>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {(() => {
                      const studentMap = {};
                      submittedRecords.forEach(record => {
                        record.students?.forEach(student => {
                          if (!studentMap[student.rollNo]) {
                            studentMap[student.rollNo] = { name: student.name, rollNo: student.rollNo, records: [] };
                          }
                          studentMap[student.rollNo].records.push({ date: record.date, status: student.status, remarks: student.remarks });
                        });
                      });
                      return Object.values(studentMap).map((student, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded border cursor-pointer hover:bg-slate-100" onClick={() => setSelectedStudent(selectedStudent?.rollNo === student.rollNo ? null : student)}>
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-bold">{student.rollNo}</span> - {student.name}
                              <div className="text-xs text-slate-500 mt-1">
                                Present: <span className="text-green-600 font-bold">{student.records.filter(r => r.status === 'present').length}</span> |
                                Absent: <span className="text-red-600 font-bold">{student.records.filter(r => r.status === 'absent').length}</span> |
                                Leave: <span className="text-yellow-600 font-bold">{student.records.filter(r => r.status === 'leave').length}</span> |
                                Medical: <span className="text-purple-600 font-bold">{student.records.filter(r => r.status === 'medical').length}</span>
                              </div>
                            </div>
                            <span className="text-sm text-slate-600">{student.records.length} records</span>
                          </div>
                          {selectedStudent?.rollNo === student.rollNo && (
                            <div className="mt-3 pt-3 border-t space-y-2">
                              {student.records.map((rec, i) => (
                                <div key={i} className="text-sm bg-white p-2 rounded">
                                  <span className="font-semibold">{rec.date}</span> - 
                                  <span className={`ml-2 font-bold ${
                                    rec.status === 'present' ? 'text-green-600' :
                                    rec.status === 'absent' ? 'text-red-600' :
                                    rec.status === 'leave' ? 'text-yellow-600' : 'text-purple-600'
                                  }`}>
                                    {rec.status.toUpperCase()}
                                  </span>
                                  {rec.remarks && <span className="text-slate-600 ml-2">• {rec.remarks}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Daily Report */}
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-bold text-lg text-slate-700 mb-4">Daily Attendance Summary</h4>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {submittedRecords.sort((a, b) => new Date(b.date) - new Date(a.date)).map((record, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded border">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="font-bold text-lg">{record.classInfo?.department || 'Unknown'} - {record.classInfo?.year || 'Unknown'}</span>
                            <span className="text-slate-600 ml-4">📅 {record.date}</span>
                            <span className="text-slate-600 ml-4">CC: {record.classInfo?.ccName || '-'}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div className="bg-green-100 p-2 rounded text-center">
                            <div className="text-xs text-green-700">Present</div>
                            <div className="font-bold text-green-700">{record.students?.filter(s => s.status === 'present').length || 0}</div>
                          </div>
                          <div className="bg-red-100 p-2 rounded text-center">
                            <div className="text-xs text-red-700">Absent</div>
                            <div className="font-bold text-red-700">{record.students?.filter(s => s.status === 'absent').length || 0}</div>
                          </div>
                          <div className="bg-yellow-100 p-2 rounded text-center">
                            <div className="text-xs text-yellow-700">Leave</div>
                            <div className="font-bold text-yellow-700">{record.students?.filter(s => s.status === 'leave').length || 0}</div>
                          </div>
                          <div className="bg-purple-100 p-2 rounded text-center">
                            <div className="text-xs text-purple-700">Medical</div>
                            <div className="font-bold text-purple-700">{record.students?.filter(s => s.status === 'medical').length || 0}</div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-600 mt-2">Total Strength: {record.classInfo?.totalStudents || 0}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default: return null;
    }
  };

  const renderAdminView = () => (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">📊 Admin Dashboard</h2>
          <p className="text-slate-500">Shri Siddheshwar Women's Polytechnic - Attendance Management System</p>
          <p className="text-sm text-slate-400 mt-1">© All Rights Reserved - Chatake Innoworks</p>
        </div>
        <button onClick={() => setIsAdminView(false)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-300 flex items-center gap-2">
          <ArrowLeft size={16}/> Back to Entry
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="md:col-span-1 bg-white rounded-xl shadow-sm border p-4 h-[700px] overflow-y-auto">
          <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-4">📋 Departments</h3>
          <div className="space-y-2">
            {departments.map((dept) => {
              const deptRecords = submittedRecords.filter(r => r.classInfo?.department === dept);
              return (
                <button
                  key={dept}
                  onClick={() => setSelectedRecord(selectedRecord?.classInfo?.department === dept ? null : deptRecords[0])}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${selectedRecord?.classInfo?.department === dept ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:bg-slate-50'}`}
                >
                  <div className="font-bold text-slate-800">{dept}</div>
                  <div className="text-xs text-slate-500 mt-1">📊 {deptRecords.length} records</div>
                  {deptRecords.length > 0 && (
                    <div className="text-xs mt-2 space-y-1">
                      <div>✓ Present: <span className="text-green-600 font-bold">{deptRecords.reduce((sum, r) => sum + (r.students?.filter(s => s.status === 'present').length || 0), 0)}</span></div>
                      <div>✗ Absent: <span className="text-red-600 font-bold">{deptRecords.reduce((sum, r) => sum + (r.students?.filter(s => s.status === 'absent').length || 0), 0)}</span></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border p-6 h-[700px] overflow-y-auto">
          {selectedRecord ? (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-2xl font-bold text-slate-800">{selectedRecord.classInfo?.department} - {selectedRecord.classInfo?.year}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                  <div><span className="text-slate-500">Date:</span> <span className="font-semibold">{selectedRecord.date}</span></div>
                  <div><span className="text-slate-500">CC:</span> <span className="font-semibold">{selectedRecord.classInfo?.ccName}</span></div>
                  <div><span className="text-slate-500">Total Strength:</span> <span className="font-semibold">{selectedRecord.classInfo?.totalStudents}</span></div>
                  <div><span className="text-slate-500">Recorded:</span> <span className="font-semibold">{selectedRecord.students?.length}</span></div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="bg-green-50 p-3 rounded border border-green-200 text-center">
                  <div className="text-xs text-green-600 font-semibold">Present</div>
                  <div className="font-bold text-2xl text-green-700">{selectedRecord.students?.filter(s => s.status === 'present').length || 0}</div>
                </div>
                <div className="bg-red-50 p-3 rounded border border-red-200 text-center">
                  <div className="text-xs text-red-600 font-semibold">Absent</div>
                  <div className="font-bold text-2xl text-red-700">{selectedRecord.students?.filter(s => s.status === 'absent').length || 0}</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-center">
                  <div className="text-xs text-yellow-600 font-semibold">Leave</div>
                  <div className="font-bold text-2xl text-yellow-700">{selectedRecord.students?.filter(s => s.status === 'leave').length || 0}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded border border-purple-200 text-center">
                  <div className="text-xs text-purple-600 font-semibold">Medical</div>
                  <div className="font-bold text-2xl text-purple-700">{selectedRecord.students?.filter(s => s.status === 'medical').length || 0}</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-3">📋 Student Details</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedRecord.students?.map((student, idx) => (
                    <div key={idx} className="text-sm p-3 bg-slate-50 rounded flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-blue-600">Roll: {student.rollNo}</span> - {student.name}
                        <br/>
                        <span className={`inline-block mt-1 font-bold px-2 py-1 rounded text-xs ${
                          student.status === 'present' ? 'bg-green-100 text-green-700' :
                          student.status === 'absent' ? 'bg-red-100 text-red-700' :
                          student.status === 'leave' ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {student.status?.toUpperCase()}
                        </span>
                        {student.remarks && <span className="text-slate-600 ml-2 text-xs">• {student.remarks}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Eye size={48} className="mb-4 opacity-30" />
              <p>Select a department to view attendance details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isAdminView) {
    return (
      <div className="flex flex-col h-screen bg-slate-100 font-sans overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {renderAdminView()}
        </div>
        <footer className="bg-white border-t border-slate-200 px-6 py-3 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Shri Siddheshwar Women's Polytechnic | Developed by <span className="font-semibold text-blue-600">Chatake Innoworks</span>
        </footer>
      </div>
    );
  }

  if (showAdminPrompt) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4">
          <h3 className="text-2xl font-bold text-slate-800 mb-4">Admin Dashboard</h3>
          <p className="text-slate-600 mb-6">Enter admin password to access records.</p>
          <input
            type="password"
            placeholder="Admin Password"
            value={adminPasswordInput}
            onChange={(e) => setAdminPasswordInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                if (adminPasswordInput === 'admin2025') {
                  setIsAdminView(true);
                  setShowAdminPrompt(false);
                } else {
                  alert('Incorrect password');
                  setAdminPasswordInput('');
                }
              }
            }}
            className="w-full px-4 py-2 border rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-3">
            <button onClick={() => {
              if (adminPasswordInput === 'admin2025') {
                setIsAdminView(true);
                setShowAdminPrompt(false);
              } else {
                alert('Incorrect password');
                setAdminPasswordInput('');
              }
            }} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
              Access
            </button>
            <button onClick={() => setShowAdminPrompt(false)} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-300">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {!db && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium border-b border-yellow-600">
          ⚠️ Demo Mode: Firebase not configured. Data will be saved locally only.
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {!isSidebarOpen && (
          <button onClick={() => setSidebarOpen(true)} className="fixed bottom-4 right-4 z-50 p-4 bg-blue-600 text-white rounded-full shadow-lg md:hidden">
            <Menu />
          </button>
        )}

        <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed md:relative md:translate-x-0 z-40 w-72 bg-white border-r border-slate-200 h-full transition-transform duration-300 flex flex-col shadow-xl md:shadow-none`}>
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h1 className="font-bold text-xl text-blue-900">📚 Attendance Tracker</h1>
              <p className="text-xs text-slate-400">Shri Siddheshwar Women's Polytechnic</p>
              <p className="text-xs text-slate-500">© Chatake Innoworks</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400"><X /></button>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            {sections.map((section, index) => {
              const Icon = section.icon;
              const isActive = activeTab === index;
              return (
                <button
                  key={section.id}
                  onClick={() => { setActiveTab(index); if(window.innerWidth < 768) setSidebarOpen(false); }}
                  className={`w-full text-left px-6 py-3 flex items-center gap-3 transition-colors ${isActive ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  <span className={`text-sm font-medium ${isActive ? 'font-bold' : ''}`}>{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
          <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
            <h2 className="font-semibold text-slate-700 hidden md:block">{sections[activeTab].title}</h2>
            <div className="flex gap-2 ml-auto items-center">
              <button onClick={() => { setAdminPasswordInput(''); setShowAdminPrompt(true); }} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 text-sm font-medium mr-4">
                <LayoutDashboard size={16} /> Admin
              </button>
              <button onClick={() => setActiveTab(Math.max(0, activeTab - 1))} disabled={activeTab === 0} className="p-2 rounded hover:bg-slate-100 disabled:opacity-30"><ChevronLeft /></button>
              <button onClick={() => setActiveTab(Math.min(sections.length - 1, activeTab + 1))} disabled={activeTab === sections.length - 1} className="p-2 rounded hover:bg-slate-100 disabled:opacity-30"><ChevronRight /></button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20">
            <div className="max-w-4xl mx-auto bg-white min-h-[500px] rounded-xl shadow-sm border p-6 md:p-10">
              {renderContent()}
            </div>
          </main>

          <footer className="bg-white border-t border-slate-200 px-6 py-3 text-center text-xs text-slate-500 shrink-0">
            Attendance Tracker • © {new Date().getFullYear()} All rights reserved
          </footer>
        </div>
      </div>

      <style>{`
        .btn-add { width: 100%; padding: 12px; border: 2px dashed #cbd5e1; color: #64748b; font-weight: 600; border-radius: 8px; display: flex; justify-content: center; align-items: center; gap: 8px; transition: all 0.2s; }
        .btn-add:hover { background: #f1f5f9; color: #3b82f6; border-color: #93c5fd; }
      `}</style>
    </div>
  );
}
