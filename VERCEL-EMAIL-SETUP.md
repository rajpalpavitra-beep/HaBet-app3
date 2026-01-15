# Setting Up Email on Vercel

To enable room invites and friend invites on your Vercel deployment, you need to add your Gmail credentials as environment variables.

## Steps:

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click on your project: `ha-bet-app3`

2. **Navigate to Settings**
   - Click on the **Settings** tab
   - Click on **Environment Variables** in the left sidebar

3. **Add Gmail Credentials**
   - Click **Add New**
   - **Name:** `GMAIL_USER`
   - **Value:** `pavitrarajpal@gmail.com` (your Gmail address)
   - **Environment:** Select all (Production, Preview, Development)
   - Click **Save**

   - Click **Add New** again
   - **Name:** `GMAIL_APP_PASSWORD`
   - **Value:** `rjqw mrgw ddmf jqur` (your Gmail App Password)
   - **Environment:** Select all (Production, Preview, Development)
   - Click **Save**

4. **Redeploy**
   - Go to the **Deployments** tab
   - Click the **⋯** (three dots) on the latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger a redeploy

5. **Test**
   - After redeploy, try sending a room invite again
   - It should work now!

## Note:
- The Gmail App Password is different from your regular Gmail password
- If you need to generate a new App Password, go to: https://myaccount.google.com/apppasswords
- Make sure 2-Step Verification is enabled on your Google account
