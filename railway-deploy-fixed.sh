#!/bin/bash

echo "=== Railway Deployment Fix Script ==="
echo "Fixing npm lock file sync issues..."

# Remove corrupted lock file
echo "Removing corrupted package-lock.json..."
rm -f package-lock.json

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Regenerate package-lock.json
echo "Regenerating package-lock.json..."
npm install

# Verify packages are installed correctly
echo "Verifying key packages..."
npm list bcrypt bcryptjs jsonwebtoken mongodb morgan express

# Test npm ci (what Railway uses)
echo "Testing npm ci (Railway build process)..."
npm ci

echo "=== Fix Complete ==="
echo "Your Railway deployment should now work correctly!"
echo "The package-lock.json has been regenerated and is in sync with package.json"