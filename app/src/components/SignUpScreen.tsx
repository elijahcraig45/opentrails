import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface SignUpScreenProps {
  onLoginPress: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onLoginPress }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const { signUp, error, loading, clearError } = useAuth();

  const handleSignUp = async () => {
    if (!displayName || !email || !password) {
      return;
    }

    if (password !== confirmPassword) {
      setPasswordMatch(false);
      return;
    }

    try {
      await signUp(email, password, displayName);
    } catch (err) {
      console.error('Sign up error:', err);
    }
  };

  const isValid = displayName && email && password && confirmPassword && password === confirmPassword;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join OpenTrails to track your adventures</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="John Doe"
          placeholderTextColor="#999"
          value={displayName}
          onChangeText={(text) => {
            setDisplayName(text);
            clearError();
          }}
          editable={!loading}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#999"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            clearError();
          }}
          editable={!loading}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordInput}>
          <TextInput
            style={styles.passwordField}
            placeholder="At least 6 characters"
            placeholderTextColor="#999"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearError();
            }}
            editable={!loading}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            disabled={!password}
          >
            <Text style={styles.togglePassword}>
              {showPassword ? '👁️' : '🔒'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={[styles.input, !passwordMatch && styles.inputError]}
          placeholder="Confirm your password"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setPasswordMatch(true);
            clearError();
          }}
          editable={!loading}
          secureTextEntry
        />

        {!passwordMatch && (
          <Text style={styles.error}>Passwords do not match</Text>
        )}

        {error && (
          <Text style={styles.error}>{error}</Text>
        )}

        <TouchableOpacity
          style={[styles.button, (!isValid || loading) && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={!isValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          onPress={onLoginPress}
          disabled={loading}
        >
          <Text style={styles.loginLink}>
            Already have an account? <Text style={styles.loginBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🔒 Your data is securely stored with Firebase encryption
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: '100%',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f9fafb',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
  },
  passwordField: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  togglePassword: {
    fontSize: 18,
    padding: 4,
  },
  error: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 24,
  },
  loginLink: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  loginBold: {
    fontWeight: '600',
    color: '#3b82f6',
  },
  footer: {
    marginTop: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
