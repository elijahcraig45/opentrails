import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { TrailFeature } from '../types';

// Import MapLibre and react-map-gl only on web
let Map: any = null;
let Source: any = null;
let Layer: any = null;

if (typeof window !== 'undefined') {
  try {
    const mapgl = require('react-map-gl/maplibre');
    Map = mapgl.Map;
    Source = mapgl.Source;
    Layer = mapgl.Layer;
    require('maplibre-gl/dist/maplibre-gl.css');
  } catch (e) {
    console.error('MapLibre setup error:', e);
  }
}

interface MapViewProps {
  trails: TrailFeature[];
  selectedTrail?: TrailFeature | null;
  onTrailPress?: (trail: TrailFeature) => void;
  loading?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  trails,
  selectedTrail,
  onTrailPress,
  loading = false,
}) => {
  // Convert trails to GeoJSON format for MapLibre
  const geojsonData = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: trails.map((trail) => ({
      type: 'Feature' as const,
      id: trail.id,
      geometry: trail.geometry,
      properties: trail.properties,
    })),
  }), [trails]);

  // Calculate paint rules for difficulty colors
  const layerPaint = {
    'line-color': [
      'match',
      ['get', 'estimated_difficulty'],
      'Easy', '#10b981',      // green
      'Moderate', '#f59e0b',  // amber
      'Strenuous', '#ef4444', // red
      '#94a3b8'               // default gray
    ],
    'line-width': 3,
    'line-opacity': 0.8,
  };

  if (!Map || !Source || !Layer) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Map not available</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Map
        initialViewState={{
          longitude: -105.27,
          latitude: 39.5,
          zoom: 7,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://demotiles.maplibre.org/style.json"
      >
        <Source id="trails" type="geojson" data={geojsonData}>
          <Layer
            id="trails-layer"
            type="line"
            paint={layerPaint}
            onClick={(e: any) => {
              if (e.features && e.features.length > 0) {
                const feature = e.features[0];
                const trail = trails.find((t) => t.id === feature.id);
                if (trail && onTrailPress) {
                  onTrailPress(trail);
                }
              }
            }}
          />
        </Source>
      </Map>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    minHeight: 400,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorText: {
    padding: 16,
    fontSize: 14,
    color: '#991b1b',
    textAlign: 'center',
  },
});
