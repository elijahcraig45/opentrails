# OpenTrails - Architecture & Technical Design

**Last Updated**: Phase 3 Complete  
**Status**: Production-Ready for Beta Testing

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Devices                             │
├──────────────────┬──────────────────┬──────────────────┐
│   Web Browser    │  iOS (Expo)      │  Android (Expo)   │
│  localhost:8081  │  via TestFlight  │  via Play Store   │
└────────┬─────────┴────────┬─────────┴────────┬─────────┘
         │                  │                  │
         └──────────────────┴──────────────────┘
                    │
         ┌──────────▼─────────────┐
         │   Vercel CDN           │
         │  (Web distribution)    │
         └──────────┬─────────────┘
                    │
    ┌───────────────┴────────────────┐
    │                                 │
    ▼                                 ▼
┌──────────────────────┐   ┌─────────────────────────┐
│  localhost:3001      │   │  Google Cloud Run       │
│  Express API         │   │  (Production API)       │
│  ✅ SQLite (dev)     │   │  🟡 PostgreSQL (cloud)  │
│  144 trails loaded   │   │  Scaling: Auto (0-100)  │
└──────────┬───────────┘   └─────────┬───────────────┘
           │                         │
           └────────────┬────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                │
        ▼                                ▼
   ┌─────────────┐            ┌──────────────────┐
   │ SQLite      │            │ Google Cloud SQL │
   │ opentrails  │            │ PostgreSQL 15    │
   │ (local dev) │            │ (production)     │
   └─────────────┘            └──────────────────┘
```

---

## 📱 Frontend Architecture

### Tech Stack
- **Framework**: React Native (Expo 54.0.33)
- **UI**: React Components + MapLibre GL 5.24.0
- **State**: React Hooks + Context API
- **Type Safety**: TypeScript
- **Testing**: Playwright E2E tests
- **Build**: Expo CLI (web) + EAS (iOS/Android)

### Directory Structure
```
app/
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── SearchBar.tsx        # Trail name search input
│   │   ├── FilterButtons.tsx    # Difficulty filter toggle
│   │   ├── TrailList.tsx        # Scrollable trail list
│   │   ├── TrailDetailsPanel.tsx # Selected trail metadata
│   │   ├── TrailMap.tsx         # MapLibre GL rendering
│   │   ├── ActivityRecording.tsx # GPS activity tracking UI
│   │   └── index.ts             # Barrel export
│   │
│   ├── context/                 # Global state (Auth, Data)
│   │   └── AuthContext.tsx      # Firebase auth state
│   │
│   ├── config/                  # Configuration
│   │   └── firebase.ts          # Firebase project config
│   │
│   └── types/                   # TypeScript interfaces
│       └── index.ts             # Trail, Feature, GeoJSON types
│
├── App.tsx                      # Main app entry point
├── app.json                     # Expo configuration
├── package.json                 # Dependencies & scripts
├── eas.json                     # EAS build profiles
└── vercel.json                  # Vercel deployment config
```

### Component Data Flow

```
App.tsx (Orchestrator)
  ├── Fetch trails from API (/api/trails)
  │
  ├── SearchBar (filter by name)
  ├── FilterButtons (filter by difficulty)
  │   └── Both trigger filtered fetch
  │
  ├── TrailList (display filtered results)
  │   └── Select trail → update selectedTrail state
  │
  ├── TrailMap (MapLibre GL)
  │   └── Paint rules: color by difficulty
  │       Blue (Easy), Yellow (Moderate), Red (Strenuous)
  │
  └── TrailDetailsPanel (when trail selected)
      ├── Trail metadata
      ├── Elevation gain
      └── Recharts elevation profile
```

### State Management Strategy

**Current Approach**: React Hooks (sufficient for current scope)

```typescript
// App.tsx state
const [trails, setTrails] = useState<GeoJSONFeatureCollection>();
const [selectedTrail, setSelectedTrail] = useState<Feature | null>();
const [searchQuery, setSearchQuery] = useState('');
const [difficultyFilter, setDifficultyFilter] = useState<string | null>();

// AuthContext state (Firebase)
const [user, setUser] = useState<User | null>();
const [isAuthenticated, setIsAuthenticated] = useState(false);
```

**Future Upgrade Path**: If state complexity grows (Phase 4+), consider:
- Zustand (lightweight state manager)
- Redux Toolkit (if data relationships become complex)
- Recoil (atom-based approach)

### API Integration

**Runtime Detection**:
```typescript
// App.tsx determines API URL at runtime
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : 'https://api.opentrails.app/api';
```

**Why This Approach**:
- Expo web doesn't load .env.local automatically during `expo start --web`
- Runtime detection avoids build-time variables
- Works consistently across dev, staging, production

---

## 🖥️ Backend Architecture

### Tech Stack
- **Runtime**: Node.js 18+ (LTS)
- **Framework**: Express 5.2.1
- **Local DB**: SQLite 3
- **Cloud DB**: PostgreSQL 15
- **ORM**: None (raw SQL for simplicity)
- **Testing**: Jest + Supertest (17 API tests)

### API Server Design

#### Local Development (SQLite)
```
index.js
├── Database init (db.js)
├── Import trails from GeoJSON
├── Setup in-memory SQLite
└── Routes (/api/trails, /api/stats, etc.)
```

#### Production (PostgreSQL)
```
index-postgres.js
├── Database connection pool
├── Migrations on startup
├── Cloud SQL SSL verification
└── Same routes as local
```

### REST API Endpoints

```
GET /health
  → Health check status
  Response: {"status":"ok","dbReady":true}

GET /api/trails
  Parameters: difficulty, minLength, maxLength, search, etc.
  Response: GeoJSON FeatureCollection (144 trails)
  Example: /api/trails?search=bear&difficulty=Easy

GET /api/trails/:id
  → Single trail by feature ID
  Response: Single Feature

GET /api/trails/nearby
  Parameters: lat, lon, radiusKm
  Response: Nearby trails within radius
  Example: /api/trails/nearby?lat=40&lon=-105&radiusKm=5

GET /api/stats
  → Aggregate statistics
  Response: {count, totalDistance, avgElevation, minElevation, maxElevation, difficultyBreakdown}

POST /api/activities (planned Phase 3.2)
  Body: {userId, trailId, duration, distance, elevation}
  Response: {activityId, ...}

GET /api/reviews (planned Phase 3.2)
  Parameters: trailId, limit, offset
  Response: Array of reviews with ratings
```

### Database Schema (SQLite/PostgreSQL)

#### Trails Table
```sql
CREATE TABLE trails (
  id TEXT PRIMARY KEY,
  properties JSONB,      -- {name, difficulty, length_miles, elevation_gain_ft, surface, url}
  geometry GEOMETRY,     -- GeoJSON geometry (PostGIS)
  created_at TIMESTAMP
);
CREATE INDEX ON trails USING GIST (geometry);  -- Spatial index
```

#### Activities Table (Planned Phase 3.2)
```sql
CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  trail_id TEXT NOT NULL,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration_minutes INTEGER,
  distance_km DECIMAL,
  elevation_gain_m INTEGER,
  gps_track LINESTRING,  -- PostGIS: trail path
  created_at TIMESTAMP,
  FOREIGN KEY (trail_id) REFERENCES trails(id)
);
```

#### Reviews Table (Planned Phase 3.2)
```sql
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  trail_id TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  FOREIGN KEY (trail_id) REFERENCES trails(id)
);
```

### API Error Handling

```javascript
// Standardized error responses
res.status(400).json({ error: "Invalid parameters" });
res.status(404).json({ error: "Trail not found" });
res.status(500).json({ error: "Database error" });
```

**Error Categories**:
- 400: Bad request (invalid query params, missing required fields)
- 404: Not found (trail doesn't exist)
- 429: Rate limit exceeded (future)
- 500: Server error (database, unexpected)

---

## 🔐 Authentication & Authorization (Phase 3.2)

### Firebase Setup

**Configuration**:
```typescript
// app/src/config/firebase.ts
initializeApp({
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "opentrails-xxxxx.firebaseapp.com",
  projectId: "opentrails-66626",
  storageBucket: "opentrails-66626.appspot.com",
  messagingSenderId: "xxxxxxxxxxxxx",
  appId: "1:xxxxxxxxxxxxx:web:xxxxxxxxxxxxx"
});

// Enable Email/Password authentication
initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
```

**User Flow**:
1. Sign up with email/password
2. Firebase generates user ID
3. Store user in AsyncStorage (offline persistence)
4. Send user ID in API requests
5. Server validates user exists in Firebase before accepting activities/reviews

---

## 🗺️ Data Pipeline (Trail Data)

### Current (Phase 1-3)
```
OpenStreetMap
  ↓ (osmnx, GeoPandas)
Python ETL → GeoJSON
  ↓
npm run sync-trails
  ↓
SQLite (local) / PostgreSQL (cloud)
  ↓
API responses
  ↓
Frontend MapLibre GL
```

### Phase 3.2 Expansion
**Goal**: 5,000+ trails across USA

**Data Sources**:
1. **OpenStreetMap** (free, comprehensive)
   - Current: Boulder, CO (144 trails)
   - Phase 3.2: CA, CO, WA, CO, NY by state

2. **Hiking Project API** (requires API key)
   - Alternative for trail names & reviews
   - Rate limited

3. **AllTrails Dataset** (commercial, but has free tier)
   - Millions of trails globally
   - Consider for premium features later

**ETL Strategy**:
```python
# Phase 3.2 ETL expansion
for state in ['CA', 'CO', 'WA', 'OR', 'NY']:
    trails_geojson = osmnx.features_from_place(
        f"{state}, USA",
        tags={"leisure": "track", "highway": ["path", "footway"]}
    )
    # Filter to hiking-relevant trails
    # Calculate elevation via DEM
    # Store in database
    # Index spatially for "nearby" queries
```

---

## 📊 Deployment Architecture

### Development (Local)

```
Developer Laptop
├── Terminal 1: npm start (api) → SQLite, :3001
├── Terminal 2: npm run web (app) → Expo, :8081
└── Browser: http://localhost:8081
```

**Why This Works**:
- Fast iteration (no cloud deployments)
- Full debugging capability
- Zero cloud costs during development
- Same code as production (just different DB)

### Staging (Cloud - Phase 3.2)

```
Google Cloud Platform
├── Cloud Run (Express API)
├── Cloud SQL (PostgreSQL)
└── Cloud Storage (images, logs)
```

**Deployment Process**:
```bash
# Build Docker image
docker build -t gcr.io/opentrails-66626/api:latest .

# Push to Google Container Registry
docker push gcr.io/opentrails-66626/api:latest

# Deploy to Cloud Run
gcloud run deploy opentrails-api \
  --image gcr.io/opentrails-66626/api:latest \
  --set-env-vars DB_HOST=CLOUD_SQL_IP,... \
  --memory 512Mi \
  --cpu 2
```

### Production (Live)

```
┌─────────────────────────────────────────┐
│       Vercel (Web Frontend)             │
│  - Automatic deploy on git push         │
│  - Global CDN                           │
│  - HTTPS/SSL included                   │
│  - Env variables in Vercel Dashboard    │
└────────────┬────────────────────────────┘
             │
             ↓ (fetch to)
┌─────────────────────────────────────────┐
│   Google Cloud Run (API)                │
│  - Auto-scaling (0-100 instances)       │
│  - Serverless (pay per request)         │
│  - Health checks every 10s              │
│  - 60s timeout per request              │
└────────────┬────────────────────────────┘
             │
             ↓ (reads from)
┌─────────────────────────────────────────┐
│   Google Cloud SQL (PostgreSQL)         │
│  - Automated backups (daily)            │
│  - SSL/TLS encrypted connections        │
│  - Point-in-time recovery (7 days)      │
│  - 500 MB free tier (expandable)        │
└─────────────────────────────────────────┘
```

### Cost Breakdown (Monthly)

| Service | Free Tier | Estimated Cost | Notes |
|---------|-----------|-----------------|-------|
| **Vercel** | 100GB bandwidth | $0-20 | Deploy limit 100, 10GB storage |
| **Cloud Run** | 2M requests | $5-15 | 128MB RAM, auto-scale |
| **Cloud SQL** | 500MB | $9-25 | PostgreSQL 15, 3.5GB storage |
| **Cloud Storage** | 5GB | $0-10 | For user photos (Phase 3.2) |
| **Total** | Varies | ~$20-70 | Highly dependent on traffic |

**Cost-saving strategies**:
- Use Cloud Run's always-free tier (2M requests/month)
- Use Cloud SQL always-free tier (500MB)
- Only scale up after product-market fit
- Use CDN caching to reduce API requests

---

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] All tests passing (API + E2E)
- [ ] Environment variables set in Vercel Dashboard
- [ ] Firebase project created and credentials configured
- [ ] Cloud SQL instance running with proper backups
- [ ] SSL certificates valid (auto-renewed by cloud providers)

### Deployment Steps
1. Merge PR to main branch
2. Vercel auto-deploys frontend
3. Update API Docker image
4. Deploy to Cloud Run
5. Run smoke tests
6. Monitor logs for errors

### Post-deployment
- [ ] Monitor Cloud Logging for errors
- [ ] Check Vercel analytics for performance
- [ ] Test API endpoints with real data
- [ ] Verify HTTPS/SSL working
- [ ] Check response times (target < 200ms)

---

## 📈 Scaling Strategy

### Current State (Beta)
- **Concurrent users**: < 100
- **Request rate**: < 10 req/sec
- **Data size**: 144 trails (~2MB)

### Phase 3.2 (Public Beta)
- **Concurrent users**: 100-1,000
- **Request rate**: 10-50 req/sec
- **Data size**: 5,000 trails (~50MB)
- **Action**: Enable Cloud Run auto-scaling, increase Cloud SQL to 10GB

### Phase 4 (Public Launch)
- **Concurrent users**: 1,000-10,000
- **Request rate**: 50-200 req/sec
- **Data size**: 50,000+ trails (~500MB)
- **Action**: Add caching layer (Redis), upgrade Cloud SQL, consider CDN for API

---

## 🔍 Monitoring & Observability

### Cloud Logging (Google Cloud)
```bash
# View API errors
gcloud logging read "resource.type=cloud_run_revision" \
  --filter 'severity>=ERROR' \
  --limit 50

# View recent deployments
gcloud logging read "resource.type=cloud_run_revision" \
  --limit 50
```

### Key Metrics to Monitor
1. **API Response Time**: Target < 100ms
2. **Error Rate**: Target < 0.1%
3. **Database Connections**: Watch for leaks
4. **Cloud Run Instance Count**: Verify auto-scaling
5. **Storage Usage**: Monitor database growth

### Alerts to Set Up
- API response time > 500ms
- Error rate > 1%
- Database connection failures
- Cloud SQL storage > 80%
- Cloud Run out of memory

---

## 🔄 Development Workflow

### Local Development
```bash
# 1. Create feature branch
git checkout -b feature/activity-tracking

# 2. Start dev servers
cd api && npm start           # Terminal 1
cd app && npm run web         # Terminal 2

# 3. Make changes
# - Edit app/src/components/ActivityRecording.tsx
# - Edit api/routes/activities.js

# 4. Test locally
npm run test (in respective dir)

# 5. Commit and push
git add .
git commit -m "Add activity tracking feature"
git push origin feature/activity-tracking

# 6. Create PR on GitHub
# 7. CI/CD runs tests
# 8. Merge to main
# 9. Vercel auto-deploys frontend
# 10. Manually deploy API update
```

---

## 🛠️ Technology Decisions & Rationale

| Decision | Choice | Why |
|----------|--------|-----|
| Frontend Framework | React Native (Expo) | Single codebase for web + mobile |
| API Framework | Express | Lightweight, perfect for REST APIs |
| Database (Dev) | SQLite | Zero setup, fast iteration |
| Database (Prod) | PostgreSQL | Spatial queries (PostGIS), proven at scale |
| Hosting | Google Cloud | Free tier generous, good for startups |
| Web Deployment | Vercel | Zero-config, automatic deployments |
| Authentication | Firebase | Free tier, built-in security, scales |
| Maps | MapLibre GL | Open-source, works offline |

---

## 🚨 Known Limitations & Trade-offs

### Current Limitations
1. **Trail data**: Only Boulder, CO (144 trails)
   - Tradeoff: Quality over quantity; can expand incrementally
   
2. **Real-time GPS**: Not in beta
   - Tradeoff: Reduces mobile battery drain; adds in Phase 3.2

3. **Offline maps**: Not in beta
   - Tradeoff: Reduces app size; can cache tiles later

4. **Social features**: Not in beta
   - Tradeoff: Focus on core features first

### Scalability Decisions
- **Spatial indexing**: PostGIS for fast "nearby" queries
- **Caching**: Plan to add Redis in Phase 4
- **API rate limiting**: Plan to add in Phase 3.2 (prevent abuse)
- **Database sharding**: Not needed until 1M+ users

---

## 📚 References & Resources

### Documentation Files
- `README.md` - Quick start
- `BETA-TESTING-GUIDE.md` - Testing instructions
- `PRODUCTION-DEPLOYMENT.md` - Production checklist
- `API.md` - API endpoint documentation
- `COST-CALCULATOR.md` - Detailed cost analysis

### External Resources
- [Expo Documentation](https://docs.expo.dev)
- [MapLibre GL Reference](https://maplibre.org/maplibre-gl-js/docs/)
- [PostgreSQL PostGIS](https://postgis.net/)
- [Express.js Guide](https://expressjs.com/)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Google Cloud Run Docs](https://cloud.google.com/run/docs)

---

**Version**: 1.0  
**Last Updated**: Phase 3 Complete  
**Next Review**: Phase 3.2 (Q2 2025)
