-- Upgrade Rooms to Group Bet System
-- Run this in Supabase SQL Editor

-- Add room_id to bets table (bets can now belong to a room)
ALTER TABLE bets
ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES game_rooms(id) ON DELETE SET NULL;

-- Remove room_code requirement (we'll use invites instead)
ALTER TABLE game_rooms
ALTER COLUMN room_code DROP NOT NULL;

-- Create room_invites table for email-based invites
CREATE TABLE IF NOT EXISTS room_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invitee_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(room_id, invitee_email)
);

-- Enable RLS for room_invites
ALTER TABLE room_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for room_invites
DROP POLICY IF EXISTS "Users can view invites for their rooms" ON room_invites;
DROP POLICY IF EXISTS "Users can create invites for their rooms" ON room_invites;
DROP POLICY IF EXISTS "Users can update invites they received" ON room_invites;

CREATE POLICY "Users can view invites for their rooms"
  ON room_invites FOR SELECT
  USING (
    -- Room creators can see all invites for their rooms
    EXISTS (
      SELECT 1 FROM game_rooms 
      WHERE game_rooms.id = room_invites.room_id 
      AND game_rooms.creator_id = auth.uid()
    )
    OR
    -- Users can see invites sent to their email
    invitee_email = (auth.jwt() ->> 'email')
  );

CREATE POLICY "Users can create invites for their rooms"
  ON room_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_rooms 
      WHERE game_rooms.id = room_invites.room_id 
      AND game_rooms.creator_id = auth.uid()
    )
    OR
    -- Room members can also invite (if you want to allow that)
    EXISTS (
      SELECT 1 FROM room_members 
      WHERE room_members.room_id = room_invites.room_id 
      AND room_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invites they received"
  ON room_invites FOR UPDATE
  USING (
    invitee_email = (auth.jwt() ->> 'email')
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bets_room_id ON bets(room_id);
CREATE INDEX IF NOT EXISTS idx_room_invites_room_id ON room_invites(room_id);
CREATE INDEX IF NOT EXISTS idx_room_invites_email ON room_invites(invitee_email);
CREATE INDEX IF NOT EXISTS idx_room_invites_status ON room_invites(status);
