#!/bin/bash

# Newomen iOS Build Script
# This script builds the iOS app for distribution

set -e

echo "🎯 Building Newomen iOS App..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build web app
echo -e "${YELLOW}Step 1: Building web app...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Web app built successfully${NC}"
else
    echo -e "${RED}❌ Web app build failed${NC}"
    exit 1
fi

# Step 2: Sync with Capacitor
echo -e "${YELLOW}Step 2: Syncing with Capacitor...${NC}"
npx cap sync ios
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Capacitor sync complete${NC}"
else
    echo -e "${RED}❌ Capacitor sync failed${NC}"
    exit 1
fi

# Step 3: Update iOS dependencies
echo -e "${YELLOW}Step 3: Updating iOS dependencies...${NC}"
cd ios
pod install --repo-update
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Pod dependencies updated${NC}"
else
    echo -e "${RED}❌ Pod installation failed${NC}"
    exit 1
fi

# Step 4: Build iOS app
echo -e "${YELLOW}Step 4: Building iOS app...${NC}"
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -derivedDataPath build \
  -arch arm64 \
  clean build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ iOS app built successfully${NC}"
else
    echo -e "${RED}❌ iOS app build failed${NC}"
    exit 1
fi

# Step 5: Create .ipa file
echo -e "${YELLOW}Step 5: Creating iOS app package (.ipa)...${NC}"
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -derivedDataPath build \
  -arch arm64 \
  -allowProvisioningUpdates \
  archive -archivePath build/Newomen.xcarchive

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ iOS archive created${NC}"
else
    echo -e "${RED}❌ iOS archive creation failed${NC}"
    exit 1
fi

# Step 6: Export for distribution
echo -e "${YELLOW}Step 6: Exporting for App Store distribution...${NC}"
xcodebuild -exportArchive \
  -archivePath build/Newomen.xcarchive \
  -exportPath build/IPA \
  -exportOptionsPlist ExportOptions.plist

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ App exported for distribution${NC}"
else
    echo -e "${RED}❌ App export failed${NC}"
    exit 1
fi

cd ..

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ iOS App Build Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "📦 Output file: ios/build/IPA/Newomen.ipa"
echo ""
echo "🚀 Next steps:"
echo "1. Use Transporter to upload .ipa to App Store"
echo "2. Or use Xcode: Window > Organizer > Archives > Upload"
echo ""
