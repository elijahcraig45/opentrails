const fs = require('fs');
const path = require('path');
const { db, getBoundsFromCoordinates } = require('./db');

// Path to the GeoJSON file
const geojsonPath = path.join(
  __dirname,
  '..',
  'app',
  'assets',
  'boulder_trails.geojson'
);

function importTrailsFromGeojson() {
  try {
    console.log('📂 Reading GeoJSON file...');
    const geojsonData = fs.readFileSync(geojsonPath, 'utf8');
    const { features } = JSON.parse(geojsonData);

    console.log(`📊 Found ${features.length} trails to import`);

    // Clear existing data
    db.prepare('DELETE FROM trails').run();

  const insertStmt = db.prepare(`
      INSERT INTO trails (
        name, difficulty, length_meters, elevation_gain_meters, surface,
        start_lat, start_lon, end_lat, end_lon,
        bounds_west, bounds_south, bounds_east, bounds_north,
        geometry, properties
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let imported = 0;
    let skipped = 0;

    features.forEach((feature, idx) => {
      try {
        const { properties, geometry } = feature;

        if (!geometry || !properties) {
          skipped++;
          return;
        }

        let coords = geometry.coordinates;
        
        // Handle both LineString and MultiLineString
        if (geometry.type === 'MultiLineString') {
          // Flatten MultiLineString - use first segment
          if (coords.length > 0) {
            coords = coords[0];
          }
        }
        
        if (!coords || coords.length === 0) {
          skipped++;
          return;
        }

        // Get bounds
        const bounds = getBoundsFromCoordinates(coords);
        const startCoord = coords[0];
        const endCoord = coords[coords.length - 1];

        const result = insertStmt.run(
          properties.name || `Trail ${idx}`,
          properties.estimated_difficulty || properties.difficulty || 'Easy',
          properties.length_meters || 0,
          properties.elevation_gain_meters || 0,
          properties.surface || 'unknown',
          startCoord[1],
          startCoord[0],
          endCoord[1],
          endCoord[0],
          bounds?.west || 0,
          bounds?.south || 0,
          bounds?.east || 0,
          bounds?.north || 0,
          JSON.stringify(geometry),
          JSON.stringify(properties)
        );

        imported++;
        if (imported % 20 === 0) {
          console.log(`  ✓ Imported ${imported}/${features.length}...`);
        }
      } catch (err) {
        skipped++;
      }
    });

    console.log(`✅ Import complete: ${imported} trails imported, ${skipped} skipped`);

    // Show statistics
    const stats = db
      .prepare(
        `
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT difficulty) as difficulties,
        ROUND(AVG(length_meters), 2) as avg_length,
        ROUND(SUM(length_meters), 2) as total_length
      FROM trails
    `
      )
      .get();

    console.log(`📈 Database stats:`, stats);

    return imported;
  } catch (err) {
    console.error('❌ Error importing trails:', err.message);
    throw err;
  }
}

if (require.main === module) {
  importTrailsFromGeojson();
  process.exit(0);
}

module.exports = { importTrailsFromGeojson };
