import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface Activity {
  id: string;
  title: string;
  date: string;
  distance: number;
  duration: number;
  trailName?: string;
}

interface UserProfileScreenProps {
  onActivityPress?: () => void;
  onSettingsPress?: () => void;
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({
  onActivityPress,
  onSettingsPress,
}) => {
  const { user, logout, loading, error } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    // Load user activities from API when component mounts
    if (user) {
      loadActivities();
    }
  }, [user]);

  const loadActivities = async () => {
    setLoadingActivities(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(
      //   `https://opentrails-api-542596148138.us-central1.run.app/api/users/${user?.uid}/activities`,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${await user?.getIdToken()}`
      //     }
      //   }
      // );
      // const data = await response.json();
      // setActivities(data);

      // Mock data for now
      setActivities([
        {
          id: '1',
          title: 'Morning Hike',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          distance: 5.2,
          duration: 1.5,
          trailName: 'Flatirons Loop',
        },
        {
          id: '2',
          title: 'Evening Run',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          distance: 8.1,
          duration: 1.2,
          trailName: 'Boulder Valley Trail',
        },
      ]);
      setTotalDistance(13.3);
      setTotalDuration(2.7);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await logout();
          } catch (err) {
            console.error('Logout error:', err);
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Not logged in</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* User Header */}
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
          {user.metadata?.creationTime && (
            <Text style={styles.memberSince}>
              Member since {new Date(user.metadata.creationTime).getFullYear()}
            </Text>
          )}
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{activities.length}</Text>
          <Text style={styles.statLabel}>Activities</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalDistance.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Miles Hiked</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.round(totalDuration * 60)}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
      </View>

      {/* Recent Activities */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <TouchableOpacity onPress={onActivityPress}>
            <Text style={styles.seeAllLink}>See All →</Text>
          </TouchableOpacity>
        </View>

        {loadingActivities ? (
          <ActivityIndicator color="#3b82f6" style={styles.loader} />
        ) : activities.length > 0 ? (
          activities.slice(0, 3).map((activity) => (
            <TouchableOpacity key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text style={styles.activityEmoji}>🥾</Text>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                {activity.trailName && (
                  <Text style={styles.trailName}>{activity.trailName}</Text>
                )}
                <Text style={styles.activityDate}>{activity.date}</Text>
              </View>
              <View style={styles.activityStats}>
                <Text style={styles.statSmall}>{activity.distance} mi</Text>
                <Text style={styles.statSmall}>{activity.duration}h</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No activities yet. Start tracking!</Text>
        )}
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={onSettingsPress}
        >
          <Text style={styles.menuLabel}>⚙️ Settings</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.menuItem}>
          <Text style={styles.menuLabel}>📧 Email Verified</Text>
          <Text style={styles.menuValue}>
            {user.emailVerified ? '✅' : '⏳'}
          </Text>
        </View>
      </View>

      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

      {/* Sign Out Button */}
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
        Keep exploring and sharing your hiking adventures
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: '#9ca3af',
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
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'uppercase',
  },
  seeAllLink: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  loader: {
    marginVertical: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 20,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  trailName: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#d1d5db',
  },
  activityStats: {
    alignItems: 'flex-end',
  },
  statSmall: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    padding: 16,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  menuValue: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 18,
    color: '#9ca3af',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    marginVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 20,
  },
});
