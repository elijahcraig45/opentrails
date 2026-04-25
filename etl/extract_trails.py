import os
import geopandas as gpd
import osmnx as ox
import pandas as pd
from shapely.geometry import LineString, MultiLineString
import numpy as np

def extract_and_process_trails():
    # 1. Define bounding box for Boulder, CO (approximate)
    north, south, east, west = 40.02, 39.95, -105.25, -105.32
    print(f"Extracting OSM data for bounding box: {north}, {south}, {east}, {west}...")

    # 2. Query OSM for hiking paths/trails
    tags = {
        "highway": ["path", "track", "footway"],
        "route": "hiking"
    }
    
    # Download features within the bounding box
    # ox.settings.use_cache = True  # Cache requests to avoid hitting limits
    gdf = ox.features_from_bbox(bbox=(west, south, east, north), tags=tags)

    print(f"Downloaded {len(gdf)} raw features.")

    # 3. Filter for valid line geometries (LineString, MultiLineString)
    trails = gdf[gdf.geometry.type.isin(['LineString', 'MultiLineString'])].copy()
    
    # Drop polygon-like paths or areas just in case
    trails = trails[~trails.geometry.is_empty]

    # 4. Clean and standardize columns
    # OSM data is messy, many tags might be missing.
    cols_to_keep = ['geometry', 'name', 'highway', 'surface', 'sac_scale', 'incline', 'wheelchair']
    existing_cols = [c for c in cols_to_keep if c in trails.columns]
    trails = trails[existing_cols]

    # Fill missing names with 'Unnamed Trail' for grouping purposes
    trails['name'] = trails['name'].fillna('Unnamed Trail')

    print("Dissolving fragmented trail segments by name...")

    # 5. DISSOLVE fragmented segments into continuous Linestrings
    # This combines segments that share the same name into a single MultiLineString
    # We use aggfunc='first' for metadata columns to just take the first available tag value
    agg_dict = {col: 'first' for col in trails.columns if col not in ['geometry', 'name']}
    dissolved_trails = trails.dissolve(by='name', aggfunc=agg_dict).reset_index()
    
    # Also calculate basic trail length in meters (approximation using UTM projection)
    # Project to a suitable CRS for meters (e.g., EPSG:32613 for Colorado)
    dissolved_trails_proj = dissolved_trails.to_crs(epsg=32613)
    dissolved_trails['length_meters'] = dissolved_trails_proj.geometry.length
    
    # Estimate elevation gain (simplified heuristic: ~50m per km for Colorado)
    # In production, we'd use actual DEM data
    dissolved_trails['elevation_gain_meters'] = (dissolved_trails['length_meters'] / 1000) * 50
    
    # Optional: Basic difficulty heuristic (placeholder for full Tobler's function with DEM)
    def estimate_difficulty(row):
        if pd.isna(row.get('sac_scale')):
            # Guess based on length if sac_scale missing
            if row['length_meters'] > 8000:
                return 'Strenuous'
            elif row['length_meters'] > 3000:
                return 'Moderate'
            else:
                return 'Easy'
        else:
            return row['sac_scale']

    dissolved_trails['estimated_difficulty'] = dissolved_trails.apply(estimate_difficulty, axis=1)

    print(f"Processed into {len(dissolved_trails)} continuous trail routes.")

    # 6. Export to GeoJSON for local testing
    output_dir = os.path.join(os.path.dirname(__file__), "..", "seed_data")
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, "boulder_trails.geojson")
    
    # GeoJSON doesn't handle pandas NA well sometimes, replace them
    dissolved_trails = dissolved_trails.fillna('')

    dissolved_trails.to_file(output_file, driver="GeoJSON")
    print(f"Successfully saved seed data to {output_file}")

if __name__ == "__main__":
    extract_and_process_trails()
