const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'opentrails',
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'opentrails',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database schema
async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create trails table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trails (
        id SERIAL PRIMARY KEY,
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
        properties JSONB,
        geometry JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_trails_difficulty ON trails(difficulty);
      CREATE INDEX IF NOT EXISTS idx_trails_length ON trails(length_meters);
      CREATE INDEX IF NOT EXISTS idx_trails_elevation ON trails(elevation_gain_meters);
      CREATE INDEX IF NOT EXISTS idx_trails_name ON trails(name);
    `);

    // User activities table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_activities (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        trail_id INTEGER,
        distance_meters REAL,
        elevation_gain_meters REAL,
        duration_seconds INTEGER,
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        start_lat REAL,
        start_lon REAL,
        end_lat REAL,
        end_lon REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(trail_id) REFERENCES trails(id)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activities_user ON user_activities(user_id);
      CREATE INDEX IF NOT EXISTS idx_activities_trail ON user_activities(trail_id);
    `);

    // Trail reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trail_reviews (
        id SERIAL PRIMARY KEY,
        trail_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(trail_id) REFERENCES trails(id)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_trail ON trail_reviews(trail_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_user ON trail_reviews(user_id);
    `);

    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}

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
  pool,
  initDatabase,
  calculateDistance,
  getBoundsFromCoordinates,
};
