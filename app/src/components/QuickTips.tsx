import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

interface QuickTipsProps {
  totalTrails: number;
  totalStates: number;
}

export const QuickTips: React.FC<QuickTipsProps> = ({
  totalTrails,
  totalStates,
}) => {
  const tips = [
    { emoji: '🎯', text: 'Use filters to narrow down choices' },
    { emoji: '🔄', text: 'Click "New" for random suggestions' },
    { emoji: '📍', text: 'Select a state to explore locally' },
    { emoji: '⭐', text: 'Featured trails are highly rated' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💡 Quick Tips</Text>
      <View style={styles.tipsGrid}>
        {tips.map((tip, idx) => (
          <View key={idx} style={styles.tipCard}>
            <Text style={styles.tipEmoji}>{tip.emoji}</Text>
            <Text style={styles.tipText}>{tip.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    marginTop: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
  },
  tipsGrid: {
    gap: 8,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#667eea',
  },
  tipEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
});
