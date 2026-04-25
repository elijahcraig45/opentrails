import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

interface Activity {
  id: string;
  title: string;
  date: string;
  distance: number; // in miles
  duration: number; // in hours
  elevation?: number; // in meters
  trailName?: string;
  activityType: 'hike' | 'run' | 'walk' | 'bike';
  notes?: string;
}

interface ActivityHistoryPanelProps {
  onActivitySelect: (activity: Activity) => void;
  onClose: () => void;
}

const ACTIVITY_EMOJIS: Record<string, string> = {
  hike: '🥾',
  run: '🏃',
  walk: '🚶',
  bike: '🚴',
};

export const ActivityHistoryPanel: React.FC<ActivityHistoryPanelProps> = ({
  onActivitySelect,
  onClose,
}) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadActivities();
    }
  }, [user]);

  const loadActivities = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call to backend
      // const token = await user?.getIdToken();
      // const response = await fetch(
      //   `https://opentrails-api-542596148138.us-central1.run.app/api/users/${user?.uid}/activities`,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${token}`
      //     }
      //   }
      // );
      // if (!response.ok) throw new Error('Failed to load activities');
      // const data = await response.json();
      // setActivities(data);

      // Mock data for development
      setActivities([
        {
          id: '1',
          title: 'Sunrise Hike',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          distance: 5.2,
          duration: 1.5,
          elevation: 800,
          trailName: 'Flatirons Loop',
          activityType: 'hike',
          notes: 'Amazing sunrise views!',
        },
        {
          id: '2',
          title: 'Evening Trail Run',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          distance: 8.1,
          duration: 1.2,
          elevation: 600,
          trailName: 'Bear Canyon Trail',
          activityType: 'run',
          notes: 'Felt strong today',
        },
        {
          id: '3',
          title: 'Scenic Walk',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          distance: 3.5,
          duration: 1.1,
          elevation: 400,
          trailName: 'South Boulder Peak',
          activityType: 'walk',
        },
        {
          id: '4',
          title: 'Mountain Bike Adventure',
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          distance: 12.3,
          duration: 2.0,
          elevation: 1200,
          trailName: 'Cheesman Lake Trail',
          activityType: 'bike',
          notes: 'Great trail conditions',
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = (activityId: string) => {
    Alert.alert('Delete Activity', 'Are you sure you want to delete this activity?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // TODO: Call API to delete activity
            // await fetch(
            //   `https://opentrails-api-542596148138.us-central1.run.app/api/activities/${activityId}`,
            //   { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }
            // );
            setActivities(activities.filter(a => a.id !== activityId));
          } catch (err) {
            console.error('Failed to delete activity:', err);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity History</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#3b82f6" size="large" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadActivities}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No activities yet</Text>
          <Text style={styles.emptySubtext}>Start logging your hikes to see them here</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {activities.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              style={styles.activityCard}
              onPress={() => onActivitySelect(activity)}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconAndTitle}>
                  <Text style={styles.emoji}>
                    {ACTIVITY_EMOJIS[activity.activityType] || '🥾'}
                  </Text>
                  <View style={styles.titleSection}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    {activity.trailName && (
                      <Text style={styles.trailName}>{activity.trailName}</Text>
                    )}
                    <Text style={styles.activityDate}>{activity.date}</Text>
                  </View>
                </View>

                <View style={styles.statsSection}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{activity.distance}</Text>
                    <Text style={styles.statLabel}>mi</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{activity.duration.toFixed(1)}</Text>
                    <Text style={styles.statLabel}>h</Text>
                  </View>
                  {activity.elevation && (
                    <View style={styles.stat}>
                      <Text style={styles.statValue}>{activity.elevation}</Text>
                      <Text style={styles.statLabel}>m↑</Text>
                    </View>
                  )}
                </View>
              </View>

              {activity.notes && (
                <Text style={styles.notes}>{activity.notes}</Text>
              )}

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteActivity(activity.id)}
              >
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Summary Stats */}
      {activities.length > 0 && !loading && (
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Distance</Text>
            <Text style={styles.summaryValue}>
              {activities.reduce((sum, a) => sum + a.distance, 0).toFixed(1)} mi
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Time</Text>
            <Text style={styles.summaryValue}>
              {activities.reduce((sum, a) => sum + a.duration, 0).toFixed(1)} h
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#9ca3af',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  activityCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconAndTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  titleSection: {
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
    color: '#6b7280',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  statsSection: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  statLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  notes: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  deleteIcon: {
    fontSize: 16,
  },
  summarySection: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
  },
});
