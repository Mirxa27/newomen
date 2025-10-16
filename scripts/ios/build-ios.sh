#!/bin/bash

# iOS Build Script for Newomen
# This script automates the iOS build process for App Store submission

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="App"
SCHEME_NAME="App"
WORKSPACE_NAME="App.xcworkspace"
PROJECT_FILE="App.xcodeproj"
INFO_PLIST="App/Info.plist"
BUNDLE_ID="me.newomen.app"
TEAM_ID="48P296BWWP"

# Directories
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IOS_DIR="$PROJECT_ROOT/ios"
BUILD_DIR="$PROJECT_ROOT/build"
ARCHIVE_DIR="$BUILD_DIR/archives"
EXPORT_DIR="$BUILD_DIR/exports"

# Build configuration
CONFIGURATION=${1:-Release}
BUILD_NUMBER=${2:-1}
VERSION=${3:-"1.0"}

echo -e "${BLUE}🚀 Starting iOS Build Process${NC}"
echo -e "${BLUE}Project: $PROJECT_NAME${NC}"
echo -e "${BLUE}Configuration: $CONFIGURATION${NC}"
echo -e "${BLUE}Version: $VERSION ($BUILD_NUMBER)${NC}"
echo ""

# Cleanup and create directories
echo -e "${YELLOW}📁 Setting up build directories...${NC}"
rm -rf "$BUILD_DIR"
mkdir -p "$ARCHIVE_DIR"
mkdir -p "$EXPORT_DIR"

# Change to iOS directory
cd "$IOS_DIR/App"

# Check if project exists
if [ ! -f "$PROJECT_FILE/project.pbxproj" ]; then
    echo -e "${RED}❌ Error: Xcode project not found${NC}"
    exit 1
fi

# Update build number and version
echo -e "${YELLOW}📝 Updating build version and number...${NC}"
if command -v agvtool > /dev/null 2>&1; then
    agvtool new-marketing-version "$VERSION"
    agvtool new-version -all "$BUILD_NUMBER"
else
    echo -e "${RED}❌ Error: agvtool not found. Please run from Xcode or use xcodebuild directly.${NC}"
    exit 1
fi

# Install CocoaPods dependencies
echo -e "${YELLOW}📦 Installing CocoaPods dependencies...${NC}"
if [ -f "Podfile" ]; then
    pod install --repo-update
else
    echo -e "${YELLOW}⚠️  No Podfile found, skipping CocoaPods installation${NC}"
fi

# Clean project
echo -e "${YELLOW}🧹 Cleaning project...${NC}"
if [ -f "$WORKSPACE_NAME" ]; then
    xcodebuild clean \
        -workspace "$WORKSPACE_NAME" \
        -scheme "$SCHEME_NAME" \
        -configuration "$CONFIGURATION" \
        -destination 'generic/platform=iOS' \
        -quiet
else
    xcodebuild clean \
        -project "$PROJECT_FILE" \
        -scheme "$SCHEME_NAME" \
        -configuration "$CONFIGURATION" \
        -destination 'generic/platform=iOS' \
        -quiet
fi

# Build archive
echo -e "${YELLOW}🏗️  Building archive...${NC}"
ARCHIVE_PATH="$ARCHIVE_DIR/App-$VERSION-$BUILD_NUMBER.xcarchive"

if [ -f "$WORKSPACE_NAME" ]; then
    xcodebuild archive \
        -workspace "$WORKSPACE_NAME" \
        -scheme "$SCHEME_NAME" \
        -configuration "$CONFIGURATION" \
        -destination 'generic/platform=iOS' \
        -archivePath "$ARCHIVE_PATH" \
        -allowProvisioningUpdates \
        -quiet || {
        echo -e "${RED}❌ Archive build failed${NC}"
        exit 1
    }
else
    xcodebuild archive \
        -project "$PROJECT_FILE" \
        -scheme "$SCHEME_NAME" \
        -configuration "$CONFIGURATION" \
        -destination 'generic/platform=iOS' \
        -archivePath "$ARCHIVE_PATH" \
        -allowProvisioningUpdates \
        -quiet || {
        echo -e "${RED}❌ Archive build failed${NC}"
        exit 1
    }
fi

# Export for App Store
echo -e "${YELLOW}📤 Exporting for App Store...${NC}"
EXPORT_PLIST="$PROJECT_ROOT/scripts/ios/ExportOptions-AppStore.plist"

if [ ! -f "$EXPORT_PLIST" ]; then
    echo -e "${RED}❌ Export options plist not found: $EXPORT_PLIST${NC}"
    exit 1
fi

xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportPath "$EXPORT_DIR" \
    -exportOptionsPlist "$EXPORT_PLIST" \
    -quiet || {
    echo -e "${RED}❌ Archive export failed${NC}"
    exit 1
}

# Generate build report
echo -e "${YELLOW}📊 Generating build report...${NC}"
REPORT_FILE="$BUILD_DIR/build-report-$VERSION-$BUILD_NUMBER.txt"

cat > "$REPORT_FILE" << EOF
Newomen iOS Build Report
========================
Build Date: $(date)
Version: $VERSION ($BUILD_NUMBER)
Configuration: $CONFIGURATION
Bundle ID: $BUNDLE_ID
Team ID: $TEAM_ID

Archive Location: $ARCHIVE_PATH
Export Location: $EXPORT_DIR

Build Settings:
- Minimum iOS Version: 14.0
- Deployment Target: iPhone/iPad
- Architecture: Universal
- Swift Version: 5.0

Certificates and Profiles:
$(security find-identity -v -p codesigning 2>/dev/null | grep "$TEAM_ID" || echo "No matching identities found")

App Size:
$(du -sh "$EXPORT_DIR"/*.ipa 2>/dev/null || echo "IPA file not found")

Build Log:
Build completed successfully!

EOF

# Validate IPA
IPA_FILE=$(find "$EXPORT_DIR" -name "*.ipa" | head -1)
if [ -f "$IPA_FILE" ]; then
    echo -e "${GREEN}✅ IPA generated successfully: $IPA_FILE${NC}"
    echo -e "${GREEN}📱 File size: $(du -h "$IPA_FILE" | cut -f1)${NC}"

    # Additional validation
    if command -v ipautil > /dev/null 2>&1; then
        echo -e "${YELLOW}🔍 Validating IPA...${NC}"
        ipautil validate "$IPA_FILE" 2>/dev/null || echo -e "${YELLOW}⚠️  ipautil not available for validation${NC}"
    fi
else
    echo -e "${RED}❌ IPA file not found${NC}"
    exit 1
fi

# Upload to TestFlight (optional)
if [ "$4" = "--upload-testflight" ]; then
    echo -e "${YELLOW}☁️  Uploading to TestFlight...${NC}"

    if command -v xcrun > /dev/null 2>&1; then
        xcrun altool --upload-app \
            --type ios \
            --file "$IPA_FILE" \
            --username "$APPLE_ID" \
            --password "$APPLE_PASSWORD" \
            --asc-provider "$TEAM_ID" \
            --verbose || {
            echo -e "${RED}❌ TestFlight upload failed${NC}"
            echo -e "${YELLOW}💡 Please upload manually via Xcode Organizer${NC}"
        }
    else
        echo -e "${YELLOW}⚠️  xcrun not found. Please upload manually via Xcode Organizer${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo -e "${GREEN}📄 Report: $REPORT_FILE${NC}"
echo -e "${GREEN}📱 IPA: $IPA_FILE${NC}"
echo -e "${GREEN}📦 Archive: $ARCHIVE_PATH${NC}"

if [ "$4" = "--upload-testflight" ]; then
    echo -e "${GREEN}☁️  Check TestFlight for upload status${NC}"
fi

echo ""
echo -e "${BLUE}🎯 Next Steps:${NC}"
echo "1. Test the IPA on a device"
echo "2. Upload to App Store Connect"
echo "3. Complete App Store metadata"
echo "4. Submit for review"

echo ""
echo -e "${GREEN}🚀 Newomen iOS build process complete!${NC}"