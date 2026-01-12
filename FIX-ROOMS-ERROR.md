# Fix Rooms Page Error

## Problem
The rooms page shows an error: "infinite recursion detected in policy for relation 'room_members'"

## Solution

### Step 1: Fix the RLS Policy in Supabase

1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Copy and paste this SQL:

```sql
-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view room members" ON room_members;

-- Create a new policy that avoids recursion
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
```

4. Click **Run** to execute the SQL

### Step 2: Refresh Your Browser

- Hard refresh: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows/Linux)
- Or close and reopen the browser tab

### Step 3: Test the Rooms Page

1. Navigate to the **Rooms** page
2. Create a new room - you should see:
   - A modal popup with the room code
   - A "Rooms I Created" section with prominent code display
   - A "Rooms I Joined" section for rooms you've joined

## What Changed

- ✅ Fixed infinite recursion in RLS policy
- ✅ Added "Rooms I Created" section with prominent code display
- ✅ Added copy code button for easy sharing
- ✅ Separated created rooms from joined rooms
