#!/bin/bash
# Push script for HaBet - Run this with your GitHub token

cd "$(dirname "$0")"

echo "Enter your GitHub Personal Access Token:"
read -s TOKEN

if [ -z "$TOKEN" ]; then
  echo "Error: Token is required"
  exit 1
fi

# Update remote URL with token
git remote set-url origin https://rajpalpavitra-beep:${TOKEN}@github.com/rajpalpavitra-beep/habet.git

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main

# Remove token from remote URL for security
git remote set-url origin https://rajpalpavitra-beep@github.com/rajpalpavitra-beep/habet.git

echo "✓ Push complete!"
