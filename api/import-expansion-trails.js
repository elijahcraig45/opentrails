const fs = require('fs');
const path = require('path');
const { db, getBoundsFromCoordinates } = require('./db');

/**
 * Import expansion trail datasets without clearing existing data
 * Usage: node import-expansion-trails.js <path-to-geojson>
 */

function importExpansionTrails(geojsonPath) {
  try {
    console.log(`📂 Reading GeoJSON file: ${geojsonPath}`);
    
    if (!fs.existsSync(geojsonPath)) {
      throw new Error(`File not found: ${geojsonPath}`);
    }

    const geojsonData = fs.readFileSync(geojsonPath, 'utf8');
    const parsed = JSON.parse(geojsonData);
    const features = parsed.features || (Array.isArray(parsed) ? parsed : []);

    console.log(`📊 Found ${features.length} trails to import`);

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
    let duplicates = 0;

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
          if (coords.length > 0) {
            coords = coords[0];
          }
        }
        
        if (!coords || coords.length === 0) {
          skipped++;
          return;
        }

        // Check for duplicates by name and start coordinates
        const trailName = properties.name || `Trail ${idx}`;
        const startLat = coords[0][1];
        const startLon = coords[0][0];
        
        const existing = db.prepare(
          'SELECT id FROM trails WHERE name = ? AND start_lat = ? AND start_lon = ?'
        ).get(trailName, startLat, startLon);

        if (existing) {
          duplicates++;
          return;
        }

        // Get bounds
        const bounds = getBoundsFromCoordinates(coords);
        const endCoord = coords[coords.length - 1];

        insertStmt.run(
          trailName,
          properties.estimated_difficulty || properties.difficulty || 'Easy',
          properties.length_meters || 0,
          properties.elevation_gain_meters || 0,
          properties.surface || 'unknown',
          startLat,
          startLon,
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
        if (imported % 10 === 0) {
          console.log(`  ✓ Imported ${imported}/${features.length}...`);
        }
      } catch (err) {
        console.error(`  ⚠️  Error on trail ${idx}:`, err.message);
        skipped++;
      }
    });

    console.log(`✅ Import complete: ${imported} added, ${duplicates} duplicates, ${skipped} skipped`);

    // Show current statistics
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT difficulty) as difficulties,
        ROUND(AVG(length_meters), 2) as avg_length,
        ROUND(SUM(length_meters), 2) as total_length
      FROM trails
    `).get();

    console.log(`📈 Database stats:`, stats);

    return { imported, skipped, duplicates };
  } catch (err) {
    console.error('❌ Error importing trails:', err.message);
    throw err;
  }
}

if (require.main === module) {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('Usage: node import-expansion-trails.js <path-to-geojson>');
    console.error('Example: node import-expansion-trails.js ../seed_data/trails-expansion-tier1.json');
    process.exit(1);
  }

  const fullPath = path.isAbsolute(filePath) 
    ? filePath 
    : path.join(__dirname, filePath);

  importExpansionTrails(fullPath);
  process.exit(0);
}

module.exports = { importExpansionTrails };
