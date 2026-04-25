import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { TrailFeature } from '../types';

interface TrailCardProps {
  trail: TrailFeature;
  onPress: (trail: TrailFeature) => void;
  onFavoritePress?: (trail: TrailFeature) => void;
  isFavorite?: boolean;
}

export function TrailCard({ trail, onPress, onFavoritePress, isFavorite = false }: TrailCardProps) {
  const { width } = useWindowDimensions();
  const isWeb = typeof window !== 'undefined';
  const cardWidth = isWeb ? (width > 900 ? 280 : (width > 600 ? 240 : width / 2 - 16) ) : width / 2 - 12;

  const properties = trail.properties || {};
  const name = properties.name || 'Unnamed Trail';
  const difficulty = properties.estimated_difficulty || properties.difficulty || 'Easy';
  const length = properties.length_meters || properties.length_km || 0;
  const lengthKm = typeof length === 'number' && length > 100 ? length / 1000 : length;
  const elevationGain = properties.elevation_gain_meters || 0;
  const rating = properties.rating || 0;
  const imageUrl = properties.image_url || properties.imgSmall;

  const difficultyColor = {
    Easy: '#4CAF50',
    Moderate: '#FFC107',
    Strenuous: '#F44336',
  }[difficulty] || '#9C27B0';

  return (
    <TouchableOpacity 
      style={[styles.card, { width: cardWidth }]}
      onPress={() => onPress(trail)}
      activeOpacity={0.8}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.image}
            onError={() => console.warn(`Image failed to load: ${imageUrl}`)}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>🥾</Text>
          </View>
        )}
        
        {/* Favorite Button */}
        <TouchableOpacity 
          style={[styles.favoriteBtn, isFavorite && styles.favoriteBtnActive]}
          onPress={() => onFavoritePress?.(trail)}
        >
          <Text style={styles.favoriteBtnText}>{isFavorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>

        {/* Difficulty Badge */}
        <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
          <Text style={styles.difficultyText}>{difficulty}</Text>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {name}
        </Text>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{lengthKm.toFixed(1)} km</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Elevation</Text>
            <Text style={styles.statValue}>{elevationGain} m</Text>
          </View>
        </View>

        {/* Rating */}
        {rating > 0 && (
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ {rating.toFixed(1)}</Text>
          </View>
        )}

        {/* View Details Button */}
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => onPress(trail)}
        >
          <Text style={styles.detailsButtonText}>View Trail →</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  favoriteBtnActive: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  favoriteBtnText: {
    fontSize: 20,
  },
  difficultyBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  ratingContainer: {
    marginBottom: 10,
  },
  rating: {
    fontSize: 13,
    color: '#FF9800',
    fontWeight: '600',
  },
  detailsButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
