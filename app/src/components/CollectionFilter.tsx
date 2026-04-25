import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';

interface CollectionFilterProps {
  onSelectCollection: (collection: string | null) => void;
  selectedCollection: string | null;
}

interface Collection {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

const collections: Collection[] = [
  {
    id: 'waterfalls',
    name: 'Waterfalls',
    emoji: '💧',
    color: '#3b82f6',
    description: 'Beautiful cascade trails',
  },
  {
    id: 'peaks',
    name: 'Mountain Peaks',
    emoji: '⛰️',
    color: '#ef4444',
    description: 'Summit views',
  },
  {
    id: 'lakes',
    name: 'Lakes',
    emoji: '🏞️',
    color: '#0ea5e9',
    description: 'Scenic water trails',
  },
  {
    id: 'family',
    name: 'Family Hikes',
    emoji: '👨‍👩‍👧‍👦',
    color: '#f59e0b',
    description: 'Kid-friendly trails',
  },
];

export const CollectionFilter: React.FC<CollectionFilterProps> = ({
  onSelectCollection,
  selectedCollection,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.title}>📂 Collections</Text>
        <Text style={styles.toggleIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.grid}>
          {collections.map((collection) => (
            <TouchableOpacity
              key={collection.id}
              style={[
                styles.collectionCard,
                selectedCollection === collection.id &&
                  styles.collectionCardActive,
                { borderLeftColor: collection.color },
              ]}
              onPress={() =>
                onSelectCollection(
                  selectedCollection === collection.id ? null : collection.id
                )
              }
            >
              <Text style={styles.collectionEmoji}>{collection.emoji}</Text>
              <View style={styles.collectionInfo}>
                <Text style={styles.collectionName}>{collection.name}</Text>
                <Text style={styles.collectionDesc}>
                  {collection.description}
                </Text>
              </View>
              {selectedCollection === collection.id && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  toggleIcon: {
    fontSize: 12,
    color: '#666',
  },
  grid: {
    gap: 8,
    marginTop: 8,
  },
  collectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
  },
  collectionCardActive: {
    backgroundColor: '#eff6ff',
    borderLeftColor: '#667eea',
  },
  collectionEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  collectionDesc: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: 'bold',
  },
});
