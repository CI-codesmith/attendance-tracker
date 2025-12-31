# Deployment Guide

This guide covers deploying the Attendance Tracker to Netlify and GitHub.

## Option 1: Deploy to Netlify (Recommended)

### Step 1: Push to GitHub

```bash
cd /Users/akashchatake/Downloads/Work/College/📁_ORGANIZED_COLLEGE/Administration/attendance-tracker

# Initialize remote if not done
git remote add origin https://github.com/yourusername/attendance-tracker.git

# Push code
git branch -M main
git push -u origin main
```

### Step 2: Connect to Netlify

1. Go to https://app.netlify.com/
2. Click "New site from Git"
3. Select GitHub and choose your repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
5. Click "Deploy site"
6. Your app will be live in 1-3 minutes!

### Step 3: Configure Environment Variables (Optional - Firebase)

In Netlify:
1. Go to Site settings → Environment
2. Add variables:
   ```
   REACT_APP_FIREBASE_API_KEY=your_key
   REACT_APP_FIREBASE_PROJECT_ID=your_project
   etc.
   ```
3. Redeploy the site

## Option 2: Manual Netlify Deploy

```bash
# Build the app
npm run build

# Then drag the 'build' folder to https://app.netlify.com/drop
```

## Option 3: Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow prompts to complete deployment

## Firebase Configuration

To enable cloud storage with Firebase:

1. Create Firebase project: https://firebase.google.com
2. Get your config from Firebase Console
3. Update `public/config.js`:
```javascript
window.__firebase_config = JSON.stringify({
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
});
```

4. Create Firestore collections:
   - `artifacts/` → `[app_id]/` → `public/` → `data/` → `attendance_records/`

5. Update Firestore security rules:
```
match /artifacts/{appId}/public/data/attendance_records/{document=**} {
  allow read, write: if true;  // For demo/testing
}
```

## Local Development

```bash
npm start
```

Opens at http://localhost:3000

## Troubleshooting Deployment

**Build fails**
- Ensure all dependencies are installed: `npm install`
- Check Node version: `node --version` (should be 14+)

**Firebase not connecting**
- Verify config.js has correct values
- Check Firestore rules allow access
- Check browser console for errors

**Records not saving**
- In demo mode: check browser localStorage (DevTools → Application)
- With Firebase: check Firestore console for data

## Custom Domain

To add your own domain in Netlify:
1. Go to Site settings → Domain management
2. Add your custom domain
3. Follow DNS setup instructions from your domain provider

## Continuous Deployment

Once connected to GitHub:
- Push code to `main` branch
- Netlify automatically builds and deploys
- Check deployment status in Netlify dashboard

## Rollback Previous Deployment

In Netlify:
1. Go to Deploys
2. Click on previous successful deployment
3. Click "Restore"

---

**Deployment Status**: Ready for production ✅
