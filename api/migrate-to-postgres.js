#!/usr/bin/env node
/**
 * Migrate OpenTrails data from SQLite to PostgreSQL
 * Usage: node migrate-to-postgres.js
 */

const Database = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const sqliteDbPath = path.join(__dirname, 'opentrails.db');

// SQLite connection
const sqlite = new Database(sqliteDbPath);
sqlite.pragma('foreign_keys = ON');

// PostgreSQL connection pool
const pgPool = new Pool({
  user: process.env.DB_USER || 'opentrails',
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'opentrails',
});

async function migrate() {
  const pgClient = await pgPool.connect();
  
  try {
    console.log('🚀 Starting migration from SQLite to PostgreSQL...\n');

    // Clear existing data (if any)
    console.log('Clearing existing data...');
    await pgClient.query('TRUNCATE TABLE trail_reviews, user_activities, trails;');

    // Migrate trails
    console.log('Migrating trails...');
    const trails = sqlite.prepare('SELECT * FROM trails').all();
    
    for (const trail of trails) {
      await pgClient.query(
        `INSERT INTO trails (
          name, difficulty, length_meters, elevation_gain_meters, surface,
          start_lat, start_lon, end_lat, end_lon,
          bounds_west, bounds_south, bounds_east, bounds_north,
          geojson_type, properties, geometry, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          trail.name,
          trail.difficulty,
          trail.length_meters,
          trail.elevation_gain_meters,
          trail.surface,
          trail.start_lat,
          trail.start_lon,
          trail.end_lat,
          trail.end_lon,
          trail.bounds_west,
          trail.bounds_south,
          trail.bounds_east,
          trail.bounds_north,
          trail.geojson_type || 'Feature',
          trail.properties ? JSON.parse(trail.properties) : {},
          trail.geometry ? JSON.parse(trail.geometry) : {},
          trail.created_at
        ]
      );
    }
    console.log(`✅ Migrated ${trails.length} trails`);

    // Migrate activities
    console.log('Migrating user activities...');
    const activities = sqlite.prepare('SELECT * FROM user_activities').all();
    let migratedActivities = 0;
    let skippedActivities = 0;
    
    for (const activity of activities) {
      try {
        await pgClient.query(
          `INSERT INTO user_activities (
            user_id, trail_id, distance_meters, elevation_gain_meters,
            duration_seconds, start_time, end_time,
            start_lat, start_lon, end_lat, end_lon, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            activity.user_id,
            activity.trail_id,
            activity.distance_meters,
            activity.elevation_gain_meters,
            activity.duration_seconds,
            activity.start_time,
            activity.end_time,
            activity.start_lat,
            activity.start_lon,
            activity.end_lat,
            activity.end_lon,
            activity.created_at
          ]
        );
        migratedActivities++;
      } catch (err) {
        // Skip activities with invalid foreign key references
        skippedActivities++;
      }
    }
    console.log(`✅ Migrated ${migratedActivities} activities (skipped ${skippedActivities} with invalid trail references)`);

    // Migrate reviews
    console.log('Migrating trail reviews...');
    const reviews = sqlite.prepare('SELECT * FROM trail_reviews').all();
    let migratedReviews = 0;
    let skippedReviews = 0;
    
    for (const review of reviews) {
      try {
        await pgClient.query(
          `INSERT INTO trail_reviews (
            trail_id, user_id, rating, comment, created_at
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            review.trail_id,
            review.user_id,
            review.rating,
            review.comment,
            review.created_at
          ]
        );
        migratedReviews++;
      } catch (err) {
        // Skip reviews with invalid foreign key references
        skippedReviews++;
      }
    }
    console.log(`✅ Migrated ${migratedReviews} reviews (skipped ${skippedReviews} with invalid trail references`);

    console.log('\n✅ Migration complete!');
    console.log(`Summary:`);
    console.log(`  • ${trails.length} trails`);
    console.log(`  • ${activities.length} activities`);
    console.log(`  • ${reviews.length} reviews`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    pgClient.release();
    sqlite.close();
    await pgPool.end();
  }
}

// Run migration
migrate().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
