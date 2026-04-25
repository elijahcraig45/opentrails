import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native';
import { TrailFeature } from '../types';

interface SuggestionsPanelProps {
  trails: TrailFeature[];
  onSelectTrail: (trail: TrailFeature) => void;
}

export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({
  trails,
  onSelectTrail
}) => {
  const [featuredTrail, setFeaturedTrail] = useState<TrailFeature | null>(null);
  const [randomTrail, setRandomTrail] = useState<TrailFeature | null>(null);

  // Set featured trail and generate random trail
  useEffect(() => {
    if (trails.length === 0) return;
    
    // Featured: longest trail
    const longest = trails.reduce((prev, current) =>
      (prev.properties.length_meters || 0) > (current.properties.length_meters || 0) ? prev : current
    );
    setFeaturedTrail(longest);
    
    // Random: pick one at random
    const randomIndex = Math.floor(Math.random() * trails.length);
    setRandomTrail(trails[randomIndex]);
  }, [trails]);

  const generateNewRandom = () => {
    if (trails.length === 0) return;
    const randomIndex = Math.floor(Math.random() * trails.length);
    setRandomTrail(trails[randomIndex]);
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '#22c55e';
      case 'moderate': return '#f59e0b';
      case 'strenuous': return '#ef4444';
      default: return '#888888';
    }
  };

  const formatLength = (meters: number): string => {
    const miles = meters / 1609.34;
    return `${miles.toFixed(1)} mi`;
  };

  const TrailCard = ({ trail, style }: { trail: TrailFeature; style?: any }) => (
    <TouchableOpacity
      style={[styles.trailCard, style]}
      onPress={() => onSelectTrail(trail)}
      activeOpacity={0.9}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {trail.properties.name}
        </Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Difficulty</Text>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(trail.properties.estimated_difficulty) }
              ]}
            >
              <Text style={styles.difficultyText}>
                {trail.properties.estimated_difficulty || 'Unknown'}
              </Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Distance</Text>
            <Text style={styles.metaValue}>
              {formatLength(trail.properties.length_meters || 0)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>✨ Discover</Text>
        <Text style={styles.subtitle}>Find your next adventure</Text>
      </View>

      {/* Featured Trail */}
      {featuredTrail && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ Featured Trail</Text>
          <TrailCard trail={featuredTrail} />
        </View>
      )}

      {/* I'm Feeling Lucky */}
      {randomTrail && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎲 I'm Feeling Lucky</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={generateNewRandom}
            >
              <Text style={styles.refreshText}>🔄 New</Text>
            </TouchableOpacity>
          </View>
          <TrailCard trail={randomTrail} />
        </View>
      )}

      {/* Quick Collections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📂 Collections</Text>
        <View style={styles.collectionsGrid}>
          <TouchableOpacity style={styles.collectionCard}>
            <Text style={styles.collectionEmoji}>💧</Text>
            <Text style={styles.collectionName}>Waterfalls</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.collectionCard}>
            <Text style={styles.collectionEmoji}>⛰️</Text>
            <Text style={styles.collectionName}>Mountain Peaks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.collectionCard}>
            <Text style={styles.collectionEmoji}>🏞️</Text>
            <Text style={styles.collectionName}>Lakes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.collectionCard}>
            <Text style={styles.collectionEmoji}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.collectionName}>Family Hikes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  trailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  cardState: {
    fontSize: 12,
    color: '#666',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  collectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  collectionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  collectionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  collectionName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});
