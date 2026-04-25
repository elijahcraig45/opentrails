import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { ActivitySession } from '../hooks/useActivityTracking';

interface LiveActivityOverlayProps {
  session: ActivitySession | null;
  isRecording: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  activityTitle?: string;
}

export const LiveActivityOverlay: React.FC<LiveActivityOverlayProps> = ({
  session,
  isRecording,
  onPause,
  onResume,
  onStop,
  activityTitle,
}) => {
  if (!session) {
    return null;
  }

  // Format distance in miles
  const distanceInMiles = (session.totalDistance / 1609.34).toFixed(2);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format speed in mph
  const avgSpeed = (session.avgSpeed * 2.237).toFixed(1); // m/s to mph
  const maxSpeed = (session.maxSpeed * 2.237).toFixed(1);
  const pace = session.totalDistance > 0 
    ? ((session.duration / 60) / (session.totalDistance / 1609.34)).toFixed(1) 
    : '0';

  // Elevation gain in feet
  const elevationGainFeet = Math.round(session.totalElevationGain * 3.28084);

  return (
    <SafeAreaView style={styles.overlay}>
      {/* Main Stats Display */}
      <View style={styles.statsContainer}>
        {/* Activity Title */}
        {activityTitle && (
          <Text style={styles.activityTitle}>{activityTitle}</Text>
        )}

        {/* Primary Metrics */}
        <View style={styles.primaryMetrics}>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{distanceInMiles}</Text>
            <Text style={styles.metricLabel}>miles</Text>
          </View>

          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{formatTime(session.duration)}</Text>
            <Text style={styles.metricLabel}>elapsed</Text>
          </View>

          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{pace}</Text>
            <Text style={styles.metricLabel}>min/mi</Text>
          </View>
        </View>

        {/* Secondary Metrics */}
        <View style={styles.secondaryMetrics}>
          <View style={styles.secondaryMetric}>
            <Text style={styles.secondaryLabel}>Pace</Text>
            <Text style={styles.secondaryValue}>{pace} min/mi</Text>
          </View>
          <View style={styles.secondaryMetric}>
            <Text style={styles.secondaryLabel}>Avg Speed</Text>
            <Text style={styles.secondaryValue}>{avgSpeed} mph</Text>
          </View>
          <View style={styles.secondaryMetric}>
            <Text style={styles.secondaryLabel}>Max Speed</Text>
            <Text style={styles.secondaryValue}>{maxSpeed} mph</Text>
          </View>
          {session.totalElevationGain > 0 && (
            <View style={styles.secondaryMetric}>
              <Text style={styles.secondaryLabel}>Elevation</Text>
              <Text style={styles.secondaryValue}>{elevationGainFeet} ft↑</Text>
            </View>
          )}
        </View>

        {/* Recording Status */}
        <View style={[styles.recordingStatus, !isRecording && styles.recordingPaused]}>
          <Text style={styles.recordingDot}>●</Text>
          <Text style={styles.recordingText}>
            {isRecording ? 'Recording' : 'Paused'}
          </Text>
          <Text style={styles.gpsIndicator}>📍</Text>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {/* Pause/Resume Button */}
        <TouchableOpacity
          style={[styles.controlButton, styles.pauseButton]}
          onPress={isRecording ? onPause : onResume}
        >
          <Text style={styles.buttonIcon}>{isRecording ? '⏸' : '▶️'}</Text>
          <Text style={styles.buttonText}>
            {isRecording ? 'Pause' : 'Resume'}
          </Text>
        </TouchableOpacity>

        {/* Stop Button */}
        <TouchableOpacity
          style={[styles.controlButton, styles.stopButton]}
          onPress={onStop}
        >
          <Text style={styles.buttonIcon}>🛑</Text>
          <Text style={styles.stopButtonText}>Stop</Text>
        </TouchableOpacity>
      </View>

      {/* GPS Signal Indicator */}
      <View style={styles.gpsIndicatorBox}>
        <Text style={styles.gpsSignal}>📡 GPS Signal: Good</Text>
        <Text style={styles.gpsPoints}>{session.points.length} points recorded</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 12,
    pointerEvents: 'box-none', // Allows map interactions
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  metricBox: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  metricLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  secondaryMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  secondaryMetric: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  secondaryLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 2,
  },
  secondaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#dcfce7',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  recordingPaused: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
  },
  recordingDot: {
    color: '#22c55e',
    fontSize: 12,
    marginRight: 6,
    fontWeight: 'bold',
  },
  recordingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  gpsIndicator: {
    fontSize: 12,
    marginLeft: 6,
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    justifyContent: 'center',
    pointerEvents: 'auto',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pauseButton: {
    backgroundColor: '#f59e0b',
    minWidth: 120,
  },
  stopButton: {
    backgroundColor: '#ef4444',
    minWidth: 100,
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  stopButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  gpsIndicatorBox: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  gpsSignal: {
    fontSize: 12,
    color: '#0c4a6e',
    fontWeight: '500',
    marginBottom: 2,
  },
  gpsPoints: {
    fontSize: 11,
    color: '#0c4a6e',
  },
});
