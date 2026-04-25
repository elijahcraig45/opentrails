import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';

interface Activity {
  id: string;
  title: string;
  date: string;
  distance: number;
  duration: number;
  elevation?: number;
  trailName?: string;
  activityType: 'hike' | 'run' | 'walk' | 'bike';
  notes?: string;
  speed?: number;
  maxSpeed?: number;
  gpsPoints?: Array<[number, number]>;
  photos?: Array<{ id: string; url: string }>;
}

interface ActivityDetailsViewProps {
  activity: Activity;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ActivityDetailsView: React.FC<ActivityDetailsViewProps> = ({
  activity,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      const message = `I just completed "${activity.title}" on ${activity.date}! 🥾\n\nDistance: ${activity.distance} miles\nTime: ${activity.duration.toFixed(1)} hours\n\nJoin me on OpenTrails!`;

      await Share.share({
        message,
        title: activity.title,
        url: 'https://app-gamma-sage-37.vercel.app',
      });
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setSharing(false);
    }
  };

  const pace = activity.duration > 0 ? (activity.distance / activity.duration).toFixed(1) : '0';
  const formattedDuration = Math.floor(activity.duration * 60); // convert to minutes

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{activity.title}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Activity Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Date</Text>
              <Text style={styles.overviewValue}>{activity.date}</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Type</Text>
              <Text style={styles.overviewValue}>
                {activity.activityType.charAt(0).toUpperCase() + activity.activityType.slice(1)}
              </Text>
            </View>
            {activity.trailName && (
              <View style={[styles.overviewCard, styles.fullWidth]}>
                <Text style={styles.overviewLabel}>Trail</Text>
                <Text style={styles.overviewValue}>{activity.trailName}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>{activity.distance}</Text>
              <Text style={styles.statUnit}>miles</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{formattedDuration}</Text>
              <Text style={styles.statUnit}>minutes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Pace</Text>
              <Text style={styles.statValue}>{pace}</Text>
              <Text style={styles.statUnit}>mi/hr</Text>
            </View>
            {activity.elevation && (
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Elevation</Text>
                <Text style={styles.statValue}>{activity.elevation}</Text>
                <Text style={styles.statUnit}>meters</Text>
              </View>
            )}
            {activity.maxSpeed && (
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Max Speed</Text>
                <Text style={styles.statValue}>{activity.maxSpeed.toFixed(1)}</Text>
                <Text style={styles.statUnit}>mi/hr</Text>
              </View>
            )}
            {activity.speed && (
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Avg Speed</Text>
                <Text style={styles.statValue}>{activity.speed.toFixed(1)}</Text>
                <Text style={styles.statUnit}>mi/hr</Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes */}
        {activity.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{activity.notes}</Text>
            </View>
          </View>
        )}

        {/* Photos Section */}
        {activity.photos && activity.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos ({activity.photos.length})</Text>
            <View style={styles.photosGrid}>
              {activity.photos.map((photo) => (
                <View key={photo.id} style={styles.photoCard}>
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoIcon}>📷</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            disabled={sharing}
          >
            {sharing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.shareIcon}>📤</Text>
                <Text style={styles.shareText}>Share Activity</Text>
              </>
            )}
          </TouchableOpacity>

          {onEdit && (
            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <Text style={styles.editIcon}>✏️</Text>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Text style={styles.deleteIcon}>🗑️</Text>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#9ca3af',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  overviewCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  fullWidth: {
    minWidth: '100%',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 11,
    color: '#9ca3af',
  },
  notesCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoCard: {
    flex: 1,
    minWidth: '30%',
    aspectRatio: 1,
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  photoIcon: {
    fontSize: 32,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  shareIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  shareText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
  },
  editIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  editText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 8,
  },
  deleteIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  deleteText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
