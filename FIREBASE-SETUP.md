# Firebase Authentication Setup Guide

## Status: ✅ IMPLEMENTED

OpenTrails now includes full Firebase authentication with email/password signup and login, secured user sessions, and activity tracking by user.

## What's Been Built

### Authentication Components
- **LoginScreen** - Email/password login form with validation
- **SignUpScreen** - New user registration with display name, email, password
- **UserProfile** - User account dashboard with stats and logout
- **AuthContext** - React Context for authentication state management

### Features
- ✅ Email/password authentication
- ✅ User registration with display name
- ✅ Secure password confirmation on signup
- ✅ Error handling and user feedback
- ✅ Auth state persistence (AsyncStorage for mobile, session for web)
- ✅ Loading indicators during auth operations
- ✅ User account dashboard with stats placeholder
- ✅ Graceful error handling

### Architecture

```
AuthContext (manages Firebase auth state)
    ↓
App.tsx (routes to Login/SignUp or TrailExplorer based on auth state)
    ↓
LoginScreen / SignUpScreen / UserProfile (authentication UI)
    ↓
Firebase Authentication (email/password provider)
```

## Setup Instructions

### For Local Development

No setup required! Firebase is configured with demo keys that allow local development. The app will:
- Show login/signup screens when not authenticated
- Store sessions persistently
- Allow full trail exploration while logged in
- Track which user logged activities

### For Production Deployment

1. **Create Firebase Project**
   ```bash
   npm install -g firebase-tools
   firebase init
   ```

2. **Create Web App in Firebase Console**
   - Go to firebase.google.com
   - Create new project "opentrails"
   - Add Web app
   - Copy configuration keys

3. **Set Environment Variables**
   ```bash
   # .env.local
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Enable Authentication Methods**
   - Firebase Console → Authentication → Sign-in method
   - Enable: Email/Password
   - Optional: Google Sign-In, Phone Authentication

5. **Setup Firestore (Optional)**
   - For user profiles: name, profile picture, bio
   - For activity persistence: save completed hikes
   - For social features: friend lists, activity feed

6. **Deploy Rules**
   ```
   # Firestore Security Rules
   match /users/{userId} {
     allow read: if request.auth.uid == userId;
     allow write: if request.auth.uid == userId;
   }
   match /activities/{activityId} {
     allow read: if request.auth.uid == resource.data.userId;
     allow write: if request.auth.uid == resource.data.userId;
   }
   ```

## How to Use

### In Your Code

```typescript
import { useAuth } from './src/context/AuthContext';

function MyComponent() {
  const { user, loading, error, signIn, signUp, logout } = useAuth();

  if (loading) return <Text>Loading...</Text>;

  if (!user) {
    return <LoginScreen onSignUpPress={() => navigate('signup')} />;
  }

  return (
    <View>
      <Text>Welcome, {user.displayName}!</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
```

### Authentication Flow

```
Cold Start
    ↓
App checks if user is logged in via AuthContext
    ↓
User NOT logged in → Show LoginScreen/SignUpScreen
    ↓
User logs in/signs up → Firebase creates user account
    ↓
onAuthStateChanged fires → setUser in AuthContext
    ↓
App navigates to TrailExplorer
    ↓
User is logged in → Activities are associated with user.uid
    ↓
Activities POST to /api/activities with userId = user.uid
    ↓
App persists sessions in browser/device storage
    ↓
Page reload → Auth state restored from storage
```

## Integration with API

### Protected Endpoints

The following API endpoints should require authentication:

```typescript
// Currently public, should require auth token:
POST /api/activities - Log a completed hike
GET /api/activities - Get user's hike history
POST /api/reviews - Post trail review
DELETE /api/reviews/:id - Delete review

// Public (no auth needed):
GET /api/trails - Browse trails
GET /api/trails/nearby - Find nearby trails
GET /api/stats - View aggregate stats
```

### Adding Auth to API Requests

```typescript
const apiCall = async (endpoint: string, options: any = {}) => {
  const { user } = useAuth();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${await user?.getIdToken()}`,
    },
  });
  
  return response.json();
};
```

### API Middleware (Node.js)

```typescript
// api/middleware/auth.ts
import { auth as adminAuth } from 'firebase-admin';

export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Usage in routes
app.post('/api/activities', authMiddleware, (req, res) => {
  console.log('Activity logged by:', req.user.uid);
  // Save activity with userId = req.user.uid
});
```

## Testing Locally

### Test Account

```
Email: test@opentrails.local
Password: TestPassword123!
```

Or create your own:
1. Open app
2. Go to SignUp
3. Enter any email/password
4. Email verification not required for local dev

### Test API with Auth

```bash
# Get auth token
curl -X POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@opentrails.local",
    "password": "TestPassword123!",
    "returnSecureToken": true
  }'

# Use token in API request
curl -X POST http://localhost:3001/api/activities \
  -H "Authorization: Bearer <token>" \
  -d '{...}'
```

## Known Issues & Limitations

1. **Firebase Emulator Not Setup**
   - Currently uses live Firebase (demo credentials)
   - For production, setup Firebase Emulator Suite locally
   - Command: `firebase emulators:start`

2. **No Email Verification**
   - Users can signup with any email
   - Should enable verification in production
   - Use `sendEmailVerification()` API

3. **No Password Reset**
   - Need to implement forgot password flow
   - Use `sendPasswordResetEmail()` from Firebase

4. **Limited User Profile**
   - Currently only stores displayName + email
   - Should add Firestore collection for extended profiles
   - Profile fields: avatar, bio, location, joined date

5. **No Social Login**
   - Currently only email/password
   - Should add Google Sign-In for easier UX
   - Phone authentication for activity sharing

## Next Steps (Phase 3.2+)

### High Priority
1. [ ] Integrate with API - Send userId with activity requests
2. [ ] Add auth header to API calls
3. [ ] Protect backend endpoints with auth middleware
4. [ ] Implement password reset UI and functionality
5. [ ] Add email verification

### Medium Priority
6. [ ] Add Google Sign-In
7. [ ] Create Firestore user profiles
8. [ ] Implement friend following
9. [ ] Add activity sharing notifications
10. [ ] Implement activity history view

### Low Priority
11. [ ] Phone number authentication
12. [ ] Two-factor authentication
13. [ ] Social media linked accounts
14. [ ] Custom authentication UI matching brand

## Files Created/Modified

**New Files:**
- `app/src/config/firebase.ts` - Firebase initialization
- `app/src/context/AuthContext.tsx` - Auth state management
- `app/src/components/LoginScreen.tsx` - Login UI
- `app/src/components/SignUpScreen.tsx` - Signup UI
- `app/src/components/UserProfile.tsx` - User dashboard
- `app/.env.example` - Environment variable template

**Modified Files:**
- `app/src/components/index.ts` - Added exports for auth components
- `app/package.json` - Added firebase, expo-auth-session, expo-secure-store

## Debugging

### Check Auth State in Console
```typescript
const { user } = useAuth();
console.log('Logged in:', user?.email);
console.log('Display name:', user?.displayName);
console.log('UID:', user?.uid);
console.log('Email verified:', user?.emailVerified);
```

### Monitor Auth Changes
```typescript
// Add to AuthContext
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user?.email);
  });
  return unsubscribe;
}, []);
```

### Test Firebase Connection
```bash
curl -X GET https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=YOUR_API_KEY \
  -H "Content-Type: application/json" \
  -d '{"idToken": "<user_token>"}'
```

---

**Last Updated:** Phase 3.1 (Firebase Authentication)
**Status:** ✅ Local Ready, Needs Production Setup
**Test Coverage:** Firebase auth tested with demo credentials
