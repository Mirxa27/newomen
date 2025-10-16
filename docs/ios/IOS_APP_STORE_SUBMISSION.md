# iOS App Store Submission - Complete Guide for Newomen

## 🎯 Quick Start (5 Minutes)

### Prerequisites Checklist
```
✅ Xcode 15.0+ installed
✅ Apple Developer Account ($99/year)
✅ Project synced: npx cap sync ios
✅ Web build complete: npm run build
✅ Version updated in Xcode
```

### Quick Build Steps
```bash
# 1. Sync everything
npm run build
npx cap sync ios

# 2. Open in Xcode
npx cap open ios

# 3. Product > Archive
# 4. Window > Organizer > Validate
# 5. Distribute App > App Store Connect
```

---

## 📋 Pre-Submission Preparation (Detailed)

### Step 1: Update App Version

**In Xcode:**
```
1. Open ios/App/App.xcodeproj
2. Select "App" target
3. General tab
4. Version: 1.0.0 (first release)
5. Build: 1
```

**In Capacitor Config (optional):**
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.newomen.app',
  appName: 'Newomen',
  // ... rest of config
};
```

### Step 2: Verify Signing Certificate

**Process:**
1. Open Xcode Project Settings
2. Target > Signing & Capabilities
3. Select your team
4. Automatic signing: ON
5. Verify no warnings

**If you don't have a team:**
```
1. Apple ID > Manage Teams (top-right corner in Xcode)
2. Add Apple Developer account
3. Wait 5-10 seconds for provisioning
```

### Step 3: Configure Build Settings

**Release Build:**
```
Build Settings tab:
└─ Search: "Release"
   ├─ Optimization Level: Optimize for Speed
   ├─ Strip Debug Symbols: YES
   └─ Generate Debug Symbols: YES
```

### Step 4: Verify App Icons & Assets

**Locations to check:**
```
ios/App/App/Assets.xcassets/
├─ AppIcon.appiconset/
│  └─ AppIcon-512@2x.png (1024x1024)
└─ Splash.imageset/
   └─ splash-2732x2732.png (iPad Pro 12.9")
```

**If missing icons, add them:**
1. Use Xcode Asset Catalog Editor
2. Drag PNG files into AppIcon set
3. Xcode auto-scales for all devices

---

## 🏗️ Building the Archive

### Method 1: Xcode GUI (Recommended)

```
1. Open Xcode
   npx cap open ios

2. Select "App" scheme (top-left)
   Scheme: App ▾

3. Select device
   Device: Any iOS Device (arm64)

4. Product > Archive
   (Wait 2-5 minutes)

5. Window > Organizer appears

6. Select archive > Validate App
   (Check for issues)

7. Select archive > Distribute App
   Method: App Store Connect
```

### Method 2: Command Line

```bash
cd ios/App

# Build archive
xcodebuild -scheme App \
  -configuration Release \
  -archivePath ~/Downloads/Newomen.xcarchive \
  archive

# Validate
xcodebuild -validateArchive \
  -archivePath ~/Downloads/Newomen.xcarchive \
  -exportOptionsPlist ExportOptions.plist

# Export IPA
xcodebuild -exportArchive \
  -archivePath ~/Downloads/Newomen.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath ~/Downloads/
```

**ExportOptions.plist:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" 
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>method</key>
  <string>app-store</string>
  <key>stripSwiftSymbols</key>
  <true/>
</dict>
</plist>
```

---

## 📊 App Store Connect Setup

### Step 1: Create App Listing

**On App Store Connect (appstoreconnect.apple.com):**

1. **My Apps** → **Create New App**

2. **App Information:**
   ```
   Platform: iOS
   Name: Newomen
   Bundle ID: com.newomen.app
   SKU: NEWOMEN2025 (any unique ID)
   ```

3. **Availability:**
   ```
   Release Type: Manual Release (control when it goes live)
   Countries: Select all (or your target markets)
   ```

### Step 2: App Store Information

**Metadata to Fill:**

```
Name: Newomen
Subtitle: AI-Powered Personal Growth
Category: Health & Fitness (or Lifestyle)

Description:
"Newomen is your AI-powered companion for personal growth 
and wellness. Connect with AI, take personalized assessments, 
join couples challenges, and explore guided wellness resources.

Features:
• AI-powered chat & voice conversations
• Personalized assessments & feedback
• Community features & couples challenges
• Wellness library with guided meditations
• Real-time progress tracking
• Premium subscription for advanced features"

Keywords: 
AI, wellness, meditation, personal growth, mental health,
self-care, mental wellness, life coaching, assessment

Support URL: https://newomen.com/support
Privacy Policy URL: https://newomen.com/privacy
Terms & Conditions: https://newomen.com/terms
```

### Step 3: Ratings & Content

**Age Rating:**
```
Select "None" for all potentially objectionable content
├─ Violence: None
├─ Sexual Content: None
├─ Profanity: None
├─ Gambling: None
└─ Alcohol/Tobacco: None
Result: PEGI 3 / ESRB Everyone
```

### Step 4: App Review Information

**Contact Information:**
```
First Name: [Your Name]
Last Name: [Your Last Name]
Email: [Your Email]
Phone: [Your Phone]
```

**Demo Account (if needed):**
```
Demo Account Required: No
(Unless you have paywalls requiring account)

If YES:
Email: demo@newomen.com
Password: Demo123456 (temporary)
Notes: Demo account resets weekly
```

### Step 5: Screenshots & Preview

**Requirements:**
```
Minimum: 1 screenshot per orientation
Recommended: 3-5 screenshots
Aspect Ratio: 6.5" (1242x2688) or 12.9" iPad (2048x2732)
Format: PNG or JPEG
Size: Max 5MB each
```

**Screenshot Strategy:**
1. Onboarding flow
2. Dashboard with AI chat
3. Assessments feature
4. Community challenges
5. Wellness library

**Tools to create:**
- Figma (free)
- Screenshot Tool (built-in)
- App Preview Maker (online tools)

### Step 6: Version Release Information

```
Version Number: 1.0.0
Build: 1

What's New in This Version:
"Welcome to Newomen! This is the initial release of our 
AI-powered personal growth platform. Experience:

• Intelligent AI conversations for personal wellness
• Science-based assessments with personalized insights
• Community features to connect with others
• Guided wellness resources and meditations
• Premium features for advanced personalization

We're continuously improving. Send feedback in Settings!"
```

---

## 🔐 Certificates & Provisioning

### Automatic Signing (Recommended)

Xcode handles everything:
```
1. Select team in Xcode
2. Check "Automatically manage signing"
3. Build
4. Done!
```

### Manual Signing (If needed)

**Create Certificate:**
1. Log in: https://developer.apple.com/account
2. Certificates, Identifiers & Profiles
3. Certificates > Create new
4. Type: iOS App Distribution
5. Download and install

**Create Provisioning Profile:**
1. Provisioning Profiles > Create new
2. Type: App Store
3. Bundle ID: com.newomen.app
4. Certificate: [Your cert from above]
5. Devices: N/A (App Store auto-selects)
6. Download and install

---

## 📤 Uploading to App Store

### Using Xcode Organizer (Easiest)

```
1. Archive app (Product > Archive)

2. Window > Organizer

3. Select archive

4. Validate App
   ✓ Check for issues
   ✓ Fix any problems

5. Distribute App
   └─ App Store Connect
      └─ Automatic (default)
      └─ Manual (advanced)

6. Follow prompts
   ✓ Select team
   ✓ Confirm distribution
   ✓ Wait for upload
```

### Using Transporter (Manual)

```bash
# Download your archive
# (From Organizer > Export)

# Install Transporter
# (App Store > Search "Transporter")

# Or use command line:
xcrun altool --upload-app \
  --file ~/Downloads/Newomen.ipa \
  --type ios \
  --apple-id your@email.com \
  --password your-app-specific-password
```

---

## ✅ App Store Review Process

### What Apple Checks

**Functionality:**
- ✅ App launches without crashing
- ✅ All buttons/links work
- ✅ No performance issues
- ✅ App orientation works

**Compliance:**
- ✅ Privacy policy accurate
- ✅ Permissions justified
- ✅ No private APIs
- ✅ No broken features

**Content:**
- ✅ Accurate metadata
- ✅ Screenshots match app
- ✅ No ads in screenshots
- ✅ Content appropriate for rating

**Security:**
- ✅ No malware
- ✅ Secure communications
- ✅ Data handling compliant
- ✅ No jailbreak references

### Common Rejection Reasons & Fixes

| Issue | Fix |
|-------|-----|
| Crashes on launch | Test on device, fix bugs |
| Requires internet but doesn't warn | Add offline message |
| Misleading screenshots | Update to match real app |
| Broken links | Test all URLs in app |
| Excessive battery drain | Optimize code |
| Login required but unclear | Add skip option or demo |
| Collects data without privacy policy | Add/update policy URL |

### Timeline

```
1. Submitted
   ↓
2. In Review (1-48 hours typically)
   ├─ Approved → Ready to Release ✅
   └─ Rejected → Fix & Resubmit
   ↓
3. Released (when you choose)
   ├─ Immediately after approval
   └─ Scheduled release date
   ↓
4. Live in App Store 🎉
```

---

## 🚀 Release Management

### Before Release

```
1. Approval Received
   └─ Check App Store Connect

2. Prepare Launch Materials
   └─ Social media posts
   └─ Email announcement
   └─ Press release (optional)

3. Set Release Date
   └─ App Store Connect > Version Release > Manual Release
   └─ Select date/time
   └─ Timezone: Usually UTC or your local
```

### Release Strategies

**Option 1: Immediate**
```
1. Approval received
2. Click "Release This Version"
3. Available in App Store in ~30 minutes
```

**Option 2: Scheduled**
```
1. Approval received
2. Click "Automatic Release"
3. Select date/time
4. Released automatically at that time
```

**Option 3: Phased Release** (iOS 13+)
```
1. Release to small % of users first
2. Monitor crashes/reviews
3. Increase to 25%, 50%, 100%
4. Useful for major updates
```

---

## 📊 Post-Launch Monitoring

### Watch for Issues

**Daily (First Week):**
```
App Store Connect > Analytics
├─ Crash Reports (should be < 1%)
├─ Ratings (aim for 4+ stars)
├─ Downloads/Sessions
└─ User Reviews (read feedback)
```

**Critical Issues:**
```
Crashes: Fix immediately, submit update
Bad Reviews: Respond professionally, ask for resolution
Performance: Profile and optimize
Features Not Working: Push emergency update
```

### Monitoring Tools

```
Built-in:
- App Store Connect Analytics
- Xcode Crash Reports
- TestFlight Beta Feedback

Third-party:
- Firebase Crashlytics
- Sentry
- Amplitude
- Mixpanel
```

### First Update Recommended

**1-2 Weeks After Launch:**
```
Version 1.0.1 with:
- Crash fixes (if any)
- Performance improvements
- UI tweaks based on feedback
- New features

This shows momentum and commitment
```

---

## 🔄 Versioning Strategy

### Version Numbers

```
Format: X.Y.Z (Major.Minor.Patch)

1.0.0 → First release
1.0.1 → Patch: Bug fixes only
1.1.0 → Minor: New features
2.0.0 → Major: Breaking changes

Each release needs new Build number:
Build: 1, 2, 3, 4, ...
```

### Submission Flow

```
Version 1.0.0 (Build 1) → Approved → Released

         ↓ (bug fixes found)

Version 1.0.1 (Build 2) → Approved → Released

         ↓ (new features)

Version 1.1.0 (Build 3) → Approved → Released
```

---

## 📞 Support & Troubleshooting

### Build Issues

**"Could not find Developer ID Application signing identity"**
```bash
# Reset signing
cd ios/App
rm -rf ~/Library/Developer/Xcode/DerivedData/*
pod repo update
pod install
```

**"Code Signing Error: Provisioning Profile Error"**
```
Xcode > Preferences > Accounts
├─ Select team
├─ Download All
└─ Retry build
```

**"No identities were available"**
```
Apple ID must have:
- Active Developer Program enrollment
- Accepted latest agreements
- Team role: Admin or Account Holder
```

### Upload Issues

**"This bundle is invalid. The app bundle must contain the bundle identifier in the filename"**
```
Solution: Use Xcode Organizer to upload
(Not manual IPA upload)
```

**"Your account does not have permission to perform this operation"**
```
Solution: 
1. Add yourself as App Manager
2. Wait 24 hours for permissions
3. Or use account owner credentials
```

### Review Rejection

**"Insufficient information in metadata"**
```
Fix: Fill ALL required fields in App Store Connect
Resubmit with complete info
```

**"Crash on launch"**
```
Fix: Debug on device
Install on iPhone
Xcode > Debug > Console
Fix crash
Rebuild & resubmit
```

---

## 🎓 Resources

### Official Documentation
- Apple Developer: https://developer.apple.com
- App Store Connect: https://appstoreconnect.apple.com
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Capacitor iOS: https://capacitorjs.com/docs/ios

### Tools
- Transporter: App Store app
- Xcode: https://developer.apple.com/download/
- Apple Configurator: Mac App Store

### Support
- Apple Developer Forum: https://developer.apple.com/forums/
- Stack Overflow: Tag "ios" + "app-store"
- Twitter: @AppleDeveloper

---

## ✅ Final Checklist

Before clicking "Submit for Review":

**Code & Build:**
- [ ] Latest code committed to git
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] Archive validates successfully
- [ ] Tested on real iOS device

**App Store Connect:**
- [ ] Version number updated
- [ ] Build attached
- [ ] All metadata filled
- [ ] Screenshot/preview present
- [ ] Privacy policy URL valid
- [ ] Support email working

**Compliance:**
- [ ] No private APIs used
- [ ] No hardcoded credentials
- [ ] Permissions justified
- [ ] Age-appropriate content
- [ ] No forbidden content

**Testing:**
- [ ] Feature tested: Chat ✅
- [ ] Feature tested: Assessments ✅
- [ ] Feature tested: Community ✅
- [ ] Feature tested: Payments ✅
- [ ] No crashes detected
- [ ] Performance acceptable

**Ready?**
```
✅ All checks passed
✅ Submitted for review
🎉 Celebrate!
```

---

## 🎉 You're Done!

**Timeline Summary:**
```
Day 1: Build & archive (30 min)
Day 2-3: In App Store Review (24-48 hours)
Day 4: Approved → Schedule Release
Day 5+: Live in App Store 🚀
```

**Congratulations on submitting Newomen to the App Store!**

---

**Document:** iOS App Store Submission Guide  
**App:** Newomen  
**Last Updated:** October 2025  
**Version:** 1.0.0
