import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';

interface GuestUser {
  isGuest: true;
  id: string;
  requestCount: number;
  lastRequestTime: number;
}

interface AuthContextType {
  user: User | null;
  guestUser: GuestUser | null;
  isAuthenticated: boolean; // true if either signed in or guest
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  clearError: () => void;
  browseAsGuest: () => void;
  isGuest: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_ID_KEY = 'opentrails_guest_id';
const RATE_LIMIT_KEY = 'opentrails_rate_limit';
const MAX_GUEST_REQUESTS_PER_HOUR = 100; // Reasonable limit for guest browsing

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [guestUser, setGuestUser] = useState<GuestUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize guest mode from localStorage
  useEffect(() => {
    const initGuest = () => {
      const storedGuestId = localStorage.getItem(GUEST_ID_KEY);
      if (storedGuestId) {
        setGuestUser({
          isGuest: true,
          id: storedGuestId,
          requestCount: 0,
          lastRequestTime: Date.now(),
        });
      }
    };

    initGuest();

    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setGuestUser(null); // Clear guest mode when logged in
      }
      setLoading(false);
    }, (err) => {
      console.error('Auth state change error:', err);
      setError(err.message);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const browseAsGuest = () => {
    const guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
    
    setGuestUser({
      isGuest: true,
      id: guestId,
      requestCount: 0,
      lastRequestTime: Date.now(),
    });
    setUser(null);
  };

  const signInWithGoogle = async (): Promise<User> => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setGuestUser(null); // Clear guest mode
      return result.user;
    } catch (err: any) {
      const message = err.message || 'Failed to sign in with Google';
      setError(message);
      throw err;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      // Clear guest session too
      localStorage.removeItem(GUEST_ID_KEY);
      setGuestUser(null);
    } catch (err: any) {
      const message = err.message || 'Failed to sign out';
      setError(message);
      throw err;
    }
  };

  const clearError = () => setError(null);

  const isGuest = () => !!guestUser && !user;

  const isAuthenticated = !loading && (!!user || !!guestUser);

  return (
    <AuthContext.Provider
      value={{
        user,
        guestUser,
        isAuthenticated,
        loading,
        error,
        signInWithGoogle,
        logout,
        clearError,
        browseAsGuest,
        isGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
