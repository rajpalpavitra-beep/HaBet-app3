# Fix Invite Link for Friends

## Problem
Friends can't open the invite link because it's using `localhost:5173` which only works on your computer.

## Solution

### Option 1: Set Production URL (Recommended)

1. **If you've deployed your app**, add your deployed URL to `.env`:
   ```env
   VITE_APP_URL=https://your-deployed-url.com
   ```

2. **If you haven't deployed yet**, you can:
   - Deploy to Vercel, Netlify, or similar
   - Get your deployment URL
   - Add it to `.env` as `VITE_APP_URL`

### Option 2: Use ngrok for Testing (Temporary)

For testing before deployment:

1. Install ngrok: `brew install ngrok` (or download from ngrok.com)
2. Run: `ngrok http 5173`
3. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
4. Add to `.env`: `VITE_APP_URL=https://abc123.ngrok.io`
5. Restart your dev server

### Current Behavior

- If `VITE_APP_URL` is set, it uses that URL
- If not set and running on localhost, it shows a placeholder
- If deployed, it uses the current origin

## Next Steps

1. Deploy your app to a hosting service (Vercel, Netlify, etc.)
2. Get your production URL
3. Add `VITE_APP_URL=https://your-production-url.com` to `.env`
4. Restart the app
5. Invite links will now work for everyone!
