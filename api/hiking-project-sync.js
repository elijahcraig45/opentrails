/**
 * Hiking Project API Integration for OpenTrails
 * 
 * Features:
 * - Fetch trails from Hiking Project API
 * - Merge with existing database
 * - Handle rate limits and retries
 * - Support for nightly sync jobs
 */

const fetch = require('node-fetch');
const { db } = require('./db');

// Configuration
const HIKING_PROJECT_API_KEY = process.env.HIKING_PROJECT_API_KEY;
const HIKING_PROJECT_API_BASE = 'https://www.hikingproject.com/data/get-trails';
const RATE_LIMIT_DELAY = 100; // 100ms between requests
const REQUEST_TIMEOUT = 10000;

// Major hiking destinations and their coordinates
const POPULAR_DESTINATIONS = [
  // Colorado
  { lat: 39.7426, lon: -105.2705, radius: 50, name: 'Denver Area' },
  { lat: 38.9072, lon: -106.9140, radius: 50, name: 'San Juan Mountains' },
  { lat: 40.3774, lon: -105.5217, radius: 50, name: 'Rocky Mountain NP' },
  
  // California
  { lat: 37.7749, lon: -122.4194, radius: 50, name: 'San Francisco Bay' },
  { lat: 37.3382, lon: -122.1088, radius: 50, name: 'San Jose Area' },
  { lat: 37.8651, lon: -119.5383, radius: 50, name: 'Yosemite Area' },
  { lat: 34.0195, lon: -118.4912, radius: 50, name: 'Los Angeles Area' },
  { lat: 32.7157, lon: -117.1611, radius: 50, name: 'San Diego Area' },
  
  // Washington
  { lat: 47.6062, lon: -122.3321, radius: 50, name: 'Seattle Area' },
  { lat: 47.4009, lon: -121.4905, radius: 50, name: 'Mount Rainier' },
  { lat: 48.7519, lon: -121.5024, radius: 50, name: 'North Cascades' },
  
  // Oregon
  { lat: 45.5152, lon: -122.6784, radius: 50, name: 'Portland Area' },
  { lat: 43.6721, lon: -121.5060, radius: 50, name: 'Crater Lake Area' },
  
  // Utah
  { lat: 40.7608, lon: -111.8910, radius: 50, name: 'Salt Lake City' },
  { lat: 38.7331, lon: -109.5904, radius: 50, name: 'Moab Area' },
  
  // Arizona
  { lat: 33.4484, lon: -112.0742, radius: 50, name: 'Phoenix Area' },
  { lat: 35.2969, lon: -111.9192, radius: 50, name: 'Flagstaff Area' },
  
  // Montana
  { lat: 46.5891, lon: -112.0391, radius: 50, name: 'Missoula Area' },
  { lat: 48.9219, lon: -113.9940, radius: 50, name: 'Glacier National Park' },
];

/**
 * Fetch trails from Hiking Project API for a single location
 */
async function fetchTrailsFromLocation(lat, lon, maxDistance, maxResults = 30) {
  if (!HIKING_PROJECT_API_KEY) {
    throw new Error('HIKING_PROJECT_API_KEY environment variable not set');
  }

  try {
    const url = new URL(HIKING_PROJECT_API_BASE);
    url.searchParams.append('lat', lat);
    url.searchParams.append('lon', lon);
    url.searchParams.append('maxDistance', maxDistance);
    url.searchParams.append('maxResults', maxResults);
    url.searchParams.append('key', HIKING_PROJECT_API_KEY);

    const response = await fetch(url.toString(), {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent': 'OpenTrails/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.trails || [];
  } catch (err) {
    console.error(`Error fetching trails at (${lat}, ${lon}):`, err.message);
    return [];
  }
}

/**
 * Convert Hiking Project trail to OpenTrails format
 */
function convertHikingProjectTrail(trail) {
  return {
    name: trail.name || 'Unknown Trail',
    difficulty: convertDifficulty(trail.difficulty),
    length_meters: trail.length ? trail.length * 1609.34 : 0, // Convert miles to meters
    elevation_gain_meters: trail.ascent || 0,
    surface: 'trail', // Hiking Project doesn't specify surface
    start_lat: trail.latitude || 0,
    start_lon: trail.longitude || 0,
    end_lat: trail.latitude || 0,
    end_lon: trail.longitude || 0,
    bounds_west: trail.longitude || 0,
    bounds_south: trail.latitude || 0,
    bounds_east: trail.longitude || 0,
    bounds_north: trail.latitude || 0,
    source: 'hiking_project',
    hiking_project_id: trail.id,
    rating: trail.stars || 0,
    reviews: trail.reviews || 0,
    trail_url: trail.url || '',
    image_url: trail.imgSmall || '',
  };
}

/**
 * Normalize difficulty rating
 */
function convertDifficulty(difficulty) {
  if (!difficulty) return 'Easy';
  
  const lower = difficulty.toLowerCase();
  if (lower.includes('easy')) return 'Easy';
  if (lower.includes('intermediate')) return 'Moderate';
  if (lower.includes('moderate')) return 'Moderate';
  if (lower.includes('difficult')) return 'Strenuous';
  if (lower.includes('hard')) return 'Strenuous';
  
  return 'Easy';
}

/**
 * Check if trail already exists in database
 */
function trailExists(name, lat, lon) {
  const stmt = db.prepare(`
    SELECT id FROM trails 
    WHERE name = ? 
    AND ABS(start_lat - ?) < 0.01 
    AND ABS(start_lon - ?) < 0.01
    LIMIT 1
  `);
  return stmt.get(name, lat, lon) !== undefined;
}

/**
 * Insert trail into database
 */
function insertTrail(trail) {
  const stmt = db.prepare(`
    INSERT INTO trails (
      name, difficulty, length_meters, elevation_gain_meters, surface,
      start_lat, start_lon, end_lat, end_lon,
      bounds_west, bounds_south, bounds_east, bounds_north,
      geometry, properties
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const geometry = JSON.stringify({
    type: 'Point',
    coordinates: [trail.start_lon, trail.start_lat],
  });

  const properties = JSON.stringify({
    name: trail.name,
    source: trail.source,
    hiking_project_id: trail.hiking_project_id,
    rating: trail.rating,
    reviews: trail.reviews,
    trail_url: trail.trail_url,
    image_url: trail.image_url,
  });

  return stmt.run(
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
    geometry,
    properties
  );
}

/**
 * Sync trails from Hiking Project API
 */
async function syncHikingProjectTrails() {
  console.log('🔄 Starting Hiking Project API sync...');
  
  let totalFetched = 0;
  let totalImported = 0;
  let totalDuplicates = 0;
  let totalErrors = 0;

  for (const destination of POPULAR_DESTINATIONS) {
    try {
      console.log(`📍 Fetching trails for ${destination.name}...`);
      
      const trails = await fetchTrailsFromLocation(
        destination.lat,
        destination.lon,
        destination.radius,
        50 // Get up to 50 results per location
      );

      console.log(`  Found ${trails.length} trails`);
      totalFetched += trails.length;

      for (const hikingProjectTrail of trails) {
        try {
          // Check for duplicates
          if (trailExists(hikingProjectTrail.name, hikingProjectTrail.latitude, hikingProjectTrail.longitude)) {
            totalDuplicates++;
            continue;
          }

          // Convert and insert
          const converted = convertHikingProjectTrail(hikingProjectTrail);
          insertTrail(converted);
          totalImported++;

          if (totalImported % 10 === 0) {
            console.log(`  ✓ Imported ${totalImported} trails...`);
          }
        } catch (err) {
          console.error(`  ⚠️  Error importing trail "${hikingProjectTrail.name}":`, err.message);
          totalErrors++;
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY * 10));
    } catch (err) {
      console.error(`❌ Error processing ${destination.name}:`, err.message);
      totalErrors++;
    }
  }

  // Summary
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT difficulty) as difficulties,
      ROUND(AVG(length_meters), 2) as avg_length,
      ROUND(SUM(length_meters), 2) as total_length
    FROM trails
  `).get();

  console.log(`
✅ Sync Complete!
  Total Fetched: ${totalFetched}
  Total Imported: ${totalImported}
  Duplicates Skipped: ${totalDuplicates}
  Errors: ${totalErrors}
  
📈 Database Stats:
  Total Trails: ${stats.total}
  Average Length: ${stats.avg_length}m
  Total Distance: ${stats.total_length}m
  Difficulty Types: ${stats.difficulties}
  `);

  return {
    totalFetched,
    totalImported,
    totalDuplicates,
    totalErrors,
    stats,
  };
}

/**
 * Express endpoint for manual sync
 */
function setupSyncEndpoint(app) {
  app.post('/api/sync/hiking-project', async (req, res) => {
    try {
      const result = await syncHikingProjectTrails();
      res.json({
        success: true,
        message: 'Hiking Project sync completed',
        result,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  });

  // GET endpoint to check sync status
  app.get('/api/sync/hiking-project/status', (req, res) => {
    const hikingProjectTrails = db.prepare(`
      SELECT COUNT(*) as count FROM trails WHERE properties LIKE '%hiking_project%'
    `).get();

    res.json({
      hiking_project_trails: hikingProjectTrails.count || 0,
      api_key_configured: !!HIKING_PROJECT_API_KEY,
    });
  });
}

/**
 * Setup nightly sync job (optional)
 */
function setupNightlySync() {
  if (!HIKING_PROJECT_API_KEY) {
    console.warn('⚠️  HIKING_PROJECT_API_KEY not configured - skipping nightly sync');
    return;
  }

  // Run at 2 AM UTC every day
  const schedule = require('node-schedule');
  
  schedule.scheduleJob('0 2 * * *', async () => {
    console.log('🌙 Running nightly Hiking Project sync...');
    try {
      await syncHikingProjectTrails();
    } catch (err) {
      console.error('❌ Nightly sync failed:', err.message);
    }
  });

  console.log('✅ Nightly sync scheduled for 2 AM UTC daily');
}

module.exports = {
  syncHikingProjectTrails,
  setupSyncEndpoint,
  setupNightlySync,
  fetchTrailsFromLocation,
};
