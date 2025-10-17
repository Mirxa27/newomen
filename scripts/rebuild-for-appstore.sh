#!/bin/bash

# Complete rebuild script for App Store submission
# This fixes validation errors by ensuring a clean build

set -e

echo "🧹 Step 1: Cleaning all build artifacts..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/Library/Developer/Xcode/Archives/*
echo "✅ Cleaned Xcode caches"

echo ""
echo "📦 Step 2: Building web assets..."
cd "$(dirname "$0")/.."
npm run build
echo "✅ Web build complete"

echo ""
echo "🔄 Step 3: Syncing Capacitor..."
npx cap sync ios
echo "✅ Capacitor synced"

echo ""
echo "🧹 Step 4: Cleaning Xcode project..."
cd ios/App
xcodebuild clean -workspace App.xcworkspace -scheme App
echo "✅ Xcode project cleaned"

echo ""
echo "✅ All done! Now follow these steps in Xcode:"
echo ""
echo "1. Open Xcode: npx cap open ios"
echo "2. Select 'Any iOS Device (arm64)' as destination"
echo "3. Product → Archive"
echo "4. Wait for archive to complete"
echo "5. Click 'Distribute App'"
echo "6. Choose 'App Store Connect'"
echo "7. Follow the wizard"
echo ""
echo "💡 Tip: Make sure you've incremented the build number in Info.plist"
echo "   Current version should be higher than any previous uploads"
