# Email Invite Setup

The app includes email invite functionality when sending friend requests. To enable actual email sending, you have a few options:

## Option 1: Supabase Edge Functions (Recommended)

1. Create a Supabase Edge Function for sending emails
2. Use a service like Resend, SendGrid, or Mailgun
3. Call the function from the Friends page

## Option 2: Supabase Email Templates

1. Go to Supabase Dashboard → Authentication → Email Templates
2. Create a custom email template for friend invites
3. Use Supabase's built-in email sending

## Option 3: Third-party Service

Integrate directly with:
- **Resend** (recommended for simplicity)
- **SendGrid**
- **Mailgun**
- **AWS SES**

## Current Implementation

Currently, the app logs the email invite message to the console. The email functionality is ready to be connected to your preferred email service.

To implement:
1. Add your email service API key to `.env`
2. Update `src/pages/Friends.jsx` to call your email service
3. Or create a Supabase Edge Function

Example with Resend:
```javascript
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'HaBet <noreply@yourdomain.com>',
  to: email,
  subject: 'You\'ve been invited to HaBet!',
  html: `<p>${user.email} invited you to join HaBet!</p><p><a href="${inviteLink}">Sign up here</a></p>`
})
```
