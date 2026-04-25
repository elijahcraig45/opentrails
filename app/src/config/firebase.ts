import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence,
  browserSessionPersistence,
  Auth
} from 'firebase/auth';

// Firebase configuration
// NOTE: These are public keys and safe to expose in frontend code
// In production, use environment variables from EAS secrets
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoKeyForLocalDev",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "opentrails-local.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "opentrails-local",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "opentrails-local.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abc123",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth for web
const auth: Auth = getAuth(app);

// Web uses browser session persistence
setPersistence(auth, browserSessionPersistence).catch(err => {
  console.warn('Failed to set auth persistence:', err);
});

export { auth, app };

/**
 * Firebase Setup Instructions for Production
 * 
 * 1. Create Firebase Project:
 *    - Go to firebase.google.com
 *    - Create new project "opentrails"
 *    - Enable Authentication (Email/Password, Google)
 * 
 * 2. Get Config Keys:
 *    - Project Settings → Service Accounts
 *    - Copy values to EAS secrets or .env.local
 * 
 * 3. Update Environment Variables:
 *    EXPO_PUBLIC_FIREBASE_API_KEY=xxx
 *    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
 *    EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx
 *    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
 *    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
 *    EXPO_PUBLIC_FIREBASE_APP_ID=xxx
 * 
 * 4. Enable Auth Methods:
 *    - Email/Password authentication
 *    - Google Sign-In (for OAuth)
 *    - Optional: Phone number auth for activity sharing
 * 
 * 5. Setup Firestore Database (optional):
 *    - For user profiles beyond auth
 *    - For persisting activity data
 *    - For friend sharing and notifications
 */
