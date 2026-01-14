-- Fix Missing Profiles for Existing Users
-- Run this in Supabase SQL Editor to create profiles for users who signed up
-- but don't have a profile yet

-- This will create profiles for all users in auth.users who don't have a profile
INSERT INTO public.profiles (id, email, display_name, nickname, emoji_avatar)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'nickname', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'emoji_avatar', '👤')
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verify the fix
SELECT 
  au.email as auth_email,
  p.email as profile_email,
  p.display_name,
  CASE WHEN p.id IS NULL THEN 'MISSING PROFILE' ELSE 'OK' END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;
