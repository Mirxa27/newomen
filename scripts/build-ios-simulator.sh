#!/bin/bash
# Build and run iOS app in simulator

set -e

echo "🔨 Building Newomen iOS App..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd "$(dirname "$0")/.."

# Step 1: Build web assets
echo -e "\n${BLUE}1️⃣  Building web assets...${NC}"
npm run build

# Step 2: Sync with iOS
echo -e "\n${BLUE}2️⃣  Syncing with iOS...${NC}"
npx cap sync ios

# Step 3: Open Xcode
echo -e "\n${BLUE}3️⃣  Opening Xcode...${NC}"
open ios/App/App.xcworkspace

echo -e "\n${GREEN}✅ Build preparation complete!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Next Steps in Xcode:"
echo "   1. Select a simulator (e.g., iPhone 16 Pro)"
echo "   2. Click the ▶️  Play button to build and run"
echo "   3. The app should launch without blank screen"
echo ""
echo "🐛 Debugging:"
echo "   • View logs in Xcode console (⇧⌘C)"
echo "   • Check JavaScript errors in Safari Web Inspector"
echo "   • Enable debug mode: Safari → Develop → Simulator"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

