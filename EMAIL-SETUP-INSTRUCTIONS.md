# Email Invite Setup Instructions

## Overview

The "Invite Friends" feature allows users to send invitation emails to friends who aren't on HaBet yet. The email includes a link to sign up for the app.

## Setup Options

### Option 1: Supabase Edge Function with Resend (Recommended)

This is the recommended approach for production.

#### Step 1: Get a Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Go to API Keys section
3. Create a new API key
4. Copy the key (starts with `re_`)

#### Step 2: Deploy the Edge Function

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Find your project ref in Supabase dashboard → Settings → General)

4. Set the Resend API key as a secret:
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_api_key_here
   ```

5. Deploy the function:
   ```bash
   supabase functions deploy send-invite-email
   ```

#### Step 3: Update Email From Address

1. In Resend dashboard, verify your domain or use the default domain
2. Update the `from` address in `supabase/functions/send-invite-email/index.ts`:
   ```typescript
   from: 'HaBet <noreply@yourdomain.com>',
   ```

### Option 2: Use Supabase's Built-in Email (Limited)

Supabase has built-in email sending but it's limited. You can use it for development:

1. Go to Supabase Dashboard → Settings → Auth
2. Configure SMTP settings
3. Update the Edge Function to use Supabase's email service

### Option 3: Other Email Services

You can modify the Edge Function to use:
- **SendGrid**: Replace Resend API calls with SendGrid
- **Mailgun**: Replace Resend API calls with Mailgun
- **AWS SES**: Replace Resend API calls with AWS SES

## Testing

1. Go to the Friends page in your app
2. Click on "Invite Friends" section
3. Enter an email address
4. Click "Send Invite"
5. Check the recipient's inbox for the invitation email

## Current Implementation

- ✅ UI for entering email addresses
- ✅ Email validation
- ✅ Supabase Edge Function structure
- ✅ Beautiful HTML email template
- ✅ Fallback message if email service not configured

## Troubleshooting

### Email not sending?

1. Check that the Edge Function is deployed:
   ```bash
   supabase functions list
   ```

2. Check function logs:
   ```bash
   supabase functions logs send-invite-email
   ```

3. Verify the API key is set:
   ```bash
   supabase secrets list
   ```

### Getting 404 errors?

Make sure the Edge Function is deployed and the function name matches exactly: `send-invite-email`

### Emails going to spam?

- Verify your domain in Resend
- Use a custom domain for the `from` address
- Add SPF and DKIM records to your domain

## Email Template

The email template includes:
- Beautiful HTML design matching the app's pastel theme
- Clear call-to-action button
- App link for easy signup
- Responsive design for mobile devices

You can customize the template in `supabase/functions/send-invite-email/index.ts`.
