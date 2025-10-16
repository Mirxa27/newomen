#!/bin/bash

# Newomen Web Deployment Script
# Deploys to Vercel production

set -e

echo "🚀 Newomen Web Deployment Script"
echo "================================"

# Step 1: Build
echo "📦 Building web app..."
npm run build
echo "✓ Build complete"

# Step 2: Check dist folder
echo ""
echo "📁 Checking build artifacts..."
if [ -d "dist" ]; then
  SIZE=$(du -sh dist | cut -f1)
  echo "✓ dist/ folder size: $SIZE"
  FILE_COUNT=$(find dist -type f | wc -l)
  echo "✓ Total files: $FILE_COUNT"
else
  echo "✗ dist/ folder not found!"
  exit 1
fi

# Step 3: Check for required files
echo ""
echo "🔍 Verifying critical files..."
REQUIRED_FILES=(
  "dist/index.html"
  "dist/assets"
  "dist/fixed-background.jpg"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -e "$file" ]; then
    echo "✓ $file"
  else
    echo "✗ MISSING: $file"
  fi
done

# Step 4: Deploy options
echo ""
echo "🌐 Deploy Options:"
echo "1. Vercel (recommended) - npx vercel deploy --prod"
echo "2. Custom Server - scp -r dist/* user@server:/path/"
echo "3. Docker - docker build -t newomen:1.0.0 ."
echo ""

# Step 5: Vercel deployment
if command -v vercel &> /dev/null; then
  echo "📤 Deploying to Vercel..."
  npx vercel deploy --prod --yes
  echo "✓ Deployment complete!"
  echo ""
  echo "📊 Production URL: https://newomen.vercel.app"
else
  echo "⚠️  Vercel CLI not installed"
  echo "Install with: npm i -g vercel"
  echo ""
  echo "Then deploy with: npx vercel deploy --prod"
fi

echo ""
echo "✅ Web deployment ready!"
