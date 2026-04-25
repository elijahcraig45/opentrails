import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TrailFeature } from '../types';
import { ElevationProfile } from './ElevationProfile';

const difficultyColors: Record<string, string> = {
  Easy: '#22c55e',
  Moderate: '#f59e0b',
  Strenuous: '#ef4444',
};

interface TrailDetailsPanelProps {
  trail: TrailFeature;
  onClose: () => void;
}

export const TrailDetailsPanel: React.FC<TrailDetailsPanelProps> = ({ trail, onClose }) => {
  // Extract coordinates from geometry
  const getCoordinates = (): Array<[number, number]> => {
    if (trail.geometry.type === 'LineString') {
      return trail.geometry.coordinates as Array<[number, number]>;
    }
    return [];
  };

  return (
    <View style={styles.detailsPanel}>
      <View style={styles.detailsHeader}>
        <Text style={styles.detailsTitle}>{trail.properties.name}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.detailsContent}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Length:</Text>
          <Text style={styles.detailValue}>
            {(trail.properties.length_meters / 1609.34).toFixed(2)} miles
          </Text>
        </View>
        {trail.properties.elevation_gain_meters && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Elevation:</Text>
            <Text style={styles.detailValue}>
              {Math.round(trail.properties.elevation_gain_meters)} m gain
            </Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Difficulty:</Text>
          <View style={[
            styles.difficultyBadge,
            { backgroundColor: difficultyColors[trail.properties.estimated_difficulty] }
          ]}>
            <Text style={styles.difficultyText}>
              {trail.properties.estimated_difficulty}
            </Text>
          </View>
        </View>
        {trail.properties.surface && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Surface:</Text>
            <Text style={styles.detailValue}>{trail.properties.surface}</Text>
          </View>
        )}
        {trail.properties.wheelchair && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Wheelchair:</Text>
            <Text style={styles.detailValue}>{trail.properties.wheelchair}</Text>
          </View>
        )}
        {trail.properties.sac_scale && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SAC Scale:</Text>
            <Text style={styles.detailValue}>{trail.properties.sac_scale}</Text>
          </View>
        )}

        {/* Elevation Profile Chart */}
        <View style={styles.chartContainer}>
          <ElevationProfile
            title="Elevation Profile"
            coordinates={getCoordinates()}
            totalElevationGain={trail.properties.elevation_gain_meters || 0}
            height={250}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  detailsPanel: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    marginTop: 16,
    borderRadius: 6,
    overflow: 'hidden',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  closeButton: {
    fontSize: 18,
    color: '#666',
    padding: 4,
  },
  detailsContent: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  detailRow: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  detailValue: {
    fontSize: 12,
    color: '#1f2937',
    flex: 1,
    textAlign: 'right',
  },
  difficultyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  chartContainer: {
    marginTop: 16,
    marginHorizontal: -12,
    marginBottom: 0,
  },
});
