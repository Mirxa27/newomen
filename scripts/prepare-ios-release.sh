#!/bin/bash

# Newomen iOS Release Preparation Script
# This script prepares the iOS app for App Store submission

set -e  # Exit on error

echo "🚀 Newomen iOS Release Preparation"
echo "===================================="
echo ""

# Colors for output
RED='\033[0.31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the project root
if [ ! -f "capacitor.config.ts" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Step 1: Clean previous builds
print_info "Step 1: Cleaning previous builds..."
rm -rf dist/
rm -rf ios/App/App/public/
print_success "Previous builds cleaned"
echo ""

# Step 2: Build web assets
print_info "Step 2: Building web assets..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Web assets built successfully"
else
    print_error "Failed to build web assets"
    exit 1
fi
echo ""

# Step 3: Sync with Capacitor
print_info "Step 3: Syncing with Capacitor..."
npx cap sync ios
if [ $? -eq 0 ]; then
    print_success "Capacitor sync completed"
else
    print_error "Failed to sync Capacitor"
    exit 1
fi
echo ""

# Step 4: Verify Info.plist
print_info "Step 4: Verifying Info.plist..."
INFO_PLIST="ios/App/App/Info.plist"

if [ -f "$INFO_PLIST" ]; then
    # Check for required privacy descriptions
    REQUIRED_KEYS=(
        "NSCameraUsageDescription"
        "NSPhotoLibraryUsageDescription"
        "NSMicrophoneUsageDescription"
    )
    
    MISSING_KEYS=()
    for key in "${REQUIRED_KEYS[@]}"; do
        if ! grep -q "$key" "$INFO_PLIST"; then
            MISSING_KEYS+=("$key")
        fi
    done
    
    if [ ${#MISSING_KEYS[@]} -eq 0 ]; then
        print_success "All required privacy descriptions found"
    else
        print_warning "Missing privacy descriptions: ${MISSING_KEYS[*]}"
    fi
else
    print_error "Info.plist not found"
    exit 1
fi
echo ""

# Step 5: Check for Privacy Manifest
print_info "Step 5: Checking Privacy Manifest..."
PRIVACY_MANIFEST="ios/App/App/PrivacyInfo.xcprivacy"
if [ -f "$PRIVACY_MANIFEST" ]; then
    print_success "Privacy Manifest found"
else
    print_warning "Privacy Manifest not found (required for iOS 17+)"
fi
echo ""

# Step 6: Verify app icons
print_info "Step 6: Verifying app icons..."
ICON_PATH="ios/App/App/Assets.xcassets/AppIcon.appiconset"
if [ -d "$ICON_PATH" ]; then
    ICON_COUNT=$(find "$ICON_PATH" -name "*.png" | wc -l)
    if [ "$ICON_COUNT" -gt 0 ]; then
        print_success "Found $ICON_COUNT app icon(s)"
    else
        print_warning "No app icons found in $ICON_PATH"
        print_info "You need to add app icons before submission"
    fi
else
    print_warning "AppIcon.appiconset directory not found"
fi
echo ""

# Step 7: Check Podfile
print_info "Step 7: Checking iOS dependencies..."
cd ios/App
if [ -f "Podfile.lock" ]; then
    print_success "CocoaPods dependencies installed"
else
    print_warning "CocoaPods dependencies not installed"
    print_info "Running pod install..."
    pod install
fi
cd ../..
echo ""

# Step 8: Verify bundle identifier
print_info "Step 8: Verifying bundle identifier..."
BUNDLE_ID=$(/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "$INFO_PLIST" 2>/dev/null || echo "")
if [ -n "$BUNDLE_ID" ]; then
    print_success "Bundle ID: $BUNDLE_ID"
else
    print_warning "Could not read bundle identifier"
fi
echo ""

# Step 9: Check version and build number
print_info "Step 9: Checking version info..."
VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$INFO_PLIST" 2>/dev/null || echo "")
BUILD=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$INFO_PLIST" 2>/dev/null || echo "")
if [ -n "$VERSION" ] && [ -n "$BUILD" ]; then
    print_success "Version: $VERSION (Build: $BUILD)"
else
    print_warning "Could not read version information"
fi
echo ""

# Final Summary
echo "=================================="
echo "📋 Pre-Release Checklist"
echo "=================================="
echo ""

# Create checklist
CHECKLIST=(
    "Web assets built:✅"
    "Capacitor synced:✅"
    "Info.plist verified:✅"
)

if [ -f "$PRIVACY_MANIFEST" ]; then
    CHECKLIST+=("Privacy Manifest:✅")
else
    CHECKLIST+=("Privacy Manifest:⚠️  (Create before submission)")
fi

if [ -d "$ICON_PATH" ] && [ "$ICON_COUNT" -gt 0 ]; then
    CHECKLIST+=("App Icons:✅")
else
    CHECKLIST+=("App Icons:❌ (Required)")
fi

for item in "${CHECKLIST[@]}"; do
    echo "  $item"
done

echo ""
echo "=================================="
echo "📝 Next Steps"
echo "=================================="
echo ""
echo "1. Open in Xcode:"
echo "   npx cap open ios"
echo ""
echo "2. In Xcode:"
echo "   • Select 'App' target"
echo "   • Go to 'Signing & Capabilities'"
echo "   • Select your Team"
echo "   • Verify Bundle ID: $BUNDLE_ID"
echo "   • Update Version if needed: $VERSION"
echo ""
echo "3. Add App Icons (if not done):"
echo "   • Assets.xcassets → AppIcon"
echo "   • Add all required sizes"
echo ""
echo "4. Build & Archive:"
echo "   • Product → Archive"
echo "   • Wait for completion"
echo "   • Validate & Upload to App Store Connect"
echo ""
echo "5. Complete App Store Connect listing"
echo "   • Screenshots"
echo "   • Description"
echo "   • Privacy details"
echo "   • Submit for review"
echo ""
print_success "Preparation complete! Ready for Xcode."
echo ""

