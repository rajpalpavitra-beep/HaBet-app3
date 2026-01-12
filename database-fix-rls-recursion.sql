-- Fix infinite recursion in room_members RLS policy
-- Run this in Supabase SQL Editor to fix the error

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view room members" ON room_members;

-- Create a new policy that avoids recursion
-- Users can see their own membership and creators can see all members
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
