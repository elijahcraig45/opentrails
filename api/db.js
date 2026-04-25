const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'opentrails.db');

// Initialize database
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize tables
function initDatabase() {
  // Trails table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trails (
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
      geojson_type TEXT DEFAULT 'Feature',
      properties TEXT,
      geometry TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trails_difficulty ON trails(difficulty);
    CREATE INDEX IF NOT EXISTS idx_trails_length ON trails(length_meters);
    CREATE INDEX IF NOT EXISTS idx_trails_elevation ON trails(elevation_gain_meters);
    CREATE INDEX IF NOT EXISTS idx_trails_name ON trails(name);
  `);

  // User activities table (Phase 3)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_activities (
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
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_activities_user ON user_activities(user_id);
    CREATE INDEX IF NOT EXISTS idx_activities_trail ON user_activities(trail_id);
  `);

  // Trail reviews/ratings
  db.exec(`
    CREATE TABLE IF NOT EXISTS trail_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trail_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(trail_id) REFERENCES trails(id)
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_reviews_trail ON trail_reviews(trail_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_user ON trail_reviews(user_id);
  `);
}

// Initialize on load
initDatabase();

// Helper functions
function calculateDistance(lat1, lon1, lat2, lon2) {
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
  return R * c; // Distance in km
}

function getBoundsFromCoordinates(coords) {
  if (!coords || coords.length === 0) return null;
  const lats = coords.map((c) => c[1]);
  const lons = coords.map((c) => c[0]);
  return {
    west: Math.min(...lons),
    south: Math.min(...lats),
    east: Math.max(...lons),
    north: Math.max(...lats),
  };
}

module.exports = {
  db,
  calculateDistance,
  getBoundsFromCoordinates,
  initDatabase,
};
