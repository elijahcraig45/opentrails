import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TrailFeature } from '../types';

interface TrailListProps {
  trails: TrailFeature[];
  onSelectTrail: (trail: TrailFeature) => void;
}

export const TrailList: React.FC<TrailListProps> = ({ trails, onSelectTrail }) => {
  return (
    <View style={styles.trailList}>
      <Text style={styles.trailListTitle}>
        Trails ({trails.length})
      </Text>
      <ScrollView style={styles.trailListContent}>
        {trails.map((trail) => (
          <TouchableOpacity
            key={trail.id}
            style={styles.trailListItem}
            onPress={() => onSelectTrail(trail)}
          >
            <Text style={styles.trailListItemName}>{trail.properties.name}</Text>
            <Text style={styles.trailListItemMeta}>
              {(trail.properties.length_meters / 1609.34).toFixed(1)} mi · {trail.properties.estimated_difficulty}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  trailList: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    marginTop: 16,
    borderRadius: 6,
    overflow: 'hidden',
  },
  trailListTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    textTransform: 'uppercase',
  },
  trailListContent: {
    paddingVertical: 8,
  },
  trailListItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  trailListItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  trailListItemMeta: {
    fontSize: 11,
    color: '#666',
  },
});
