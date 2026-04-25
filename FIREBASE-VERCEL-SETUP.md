# Firebase Setup for OpenTrails - Complete Guide

## Status: CRITICAL - Authentication Not Working

The app is deployed to Vercel but **cannot authenticate users** because Firebase is not configured. The app is using demo keys that don't work.

## Quick Start (5 minutes)

### Step 1: Create Firebase Project

1. Go to **https://console.firebase.google.com**
2. Click **"Create project"** (or **"Create a project"**)
3. Project name: `opentrails`
4. Click **"Continue"**
5. **Disable** "Enable Google Analytics" (optional)
6. Click **"Create project"** → Wait for setup to complete (2 minutes)

### Step 2: Enable Email/Password Authentication

1. In Firebase console, go to **Build → Authentication**
2. Click **"Get started"**
3. Find **Email/Password** provider
4. Click on it and toggle **"Enable"**
5. Leave "Email link (passwordless sign-in)" disabled
6. Click **"Save"**

### Step 3: Get Firebase Config Keys

1. In Firebase console, go to **Project settings** (gear icon, top left)
2. Scroll down to **"Your apps"** section
3. Click **"Web"** app (or create one if not present)
4. You'll see your **Firebase config object** with these keys:
   ```
   apiKey
   authDomain
   projectId
   storageBucket
   messagingSenderId
   appId
   ```

5. **Copy these values** - you'll need them in the next step

### Step 4: Add Environment Variables to Vercel

1. Go to **https://vercel.com/dashboard**
2. Click on **`opentrails`** project
3. Go to **Settings → Environment Variables**
4. Add these variables (set them for **Production** only):

   ```
   REACT_APP_FIREBASE_API_KEY = <your apiKey>
   REACT_APP_FIREBASE_AUTH_DOMAIN = <your authDomain>
   REACT_APP_FIREBASE_PROJECT_ID = <your projectId>
   REACT_APP_FIREBASE_STORAGE_BUCKET = <your storageBucket>
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID = <your messagingSenderId>
   REACT_APP_FIREBASE_APP_ID = <your appId>
   ```

   **Important:** Change `EXPO_PUBLIC_` prefix to `REACT_APP_` (Expo exports these as public)

5. Click **"Save"** after each variable
6. Once all 6 are added, trigger a **redeploy**:
   - Go to **Deployments**
   - Find the latest deployment
   - Click the **"..."** menu → **"Redeploy"**

### Step 5: Test Authentication

1. Wait for Vercel deployment to complete (2-3 minutes)
2. Go to **https://opentrails.vercel.app**
3. Click **"Sign Up"**
4. Create a test account:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `Test123!@#`
5. Should redirect to trail list page ✅

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
- **Problem:** Vercel env vars not redeployed yet
- **Solution:** Wait 2-3 minutes for redeploy to finish, then hard refresh browser (Ctrl+Shift+R)

### "Failed to sign up" with no details
- **Problem:** Email already exists OR Firebase auth method not enabled
- **Solution:** Check Firebase console → Authentication → Providers (must show Email/Password as enabled)

### Environment variables not being picked up
- **Problem:** Wrong variable names used
- **Solution:** Check that variables start with `REACT_APP_` or `EXPO_PUBLIC_`
- **Note:** In Vercel, use `REACT_APP_FIREBASE_*` not `EXPO_PUBLIC_FIREBASE_*`

## After Setup Works

Once authentication is working:

1. **Remove misleading text** - Update `LoginScreen.tsx` footer text:
   ```
   OLD: "Continue to explore trails while logged out"
   NEW: "Create an account to discover and save your favorite trails"
   ```

2. **Consider guest mode** (optional future feature):
   - Add "Browse as Guest" button on login
   - Allow read-only trail browsing without signup

3. **Enable additional providers** (optional):
   - Google Sign-In for faster signup
   - Phone number auth for activity sharing

## Security Notes

- ✅ **Public keys are safe** - Firebase public keys are meant to be exposed in frontend code
- ✅ **Use Firebase security rules** - Restrict database access in Firestore/Realtime DB
- ✅ **Environment variables in Vercel** - Protects against accidental commits

## Reference: Current Firebase Config

**File:** `app/src/config/firebase.ts`

The app expects these environment variables:
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

The code falls back to demo keys if env vars are missing, which silently breaks auth.

---

**Time to complete:** ~5 minutes
**Difficulty:** Easy
**Impact:** Critical - unblocks user authentication
