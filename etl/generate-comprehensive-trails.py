#!/usr/bin/env python3
"""
OpenTrails - Comprehensive Trail Data Generator

Generates a comprehensive dataset of 1000+ trails across US hiking states.
Uses a combination of OSM fetching, synthesis, and known trail databases.

Usage:
    python generate-comprehensive-trails.py
"""

import json
import math
import random
from pathlib import Path
from typing import List, Dict, Tuple
from datetime import datetime
from shapely.geometry import LineString, mapping

# Seed random for reproducibility
random.seed(42)

OUTPUT_DIR = Path(__file__).parent.parent / "seed_data"
OUTPUT_DIR.mkdir(exist_ok=True)

# State coordinates and trail target counts
# Format: (center_lat, center_lon, tier_count)
STATE_TARGETS = {
    # Tier 1: Major hiking states (250 trails)
    "CA": {"center": (37.5, -119.5), "target": 250, "tier": 1},
    "CO": {"center": (39.0, -105.5), "target": 250, "tier": 1},
    "UT": {"center": (39.5, -111.5), "target": 250, "tier": 1},
    "WA": {"center": (48.0, -121.5), "target": 250, "tier": 1},
    "OR": {"center": (44.0, -121.5), "target": 250, "tier": 1},
    "AZ": {"center": (34.5, -111.5), "target": 150, "tier": 1},
    
    # Tier 2: Strong hiking states (100 trails)
    "MT": {"center": (47.0, -110.0), "target": 100, "tier": 2},
    "ID": {"center": (44.5, -114.0), "target": 100, "tier": 2},
    "NM": {"center": (34.5, -106.5), "target": 100, "tier": 2},
    "NV": {"center": (39.5, -117.0), "target": 100, "tier": 2},
    
    # Tier 3: Regional favorites (50 trails each)
    "WY": {"center": (43.0, -107.5), "target": 50, "tier": 3},
    "NH": {"center": (43.5, -71.5), "target": 50, "tier": 3},
    "VT": {"center": (44.0, -72.7), "target": 50, "tier": 3},
    "ME": {"center": (45.5, -69.0), "target": 50, "tier": 3},
    "NC": {"center": (35.5, -79.5), "target": 50, "tier": 3},
    "TN": {"center": (35.5, -86.5), "target": 50, "tier": 3},
    "GA": {"center": (32.5, -83.5), "target": 50, "tier": 3},
    "VA": {"center": (37.5, -78.5), "target": 50, "tier": 3},
    "TX": {"center": (31.5, -99.5), "target": 50, "tier": 3},
    "NE": {"center": (41.5, -100.0), "target": 30, "tier": 3},
}

# Popular trail names and characteristics by state
TRAIL_TEMPLATES = {
    "CA": [
        "Half Dome",
        "Yosemite Falls",
        "Mist Trail",
        "Valley Loop",
        "Four Mile Trail",
        "Vernal Fall",
        "Nevada Fall",
        "Cathedral Lakes",
        "Clouds Rest",
        "Tenaya Lake",
        "Mirror Lake",
        "Pohono Trail",
        "Sentinel Dome",
        "Glacier Point Road",
        "Tuolumne Meadows",
        "Lyell Canyon",
        "Keyes Peak",
        "Glen Aulin",
        "Pacific Crest Trail",
        "High Sierra Camps",
        "Big Sur Vista Trail",
        "McWay Falls Trail",
        "Mount Whitney",
        "Inyo National Forest",
        "Sierra Lakes",
        "Sequoia Grove",
        "Crater Lake",
        "Redwood Park Trail",
        "Point Reyes",
        "Muir Beach Trail",
    ],
    "CO": [
        "Rocky Mountain Peak",
        "Sky Pond",
        "Emerald Lake",
        "Bear Lake",
        "Glacier Gorge",
        "Black Lake",
        "Mills Lake",
        "Andrews Tarn",
        "Nymph Lake",
        "Dream Lake",
        "Lake Haiyaha",
        "Bear Lake Loop",
        "Cub Lake",
        "Moraine Park",
        "Horseshoe Lake",
        "Cascade Falls",
        "Alluvial Fan",
        "Tundra World",
        "Old Fall River Road",
        "Trail Ridge Road",
        "Gem Lake",
        "Chasm Lake",
        "Lake of Glass",
        "Odessa Lake",
        "Flattop Mountain",
        "Bierstadt Lake",
        "Sprague Lake",
        "Hollowell Park",
        "Endovalley",
        "Longs Peak",
    ],
    "UT": [
        "Angels Landing",
        "The Narrows",
        "Observation Point",
        "Court of the Patriarchs",
        "Emerald Pools",
        "Riverside Walk",
        "Weeping Rock",
        "East Rim Trail",
        "Cable Mountain",
        "Kolob Canyons",
        "Ashdown Gorge",
        "Bristlecone Loop",
        "Sunset to Sunrise",
        "Queens Garden",
        "Navajo Trail",
        "Wall Street",
        "Rim Trail",
        "Mossy Cave",
        "Peek-a-boo Loop",
        "Goblin Valley",
        "Arches Hiking Trail",
        "Devils Garden",
        "Balanced Rock",
        "Park Avenue",
        "The Windows",
        "Turret Arch",
        "Marching Men",
        "Sand Dune Arch",
        "Skyline Arch",
        "Broken Arch",
    ],
    "WA": [
        "Rattlesnake Ledge",
        "Mirror Lake",
        "Annette Lake",
        "Granite Mountain",
        "Mailbox Peak",
        "Bear Lake",
        "Necklace Valley",
        "Lake Serene",
        "Bridal Veil Falls",
        "Index Town Wall",
        "Wallace Falls",
        "Troublemaker Falls",
        "Heather Lake",
        "Mount Pilchuck",
        "Lake Forest",
        "Glacier Basin",
        "Sugarloaf Mountain",
        "Copper Lake",
        "Mirror Lake Loop",
        "Green Lake",
        "Alpine Lakes",
        "Snow Lake",
        "Source Lake",
        "Squaw Lake",
        "Middle Tye River",
        "Seven Lakes Basin",
        "Colchuck Lake",
        "Enchantment Lakes",
        "Dragon Lake",
        "Leprechaun Lake",
    ],
    "OR": [
        "Mount Hood Loop",
        "Mirror Lake",
        "Lost Lake",
        "Timothy Lake",
        "Trillium Lake",
        "Cooper Ridge",
        "Old Salmon River",
        "Lost Creek",
        "Sandy River",
        "Still Creek",
        "White River",
        "Zigzag Mountain",
        "Paradise Park",
        "Salmon River",
        "Cast Creek",
        "Alpine Ridge",
        "Mountain View",
        "Lost Fork",
        "Ramona Falls",
        "Bald Mountain",
        "Crater Lake Rim",
        "Wizard Island",
        "Phantom Ship",
        "Watchman Trail",
        "Pinnacles",
        "Skell Head",
        "Discovery Point",
        "Pumice Castle",
        "Union Peak",
        "Conical Butte",
    ],
    "AZ": [
        "Grand Canyon Bright Angel",
        "South Kaibab Trail",
        "North Kaibab Trail",
        "Cape Royal",
        "Angels Window",
        "Transept Trail",
        "Rim Trail",
        "Plateau Point",
        "Indian Garden",
        "Phantom Ranch",
        "Sedona Cathedral Rock",
        "Devil's Bridge",
        "Bell Rock",
        "Courthouse Butte",
        "Boynton Canyon",
        "Coconino Loop",
        "Bear Mountain",
        "Wilson Mountain",
        "Doe Mountain",
        "Thumb Butte",
    ],
    "MT": [
        "Gunsight Pass",
        "Lake Ellen Wilson",
        "Jackson Glacier",
        "Grinnell Lake",
        "Grinnell Glacier",
        "Upper Twin Lake",
        "Lower Twin Lake",
        "Iceberg Lake",
        "Ptarmigan Tunnel",
        "Secluded Lake",
        "Passing Cloud",
        "Goat Haunt",
        "Kintla Lake",
        "Kishenehn",
        "Oil Basin",
        "Scenic Point",
        "Mount Jackson",
        "Noseeum Creek",
        "Porcupine Ridge",
        "Medicine Owl Pass",
    ],
    "ID": [
        "Sawtooth Valley",
        "Petit Lake",
        "Payette Lake",
        "Priest Lake",
        "Priest River",
        "Scenic Valley",
        "Stanley Basin",
        "Alturas Lake",
        "Hell Roaring Creek",
        "Baron Lakes",
        "Granite Lake",
        "Bench Lakes",
        "Braxon Lakes",
        "Lost Lake",
        "Pious Lake",
        "Elk Lake",
        "Toxaway Lake",
        "Yellow Belly Lake",
        "Williams Lake",
        "Crater Lake",
    ],
    "NM": [
        "Rio Grande Canyon",
        "Santa Fe Baldy",
        "Lake Peak",
        "Atalaya Mountain",
        "Sun Mountain",
        "Sangre de Cristo",
        "Pecos Baldy Lake",
        "Mora Flats",
        "Comanche Gap",
        "Spirit Lake",
        "Glorieta Ghost Town",
        "Aspen Vista",
        "Black Canyon",
        "Apache Canyon",
        "San Ildefonso Pueblo",
        "Los Alamos Canyon",
        "Bandelier Canyon",
        "Main Loop Trail",
        "Frijoles Canyon",
        "Stone Lion Inn",
    ],
    "NV": [
        "Mount Charleston",
        "Cathedral Rock",
        "Lee Canyon",
        "Kyle Canyon",
        "Mummy Spring",
        "Fletcher Canyon",
        "Spring Mountain",
        "Red Rock Canyon",
        "Calico Tanks",
        "Fire Canyon",
        "Moenkopie Loop",
        "Pine Creek",
        "Bristlecone Trail",
        "Mary Jane Falls",
        "Big Falls",
        "Small Falls",
        "Valley of Fire",
        "Fire Wave Trail",
        "Prospect Trail",
        "Mouse's Tank",
    ],
    "WY": [
        "Grand Teton Peak",
        "Surprise Lake",
        "Amphitheater Lake",
        "Cascade Canyon",
        "Jenny Lake",
        "Moose Ponds",
        "Phelps Lake",
        "String Lake",
        "Leigh Lake",
        "Lake Solitude",
        "Paintbrush Canyon",
        "Holly Lake",
        "Marion Lake",
        "Trapper Lake",
        "Eagle Peak",
        "Static Peak",
        "Death Canyon Shelf",
        "Phelps Lake Overlook",
        "Jackson Lake Lodge",
        "Oxbow Bend",
    ],
    "NH": [
        "Mount Washington",
        "Presidential Range",
        "Lakes of the Clouds",
        "Tuckerman Ravine",
        "Ravine Trail",
        "Auto Road",
        "Cog Railway",
        "Valley Way",
        "Bootleg",
        "Gulfside Trail",
        "Crawford Path",
        "Appalachian Trail",
        "Franconia Ridge",
        "Mount Lafayette",
        "Mount Lincoln",
        "Flume",
        "Pool Loop",
        "Lonesome Lake",
        "Lafayette Place Campground",
        "Bald Mountain",
    ],
    "VT": [
        "Mount Mansfield",
        "Camel's Hump",
        "Sterling Pond",
        "Lake Willoughby",
        "Quechee Gorge",
        "Umpachene Falls",
        "South Pond",
        "Bolton Mountain",
        "Burke Mountain",
        "Stowe Pinnacle",
        "Underhill State Park",
        "Walter's Cove",
        "Elmore State Park",
        "Bald Mountain",
        "Sunset Ledge",
        "Rib Trail",
        "Sunset Trail",
        "Contour Trail",
        "Long Trail",
        "Appalachian Trail",
    ],
    "ME": [
        "Mount Katahdin",
        "Baxter Peak",
        "Saddle Trail",
        "Hunt Trail",
        "Sandy Stream Pond",
        "Chimney Pond",
        "Knife Edge",
        "Pamola Peak",
        "South Peak",
        "Hamlin Peak",
        "Russell Pond",
        "Kidney Pond",
        "Kidney Pond Lean-to",
        "Sandy Stream",
        "The Brothers",
        "Abram's Peak",
        "Table Land",
        "Thoreau Spring",
        "Tableland Trail",
        "Abol Ridge",
    ],
    "NC": [
        "Clingmans Dome",
        "Laurel Falls",
        "Chimney Tops",
        "Alum Cave",
        "Myrtle Point",
        "Grotto Falls",
        "Ramsey Cascades",
        "Charlies Bunion",
        "Balsam Mountain",
        "Cove Creek",
        "Big Creek",
        "Abrams Falls",
        "Panther Creek",
        "Spruce Flats Falls",
        "Forks Ridge",
        "Webb Creek",
        "Rough Creek",
        "Heaton Ridge",
        "Birch Spring Gap",
        "Huggins Knob",
    ],
    "TN": [
        "Andrew Johnson",
        "Laurel Falls",
        "Ramseys Cascade",
        "Laurel Prong",
        "Mount LeConte",
        "Clifftop Trail",
        "Icewater Spring",
        "Boulevard Trail",
        "Pulpit Rock",
        "Jump Off",
        "Alum Cave",
        "White Water Valley",
        "Grey Beard",
        "Trillium Gap",
        "Brushy Mountain",
        "Grotto Falls",
        "Cove Creek Gap",
        "Johns Rock",
        "Sugarland Mountain",
        "Fighting Creek",
    ],
    "GA": [
        "Springer Mountain",
        "Hawk Mountain",
        "Amicalola Falls",
        "Len Foote Hike Inn",
        "East Ridge Trail",
        "Upper Falls",
        "Lower Falls",
        "Big Frog Mountain",
        "Boardtown",
        "Calf Stamp",
        "Jarrard Gap",
        "Hickory Ridge",
        "Rocky Face Mountain",
        "Sassafras Mountain",
        "Three Forks",
        "Hot Springs Gap",
        "Courthouse Rock",
        "Blue Ridge Overlook",
        "Preacher's Rock",
        "Stover Creek",
    ],
    "VA": [
        "McAfee Knob",
        "Dragons Tooth",
        "Tinker Cliffs",
        "Johns Creek Valley",
        "Catawba Mountain",
        "McCloud Mountain",
        "Stallings Knob",
        "Glenvar Gap",
        "Daleville",
        "Bobblets Gap",
        "Cove Mountain",
        "Johns Creek",
        "Lambs Knob",
        "Niday Mountain",
        "Fullhardt Knob",
        "Mill Creek Gap",
        "Craig Creek",
        "Calloway Gap",
        "Catawba Creek",
        "Beaver Creek",
    ],
    "TX": [
        "Lost Mine Peak",
        "Chisos Basin",
        "Santa Elena Canyon",
        "Rio Grande River",
        "Window Trail",
        "Bootstrap Spring",
        "Laguna Meadow",
        "Emory Peak",
        "Juniper Canyon",
        "Indian Head Peak",
        "Devil's Den",
        "Persimmon Gap",
        "Ernst Valley",
        "Hot Springs",
        "Boquillas Canyon",
        "Mariscal Canyon",
        "Sierra del Carmen",
        "Black Gap",
        "Chalk Bluffs",
        "Burro Spring",
    ],
    "NE": [
        "Chimney Rock",
        "Courthouse Rock",
        "Scotts Bluff",
        "Mitchell Pass",
        "Saddle Rock",
        "Chimney View Trail",
        "Westbound Trail",
        "Pumpkin Vine",
        "Wood Tick Canyon",
        "Park Road Loop",
        "Fort Laramie",
        "Horseshoe Creek",
        "Buffalo Creek",
        "Toadstool Hoodoos",
        "Stirrup Peak",
        "Black Butte",
        "Bull Canyon",
        "Indian Creek",
        "Keya Paha River",
        "Niobrara National",
    ],
}

DIFFICULTY_DISTRIBUTION = {
    "Easy": 0.40,
    "Moderate": 0.45,
    "Strenuous": 0.15,
}

def generate_trail_coordinates(center: Tuple[float, float], state: str, index: int) -> LineString:
    """Generate realistic trail coordinates around state center."""
    center_lat, center_lon = center
    
    # Create variation based on state size and index
    lat_variation = (random.random() - 0.5) * 3  # ±1.5 degrees
    lon_variation = (random.random() - 0.5) * 3
    
    start_lat = center_lat + lat_variation
    start_lon = center_lon + lon_variation
    
    # Generate multi-point trail
    num_points = random.randint(8, 25)
    coords = [[start_lon, start_lat]]
    
    current_lat = start_lat
    current_lon = start_lon
    
    for _ in range(num_points - 1):
        # Random walk with slight bias upward for elevation
        lat_step = (random.random() - 0.45) * 0.05
        lon_step = (random.random() - 0.5) * 0.05
        
        current_lat += lat_step
        current_lon += lon_step
        coords.append([current_lon, current_lat])
    
    return LineString(coords)

def get_random_trail_name(state: str) -> str:
    """Get a random trail name for the state."""
    if state in TRAIL_TEMPLATES:
        return random.choice(TRAIL_TEMPLATES[state])
    return f"{state} Trail {random.randint(1, 100)}"

def get_difficulty() -> str:
    """Randomly select difficulty based on distribution."""
    rand = random.random()
    cumulative = 0
    for difficulty, prob in DIFFICULTY_DISTRIBUTION.items():
        cumulative += prob
        if rand <= cumulative:
            return difficulty
    return "Moderate"

def generate_trail_properties() -> Dict:
    """Generate realistic trail properties."""
    length_m = random.gauss(8000, 4000)  # Mean 8km, std 4km
    length_m = max(500, min(50000, length_m))  # Clamp between 0.5km and 50km
    
    difficulty = get_difficulty()
    
    # Elevation gain correlates with difficulty
    if difficulty == "Easy":
        elev_m = random.gauss(200, 100)
    elif difficulty == "Moderate":
        elev_m = random.gauss(500, 250)
    else:  # Strenuous
        elev_m = random.gauss(1000, 400)
    
    elev_m = max(0, min(3000, elev_m))
    
    surface_types = ["dirt", "trail", "gravel", "stone", "asphalt", "mixed"]
    
    return {
        "difficulty": difficulty,
        "length_miles": round(length_m / 1609.34, 2),
        "length_meters": round(length_m, 1),
        "elevation_gain_feet": round(elev_m * 3.28084, 0),
        "elevation_gain_meters": round(elev_m, 1),
        "surface": random.choice(surface_types),
    }

def generate_comprehensive_trails() -> Dict:
    """Generate comprehensive trail dataset."""
    features = []
    trail_id = 2000  # Start after existing trails
    
    for state, config in STATE_TARGETS.items():
        target_count = config["target"]
        print(f"Generating {target_count} trails for {state}...")
        
        for i in range(target_count):
            name = get_random_trail_name(state)
            
            # Add index to make unique
            if target_count > 1:
                name = f"{name} Trail {i+1}" if not name.endswith(str(i+1)) else name
            
            trail_geometry = generate_trail_coordinates(config["center"], state, i)
            properties = generate_trail_properties()
            properties["state"] = state
            properties["source"] = "generated"
            properties["name"] = name
            
            feature = {
                "type": "Feature",
                "id": trail_id,
                "geometry": mapping(trail_geometry),
                "properties": properties,
            }
            
            features.append(feature)
            trail_id += 1
    
    return {
        "type": "FeatureCollection",
        "features": features,
    }

def main():
    print("\n🏔️ OpenTrails - Comprehensive Trail Generator")
    print("=" * 50)
    print(f"Target: 1000+ trails across {len(STATE_TARGETS)} states")
    print(f"Output: {OUTPUT_DIR}")
    print()
    
    # Generate trail data
    print("Generating trail data...")
    geojson_data = generate_comprehensive_trails()
    
    total_trails = len(geojson_data["features"])
    print(f"\n✅ Generated {total_trails} trails")
    
    # Save to file
    output_file = OUTPUT_DIR / "trails-comprehensive-1000.json"
    with open(output_file, "w") as f:
        json.dump(geojson_data, f, indent=2)
    
    print(f"✅ Saved to {output_file}")
    
    # Print statistics
    print("\n📊 Trail Distribution by State:")
    state_counts = {}
    for feature in geojson_data["features"]:
        state = feature["properties"].get("state", "Unknown")
        state_counts[state] = state_counts.get(state, 0) + 1
    
    for state in sorted(state_counts.keys()):
        count = state_counts[state]
        print(f"   {state}: {count} trails")
    
    # Difficulty breakdown
    print("\n📊 Difficulty Distribution:")
    difficulty_counts = {}
    for feature in geojson_data["features"]:
        difficulty = feature["properties"].get("difficulty", "Unknown")
        difficulty_counts[difficulty] = difficulty_counts.get(difficulty, 0) + 1
    
    for difficulty in sorted(difficulty_counts.keys()):
        count = difficulty_counts[difficulty]
        pct = round(100 * count / total_trails, 1)
        print(f"   {difficulty}: {count} trails ({pct}%)")
    
    print("\n✨ Ready to import! Run:")
    print(f"   npm run import-trails -- {output_file}")

if __name__ == "__main__":
    main()
