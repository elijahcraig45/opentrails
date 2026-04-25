const express = require('express');
const cors = require('cors');
const { pool, calculateDistance } = require('./db-postgres');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || ['http://localhost:8081', 'https://opentrails.vercel.app'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Initialize database connection
let isDbReady = false;
(async () => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM trails');
    const trailCount = parseInt(result.rows[0].count);
    isDbReady = true;
    console.log(`✅ Database ready with ${trailCount} trails`);
  } catch (err) {
    console.error('❌ Database init failed:', err.message);
    console.error('Connection details:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER
    });
  }
})();

// Endpoint: Get all trails or filtered
app.get('/api/trails', async (req, res) => {
  try {
    const { difficulty, state, maxLength, minElevation, search } = req.query;

    let query = 'SELECT * FROM trails WHERE 1=1';
    const params = [];

    if (state) {
      query += ` AND UPPER(state) = UPPER($${params.length + 1})`;
      params.push(state);
    }

    if (difficulty) {
      query += ` AND difficulty = $${params.length + 1}`;
      params.push(difficulty);
    }

    if (search) {
      query += ` AND LOWER(name) LIKE LOWER($${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (maxLength) {
      query += ` AND length_meters <= $${params.length + 1}`;
      params.push(parseFloat(maxLength));
    }

    if (minElevation) {
      query += ` AND elevation_gain_meters >= $${params.length + 1}`;
      params.push(parseFloat(minElevation));
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json({
      type: 'FeatureCollection',
      count: result.rows.length,
      features: result.rows
    });
  } catch (error) {
    console.error('Error fetching trails:', error);
    res.status(500).json({ error: 'Failed to fetch trails' });
  }
});

// Endpoint: Get available states
app.get('/api/states', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT state FROM trails WHERE state IS NOT NULL ORDER BY state'
    );
    res.json({
      states: result.rows.map(row => row.state).filter(s => s && s !== ''),
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ error: 'Failed to fetch states' });
  }
});

// Endpoint: Get trails nearby (spatial search)
app.get('/api/trails/nearby', async (req, res) => {
  try {
    const { lat, lon, radiusKm = 5 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon parameters required' });
    }

    const centerLat = parseFloat(lat);
    const centerLon = parseFloat(lon);
    const radius = parseFloat(radiusKm);

    const latDelta = radius / 111;
    const lonDelta = radius / (111 * Math.cos((centerLat * Math.PI) / 180));

    const query = `
      SELECT * FROM trails
      WHERE bounds_west >= $1 AND bounds_east <= $2
        AND bounds_south >= $3 AND bounds_north <= $4
      ORDER BY name
    `;

    const result = await pool.query(query, [
      centerLon - lonDelta,
      centerLon + lonDelta,
      centerLat - latDelta,
      centerLat + latDelta,
    ]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching nearby trails:', error);
    res.status(500).json({ error: 'Failed to fetch nearby trails' });
  }
});

// Endpoint: Get single trail by ID
app.get('/api/trails/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'SELECT * FROM trails WHERE id = $1';
    const result = await pool.query(query, [parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trail not found' });
    }

    const trail = result.rows[0];
    // Parse JSON fields if they're stored as strings
    if (trail.properties && typeof trail.properties === 'string') {
      trail.properties = JSON.parse(trail.properties);
    }
    if (trail.geometry && typeof trail.geometry === 'string') {
      trail.geometry = JSON.parse(trail.geometry);
    }

    res.json(trail);
  } catch (error) {
    console.error('Error fetching trail:', error);
    res.status(500).json({ error: 'Failed to fetch trail' });
  }
});

// Endpoint: Search trails by name
app.get('/api/trails/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const searchTerm = `%${query}%`;

    const dbQuery = 'SELECT * FROM trails WHERE name ILIKE $1 ORDER BY name';
    const result = await pool.query(dbQuery, [searchTerm]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error searching trails:', error);
    res.status(500).json({ error: 'Failed to search trails' });
  }
});

// Endpoint: Get user activities
app.get('/api/activities', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter required' });
    }

    const query = `
      SELECT * FROM user_activities
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Endpoint: Create new activity
app.post('/api/activities', async (req, res) => {
  try {
    const {
      userId,
      trailId,
      distanceMeters,
      elevationGainMeters,
      durationSeconds,
      startTime,
      endTime,
      startLat,
      startLon,
      endLat,
      endLon,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const query = `
      INSERT INTO user_activities (
        user_id, trail_id, distance_meters, elevation_gain_meters,
        duration_seconds, start_time, end_time,
        start_lat, start_lon, end_lat, end_lon
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId,
      trailId || null,
      distanceMeters || 0,
      elevationGainMeters || 0,
      durationSeconds || 0,
      startTime || new Date(),
      endTime || new Date(),
      startLat || null,
      startLon || null,
      endLat || null,
      endLon || null,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// Endpoint: Get trail reviews
app.get('/api/trails/:trailId/reviews', async (req, res) => {
  try {
    const { trailId } = req.params;

    const query = `
      SELECT * FROM trail_reviews
      WHERE trail_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [parseInt(trailId)]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Endpoint: Create trail review
app.post('/api/trails/:trailId/reviews', async (req, res) => {
  try {
    const { trailId } = req.params;
    const { userId, rating, comment } = req.body;

    if (!userId || !rating) {
      return res.status(400).json({ error: 'userId and rating required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be between 1 and 5' });
    }

    const query = `
      INSERT INTO trail_reviews (trail_id, user_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [
      parseInt(trailId),
      userId,
      rating,
      comment || null,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DB_HOST || 'localhost'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
});

module.exports = app;
