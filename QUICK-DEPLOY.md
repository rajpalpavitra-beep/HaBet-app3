# Quick Deploy to Vercel (5 Minutes)

## 🚀 Fastest Way to Deploy

### Option A: Deploy via Vercel Website (Recommended)

1. **Go to**: https://vercel.com/new
2. **Sign in** with GitHub
3. **Import** your repository: `rajpalpavitra-beep/HaBet-app3`
4. **Add Environment Variables** (click "Environment Variables" before deploying):
   ```
   VITE_SUPABASE_URL = https://xecqmkmwtxutarpjahmg.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlY3Fta213dHh1dGFycGphaG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjMyMjMsImV4cCI6MjA4MzI5OTIyM30.8S6mqZxsegZbtg2IqFETFbY-1RrPZz1VGDo8CZKhAp4
   ```
5. **Click "Deploy"**
6. **Wait 2-3 minutes** - Your app will be live!
7. **Copy your URL** (e.g., `habet-app3.vercel.app`)
8. **Update Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add: `VITE_APP_URL = https://habet-app3.vercel.app`
   - Redeploy (or it auto-redeploys)

### Option B: Deploy via Vercel CLI (Advanced)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts
```

## ✅ After Deployment

1. **Test your app**: Visit `https://your-app-name.vercel.app`
2. **Update local .env**: Add `VITE_APP_URL=https://your-app-name.vercel.app`
3. **Test invite links**: They should now work for everyone!

## 🎉 That's It!

Your app is now live and accessible worldwide. Every time you push to GitHub, Vercel will automatically redeploy.

## 📧 Email Server Note

The email server (`server/email.js`) only works locally. For production emails, you'll need to:
- Deploy the server separately (Render, Railway, etc.)
- Or use a service like SendGrid/Mailgun

But the app itself works perfectly without it!
