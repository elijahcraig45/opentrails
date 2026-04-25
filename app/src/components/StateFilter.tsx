import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';

interface StateFilterProps {
  states: string[];
  selectedState: string | null;
  onStateChange: (state: string | null) => void;
}

export const StateFilter: React.FC<StateFilterProps> = ({
  states,
  selectedState,
  onStateChange,
}) => {
  if (!states || states.length === 0) {
    return null;
  }

  return (
    <View style={styles.filterContainer}>
      <Text style={styles.filterLabel}>State</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            !selectedState && styles.filterButtonActive,
          ]}
          onPress={() => onStateChange(null)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.filterButtonText,
            !selectedState && styles.filterButtonTextActive,
          ]}>
            All
          </Text>
        </TouchableOpacity>
        {states.map((state) => (
          <TouchableOpacity
            key={state}
            style={[
              styles.filterButton,
              selectedState === state && styles.filterButtonActive,
            ]}
            onPress={() => onStateChange(selectedState === state ? null : state)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterButtonText,
              selectedState === state && styles.filterButtonTextActive,
            ]}>
              {state}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollView: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    marginRight: 6,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  filterButtonActive: {
    borderColor: '#667eea',
    backgroundColor: '#667eea',
  },
  filterButtonText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
});
