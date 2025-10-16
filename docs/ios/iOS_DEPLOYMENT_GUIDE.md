# 🍎 Newomen iOS App - Complete Deployment Guide

**Status**: ✅ Ready for App Store Submission  
**Target**: iOS 14.0+  
**Devices**: iPhone, iPad (Universal App)  
**Date**: October 15, 2025

---

## 📋 **PRE-SUBMISSION CHECKLIST**

### ✅ **App Information**
- [x] App Name: **Newomen**
- [x] Bundle ID: **com.newomen.app**
- [x] Version: **1.0.0** (Configure in Xcode)
- [x] Build Number: **1** (Configure in Xcode)
- [x] Primary Language: **English**
- [x] Category: **Health & Fitness** / **Lifestyle**
- [x] Keywords: wellness, meditation, AI, community, couples therapy

### ✅ **Capabilities Configured**
- [x] Push Notifications
- [x] HealthKit Integration
- [x] Calendar Access
- [x] Contacts Access
- [x] Background Fetch
- [x] App Groups
- [x] Associated Domains (Universal Links)

### ✅ **Privacy & Security**
- [x] Privacy Policy implemented
- [x] Terms of Service implemented
- [x] User data encryption enabled
- [x] Secure API connections (HTTPS)
- [x] Keychain access configured
- [x] File protection: Complete

### ✅ **Permissions**
- [x] Camera access description ✓
- [x] Photo library access description ✓
- [x] Microphone access description ✓
- [x] Calendar access description ✓
- [x] Contacts access description ✓
- [x] Health data access description ✓
- [x] Location access description ✓

---

## 🚀 **DEPLOYMENT STEPS**

### **Step 1: Prepare Your Apple Developer Account**

```bash
# Requirements:
- Apple Developer Program membership ($99/year)
- Xcode installed (version 14.0 or later)
- Provisioning profiles created
- Signing certificates set up
```

**Action Items:**
1. Sign up for [Apple Developer Program](https://developer.apple.com/programs/)
2. Create app identifiers in Apple Developer Portal
3. Create provisioning profiles for App Store distribution
4. Download and install certificates in Xcode

### **Step 2: Configure Xcode Project**

```bash
cd /Users/abdullahmirxa/dyad-apps/newomen/ios

# 1. Open the workspace
open App.xcworkspace

# 2. In Xcode:
# - Select "App" target
# - Go to "Signing & Capabilities"
# - Set Team ID (should auto-populate)
# - Verify bundle ID: com.newomen.app
# - Ensure all capabilities are checked
```

**Capabilities Verification:**
- [ ] Push Notifications
- [ ] HealthKit
- [ ] Calendar
- [ ] Contacts
- [ ] Associated Domains
- [ ] Background Fetch

### **Step 3: Update Version Information**

In Xcode (Targets → App → General):

```
Version: 1.0.0
Build: 1
```

**For future releases:**
- Increment Build number for TestFlight
- Increment Version for App Store releases

### **Step 4: Update App Icons & Splash Screens**

**Icon Requirements:**
- AppIcon (1024×1024) - All sizes auto-generated
- Location: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

**Current Status:**
- ✅ 512×512 icons included
- ✅ Auto-generation by Xcode ready

**To update:**
```bash
# 1. Replace image in Assets.xcassets
# 2. Xcode auto-generates all required sizes
```

### **Step 5: Build the App**

#### **For TestFlight (Beta Testing)**

```bash
# 1. Build the app
cd /Users/abdullahmirxa/dyad-apps/newomen
npm run build

# 2. Sync with Capacitor
npx cap sync ios

# 3. Open in Xcode
open ios/App.xcworkspace

# 4. In Xcode:
# - Select "App" target
# - Select Generic iOS Device (or your device)
# - Product → Build
```

#### **For App Store Release (Recommended)**

```bash
# Use the provided build script
cd /Users/abdullahmirxa/dyad-apps/newomen
chmod +x deployment/scripts/build-ios.sh
./deployment/scripts/build-ios.sh
```

### **Step 6: TestFlight Testing**

```bash
# In Xcode:
# 1. Product → Scheme → App
# 2. Product → Archive
# 3. Window → Organizer
# 4. Select latest archive
# 5. Upload to App Store Connect → TestFlight

# Or use Transporter:
xcrun altool --upload-app -f Newomen.ipa -t iOS -u APPLE_ID -p APP_SPECIFIC_PASSWORD
```

**TestFlight Testing Duration:** 1-3 hours for App Review

### **Step 7: Submit to App Store**

**Via Xcode:**
```
Xcode → Window → Organizer → Archives → Upload to App Store
```

**Via Transporter:**
```bash
transporter -f Newomen.ipa
```

### **Step 8: App Store Review**

**Review Timeline:** 24-48 hours typically

**Key Review Points:**
- ✅ Functionality works as described
- ✅ Privacy policy properly implemented
- ✅ No spam or misleading content
- ✅ Content guidelines compliance
- ✅ Performance optimization

---

## 📊 **APP FEATURES FOR REVIEW**

### **Community Features**
- ✅ View all community posts
- ✅ Create posts with text and images
- ✅ Comment on posts
- ✅ Like/unlike posts
- ✅ Real-time notifications

### **Assessment Features**
- ✅ 13+ AI-powered assessments
- ✅ AI answer suggestions (GLM-4.5-Air)
- ✅ AI result generation (GLM-4.6)
- ✅ Assessment progress tracking
- ✅ Score visualization

### **Wellness Resources**
- ✅ Browse wellness resources
- ✅ Stream audio content
- ✅ Watch video content
- ✅ Track progress
- ✅ Bookmark favorites

### **Couples Challenges**
- ✅ Create challenges with partner
- ✅ Answer challenge questions
- ✅ AI analysis of responses
- ✅ Share insights
- ✅ Track relationship growth

### **AI Integration**
- ✅ Z.AI integration (GLM-4.5-Air, GLM-4.6)
- ✅ Real-time suggestions
- ✅ Privacy-preserving analysis
- ✅ No data storage on device

### **Notifications**
- ✅ Push notifications for new posts
- ✅ Real-time notification delivery
- ✅ Sound and badge support
- ✅ Actionable notifications

---

## 🔐 **PRIVACY & SECURITY DETAILS**

### **Data Collection**
The app collects:
- User profile information (name, email)
- Assessment responses (anonymous analysis only)
- Community posts (public by user choice)
- Device token for notifications

### **Data Usage**
- Used exclusively for app functionality
- Never sold to third parties
- Compliant with GDPR and CCPA
- Encrypted in transit and at rest

### **User Controls**
- Users can delete account
- Users can request data export
- Users can opt-out of notifications
- Users can control privacy settings

### **Privacy Policy**
Location: https://newomen.me/privacy  
Status: ✅ Live and accessible

---

## 📱 **DEVICE TESTING CHECKLIST**

### **iPhone Models (Test on at least one)**
- [ ] iPhone 15
- [ ] iPhone 14 Pro
- [ ] iPhone 13
- [ ] iPhone SE (3rd gen)

### **iPad Testing**
- [ ] iPad Air
- [ ] iPad Mini
- [ ] iPad Pro

### **iOS Versions**
- [x] iOS 14.0+ supported

### **Feature Testing**
- [ ] Authentication
- [ ] Community feed loading
- [ ] Post creation
- [ ] Assessment taking
- [ ] Push notifications
- [ ] Deep linking
- [ ] Offline functionality

---

## 🛠 **TROUBLESHOOTING**

### **Build Fails**

```bash
# Clear build cache
xcodebuild clean -workspace ios/App.xcworkspace -scheme App

# Update Pods
cd ios && pod install --repo-update && cd ..

# Rebuild
npm run build && npx cap sync ios
```

### **Signing Issues**

```bash
# Re-generate signing
# In Xcode:
# 1. Go to Xcode → Preferences → Accounts
# 2. Download manual profiles if needed
# 3. Update signing certificate
```

### **Push Notifications Not Working**

```bash
# Ensure in AppDelegate.swift:
# 1. setupPushNotifications() is called
# 2. UNUserNotificationCenter.current().delegate = self
# 3. registerForRemoteNotifications() is called
```

### **TestFlight Upload Fails**

```bash
# Common causes:
# 1. Invalid certificate/provisioning profile
# 2. Version/build number already used
# 3. App ID mismatch

# Solution: Reset in App Store Connect
# 1. Create new version (1.0.1)
# 2. New build (2)
# 3. Re-upload
```

---

## 📈 **POST-SUBMISSION**

### **After Approval**

1. **Monitor Reviews**
   - Check App Store for user reviews
   - Respond to feedback
   - Track ratings

2. **Analytics**
   - Monitor crashes via Xcode Organizer
   - Track performance metrics
   - Analyze user behavior

3. **Updates**
   - Plan next features
   - Address user feedback
   - Security updates as needed

### **Version Release Schedule**

- 🚀 Version 1.0: Launch
- 🔄 Version 1.1: Bug fixes & improvements (1-2 weeks)
- ✨ Version 1.2: New features (1 month)
- 📱 Version 2.0: Major update (3-4 months)

---

## ✅ **FINAL CHECKLIST BEFORE SUBMISSION**

- [ ] All permissions have descriptions
- [ ] Privacy policy is up to date
- [ ] App icons are correct (1024×1024)
- [ ] Screenshots for App Store prepared
- [ ] App description written
- [ ] Bundle ID is correct (com.newomen.app)
- [ ] Version number incremented
- [ ] Build number incremented
- [ ] Code is production-optimized
- [ ] All credentials in capacitor.config.ts
- [ ] Push notifications configured
- [ ] Background modes enabled
- [ ] TestFlight tested successfully
- [ ] No crashes or major bugs
- [ ] Performance is acceptable

---

## 🎉 **SUCCESS CRITERIA**

✅ **App is live on App Store**  
✅ **Users can download on iPhone/iPad**  
✅ **Push notifications working**  
✅ **All features functioning**  
✅ **Rating ≥ 4.0 stars**  
✅ **Daily active users growing**  

---

## 📞 **SUPPORT RESOURCES**

- [Apple App Store Connect](https://appstoreconnect.apple.com)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)

---

**For questions or issues, refer to the main README.md or contact the development team.**

