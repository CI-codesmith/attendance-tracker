# 📚 Attendance Tracker - Shri Siddheshwar Women's Polytechnic

A comprehensive web-based attendance and absence tracking system with daily reports and calling records management for educational institutions.

**Developed by**: Chatake Innoworks  
**Institution**: Shri Siddheshwar Women's Polytechnic

## 🎯 Key Features

### 📊 Attendance Management
- ✅ Quick daily attendance marking (Present, Absent, Leave, Medical)
- ✅ Support for all 6 departments: CE, CO-A, CO-B, EE, EJ, IF
- ✅ Support for all years: 1st, 2nd, 3rd Year
- ✅ Class Coordinator (CC) assignment
- ✅ Total strength tracking per class

### 📋 Calling Records
- ✅ Record parent/student calls with dates and contact info
- ✅ Track absence reasons (Medical, Leave, Family Emergency, Other)
- ✅ Add detailed notes for each call
- ✅ Organized by student roll number

### 📈 Daily Reports & Analysis
- ✅ **Daily Summary**: Present, Absent, Leave, Medical counts per class per day
- ✅ **Student-wise History**: Complete attendance record for each student
- ✅ **Department View**: Department-wise statistics and records
- ✅ **Attendance Percentage**: Calculate student attendance rates
- ✅ **Department Analytics**: Overview of all 6 departments

### 🔐 Admin Dashboard
- ✅ Secure access (password protected: admin2025)
- ✅ View all departments and their records
- ✅ Filter by department and class
- ✅ Export data to JSON

### 💾 Data Management
- ✅ Auto-save to browser localStorage (works offline)
- ✅ Firebase integration ready (optional cloud backup)
- ✅ Export attendance records as JSON
- ✅ Calling records are persistent

### 📱 User-Friendly Design
- ✅ Responsive design (works on desktop, tablet, mobile)
- ✅ Intuitive navigation between tabs
- ✅ Color-coded status indicators
- ✅ Easy bulk student addition/removal

## 🏫 Supported Structure

**Departments (6)**:
- CE - Civil Engineering
- CO-A - Computer Engineering A
- CO-B - Computer Engineering B
- EE - Electrical Engineering
- EJ - Electronics Engineering
- IF - Information Technology

**Years (3)**:
- 1st Year
- 2nd Year
- 3rd Year

**Total Combinations**: 18 classes (6 departments × 3 years)

## 🚀 Quick Start

### Installation

```bash
cd /Users/akashchatake/Downloads/Work/College/📁_ORGANIZED_COLLEGE/Administration/attendance-tracker
npm install
npm start
```

The app opens at `http://localhost:3000` in demo mode (no Firebase needed).

## 📖 Usage Guide

### For Class Coordinators

**Tab 1: Class Information**
1. Select your Department (CE, CO-A, CO-B, EE, EJ, IF)
2. Select Year (1st, 2nd, or 3rd Year)
3. Enter Class Coordinator name
4. Enter Total Strength (total students in class)

**Tab 2: Mark Attendance**
1. Choose attendance date
2. Add students (Roll No, Name)
3. Mark attendance status for each student
4. Add remarks if needed (optional)
5. Click "Submit Attendance"
6. Record automatically saves to local storage

**Tab 3: Calling Records**
1. Enter student Roll No
2. Enter contact date
3. Add contact method (phone/email)
4. Select reason for absence
5. Add optional notes
6. Click "+" to save the call record
7. All calls are tracked by student

**Tab 4: Daily Reports & Analysis**
1. View overall attendance statistics
2. Click on a student to see their full attendance history
3. View daily summaries by date
4. See department-wise statistics in admin dashboard

### For Admins/Principals

1. Click "Admin" button
2. Enter password: **admin2025**
3. Select department from left panel
4. View attendance statistics:
   - Daily present/absent/leave/medical counts
   - Student-wise details
   - Class information
   - CC names

## 🔧 Technical Stack

- **Frontend**: React 18 with Hooks
- **Styling**: Tailwind CSS (CDN)
- **Icons**: Lucide Icons
- **Storage**: localStorage (Demo) + Firebase (Optional)
- **Hosting**: Netlify (recommended)
- **Build Tool**: Create React App

## 📦 Project Structure

```
attendance-tracker/
├── public/
│   ├── index.html         # Main HTML with Tailwind CDN
│   ├── config.js          # Firebase configuration
│   └── favicon.ico
├── src/
│   ├── App.js             # Complete application (1000+ lines)
│   ├── index.js           # React entry point
│   └── index.css          # Base styles
├── build/                 # Production build
├── package.json           # Dependencies
├── README.md              # This file
├── DEPLOYMENT.md          # Deployment instructions
└── FIREBASE_SETUP.md      # Firebase configuration
```

## 🌐 Deployment

### Option 1: Netlify (Free & Easiest)

```bash
# Push to GitHub
git push

# Netlify auto-deploys (if connected)
```

### Option 2: Manual Netlify Deploy

```bash
npm run build
# Drag build/ folder to netlify.com/drop
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 🔐 Security & Credentials

**Admin Password**: `admin2025`
- Located in App.js (search for `admin2025`)
- **Important**: Change before production deployment!

**Demo Mode**:
- Works without Firebase
- Data saved to browser localStorage
- Perfect for testing

**Firebase Mode** (Optional):
- Enable cloud backup
- See [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

## 📊 Sample Data

App includes 3 sample students per attendance entry:
- Easy to remove and add your own students
- Roll No, Name, Status, Remarks fields
- Bulk import coming soon

## 🎓 Reports Available

1. **Daily Summary**
   - Date, Department, Year
   - Present/Absent/Leave/Medical counts
   - Total Strength vs Present

2. **Student-wise History**
   - Individual student attendance record
   - All dates with status
   - Absence remarks
   - Call history linked

3. **Department Statistics**
   - Per-department attendance trends
   - Year-wise breakdown
   - Overall present/absent rates

4. **Calling Records**
   - Date of call
   - Contact information
   - Reason recorded
   - Notes field for follow-up

## 🔄 Data Flow

```
Class Info → Mark Attendance → Submit → Stored Locally
                          ↓
                    Call Records
                          ↓
                    Daily Reports & Analysis
                          ↓
                    Admin Dashboard
```

## 💡 Tips & Tricks

- **Auto-save**: Data saves automatically to localStorage
- **Offline**: App works without internet (uses localStorage)
- **Export**: Download attendance as JSON anytime
- **Export**: Calling records also exportable
- **Multiple Classes**: Submit multiple class attendance daily
- **Quick Access**: Calling records synced with student data

## 🐛 Troubleshooting

**Records not saving?**
- Check browser console (F12) for errors
- Ensure localStorage is enabled
- Try clearing cache and reloading

**Admin dashboard empty?**
- Data must be submitted first
- Check localStorage in DevTools → Application

**Can't find a student?**
- Search by Roll No (case-sensitive)
- Check daily reports tab
- Verify student was added before marking

## 🌍 Browser Support

- Chrome (latest) ✅
- Firefox (latest) ✅
- Safari (latest) ✅
- Edge (latest) ✅
- Mobile browsers ✅

## 📝 Changelog

### v2.0 (Current)
- ✅ Added comprehensive daily reports
- ✅ Added calling records management
- ✅ Added student-wise attendance history
- ✅ Added department-wise analytics
- ✅ Customized for 6 departments
- ✅ Support for 3 years per department
- ✅ Improved admin dashboard

### v1.0 (Initial)
- Basic attendance marking
- Admin dashboard
- Simple reports

## 🤝 Support & Contact

**Developed by**: Chatake Innoworks  
**All Rights Reserved** © 2025

For support or customization:
- Report issues in the app
- Check DEPLOYMENT.md for deployment help
- See FIREBASE_SETUP.md for cloud integration

## 📄 License

© 2025 Shri Siddheshwar Women's Polytechnic & Chatake Innoworks  
All Rights Reserved

---

**Ready to use!** Start with `npm start` and begin tracking attendance.


Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
