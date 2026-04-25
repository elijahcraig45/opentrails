import React, { useState, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { TrailFeature } from '../types';

const difficultyColors: Record<string, string> = {
  Easy: '#22c55e',
  Moderate: '#f59e0b',
  Strenuous: '#ef4444',
};

interface TrailMapProps {
  data: any; // GeoJSON FeatureCollection
}

// Note: This component can only be rendered on web due to MapLibre dependency
let Map: any, Source: any, Layer: any;
if (typeof window !== 'undefined') {
  try {
    const ReactMapGL = require('react-map-gl/maplibre');
    Map = ReactMapGL.Map;
    Source = ReactMapGL.Source;
    Layer = ReactMapGL.Layer;
    require('maplibre-gl/dist/maplibre-gl.css');
  } catch {
    // MapLibre not available (native platform)
  }
}

export const TrailMap: React.FC<TrailMapProps> = ({ data }) => {
  const [zoom, setZoom] = useState(11);

  if (!Map) {
    return null; // Not on web platform
  }

  // Show clusters at low zoom, individual trails at high zoom
  const showClusters = zoom < 9;

  // Prepare data for clustering
  const clusterData = useMemo(() => {
    if (!showClusters || !data.features) {
      return data;
    }

    return {
      ...data,
      features: data.features,
    };
  }, [data, showClusters]);

  const trailLayerPaint = {
    'line-color': [
      'match',
      ['get', 'estimated_difficulty'],
      'Easy', '#22c55e',
      'Moderate', '#f59e0b',
      'Strenuous', '#ef4444',
      '#888888',
    ],
    'line-width': 3,
    'line-opacity': 0.8,
  };

  // Cluster layer paint for points
  const clusterLayerPaint = {
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      15,
      5, 20,
      10, 25,
      20, 30,
    ],
    'circle-color': [
      'step',
      ['get', 'point_count'],
      '#22c55e',
      5, '#f59e0b',
      10, '#ef4444',
    ],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#fff',
  };

  return (
    <Map
      initialViewState={{
        longitude: -105.28,
        latitude: 39.98,
        zoom: zoom
      }}
      onZoom={(e: any) => setZoom(e.viewState.zoom)}
      style={{ width: '100%', height: '100%' }}
      mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    >
      {showClusters ? (
        <Source 
          id="trails-clustered" 
          type="geojson" 
          data={clusterData}
          cluster={true}
          clusterMaxZoom={8}
          clusterRadius={50}
        >
          <Layer
            id="clusters"
            type="circle"
            filter={['has', 'point_count']}
            paint={clusterLayerPaint}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            filter={['has', 'point_count']}
            layout={{
              'text-field': '{point_count_abbreviated}',
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-size': 12,
            }}
            paint={{
              'text-color': '#fff',
            }}
          />
          <Layer
            id="unclustered-points"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-color': [
                'match',
                ['get', 'estimated_difficulty'],
                'Easy', '#22c55e',
                'Moderate', '#f59e0b',
                'Strenuous', '#ef4444',
                '#888888',
              ],
              'circle-radius': 6,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff',
            }}
          />
        </Source>
      ) : (
        <Source id="trails" type="geojson" data={clusterData}>
          <Layer 
            id="trails-layer" 
            type="line" 
            paint={trailLayerPaint}
          />
        </Source>
      )}
    </Map>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
});
