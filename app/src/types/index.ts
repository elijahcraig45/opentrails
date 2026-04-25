export interface TrailProperties {
  name: string;
  length_meters: number;
  length_km?: number;
  elevation_gain_meters?: number;
  estimated_difficulty: 'Easy' | 'Moderate' | 'Strenuous';
  difficulty?: 'Easy' | 'Moderate' | 'Strenuous';
  highway?: string;
  surface?: string;
  sac_scale?: string;
  incline?: string;
  wheelchair?: string;
  state?: string;
  rating?: number;
  reviews?: number;
  image_url?: string;
  imgSmall?: string;
  trail_url?: string;
  description?: string;
  dogs_allowed?: boolean;
}

export interface TrailFeature {
  id: string | number;
  type: 'Feature';
  properties: TrailProperties;
  geometry: {
    type: 'LineString' | 'MultiLineString';
    coordinates: any[];
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  name: string;
  crs?: any;
  features: TrailFeature[];
}
