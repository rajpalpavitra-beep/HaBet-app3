// Supabase Edge Function to send invitation emails
// Deploy this function to enable email sending
// 
// To deploy:
// 1. Install Supabase CLI: npm install -g supabase
// 2. Login: supabase login
// 3. Link project: supabase link --project-ref your-project-ref
// 4. Deploy: supabase functions deploy send-invite-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

serve(async (req) => {
  try {
    const { to, fromName, inviteLink, appName } = await req.json()

    if (!to || !inviteLink) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // If Resend API key is configured, use it
    if (RESEND_API_KEY) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'HaBet <onboarding@resend.dev>', // Using Resend's default domain - update to your custom domain when verified
          to: [to],
          subject: `${fromName || 'Someone'} invited you to join ${appName || 'HaBet'}!`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>You've been invited to ${appName || 'HaBet'}!</title>
              </head>
              <body style="font-family: 'Fredoka', sans-serif; background-color: #f5f5f5; padding: 20px; margin: 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 24px; padding: 40px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
                  <h1 style="font-family: 'Schoolbell', cursive; color: #333; font-size: 2.5rem; margin-bottom: 20px; text-align: center;">
                    🎯 You've been invited!
                  </h1>
                  <p style="font-size: 1.1rem; color: #666; line-height: 1.6; margin-bottom: 20px;">
                    Hi there!
                  </p>
                  <p style="font-size: 1.1rem; color: #666; line-height: 1.6; margin-bottom: 20px;">
                    <strong>${fromName || 'Someone'}</strong> invited you to join <strong>${appName || 'HaBet'}</strong> - a fun way to bet on your habits and stay accountable!
                  </p>
                  <p style="font-size: 1.1rem; color: #666; line-height: 1.6; margin-bottom: 30px;">
                    Join us and start betting on your habits today! 🚀
                  </p>
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${inviteLink}" 
                       style="display: inline-block; background-color: #FFB6C1; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 1.1rem; box-shadow: 0 4px 10px rgba(255, 182, 193, 0.3);">
                      Join ${appName || 'HaBet'} Now
                    </a>
                  </div>
                  <p style="font-size: 0.9rem; color: #999; text-align: center; margin-top: 40px;">
                    Or copy and paste this link: <br>
                    <a href="${inviteLink}" style="color: #FFB6C1; word-break: break-all;">${inviteLink}</a>
                  </p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;">
                  <p style="font-size: 0.85rem; color: #999; text-align: center;">
                    If you didn't expect this email, you can safely ignore it.
                  </p>
                </div>
              </body>
            </html>
          `,
        }),
      })

      const emailData = await emailResponse.json()

      if (!emailResponse.ok) {
        throw new Error(emailData.message || 'Failed to send email')
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Email sent successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } else {
      // Fallback: Return success but log that email service is not configured
      console.log('Email service not configured. Email would be sent to:', to)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Email service not configured. Please set RESEND_API_KEY environment variable.' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
