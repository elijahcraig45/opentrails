import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useActivityTracking } from '../hooks/useActivityTracking';

interface ActivityFormProps {
  onActivityStart: (activity: ActivityData) => void;
  selectedTrailName?: string;
  selectedTrailDistance?: number;
}

interface ActivityData {
  title: string;
  notes: string;
  activityType: 'hike' | 'run' | 'walk' | 'bike';
  trailName?: string;
  estimatedDistance?: number;
}

const ACTIVITY_TYPES = [
  { label: 'Hiking', value: 'hike' },
  { label: 'Running', value: 'run' },
  { label: 'Walking', value: 'walk' },
  { label: 'Mountain Biking', value: 'bike' },
];

export const ActivityForm: React.FC<ActivityFormProps> = ({
  onActivityStart,
  selectedTrailName,
  selectedTrailDistance,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [activityType, setActivityType] = useState<'hike' | 'run' | 'walk' | 'bike'>('hike');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { requestPermissions } = useActivityTracking();

  const handleStartActivity = async () => {
    if (!title.trim()) {
      setError('Please enter an activity title');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Request location permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setError('Location permission is required to track activities');
        return;
      }

      const activityData: ActivityData = {
        title: title.trim(),
        notes: notes.trim(),
        activityType,
        trailName: selectedTrailName,
        estimatedDistance: selectedTrailDistance,
      };

      onActivityStart(activityData);
    } catch (err: any) {
      setError(err.message || 'Failed to start activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Start New Activity</Text>
      <Text style={styles.subtitle}>Log a hike, run, or other outdoor adventure</Text>

      <View style={styles.form}>
        {/* Activity Title */}
        <Text style={styles.label}>Activity Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Morning Hike in Flatirons"
          placeholderTextColor="#999"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            setError(null);
          }}
          editable={!loading}
          maxLength={100}
        />

        {/* Activity Type */}
        <Text style={styles.label}>Activity Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={activityType}
            onValueChange={(value: any) => setActivityType(value as any)}
            enabled={!loading}
          >
            {ACTIVITY_TYPES.map((type) => (
              <Picker.Item key={type.value} label={type.label} value={type.value} />
            ))}
          </Picker>
        </View>

        {/* Selected Trail Info */}
        {selectedTrailName && (
          <View style={styles.trailInfo}>
            <Text style={styles.label}>Trail</Text>
            <View style={styles.trailCard}>
              <Text style={styles.trailName}>{selectedTrailName}</Text>
              {selectedTrailDistance && (
                <Text style={styles.trailDistance}>
                  {(selectedTrailDistance / 1609.34).toFixed(2)} miles
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Notes */}
        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Great weather today, saw lots of wildlife..."
          placeholderTextColor="#999"
          value={notes}
          onChangeText={(text) => {
            setNotes(text);
            setError(null);
          }}
          editable={!loading}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text style={styles.characterCount}>
          {notes.length}/500
        </Text>

        {error && (
          <Text style={styles.error}>{error}</Text>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleStartActivity}
          disabled={loading || !title.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>🎯 Start Recording</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          📍 GPS will start recording your location once you begin. Make sure location permissions are enabled.
        </Text>
      </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
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
    color: '#1f2937',
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  characterCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
  },
  trailInfo: {
    marginTop: 16,
  },
  trailCard: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
    padding: 12,
    borderRadius: 6,
  },
  trailName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  trailDistance: {
    fontSize: 12,
    color: '#0c4a6e',
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
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 16,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});
