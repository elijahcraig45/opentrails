#!/usr/bin/env node
/**
 * Initialize PostgreSQL database schema for OpenTrails
 * Must be run before migration
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'opentrails',
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'opentrails',
});

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Initializing PostgreSQL database schema...\n');

    // Create trails table
    console.log('Creating trails table...');
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

    // Create indexes on trails
    console.log('Creating indexes on trails...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_trails_difficulty ON trails(difficulty);
      CREATE INDEX IF NOT EXISTS idx_trails_length ON trails(length_meters);
      CREATE INDEX IF NOT EXISTS idx_trails_elevation ON trails(elevation_gain_meters);
      CREATE INDEX IF NOT EXISTS idx_trails_name ON trails(name);
    `);

    // User activities table
    console.log('Creating user_activities table...');
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

    // Create indexes on activities
    console.log('Creating indexes on user_activities...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activities_user ON user_activities(user_id);
      CREATE INDEX IF NOT EXISTS idx_activities_trail ON user_activities(trail_id);
    `);

    // Trail reviews table
    console.log('Creating trail_reviews table...');
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

    // Create indexes on reviews
    console.log('Creating indexes on trail_reviews...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_trail ON trail_reviews(trail_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_user ON trail_reviews(user_id);
    `);

    console.log('\n✅ Database schema initialized successfully!');
    console.log('Tables created:');
    console.log('  • trails');
    console.log('  • user_activities');
    console.log('  • trail_reviews');

  } catch (error) {
    console.error('❌ Schema initialization failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
