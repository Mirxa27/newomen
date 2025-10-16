#!/bin/bash

# iOS Deployment Script for Newomen
# Handles complete deployment workflow from build to App Store submission

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="Newomen"
BUNDLE_ID="me.newomen.app"
TEAM_ID="48P296BWWP"

# Directories
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPTS_DIR="$PROJECT_ROOT/scripts/ios"
BUILD_DIR="$PROJECT_ROOT/build"

# Parse command line arguments
ENVIRONMENT=${1:-"development"} # development, staging, production
SKIP_TESTS=${2:-false}
UPLOAD_TESTFLIGHT=${3:-false}
SUBMIT_APPSTORE=${4:-false}

echo -e "${BLUE}🚀 Newomen iOS Deployment${NC}"
echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
echo -e "${BLUE}Skip Tests: $SKIP_TESTS${NC}"
echo -e "${BLUE}Upload to TestFlight: $UPLOAD_TESTFLIGHT${NC}"
echo -e "${BLUE}Submit to App Store: $SUBMIT_APPSTORE${NC}"
echo ""

# Validate environment
case $ENVIRONMENT in
    "development"|"staging"|"production")
        echo -e "${GREEN}✅ Environment validated: $ENVIRONMENT${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid environment. Use: development, staging, or production${NC}"
        exit 1
        ;;
esac

# Check dependencies
echo -e "${YELLOW}🔍 Checking dependencies...${NC}"

# Check for required tools
required_tools=("npm" "xcodebuild" "git")
missing_tools=()

for tool in "${required_tools[@]}"; do
    if ! command -v "$tool" > /dev/null 2>&1; then
        missing_tools+=("$tool")
    fi
done

if [ ${#missing_tools[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required tools: ${missing_tools[*]}${NC}"
    exit 1
fi

# Check for fastlane (optional but recommended)
if command -v fastlane > /dev/null 2>&1; then
    USE_FASTLANE=true
    echo -e "${GREEN}✅ Fastlane found - will use optimized deployment${NC}"
else
    USE_FASTLANE=false
    echo -e "${YELLOW}⚠️  Fastlane not found - using standard build process${NC}"
fi

# Check git status
echo -e "${YELLOW}📋 Checking git status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${RED}❌ Working directory is not clean. Please commit or stash changes.${NC}"
        exit 1
    else
        echo -e "${YELLOW}⚠️  Working directory has changes, continuing for $ENVIRONMENT${NC}"
    fi
fi

# Check current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$ENVIRONMENT" = "production" ] && [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}❌ Production builds must be from main branch (current: $CURRENT_BRANCH)${NC}"
    exit 1
fi

# Build web assets
echo -e "${YELLOW}🌐 Building web assets...${NC}"
cd "$PROJECT_ROOT"

if [ "$ENVIRONMENT" = "development" ]; then
    npm run build:dev
else
    npm run build
fi

# Sync with Capacitor
echo -e "${YELLOW}📱 Syncing Capacitor...${NC}"
npx cap sync ios

# Run tests (if not skipped)
if [ "$SKIP_TESTS" = "false" ]; then
    echo -e "${YELLOW}🧪 Running tests...${NC}"

    if [ "$USE_FASTLANE" = true ]; then
        cd "$PROJECT_ROOT/ios"
        fastlane test
    else
        # Basic npm test
        cd "$PROJECT_ROOT"
        npm test
    fi

    echo -e "${GREEN}✅ Tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping tests${NC}"
fi

# Choose deployment method
if [ "$USE_FASTLANE" = true ]; then
    echo -e "${BLUE}🚀 Using Fastlane for deployment...${NC}"
    cd "$PROJECT_ROOT/ios"

    case $ENVIRONMENT in
        "development")
            fastlane build_dev
            ;;
        "staging")
            fastlane build_adhoc
            ;;
        "production")
            if [ "$UPLOAD_TESTFLIGHT" = "true" ]; then
                fastlane beta
            elif [ "$SUBMIT_APPSTORE" = "true" ]; then
                fastlane release
            else
                fastlane build_adhoc
            fi
            ;;
    esac
else
    echo -e "${BLUE}🔨 Using standard build process...${NC}"

    # Determine configuration
    case $ENVIRONMENT in
        "development")
            CONFIGURATION="Debug"
            ;;
        "staging"|"production")
            CONFIGURATION="Release"
            ;;
    esac

    # Run build script
    "$SCRIPTS_DIR/build-ios.sh" "$CONFIGURATION" "$(date +%s)" "1.0"
fi

# Post-build actions
BUILD_SUCCESS=$?

if [ $BUILD_SUCCESS -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully!${NC}"

    # Get build info
    BUILD_ARTIFACTS=$(find "$BUILD_DIR/exports" -name "*.ipa" 2>/dev/null || echo "")

    if [ -n "$BUILD_ARTIFACTS" ]; then
        echo -e "${GREEN}📦 Build artifacts:${NC}"
        for artifact in $BUILD_ARTIFACTS; do
            echo -e "${GREEN}   - $artifact ($(du -h "$artifact" | cut -f1))${NC}"
        done
    fi

    # Environment-specific actions
    case $ENVIRONMENT in
        "development")
            echo -e "${BLUE}📱 Development build ready. Install IPA on device for testing.${NC}"
            ;;
        "staging")
            echo -e "${BLUE}👥 Staging build ready. Distribute to testing team.${NC}"
            ;;
        "production")
            if [ "$UPLOAD_TESTFLIGHT" = "true" ]; then
                echo -e "${BLUE}☁️  Build uploaded to TestFlight. Check TestFlight for processing.${NC}"
            fi
            if [ "$SUBMIT_APPSTORE" = "true" ]; then
                echo -e "${BLUE}🏆 Build submitted to App Store. Monitor App Store Connect for review status.${NC}"
            fi
            ;;
    esac

    # Generate deployment report
    REPORT_FILE="$BUILD_DIR/deployment-report-$(date +%Y%m%d-%H%M%S).txt"

    cat > "$REPORT_FILE" << EOF
Newomen iOS Deployment Report
=============================
Deployment Date: $(date)
Environment: $ENVIRONMENT
Configuration: $CONFIGURATION
Git Branch: $CURRENT_BRANCH
Git Commit: $(git rev-parse HEAD)
Build Artifacts: $BUILD_ARTIFACTS

Deployment Settings:
- Skip Tests: $SKIP_TESTS
- Upload TestFlight: $UPLOAD_TESTFLIGHT
- Submit App Store: $SUBMIT_APPSTORE
- Use Fastlane: $USE_FASTLANE

Deployment completed successfully!

EOF

    echo -e "${GREEN}📄 Deployment report: $REPORT_FILE${NC}"

else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}🚀 Newomen iOS app is ready for $ENVIRONMENT${NC}"