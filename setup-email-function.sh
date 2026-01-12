#!/bin/bash

# Setup script for deploying Supabase Edge Function for email invites
# This script will help you deploy the send-invite-email function

echo "🚀 Setting up Supabase Edge Function for Email Invites"
echo ""

# Check if project ref is available
PROJECT_REF="xecqmkmwtxutarpjahmg"
echo "📋 Detected project ref: $PROJECT_REF"
echo ""

# Prompt for Supabase access token
echo "Please provide your Supabase access token:"
echo "You can get it from: https://supabase.com/dashboard/account/tokens"
read -s SUPABASE_TOKEN
echo ""

# Prompt for Resend API key
echo "Please provide your Resend API key (starts with re_):"
read -s RESEND_API_KEY
echo ""

# Validate inputs
if [ -z "$SUPABASE_TOKEN" ]; then
  echo "❌ Error: Supabase access token is required"
  exit 1
fi

if [ -z "$RESEND_API_KEY" ]; then
  echo "❌ Error: Resend API key is required"
  exit 1
fi

if [[ ! "$RESEND_API_KEY" =~ ^re_ ]]; then
  echo "⚠️  Warning: Resend API key should start with 're_'"
fi

echo "🔗 Linking to Supabase project..."
export SUPABASE_ACCESS_TOKEN="$SUPABASE_TOKEN"
npx supabase link --project-ref "$PROJECT_REF" --password ""

if [ $? -ne 0 ]; then
  echo "❌ Failed to link project. Please check your access token."
  exit 1
fi

echo "✅ Project linked successfully!"
echo ""

echo "🔐 Setting Resend API key as secret..."
npx supabase secrets set RESEND_API_KEY="$RESEND_API_KEY"

if [ $? -ne 0 ]; then
  echo "❌ Failed to set secret. Please check your API key."
  exit 1
fi

echo "✅ Secret set successfully!"
echo ""

echo "📦 Deploying Edge Function..."
npx supabase functions deploy send-invite-email

if [ $? -ne 0 ]; then
  echo "❌ Failed to deploy function."
  exit 1
fi

echo ""
echo "✅ Success! The email invite function has been deployed!"
echo ""
echo "📧 You can now test it by:"
echo "   1. Going to the Friends page in your app"
echo "   2. Using the 'Invite Friends' section"
echo "   3. Entering an email address and clicking 'Send Invite'"
echo ""
