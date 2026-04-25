# Cost-Effective OpenTrails Cloud Deployment Guide

## Executive Summary

Deploy OpenTrails to production with **less than $50/month** using Google Cloud Platform's free tier and pay-as-you-go pricing.

**Total Setup Cost:** $0 (free tier)  
**Monthly Cost (after free tier):** $10-30 (depending on usage)  
**Deployment Time:** 2-3 hours  

---

## Part 1: Infrastructure Overview & Cost Breakdown

### What You Need

```
┌─────────────────────────────────────────────────────────┐
│                   OPENTRAILS STACK                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  🌐 Frontend (User's Browser)                            │
│     └─ Vercel CDN + React App (Static HTML/JS)         │
│                                                           │
│  🔗 API Gateway                                         │
│     └─ Google Cloud Run (Serverless Node.js)           │
│                                                           │
│  🗄️  Database                                            │
│     └─ Cloud SQL PostgreSQL (Managed Database)          │
│                                                           │
│  🔐 Authentication                                       │
│     └─ Firebase (Google's managed auth service)         │
│                                                           │
│  💾 Storage                                             │
│     └─ Google Cloud Storage (for photos)                │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Cost Breakdown (Monthly)

| Service | Free Tier | Pricing | Estimated Cost |
|---------|-----------|---------|-----------------|
| **Vercel (Frontend)** | 100 GB bandwidth | $0.15/GB excess | **$0-5** |
| **Cloud Run (API)** | 2M requests/month | $0.40 per 1M | **$0-5** |
| **Cloud SQL (Database)** | 1 shared CPU, 3.75 GB RAM | $0.25/day after free | **$0-8** |
| **Cloud Storage (Photos)** | 5 GB/month | $0.020/GB after free | **$0-2** |
| **Firebase Auth** | Unlimited | Free tier sufficient | **$0** |
| **Cloud Logging** | 50 GB/month | $0.50/GB after free | **$0-5** |
| **Domain Name** (optional) | - | $10-15/year | **$1** |
| **Cloud KMS** (encryption) | Free tier sufficient | - | **$0** |
| **Monitoring & Support** | Google Cloud Console | Free | **$0** |
| **TOTAL** | | | **$1-26/month** |

### What Qualifies for Free Tier?

✅ **Vercel:** 100 GB bandwidth/month (plenty for 1000s of users)  
✅ **Cloud Run:** 2M requests/month (~67k requests/day!)  
✅ **Cloud SQL:** First 3 months free, then $0.25/day  
✅ **Cloud Storage:** 5 GB/month free  
✅ **Firebase:** Auth is always free  
✅ **Cloud Logging:** 50 GB/month before charges  

**Real Cost (First 3 months):** $0 per month!  
**Real Cost (After free tier):** $8-15/month average  

---

## Part 2: Step-by-Step Deployment

### Phase 1: Prepare Cloud Project (30 minutes)

#### Step 1.1: Create Google Cloud Project
```bash
# Go to console.cloud.google.com
# Click "Select a Project" → "New Project"
# Name: "opentrails"
# Organization: (use default)
# Click "Create"

# Wait for project creation (takes 1-2 minutes)
# Then select your new project

# Install gcloud CLI
# macOS: brew install google-cloud-sdk
# Windows: Download from cloud.google.com/sdk
# Linux: curl https://sdk.cloud.google.com | bash
```

#### Step 1.2: Initialize gcloud
```bash
gcloud init
# Login with your Google account
# Select "opentrails" project
```

#### Step 1.3: Enable Required APIs
```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com
```

Expected output:
```
Enabling service [run.googleapis.com]...
Enabling service [sqladmin.googleapis.com]...
...
Operation completed successfully.
```

#### Step 1.4: Set Up Billing (Necessary but $0 for free tier)
```bash
# Go to console.cloud.google.com/billing
# Click "Create Account"
# Add payment method (won't be charged if you stay in free tier)
# Link billing account to project
```

**Why billing is needed:** Google requires it even though you won't be charged on free tier.

---

### Phase 2: Deploy Database (45 minutes)

#### Step 2.1: Create Cloud SQL PostgreSQL Instance
```bash
gcloud sql instances create opentrails-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --availability-type=zonal \
  --enable-bin-log \
  --backup-start-time=03:00 \
  --root-password=$(openssl rand -base64 32)
```

**What this does:**
- `db-f1-micro`: Smallest instance ($0.25/day after free)
- `us-central1`: Cheapest region
- `zonal`: No backup replica (cost-saving)
- `enable-bin-log`: Allows point-in-time recovery

Wait for creation (2-5 minutes):
```
Creating Cloud SQL instance...
```

#### Step 2.2: Get Database Connection Info
```bash
gcloud sql instances describe opentrails-db \
  --format="value(ipAddresses[0].ipAddress)"
```

Save this IP address - you'll need it later.

#### Step 2.3: Create Database and User
```bash
# Set instance name
INSTANCE=opentrails-db

# Create database
gcloud sql databases create opentrails \
  --instance=$INSTANCE

# Create user
DB_USER=opentrails
DB_PASSWORD=$(openssl rand -base64 32)

gcloud sql users create $DB_USER \
  --instance=$INSTANCE \
  --password=$DB_PASSWORD

# Save credentials to file
cat > cloud_sql_credentials.txt <<EOF
Connection String: postgresql://$DB_USER:$DB_PASSWORD@$INSTANCE:5432/opentrails
Username: $DB_USER
Password: $DB_PASSWORD
EOF

cat cloud_sql_credentials.txt
```

**IMPORTANT:** Save the connection string and password! You'll need it for the API.

#### Step 2.4: Enable Public IP for Initial Setup
```bash
gcloud sql instances patch opentrails-db \
  --require-ssl=false \
  --quiet
```

**Security Note:** After migration, we'll restrict to Cloud Run only.

#### Step 2.5: Add Current IP to Firewall (So You Can Connect)
```bash
# Find your public IP
curl https://checkip.amazonaws.com

# Save it
MY_IP="your.ip.address.here"

# Add to Cloud SQL firewall
gcloud sql instances patch opentrails-db \
  --authorized-networks=$MY_IP \
  --quiet
```

#### Step 2.6: Migrate Data from SQLite
```bash
# From your local machine, install postgres client
# macOS: brew install postgresql
# Windows: Download pgAdmin or psql separately
# Linux: sudo apt-get install postgresql-client

# Get Cloud SQL IP
CLOUD_SQL_IP=$(gcloud sql instances describe opentrails-db \
  --format="value(ipAddresses[0].ipAddress)")

# Create SQL migration file
cd api
node import-trails.js > migrate.sql

# Connect and import data
PGPASSWORD=$DB_PASSWORD psql \
  -h $CLOUD_SQL_IP \
  -U $DB_USER \
  -d opentrails \
  -f db_init.sql

PGPASSWORD=$DB_PASSWORD psql \
  -h $CLOUD_SQL_IP \
  -U $DB_USER \
  -d opentrails \
  -f migrate.sql

# Verify migration
PGPASSWORD=$DB_PASSWORD psql \
  -h $CLOUD_SQL_IP \
  -U $DB_USER \
  -d opentrails \
  -c "SELECT COUNT(*) as trail_count FROM trails;"
```

Should output:
```
 trail_count
 -----------
         144
```

**Cost so far:** $0 (free tier applies to first 3 months)

---

### Phase 3: Deploy API Backend (30 minutes)

#### Step 3.1: Update API for PostgreSQL
Edit `api/index.js`:
```javascript
// Replace SQLite connection with PostgreSQL
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // or individual params:
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
});

// Replace synchronous db calls with async
app.get('/api/trails', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM trails LIMIT 100');
    client.release();
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

#### Step 3.2: Create Dockerfile
```bash
cd api
cat > Dockerfile <<'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY index.js ./

EXPOSE 8080
ENV PORT=8080

CMD ["node", "index.js"]
EOF
```

#### Step 3.3: Update package.json
```json
{
  "name": "opentrails-api",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.8.0",
    "cors": "^2.8.5"
  }
}
```

#### Step 3.4: Build and Push Container
```bash
cd api

# Set variables
PROJECT_ID=$(gcloud config get-value project)
IMAGE_NAME=opentrails-api
IMAGE_TAG=latest

# Configure Docker authentication
gcloud auth configure-docker

# Build container
docker build -t gcr.io/$PROJECT_ID/$IMAGE_NAME:$IMAGE_TAG .

# Push to Google Container Registry
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:$IMAGE_TAG

# Verify push
gcloud container images list --project=$PROJECT_ID
```

#### Step 3.5: Deploy to Cloud Run
```bash
gcloud run deploy opentrails-api \
  --image=gcr.io/$PROJECT_ID/$IMAGE_NAME:$IMAGE_TAG \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --timeout=60 \
  --max-instances=10 \
  --set-env-vars="DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$CLOUD_SQL_IP:5432/opentrails"
```

Wait for deployment (1-2 minutes).

#### Step 3.6: Get API URL
```bash
gcloud run services describe opentrails-api \
  --platform=managed \
  --region=us-central1 \
  --format='value(status.url)'
```

Save this URL - it looks like:
```
https://opentrails-api-xxxxx-uc.a.run.app
```

#### Step 3.7: Restrict Database Access
```bash
# Remove public access
gcloud sql instances patch opentrails-db \
  --clear-authorized-networks \
  --quiet

# Get Cloud Run service account
SERVICE_ACCOUNT=$(gcloud run services describe opentrails-api \
  --platform=managed \
  --region=us-central1 \
  --format='value(spec.template.spec.serviceAccountName)')

# Allow Cloud Run to access database
gcloud sql instances patch opentrails-db \
  --database-flags=cloudsql_iam_authentication=on \
  --quiet
```

#### Test API
```bash
# Get a trail
curl https://opentrails-api-xxxxx-uc.a.run.app/api/trails | jq .

# Should return 144 trails!
```

**Cost so far:** $0 (Cloud Run free tier: 2M requests/month)

---

### Phase 4: Deploy Frontend (20 minutes)

#### Step 4.1: Create Vercel Account
```bash
# Go to vercel.com
# Sign up with GitHub account (easier)
# Create team/project
```

#### Step 4.2: Update Frontend API Endpoint
Edit `app/.env.production`:
```
EXPO_PUBLIC_API_BASE_URL=https://opentrails-api-xxxxx-uc.a.run.app/api
```

#### Step 4.3: Build Production Bundle
```bash
cd app

# Create optimized build
npx expo export:web

# This creates dist/ folder with all static assets
```

#### Step 4.4: Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd app
vercel deploy --prod

# Follow prompts:
# - Link to existing project? No (first time)
# - Set up and deploy? Yes
# - Which scope? Your name
# - Link to existing Vercel project? No
```

Wait for deployment (1-2 minutes).

#### Step 4.5: Get Frontend URL
After deployment completes, Vercel shows your URL:
```
https://opentrails.vercel.app
```

#### Step 4.6: Update CORS in Backend
Edit `api/index.js`:
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://opentrails.vercel.app',
    'http://localhost:8081' // Keep for local dev
  ],
  credentials: true
}));
```

Redeploy API:
```bash
docker build -t gcr.io/$PROJECT_ID/$IMAGE_NAME:latest .
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:latest
gcloud run deploy opentrails-api \
  --image=gcr.io/$PROJECT_ID/$IMAGE_NAME:latest \
  --region=us-central1
```

**Test it!** Visit https://opentrails.vercel.app

**Cost so far:** $0 (Vercel free tier: 100 GB bandwidth)

---

### Phase 5: Setup Monitoring (15 minutes)

#### Step 5.1: Enable Cloud Monitoring
```bash
gcloud services enable monitoring.googleapis.com

# Create alert for API errors
gcloud alpha monitoring policies create \
  --notification-channels=[CHANNEL_ID] \
  --display-name="OpenTrails API Errors"
```

#### Step 5.2: View Logs
```bash
# See recent API logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=opentrails-api" \
  --limit=50 \
  --format=json | jq .
```

#### Step 5.3: Setup Custom Domain (Optional)
```bash
# Point your domain to Vercel
# In Vercel dashboard → Settings → Domains
# Add domain (e.g., opentrails.com)
# Follow DNS instructions

# Similar for API:
# Point api.opentrails.com to Cloud Run
```

**Cost so far:** $0-5/month (monitoring, depending on log volume)

---

## Part 3: Cost Optimization Strategies

### 1. Use Smaller Database Instance (Save $5-10/month)
```bash
# Current: db-f1-micro ($0.25/day after 3-month free)
# Even cheaper: Use SQLite in Cloud Run!
# Or: PostgreSQL serverless (Alloydb Free) - coming soon
```

### 2. Scale Cloud Run to Zero (Save $2/month)
```bash
gcloud run deploy opentrails-api \
  --region=us-central1 \
  --min-instances=0 \
  --max-instances=5
```

### 3. Archive Old Logs (Save $1-3/month)
```bash
# Automatically archive logs older than 30 days
gcloud logging sinks create archive-sink \
  gs://opentrails-logs-archive \
  --log-filter='timestamp<"-P30D"'
```

### 4. Use Spot Instances for Dev (Save $5-10/month)
```bash
# Cloud Run doesn't support spot, but Cloud Run Jobs do
# Consider for non-critical workloads
```

### 5. Set Budget Alerts
```bash
# Go to console.cloud.google.com/billing/budgets
# Set budget: $50/month
# Alerts at 50%, 90%, 100%
```

---

## Part 4: Troubleshooting & Common Issues

### "Cloud Run says: Error 500"
```bash
# Check logs
gcloud logging read "resource.type=cloud_run_revision" \
  --limit=20 \
  --format=json

# Most likely: DATABASE_URL not set
# Fix: 
gcloud run services update opentrails-api \
  --update-env-vars="DATABASE_URL=postgresql://..."
```

### "Database connection refused"
```bash
# Check if Cloud SQL instance is running
gcloud sql instances describe opentrails-db

# Check firewall allows Cloud Run
gcloud sql instances describe opentrails-db \
  --format="value(settings.ipConfiguration.authorizedNetworks)"

# Verify connection string format:
# postgresql://user:password@host:5432/database
```

### "React app shows API errors"
```bash
# Check CORS is configured correctly
# Check API_BASE_URL in app/.env.production
# Check Vercel build log:
#   vercel logs https://opentrails.vercel.app
```

### "Very high bills!"
```bash
# Check Cloud Run invocations
gcloud logging read "resource.type=cloud_run_revision" \
  --format="value(resource.labels.service_name, severity, timestamp)" | sort | uniq -c

# Check Cloud SQL operations
gcloud sql operations list --instance=opentrails-db

# Check storage usage
gsutil du -s gs://opentrails-storage
```

---

## Part 5: Ongoing Maintenance

### Monthly Tasks (5 minutes)
```bash
# Check bills
gcloud billing accounts list

# Review logs for errors
gcloud logging read --limit=100

# Check database size
PGPASSWORD=$DB_PASSWORD psql -h $CLOUD_SQL_IP -U opentrails -d opentrails \
  -c "SELECT pg_size_pretty(pg_database_size('opentrails'));"

# Verify backups were taken
gcloud sql backups list --instance=opentrails-db
```

### Quarterly Tasks (30 minutes)
```bash
# Update dependencies
cd api && npm audit
cd app && npm audit

# Test backup restoration
gcloud sql backups create --instance=opentrails-db

# Review security settings
gcloud sql instances describe opentrails-db \
  --format="value(settings.ipConfiguration)"
```

### Annual Tasks (1 hour)
```bash
# Review cost optimization opportunities
gcloud billing budgets list

# Upgrade Node.js/dependencies if needed
node --version  # Should be 18+

# Security audit
# - Check IAM permissions
# - Review firewall rules
# - Update SSL certificates
```

---

## Part 6: Cost Monitoring Dashboard

### Create Spreadsheet to Track Costs
```
Date        | Service      | Estimated | Actual | Notes
------------|--------------|-----------|--------|--------
2024-05-01  | Cloud Run    | $0        | $0     | Free tier
2024-05-01  | Cloud SQL    | $0        | $0     | Free tier (3mo)
2024-05-01  | Vercel       | $0        | $0     | Free tier
2024-05-01  | TOTAL        | $0        | $0     |
```

### Set Up Alerts
```bash
# Email alerts if bill exceeds $20/month
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="OpenTrails Budget" \
  --budget-amount=20 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=100
```

---

## Part 7: Scaling When You Grow

### If You Get 10,000 Users/Month (Still $0-20)
- ✅ Cloud Run can handle with free tier
- ✅ Vercel bandwidth still under 100 GB
- ✅ Cloud SQL may need larger instance (+$5/month)

### If You Get 100,000 Users/Month ($20-50/month)
```bash
# Upgrade database tier
gcloud sql instances patch opentrails-db \
  --tier=db-n1-standard-1  # Bigger instance

# Setup caching (Redis) - optional
gcloud memorystore:redis create instances opentrails-cache \
  --size=1gb \
  --region=us-central1

# Scale Cloud Run higher
gcloud run deploy opentrails-api \
  --max-instances=100 \
  --region=us-central1
```

### If You Get 1,000,000 Users/Month ($100-200/month)
```bash
# Consider multi-region setup
# Setup load balancer
# Consider GKE (Kubernetes) instead of Cloud Run
# Setup Datastore (NoSQL) for caching

# At this point, get professional DevOps help!
```

---

## Part 8: Security Hardening (Optional but Recommended)

### Step 1: Enable Firewall Rules
```bash
# Restrict database to Cloud Run only
gcloud sql instances patch opentrails-db \
  --clear-authorized-networks \
  --quiet
```

### Step 2: Enable Database Encryption
```bash
gcloud sql instances patch opentrails-db \
  --database-flags=cloudsql_iam_authentication=on \
  --quiet
```

### Step 3: Enable Audit Logging
```bash
gcloud logging sinks create audit-logs \
  logging.googleapis.com/projects/PROJECT_ID/logs/audit \
  --log-filter='protoPayload.methodName=~"sql.*"'
```

### Step 4: Setup Identity and Access Management
```bash
# Cloud Run service can only access what it needs
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member=serviceAccount:opentrails-api@PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/cloudsql.client
```

---

## Final Deployment Checklist

### Before Going Live ✅
- [ ] Cloud SQL instance running with 144 trails
- [ ] Cloud Run API deployed and responds to requests
- [ ] Vercel frontend deployed and loads
- [ ] CORS configured on both API and frontend
- [ ] API endpoint URL saved in frontend .env
- [ ] Frontend URL saved in API CORS config
- [ ] Database backups enabled
- [ ] Monitoring/alerts configured
- [ ] SSL certificates installed (automatic on Vercel/Cloud Run)
- [ ] Domain configured (optional)
- [ ] Billing alerts set to $50/month
- [ ] Team has access to Google Cloud Console
- [ ] Disaster recovery plan documented

### Test Everything ✅
```bash
# 1. Frontend loads
curl https://opentrails.vercel.app

# 2. API responds
curl https://opentrails-api-xxxxx.a.run.app/api/trails

# 3. Search works
curl "https://opentrails-api-xxxxx.a.run.app/api/trails?search=bear"

# 4. Database populated
# Should get 144 trails back

# 5. Logs show no errors
gcloud logging read --limit=20
```

---

## Cost Summary

| Phase | Cost | Time |
|-------|------|------|
| Setup Cloud Project | $0 | 30 min |
| Deploy Database | $0 (3 months free) | 45 min |
| Deploy API | $0 (free tier) | 30 min |
| Deploy Frontend | $0 (free tier) | 20 min |
| Setup Monitoring | $0-5 | 15 min |
| **TOTAL** | **$0 now, $10-15/mo later** | **2.5 hours** |

---

## Quick Reference URLs

After deployment, you'll have:
```
Frontend:    https://opentrails.vercel.app
API:         https://opentrails-api-xxxxx.a.run.app/api
Database:    Cloud SQL (opentrails-db)
Console:     console.cloud.google.com
Vercel:      vercel.com/dashboard
Billing:     console.cloud.google.com/billing
Logs:        console.cloud.google.com/logs
```

---

## Get Help

If anything goes wrong:

1. **Check logs first**
   ```bash
   gcloud logging read --limit=50
   ```

2. **Verify services running**
   ```bash
   gcloud run services list
   gcloud sql instances list
   ```

3. **Check billing**
   ```bash
   gcloud billing budgets list
   ```

4. **Read documentation**
   - [Cloud Run Docs](https://cloud.google.com/run/docs)
   - [Cloud SQL Docs](https://cloud.google.com/sql/docs)
   - [Vercel Docs](https://vercel.com/docs)

---

**You're now ready to deploy OpenTrails to production!** 🚀

Start with Phase 1 (Google Cloud setup) and work through each phase sequentially. The whole process should take about 2-3 hours, and you'll have a fully functional, scalable app running on the cloud with less than $50/month in costs.
