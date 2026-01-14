-- Fix RLS Infinite Recursion for game_rooms
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view rooms they're in" ON game_rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON game_rooms;
DROP POLICY IF EXISTS "Users can update their own rooms" ON game_rooms;
DROP POLICY IF EXISTS "Users can delete their own rooms" ON game_rooms;

-- Policy: Users can view rooms they're members of (without recursion)
-- This uses a direct check on room_members table instead of a subquery that might cause recursion
CREATE POLICY "Users can view rooms they're members of"
  ON game_rooms FOR SELECT
  USING (
    -- Room creators can always see their rooms
    creator_id = auth.uid()
    OR
    -- Users can see rooms they're members of (using a simple EXISTS check)
    EXISTS (
      SELECT 1 FROM room_members 
      WHERE room_members.room_id = game_rooms.id 
      AND room_members.user_id = auth.uid()
    )
  );

-- Policy: Users can create rooms
CREATE POLICY "Users can create rooms"
  ON game_rooms FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- Policy: Room creators can update their rooms
CREATE POLICY "Room creators can update their rooms"
  ON game_rooms FOR UPDATE
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Policy: Room creators can delete their rooms
CREATE POLICY "Room creators can delete their rooms"
  ON game_rooms FOR DELETE
  USING (creator_id = auth.uid());

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
WHERE tablename = 'game_rooms';
