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
  User,
  Clock,
  LogOut,
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
    className: '',
    ccName: '',
    totalStudents: '',
    semester: ''
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

  // Classes list
  const classList = ['SE - Comp', 'SE - IT', 'SE - Extc', 'TE - Comp', 'TE - IT', 'TE - Extc', 'BE - Comp', 'BE - IT', 'BE - Extc'];
  const semesterList = ['Sem I', 'Sem II', 'Sem III', 'Sem IV', 'Sem V', 'Sem VI', 'Sem VII', 'Sem VIII'];

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
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 0: // Class Info
        return (
          <div className="space-y-6">
            <SectionHeader title="Class Information" icon={Users} description="Enter class and CC details." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="Class Name" type="select" options={classList} value={data.classInfo.className} onChange={(v) => updateClassInfo('className', v)} />
              <InputField label="Class Coordinator" value={data.classInfo.ccName} onChange={(v) => updateClassInfo('ccName', v)} placeholder="e.g. Dr. Smith" />
              <InputField label="Total Students" type="number" value={data.classInfo.totalStudents} onChange={(v) => updateClassInfo('totalStudents', v)} />
              <InputField label="Semester" type="select" options={semesterList} value={data.classInfo.semester} onChange={(v) => updateClassInfo('semester', v)} />
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
              <p className="text-slate-300 mb-6">Submit the attendance record for {data.classInfo.className || 'your class'} on {data.date}.</p>

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

      default: return null;
    }
  };

  const renderAdminView = () => (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Admin Dashboard</h2>
          <p className="text-slate-500">View and manage submitted attendance records.</p>
        </div>
        <button onClick={() => setIsAdminView(false)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-300 flex items-center gap-2">
          <ArrowLeft size={16}/> Back to Entry
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white rounded-xl shadow-sm border p-4 h-[600px] overflow-y-auto">
          <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-4">Submitted Records</h3>
          {submittedRecords.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <UploadCloud size={40} className="mx-auto mb-2 opacity-50"/>
              <p>No records yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {submittedRecords.map((record) => (
                <button
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${selectedRecord?.id === record.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}
                >
                  <div className="font-bold text-slate-800">{record.classInfo?.className || 'Unknown Class'}</div>
                  <div className="text-xs text-slate-500 mt-1">📅 {record.date}</div>
                  <div className="text-xs text-slate-400 mt-1">CC: {record.classInfo?.ccName || '-'}</div>
                  <div className="text-xs text-slate-400">📊 {record.students?.length || 0} students</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border p-6 h-[600px] overflow-y-auto">
          {selectedRecord ? (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-2xl font-bold text-slate-800">{selectedRecord.classInfo?.className}</h2>
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div><span className="text-slate-500">Date:</span> <span className="font-semibold">{selectedRecord.date}</span></div>
                  <div><span className="text-slate-500">CC:</span> <span className="font-semibold">{selectedRecord.classInfo?.ccName}</span></div>
                  <div><span className="text-slate-500">Total Students:</span> <span className="font-semibold">{selectedRecord.classInfo?.totalStudents}</span></div>
                  <div><span className="text-slate-500">Semester:</span> <span className="font-semibold">{selectedRecord.classInfo?.semester}</span></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <div className="text-xs text-green-600">Present</div>
                  <div className="font-bold text-xl text-green-700">{selectedRecord.students?.filter(s => s.status === 'present').length || 0}</div>
                </div>
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <div className="text-xs text-red-600">Absent</div>
                  <div className="font-bold text-xl text-red-700">{selectedRecord.students?.filter(s => s.status === 'absent').length || 0}</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <div className="text-xs text-yellow-600">Leave/Medical</div>
                  <div className="font-bold text-xl text-yellow-700">{selectedRecord.students?.filter(s => ['leave', 'medical'].includes(s.status)).length || 0}</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-2">Student Details</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedRecord.students?.map((student, idx) => (
                    <div key={idx} className="text-sm p-2 bg-slate-50 rounded flex justify-between items-start">
                      <div>
                        <span className="font-semibold">{student.rollNo}</span> - {student.name}
                        <br/>
                        <span className={`text-xs font-semibold ${
                          student.status === 'present' ? 'text-green-600' :
                          student.status === 'absent' ? 'text-red-600' : 'text-yellow-600'
                        }`}>{student.status?.toUpperCase()}</span>
                        {student.remarks && <span className="text-xs text-slate-500"> • {student.remarks}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Eye size={48} className="mb-4 opacity-30" />
              <p>Select a record to view details.</p>
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
          Attendance Tracker • © {new Date().getFullYear()} All rights reserved
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
              <h1 className="font-bold text-xl text-blue-900">Attendance Tracker</h1>
              <p className="text-xs text-slate-400">2024-25</p>
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
