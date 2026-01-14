// Simple Express server for sending emails via Gmail SMTP
// Run with: node server/email.js

import express from 'express'
import nodemailer from 'nodemailer'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not regular password)
  },
})

// Email sending endpoint
app.post('/send-invite', async (req, res) => {
  try {
    const { to, fromName, inviteLink, appName } = req.body

    if (!to || !inviteLink) {
      return res.status(400).json({ error: 'Missing required fields: to, inviteLink' })
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({ error: 'Gmail credentials not configured' })
    }

    const mailOptions = {
      from: `"${appName || 'HaBet'}" <${process.env.GMAIL_USER}>`,
      to: to,
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
    }

    const info = await transporter.sendMail(mailOptions)
    
    console.log('Email sent:', info.messageId)
    res.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error('Error sending email:', error)
    res.status(500).json({ error: error.message || 'Failed to send email' })
  }
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'email-server' })
})

app.listen(PORT, () => {
  console.log(`📧 Email server running on http://localhost:${PORT}`)
  console.log(`Make sure GMAIL_USER and GMAIL_APP_PASSWORD are set in .env`)
})
