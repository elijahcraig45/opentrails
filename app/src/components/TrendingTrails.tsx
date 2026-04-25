import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { TrailFeature } from '../types';

interface TrendingTrailsProps {
  trails: TrailFeature[];
  onSelectTrail: (trail: TrailFeature) => void;
}

export const TrendingTrails: React.FC<TrendingTrailsProps> = ({
  trails,
  onSelectTrail,
}) => {
  const trendingTrails = useMemo(() => {
    if (trails.length === 0) return [];
    // Sort by elevation gain (as proxy for popularity)
    const sorted = [...trails]
      .sort((a, b) => {
        const elevA = a.properties.elevation_gain_meters || 0;
        const elevB = b.properties.elevation_gain_meters || 0;
        return elevB - elevA;
      })
      .slice(0, 3);
    return sorted;
  }, [trails]);

  if (trendingTrails.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 Trending Now</Text>
      <Text style={styles.subtitle}>Most popular trails right now</Text>
      <View style={styles.trailsList}>
        {trendingTrails.map((trail, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.trendingCard}
            onPress={() => onSelectTrail(trail)}
          >
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{idx + 1}</Text>
            </View>
            <View style={styles.trailInfo}>
              <Text style={styles.trailName} numberOfLines={1}>
                {trail.properties.name}
              </Text>
              <View style={styles.trailStats}>
                <Text style={styles.statText}>
                  {trail.properties.estimated_difficulty || 'Unknown'}
                </Text>
                <Text style={styles.statDot}>•</Text>
                <Text style={styles.statText}>
                  {trail.properties.elevation_gain_meters ? `${Math.round(trail.properties.elevation_gain_meters)}m` : 'N/A'}
                </Text>
              </View>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    marginTop: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  trailsList: {
    gap: 8,
  },
  trendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  trailInfo: {
    flex: 1,
  },
  trailName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  trailStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 11,
    color: '#666',
  },
  statDot: {
    fontSize: 11,
    color: '#ccc',
  },
  arrow: {
    fontSize: 16,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
});
