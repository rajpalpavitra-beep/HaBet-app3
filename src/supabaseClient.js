import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Create client - use actual values if provided, otherwise placeholder
const url = supabaseUrl || 'https://xecqmkmwtxutarpjahmg.supabase.co'
const key = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlY3Fta213dHh1dGFycGphaG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjMyMjMsImV4cCI6MjA4MzI5OTIyM30.8S6mqZxsegZbtg2IqFETFbY-1RrPZz1VGDo8CZKhAp4'

export const supabase = createClient(url, key)

// Store the key and URL for use in function calls
supabase.supabaseKey = key
supabase.supabaseUrl = url

// Export a helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '')
}

