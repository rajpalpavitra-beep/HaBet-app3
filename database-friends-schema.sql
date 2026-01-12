-- Friends System Schema for HaBet
-- Run this AFTER the main database-schema.sql

-- Create friends table for friend requests
CREATE TABLE IF NOT EXISTS friends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  addressee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Create game rooms table
CREATE TABLE IF NOT EXISTS game_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_code TEXT UNIQUE NOT NULL,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create room members table
CREATE TABLE IF NOT EXISTS room_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own friend requests" ON friends;
DROP POLICY IF EXISTS "Users can create friend requests" ON friends;
DROP POLICY IF EXISTS "Users can update their own friend requests" ON friends;
DROP POLICY IF EXISTS "Users can view rooms they're in" ON game_rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON game_rooms;
DROP POLICY IF EXISTS "Users can view room members" ON room_members;
DROP POLICY IF EXISTS "Users can join rooms" ON room_members;
DROP POLICY IF EXISTS "Users can leave rooms" ON room_members;

-- RLS Policies for friends
CREATE POLICY "Users can view their own friend requests"
  ON friends FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friend requests"
  ON friends FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own friend requests"
  ON friends FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- RLS Policies for game_rooms
CREATE POLICY "Users can view rooms they're in"
  ON game_rooms FOR SELECT
  USING (
    auth.uid() = creator_id OR
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_members.room_id = game_rooms.id
      AND room_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create rooms"
  ON game_rooms FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- RLS Policies for room_members
-- Fix: Avoid recursion by not querying room_members within the policy
-- Instead, allow users to see their own memberships and creators to see all members
CREATE POLICY "Users can view room members"
  ON room_members FOR SELECT
  USING (
    -- Users can see their own membership
    user_id = auth.uid()
    OR
    -- Users can see all members if they are the creator of the room
    EXISTS (
      SELECT 1 FROM game_rooms gr
      WHERE gr.id = room_members.room_id
      AND gr.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can join rooms"
  ON room_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
  ON room_members FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_friends_requester ON friends(requester_id);
CREATE INDEX IF NOT EXISTS idx_friends_addressee ON friends(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
CREATE INDEX IF NOT EXISTS idx_rooms_code ON game_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user ON room_members(user_id);

-- Function to generate unique room codes
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  
  -- Check if code already exists
  WHILE EXISTS (SELECT 1 FROM game_rooms WHERE room_code = result) LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
