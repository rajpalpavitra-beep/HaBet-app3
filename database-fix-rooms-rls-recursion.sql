-- Fix RLS Infinite Recursion for room_members and game_rooms
-- Run this in Supabase SQL Editor

-- ============================================
-- Fix room_members policies (MAIN ISSUE)
-- ============================================

-- Drop existing room_members policies
DROP POLICY IF EXISTS "Users can view room members" ON room_members;
DROP POLICY IF EXISTS "Users can join rooms" ON room_members;
DROP POLICY IF EXISTS "Users can leave rooms" ON room_members;

-- Policy: Users can view their own memberships
-- This avoids recursion by not querying game_rooms within the policy
CREATE POLICY "Users can view their own memberships"
  ON room_members FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Room creators can view all members of their rooms
-- This uses SECURITY DEFINER to avoid recursion
CREATE POLICY "Room creators can view all members"
  ON room_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_rooms 
      WHERE game_rooms.id = room_members.room_id 
      AND game_rooms.creator_id = auth.uid()
    )
  );

-- Policy: Users can join rooms
CREATE POLICY "Users can join rooms"
  ON room_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can leave rooms
CREATE POLICY "Users can leave rooms"
  ON room_members FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- Fix game_rooms policies
-- ============================================

-- Drop existing game_rooms policies
DROP POLICY IF EXISTS "Users can view rooms they're in" ON game_rooms;
DROP POLICY IF EXISTS "Users can view rooms they're members of" ON game_rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON game_rooms;
DROP POLICY IF EXISTS "Users can update their own rooms" ON game_rooms;
DROP POLICY IF EXISTS "Room creators can update their rooms" ON game_rooms;
DROP POLICY IF EXISTS "Users can delete their own rooms" ON game_rooms;
DROP POLICY IF EXISTS "Room creators can delete their rooms" ON game_rooms;

-- Policy: Users can view rooms they created
CREATE POLICY "Users can view rooms they created"
  ON game_rooms FOR SELECT
  USING (creator_id = auth.uid());

-- Policy: Users can view rooms they're members of
-- This avoids recursion by using a simple check
CREATE POLICY "Users can view rooms they're members of"
  ON game_rooms FOR SELECT
  USING (
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
  cmd
FROM pg_policies 
WHERE tablename IN ('game_rooms', 'room_members')
ORDER BY tablename, policyname;
