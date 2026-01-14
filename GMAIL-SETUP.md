# Gmail Email Setup Instructions

## Overview

The app now uses Gmail SMTP to send invitation emails. This requires a simple backend server.

## Setup Steps

### Step 1: Get Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Under "How you sign in to Google", click **2-Step Verification** (enable it if not already enabled)
4. Scroll down and click **App passwords**
5. Select **Mail** and **Other (Custom name)**
6. Enter "HaBet Email Server" as the name
7. Click **Generate**
8. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

### Step 2: Configure Environment Variables

Add these to your `.env` file:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
VITE_EMAIL_SERVER_URL=http://localhost:3001
```

**Important:** 
- Use your Gmail address (e.g., `yourname@gmail.com`)
- Use the App Password (not your regular Gmail password)
- Remove spaces from the App Password when adding to .env

### Step 3: Start the Email Server

You have two options:

**Option A: Run both servers together (recommended)**
```bash
npm run dev:full
```
This starts both the Vite dev server and the email server.

**Option B: Run separately**
```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Start email server
npm run email-server
```

### Step 4: Test

1. Make sure both servers are running
2. Go to the Friends page in your app
3. Enter an email address
4. Click "Send Invite"
5. Check the recipient's inbox!

## Troubleshooting

### "Email service not configured"
- Make sure the email server is running on port 3001
- Check that `VITE_EMAIL_SERVER_URL` is set in `.env`

### "Gmail credentials not configured"
- Make sure `GMAIL_USER` and `GMAIL_APP_PASSWORD` are in `.env`
- Restart the email server after adding credentials

### "Authentication failed"
- Make sure you're using an App Password, not your regular password
- Verify 2-Step Verification is enabled
- Check that the App Password doesn't have spaces

### Email not sending
- Check the email server console for error messages
- Verify the Gmail credentials are correct
- Make sure the recipient email is valid

## Production Deployment

For production, you'll need to:
1. Deploy the email server (e.g., on Heroku, Railway, or Render)
2. Update `VITE_EMAIL_SERVER_URL` to point to your deployed server
3. Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` as environment variables on your hosting platform

## Security Note

The email server runs on `localhost:3001` in development. In production, make sure to:
- Use HTTPS
- Add rate limiting
- Add authentication if needed
- Keep your App Password secure
