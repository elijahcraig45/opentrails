import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { TrailFeature } from '../types';

const isWeb = typeof window !== 'undefined';

interface TrailDetailPageProps {
  trail: TrailFeature;
  onClose: () => void;
  onStartActivity?: () => void;
  isFavorite?: boolean;
  onFavoritePress?: () => void;
}

export function TrailDetailPage({
  trail,
  onClose,
  onStartActivity,
  isFavorite = false,
  onFavoritePress,
}: TrailDetailPageProps) {
  const properties = trail.properties || {};
  const name = properties.name || 'Unnamed Trail';
  const difficulty = properties.estimated_difficulty || properties.difficulty || 'Easy';
  const length = properties.length_meters || properties.length_km || 0;
  const lengthKm = typeof length === 'number' && length > 100 ? length / 1000 : length;
  const elevation = properties.elevation_gain_meters || 0;
  const rating = properties.rating || 0;
  const reviews = properties.reviews || 0;
  const surface = properties.surface || 'Unknown';
  const imageUrl = properties.image_url || properties.imgSmall;
  const trailUrl = properties.trail_url;

  const difficultyColor = {
    Easy: '#4CAF50',
    Moderate: '#FFC107',
    Strenuous: '#F44336',
  }[difficulty] || '#9C27B0';

  // Create a quick stats object
  const stats = useMemo(() => [
    { label: 'Distance', value: `${lengthKm.toFixed(1)} km`, icon: '📏' },
    { label: 'Elevation', value: `${elevation} m`, icon: '⛰️' },
    { label: 'Difficulty', value: difficulty, icon: '🎯' },
    { label: 'Surface', value: surface, icon: '🌄' },
  ], [lengthKm, elevation, difficulty, surface]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Close Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onFavoritePress} style={styles.favoriteButton}>
            <Text style={styles.favoriteBtnText}>{isFavorite ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.heroImage}
              onError={() => console.warn(`Image failed: ${imageUrl}`)}
            />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Text style={styles.placeholderText}>🥾</Text>
            </View>
          )}
          <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
            <Text style={styles.difficultyText}>{difficulty}</Text>
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{name}</Text>
          {rating > 0 && (
            <View style={styles.ratingSection}>
              <Text style={styles.rating}>⭐ {rating.toFixed(1)}</Text>
              {reviews > 0 && <Text style={styles.reviews}>({reviews} reviews)</Text>}
            </View>
          )}
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, idx) => (
            <View key={idx} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This Trail</Text>
          <Text style={styles.description}>
            {properties.description ||
              'A scenic trail offering beautiful views and varying terrain. Perfect for hikers of all experience levels.'}
          </Text>
        </View>

        {/* Amenities/Features */}
        {(properties.wheelchair || properties.dogs_allowed) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesContainer}>
              {properties.wheelchair && (
                <View style={styles.amenityTag}>
                  <Text style={styles.amenityText}>♿ Wheelchair Accessible</Text>
                </View>
              )}
              {properties.dogs_allowed && (
                <View style={styles.amenityTag}>
                  <Text style={styles.amenityText}>🐕 Dogs Allowed</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={onStartActivity}
          >
            <Text style={styles.primaryButtonText}>Start Activity</Text>
          </TouchableOpacity>

          {trailUrl && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => {
                if (isWeb && trailUrl) {
                  window.open(trailUrl, '_blank');
                }
              }}
            >
              <Text style={styles.secondaryButtonText}>View on Hiking Project →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBtnText: {
    fontSize: 20,
  },
  heroContainer: {
    position: 'relative',
    width: '100%',
    height: 280,
    backgroundColor: '#f0f0f0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroPlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 80,
  },
  difficultyBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    lineHeight: 32,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    fontSize: 16,
    color: '#FF9800',
    fontWeight: '700',
    marginRight: 8,
  },
  reviews: {
    fontSize: 14,
    color: '#999',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  statCard: {
    width: '50%',
    paddingHorizontal: 4,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityTag: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  amenityText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  actionsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: 40,
  },
});
