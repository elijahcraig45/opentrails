# OpenTrails - Web App

A React Native web app for discovering hiking trails with interactive search and filtering.

## Quick Start

### 1. Extract trail data (first time only)

```bash
cd ../etl
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python extract_trails.py
```

### 2. Sync trails to app

```bash
cd ../app
npm run sync-trails
```

### 3. Start the app

```bash
npm start
# or npm run web for web specifically
```

The app opens at `http://localhost:8081`

## Features

- 🗺️ **Interactive Map** - Explore 50+ hiking trails in Boulder, CO
- 🔍 **Search** - Find trails by name
- 🎯 **Filter by Difficulty** - Easy, Moderate, or Strenuous
- 📍 **Trail Details** - Click any trail to see: length (miles), difficulty, surface type, accessibility info
- 🎨 **Color-Coded Display** - Easy (green) → Moderate (amber) → Strenuous (red)

## Commands

| Command | What it does |
|---------|------------|
| `npm start` | Start Expo dev server (web) |
| `npm run sync-trails` | Copy GeoJSON from ETL to app |
| `npm exec tsc --noEmit` | Type-check TypeScript |
| `npm exec playwright test` | Run all tests |
| `npm exec playwright test tests/map.spec.ts` | Run specific test |
| `npm exec playwright show-report` | View last test results |

## Data

Trail data flows:
```
ETL extracts from OpenStreetMap
  ↓
seed_data/boulder_trails.geojson
  ↓
npm run sync-trails
  ↓
app/assets/boulder_trails.geojson
  ↓
App renders on map
```

Update ETL → run sync-trails → restart app to see new data.

## Stack

- **Framework:** React Native via Expo
- **Map:** MapLibre GL (open-source Mapbox fork)
- **Data:** GeoJSON from OpenStreetMap
- **Tests:** Playwright (E2E)
- **Language:** TypeScript (strict mode)

## Project Phase

This is **Phase 1 (Foundation)** of OpenTrails. Future phases will add:
- PostGIS backend for advanced spatial queries
- Firebase auth & cloud storage for user data
- Offline map downloads
- GPS tracking & activity recording
- Community notes & photos
- Fediverse integration for data sharing

See [architecture plan](../plans/opentrails-architecture-plan.md) for full roadmap.
