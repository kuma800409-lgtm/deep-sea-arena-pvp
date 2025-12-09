# Deployment Instructions

## Push to GitHub

### Step 1: Create a New GitHub Repository

1. Go to https://github.com/new
2. Repository name: `deep-sea-arena-pvp`
3. Make it **Public** (or Private if you prefer)
4. **Do NOT** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

### Step 2: Push Your Code

Run these commands in your terminal:

```bash
# Navigate to the project directory
cd deep-sea-arena-frontend

# Add your GitHub repo as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/deep-sea-arena-pvp.git

# Push to main branch
git branch -M main
git push -u origin main
```

If you're using SSH instead of HTTPS:
```bash
git remote add origin git@github.com:YOUR_USERNAME/deep-sea-arena-pvp.git
git branch -M main
git push -u origin main
```

## Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `deep-sea-arena-pvp` repository
4. Vercel will auto-detect Next.js settings
5. Click "Deploy"
6. Wait for deployment to complete
7. You'll receive a public `*.vercel.app` URL

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
cd deep-sea-arena-frontend
npx vercel --prod
```

## Deploy Backend to Cloudflare (Optional)

Only needed for 2-player PvP multiplayer. AI mode works without the backend.

### Step 1: Setup Cloudflare Account

1. Create account at https://dash.cloudflare.com/
2. Go to Workers & Pages
3. Copy your **Account ID** from the right sidebar

### Step 2: Configure Backend

```bash
cd deep-sea-arena-pvp

# Edit wrangler.toml and add your account_id
# Find the line: # account_id = "your-account-id"
# Replace with: account_id = "YOUR_ACTUAL_ACCOUNT_ID"
```

### Step 3: Deploy Backend

```bash
# Install dependencies
npm install

# Login to Cloudflare
npx wrangler login

# Deploy
npx wrangler deploy
```

### Step 4: Update Frontend

After deploying the backend, update the frontend to use the Cloudflare Worker URL:

1. Note the Worker URL from the deployment output (e.g., `https://deep-sea-arena-pvp.YOUR_SUBDOMAIN.workers.dev`)
2. Update the frontend API configuration to point to this URL
3. Redeploy the frontend

## Verification

After deployment, test the following:

1. Visit your Vercel URL
2. Click "Play vs AI" - should work immediately
3. Complete a full battle
4. Verify all tactical commands work
5. Check the result screen displays correctly

## Troubleshooting

### Build Fails on Vercel
- Check the build logs for specific errors
- Ensure all dependencies are in `package.json`
- Try running `npm run build` locally first

### Game Doesn't Load
- Check browser console for JavaScript errors
- Verify the deployment completed successfully
- Try clearing browser cache

### PvP Not Working
- Ensure the Cloudflare backend is deployed
- Verify the frontend is configured with the correct backend URL
- Check Cloudflare Worker logs for errors
