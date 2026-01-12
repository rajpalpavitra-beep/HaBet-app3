# Quick Deploy Guide

I'll help you deploy the email function. Please provide:

1. **Supabase Access Token**: Get it from https://supabase.com/dashboard/account/tokens
2. **Resend API Key**: You mentioned you have this (starts with `re_`)

Once you provide these, I'll run the deployment commands for you.

## Alternative: Run the setup script

You can also run the automated setup script:

```bash
./setup-email-function.sh
```

This will prompt you for both tokens and deploy everything automatically.

## Manual Steps (if you prefer)

If you want to do it manually:

1. **Get Supabase Access Token**:
   - Go to https://supabase.com/dashboard/account/tokens
   - Click "Generate new token"
   - Copy the token

2. **Link your project**:
   ```bash
   export SUPABASE_ACCESS_TOKEN=your_token_here
   npx supabase link --project-ref xecqmkmwtxutarpjahmg
   ```

3. **Set Resend API key**:
   ```bash
   npx supabase secrets set RESEND_API_KEY=re_your_api_key_here
   ```

4. **Deploy the function**:
   ```bash
   npx supabase functions deploy send-invite-email
   ```
