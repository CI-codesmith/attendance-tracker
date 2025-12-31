<!-- Use this file to provide workspace-specific custom instructions to Copilot -->

## Attendance Tracker Application

This is a React-based attendance tracking system with Firebase integration. The app allows class coordinators to:
- Mark daily attendance for students
- Record absence types (leave, medical, etc.)
- View admin dashboard with attendance summaries
- Export attendance records to JSON

### Features
- ✅ Class/semester selection (SE, TE, BE with Comp/IT/Extc specializations)
- ✅ Daily attendance marking (Present, Absent, Leave, Medical)
- ✅ Admin dashboard with attendance statistics
- ✅ Automatic data backup to Firebase
- ✅ Local storage for draft data
- ✅ Responsive design with Tailwind CSS
- ✅ Role-based access (admin password: admin2025)

### Tech Stack
- React with Hooks
- Firebase (Auth + Firestore)
- Tailwind CSS
- Lucide Icons
- Netlify Deployment

### Local Development
```bash
npm start  # Start dev server on port 3000
npm run build  # Create production build
```

### Deployment
- Push to GitHub: Changes automatically deploy to Netlify
- Admin Password: `admin2025`
