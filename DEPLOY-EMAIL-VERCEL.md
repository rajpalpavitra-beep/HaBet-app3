# Deploy Email Function to Vercel

## Quick Fix for "Failed to Fetch" Error

The email server now works on Vercel using serverless functions! Just add your Gmail credentials to Vercel.

## Step 1: Add Gmail Credentials to Vercel

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Click on your project: **HaBet-app3**
3. Go to **Settings** → **Environment Variables**
4. Add these two variables:

```
GMAIL_USER = pavitrarajpal@gmail.com
GMAIL_APP_PASSWORD = rjqwmrgwddmfjqur
```

5. Make sure to select **Production**, **Preview**, and **Development** environments
6. Click **Save**

## Step 2: Redeploy

Vercel will automatically redeploy, or you can:
- Go to **Deployments** tab
- Click the **⋯** menu on the latest deployment
- Click **Redeploy**

## Step 3: Test

1. Go to your Vercel app: https://ha-bet-app3.vercel.app
2. Navigate to Friends page
3. Enter an email and click "Send Invite"
4. It should work now! ✅

## How It Works

- **Development**: Uses local server on `localhost:3001` (if running) or falls back to API route
- **Production (Vercel)**: Uses serverless function at `/api/send-invite-email`
- The function uses your Gmail credentials from Vercel environment variables

## Troubleshooting

### Still getting "Failed to fetch"?
- Make sure `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set in Vercel
- Check that you redeployed after adding the variables
- Check Vercel function logs: **Deployments** → Click deployment → **Functions** tab

### Email not sending?
- Verify Gmail App Password is correct (no spaces)
- Check Vercel function logs for error messages
- Make sure 2-Step Verification is enabled on Gmail

## That's It!

Your email invites will now work on Vercel! 🎉
