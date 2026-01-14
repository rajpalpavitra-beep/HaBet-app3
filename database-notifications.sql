-- Notifications System for HaBet
-- Run this in Supabase SQL Editor

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('check_in', 'verification_request', 'verification_complete', 'bet_complete')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  bet_id UUID REFERENCES bets(id) ON DELETE CASCADE,
  related_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow system to insert notifications (for triggers)
CREATE POLICY "Users can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Function to notify accountable friends when user checks in
CREATE OR REPLACE FUNCTION notify_check_in()
RETURNS TRIGGER AS $$
DECLARE
  bet_record RECORD;
  friend_record RECORD;
BEGIN
  -- Get the bet details
  SELECT * INTO bet_record FROM bets WHERE id = NEW.bet_id;
  
  -- Notify all accountable friends
  FOR friend_record IN 
    SELECT friend_id FROM bet_accountability WHERE bet_id = NEW.bet_id
  LOOP
    INSERT INTO notifications (user_id, type, title, message, bet_id, related_user_id)
    VALUES (
      friend_record.friend_id,
      'check_in',
      'Check-In Update',
      (SELECT nickname || COALESCE(' (' || email || ')', '') FROM profiles WHERE id = NEW.user_id) || 
      ' just checked in for "' || bet_record.title || '"',
      NEW.bet_id,
      NEW.user_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to notify on check-in
DROP TRIGGER IF EXISTS on_check_in_notify ON check_ins;
CREATE TRIGGER on_check_in_notify
  AFTER INSERT ON check_ins
  FOR EACH ROW
  WHEN (NEW.completed = true)
  EXECUTE FUNCTION notify_check_in();

-- Function to notify bet creator when verification is needed
CREATE OR REPLACE FUNCTION notify_verification_request()
RETURNS TRIGGER AS $$
DECLARE
  bet_record RECORD;
  friend_record RECORD;
BEGIN
  -- Get the bet details
  SELECT * INTO bet_record FROM bets WHERE id = NEW.bet_id;
  
  -- Notify the bet creator that verification is needed
  INSERT INTO notifications (user_id, type, title, message, bet_id, related_user_id)
  VALUES (
    bet_record.user_id,
    'verification_request',
    'Verification Needed',
    (SELECT nickname || COALESCE(' (' || email || ')', '') FROM profiles WHERE id = NEW.friend_id) || 
    ' needs to verify your bet "' || bet_record.title || '"',
    NEW.bet_id,
    NEW.friend_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to notify when accountability is created (bet needs verification)
DROP TRIGGER IF EXISTS on_accountability_created_notify ON bet_accountability;
CREATE TRIGGER on_accountability_created_notify
  AFTER INSERT ON bet_accountability
  FOR EACH ROW
  EXECUTE FUNCTION notify_verification_request();

-- Function to notify bet creator when friend verifies
CREATE OR REPLACE FUNCTION notify_verification_complete()
RETURNS TRIGGER AS $$
DECLARE
  bet_record RECORD;
BEGIN
  -- Only notify if verification status changed to true
  IF NEW.verified = true AND (OLD.verified IS NULL OR OLD.verified = false) THEN
    -- Get the bet details
    SELECT * INTO bet_record FROM bets WHERE id = NEW.bet_id;
    
    -- Notify the bet creator
    INSERT INTO notifications (user_id, type, title, message, bet_id, related_user_id)
    VALUES (
      bet_record.user_id,
      'verification_complete',
      'Bet Verified',
      (SELECT nickname || COALESCE(' (' || email || ')', '') FROM profiles WHERE id = NEW.friend_id) || 
      ' verified your bet "' || bet_record.title || '"',
      NEW.bet_id,
      NEW.friend_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to notify when verification is completed
DROP TRIGGER IF EXISTS on_verification_complete_notify ON bet_accountability;
CREATE TRIGGER on_verification_complete_notify
  AFTER UPDATE ON bet_accountability
  FOR EACH ROW
  WHEN (NEW.verified = true AND (OLD.verified IS NULL OR OLD.verified = false))
  EXECUTE FUNCTION notify_verification_complete();
