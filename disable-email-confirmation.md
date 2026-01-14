# Disable Email Confirmation in Supabase

## Quick Fix: Disable Email Confirmation

Your friend is getting "email not confirmed" because Supabase requires email confirmation by default. Here's how to disable it:

### Step 1: Go to Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project: **xecqmkmwtxutarpjahmg**

### Step 2: Disable Email Confirmation

1. Click **Authentication** in the left sidebar
2. Click **Providers** (or go to **Settings** → **Auth**)
3. Find **Email** provider
4. Scroll down to **Email Auth Settings**
5. **Uncheck** "Enable email confirmations"
6. Click **Save**

### Step 3: Test

1. Have your friend try signing up again
2. They should be able to sign in immediately without email confirmation

## Alternative: Auto-Confirm Users (SQL)

If you prefer to auto-confirm all users via SQL:

1. Go to **SQL Editor** in Supabase
2. Run this SQL:

```sql
-- Auto-confirm all existing and future users
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- For future users, you can also update the trigger
-- But the dashboard setting is easier
```

## After Disabling

- New users can sign up and use the app immediately
- No email confirmation required
- Users are automatically logged in after signup

## Note

The code has been updated to handle this better, but you still need to disable email confirmation in Supabase dashboard for it to work completely.
