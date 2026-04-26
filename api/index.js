const express = require('express');
const cors = require('cors');
const { db, calculateDistance } = require('./db');
const { importTrailsFromGeojson } = require('./import-trails');
const { setupSyncEndpoint } = require('./hiking-project-sync');

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      // Local development
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:8083',
      // Production
      'https://opentrails.vercel.app',
      'https://www.opentrails.app',
      // Vercel preview deployments
      /\.vercel\.app$/,
      // Environment variable override
      process.env.CORS_ORIGIN
    ].filter(Boolean);

    // Check if origin is allowed (including regex patterns)
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });

    // Allow requests with no origin (like mobile or curl requests)
    if (!origin || isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json());

// Add logging middleware to debug requests
app.use((req, res, next) => {
  const origin = req.headers.origin || 'no-origin';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} from ${origin}`);
  next();
});

// Initialize database on startup
let isDbReady = false;
(async () => {
  try {
    const trailCount = db.prepare('SELECT COUNT(*) as count FROM trails').get();
    if (trailCount.count === 0) {
      console.log('🔄 Importing trails from GeoJSON...');
      importTrailsFromGeojson();
    }
    isDbReady = true;
    console.log(`✅ Database ready with ${trailCount.count} trails`);
  } catch (err) {
    console.error('❌ Database init failed:', err.message);
  }
})();

// Setup Hiking Project sync endpoints
setupSyncEndpoint(app);

// Health check endpoint (for monitoring and preflight test)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: isDbReady ? 'ready' : 'initializing',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint for basic info
app.get('/', (req, res) => {
  res.json({
    name: 'OpenTrails API',
    version: '1.0.0',
    status: 'running',
    endpoints: ['/api/health', '/api/trails', '/api/trails/nearby'],
    cors: 'enabled'
  });
});

// Endpoint: Get trails nearby (spatial search)
app.get('/api/trails/nearby', (req, res) => {
  try {
    const { lat, lon, radiusKm = 5 } = req.query;

    if (!lat || !lon) {
      return res
        .status(400)
        .json({ error: 'lat and lon parameters required' });
    }

    const centerLat = parseFloat(lat);
    const centerLon = parseFloat(lon);
    const radius = parseFloat(radiusKm);

    // Get all trails in approximate bounding box
    const latDelta = radius / 111;
    const lonDelta = radius / (111 * Math.cos((centerLat * Math.PI) / 180));

    const trails = db
      .prepare(
        `
      SELECT * FROM trails
      WHERE start_lat BETWEEN ? AND ?
        AND start_lon BETWEEN ? AND ?
      ORDER BY
        (? - start_lat) * (? - start_lat) +
        (? - start_lon) * (? - start_lon) ASC
      LIMIT 20
    `
      )
      .all(
        centerLat - latDelta,
        centerLat + latDelta,
        centerLon - lonDelta,
        centerLon + lonDelta,
        centerLat,
        centerLat,
        centerLon,
        centerLon
      );

    // Calculate actual distances and filter
    const withDistance = trails
      .map((trail) => ({
        ...trail,
        distance_km: calculateDistance(
          centerLat,
          centerLon,
          trail.start_lat,
          trail.start_lon
        ),
      }))
      .filter((t) => t.distance_km <= radius);

    const features = withDistance.map((trail) => ({
      type: 'Feature',
      id: trail.id,
      properties: {
        ...JSON.parse(trail.properties),
        distance_km: parseFloat(trail.distance_km.toFixed(2)),
      },
      geometry: JSON.parse(trail.geometry),
    }));

    res.json({
      type: 'FeatureCollection',
      count: features.length,
      center: { lat: centerLat, lon: centerLon },
      radiusKm: radius,
      features,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Get all trails with filtering
app.get('/api/trails', (req, res) => {
  try {
    const {
      difficulty,
      minLength,
      maxLength,
      minElevation,
      maxElevation,
      search,
      state,
      lat,
      lon,
      radiusKm,
    } = req.query;

    let query = 'SELECT * FROM trails WHERE 1=1';
    const params = [];

    // Filter by state
    if (state) {
      query += ' AND UPPER(state) = UPPER(?)';
      params.push(state);
    }

    // Filter by difficulty
    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    // Filter by length (convert miles to meters)
    if (minLength) {
      const minMeters = parseFloat(minLength) * 1609.34;
      query += ' AND length_meters >= ?';
      params.push(minMeters);
    }
    if (maxLength) {
      const maxMeters = parseFloat(maxLength) * 1609.34;
      query += ' AND length_meters <= ?';
      params.push(maxMeters);
    }

    // Filter by elevation gain (in meters)
    if (minElevation) {
      query += ' AND elevation_gain_meters >= ?';
      params.push(parseFloat(minElevation));
    }
    if (maxElevation) {
      query += ' AND elevation_gain_meters <= ?';
      params.push(parseFloat(maxElevation));
    }

    // Search by name (case-insensitive)
    if (search) {
      query += " AND LOWER(name) LIKE LOWER(?)";
      params.push(`%${search}%`);
    }

    // Spatial query: nearby trails
    if (lat && lon && radiusKm) {
      // Note: SQLite doesn't have true spatial queries, so we filter by bounding box
      // then calculate distance in JavaScript
      const radius = parseFloat(radiusKm);
      // Approximate: 1 degree ≈ 111 km at equator
      const latDelta = radius / 111;
      const lonDelta = radius / (111 * Math.cos((lat * Math.PI) / 180));

      query += `
        AND start_lat >= ? AND start_lat <= ?
        AND start_lon >= ? AND start_lon <= ?
      `;
      params.push(
        parseFloat(lat) - latDelta,
        parseFloat(lat) + latDelta,
        parseFloat(lon) - lonDelta,
        parseFloat(lon) + lonDelta
      );
    }

    const trails = db.prepare(query).all(...params);

    // Filter by distance if spatial query
    let filteredTrails = trails;
    if (lat && lon && radiusKm) {
      const centerLat = parseFloat(lat);
      const centerLon = parseFloat(lon);
      const radius = parseFloat(radiusKm);

      filteredTrails = trails.filter((trail) => {
        const distance = calculateDistance(
          centerLat,
          centerLon,
          trail.start_lat,
          trail.start_lon
        );
        return distance <= radius;
      });
    }

    // Convert DB rows to GeoJSON features
    const features = filteredTrails.map((trail) => ({
      type: 'Feature',
      id: trail.id,
      properties: JSON.parse(trail.properties),
      geometry: JSON.parse(trail.geometry),
    }));

    res.json({
      type: 'FeatureCollection',
      count: features.length,
      features,
    });
  } catch (err) {
    console.error('Error fetching trails:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Get available states
app.get('/api/states', (req, res) => {
  try {
    const states = db
      .prepare('SELECT DISTINCT state FROM trails WHERE state IS NOT NULL ORDER BY state')
      .all();

    res.json({
      states: states.map(row => row.state).filter(s => s && s !== ''),
      count: states.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Get single trail by ID
app.get('/api/trails/:id', (req, res) => {
  try {
    const trail = db
      .prepare('SELECT * FROM trails WHERE id = ?')
      .get(parseInt(req.params.id));

    if (!trail) {
      return res.status(404).json({ error: 'Trail not found' });
    }

    const feature = {
      type: 'Feature',
      id: trail.id,
      properties: JSON.parse(trail.properties),
      geometry: JSON.parse(trail.geometry),
    };

    res.json(feature);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Get trail statistics
app.get('/api/stats', (req, res) => {
  try {
    const stats = db
      .prepare(
        `
      SELECT
        COUNT(*) as totalTrails,
        ROUND(SUM(length_meters), 2) as totalLength,
        ROUND(AVG(length_meters), 2) as avgLength,
        MIN(length_meters) as minLength,
        MAX(length_meters) as maxLength,
        ROUND(AVG(elevation_gain_meters), 2) as avgElevation
      FROM trails
    `
      )
      .get();

    const difficultyBreakdown = db
      .prepare(
        `
      SELECT difficulty, COUNT(*) as count
      FROM trails
      GROUP BY difficulty
      ORDER BY difficulty
    `
      )
      .all()
      .reduce((acc, row) => {
        acc[row.difficulty] = row.count;
        return acc;
      }, {});

    res.json({
      ...stats,
      difficultyBreakdown,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Log user activity (hike)
app.post('/api/activities', (req, res) => {
  try {
    const {
      userId,
      trailId,
      distanceMeters,
      elevationGainMeters,
      durationSeconds,
      startTime,
      endTime,
      coordinates,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO user_activities (
        user_id, trail_id, distance_meters, elevation_gain_meters,
        duration_seconds, start_time, end_time, start_lat, start_lon, end_lat, end_lon
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const startCoord = coordinates?.[0];
    const endCoord = coordinates?.[coordinates.length - 1];

    const result = stmt.run(
      userId,
      trailId || null,
      distanceMeters || 0,
      elevationGainMeters || 0,
      durationSeconds || 0,
      startTime || new Date().toISOString(),
      endTime || new Date().toISOString(),
      startCoord?.[1] || null,
      startCoord?.[0] || null,
      endCoord?.[1] || null,
      endCoord?.[0] || null
    );

    res.json({
      id: result.lastInsertRowid,
      userId,
      trailId,
      distanceMeters,
      elevationGainMeters,
      durationSeconds,
      startTime,
      endTime,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Get user's activities
app.get('/api/users/:userId/activities', (req, res) => {
  try {
    const { userId } = req.params;

    const activities = db
      .prepare(
        `
      SELECT * FROM user_activities
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `
      )
      .all(userId);

    res.json({
      userId,
      count: activities.length,
      activities: activities.map((a) => ({
        id: a.id,
        trailId: a.trail_id,
        distanceMeters: a.distance_meters,
        elevationGainMeters: a.elevation_gain_meters,
        durationSeconds: a.duration_seconds,
        startTime: a.start_time,
        endTime: a.end_time,
        createdAt: a.created_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Get user activity stats
app.get('/api/users/:userId/stats', (req, res) => {
  try {
    const { userId } = req.params;

    const stats = db
      .prepare(
        `
      SELECT
        COUNT(*) as totalActivities,
        ROUND(SUM(distance_meters) / 1000, 2) as totalDistanceKm,
        ROUND(SUM(elevation_gain_meters), 0) as totalElevationGain,
        ROUND(AVG(distance_meters), 2) as avgDistanceMeters,
        SUM(duration_seconds) as totalDurationSeconds
      FROM user_activities
      WHERE user_id = ?
    `
      )
      .get(userId);

    res.json({
      userId,
      ...stats,
      totalDurationHours: stats.totalDurationSeconds
        ? parseFloat((stats.totalDurationSeconds / 3600).toFixed(2))
        : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Add trail review/rating
app.post('/api/reviews', (req, res) => {
  try {
    const { userId, trailId, rating, comment } = req.body;

    if (!userId || !trailId) {
      return res
        .status(400)
        .json({ error: 'userId and trailId are required' });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'rating must be 1-5' });
    }

    const stmt = db.prepare(`
      INSERT INTO trail_reviews (trail_id, user_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(trailId, userId, rating || null, comment || null);

    res.json({
      id: result.lastInsertRowid,
      trailId,
      userId,
      rating,
      comment,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Get trail reviews
app.get('/api/trails/:trailId/reviews', (req, res) => {
  try {
    const { trailId } = req.params;

    const reviews = db
      .prepare(
        `
      SELECT id, user_id, rating, comment, created_at
      FROM trail_reviews
      WHERE trail_id = ?
      ORDER BY created_at DESC
    `
      )
      .all(trailId);

    const stats = db
      .prepare(
        `
      SELECT
        COUNT(*) as totalReviews,
        ROUND(AVG(rating), 2) as avgRating,
        COUNT(CASE WHEN rating > 0 THEN 1 END) as ratedCount
      FROM trail_reviews
      WHERE trail_id = ?
    `
      )
      .get(trailId);

    res.json({
      trailId,
      ...stats,
      reviews,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', dbReady: isDbReady });
});

// Hiking Project sync documentation
app.get('/api/docs/sync', (req, res) => {
  res.json({
    endpoints: [
      {
        method: 'POST',
        path: '/api/sync/hiking-project',
        description: 'Manually trigger Hiking Project API sync',
        requires: 'HIKING_PROJECT_API_KEY environment variable',
        response: 'Sync status and results',
      },
      {
        method: 'GET',
        path: '/api/sync/hiking-project/status',
        description: 'Check Hiking Project sync status',
        response: 'Number of trails from Hiking Project and API key status',
      },
    ],
    setup: {
      step1: 'Get API key from https://www.hikingproject.com/data',
      step2: 'Set HIKING_PROJECT_API_KEY environment variable',
      step3: 'POST to /api/sync/hiking-project to start sync',
      note: 'Free tier: 10,000 requests/month; Paid: unlimited',
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OpenTrails API running on port ${PORT}`);
  console.log(`📍 GET http://localhost:${PORT}/api/trails`);
  console.log(`🗺️  GET http://localhost:${PORT}/api/trails/nearby?lat=40&lon=-105&radiusKm=5`);
  console.log(`📊 GET http://localhost:${PORT}/api/stats`);
  console.log(`❤️  GET http://localhost:${PORT}/health`);
});
