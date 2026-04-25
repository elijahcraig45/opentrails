import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, useWindowDimensions, ActivityIndicator } from 'react-native';
import { TrailFeature } from '../types';
import { TrailCard } from './TrailCard';

interface TrailListViewProps {
  trails: TrailFeature[];
  searchQuery?: string;
  selectedDifficulty?: string | null;
  selectedState?: string | null;
  onTrailPress: (trail: TrailFeature) => void;
  onFavoritePress?: (trail: TrailFeature) => void;
  favorites?: Set<string>;
  loading?: boolean;
}

export function TrailListView({
  trails,
  searchQuery = '',
  selectedDifficulty = null,
  selectedState = null,
  onTrailPress,
  onFavoritePress,
  favorites = new Set(),
  loading = false,
}: TrailListViewProps) {
  const { width } = useWindowDimensions();
  const isWeb = typeof window !== 'undefined';

  // Filter trails
  const filteredTrails = useMemo(() => {
    return trails.filter((trail) => {
      const props = trail.properties || {};
      
      // Search filter
      if (searchQuery && !props.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulty && selectedDifficulty !== 'All') {
        if ((props.estimated_difficulty || props.difficulty) !== selectedDifficulty) {
          return false;
        }
      }

      // State filter
      if (selectedState && props.state !== selectedState) {
        return false;
      }

      return true;
    });
  }, [trails, searchQuery, selectedDifficulty, selectedState]);

  // Calculate columns based on screen size
  const numColumns = isWeb ? (width > 1200 ? 4 : width > 900 ? 3 : width > 600 ? 2 : 1) : 2;

  const renderItem = ({ item }: { item: TrailFeature }) => (
    <TrailCard
      trail={item}
      onPress={onTrailPress}
      onFavoritePress={onFavoritePress}
      isFavorite={favorites.has(String(item.id))}
    />
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading trails...</Text>
      </View>
    );
  }

  if (filteredTrails.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>🗺️</Text>
        <Text style={styles.emptyTitle}>No Trails Found</Text>
        <Text style={styles.emptyText}>
          {searchQuery || selectedDifficulty || selectedState
            ? 'Try adjusting your filters'
            : 'No trails available'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.resultCount}>
          {filteredTrails.length} trail{filteredTrails.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      <FlatList
        data={filteredTrails}
        renderItem={renderItem}
        keyExtractor={(item) => `trail-${item.id}`}
        numColumns={numColumns}
        key={numColumns}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
