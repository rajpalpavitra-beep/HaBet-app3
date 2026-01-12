-- Database Updates for New Features
-- Run this AFTER the main database-schema.sql and database-friends-schema.sql

-- Add nickname and emoji to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS emoji_avatar TEXT DEFAULT '👤';

-- Update bets table to include goal, stake, and accountable friends
ALTER TABLE bets
ADD COLUMN IF NOT EXISTS goal TEXT,
ADD COLUMN IF NOT EXISTS stake TEXT,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS verification_required BOOLEAN DEFAULT false;

-- Create bet_accountability table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS bet_accountability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bet_id UUID REFERENCES bets(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bet_id, friend_id)
);

-- Create check_ins table for daily/weekly/custom check-ins
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bet_id UUID REFERENCES bets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  checkin_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bet_id, user_id, checkin_date)
);

-- Enable RLS for new tables
ALTER TABLE bet_accountability ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view bet accountability" ON bet_accountability;
DROP POLICY IF EXISTS "Users can create bet accountability" ON bet_accountability;
DROP POLICY IF EXISTS "Users can update bet accountability" ON bet_accountability;
DROP POLICY IF EXISTS "Users can view check-ins" ON check_ins;
DROP POLICY IF EXISTS "Users can create check-ins" ON check_ins;
DROP POLICY IF EXISTS "Users can update check-ins" ON check_ins;

-- RLS Policies for bet_accountability
CREATE POLICY "Users can view bet accountability"
  ON bet_accountability FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bets
      WHERE bets.id = bet_accountability.bet_id
      AND (bets.user_id = auth.uid() OR bet_accountability.friend_id = auth.uid())
    )
  );

CREATE POLICY "Users can create bet accountability"
  ON bet_accountability FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bets
      WHERE bets.id = bet_accountability.bet_id
      AND bets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update bet accountability"
  ON bet_accountability FOR UPDATE
  USING (friend_id = auth.uid());

-- RLS Policies for check_ins
CREATE POLICY "Users can view check-ins"
  ON check_ins FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM bets
      WHERE bets.id = check_ins.bet_id
      AND bets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create check-ins"
  ON check_ins FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update check-ins"
  ON check_ins FOR UPDATE
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bet_accountability_bet ON bet_accountability(bet_id);
CREATE INDEX IF NOT EXISTS idx_bet_accountability_friend ON bet_accountability(friend_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_bet ON check_ins(bet_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_user ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON check_ins(checkin_date);
