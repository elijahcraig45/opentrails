import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

interface HeroSectionProps {
  totalTrails: number;
  totalStates: number;
  onExplore?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  totalTrails,
  totalStates,
  onExplore
}) => {
  return (
    <View style={styles.hero}>
      <View style={styles.content}>
        <Text style={styles.logo}>🥾</Text>
        <Text style={styles.title}>OpenTrails</Text>
        <Text style={styles.subtitle}>Discover Your Next Adventure</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{totalTrails}</Text>
            <Text style={styles.statLabel}>Trails</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{totalStates}</Text>
            <Text style={styles.statLabel}>States</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={onExplore}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>✨ Explore Trails</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    backgroundColor: '#667eea',
    paddingVertical: 28,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 20,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 12,
  },
  ctaButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea',
  },
});
