# GitHub & Vercel Setup Guide

This guide walks through the final steps to publish OpenTrails as an open-source project with automatic deployments.

## What's Been Done ✅

- ✅ Codebase cleaned up (removed 40+ internal documentation files)
- ✅ Professional README written with features, architecture, contributing guide
- ✅ CONTRIBUTING.md with development workflow
- ✅ CODE_OF_CONDUCT.md for community standards
- ✅ LICENSE (MIT) with OpenStreetMap attribution
- ✅ .gitignore for Node, Python, IDE files
- ✅ GitHub Actions workflow for CI/CD
- ✅ Codebase ready for public release

## Next Steps (You'll Do These)

### 1. Create GitHub Repository

Go to **https://github.com/new** and create:

```
Repository name: opentrails
Description: An open-source trail discovery and GPS tracking app
Visibility: Public
Initialize with: None (we'll push existing code)
```

### 2. Push Code to GitHub

```bash
cd E:\openTrails

# Initialize git and add remote
git init
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/opentrails.git

# Add all files
git add .

# Create initial commit
git commit -m "feat: initial commit - trail discovery with 2,676 trails

- Trail-focused UI with Hipcamp-style cards
- Full-page trail detail pages
- Search and difficulty filtering
- Cloud Run API deployment with SQLite
- Playwright test suite (9/9 passing)
- React Native frontend on Expo
- Firebase authentication
- Activity tracking components

See README.md for full feature list"

# Push to GitHub
git push -u origin main
```

### 3. Set Up Branch Protection

**On GitHub:**

1. Go to **Settings** → **Branches** → **Add rule**
2. Configure for `main` branch:
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals: 1
     - ✅ Dismiss stale PR approvals
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date
     - ✅ Select workflow: `CI` (GitHub Actions)
   - ✅ **Restrict who can push to matching branches**
     - Allow: Only administrators (initially)
   - ✅ **Include administrators** in restrictions

3. Create a `develop` branch for development:
   ```bash
   git checkout -b develop
   git push -u origin develop
   ```

### 4. Set Up Vercel Auto-Deploy

**Step 1: Connect GitHub to Vercel**
1. Go to **https://vercel.com/dashboard**
2. Click **Add New** → **Project**
3. Click **Import Git Repository**
4. Authenticate with GitHub and select `opentrails`
5. Click **Import**

**Step 2: Configure Project**
- **Framework Preset**: Expo
- **Root Directory**: `app`
- **Build Command**: `npm run build` (or leave default)
- **Output Directory**: `.next` or `.expo` (Vercel will auto-detect)

**Step 3: Environment Variables**
Add in Vercel dashboard:
```
REACT_APP_API_URL=https://opentrails-api-542596148138.us-central1.run.app/api
```

**Step 4: Deploy Settings**
- Auto-deploy on push to `main` ✅
- Preview deployments for PRs ✅
- Run GitHub Actions before deploy ✅

**Step 5: Deploy**
- Click **Deploy**
- Watch build logs
- Get production URL (e.g., `https://opentrails-xxxxxxxx.vercel.app`)

### 5. Verify Deployment

Once deployed, test:
```bash
# API is still running
curl https://opentrails-api-542596148138.us-central1.run.app/api/health
# {"status":"healthy"}

# Frontend works
open https://opentrails-xxxxxxxx.vercel.app
# Should show login screen, then trail discovery
```

## What Happens Now

### On Every Push to `main`
1. ✅ GitHub Actions runs CI/CD:
   - Installs dependencies
   - Type-checks TypeScript
   - Runs Playwright tests
   - Builds project
2. ✅ Vercel auto-deploys:
   - Builds frontend
   - Deploys to `https://opentrails.vercel.app`

### On Pull Requests
1. ✅ GitHub Actions runs tests
2. ✅ Vercel creates preview deployment
3. ✅ Code review required before merge
4. ✅ Once approved, automatically deploys to production

## Protecting Your Main Branch

### Branch Protection Rules Explained

**Why require PRs?**
- Every change goes through code review
- Prevents accidental pushes
- Ensures tests pass
- Maintains code quality

**Why require status checks?**
- Ensures CI/CD passes before merge
- Tests must pass (Playwright)
- Code must type-check

**Why dismiss stale PRs?**
- If new commits are pushed after review, reviewer must re-approve
- Prevents sneaky changes after approval

## Making Changes (After Setup)

### For Contributors
```bash
# Create feature branch from main
git checkout -b feature/your-feature main

# Make changes and test locally
npm start

# Push and create PR on GitHub
git push origin feature/your-feature
```

### GitHub will:
1. Run CI (tests, build, type-check)
2. Create preview deployment on Vercel
3. Request review from maintainers
4. Allow merge once approved and tests pass

### After merge:
1. Automatically deploys to production
2. Available at `https://opentrails.vercel.app`

## Important Files

After setup, you'll have:

```
.github/
  workflows/
    ci.yml              # GitHub Actions workflow (already created)
    
.gitignore              # Files to never commit (already created)
LICENSE                 # MIT License (already created)
README.md               # Main documentation (already created)
CONTRIBUTING.md         # Contribution guide (already created)
CODE_OF_CONDUCT.md      # Community standards (already created)
```

## Troubleshooting

### Push fails with "remote not found"
```bash
git remote add origin https://github.com/YOUR-USERNAME/opentrails.git
```

### Vercel build fails
- Check **Build Logs** in Vercel dashboard
- Verify `REACT_APP_API_URL` is set
- Ensure `app/` has `package.json`

### Tests fail after PR
- Check **GitHub Actions** tab for error logs
- Run tests locally: `cd app && npm exec playwright test`
- Fix issues and push again

### Branch protection blocking merge
- Ensure tests pass (green checkmark)
- Get 1+ review approval
- Dismiss stale reviews if new commits added

## Success Checklist

Once you complete the above:

- [ ] GitHub repository created and public
- [ ] All code pushed to `main`
- [ ] Branch protection rules enabled
- [ ] Vercel project connected
- [ ] Auto-deploy working
- [ ] Production URL accessible
- [ ] CI/CD workflow running

## Support

If you get stuck:
1. Check Vercel deployment logs
2. Check GitHub Actions logs
3. Review error messages carefully
4. Create a GitHub issue for help

---

**Ready?** Start with "1. Create GitHub Repository" above! 🚀
