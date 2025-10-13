#!/bin/bash

# iOS Signing Configuration Script for Newomen
# This script helps configure iOS code signing for development

echo "🔐 Configuring iOS Code Signing for Newomen..."

# Check if we're in the right directory
if [ ! -d "ios" ]; then
    echo "❌ Error: iOS directory not found. Please run this from the project root."
    exit 1
fi

echo "📱 iOS Signing Setup Guide:"
echo ""
echo "1. 🍎 Apple Developer Account Required:"
echo "   - You need an Apple Developer Account (free or paid)"
echo "   - Free account: Limited to 7 days of development"
echo "   - Paid account ($99/year): Full development capabilities"
echo ""
echo "2. 🔧 In Xcode (which should be open now):"
echo "   a. Select the 'App' project in the navigator (top item)"
echo "   b. Select the 'App' target"
echo "   c. Go to 'Signing & Capabilities' tab"
echo "   d. Check 'Automatically manage signing'"
echo "   e. Select your Apple ID from the 'Team' dropdown"
echo ""
echo "3. 🆔 If you don't see your Apple ID:"
echo "   - Go to Xcode > Preferences > Accounts"
echo "   - Click '+' to add your Apple ID"
echo "   - Sign in with your Apple ID"
echo ""
echo "4. 🚀 Alternative: Use Simulator Only"
echo "   - If you don't have an Apple ID, you can still run on iOS Simulator"
echo "   - Simulator doesn't require code signing"
echo "   - Just select an iPhone simulator and run"
echo ""

# Check if Xcode is installed
if command -v xcodebuild &> /dev/null; then
    echo "✅ Xcode is installed"
    
    # Get available simulators
    echo "📱 Available iOS Simulators:"
    xcrun simctl list devices available | grep iPhone | head -5
    echo ""
    
    echo "🎯 Quick Fix Options:"
    echo ""
    echo "Option 1: Use iOS Simulator (No signing required)"
    echo "  1. In Xcode, click the device selector (top-left)"
    echo "  2. Choose any iPhone simulator"
    echo "  3. Click the Play button to run"
    echo ""
    echo "Option 2: Configure Signing"
    echo "  1. In Xcode, select 'App' project"
    echo "  2. Select 'App' target"
    echo "  3. Go to 'Signing & Capabilities'"
    echo "  4. Check 'Automatically manage signing'"
    echo "  5. Select your development team"
    echo ""
    echo "Option 3: Use Free Apple ID"
    echo "  1. Add your Apple ID in Xcode Preferences > Accounts"
    echo "  2. Select it as your development team"
    echo "  3. Note: Free accounts have 7-day certificate limit"
    echo ""
else
    echo "❌ Xcode not found. Please install Xcode from the App Store."
fi

echo "🔧 Additional Configuration:"
echo ""

# Create a simple script to open Xcode with the project
cat > scripts/open-xcode.sh << 'EOF'
#!/bin/bash
echo "🚀 Opening Newomen iOS project in Xcode..."
open ios/App/App.xcodeproj
EOF

chmod +x scripts/open-xcode.sh

echo "📝 Created helper script: scripts/open-xcode.sh"
echo "   Run: ./scripts/open-xcode.sh to open the project again"
echo ""

echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Configure signing in Xcode (see instructions above)"
echo "2. Select a simulator or device"
echo "3. Click the Play button to run your app"
echo ""
echo "Need help? Check the iOS Development Guide:"
echo "https://developer.apple.com/documentation/xcode"
