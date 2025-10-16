#!/bin/bash

# iOS Clean Build Script
# This script performs a clean build of the iOS app

set -e

echo "🧹 Cleaning Xcode derived data..."
rm -rf ~/Library/Developer/Xcode/DerivedData/App-*

echo "📦 Building web assets..."
npm run build

echo "🔄 Syncing Capacitor..."
npx cap sync ios

echo "🏗️  Opening Xcode..."
npx cap open ios

echo "✅ Ready to build in Xcode!"
echo "📝 To build for release:"
echo "   1. Select 'Any iOS Device (arm64)' as the destination"
echo "   2. Product > Archive"
echo "   3. Distribute App"
