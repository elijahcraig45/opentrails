#!/usr/bin/env node

/**
 * Import GeoJSON trails file into database (SQLite or PostgreSQL)
 * 
 * Usage:
 *   node import-trails-geojson.js trails.geojson
 *   npm run import-trails -- trails.geojson
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { Pool } = require('pg');
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('❌ Usage: node import-trails-geojson.js <geojson-file>');
  process.exit(1);
}

const geojsonFile = args[0];
const isPostgres = process.env.DB_HOST && process.env.DB_USER;

async function importToPostgres(data) {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');

    // Create table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS trails (
        id SERIAL PRIMARY KEY,
        osm_id BIGINT UNIQUE,
        name VARCHAR(255) NOT NULL,
        difficulty VARCHAR(20),
        length_meters DECIMAL(10, 2),
        elevation_gain_meters DECIMAL(10, 2),
        surface VARCHAR(100),
        state VARCHAR(50),
        properties JSONB,
        geometry GEOMETRY(LINESTRING, 4326),
        created_at TIMESTAMP DEFAULT NOW(),
        SPATIAL INDEX idx_geometry (geometry)
      )
    `);

    console.log('📦 Inserting trails...');
    let insertCount = 0;

    for (const feature of data.features) {
      const props = feature.properties || {};
      const geom = feature.geometry;

      // Convert GeoJSON coordinates to WKT LINESTRING
      const coords = geom.coordinates
        .map(c => `${c[0]} ${c[1]}`)
        .join(', ');
      const geometryWkt = `LINESTRING(${coords})`;

      try {
        await client.query(
          `INSERT INTO trails 
           (name, difficulty, length_meters, elevation_gain_meters, surface, state, properties, geometry)
           VALUES ($1, $2, $3, $4, $5, $6, $7, ST_GeomFromText($8, 4326))
           ON CONFLICT DO NOTHING`,
          [
            props.name || 'Unnamed Trail',
            props.difficulty || 'Moderate',
            parseFloat(props.length_meters) || 0,
            parseFloat(props.elevation_gain_meters) || 0,
            props.surface || 'unknown',
            props.state || 'Unknown',
            JSON.stringify(props),
            geometryWkt
          ]
        );
        insertCount++;

        if (insertCount % 100 === 0) {
          console.log(`  ✓ ${insertCount} trails inserted...`);
        }
      } catch (err) {
        console.error(`⚠️  Failed to insert trail: ${props.name}`, err.message);
      }
    }

    // Create spatial index
    console.log('🔍 Creating spatial indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_trails_state ON trails(state);
      CREATE INDEX IF NOT EXISTS idx_trails_difficulty ON trails(difficulty);
      CREATE INDEX IF NOT EXISTS idx_trails_geometry ON trails USING GIST (geometry);
    `);

    console.log(`✅ Imported ${insertCount} trails to PostgreSQL`);
    client.release();
    pool.end();

  } catch (err) {
    console.error('❌ PostgreSQL import failed:', err.message);
    pool.end();
    process.exit(1);
  }
}

function importToSqlite(data) {
  const db = new Database(path.join(__dirname, 'opentrails.db'));

  console.log('✅ Connected to SQLite');

  // Add state column if it doesn't exist (for filtering by region)
  try {
    db.exec('ALTER TABLE trails ADD COLUMN state TEXT');
  } catch (err) {
    // Column might already exist, ignore error
  }

  console.log('[*] Inserting trails...');
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO trails 
    (name, difficulty, length_meters, elevation_gain_meters, surface, state, properties, geometry)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insert = db.transaction((features) => {
    let insertCount = 0;
    for (const feature of features) {
      const props = feature.properties || {};
      try {
        const coords = props.geometry?.coordinates || feature.geometry?.coordinates || [];
        
        stmt.run(
          props.name || 'Unnamed Trail',
          props.difficulty || 'Moderate',
          parseFloat(props.length_meters) || 0,
          parseFloat(props.elevation_gain_meters) || 0,
          props.surface || 'unknown',
          props.state || 'Unknown',
          JSON.stringify(props),
          JSON.stringify(feature.geometry)
        );
        insertCount++;

        if (insertCount % 100 === 0) {
          console.log(`  [+] ${insertCount} trails inserted...`);
        }
      } catch (err) {
        console.error(`[!] Failed to insert trail: ${props.name}`, err.message);
      }
    }
    return insertCount;
  });

  const insertCount = insert(data.features);
  console.log(`[+] Imported ${insertCount} trails to SQLite`);
  db.close();
}

// Main
async function main() {
  try {
    // Read GeoJSON file
    if (!fs.existsSync(geojsonFile)) {
      console.error(`❌ File not found: ${geojsonFile}`);
      process.exit(1);
    }

    console.log(`📖 Reading ${geojsonFile}...`);
    const data = JSON.parse(fs.readFileSync(geojsonFile, 'utf8'));

    if (!data.features || !Array.isArray(data.features)) {
      console.error('❌ Invalid GeoJSON format (missing features array)');
      process.exit(1);
    }

    console.log(`📊 Found ${data.features.length} trails in file`);
    console.log();

    // Import based on database type
    if (isPostgres) {
      await importToPostgres(data);
    } else {
      importToSqlite(data);
    }

  } catch (err) {
    console.error('❌ Import failed:', err.message);
    process.exit(1);
  }
}

main();
