# Testing the Email Function

The function is deployed and the Resend API key is set. If you're still getting a 401 error, it means Supabase is blocking the request before it reaches our function code.

## Quick Test

1. **Open browser console** (F12)
2. **Try sending an invite**
3. **Check the console** - you should see detailed error messages now
4. **Share the exact error message** you see

## Possible Issues

1. **401 Unauthorized** - Supabase infrastructure blocking the request
2. **Resend API Error** - The API key might be invalid or expired
3. **Network Error** - Connection issue

## Next Steps

Once you share the exact error message from the console, I can fix it immediately.
