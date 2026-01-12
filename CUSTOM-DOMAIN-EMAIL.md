# Using a Custom Domain for Email (Optional)

## Current Setup

Your emails are currently sent from: **HaBet <onboarding@resend.dev>**

This uses Resend's default domain and works immediately without any setup.

## Using Your Own Domain (Optional)

If you want to use your own domain (e.g., `noreply@yourdomain.com`), follow these steps:

### Step 1: Verify Your Domain in Resend

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records Resend provides to your domain registrar:
   - SPF record
   - DKIM records
   - DMARC record (optional but recommended)

### Step 2: Wait for Verification

- Resend will verify your domain (usually takes a few minutes)
- You'll see a "Verified" status when ready

### Step 3: Update the From Address

1. Open `supabase/functions/send-invite-email/index.ts`
2. Find this line:
   ```typescript
   from: 'HaBet <onboarding@resend.dev>',
   ```
3. Change it to:
   ```typescript
   from: 'HaBet <noreply@yourdomain.com>',
   ```
4. Redeploy the function:
   ```bash
   export SUPABASE_ACCESS_TOKEN=your_token
   npx supabase functions deploy send-invite-email
   ```

## Benefits of Custom Domain

- ✅ More professional appearance
- ✅ Better email deliverability
- ✅ Branded email address
- ✅ Less likely to go to spam

## Current Status

✅ **Emails are working now** with the default domain. You can use custom domains later if needed.
