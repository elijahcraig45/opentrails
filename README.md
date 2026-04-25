# OpenTrails 🥾

An open-source, offline-first trail discovery and GPS tracking app. Find, explore, and track hikes with a beautiful, modern interface.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/opentrails/opentrails)](https://github.com/opentrails/opentrails/issues)
[![GitHub Pull Requests](https://img.shields.io/github/pull-requests/opentrails/opentrails)](https://github.com/opentrails/opentrails/pulls)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](package.json)
[![React Native](https://img.shields.io/badge/React%20Native-Web%20%26%20Mobile-blue)](https://reactnative.dev/)

## Features

✨ **Trail Discovery**
- Browse 2,676+ trails from OpenStreetMap and community datasets
- Filter by difficulty (Easy, Moderate, Strenuous) and state
- Full-text search to find trails by name
- Detailed trail information: length, elevation gain, surface type, amenities

🗺️ **Beautiful UI**
- Hipcamp-style trail card tiles for mobile browsing
- Full-screen trail detail pages with hero images
- Responsive design (mobile, tablet, desktop)
- Optional map view with MapLibre GL

📍 **GPS Tracking** (Coming Soon)
- Record your hike with real-time GPS tracking
- Track elevation profile and pace
- Capture photos during your hike
- View activity history and statistics

👥 **Community Features** (Coming Soon)
- User reviews and ratings
- Trail recommendations from hikers
- Social activity feed
- Share trails with friends

📱 **Offline Support** (In Development)
- Download trail maps for offline use
- Offline search and filtering
- Cache trail data locally

## Getting Started

### Prerequisites
- **Node.js 20+** and npm
- **Python 3.9+** (for ETL/trail data extraction)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/opentrails/opentrails.git
   cd opentrails
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd app
   npm install
   
   # API
   cd ../api
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # app/.env (if needed for Vercel deployment)
   REACT_APP_API_URL=http://localhost:3001/api
   ```

### Running Locally

**Frontend** (React Native + Expo on web):
```bash
cd app
npm start          # Opens http://localhost:8081
```

**API Server** (Node.js Express):
```bash
cd api
npm start          # Runs on http://localhost:3001
```

**Tests**:
```bash
cd app
npm exec playwright test    # Run all Playwright tests
npm exec playwright test tests/map.spec.ts  # Run specific test
```

## Project Structure

```
opentrails/
├── app/                      # Frontend (React Native + Expo)
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React context (auth, etc)
│   │   ├── utils/            # Utility functions
│   │   └── types/            # TypeScript types
│   ├── assets/               # GeoJSON trail data
│   ├── tests/                # Playwright E2E tests
│   └── App.tsx               # Main app entry point
│
├── api/                      # Backend API (Node.js Express)
│   ├── index.js              # Main API server
│   ├── db.js                 # SQLite database
│   ├── import-trails.js      # Trail data import utility
│   ├── hiking-project-sync.js # Hiking Project API integration
│   └── opentrails.db         # SQLite database file (2,676 trails)
│
├── etl/                      # Data extraction (Python)
│   ├── extract_trails.py     # OpenStreetMap trail extraction
│   └── requirements.txt      # Python dependencies
│
└── seed_data/                # Trail data files (GeoJSON)
    └── *.geojson             # Trail datasets
```

## Architecture

### Data Pipeline
```
OpenStreetMap (osmnx)
    ↓
ETL: extract_trails.py (Python + GeoPandas)
    ↓
seed_data/*.geojson (GeoJSON files)
    ↓
API: Cloud Run (Node.js Express + SQLite)
    ↓
Frontend: React Native (Expo Web)
    ↓
Browser: Trail cards → Details → Activity tracking
```

### Technology Stack

**Frontend**
- React Native 0.76+ (cross-platform)
- Expo 54+ (web bundler)
- TypeScript 5.9+ (strict mode)
- MapLibre GL (mapping)
- Playwright (E2E testing)

**Backend**
- Node.js 20 (runtime)
- Express (HTTP framework)
- SQLite (database)
- Better-SQLite3 (sync driver)

**Infrastructure**
- Google Cloud Run (API deployment)
- Vercel (frontend auto-deploy from GitHub)
- GitHub Actions (CI/CD ready)

## API Endpoints

### Trails
```
GET /api/trails                    # Get all trails
GET /api/trails?difficulty=Easy    # Filter by difficulty
GET /api/trails?state=CO           # Filter by state
GET /api/trails?search=boulder     # Search by name
GET /api/trails/nearby?lat=40&lon=-105&radiusKm=10  # Spatial search
```

### Metadata
```
GET /api/health                    # Health check
GET /api/states                    # List available states
```

### Sync
```
POST /api/sync/hiking-project      # Sync from Hiking Project API
GET /api/sync/hiking-project/status # Check sync status
```

## Contributing

We welcome contributions! Here's how to get started:

### 1. Fork the repository
Click "Fork" on GitHub to create your own copy.

### 2. Create a feature branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Make your changes
- Follow the existing code style
- Write tests for new features
- Update documentation

### 4. Run tests locally
```bash
cd app
npm exec playwright test
npm exec tsc --noEmit  # TypeScript type check
```

### 5. Commit with clear messages
```bash
git commit -m "feat: add trail ratings"
git push origin feature/your-feature-name
```

### 6. Create a Pull Request
Open a PR on GitHub with:
- Clear description of changes
- Link to relevant issues
- Screenshots (for UI changes)

## Development Guide

### Adding a New Trail Component

1. Create component file: `app/src/components/MyComponent.tsx`
2. Export from `app/src/components/index.ts`
3. Use in `App.tsx` or other components
4. Add TypeScript types in `src/types/index.ts`
5. Test with Playwright

### Running the Trail Data ETL

```bash
cd etl
python -m venv venv
source venv/bin/activate  # or: venv\Scripts\activate on Windows
pip install -r requirements.txt
python extract_trails.py
```

This extracts trails from OpenStreetMap for a configurable region and outputs GeoJSON.

### Adding More Trails

1. **From GeoJSON files**: Place `.geojson` files in `seed_data/`
2. **From Hiking Project API**:
   ```bash
   # Set up API key
   export HIKING_PROJECT_API_KEY=your-key
   # Then in Node:
   curl -X POST http://localhost:3001/api/sync/hiking-project
   ```
3. **From OpenStreetMap**: Run the ETL script (see above)

## Trail Data

### Current Coverage
- **2,676 trails** across 10 US states
- **Data sources**:
  - OpenStreetMap (via osmnx)
  - USGS National Parks database
  - Hiking Project API (optional sync)
  - Community-contributed datasets

### Trail Difficulty
- **Easy**: < 5 miles, < 500 ft elevation
- **Moderate**: 5-10 miles, 500-1500 ft elevation
- **Strenuous**: > 10 miles or > 1500 ft elevation

## Deployment

### Frontend (Vercel)
The app auto-deploys to Vercel on every push to `main`:
1. Push to GitHub
2. Vercel builds and deploys automatically
3. Live at https://opentrails.vercel.app

### API (Cloud Run)
Deploy to Google Cloud Run:
```bash
gcloud run deploy opentrails-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

## Configuration

### Environment Variables

**Frontend** (`.env`)
```
REACT_APP_API_URL=https://your-api.example.com/api
```

**API** (`.env`)
```
NODE_ENV=production
PORT=8080
CORS_ORIGIN=https://your-frontend.example.com
HIKING_PROJECT_API_KEY=your-key-here
```

## Testing

### Unit Tests
```bash
npm run test:unit
```

### E2E Tests (Playwright)
```bash
cd app
npm exec playwright test              # Run all tests
npm exec playwright test tests/map.spec.ts  # Run specific file
npm exec playwright show-report       # View HTML report
```

### Test Coverage
- ✅ API endpoints (health, trails, filtering, search)
- ✅ App loads correctly
- ✅ Login screen renders
- ✅ Trail data validation

## Troubleshooting

### App won't start
```bash
npm install
npm start
```

### API connection issues
- Check `API_BASE_URL` in `app/App.tsx`
- Ensure API is running: `curl http://localhost:3001/api/health`
- Check CORS settings in `api/index.js`

### Playwright tests fail
```bash
# Clear browser cache
npx playwright install

# Run with debugging
npx playwright test --debug
```

### Trail data not loading
```bash
# Verify database has data
sqlite3 api/opentrails.db "SELECT COUNT(*) FROM trails;"

# Reimport trails
node api/import-trails.js
```

## Roadmap

### Q2 2026
- [x] Trail discovery with search/filtering
- [x] Cloud Run API deployment
- [x] Vercel frontend deployment
- [ ] Map view implementation
- [ ] User favorites/bookmarks

### Q3 2026
- [ ] GPS activity tracking
- [ ] Photo uploads
- [ ] User authentication (Firebase)
- [ ] Trail reviews and ratings
- [ ] Offline map downloads

### Q4 2026
- [ ] Social features (sharing, followers)
- [ ] Advanced trail analytics
- [ ] Mobile app (iOS/Android)
- [ ] Trail difficulty crowdsourcing

## License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

Trails data is from **OpenStreetMap**, licensed under **ODbL** (Open Data Commons Open Database License). See [OSM Attribution](https://www.openstreetmap.org/copyright) for details.

## Code of Conduct

We're committed to providing a welcoming and inclusive environment. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for our standards.

## Support

- 📖 **Documentation**: See `/docs` folder
- 🐛 **Report bugs**: Open an [issue](https://github.com/opentrails/opentrails/issues)
- 💬 **Discussions**: Join our [GitHub Discussions](https://github.com/opentrails/opentrails/discussions)
- 📧 **Email**: contact@opentrails.dev (coming soon)

## Authors & Contributors

**Original Author**
- [@elijahcraig45](https://github.com/elijahcraig45) - Creator & Lead Developer

**Contributors**
- We love contributions! See [CONTRIBUTING.md](CONTRIBUTING.md)

## Acknowledgments

- **OpenStreetMap** - Trail data source
- **Hiking Project** - Trail metadata and ratings API
- **MapLibre** - Open-source mapping library
- **React Native & Expo** - Cross-platform framework

---

**Made with ❤️ for hikers, by hikers.**

⭐ **Like this project? Please star it!** ⭐
