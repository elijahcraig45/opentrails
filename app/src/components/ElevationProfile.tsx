import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { View, StyleSheet, Text } from 'react-native';

interface ElevationPoint {
  distance: number; // km from start
  elevation: number; // meters
}

interface ElevationProfileProps {
  title?: string;
  coordinates: Array<[number, number]>; // [lon, lat] pairs
  totalElevationGain?: number; // in meters
  width?: number | string;
  height?: number;
}

/**
 * ElevationProfile Component
 * Displays elevation changes over distance along a trail
 *
 * Note: This is a simplified version that assumes linearly increasing elevation.
 * For real elevation data, you would need elevation data at each coordinate point
 * (from a DEM or elevation API like USGS or SRTM).
 */
export const ElevationProfile: React.FC<ElevationProfileProps> = ({
  title = 'Elevation Profile',
  coordinates,
  totalElevationGain = 0,
  width = '100%',
  height = 300,
}) => {
  const elevationData = useMemo(() => {
    if (!coordinates || coordinates.length < 2) {
      return [];
    }

    // Calculate distance along the route
    let cumulativeDistance = 0;
    const data: ElevationPoint[] = [];

    // Simple elevation calculation: linearly distribute elevation gain over route
    const elevationPerKm = totalElevationGain / calculateTotalDistance(coordinates);

    coordinates.forEach((coord, idx) => {
      if (idx > 0) {
        const prevCoord = coordinates[idx - 1];
        const segmentDistance = calculateDistance(
          prevCoord[1],
          prevCoord[0],
          coord[1],
          coord[0]
        );
        cumulativeDistance += segmentDistance;
      }

      data.push({
        distance: parseFloat(cumulativeDistance.toFixed(2)),
        elevation: parseFloat((cumulativeDistance * elevationPerKm).toFixed(0)),
      });
    });

    return data;
  }, [coordinates, totalElevationGain]);

  if (elevationData.length < 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No elevation data available</Text>
      </View>
    );
  }

  const maxElevation = Math.max(...elevationData.map((d) => d.elevation));
  const minElevation = Math.min(...elevationData.map((d) => d.elevation));
  const totalDistance = elevationData[elevationData.length - 1].distance;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Distance</Text>
          <Text style={styles.statValue}>{totalDistance.toFixed(1)} km</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Elevation Gain</Text>
          <Text style={styles.statValue}>{totalElevationGain} m</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Max Elevation</Text>
          <Text style={styles.statValue}>{maxElevation} m</Text>
        </View>
      </View>

      <ResponsiveContainer width={Number(width)} height={height}>
        <LineChart
          data={elevationData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="distance"
            label={{ value: 'Distance (km)', position: 'insideBottomRight', offset: -5 }}
            stroke="#666"
          />
          <YAxis
            label={{ value: 'Elevation (m)', angle: -90, position: 'insideLeft' }}
            stroke="#666"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: 4,
            }}
            formatter={(value) => [`${value} m`, 'Elevation']}
            labelFormatter={(value) => `${value} km`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="elevation"
            name="Elevation"
            stroke="#8884d8"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </View>
  );
};

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1, lon1 - Start point
 * @param lat2, lon2 - End point
 * @returns Distance in km
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate total distance of a route
 */
function calculateTotalDistance(coordinates: Array<[number, number]>): number {
  let total = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const prevCoord = coordinates[i - 1];
    const currCoord = coordinates[i];
    total += calculateDistance(prevCoord[1], prevCoord[0], currCoord[1], currCoord[0]);
  }
  return total;
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  message: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
});
