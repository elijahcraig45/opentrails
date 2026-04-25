import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FilterButtonsProps {
  difficulties: Array<'Easy' | 'Moderate' | 'Strenuous' | 'All'>;
  selectedDifficulty: string | null;
  onDifficultyChange: (difficulty: string | null) => void;
}

export const FilterButtons: React.FC<FilterButtonsProps> = ({
  difficulties,
  selectedDifficulty,
  onDifficultyChange,
}) => {
  const getDifficultyColor = (difficulty: string): { bg: string; text: string } => {
    switch (difficulty) {
      case 'Easy': return { bg: '#22c55e', text: '#fff' };
      case 'Moderate': return { bg: '#f59e0b', text: '#fff' };
      case 'Strenuous': return { bg: '#ef4444', text: '#fff' };
      default: return { bg: '#f3f4f6', text: '#1f2937' };
    }
  };

  return (
    <View style={styles.filterContainer}>
      <Text style={styles.filterLabel}>Difficulty</Text>
      <View style={styles.buttonRow}>
        {difficulties.map((diff) => {
          const isSelected = selectedDifficulty === diff;
          const colors = getDifficultyColor(diff);
          
          return (
            <TouchableOpacity
              key={diff}
              style={[
                styles.filterButton,
                isSelected && {
                  backgroundColor: colors.bg,
                  borderColor: colors.bg,
                }
              ]}
              onPress={() => onDifficultyChange(selectedDifficulty === diff ? null : diff)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterButtonText,
                isSelected && { color: colors.text }
              ]}>
                {diff}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    marginBottom: 0,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  filterButtonText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
  },
});
