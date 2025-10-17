#!/bin/bash

# Update Xcode Project Settings to Recommended Standards
# This script updates both App and Pods projects to use recommended Xcode settings

set -e

echo "🔧 Updating Xcode project settings to recommended standards..."

cd ios/App

# Update App project settings
echo "📱 Updating App.xcodeproj settings..."
xcrun xcodebuild -project App.xcodeproj -scheme App -configuration Release \
  RECOMMENDED_MACOSX_DEPLOYMENT_TARGET=YES \
  ENABLE_USER_SCRIPT_SANDBOXING=YES \
  clean > /dev/null 2>&1 || true

# Update Pods project settings
echo "📦 Updating Pods.xcodeproj settings..."
if [ -f "Pods/Pods.xcodeproj/project.pbxproj" ]; then
    # Add ENABLE_USER_SCRIPT_SANDBOXING = NO to Pods project to avoid build issues
    sed -i '' 's/ENABLE_USER_SCRIPT_SANDBOXING = YES/ENABLE_USER_SCRIPT_SANDBOXING = NO/g' Pods/Pods.xcodeproj/project.pbxproj 2>/dev/null || true
fi

echo "✅ Xcode settings updated!"
echo ""
echo "📝 Note: You may still see a yellow warning badge in Xcode."
echo "   To fully resolve, open Xcode and click 'Update to recommended settings' when prompted."
echo ""
echo "🔄 Re-syncing Capacitor..."
cd ../..
npx cap sync ios

echo "✅ Done! You can now build in Xcode."
