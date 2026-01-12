# HaBet - Habit Betting App

A fun and engaging web app where users can create bets on their habits and track their progress.

## Features

- ✅ User authentication (Sign up / Sign in)
- ✅ Profile with nickname and emoji avatars
- ✅ Create and manage bets with goals, stakes, and accountable friends
- ✅ Daily/weekly/custom check-in system with progress meter
- ✅ Friend verification system for bet completion
- ✅ Friend requests and management
- ✅ Game rooms with unique codes (create and join)
- ✅ Email invites when adding friends
- ✅ Winner/loser calculation
- ✅ Leaderboard with scoring system
- ✅ Beautiful pastel UI design with Schoolbell font

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
3. Run these SQL scripts in order:
   - First: Copy and paste `database-schema.sql` and run it
   - Second: Copy and paste `database-friends-schema.sql` and run it
   - Third: Copy and paste `database-updates.sql` and run it
4. This creates all tables, RLS policies, triggers, and new features

### 5. Run the App

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Database Schema

The app uses these main tables:

- **profiles**: User profiles with nickname and emoji avatars (auto-created on signup)
- **bets**: User bets with goals, stakes, dates, and verification requirements
- **daily_checkins**: Daily check-in records for streak tracking
- **check_ins**: Bet-specific check-ins with completion status
- **friends**: Friend requests and relationships
- **bet_accountability**: Friends who hold you accountable for bets
- **game_rooms**: Digital game rooms with unique codes
- **room_members**: Room membership tracking

All tables have Row Level Security (RLS) enabled for data protection.

## Project Structure

```
src/
  ├── pages/
  │   ├── Login.jsx          # Login/Signup page
  │   ├── Dashboard.jsx      # Main dashboard with bets list
  │   ├── BetDetail.jsx      # Individual bet detail with check-ins & verification
  │   ├── Leaderboard.jsx    # User leaderboard
  │   ├── CreateBet.jsx      # Create bet with goal, stake, friends
  │   ├── Friends.jsx        # Friend requests and management
  │   ├── GameRooms.jsx      # Create and join game rooms
  │   └── ProfileSettings.jsx # Profile with nickname and emoji
  ├── components/
  │   ├── CreateBet.jsx      # (Legacy - now in pages)
  │   ├── DailyCheckIn.jsx   # Daily check-in component
  │   └── CheckInPopup.jsx   # Check-in popup for bets
  ├── App.jsx                # Main app with routing
  ├── AuthContext.jsx        # Authentication context
  ├── supabaseClient.js      # Supabase client setup
  ├── main.jsx               # App entry point
  └── global.css             # Global styles
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
