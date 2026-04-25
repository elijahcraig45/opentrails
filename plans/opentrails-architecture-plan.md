# OpenTrails: Implementation & Architecture Plan

## 1. Project Overview & Mission
**Mission:** Build a completely open-source, community-driven alternative to AllTrails. All features that improve safety and accessibility (like offline maps and complete trail search) will be free forever. 
**Goal:** Maintain extremely low operational costs so the platform can be sustained indefinitely by minimal ad revenue, community donations, and open-source contributions.

## 2. Core Features (The "Free Forever" Tier)
These are features that competitors often lock behind paywalls, which OpenTrails will provide for free:
*   **Fully Offline Maps:** Download map regions and trail paths to the device for use without cellular coverage. Implemented via "Route-Buffer" downloads (e.g., a 2-5 mile radius around a saved GPX path) to save device storage and minimize cloud egress.
*   **Comprehensive Trail Search:** Advanced filtering by length, elevation gain, difficulty, and accessibility without restrictions.
*   **GPS Activity Tracking & Navigation:** Record route, pace, distance, and elevation. Includes on-trail navigation features like directional heading (compass) and "off-route" alerts if the user wanders too far from the downloaded trail path. Optimized for battery life using `expo-location` set to `accuracy: Balanced` unless the screen is active.
*   **Trailhead Directions:** Deep integration with native mapping apps (Google Maps, Apple Maps) to provide driving directions directly to the trail's starting parking lot.
*   **Community Sourcing & Notes:** Users can upload photos, write reviews, rate trails (1-5 stars), and post real-time "community notes" (e.g., "bridge washed out," "lots of mud today") that act as warnings or helpful tips for others.
*   **Personalization & Curation:** Users can save trails to custom lists, mark favorites, and share trails or lists with friends via deep links.
*   **User-Contributed Trails:** Users can record a new unmapped trail via GPS and submit it to the OpenTrails database, or publish it directly to OpenStreetMap to improve the global map for everyone. (Features an "Edit on OSM" button on trail pages to encourage upstream contributions).
*   **GPX Export/Import:** Freely move data in and out of the app.
*   **No-Account Policy:** Full map viewing and GPX exports are available without an account. Accounts are only required for "Social" features (syncing lists, uploading photos, safety beacon) to build immediate user trust.

### "Killer" Open Source Features
To provide immense value over corporate alternatives, OpenTrails will also include:
*   **Safety "Beacon" (Live Location Sharing):** Users can generate a private, short-lived, obfuscated link for an emergency contact. It pings their live location and intended route via a tiny JSON payload to a Firebase Cloud Function periodically (e.g., every 5-10 minutes) rather than constant streaming, preserving privacy and battery.
*   **Federated Trail Reports:** Implement Fediverse-style (ActivityPub) logic for live condition updates. "Trail Reports" remain open and can be synced across instances, ensuring user-generated data is public property, not corporate-owned.
*   **Decentralized "Anti-Silo" Architecture (Custom Servers):** Empower local hiking clubs or users to host their own PMTiles maps and trail databases (e.g., for "Hidden Gems"). Users can add custom "Server URLs" in the app to view private/local trails alongside the global map.
*   **Live Weather & Hazard Overlays:** Integration with free government APIs (NOAA, EPA) to display map layers for Wildfire Smoke (AQI), Active Fire Perimeters, and Snow Depth.
*   **Red Light / Night Mode:** A true dark red UI/map mode for night hiking or astrophotography to preserve the user's night vision.
*   **Flora/Fauna "Spotted Here" Layer:** Specific community note tags for wildlife sightings (e.g., "Bear spotted," "Wildflowers blooming"), making the map feel alive.
*   **Community Peak-Bagging / Challenges:** Open-source, curated lists (e.g., "Colorado 14ers"). Users earn digital profile badges when their GPS tracks prove they completed the challenge.

## 3. Data Sources & Seed Content (Legally Open)
To avoid expensive commercial API fees and the "empty app" problem without violating Terms of Service (e.g., scraping competitors), we will rely on legally open data:
*   **Base Map, Trail Geometries & Filters:** **OpenStreetMap (OSM)**. We will extract ways and their rich metadata tags (License: ODbL - requires attribution). This data will power our advanced filters:
    *   **Activities:** Tags like `route=hiking`, `bicycle=yes`, `horse=yes`, `atv=yes`.
    *   **Pet Friendly:** Tags like `dog=yes` or `dog=leashed`.
    *   **Difficulty (Strenuous vs Easy):** Calculated algorithmically using the trail's total length, total elevation gain (derived from DEM/SRTM datasets), and specific OSM difficulty tags like `sac_scale` (mountain hiking scale). We will implement Tobler's Hiking Function ($W=6e^{-3.5|dh/dx + 0.05|}$) to estimate average "Moving Time" based on slope, providing a more objective difficulty metric.
    *   **Features (Views, Waterfalls):** We will query OSM for specific Point of Interest (POI) nodes tagged along or near the trail route, such as `tourism=viewpoint` (scenic views), `waterway=waterfall`, or `amenity=parking` (trailheads).
    *   **Accessibility:** Tags like `wheelchair=yes`, `stroller=yes`, and `surface=paved`.
*   **The "Discovery Engine" (Bridging the Names Problem):** To compete with corporate catalogs that own "Trail Names," OpenTrails will use Wikidata tags attached to OpenStreetMap relations to create curated "Route Profiles". Instead of just showing a geographic line, the app aggregates the OSM line, Wikipedia summary descriptions, and CC photos into a rich, searchable trail page.
*   **Seed Photos (Creative Commons):** 
    *   **Flickr API:** Query geolocated photos along trail paths filtered strictly for **Creative Commons (CC-BY)** licenses. The app UI will simply include the legally required photographer attribution (e.g., "Photo by John Doe via Flickr").
    *   **Wikimedia Commons:** Query public domain and CC-licensed geolocated nature photos.
*   **Topography/Elevation:** Open elevation datasets (like SRTM) processed into vector tiles, or low-cost providers like MapTiler.
*   **Map Tile Hosting:** **Protomaps (PMTiles)**. Hosted as single-file archives on basic cloud storage (e.g., Cloudflare R2). This eliminates the need for expensive map servers. (Requires implementing a custom MapLibre GL JS/Native protocol handler using open-source Protomaps plugins).

## 4. Architecture Stack (Optimized for Cost)

### Frontend (Mobile App)
*   **Framework:** React Native with Expo (allows building iOS and Android from one codebase).
*   **Map Renderer:** MapLibre GL Native. An open-source, community-led fork of Mapbox GL. It supports offline vector tiles natively.
*   **State Management:** Zustand or Redux Toolkit.

### Backend & Database (GCP / Firebase)
*   **Platform:** **Google Cloud Platform (GCP) & Firebase**.
*   **Spatial Queries & Database:** **Self-hosted PostgreSQL + PostGIS on GCP Compute Engine**. To avoid expensive managed Cloud SQL fees, we will run the database via Docker on a GCP `e2-micro` VM (which qualifies for the GCP Always Free tier). This provides the power of PostGIS (essential for complex trail routes) at almost zero cost.
    *   **Optimization:** The `postgresql.conf` will be heavily tuned for low-memory environments (reducing `shared_buffers` and `max_connections`).
    *   **Indexing:** GIST indexes on geometry columns and B-tree indexes on filter columns (difficulty, length) will ensure the e2-micro can handle 50,000+ trail filtering efficiently.
    *   **Caching:** A small, self-hosted Redis cache will store the top 100 most popular trails in a region to reduce database hits and mitigate e2-micro sluggishness/cold starts.
*   **Data Processing (ETL):** A Python/GeoPandas script will be used to preprocess messy OSM data, "dissolving" fragmented trail segments (ways) into single, continuous Linestrings before inserting them into PostGIS.
*   **Authentication & Media Storage:** **Firebase Auth** for seamless user management and **Firebase Cloud Storage** for storing user-uploaded trail photos. 

## 5. Cost Breakdown & Monetization
*   **Estimated Monthly Cost (1 User / MVP scale):** ~$0 - $2/month.
    *   Firebase (Auth, Storage): Generous "Spark" free tier easily covers early usage ($0).
    *   GCP Compute Engine (PostgreSQL): `e2-micro` instance is in the Always Free tier ($0). Small potential cost for persistent disk storage if it exceeds the free 30GB limit (~$1-$2).
    *   Domain/App Store Developer accounts: ~$120/year.
*   **Sustainability Model:**
    *   Small, non-intrusive banner ads at the bottom of search pages.
    *   "Supporter" tier (e.g., $10/year) that removes ads and gives a special badge, but unlocks ZERO exclusive functional features.
    *   GitHub Sponsors/Open Collective.

## 6. Legal Considerations & Liability Protection
Building an app that guides people into the wilderness carries inherent risks. To protect the creators and the open-source community from liability, the following legal safeguards are strictly required:

*   **Robust Terms of Service (ToS) & EULA:** Users MUST explicitly agree to a Terms of Service and End User License Agreement before creating an account or viewing maps. This document must clearly state that OpenTrails provides raw map data "AS IS" and that users assume all risks associated with hiking and outdoor activities.
*   **Waiver of Liability & Assumption of Risk:** The ToS must include a comprehensive liability waiver explicitly stating that OpenTrails, its developers, and contributors are not responsible for injuries, death, getting lost, trespassing, or damages resulting from using the app or its data.
*   **"Not for Sole Navigation" Disclaimer:** While the app *provides* GPS navigation and off-route alerts, a prominent legal disclaimer must state that the app is "not a replacement for official maps, compasses, or wilderness survival skills." This is standard legal boilerplate (used by Garmin, Apple, and Google) to protect you from liability if a user gets lost due to a dead phone battery, GPS drift, or inaccurate open-source map data.
*   **User-Generated Content (UGC) Policy & DMCA:** Because users can upload photos, comments, and new trails, we must have a system to report and remove inappropriate content, copyright violations (DMCA Safe Harbor), and dangerous community notes (e.g., encouraging trespassing).
*   **Open Data Attribution:** Strict adherence to the Open Database License (ODbL) for OpenStreetMap data and Creative Commons (CC-BY) licenses for seed photos. Proper attribution must be visible in the app to avoid copyright infringement from data providers.
*   **Privacy Policy (GDPR/CCPA):** Clear documentation on how user data (especially highly sensitive GPS location data) is collected, stored, anonymized, and deleted. Location tracking must be strictly opt-in.

## 7. Implementation Phases

*   **Phase 1: Foundation (Data & Mapping)**
    *   Set up React Native + MapLibre.
    *   Configure Protomaps PMTiles to render a basic offline-capable base map.
    *   Write scripts to extract OSM trail data and load it into self-hosted PostGIS on GCP Compute Engine.
*   **Phase 2: Discovery (Search & View)**
    *   Build the main map view and trail list.
    *   Implement spatial search queries (PostGIS).
    *   Trail detail pages (elevation profiles, descriptions).
*   **Phase 3: Community & Tracking (User Auth)**
    *   Implement Firebase Auth.
    *   GPS location tracking and line drawing on the map.
    *   Photo uploads (Firebase Cloud Storage) and user reviews.
*   **Phase 4: Polish & Open Source Release**
    *   Offline map region downloading mechanism.
    *   UI/UX polish.
    *   Publish to GitHub with contribution guidelines.

## 8. Development Guardrails (For AI Agent Reference)

*    Dependency Strategy: Prioritize native Web APIs or lightweight libraries. Avoid "heavy" UI kits (like Material UI or Tamagui) if they significantly bloat the bundle size.

*    Offline-First Logic: The agent must write data-fetching logic that assumes the user has zero connectivity by default. Use AsyncStorage or SQLite for local caching of trail metadata.

*    GIS Integrity: Any code generated for trail processing must handle "MultiLineStrings" and "LineStrings" interchangeably to account for how OSM data is structured.

*    Minimalist UI: Design language should be "Utility-First." Use high-contrast colors for outdoor visibility. Avoid complex animations that drain battery.

*    API Design: All backend endpoints must be designed for idempotency. Since hikers often have "spotty" service, the app may try to upload a review or a GPS ping multiple times; the backend must handle this without creating duplicate entries.