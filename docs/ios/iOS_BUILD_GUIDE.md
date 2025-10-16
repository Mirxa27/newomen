# Newomen iOS Build Guide

This guide covers the complete iOS build and deployment process for the Newomen app.

## 📱 iOS App Overview

**App Name:** Newomen
**Bundle ID:** me.newomen.app
**Minimum iOS Version:** 14.0
**Target iOS Version:** 17.0+
**Supported Devices:** iPhone (All models), iPad
**Orientations:** Portrait, Landscape

---

## 🏗️ Project Architecture

### Tech Stack
- **Framework:** Capacitor 6.0+
- **Build System:** Xcode 15+
- **Language:** Swift 5.9+
- **Package Manager:** CocoaPods
- **Web Runtime:** WKWebView (modern Safari engine)

### Directory Structure
```
ios/
├── App/
│   ├── App/
│   │   ├── AppDelegate.swift          # App lifecycle management
│   │   ├── SceneDelegate.swift        # Scene lifecycle (iOS 13+)
│   │   ├── Info.plist                 # App configuration
│   │   ├── PrivacyInfo.xcprivacy      # Privacy manifest (iOS 17+)
│   │   ├── Assets.xcassets/           # App icons and splash screen
│   │   ├── Base.lproj/                # Storyboards
│   │   └── public/                    # Web assets (dist folder)
│   ├── App.xcodeproj/                 # Xcode project file
│   ├── App.xcworkspace/               # Xcode workspace
│   ├── Podfile                        # CocoaPods dependencies
│   └── Pods/                          # Installed pods
└── capacitor-cordova-ios-plugins/     # Cordova plugins

```

---

## ⚙️ Configuration Details

### Capacitor Configuration (`capacitor.config.ts`)

**Splash Screen:**
- Launch duration: 2000ms
- Auto-hide: Enabled
- Theme: Dark (`#1a1428`)
- Spinner: Disabled for cleaner look

**Status Bar:**
- Style: Dark with light content
- Background: Matching app theme (`#1a1428`)

**Keyboard:**
- Resize: Body (content adjusts for keyboard)
- Style: Dark
- Full-screen support: Enabled

**Haptics:**
- Enabled for better UX feedback
- Used in buttons and interactive elements

### iOS-Specific Settings

**App Settings:**
- Content Inset: Automatic (handles safe areas)
- Scroll: Enabled
- Link Preview: Disabled (cleaner experience)
- URL Handling: Disabled

**Permissions Requested:**
- ✅ Camera - Profile pictures, community sharing
- ✅ Photo Library - Media access
- ✅ Microphone - Voice chat sessions
- ✅ Location - Wellness resources discovery
- ✅ User Tracking - Personalized content
- ✅ Calendar - Event scheduling (future)
- ✅ Contacts - Connection suggestions (future)

---

## 🔧 Build & Release Setup

### Prerequisites

```bash
# 1. Install Xcode (15.0+) from App Store
# 2. Install CocoaPods
sudo gem install cocoapods

# 3. Verify Node.js (v18+)
node --version
npm --version

# 4. Install project dependencies
npm install

# 5. Build web app
npm run build

# 6. Sync with Capacitor
npx cap sync ios
```

### Building the App

#### Development Build
```bash
# 1. Open in Xcode
npx cap open ios

# 2. Select "App" target
# 3. Select simulator or device
# 4. Press ▶️ Run (Cmd+R)

# Or via CLI:
xcodebuild -scheme App -configuration Debug
```

#### Production Build (Archive)
```bash
# 1. Update version number in Xcode
#    Target > General > Version (e.g., 1.0.0)
#    Target > General > Build (increment)

# 2. Build archive
xcodebuild -scheme App -configuration Release \
  -archivePath ~/Downloads/Newomen.xcarchive \
  archive

# 3. Validate and distribute via Xcode
#    Window > Organizer > Archives > Distribute App

# Or create IPA directly:
xcodebuild -exportArchive \
  -archivePath ~/Downloads/Newomen.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath ~/Downloads/
```

---

## 📋 App Store Submission Checklist

### Before Submission

- [ ] **Version Updated**
  - Version: Semantic versioning (e.g., 1.0.0)
  - Build: Incremented (e.g., 1, 2, 3)

- [ ] **Signing & Capabilities**
  - Team selected
  - Signing certificate valid
  - Provisioning profile current

- [ ] **Metadata Complete**
  - App name: "Newomen"
  - Subtitle: "AI-Powered Personal Growth"
  - Description: Compelling product description
  - Keywords: AI, wellness, personal growth, meditation, etc.
  - Screenshot/Preview Videos: High quality (at least 3)

- [ ] **Icons & Assets**
  - App Icon: 1024x1024 PNG
  - Launch Screen: Optimized
  - Preview images: 1242x2208 minimum

- [ ] **Privacy & Legal**
  - Privacy Policy: URL provided
  - Terms of Service: URL provided
  - Age Rating: PEGI 3 / ESRB Everyone
  - License Agreement: Standard or custom

- [ ] **Functionality Tested**
  - All features work on iPad and iPhone
  - No crashes during testing
  - Performance acceptable
  - Battery usage reasonable

- [ ] **Compliance**
  - Uses approved cryptography
  - No private APIs
  - Follows App Store guidelines
  - GDPR compliant (if applicable)

### Step-by-Step Submission

1. **Archive App**
   ```bash
   npx cap sync ios
   # Open in Xcode > Product > Archive
   ```

2. **Validate App**
   - Xcode > Window > Organizer
   - Right-click archive > Validate App

3. **Distribute App**
   - Xcode > Window > Organizer
   - Right-click archive > Distribute App
   - Select "App Store Connect"
   - Follow prompts

4. **TestFlight (Optional)**
   - Upload to TestFlight first
   - Test with beta users
   - Wait for review (1-24 hours)

5. **App Store Review**
   - App goes to App Store review queue
   - Review time: 1-48 hours typically
   - Respond to any metadata requests

6. **Release**
   - Once approved, schedule release
   - Can release immediately or date-specific

---

## 🔐 Signing & Certificates

### Apple Developer Account Setup

1. **Enroll in Apple Developer Program** ($99/year)
2. **Register App ID:**
   - Bundle ID: `com.newomen.app`
   - Capabilities: Push Notifications, Wallet, etc.

3. **Create Signing Certificate:**
   - Certificates, Identifiers & Profiles
   - Certificates > Create new (iOS Development)

4. **Create Provisioning Profile:**
   - Provisioning Profiles > Create new
   - Type: iOS App Development / Distribution
   - Select App ID and certificate

### Xcode Configuration

```
Project > App > Signing & Capabilities
├── Team: Select your team
├── Bundle Identifier: com.newomen.app
├── Signing Certificate: Automatic (recommended)
└── Provisioning Profile: Automatic
```

---

## 🚀 Deployment Strategies

### Staging Release
```bash
# 1. Build for staging
xcodebuild -scheme App -configuration Debug

# 2. Test thoroughly
# 3. Fix any issues
# 4. Commit changes to git
```

### Production Release
```bash
# 1. Update version in Xcode
# 2. Build archive
# 3. Pass App Store review
# 4. Schedule release in App Store Connect
# 5. Monitor crash reports and reviews
```

### Over-The-Air Updates
For non-binary updates (JavaScript/CSS changes):
```bash
# 1. Update web app files
npm run build

# 2. Sync with Capacitor
npx cap sync ios

# 3. Create new build and release
# Users will get updated content automatically
```

---

## 📊 Performance Optimization

### Launch Time
- Target: < 3 seconds
- Optimize: Lazy load components, reduce initial bundle

### Memory Usage
- iPhone 11/12: ~100-150MB
- iPad: ~150-200MB
- Monitor: Xcode > Debug > Memory Report

### Network
- Use gzip compression
- Cache strategies: Service workers
- API timeout: 30 seconds

### Battery
- Disable location polling when app inactive
- Minimize video playback
- Batch network requests

---

## 🐛 Debugging

### Xcode Debugging
```bash
# 1. Open Xcode
npx cap open ios

# 2. Set breakpoints (click line number)

# 3. Run debugger (Cmd+R)

# 4. Check console for logs
# View > Debug Area > Show Console
```

### Safari Web Inspector
```bash
# For iOS simulator:
# Safari > Develop > [Device] > [App]

# For physical device:
# 1. Connect device
# 2. Trust computer
# 3. Enable Web Inspector on device
# 4. Use Safari on Mac to inspect
```

### Console Logs
```javascript
// In JavaScript
console.log('Debug message');
console.error('Error occurred');

// View in Xcode console
```

---

## 📈 Monitoring & Analytics

### Crash Reports
- App Store Connect > Analytics > Crashes
- Review stack traces
- Fix high-impact issues

### User Engagement
- Track active users
- Monitor session duration
- Analyze feature usage

### Performance Metrics
- Crash-free users: Target >99%
- Avg session length: Target >5 min
- First launch time: Target <3 sec

---

## 🔄 Maintenance & Updates

### Regular Updates
- Monthly: Security patches
- Quarterly: Feature releases
- Annually: Major versions

### Testing Before Release
1. Unit tests
2. Integration tests
3. Manual testing on devices
4. TestFlight beta release
5. User feedback review

### Version Bumping
- **Major (1.x.x)**: Breaking changes
- **Minor (1.2.x)**: New features
- **Patch (1.2.3)**: Bug fixes

Example: 1.0.0 → 1.1.0 (new feature) → 1.1.1 (bug fix)

---

## 📞 Troubleshooting

### Build Errors

**"Could not find Capacitor"**
```bash
npm install @capacitor/core @capacitor/cli
npx cap sync ios
```

**"Provisioning profile not found"**
```bash
# Select Team in Xcode
# Product > Clean Build Folder
# Product > Build
```

**"Pod install fails"**
```bash
cd ios/App
rm Podfile.lock
pod repo update
pod install
```

### Runtime Issues

**Blank white screen**
- Check console logs (Xcode)
- Verify web app builds correctly (`npm run build`)
- Clear cache: Product > Clean Build Folder

**Performance slow**
- Use Xcode profiler
- Check network requests
- Monitor memory usage

---

## ✅ Final Checklist

- [ ] Capacitor configured correctly
- [ ] Web app builds successfully
- [ ] App runs on simulator
- [ ] App runs on physical device
- [ ] Signing configured
- [ ] Metadata complete
- [ ] TestFlight tested
- [ ] App Store review passed
- [ ] Live in App Store
- [ ] Monitoring configured

---

## 📚 Resources

- **Capacitor Docs:** https://capacitorjs.com
- **Apple Developer:** https://developer.apple.com
- **App Store Connect:** https://appstoreconnect.apple.com
- **Xcode Documentation:** https://developer.apple.com/xcode/

---

**Last Updated:** October 2025  
**Maintained By:** Newomen Development Team
