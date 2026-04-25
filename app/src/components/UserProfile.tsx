import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface UserProfileProps {
  onLogoutPress?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onLogoutPress }) => {
  const { user, logout, loading, error } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      onLogoutPress?.();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Not logged in</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.displayName?.charAt(0).toUpperCase() || '👤'}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.name}>
            {user.displayName || 'User'}
          </Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Trails Hiked</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0 km</Text>
          <Text style={styles.statLabel}>Total Distance</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0 m</Text>
          <Text style={styles.statLabel}>Elevation Gain</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuItem}>
          <Text style={styles.menuLabel}>Email Verified</Text>
          <Text style={styles.menuValue}>
            {user.emailVerified ? '✅' : '⏳'}
          </Text>
        </View>
        <View style={styles.menuItem}>
          <Text style={styles.menuLabel}>Account Created</Text>
          <Text style={styles.menuValue}>
            {user.metadata?.creationTime
              ? new Date(user.metadata.creationTime).toLocaleDateString()
              : 'Unknown'}
          </Text>
        </View>
      </View>

      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, styles.logoutButton, isLoggingOut && styles.buttonDisabled]}
        onPress={handleLogout}
        disabled={isLoggingOut || loading}
      >
        {isLoggingOut ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Out</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.footer}>
        Share your hiking achievements with the community
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 6,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuLabel: {
    fontSize: 14,
    color: '#374151',
  },
  menuValue: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  footer: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 12,
  },
});
