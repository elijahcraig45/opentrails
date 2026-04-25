# OpenTrails API Documentation

A REST API for discovering and tracking hiking trails with spatial queries, user activities, and community features.

## Base URL
```
http://localhost:3001
```

## Database
- **SQLite** local database with 144 imported trails from Boulder, CO
- **Location**: `api/opentrails.db` (auto-created on first run)
- **Auto-import**: GeoJSON data imported from `app/assets/boulder_trails.geojson` on startup

## Endpoints

### Trail Discovery

#### GET `/api/trails`
Get all trails with optional filtering.

**Query Parameters:**
- `difficulty` - Filter by difficulty: `Easy`, `Moderate`, `demanding_mountain_hiking`, `hiking`, `mountain_hiking`
- `minLength` - Minimum length in miles
- `maxLength` - Maximum length in miles
- `minElevation` - Minimum elevation gain in meters
- `maxElevation` - Maximum elevation gain in meters
- `search` - Search by trail name (substring match, case-insensitive)
- `lat`, `lon`, `radiusKm` - Get trails within radius (km) of coordinates

**Example:**
```bash
curl "http://localhost:3001/api/trails?difficulty=Easy&maxLength=2&search=creek"
```

**Response:**
```json
{
  "type": "FeatureCollection",
  "count": 3,
  "features": [
    {
      "type": "Feature",
      "id": 1,
      "properties": {
        "name": "Boulder Creek Path",
        "difficulty": "Easy",
        "length_meters": 1234.5,
        "elevation_gain_meters": 60,
        "surface": "concrete"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [[-105.27, 40.01], ...]
      }
    }
  ]
}
```

#### GET `/api/trails/nearby`
Get trails near a specific location (spatial query).

**Query Parameters:**
- `lat` - Latitude (required)
- `lon` - Longitude (required)
- `radiusKm` - Search radius in km (default: 5)

**Example:**
```bash
curl "http://localhost:3001/api/trails/nearby?lat=40.01&lon=-105.27&radiusKm=2"
```

**Response:**
```json
{
  "type": "FeatureCollection",
  "count": 20,
  "center": {"lat": 40.01, "lon": -105.27},
  "radiusKm": 2,
  "features": [
    {
      "type": "Feature",
      "id": 1,
      "properties": {
        "name": "Pipe Town Path",
        "distance_km": 0.09,
        ...
      },
      "geometry": {...}
    }
  ]
}
```

#### GET `/api/trails/:id`
Get a single trail by ID.

**Example:**
```bash
curl "http://localhost:3001/api/trails/1"
```

### Statistics

#### GET `/api/stats`
Get aggregate trail statistics.

**Example:**
```bash
curl "http://localhost:3001/api/stats"
```

**Response:**
```json
{
  "totalTrails": 144,
  "totalLength": 353883.16,
  "avgLength": 2457.52,
  "minLength": 5.39,
  "maxLength": 233191.68,
  "avgElevation": 122.88,
  "difficultyBreakdown": {
    "Easy": 130,
    "Moderate": 6,
    "demanding_mountain_hiking": 2,
    "hiking": 3,
    "mountain_hiking": 3
  }
}
```

### User Activities

#### POST `/api/activities`
Log a user's hiking activity.

**Request Body:**
```json
{
  "userId": "user-1",
  "trailId": 1,
  "distanceMeters": 5000,
  "elevationGainMeters": 200,
  "durationSeconds": 3600,
  "startTime": "2026-04-25T10:00:00Z",
  "endTime": "2026-04-25T11:00:00Z",
  "coordinates": [[-105.27, 40.01], [-105.28, 40.02]]
}
```

**Response:**
```json
{
  "id": 1,
  "userId": "user-1",
  "trailId": 1,
  "distanceMeters": 5000,
  "elevationGainMeters": 200,
  "durationSeconds": 3600,
  "startTime": "2026-04-25T10:00:00Z",
  "endTime": "2026-04-25T11:00:00Z"
}
```

#### GET `/api/users/:userId/activities`
Get all activities logged by a user.

**Example:**
```bash
curl "http://localhost:3001/api/users/user-1/activities"
```

**Response:**
```json
{
  "userId": "user-1",
  "count": 5,
  "activities": [
    {
      "id": 1,
      "trailId": 1,
      "distanceMeters": 5000,
      "elevationGainMeters": 200,
      "durationSeconds": 3600,
      "startTime": "2026-04-25T10:00:00Z",
      "endTime": "2026-04-25T11:00:00Z",
      "createdAt": "2026-04-25 15:40:58"
    }
  ]
}
```

#### GET `/api/users/:userId/stats`
Get aggregated activity statistics for a user.

**Example:**
```bash
curl "http://localhost:3001/api/users/user-1/stats"
```

**Response:**
```json
{
  "userId": "user-1",
  "totalActivities": 5,
  "totalDistanceKm": 25.5,
  "totalElevationGain": 1050,
  "avgDistanceMeters": 5100,
  "totalDurationSeconds": 18000,
  "totalDurationHours": 5
}
```

### Trail Reviews & Ratings

#### POST `/api/reviews`
Add a review/rating for a trail.

**Request Body:**
```json
{
  "userId": "user-1",
  "trailId": 1,
  "rating": 5,
  "comment": "Amazing trail with great views!"
}
```

**Response:**
```json
{
  "id": 1,
  "trailId": 1,
  "userId": "user-1",
  "rating": 5,
  "comment": "Amazing trail with great views!"
}
```

#### GET `/api/trails/:trailId/reviews`
Get all reviews and ratings for a trail.

**Example:**
```bash
curl "http://localhost:3001/api/trails/1/reviews"
```

**Response:**
```json
{
  "trailId": "1",
  "totalReviews": 3,
  "avgRating": 4.67,
  "ratedCount": 3,
  "reviews": [
    {
      "id": 1,
      "user_id": "user-1",
      "rating": 5,
      "comment": "Amazing trail with great views!",
      "created_at": "2026-04-25 15:40:58"
    }
  ]
}
```

### Health

#### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "dbReady": true
}
```

## Running the API

```bash
cd api
npm install
npm start
```

Server starts on `http://localhost:3001`

## Database Schema

### trails
```sql
CREATE TABLE trails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  difficulty TEXT,
  length_meters REAL,
  elevation_gain_meters REAL,
  surface TEXT,
  start_lat REAL,
  start_lon REAL,
  end_lat REAL,
  end_lon REAL,
  bounds_west REAL,
  bounds_south REAL,
  bounds_east REAL,
  bounds_north REAL,
  geometry TEXT,
  properties TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### user_activities
```sql
CREATE TABLE user_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  trail_id INTEGER,
  distance_meters REAL,
  elevation_gain_meters REAL,
  duration_seconds INTEGER,
  start_time DATETIME,
  end_time DATETIME,
  start_lat REAL,
  start_lon REAL,
  end_lat REAL,
  end_lon REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(trail_id) REFERENCES trails(id)
);
```

### trail_reviews
```sql
CREATE TABLE trail_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trail_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(trail_id) REFERENCES trails(id)
);
```

## Data Import

To reimport trails from GeoJSON:
```bash
node import-trails.js
```

This script:
1. Reads `../app/assets/boulder_trails.geojson`
2. Handles both LineString and MultiLineString geometries
3. Calculates bounding boxes
4. Imports 144 trails with all metadata

## Features

- ✅ Trail search and filtering (difficulty, length, elevation)
- ✅ Spatial queries (nearby trails within radius)
- ✅ User activity tracking (distance, elevation, duration)
- ✅ Trail ratings and reviews
- ✅ Aggregate statistics (user and global)
- ✅ GeoJSON output for mapping
- ✅ CORS enabled for web frontend

## Future Enhancements

- [ ] Pagination for large result sets
- [ ] Advanced spatial queries (within bounds, routing)
- [ ] Real-time activity tracking
- [ ] Photo uploads for reviews
- [ ] Trail recommendation engine
- [ ] Activity feed / social features
- [ ] Authentication & authorization
