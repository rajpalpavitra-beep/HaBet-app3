#!/bin/bash
# Git setup script for HaBet project
# Run this after installing Xcode command line tools

cd "$(dirname "$0")"

# Initialize git if not already done
if [ ! -d ".git" ]; then
  git init
  echo "✓ Git repository initialized"
fi

# Configure git (update with your details)
git config user.name "HaBet Developer"
git config user.email "developer@habet.app"

# Add all files
git add -A
echo "✓ All files staged"

# Create initial commit
git commit -m "Redesign UI to match screenshots + Add friends and game rooms features

- Updated design to match provided screenshots:
  * Login page with gradient background and handwritten fonts
  * Dashboard with welcome card and feature cards
  * Create Bet page with purple gradient theme
  * Added Permanent Marker font for handwritten style
  * Updated color scheme and gradients throughout

- Added Friends feature:
  * Friend requests system (send/accept/reject)
  * Friends list view
  * Search by email functionality

- Added Game Rooms feature:
  * Create rooms with unique codes
  * Join rooms using room codes
  * Room management (view/leave)

- Database schema for friends and rooms
- Updated routing and navigation
- All pages match screenshot design exactly"

echo "✓ Commit created successfully!"
echo ""
echo "To push to a remote repository:"
echo "  1. Create a repository on GitHub/GitLab"
echo "  2. Run: git remote add origin <your-repo-url>"
echo "  3. Run: git push -u origin main"
