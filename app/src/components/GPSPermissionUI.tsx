import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { PermissionStatus } from 'expo-location';

interface GPSPermissionUIProps {
  onPermissionGranted: () => void;
  onPermissionDenied?: () => void;
  showLater?: boolean;
}

export const GPSPermissionUI: React.FC<GPSPermissionUIProps> = ({
  onPermissionGranted,
  onPermissionDenied,
  showLater = true,
}) => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const result = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(result.status);
    } catch (err) {
      console.error('Failed to check permission status:', err);
    }
  };

  const handleRequestPermission = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(result.status);

      if (result.status === 'granted') {
        onPermissionGranted();
      } else {
        setError('Location permission is required to track your activities');
        onPermissionDenied?.();
      }
    } catch (err: any) {
      setError('Failed to request location permission');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLater = () => {
    setDeclined(true);
    onPermissionDenied?.();
  };

  // If permission already granted, don't show UI
  if (permissionStatus === 'granted') {
    return null;
  }

  // If user declined and we're showing a minimal state
  if (declined) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.declinedIcon}>📍</Text>
          <Text style={styles.declinedText}>
            Location tracking is disabled. Enable it to get accurate activity tracking.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleRequestPermission}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Enable Location</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.backdrop} />
      <View style={styles.modal}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📍</Text>
        </View>

        <Text style={styles.title}>Enable Location Services</Text>

        <Text style={styles.description}>
          OpenTrails uses GPS to track your hiking route, distance, elevation, and speed. We never share your location data without permission.
        </Text>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✓</Text>
            <Text style={styles.featureText}>Track accurate hiking routes</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✓</Text>
            <Text style={styles.featureText}>Calculate distance and elevation</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✓</Text>
            <Text style={styles.featureText}>Monitor your pace and speed</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✓</Text>
            <Text style={styles.featureText}>Create beautiful activity maps</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.enableButton, loading && styles.buttonDisabled]}
            onPress={handleRequestPermission}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.enableIcon}>📍</Text>
                <Text style={styles.buttonText}>Enable Location</Text>
              </>
            )}
          </TouchableOpacity>

          {showLater && (
            <TouchableOpacity
              style={[styles.button, styles.laterButton]}
              onPress={handleLater}
              disabled={loading}
            >
              <Text style={styles.laterButtonText}>Ask Later</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>
            Your location is only used for activity tracking and is never shared with third parties.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
    maxHeight: '90%',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  featureList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIcon: {
    fontSize: 16,
    color: '#22c55e',
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
  },
  buttonGroup: {
    gap: 12,
    marginBottom: 16,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  enableButton: {
    backgroundColor: '#3b82f6',
  },
  laterButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
  },
  enableIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  laterButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
  },
  privacyIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  privacyText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
    lineHeight: 16,
  },
  // Minimal display when declined
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  declinedIcon: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  declinedText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
    textAlign: 'center',
  },
});
