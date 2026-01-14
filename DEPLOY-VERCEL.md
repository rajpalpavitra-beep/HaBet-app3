# Deploy HaBet to Vercel (Free)

## Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

## Step 2: Deploy Your App

1. After signing in, click "Add New..." → "Project"
2. Find your repository: `rajpalpavitra-beep/HaBet-app3`
3. Click "Import"

## Step 3: Configure Project

Vercel will auto-detect Vite settings, but verify:

- **Framework Preset**: Vite
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

## Step 4: Add Environment Variables

Before deploying, click "Environment Variables" and add:

```
VITE_SUPABASE_URL=https://xecqmkmwtxutarpjahmg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlY3Fta213dHh1dGFycGphaG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjMyMjMsImV4cCI6MjA4MzI5OTIyM30.8S6mqZxsegZbtg2IqFETFbY-1RrPZz1VGDo8CZKhAp4
VITE_APP_URL=https://your-app-name.vercel.app
```

**Important**: After deployment, Vercel will give you a URL like `habet-app3.vercel.app`. 
- Copy that URL
- Update `VITE_APP_URL` in environment variables with your actual Vercel URL
- Redeploy (or it will auto-redeploy)

## Step 5: Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. Your app will be live at `https://your-app-name.vercel.app`

## Step 6: Update Local .env

After getting your Vercel URL, update your local `.env`:

```env
VITE_APP_URL=https://your-app-name.vercel.app
```

## Step 7: Update Email Server (Optional)

If you want the email server to work in production, you'll need to:
- Deploy the email server separately (Render, Railway, or similar)
- Or use a service like SendGrid, Mailgun, etc.

For now, the email server only works locally.

## Benefits of Vercel

✅ **Free Forever** - Generous free tier
✅ **Automatic HTTPS** - SSL certificate included
✅ **Fast CDN** - Global edge network
✅ **Auto Deploy** - Deploys on every git push
✅ **Preview Deployments** - Test before merging
✅ **Easy Environment Variables** - Manage secrets easily

## Troubleshooting

- **Build fails?** Check the build logs in Vercel dashboard
- **App not loading?** Make sure environment variables are set
- **404 errors?** The `vercel.json` rewrite rules should fix this
