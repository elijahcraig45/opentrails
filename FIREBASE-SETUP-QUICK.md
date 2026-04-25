# 🔥 OpenTrails Firebase Setup - Manual Steps (5 minutes)

## Current Status

- ✅ App deployed to Vercel: https://opentrails.vercel.app
- ✅ API running on Cloud Run with 2,676 trails
- ❌ Firebase authentication **NOT CONFIGURED** (blocking feature)
- ❌ Users cannot sign up or log in

---

## Setup Steps (Copy & Paste URLs)

### Step 1: Create Firebase Web App (2 minutes)

**Go to:** https://console.firebase.google.com

1. Click **"Create project"**
2. Project name: `opentrails` 
3. Click **Continue** → **Disable Google Analytics** → **Create project**
4. Wait for setup (1-2 minutes)
5. You'll see the Firebase dashboard

### Step 2: Enable Authentication (1 minute)

**In Firebase Console:**

1. Left sidebar → **Build** → **Authentication**
2. Click **"Get started"**
3. Find **Email/Password** option
4. Click on it and toggle **"Enable"**
5. Click **"Save"**

### Step 3: Create Web App and Get Config (1 minute)

**In Firebase Console:**

1. Click **Project Settings** (gear icon, top left)
2. Find section **"Your apps"** (scroll down)
3. If no web app exists, click **Web icon** `</>` to create one
4. App name: `opentrails-web`
5. Click **Register app**
6. **IMPORTANT: Copy the entire config object** that appears:

```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "opentrails-xxx.firebaseapp.com",
  projectId: "opentrails-xxx",
  storageBucket: "opentrails-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
}
```

### Step 4: Add to Vercel (1 minute)

**Go to:** https://vercel.com/dashboard

1. Click **opentrails** project
2. Go to **Settings → Environment Variables**
3. Add 6 environment variables (set them for **Production** environment):

```
REACT_APP_FIREBASE_API_KEY = <your apiKey from Step 3>
REACT_APP_FIREBASE_AUTH_DOMAIN = <your authDomain>
REACT_APP_FIREBASE_PROJECT_ID = <your projectId>
REACT_APP_FIREBASE_STORAGE_BUCKET = <your storageBucket>
REACT_APP_FIREBASE_MESSAGING_SENDER_ID = <your messagingSenderId>
REACT_APP_FIREBASE_APP_ID = <your appId>
```

**Important:** Use `REACT_APP_` prefix, NOT `EXPO_PUBLIC_`

4. After adding all 6, click **Save** on the last one

### Step 5: Redeploy (2 minutes)

**In Vercel:**

1. Go to **Deployments** tab
2. Find the latest deployment (top of list)
3. Click the **`...`** menu → **"Redeploy"**
4. Wait for the new deployment to complete (green checkmark)

### Step 6: Test It! (30 seconds)

1. Go to **https://opentrails.vercel.app** (refresh page, Ctrl+Shift+R)
2. Should see updated login message
3. Click **"Sign Up"**
4. Create test account:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `Test123!@#`
5. Should see trail list! ✅

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Firebase: Error (auth/invalid-api-key)" | Wait 2-3 min for redeploy, hard refresh (Ctrl+Shift+R) |
| "Failed to sign up" | Check Firebase → Authentication → Email/Password is **enabled** |
| Environment vars not working | Verify variable names start with `REACT_APP_` |
| Still stuck on login screen | Clear browser cookies, try incognito window |

---

## Security Checklist

- ✅ Firebase public keys are safe to expose in frontend code
- ✅ Enable Firebase security rules to restrict database access
- ✅ Vercel env vars protect against accidental commits
- ✅ Email/Password auth uses Firebase's secure hashing

---

**Expected time:** ~5 minutes
**Difficulty:** Easy (just copy-paste)
**Impact:** Unblocks all user features

