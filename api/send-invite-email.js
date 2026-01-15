// Vercel Serverless Function for sending invite emails
// This runs on Vercel and uses Gmail SMTP

import nodemailer from 'nodemailer'

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { to, fromName, inviteLink, appName, roomName } = req.body

    if (!to || !inviteLink) {
      return res.status(400).json({ error: 'Missing required fields: to, inviteLink' })
    }

    // Get Gmail credentials from environment variables
    const gmailUser = process.env.GMAIL_USER
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD

    if (!gmailUser || !gmailAppPassword) {
      console.error('Gmail credentials not set in environment variables')
      return res.status(500).json({ 
        error: 'Email service not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in Vercel environment variables.' 
      })
    }

    // Create a Nodemailer transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    })

    const emailHtml = `
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
              You've been invited!
            </h1>
            <p style="font-size: 1.1rem; color: #666; line-height: 1.6; margin-bottom: 20px;">
              Hi there!
            </p>
            <p style="font-size: 1.1rem; color: #666; line-height: 1.6; margin-bottom: 20px;">
              <strong>${fromName || 'Someone'}</strong> invited you to join <strong>${appName || 'HaBet'}</strong>${roomName ? ` in the room "${roomName}"` : ''} - a fun way to bet on your habits and stay accountable!
            </p>
            <p style="font-size: 1.1rem; color: #666; line-height: 1.6; margin-bottom: 30px;">
              ${roomName ? `Join the "${roomName}" room and ` : ''}Start betting on your habits today!
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
    `

    const mailOptions = {
      from: `"${appName || 'HaBet'}" <${gmailUser}>`,
      to: to,
      subject: `${fromName || 'Someone'} invited you to join ${appName || 'HaBet'}${roomName ? ` - ${roomName}` : ''}!`,
      html: emailHtml,
    }

    const info = await transporter.sendMail(mailOptions)
    
    console.log('Email sent successfully:', info.messageId)
    return res.status(200).json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error('Error sending email:', error)
    return res.status(500).json({ error: error.message || 'Failed to send email' })
  }
}
