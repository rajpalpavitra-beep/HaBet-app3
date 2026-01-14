-- Fix RLS Policies for bet_accountability table
-- Run this in Supabase SQL Editor to ensure accountable friends feature works

-- Enable RLS if not already enabled
ALTER TABLE bet_accountability ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view bet accountability" ON bet_accountability;
DROP POLICY IF EXISTS "Users can create bet accountability" ON bet_accountability;
DROP POLICY IF EXISTS "Users can update bet accountability" ON bet_accountability;
DROP POLICY IF EXISTS "Users can view their own accountability" ON bet_accountability;
DROP POLICY IF EXISTS "Bet creators can add accountability" ON bet_accountability;
DROP POLICY IF EXISTS "Accountable friends can verify" ON bet_accountability;

-- Policy: Users can view accountability for bets they created or are accountable for
CREATE POLICY "Users can view bet accountability"
  ON bet_accountability FOR SELECT
  USING (
    -- Users can see accountability for bets they created
    EXISTS (
      SELECT 1 FROM bets 
      WHERE bets.id = bet_accountability.bet_id 
      AND bets.user_id = auth.uid()
    )
    OR
    -- Users can see accountability where they are the accountable friend
    friend_id = auth.uid()
  );

-- Policy: Bet creators can add accountable friends
CREATE POLICY "Bet creators can add accountability"
  ON bet_accountability FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bets 
      WHERE bets.id = bet_accountability.bet_id 
      AND bets.user_id = auth.uid()
    )
  );

-- Policy: Accountable friends can verify (update their own verification status)
CREATE POLICY "Accountable friends can verify"
  ON bet_accountability FOR UPDATE
  USING (
    -- Users can update their own verification status
    friend_id = auth.uid()
  )
  WITH CHECK (
    -- Users can only update their own verification status
    friend_id = auth.uid()
  );

-- Verify the policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'bet_accountability';
