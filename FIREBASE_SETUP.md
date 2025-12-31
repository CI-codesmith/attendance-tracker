# Firebase Setup Guide

Complete guide for setting up Firebase with the Attendance Tracker app.

## Prerequisites

- Google account
- Attendance Tracker app cloned locally

## Step 1: Create Firebase Project

1. Go to https://firebase.google.com
2. Click "Get Started"
3. Click "Create a project"
4. Enter project name: `attendance-tracker`
5. Accept terms and click "Create project"
6. Wait for setup to complete

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get Started"
3. Click on "Anonymous" authentication method
4. Toggle "Enable" and click "Save"

## Step 3: Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose location (nearest to your region)
4. Select "Start in test mode" (for development)
5. Click "Create"

## Step 4: Set Up Collection Structure

1. In Firestore, click "Start collection"
2. Create collection named: `artifacts`
3. Add document:
   - Document ID: `default-app-id` (or your custom app ID)
   - Skip adding fields for now, click "Save"

4. Inside that document, create subcollection:
   - Collection ID: `public`
   
5. In `public`, create another document:
   - Document ID: `data`
   
6. In `data`, create final collection:
   - Collection ID: `attendance_records`

Your structure should look like:
```
artifacts/
  ├─ default-app-id/
  │  └─ public/
  │     └─ data/
  │        └─ attendance_records/
```

## Step 5: Get Firebase Configuration

1. In Firebase Console, click **Project Settings** (gear icon)
2. Go to **General** tab
3. Under "Your apps", click **Web** (</>)
4. Register the app
5. Copy the configuration object

Example:
```javascript
{
  apiKey: "AIzaSyD-xyzABC123...",
  authDomain: "attendance-tracker-12345.firebaseapp.com",
  projectId: "attendance-tracker-12345",
  storageBucket: "attendance-tracker-12345.appspot.com",
  messagingSenderId: "123456789123",
  appId: "1:123456789123:web:abcdef123456789abc"
}
```

## Step 6: Update App Configuration

1. Open `public/config.js` in your project:

```javascript
window.__firebase_config = JSON.stringify({
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
});

window.__app_id = "default-app-id";
window.__initial_auth_token = undefined;
```

2. Save the file

## Step 7: Set Firestore Security Rules

1. In Firebase Console, go to **Firestore** → **Rules**
2. Replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read/write for development
    match /artifacts/{appId}/public/data/attendance_records/{document=**} {
      allow read, write: if true;
    }
    
    // For production, use:
    // match /artifacts/{appId}/public/data/attendance_records/{document=**} {
    //   allow read: if true;
    //   allow write: if request.auth != null;
    // }
  }
}
```

3. Click "Publish"

⚠️ **Note**: Test mode allows anyone to read/write. Before production, implement proper authentication rules.

## Step 8: Test the Connection

1. Start the dev server:
```bash
npm start
```

2. Fill in class information
3. Add some students
4. Click "Submit Attendance"
5. Check Firebase Console → Firestore → attendance_records
6. You should see your submitted record there!

## Step 9: Deploy with Firebase Config

When deploying to Netlify:

1. Add environment variable in Netlify:
   - Go to Site Settings → Build & Deploy → Environment
   - Add variables for each Firebase config value:
     ```
     REACT_APP_FIREBASE_API_KEY
     REACT_APP_FIREBASE_PROJECT_ID
     etc.
     ```

2. Or store `config.js` in environment variables and generate at build time

## Troubleshooting

### No data appears in Firestore
- Check browser console for errors
- Verify config.js has correct values
- Ensure Firestore rules allow write access
- Check if authentication is working (should see "demo-user" in console)

### "Permission denied" errors
- Go to Firestore Rules
- Ensure rules allow read/write for your collection path
- Check that database location matches your region

### Authentication issues
- Go to Firebase → Authentication
- Verify "Anonymous" is enabled
- Check if auth is initializing properly (console logs)

### App still in demo mode
- Check that config.js is loaded (look in public/index.html)
- Verify no errors in browser console
- Try clearing browser cache and reloading

## Firebase Project URL

After setup, your project will be at:
```
https://console.firebase.google.com/project/your-project-id
```

## Upgrading from Demo Mode to Firebase

1. Create Firebase project (steps 1-7 above)
2. Update `public/config.js`
3. Restart dev server: `npm start`
4. App automatically switches from localStorage to Firebase

Existing localStorage data won't transfer to Firebase - that's normal.

## Production Checklist

- [ ] Firebase project created
- [ ] Authentication enabled (Anonymous)
- [ ] Firestore database created
- [ ] Collection structure set up
- [ ] Security rules configured
- [ ] Config values added to app
- [ ] Tested with dev server
- [ ] Deployed to Netlify with Firebase config
- [ ] Verified data saves to Firestore

---

**Firebase is now ready for your attendance tracker!** 🎉
