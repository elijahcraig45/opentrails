# OpenTrails Development Guide

Quick start for developers working on the OpenTrails hiking trail discovery app.

## Project Structure

```
opentrails/
├── app/                    # React Native (Expo) frontend
│   ├── App.tsx            # Main orchestrator component
│   ├── assets/            # Trail GeoJSON data
│   ├── src/
│   │   ├── components/    # React components
│   │   └── types/         # TypeScript interfaces
│   ├── playwright.config.ts
│   └── package.json
├── api/                    # Node.js Express backend
│   ├── index.js           # REST API server
│   ├── db.js              # SQLite database layer
│   ├── import-trails.js   # GeoJSON importer
│   ├── test-api.js        # Integration tests
│   ├── opentrails.db      # SQLite database
│   ├── API.md             # API documentation
│   └── package.json
├── etl/                    # Python data pipeline
│   ├── extract_trails.py  # Extract OSM trail data
│   └── venv/              # Python virtual environment
├── seed_data/             # Original trail data (GeoJSON)
└── plans/                 # Project roadmap
```

## Getting Started

### 1. Install Dependencies

**Frontend (React Native/Expo):**
```bash
cd app
npm install
npm start --web
```

**API Backend (Node.js):**
```bash
cd api
npm install
npm start
```

**ETL Pipeline (Python):**
```bash
cd etl
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python extract_trails.py
```

### 2. Run the App

#### Web (Development)
```bash
cd app
npm start -- --web
```
Runs on `http://localhost:8081`

#### API Server
```bash
cd api
npm start
```
Runs on `http://localhost:3001`

#### Tests
```bash
cd app
npx playwright test    # E2E tests (7 tests)

cd api
node test-api.js       # API integration tests (17 tests)
```

## Key Technologies

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | React Native / Expo | 54.0.33 / 19.1.0 |
| Mapping | MapLibre GL | 5.24.0 |
| Backend | Node.js / Express | 5.2.1 |
| Database | SQLite | 3.x |
| Language | TypeScript | 5.9.2 |
| Testing | Playwright | 1.59.1 |
| Charts | Recharts | (latest) |
| ETL | Python / GeoPandas | 3.x |

## Development Workflows

### Adding a New Trail Feature

1. **Update Types** (`app/src/types/index.ts`)
   - Add new property to `TrailProperties` interface

2. **Update Components** (`app/src/components/`)
   - Modify `TrailDetailsPanel.tsx` to display new data
   - Update `TrailMap.tsx` paint rules if color-coding

3. **Update Database** (`api/db.js`)
   - Add column to `trails` table schema
   - Update import logic in `import-trails.js`

4. **Update API** (`api/index.js`)
   - Add filter parameter if needed to `/api/trails` endpoint
   - Update stats calculation if needed

5. **Test**
   - Update `api/test-api.js` to test new endpoint
   - Run `npm test` in app directory for E2E tests
   - Run `node test-api.js` in api directory

### Importing New Trail Data

```bash
cd api
rm opentrails.db              # Clear old database
npm install better-sqlite3    # If needed
node import-trails.js         # Import from GeoJSON

# Then in app:
cd ../app
npm run sync-trails           # Sync GeoJSON to app assets
```

### Running ETL Pipeline

```bash
cd etl
source venv/bin/activate      # Activate Python venv
python extract_trails.py      # Downloads OSM data, generates GeoJSON
# Output: seed_data/boulder_trails.geojson

# Sync to app and import to DB:
cd ../app && npm run sync-trails
cd ../api && node import-trails.js
```

## API Endpoints Quick Reference

### Trails
```bash
# Get all trails with filters
curl "http://localhost:3001/api/trails?difficulty=Easy&maxLength=5"

# Get nearby trails
curl "http://localhost:3001/api/trails/nearby?lat=40.01&lon=-105.27&radiusKm=2"

# Get single trail
curl "http://localhost:3001/api/trails/1"

# Get stats
curl "http://localhost:3001/api/stats"
```

### User Activities
```bash
# Log a hike
curl -X POST http://localhost:3001/api/activities \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "trailId": 1,
    "distanceMeters": 5000,
    "elevationGainMeters": 200,
    "durationSeconds": 3600
  }'

# Get user activities
curl "http://localhost:3001/api/users/user-1/activities"

# Get user stats
curl "http://localhost:3001/api/users/user-1/stats"
```

### Reviews
```bash
# Add review
curl -X POST http://localhost:3001/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "trailId": 1,
    "rating": 5,
    "comment": "Great trail!"
  }'

# Get trail reviews
curl "http://localhost:3001/api/trails/1/reviews"
```

## Common Tasks

### Update Trail Styling
- **Color difficulty**: `app/src/components/TrailMap.tsx` lines 30-43
- **Badge styling**: `app/src/components/FilterButtons.tsx` styles
- **Detail colors**: `app/src/components/TrailDetailsPanel.tsx` difficultyColors

### Add Filtering Options
1. Add parameter to `app/src/App.tsx` state
2. Create filter component in `app/src/components/`
3. Pass to `/api/trails` query string
4. Add validation in `api/index.js`

### Debug Database
```bash
cd api

# Check trail count:
sqlite3 opentrails.db "SELECT COUNT(*) FROM trails;"

# View trail sample:
sqlite3 opentrails.db "SELECT name, difficulty, length_meters FROM trails LIMIT 5;"

# Check user activities:
sqlite3 opentrails.db "SELECT * FROM user_activities LIMIT 5;"
```

## Performance Tips

### Frontend
- Use `useMemo` to prevent unnecessary component recalculations (see `App.tsx`)
- MapLibre rendering uses `match` expressions for dynamic styling
- Avoid re-importing full GeoJSON on every render

### Backend
- SQLite indexes on `difficulty`, `length_meters`, `elevation_gain_meters` for fast filters
- Spatial queries use bounding box + distance filter for efficiency
- Database queries prepared statements for reuse

### API Calls
- `/api/trails/nearby` returns max 20 results (configurable)
- Pagination needed for large result sets (TODO)

## Testing Strategy

### E2E Tests (Playwright)
- Located in: `app/tests/map.spec.ts`
- Tests: map load, search, filters, trail details, rendering
- Run: `npx playwright test`

### API Tests
- Located in: `api/test-api.js`
- Tests: all 12+ endpoints with success/failure cases
- Run: `node test-api.js`

### Coverage Gaps
- ⚠️ No unit tests for components yet
- ⚠️ No API authentication tests (not implemented)
- ⚠️ No offline functionality tests

## Debugging

### App Issues
1. **Map not loading?** 
   - Check CSS import in `TrailMap.tsx`
   - Verify GeoJSON file at `app/assets/boulder_trails.geojson`
   - Browser console for MapLibre errors

2. **Component not rendering?**
   - Check imports in `app/src/components/index.ts`
   - TypeScript errors in console
   - Use React DevTools browser extension

3. **Styling issues?**
   - React Native styles in `StyleSheet.create()`
   - Platform-specific handling with `Platform.OS === 'web'`
   - Check responsive width calculations

### API Issues
1. **Database connection failed?**
   - Check `opentrails.db` exists (auto-created on first run)
   - Run `node import-trails.js` if trails table empty
   - Check file permissions

2. **Endpoint 404?**
   - Route order matters! Check `index.js` - `/api/trails/nearby` before `/api/trails/:id`
   - Verify request path matches exactly

3. **Port in use?**
   - API defaults to 3001, override with `PORT=3000 npm start`
   - Kill existing process: `lsof -i :3001` then `kill -9 <PID>`

## Deployment Checklist

- [ ] All tests passing locally
- [ ] API documentation up-to-date (API.md)
- [ ] Environment variables documented (.env.example)
- [ ] Database backed up
- [ ] Elevation data sourced (currently simplified heuristic)
- [ ] Authentication implemented (Firebase)
- [ ] Rate limiting added for public endpoints
- [ ] CORS headers verified
- [ ] Error handling complete
- [ ] Performance benchmarked

## Resources

- **API Docs**: `api/API.md`
- **Phase 3 Summary**: `PHASE3-SUMMARY.md`
- **Copilot Instructions**: `.github/copilot-instructions.md`
- **MapLibre Docs**: https://maplibre.org/maplibre-gl-js/
- **Recharts Docs**: https://recharts.org/
- **OSM Data**: https://www.openstreetmap.org/

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes with tests
3. Run full test suite: `npm test` in both `app/` and `api/`
4. Submit PR with description

## Notes

- Data is for **Boulder, Colorado area** only (144 trails)
- Elevation data is **simplified heuristic** (50m/km baseline)
- Production deployment needs **Firebase Auth** and **PostgreSQL**
- Offline maps require **tile caching** (not yet implemented)

---

For questions or issues, check the copilot-instructions.md or create a GitHub issue.
