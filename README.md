# HaBet - Habit Betting App

A fun and engaging web app where users can create bets on their habits and track their progress.

## Features

- ✅ User authentication (Sign up / Sign in)
- ✅ Create and manage bets
- ✅ Daily check-in system with streak tracking
- ✅ Winner/loser calculation
- ✅ Leaderboard with scoring system
- ✅ Beautiful pastel UI design

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your Project URL and anon/public key

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Set Up Database

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `database-schema.sql`
4. Run the SQL script to create all tables, RLS policies, and triggers

### 5. Run the App

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Database Schema

The app uses three main tables:

- **profiles**: User profiles (auto-created on signup)
- **bets**: User bets with status (pending/won/lost)
- **daily_checkins**: Daily check-in records for streak tracking

All tables have Row Level Security (RLS) enabled for data protection.

## Project Structure

```
src/
  ├── pages/
  │   ├── Login.jsx          # Login/Signup page
  │   ├── Dashboard.jsx      # Main dashboard with bets list
  │   ├── BetDetail.jsx     # Individual bet detail page
  │   └── Leaderboard.jsx   # User leaderboard
  ├── components/
  │   ├── CreateBet.jsx     # Create bet form
  │   └── DailyCheckIn.jsx  # Daily check-in component
  ├── App.jsx               # Main app with routing
  ├── AuthContext.jsx       # Authentication context
  ├── supabaseClient.js     # Supabase client setup
  ├── main.jsx              # App entry point
  └── global.css            # Global styles
```

## Scoring System

- Win a bet: +10 points
- Daily check-in: +5 points per day (streak)
- Lose a bet: -5 points

## Technologies Used

- React 18
- React Router DOM
- Supabase (Authentication & Database)
- Vite
- CSS3 (Custom pastel design)

## Notes

- The UI design is final and should not be modified
- All authentication is handled through Supabase Auth
- Session persists on page refresh automatically
- RLS policies ensure users can only modify their own data
