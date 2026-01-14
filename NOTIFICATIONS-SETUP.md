# Notifications System Setup

## Overview

The notifications system automatically sends notifications for:
1. **Check-ins**: When you check in, your accountable friends get notified
2. **Verification Requests**: When you add friends as accountable, they get notified
3. **Verification Complete**: When a friend verifies your bet, you get notified

## Setup Steps

### Step 1: Run the Database Schema

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **xecqmkmwtxutarpjahmg**
3. Go to **SQL Editor**
4. Copy and paste the contents of `database-notifications.sql`
5. Click **Run**

This will create:
- `notifications` table
- Database triggers for automatic notifications
- Real-time subscriptions support

### Step 2: Test the System

1. **Create a bet with accountable friends**:
   - Go to Create Bet
   - Add friends as accountable
   - Create the bet
   - Your friends will get a notification

2. **Check in on a bet**:
   - Go to a bet detail page
   - Click "Check In"
   - Your accountable friends will get notified

3. **Verify a bet**:
   - If you're an accountable friend, verify the bet
   - The bet creator will get notified

## Features

- **Real-time updates**: Notifications appear instantly
- **Notification badge**: Shows unread count on dashboard
- **Click to navigate**: Click a notification to go to the related bet
- **Mark as read**: Individual or mark all as read
- **Automatic cleanup**: Old notifications are kept for reference

## Notification Types

- 📝 **Check-In**: Friend checked in on a bet
- ⏳ **Verification Request**: You've been added as accountable friend
- ✓ **Verification Complete**: Friend verified your bet
- 🎉 **Bet Complete**: Bet was marked as won/lost

## Access Notifications

- Click the 🔔 bell icon in the dashboard header
- Or navigate to `/notifications` page
- Badge shows unread count
