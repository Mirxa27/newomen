#!/bin/bash

# iOS Production Build Script for Newomen App
# This script handles the complete iOS build process for production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEME="App"
CONFIGURATION="Release"
WORKSPACE="${PROJECT_ROOT}/ios/App/App.xcworkspace"
ARCHIVE_PATH="${PROJECT_ROOT}/build/App.xcarchive"
EXPORT_PATH="${PROJECT_ROOT}/build"
EXPORT_PLIST="${PROJECT_ROOT}/scripts/ExportOptions.plist"

echo -e "${BLUE}🚀 Starting iOS Production Build for Newomen${NC}"
echo "========================================"

# Check dependencies
echo -e "${YELLOW}📦 Checking dependencies...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Xcode is not installed${NC}"
    exit 1
fi

# Check if CocoaPods is installed
if ! command -v pod &> /dev/null; then
    echo -e "${RED}❌ CocoaPods is not installed${NC}"
    echo -e "${YELLOW}Installing CocoaPods...${NC}"
    sudo gem install cocoapods
fi

echo -e "${GREEN}✅ All dependencies are installed${NC}"

# Step 1: Generate iOS icons
echo -e "\n${YELLOW}🎨 Generating iOS icons...${NC}"
export PROJECT_ROOT="$PROJECT_ROOT"
chmod +x "${PROJECT_ROOT}/scripts/generate-ios-icons.sh"
"${PROJECT_ROOT}/scripts/generate-ios-icons.sh"

# Step 2: Install dependencies
echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"
cd "$PROJECT_ROOT"
npm ci

# Step 3: Build the web app
echo -e "\n${YELLOW}🔨 Building web app...${NC}"
npm run build

# Step 4: Update iOS pods
echo -e "\n${YELLOW}📱 Updating iOS pods...${NC}"
cd "${PROJECT_ROOT}/ios/App"
pod install --repo-update

# Step 5: Sync Capacitor
echo -e "\n${YELLOW}🔄 Syncing Capacitor with iOS...${NC}"
cd "$PROJECT_ROOT"
npx cap sync ios

# Step 6: Update build number
echo -e "\n${YELLOW}📝 Updating build number...${NC}"
BUILD_NUMBER=$(date +%Y%m%d%H%M)
cd "${PROJECT_ROOT}/ios/App"
agvtool new-marketing-version 1.0.0
agvtool new-version -all $BUILD_NUMBER

echo -e "${GREEN}✅ Build version: 1.0.0 ($BUILD_NUMBER)${NC}"

# Step 7: Clean build folder
echo -e "\n${YELLOW}🧹 Cleaning build folder...${NC}"
xcodebuild -workspace "$WORKSPACE" \
           -scheme "$SCHEME" \
           -configuration "$CONFIGURATION" \
           clean

# Step 8: Archive the app
echo -e "\n${YELLOW}📦 Archiving app...${NC}"
mkdir -p "$(dirname "$ARCHIVE_PATH")"

xcodebuild -workspace "$WORKSPACE" \
           -scheme "$SCHEME" \
           -configuration "$CONFIGURATION" \
           -archivePath "$ARCHIVE_PATH" \
           archive \
           -allowProvisioningUpdates \
           -destination generic/platform=iOS

# Step 9: Export the archive
echo -e "\n${YELLOW}📤 Exporting archive...${NC}"
mkdir -p "$EXPORT_PATH"

# Create ExportOptions.plist if it doesn't exist
if [ ! -f "$EXPORT_PLIST" ]; then
    echo -e "${YELLOW}Creating ExportOptions.plist...${NC}"
    cat > "$EXPORT_PLIST" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>destination</key>
    <string>export</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>me.newomen.app</key>
        <string>YOUR_PROVISIONING_PROFILE</string>
    </dict>
</dict>
</plist>
EOF
    echo -e "${YELLOW}⚠️  Please update YOUR_TEAM_ID and YOUR_PROVISIONING_PROFILE in ${EXPORT_PLIST}${NC}"
fi

xcodebuild -exportArchive \
           -archivePath "$ARCHIVE_PATH" \
           -exportPath "$EXPORT_PATH" \
           -exportOptionsPlist "$EXPORT_PLIST"

# Step 10: Create IPA
echo -e "\n${YELLOW}📱 Creating IPA...${NC}"
IPA_PATH="${EXPORT_PATH}/App.ipa"
if [ -f "${EXPORT_PATH}/App-1.0.0.ipa" ]; then
    mv "${EXPORT_PATH}/App-1.0.0.ipa" "$IPA_PATH"
fi

# Completion
echo -e "\n${GREEN}🎉 Build completed successfully!${NC}"
echo "========================================"
echo -e "${BLUE}Build Summary:${NC}"
echo -e "  📱 App: Newomen"
echo -e "  📦 Version: 1.0.0 ($BUILD_NUMBER)"
echo -e "  📂 Archive: ${ARCHIVE_PATH}"
echo -e "  📤 IPA: ${IPA_PATH}"
echo -e "\n${GREEN}Next Steps:${NC}"
echo -e "  1. Upload to App Store Connect: xcrun altool --upload-app --type ios --file ${IPA_PATH} --username \"YOUR_APPLE_ID\" --password \"@keychain:AC_PASSWORD\""
echo -e "  2. Or use Xcode Organizer to upload"
echo -e "  3. Configure app metadata in App Store Connect"
echo -e "\n${YELLOW}⚠️  Remember to:${NC}"
echo -e "  • Update team ID in ExportOptions.plist"
echo -e "  • Configure provisioning profiles"
echo -e "  • Set up App Store Connect metadata"
echo -e "  • Test on a real device before submission"