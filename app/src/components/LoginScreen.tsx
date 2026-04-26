import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface LoginScreenProps {
  onSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const { signInWithGoogle, browseAsGuest, error, loading, clearError } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setAuthError(null);
      clearError();
      await signInWithGoogle();
      onSuccess?.();
    } catch (err) {
      setAuthError('Failed to sign in with Google. Please try again.');
      console.error('Google sign-in error:', err);
    }
  };

  const handleGuestBrowse = () => {
    setAuthError(null);
    clearError();
    browseAsGuest();
    onSuccess?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🥾 OpenTrails</Text>
      <Text style={styles.subtitle}>Discover & Track Your Hikes</Text>

      <View style={styles.content}>
        <Text style={styles.description}>
          Explore thousands of trails across the US. Sign in to save your favorites and track activities.
        </Text>

        {/* Error message */}
        {(authError || error) && (
          <View style={styles.errorContainer}>
            <Text style={styles.error}>{authError || error}</Text>
          </View>
        )}

        {/* Google Sign In Button */}
        <TouchableOpacity
          style={[styles.googleButton, loading && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1f2937" />
          ) : (
            <Text style={styles.googleButtonText}>🔐 Sign In with Google</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Browse as Guest Button */}
        <TouchableOpacity
          style={[styles.guestButton, loading && styles.buttonDisabled]}
          onPress={handleGuestBrowse}
          disabled={loading}
        >
          <Text style={styles.guestButtonText}>Browse as Guest</Text>
        </TouchableOpacity>

        <Text style={styles.guestNote}>
          Browse and search trails without an account. Sign in anytime to save favorites.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Open source • MIT License • {'\n'}
          Made with ❤️ for hikers everywhere
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  error: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '500',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#9ca3af',
    fontSize: 14,
  },
  guestButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  guestNote: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
});
