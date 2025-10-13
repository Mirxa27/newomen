#!/bin/bash

# Mobile Enhancement Setup Script for Newomen
# This script sets up the mobile-optimized version and prepares for Capacitor

echo "🚀 Setting up mobile enhancements for Newomen..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install Capacitor dependencies
echo "📱 Installing Capacitor dependencies..."
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard @capacitor/haptics @capacitor/local-notifications

# Initialize Capacitor if not already done
if [ ! -d "ios" ] && [ ! -d "android" ]; then
    echo "🔧 Initializing Capacitor..."
    npx cap init "Newomen" "com.newomen.app" --web-dir=dist
fi

# Add iOS platform
echo "🍎 Adding iOS platform..."
npx cap add ios

# Add Android platform
echo "🤖 Adding Android platform..."
npx cap add android

# Copy web assets
echo "📦 Building and syncing web assets..."
npm run build
npx cap sync

# Create mobile-specific environment file
echo "⚙️ Creating mobile environment configuration..."
cat > .env.mobile << EOF
# Mobile-specific environment variables
VITE_MOBILE_OPTIMIZED=true
VITE_CAPACITOR_ENABLED=true
VITE_HAPTIC_FEEDBACK=true
VITE_PUSH_NOTIFICATIONS=true
EOF

# Create mobile build script
echo "📝 Creating mobile build scripts..."
cat > scripts/build-mobile.sh << 'EOF'
#!/bin/bash

echo "🔨 Building mobile version..."

# Build the web app
npm run build

# Sync with Capacitor
npx cap sync

echo "✅ Mobile build complete!"
echo "📱 To run on iOS: npx cap open ios"
echo "🤖 To run on Android: npx cap open android"
EOF

chmod +x scripts/build-mobile.sh

# Create iOS-specific configuration
echo "🍎 Configuring iOS-specific settings..."
if [ -d "ios/App" ]; then
    # Update iOS Info.plist for better mobile experience
    cat >> ios/App/App/Info.plist << EOF

<!-- Mobile optimizations -->
<key>UIViewControllerBasedStatusBarAppearance</key>
<false/>
<key>UIStatusBarStyle</key>
<string>UIStatusBarStyleLightContent</string>
<key>UISupportedInterfaceOrientations</key>
<array>
    <string>UIInterfaceOrientationPortrait</string>
    <string>UIInterfaceOrientationLandscapeLeft</string>
    <string>UIInterfaceOrientationLandscapeRight</string>
</array>
<key>UISupportedInterfaceOrientations~ipad</key>
<array>
    <string>UIInterfaceOrientationPortrait</string>
    <string>UIInterfaceOrientationPortraitUpsideDown</string>
    <string>UIInterfaceOrientationLandscapeLeft</string>
    <string>UIInterfaceOrientationLandscapeRight</string>
</array>
EOF
fi

# Create Android-specific configuration
echo "🤖 Configuring Android-specific settings..."
if [ -d "android" ]; then
    # Update Android manifest for better mobile experience
    cat >> android/app/src/main/AndroidManifest.xml << EOF

<!-- Mobile optimizations -->
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
EOF
fi

# Create mobile development script
echo "🛠️ Creating mobile development script..."
cat > scripts/dev-mobile.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting mobile development server..."

# Start the development server
npm run dev &

# Wait a moment for the server to start
sleep 3

# Open Capacitor in live reload mode
npx cap run --livereload --external

echo "📱 Mobile development server running!"
echo "🌐 Web server: http://localhost:5173"
echo "📱 Mobile app: Running on device/emulator"
EOF

chmod +x scripts/dev-mobile.sh

# Update package.json with mobile scripts
echo "📝 Adding mobile scripts to package.json..."

# Create a temporary script to update package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts = {
  ...pkg.scripts,
  'mobile:dev': './scripts/dev-mobile.sh',
  'mobile:build': './scripts/build-mobile.sh',
  'mobile:ios': 'npm run build && npx cap sync ios && npx cap open ios',
  'mobile:android': 'npm run build && npx cap sync android && npx cap open android',
  'mobile:run': 'npm run build && npx cap run',
  'mobile:sync': 'npx cap sync'
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

echo "✅ Mobile setup complete!"
echo ""
echo "🎉 Newomen is now mobile-optimized and ready for Capacitor!"
echo ""
echo "📱 Available commands:"
echo "  npm run mobile:dev     - Start mobile development with live reload"
echo "  npm run mobile:build   - Build for mobile"
echo "  npm run mobile:ios     - Open iOS project in Xcode"
echo "  npm run mobile:android - Open Android project in Android Studio"
echo "  npm run mobile:run     - Run on connected device/emulator"
echo "  npm run mobile:sync    - Sync web assets with mobile projects"
echo ""
echo "🔧 Next steps:"
echo "  1. Run 'npm run mobile:dev' to start development"
echo "  2. Connect your device or start an emulator"
echo "  3. The app will automatically reload on your device"
echo ""
echo "📚 For more information, check the Capacitor documentation:"
echo "   https://capacitorjs.com/docs"
