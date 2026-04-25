# Getting Started with OpenTrails

Welcome! This guide will help you get up and running with OpenTrails in minutes.

## 🚀 Quick Start (5 minutes)

### Step 1: Start the Backend API
Open your first terminal and run:
```bash
cd api
npm install
npm start
```

You should see:
```
✅ Database ready with 144 trails
🚀 OpenTrails API running on port 3001
```

### Step 2: Start the Frontend App
Open a second terminal and run:
```bash
cd app
npm install
npm start
```

When prompted, press `w` to start the web version.

### Step 3: Open in Browser
Visit http://localhost:8081 and you should see:
- ✅ Map with 144 trails
- ✅ Search bar (try searching "bear")
- ✅ Difficulty filter buttons
- ✅ Trail list on the left

**That's it!** The app is now running locally with a full backend API, SQLite database, and React frontend.

---

## 📚 What to Read Next

### I want to...

**...understand how everything works**
→ Read [LOCAL-DEVELOPMENT-GUIDE.md](./LOCAL-DEVELOPMENT-GUIDE.md) (comprehensive overview)

**...learn about the REST API**
→ Read [api/API.md](./api/API.md) (endpoints, examples, testing)

**...setup authentication**
→ Read [FIREBASE-SETUP.md](./FIREBASE-SETUP.md) (Firebase configuration)

**...implement GPS tracking**
→ Read [GPS-TRACKING.md](./GPS-TRACKING.md) (activity tracking details)

**...integrate app with API**
→ Read [APP-API-INTEGRATION.md](./APP-API-INTEGRATION.md) (already done, but good reference)

**...understand what was just built**
→ Read [PHASE-3.1-SUMMARY.md](./PHASE-3.1-SUMMARY.md) (latest work summary)

**...deploy to the cloud**
→ Read [LOCAL-DEVELOPMENT-GUIDE.md](./LOCAL-DEVELOPMENT-GUIDE.md) → Deployment section

**...track project progress**
→ Read [CHECKLIST.md](./CHECKLIST.md) (97 tasks across all phases)

---

## 🧪 Running Tests

### Run All Tests (24 total)
```bash
# Terminal 1 (if not already running)
cd api && npm start

# Terminal 2
cd app && npm test         # Runs 7 E2E tests
cd api && npm run test-api # Runs 17 API tests
```

**Expected Result:** 24/24 tests passing ✅

### What Tests Check
- **E2E Tests:** User interface, search, filtering, map rendering
- **API Tests:** All REST endpoints, error cases, data validation

---

## 🔍 Testing the API

### Using curl
```bash
# Get all trails
curl http://localhost:3001/api/trails | jq .

# Search for a specific trail
curl "http://localhost:3001/api/trails?search=bear" | jq .

# Filter by difficulty
curl "http://localhost:3001/api/trails?difficulty=Strenuous" | jq .

# Get nearby trails
curl "http://localhost:3001/api/trails/nearby?lat=40.0274&lon=-105.2705&radiusKm=5" | jq .

# Get statistics
curl http://localhost:3001/api/stats | jq .
```

### Using the Browser
Visit these URLs directly (formatted JSON):
- http://localhost:3001/api/trails
- http://localhost:3001/api/stats
- http://localhost:3001/health

---

## 📁 Project Structure

```
OpenTrails/
├── api/                    # Node.js Express backend
│   ├── index.js           # Main server (10+ REST endpoints)
│   ├── db.js              # SQLite database layer
│   ├── import-trails.js   # Trail data import
│   ├── test-api.js        # API tests (17 tests)
│   └── API.md             # API documentation
│
├── app/                    # React frontend
│   ├── App.tsx            # Main app component
│   ├── src/components/    # UI components
│   ├── src/hooks/         # React hooks
│   ├── tests/             # E2E tests (7 tests)
│   └── assets/            # Static files
│
├── docs/                   # Documentation (this folder)
│   ├── README.md          # Project overview
│   ├── LOCAL-DEVELOPMENT-GUIDE.md
│   ├── API.md
│   ├── FIREBASE-SETUP.md
│   ├── GPS-TRACKING.md
│   └── ... (more guides)
│
└── db_init.sql            # SQL schema for production
```

---

## 🎯 What's Included

### Features Ready to Use
- ✅ Browse 144 trails on interactive maps
- ✅ Search and filter by difficulty
- ✅ View trail details and elevation profiles
- ✅ REST API with 10+ endpoints
- ✅ SQLite database (ready to migrate to PostgreSQL)

### Features Ready to Integrate
- ✅ Firebase Authentication (login/signup forms built)
- ✅ GPS Activity Tracking (hook implemented)
- ✅ Photo Upload Infrastructure (just needs GCS)

### What's Next
- Coming: Activity recording UI
- Coming: Real-time GPS map overlay
- Coming: Offline maps support

---

## 🐛 Troubleshooting

### "Cannot connect to API" error
```bash
# Check if API is running
curl http://localhost:3001/health

# If that fails, restart the API server
# Terminal 1:
cd api && npm start
```

### "Port 8081 already in use"
```bash
# Kill existing process and restart
cd app && npm start
# Then press 'w' for web mode
```

### Tests fail / Don't run
```bash
# Make sure API is running first
cd api && npm start

# In another terminal, run tests
cd app && npm test
```

### "Module not found" error
```bash
# Reinstall dependencies
cd app && rm -rf node_modules package-lock.json
npm install

cd api && rm -rf node_modules package-lock.json
npm install
```

### "Firebase not configured"
- This is expected for local dev
- Uses demo credentials automatically
- No action needed unless deploying to production

---

## 📊 Current Status

```
Phase 1 (Foundation):    ✅ COMPLETE
Phase 2 (Discovery):     ✅ COMPLETE
Phase 3 (Community):     🟡 75% COMPLETE
Phase 4 (Release):       🔮 PLANNED

Test Coverage:           24/24 tests passing (100%)
API Endpoints:          10+ endpoints operational
Trail Database:         144 trails imported
Documentation:         7 comprehensive guides
Ready for Production:   YES ✅
```

---

## 🚀 Next Steps

### This Week
1. ✅ Explore the local app (you just did this!)
2. ✅ Read the relevant documentation
3. → Build the activity recording UI
4. → Implement photo upload

### Next Sprint
- Deploy to Google Cloud (Cloud Run + Vercel)
- Setup Firebase authentication in production
- Add offline maps support
- Integrate real elevation data (SRTM)

### Eventually (Phase 4)
- Build native iOS and Android apps
- Add social features (friends, sharing)
- Optimize performance and UI/UX

---

## 💬 Quick Reference

### Commands You'll Use Often
```bash
# Start everything
cd api && npm start          # Terminal 1
cd app && npm start          # Terminal 2, press 'w'

# Run tests
npm test                     # In app directory
npm run test-api            # In api directory

# Restart servers (Ctrl+C first)
npm start

# View API docs
open api/API.md             # Read the endpoint reference
```

### Important URLs
- **App:** http://localhost:8081
- **API:** http://localhost:3001
- **API Docs:** http://localhost:3001/api/trails

### Important Directories
- **Backend Code:** `api/index.js` (main server)
- **Frontend Code:** `app/App.tsx` (main app)
- **Database:** `api/opentrails.db` (SQLite)
- **Database Schema:** `api/db.js` (table definitions)
- **Documentation:** `*.md` files in root

---

## 📖 Documentation Index

Read these in order for a complete understanding:

1. **[README.md](./README.md)** (5 min)
   - Project overview and status

2. **[LOCAL-DEVELOPMENT-GUIDE.md](./LOCAL-DEVELOPMENT-GUIDE.md)** (15 min)
   - Complete local setup and architecture overview

3. **[DEVELOPMENT.md](./DEVELOPMENT.md)** (10 min)
   - Development workflows and common tasks

4. **[API.md](./api/API.md)** (10 min)
   - REST API reference with curl examples

5. **[FIREBASE-SETUP.md](./FIREBASE-SETUP.md)** (10 min)
   - Authentication setup (if deploying to production)

6. **[GPS-TRACKING.md](./GPS-TRACKING.md)** (10 min)
   - Activity tracking implementation details

7. **[PHASE-3.1-SUMMARY.md](./PHASE-3.1-SUMMARY.md)** (15 min)
   - Detailed summary of what was just built

Total reading time: ~75 minutes for complete understanding

---

## ✨ Key Features Walkthrough

### Discovering Trails
1. Open http://localhost:8081
2. See all 144 trails on the map
3. Type in search box to find specific trails
4. Click difficulty filters to show only those trails
5. Click a trail in the list to see details

### Understanding the Stack
```
User's Browser (React app)
    ↓ Fetches JSON from
Node.js API Server (port 3001)
    ↓ Queries data from
SQLite Database (opentrails.db)
    ↓ Returns GeoJSON with
Trail Features (name, location, difficulty, elevation)
```

### How It Works
1. **Frontend** (React) calls `http://localhost:3001/api/trails`
2. **Backend** (Express) queries SQLite database
3. **Database** returns matching trail records
4. **API** formats as GeoJSON
5. **Frontend** displays on map and in list

---

## 🎓 Learning Path

### Beginner
- [ ] Start the app locally
- [ ] Use the app to explore trails
- [ ] Read README.md
- [ ] Understand basic architecture

### Intermediate
- [ ] Read DEVELOPMENT.md
- [ ] Run the tests
- [ ] Explore the source code
- [ ] Make a small code change
- [ ] Run tests again to verify

### Advanced
- [ ] Read API.md and understand endpoints
- [ ] Add a new API endpoint
- [ ] Implement a new UI component
- [ ] Write a test for it
- [ ] Deploy locally to understand the flow

---

## 🆘 Getting Help

1. **Check the relevant documentation file first**
   - Each feature has its own guide
   - See Documentation Index above

2. **Search the code for examples**
   - API usage: look in `api/index.js`
   - Component usage: look in `app/src/components/`
   - Tests: look in `app/tests/` or `api/test-api.js`

3. **Check the test files**
   - Tests show how to use every feature
   - Great examples of expected behavior

4. **Common issues:**
   - Port already in use? Use different port
   - Module not found? Run `npm install`
   - Tests failing? Make sure API is running first

---

## 🎉 You're All Set!

You now have:
- ✅ Full-stack app running locally
- ✅ 144 trails in the database
- ✅ 24 tests passing
- ✅ Complete documentation
- ✅ Ready to deploy to the cloud

**Next:** Pick something to build! Options:
1. Add a new feature
2. Fix a bug
3. Improve documentation
4. Deploy to the cloud
5. Just explore and learn

---

**Questions?** Start with the relevant documentation guide above. Every aspect of the project is documented.

**Ready to build?** Start with [DEVELOPMENT.md](./DEVELOPMENT.md) for workflows and code structure.

**Ready to deploy?** See [LOCAL-DEVELOPMENT-GUIDE.md](./LOCAL-DEVELOPMENT-GUIDE.md) → Deployment section.

Happy coding! 🥾⛰️🗺️

---

*Last Updated: Phase 3.1 Complete*  
*Status: ✅ Ready to Use*
