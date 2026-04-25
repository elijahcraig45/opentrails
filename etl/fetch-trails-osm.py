#!/usr/bin/env python3
"""
OpenTrails - Trail Data ETL from OpenStreetMap

Fetches hiking trails from OpenStreetMap for US states using osmnx.
Calculates elevation gain using OpenTopoData API.
Exports to GeoJSON format for database import.

Usage:
    python fetch-trails-osm.py --state CA --output trails_ca.geojson
    python fetch-trails-osm.py --state CO,CA,WA
"""

import os
import json
import math
import argparse
import requests
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime

try:
    import osmnx as ox
    import geopandas as gpd
    import pandas as pd
    from shapely.geometry import Point, LineString, mapping
except ImportError:
    print("[!] Required packages not found. Install with:")
    print("    pip install osmnx geopandas requests shapely pandas")
    exit(1)

# Configuration
OPENTOPODATA_API = "https://api.opentopodata.org/v1/srtm30m"
DIFFICULTY_MAP = {
    "footway": "Easy",
    "path": "Moderate",
    "track": "Moderate",
}
OUTPUT_DIR = Path(__file__).parent / "trails_data"

# State bounding boxes
STATE_BOUNDS = {
    "CA": {"place": "California, USA", "priority": 1},
    "CO": {"place": "Colorado, USA", "priority": 1},
    "WA": {"place": "Washington, USA", "priority": 1},
    "OR": {"place": "Oregon, USA", "priority": 1},
    "UT": {"place": "Utah, USA", "priority": 2},
    "AZ": {"place": "Arizona, USA", "priority": 2},
    "NV": {"place": "Nevada, USA", "priority": 2},
    "ID": {"place": "Idaho, USA", "priority": 2},
    "WY": {"place": "Wyoming, USA", "priority": 2},
    "MT": {"place": "Montana, USA", "priority": 2},
    "NM": {"place": "New Mexico, USA", "priority": 3},
    "TX": {"place": "Texas, USA", "priority": 3},
}


def get_elevation_gain(coords: List[Tuple[float, float]]) -> float:
    """
    Calculate elevation gain from coordinate list using OpenTopoData API.
    Falls back to heuristic if API fails.
    """
    if len(coords) < 2:
        return 0.0
    
    try:
        # Sample coordinates to stay within API limits
        sample_interval = max(1, len(coords) // 50)
        sampled_coords = coords[::sample_interval]
        
        # Build location string
        locations = "|".join([f"{lat},{lon}" for lat, lon in sampled_coords])
        
        # Query API
        response = requests.get(
            OPENTOPODATA_API,
            params={"locations": locations},
            timeout=10
        )
        
        if response.status_code != 200:
            return calculate_elevation_heuristic(coords)
        
        data = response.json()
        elevations = [result["elevation"] for result in data.get("results", [])]
        
        if len(elevations) < 2:
            return calculate_elevation_heuristic(coords)
        
        # Calculate uphill gain only
        gain = 0
        for i in range(1, len(elevations)):
            diff = elevations[i] - elevations[i-1]
            if diff > 0:
                gain += diff
        
        return round(gain, 2)
        
    except Exception as e:
        print(f"[!] Elevation API error: {e}, using heuristic")
        return calculate_elevation_heuristic(coords)


def calculate_elevation_heuristic(coords: List[Tuple[float, float]]) -> float:
    """Fallback: assume 50m/km for mountain areas."""
    distance_km = 0
    for i in range(1, len(coords)):
        lat1, lon1 = coords[i-1]
        lat2, lon2 = coords[i]
        distance_km += haversine(lat1, lon1, lat2, lon2)
    
    return round(distance_km * 50, 2)


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates in kilometers."""
    R = 6371
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c


def calculate_length(geometry) -> float:
    """Calculate trail length from geometry in meters."""
    if hasattr(geometry, 'length'):
        return round(geometry.length * 111320, 2)
    return 0.0


def fetch_trails_for_state(state_code: str, max_retries: int = 3) -> Optional[gpd.GeoDataFrame]:
    """Fetch hiking trails for a state from OpenStreetMap."""
    if state_code not in STATE_BOUNDS:
        print(f"[!] Unknown state: {state_code}")
        return None
    
    place = STATE_BOUNDS[state_code]["place"]
    
    print(f"[*] Fetching trails for {state_code}...")
    
    for attempt in range(max_retries):
        try:
            tags = {
                "leisure": ["track"],
                "highway": ["path", "footway", "track", "bridleway"],
                "access": "yes"
            }
            
            print(f"    -> Querying OpenStreetMap (attempt {attempt + 1}/{max_retries})...")
            features = ox.features_from_place(place, tags)
            
            if features.empty:
                print(f"    [!] No trails found for {state_code}")
                return None
            
            gdf = gpd.GeoDataFrame(features)
            gdf = gdf[gdf.geometry.type == "LineString"].copy()
            
            if gdf.empty:
                print(f"    [!] No valid trail geometries for {state_code}")
                return None
            
            gdf['difficulty'] = gdf.get('highway', 'path').map(
                lambda x: DIFFICULTY_MAP.get(x, 'Moderate')
            )
            
            print(f"    -> Processing {len(gdf)} trails...")
            gdf['name'] = gdf.get('name', 'Unnamed Trail')
            gdf['length_meters'] = gdf.geometry.apply(calculate_length)
            gdf['state'] = state_code
            gdf['source'] = 'osm'
            gdf['created_at'] = datetime.utcnow().isoformat()
            
            # Calculate elevation (with progress updates)
            elevation_gains = []
            for idx, row in gdf.iterrows():
                coords = list(zip(
                    row.geometry.coords.xy[1],
                    row.geometry.coords.xy[0]
                ))
                gain = get_elevation_gain(coords)
                elevation_gains.append(gain)
                
                if (idx + 1) % 50 == 0:
                    print(f"      [+] {idx + 1}/{len(gdf)} elevation calculated")
            
            gdf['elevation_gain_meters'] = elevation_gains
            
            cols_to_keep = [
                'geometry', 'name', 'difficulty', 'length_meters',
                'elevation_gain_meters', 'surface', 'state', 'source',
                'created_at'
            ]
            gdf = gdf[[col for col in cols_to_keep if col in gdf.columns]]
            
            print(f"[+] {state_code}: {len(gdf)} trails ready")
            return gdf
            
        except Exception as e:
            print(f"    [!] Attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                print(f"    [*] Retrying...")
                import time
                time.sleep(5)
    
    print(f"[!] Failed to fetch {state_code} after {max_retries} attempts")
    return None


def merge_trails(gdfs: List[gpd.GeoDataFrame]) -> gpd.GeoDataFrame:
    """Merge multiple GeoDataFrames of trails."""
    if not gdfs:
        return gpd.GeoDataFrame()
    
    return gpd.GeoDataFrame(
        pd.concat(gdfs, ignore_index=True),
        crs=gdfs[0].crs
    )


def export_to_geojson(gdf: gpd.GeoDataFrame, output_path: Path) -> None:
    """Export GeoDataFrame to GeoJSON format."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    features = []
    for idx, row in gdf.iterrows():
        feature = {
            "type": "Feature",
            "id": idx,
            "geometry": mapping(row.geometry),
            "properties": {
                "name": row.get('name', 'Unnamed Trail'),
                "difficulty": row.get('difficulty', 'Moderate'),
                "length_miles": round(row.get('length_meters', 0) / 1609.34, 2),
                "length_meters": row.get('length_meters', 0),
                "elevation_gain_feet": round(row.get('elevation_gain_meters', 0) * 3.28084, 0),
                "elevation_gain_meters": row.get('elevation_gain_meters', 0),
                "surface": row.get('surface', 'unknown'),
                "state": row.get('state', ''),
                "source": row.get('source', 'osm'),
            }
        }
        features.append(feature)
    
    geojson = {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "total_trails": len(features),
            "created": datetime.utcnow().isoformat(),
            "source": "OpenStreetMap",
        }
    }
    
    with open(output_path, 'w') as f:
        json.dump(geojson, f, indent=2)
    
    print(f"[+] Exported {len(features)} trails to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Fetch US hiking trails from OpenStreetMap")
    parser.add_argument("--state", default="CO", help="State code(s): CA,CO,WA or ALL")
    parser.add_argument("--output", help="Output GeoJSON file")
    parser.add_argument("--priority", type=int, default=1, help="Max priority (1=high, 2=med, 3=low)")
    
    args = parser.parse_args()
    
    # Determine states
    if args.state.upper() == "ALL":
        states = [s for s, v in STATE_BOUNDS.items() if v["priority"] <= args.priority]
    else:
        states = [s.upper().strip() for s in args.state.split(",")]
    
    print("[*] OpenTrails - Trail Data ETL")
    print(f"[*] States: {', '.join(states)}")
    print()
    
    # Fetch trails
    all_gdfs = []
    for state in states:
        gdf = fetch_trails_for_state(state)
        if gdf is not None and not gdf.empty:
            all_gdfs.append(gdf)
    
    if not all_gdfs:
        print("[!] No trails fetched")
        exit(1)
    
    print()
    print("[*] Merging and exporting...")
    merged = merge_trails(all_gdfs)
    
    output_file = args.output or f"trails_{'_'.join(states).lower()}.geojson"
    output_path = OUTPUT_DIR / output_file
    
    export_to_geojson(merged, output_path)
    
    print()
    print("[+] Complete!")
    print(f"    Total trails: {len(merged)}")
    print(f"    States: {', '.join(states)}")
    print(f"    Output: {output_path}")
    print()
    print("[*] Next: Import to database:")
    print(f"    npm run import-trails -- {output_path}")


if __name__ == "__main__":
    main()
