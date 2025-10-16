#!/bin/bash

# iOS Project Rebuild Script
# Rebuilds the complete iOS project for Newomen

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(pwd)"
IOS_PROJECT_PATH="${PROJECT_ROOT}/ios/App"
CAPACITOR_CONFIG="${PROJECT_ROOT}/capacitor.config.ts"

echo -e "${BLUE}🔧 Rebuilding iOS Project for Newomen${NC}"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must be run from project root with package.json${NC}"
    exit 1
fi

# Step 1: Copy the capacitor config to JSON format
echo -e "\n${YELLOW}📝 Creating capacitor.config.json...${NC}"
cat > capacitor.config.json << 'EOF'
{
  "appId": "me.newomen.app",
  "appName": "Newomen",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "launchAutoHide": true,
      "backgroundColor": "#1a1428",
      "androidSplashResourceName": "splash",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": false,
      "androidSpinnerStyle": "large",
      "iosSpinnerStyle": "small",
      "spinnerColor": "#9b87f5",
      "splashFullScreen": true,
      "splashImmersive": true,
      "layoutName": "launch_screen",
      "useDialog": true
    },
    "StatusBar": {
      "style": "dark",
      "backgroundColor": "#1a1428"
    },
    "Keyboard": {
      "resize": "body",
      "style": "dark",
      "resizeOnFullScreen": true
    },
    "Haptics": {
      "enabled": true
    },
    "LocalNotifications": {
      "smallIcon": "ic_stat_icon_config_sample",
      "iconColor": "#9b87f5",
      "sound": "beep.wav"
    }
  },
  "ios": {
    "contentInset": "automatic",
    "scrollEnabled": true,
    "backgroundColor": "#1a1428",
    "allowsLinkPreview": false,
    "handleApplicationURL": false,
    "scheme": "Newomen"
  },
  "android": {
    "allowMixedContent": true,
    "captureInput": true,
    "webContentsDebuggingEnabled": false,
    "appendUserAgent": "NewomenMobile",
    "overrideUserAgent": "NewomenMobile"
  }
}
EOF

# Step 2: Add iOS platform
echo -e "\n${YELLOW}📱 Adding iOS platform...${NC}"
npx cap add ios

# Step 3: Copy existing iOS project files if they exist
if [ -d "ios_backup_20251016_141115" ]; then
    echo -e "\n${YELLOW}📂 Restoring iOS project files...${NC}"

    # Copy App icons
    if [ -d "ios_backup_20251016_141115/App/App/Assets.xcassets/AppIcon.appiconset" ]; then
        cp -r ios_backup_20251016_141115/App/App/Assets.xcassets/AppIcon.appiconset ios/App/App/Assets.xcassets/
        echo -e "${GREEN}✅ App icons restored${NC}"
    fi

    # Copy other assets
    if [ -d "ios_backup_20251016_141115/App/App/Assets.xcassets/Splash.imageset" ]; then
        cp -r ios_backup_20251016_141115/App/App/Assets.xcassets/Splash.imageset ios/App/App/Assets.xcassets/
        echo -e "${GREEN}✅ Splash images restored${NC}"
    fi

    # Copy Info.plist additions
    if [ -f "ios_backup_20251016_141115/App/App/Info.plist" ]; then
        echo -e "${YELLOW}📝 Restoring Info.plist configuration...${NC}"
        # Extract custom configurations from backup
        plutil -extract NSAppTransportSecurity xml ios_backup_20251016_141115/App/App/Info.plist -o - 2>/dev/null | \
        plutil -insert NSAppTransportSecurity -xml ios/App/App/Info.plist - 2>/dev/null || true

        plutil -extract NSFaceIDUsageDescription xml ios_backup_20251016_141115/App/App/Info.plist -o - 2>/dev/null | \
        plutil -insert NSFaceIDUsageDescription -xml ios/App/App/Info.plist - 2>/dev/null || true

        plutil -extract NSMicrophoneUsageDescription xml ios_backup_20251016_141115/App/App/Info.plist -o - 2>/dev/null | \
        plutil -insert NSMicrophoneUsageDescription -xml ios/App/App/Info.plist - 2>/dev/null || true

        plutil -extract NSCameraUsageDescription xml ios_backup_20251016_141115/App/App/Info.plist -o - 2>/dev/null | \
        plutil -insert NSCameraUsageDescription -xml ios/App/App/Info.plist - 2>/dev/null || true

        plutil -extract NSHealthShareUsageDescription xml ios_backup_20251016_141115/App/App/Info.plist -o - 2>/dev/null | \
        plutil -insert NSHealthShareUsageDescription -xml ios/App/App/Info.plist - 2>/dev/null || true

        plutil -extract NSHealthUpdateUsageDescription xml ios_backup_20251016_141115/App/App/Info.plist -o - 2>/dev/null | \
        plutil -insert NSHealthUpdateUsageDescription -xml ios/App/App/Info.plist - 2>/dev/null || true

        plutil -extract NSLocationWhenInUseUsageDescription xml ios_backup_20251016_141115/App/App/Info.plist -o - 2>/dev/null | \
        plutil -insert NSLocationWhenInUseUsageDescription -xml ios/App/App/Info.plist - 2>/dev/null || true

        echo -e "${GREEN}✅ Info.plist updated${NC}"
    fi
fi

# Step 4: Generate icons if needed
if [ ! -d "ios/App/App/Assets.xcassets/AppIcon.appiconset" ]; then
    echo -e "\n${YELLOW}🎨 Generating iOS icons...${NC}"
    export PROJECT_ROOT="$PROJECT_ROOT"
    chmod +x "${PROJECT_ROOT}/scripts/generate-ios-icons.sh"
    "${PROJECT_ROOT}/scripts/generate-ios-icons.sh"
fi

# Step 5: Install pods
echo -e "\n${YELLOW}📦 Installing CocoaPods dependencies...${NC}"
cd ios/App
pod install

# Step 6: Sync Capacitor
echo -e "\n${YELLOW}🔄 Syncing Capacitor...${NC}"
cd "$PROJECT_ROOT"
npx cap sync ios

# Step 7: Update build version
echo -e "\n${YELLOW}📝 Updating build version...${NC}"
BUILD_NUMBER=$(date +%Y%m%d%H%M)
cd ios/App
agvtool new-marketing-version 1.0.0
agvtool new-version -all $BUILD_NUMBER

echo -e "\n${GREEN}✅ iOS project rebuilt successfully!${NC}"
echo "=================================="
echo -e "${BLUE}Project Details:${NC}"
echo -e "  📱 Bundle ID: me.newomen.app"
echo -e "  📦 Version: 1.0.0 ($BUILD_NUMBER)"
echo -e "  📂 Path: ${IOS_PROJECT_PATH}"
echo -e "\n${GREEN}Next Steps:${NC}"
echo -e "  1. Open iOS project: open ${IOS_PROJECT_PATH}/App.xcworkspace"
echo -e "  2. Select your team in project settings"
echo -e "  3. Update signing certificates"
echo -e "  4. Build and test: npx cap run ios"
echo -e "  5. Archive for production: ./scripts/build-ios-production.sh"