#!/usr/bin/env node

/**
 * Sync GeoJSON trail data from the ETL output to the app assets.
 * Run after executing the ETL script: python ../etl/extract_trails.py
 */

const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '../../seed_data/boulder_trails.geojson');
const DEST = path.join(__dirname, '../assets/boulder_trails.geojson');

try {
  const data = fs.readFileSync(SOURCE, 'utf8');
  fs.writeFileSync(DEST, data, 'utf8');
  console.log(`✓ Synced trails data: ${SOURCE} → ${DEST}`);
  process.exit(0);
} catch (err) {
  console.error(`✗ Failed to sync trails: ${err.message}`);
  process.exit(1);
}
