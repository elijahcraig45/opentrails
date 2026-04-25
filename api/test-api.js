#!/usr/bin/env node
/**
 * OpenTrails API Integration Tests
 * Tests all endpoints with real HTTP requests
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

class APITester {
  constructor() {
    this.testsPassed = 0;
    this.testsFailed = 0;
  }

  async request(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const options = {
        method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              data: JSON.parse(data),
              headers: res.headers,
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              data,
              headers: res.headers,
            });
          }
        });
      });

      req.on('error', reject);

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  async test(name, fn) {
    try {
      await fn();
      this.testsPassed++;
      console.log(`✅ ${name}`);
    } catch (err) {
      this.testsFailed++;
      console.log(`❌ ${name}`);
      console.log(`   Error: ${err.message}`);
    }
  }

  assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  async runTests() {
    console.log('\n🧪 OpenTrails API Tests\n');

    // Health check
    await this.test('GET /health', async () => {
      const res = await this.request('GET', '/health');
      this.assert(res.status === 200, 'Status should be 200');
      this.assert(res.data.status === 'ok', 'Status should be ok');
      this.assert(res.data.dbReady === true, 'DB should be ready');
    });

    // Trail search - all trails
    await this.test('GET /api/trails (no filters)', async () => {
      const res = await this.request('GET', '/api/trails');
      this.assert(res.status === 200, 'Status should be 200');
      this.assert(res.data.type === 'FeatureCollection', 'Should return FeatureCollection');
      this.assert(res.data.count === 144, 'Should return 144 trails');
      this.assert(res.data.features.length === 144, 'Features array should have 144 items');
    });

    // Trail search - by difficulty
    await this.test('GET /api/trails?difficulty=Easy', async () => {
      const res = await this.request('GET', '/api/trails?difficulty=Easy');
      this.assert(res.status === 200, 'Status should be 200');
      this.assert(res.data.count === 130, 'Should filter to 130 Easy trails');
      res.data.features.forEach((f) => {
        this.assert(
          f.properties.estimated_difficulty === 'Easy',
          `All should be Easy, got ${f.properties.estimated_difficulty}`
        );
      });
    });

    // Trail search - by max length
    await this.test('GET /api/trails?maxLength=2 (2 miles)', async () => {
      const res = await this.request('GET', '/api/trails?maxLength=2');
      this.assert(res.status === 200, 'Status should be 200');
      this.assert(res.data.count > 0, 'Should find some trails');
      res.data.features.forEach((f) => {
        const lengthMiles = f.properties.length_meters / 1609.34;
        this.assert(lengthMiles <= 2, `Trail length should be <= 2 miles, got ${lengthMiles}`);
      });
    });

    // Trail search - by elevation
    await this.test('GET /api/trails?minElevation=100&maxElevation=500', async () => {
      const res = await this.request('GET', '/api/trails?minElevation=100&maxElevation=500');
      this.assert(res.status === 200, 'Status should be 200');
      res.data.features.forEach((f) => {
        const elev = f.properties.elevation_gain_meters || 0;
        this.assert(elev >= 100 && elev <= 500, `Elevation should be 100-500m, got ${elev}`);
      });
    });

    // Trail search - by name
    await this.test('GET /api/trails?search=creek', async () => {
      const res = await this.request('GET', '/api/trails?search=creek');
      this.assert(res.status === 200, 'Status should be 200');
      this.assert(res.data.count > 0, 'Should find trails with "creek"');
      res.data.features.forEach((f) => {
        this.assert(
          f.properties.name.toLowerCase().includes('creek'),
          'Trail name should contain "creek"'
        );
      });
    });

    // Trail search - combined filters
    await this.test('GET /api/trails (combined filters)', async () => {
      const res = await this.request(
        'GET',
        '/api/trails?difficulty=Easy&maxLength=2&search=creek'
      );
      this.assert(res.status === 200, 'Status should be 200');
      this.assert(res.data.count > 0, 'Should find filtered trails');
    });

    // Spatial query - nearby trails
    await this.test('GET /api/trails/nearby (spatial search)', async () => {
      const res = await this.request(
        'GET',
        '/api/trails/nearby?lat=40.01&lon=-105.27&radiusKm=2'
      );
      this.assert(res.status === 200, 'Status should be 200');
      this.assert(res.data.type === 'FeatureCollection', 'Should return FeatureCollection');
      this.assert(res.data.count > 0, 'Should find nearby trails');
      this.assert(res.data.center.lat === 40.01, 'Center lat should match');
      this.assert(res.data.center.lon === -105.27, 'Center lon should match');
      res.data.features.forEach((f) => {
        this.assert(
          f.properties.distance_km <= 2,
          `Distance should be <= 2km, got ${f.properties.distance_km}`
        );
      });
    });

    // Get single trail
    await this.test('GET /api/trails/:id (single trail)', async () => {
      const res = await this.request('GET', '/api/trails/1');
      this.assert(res.status === 200, 'Status should be 200');
      this.assert(res.data.type === 'Feature', 'Should return a Feature');
      this.assert(res.data.id === 1, 'Trail ID should be 1');
      this.assert(res.data.properties.name, 'Trail should have a name');
    });

    // Get trail stats
    await this.test('GET /api/stats', async () => {
      const res = await this.request('GET', '/api/stats');
      this.assert(res.status === 200, 'Status should be 200');
      this.assert(res.data.totalTrails === 144, 'Should have 144 trails');
      this.assert(res.data.totalLength > 0, 'Total length should be > 0');
      this.assert(res.data.avgLength > 0, 'Average length should be > 0');
      this.assert(res.data.difficultyBreakdown, 'Should have difficulty breakdown');
    });

    // Log user activity
    let activityId;
    await this.test('POST /api/activities (log hike)', async () => {
      const body = {
        userId: 'test-user-1',
        trailId: 1,
        distanceMeters: 5000,
        elevationGainMeters: 200,
        durationSeconds: 3600,
        coordinates: [
          [-105.27, 40.01],
          [-105.28, 40.02],
        ],
      };
      const res = await this.request('POST', '/api/activities', body);
      this.assert(res.status === 200, 'Status should be 200');
      this.assert(res.data.id, 'Should return activity ID');
      activityId = res.data.id;
      this.assert(res.data.userId === 'test-user-1', 'Should have user ID');
      this.assert(res.data.distanceMeters === 5000, 'Should have distance');
    });

    // Get user activities
    await this.test('GET /api/users/:userId/activities', async () => {
      const res = await this.request('GET', '/api/users/test-user-1/activities');
      this.assert(res.status === 200, 'Status should be 200');
      this.assert(res.data.userId === 'test-user-1', 'Should match user ID');
      this.assert(res.data.count > 0, 'Should have activities');
      this.assert(res.data.activities[0].id === activityId, 'Should include logged activity');
    });

    // Get user stats
    await this.test('GET /api/users/:userId/stats', async () => {
      const res = await this.request('GET', '/api/users/test-user-1/stats');
      this.assert(res.status === 200, 'Status should be 200');
      this.assert(res.data.userId === 'test-user-1', 'Should match user ID');
      this.assert(res.data.totalActivities > 0, 'Should have activities');
      this.assert(res.data.totalDistanceKm > 0, 'Should have total distance');
      this.assert(res.data.totalDurationHours > 0, 'Should have total duration');
    });

    // Add trail review
    let reviewId;
    await this.test('POST /api/reviews (add rating)', async () => {
      const body = {
        userId: 'test-user-1',
        trailId: 1,
        rating: 5,
        comment: 'Amazing trail with great views!',
      };
      const res = await this.request('POST', '/api/reviews', body);
      this.assert(res.status === 200, 'Status should be 200');
      this.assert(res.data.id, 'Should return review ID');
      reviewId = res.data.id;
      this.assert(res.data.rating === 5, 'Should have rating');
    });

    // Get trail reviews
    await this.test('GET /api/trails/:trailId/reviews', async () => {
      const res = await this.request('GET', '/api/trails/1/reviews');
      this.assert(res.status === 200, 'Status should be 200');
      this.assert(res.data.trailId === '1', 'Should match trail ID');
      this.assert(res.data.totalReviews > 0, 'Should have reviews');
      this.assert(res.data.avgRating > 0, 'Should have average rating');
      this.assert(res.data.reviews.length > 0, 'Should include review');
    });

    // Error handling - missing params
    await this.test('GET /api/trails/nearby (missing params)', async () => {
      const res = await this.request('GET', '/api/trails/nearby');
      this.assert(res.status === 400, 'Status should be 400');
      this.assert(res.data.error, 'Should have error message');
    });

    // Error handling - invalid trail ID
    await this.test('GET /api/trails/99999 (not found)', async () => {
      const res = await this.request('GET', '/api/trails/99999');
      this.assert(res.status === 404, 'Status should be 404');
      this.assert(res.data.error, 'Should have error message');
    });

    // Summary
    console.log(`\n📊 Test Results:\n`);
    console.log(`✅ Passed: ${this.testsPassed}`);
    console.log(`❌ Failed: ${this.testsFailed}`);
    console.log(`📈 Total: ${this.testsPassed + this.testsFailed}\n`);

    if (this.testsFailed === 0) {
      console.log('🎉 All tests passed!\n');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed\n');
      process.exit(1);
    }
  }
}

// Run tests
const tester = new APITester();
tester.runTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
