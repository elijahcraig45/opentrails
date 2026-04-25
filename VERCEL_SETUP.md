# ✅ Vercel Auto-Deploy Setup

## Branch Protection is Done! ✅

GitHub is now configured with:
- ✅ Require 1 PR review on `main`
- ✅ Dismiss stale reviews on new commits
- ✅ Status checks must pass before merge
- ✅ Rules apply to admins

No one can accidentally push directly to main. Good quality control!

---

## Now: Connect Vercel for Auto-Deploy

### Step 1: Go to Vercel

Open: **https://vercel.com/new**

### Step 2: Import Repository

1. Click **"Import Git Repository"**
2. Paste: `https://github.com/elijahcraig45/opentrails`
   - Or search for it if connected
3. Click **"Import"**

### Step 3: Configure Project

**Framework Preset**: Select `Expo` (or `Next.js` as fallback)

**Root Directory**: `app`

**Build Command**: Leave default or use:
```
npm run build
```

**Install Command**: Leave default

### Step 4: Environment Variables

Add exactly these variables:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://opentrails-api-542596148138.us-central1.run.app/api` |

### Step 5: Deploy

Click **"Deploy"**

Wait 2-5 minutes for the build to complete.

---

## After Deployment

You'll get:
- ✅ Production URL: `https://opentrails-xxxxx.vercel.app`
- ✅ Auto-deploy on every push to `main`
- ✅ Preview deployments for each PR
- ✅ Automatic rollback if tests fail

---

## Automatic Workflow After Setup

```
You push code to main
       ↓
GitHub Actions runs tests (from CI workflow)
       ↓
Tests pass → Vercel builds & deploys automatically
       ↓
Live at https://opentrails-xxxxx.vercel.app
```

For Pull Requests:
```
You create PR
       ↓
Tests run on GitHub
       ↓
Vercel creates preview URL
       ↓
You review + request changes
       ↓
Approve → Auto-merge (if allowed) → Auto-deploy
```

---

## Key Settings in Vercel

After deployment, you can:
1. **Settings** → Domains → Add custom domain
2. **Settings** → Environment → Add more env vars
3. **Deployments** → Manage versions/rollback
4. **Analytics** → Track performance

---

## Testing Your Deployment

Once live, test:
```bash
# Frontend is running
curl https://opentrails-xxxxx.vercel.app

# API is reachable
curl https://opentrails-api-542596148138.us-central1.run.app/api/health

# Trails load
curl "https://opentrails-api-542596148138.us-central1.run.app/api/trails?limit=5"
```

---

## Troubleshooting

### Build fails with "not found"
- Check `Root Directory` is `app`
- Check environment variables are set
- Check `app/package.json` exists

### "Module not found" errors
- Run locally first: `cd app && npm install && npm start`
- Make sure all dependencies are in `package.json`

### API not reachable
- Check `REACT_APP_API_URL` environment variable
- Verify Cloud Run API is still running

---

## You're Done! 🎉

Your project now has:
- ✅ Code on GitHub
- ✅ Branch protection for quality
- ✅ Auto-deploy to Vercel
- ✅ Automatic tests on every PR
- ✅ Preview deployments for review

This is a professional, production-ready setup! 🚀
