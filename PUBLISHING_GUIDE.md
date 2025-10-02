# Complete App Publishing Guide

## Prerequisites Setup

### 1. Apple Developer Account
- Sign up at [developer.apple.com](https://developer.apple.com)
- Pay $99/year fee
- Complete enrollment process
- Get your Team ID and Apple ID

### 2. Google Play Console Account
- Sign up at [play.google.com/console](https://play.google.com/console)
- Pay $25 one-time fee
- Complete account verification
- Set up your developer profile

### 3. Expo Account
- Sign up at [expo.dev](https://expo.dev)
- Install EAS CLI: `npm install -g @expo/eas-cli`
- Login: `eas login`

## Step-by-Step Publishing Process

### Phase 1: Prepare Your App

#### 1.1 Update App Configuration
```bash
# Update app.json with your details
# Replace placeholder values:
# - "your-expo-username" with your actual Expo username
# - "com.yourcompany.myjournal" with your unique bundle identifier
# - "Your Name" with your actual name
```

#### 1.2 Create Required Assets
- Follow the `STORE_ASSETS_GUIDE.md` to create all required assets
- Ensure all icons and screenshots meet store requirements
- Create privacy policy and terms of service

#### 1.3 Test Your App Thoroughly
```bash
# Test on physical devices
npm run android
npm run ios

# Test all features:
# - Journal creation and editing
# - Photo/media upload
# - Mood tracking
# - Location services
# - Authentication
# - Data persistence
```

### Phase 2: Build Production Versions

#### 2.1 Configure EAS Build
```bash
# Initialize EAS (if not already done)
eas build:configure

# Update eas.json with your credentials:
# - Apple ID
# - App Store Connect App ID
# - Apple Team ID
# - Google Play Service Account path
```

#### 2.2 Build for iOS
```bash
# Build iOS app
npm run build:ios

# Or use EAS CLI directly
eas build --platform ios --profile production
```

#### 2.3 Build for Android
```bash
# Build Android app
npm run build:android

# Or use EAS CLI directly
eas build --platform android --profile production
```

### Phase 3: App Store (iOS) Publishing

#### 3.1 App Store Connect Setup
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in app information:
   - Platform: iOS
   - Name: "MyJournal"
   - Bundle ID: "com.yourcompany.myjournal"
   - SKU: Unique identifier (e.g., "myjournal2024")
   - User Access: Full Access

#### 3.2 App Information
1. **App Information Tab**:
   - App Name: "MyJournal"
   - Subtitle: "Personal Journal & Mood Tracker"
   - Keywords: "journal,diary,mood tracking,personal,reflection"
   - Description: Write compelling description
   - Support URL: Your website or support page
   - Marketing URL: Your app's marketing page

2. **Pricing and Availability**:
   - Price: Free or set your price
   - Availability: Select countries
   - Release Type: Manual or Automatic

#### 3.3 App Review Information
- Contact Information
- Demo Account (if required)
- Notes for Review (explain app functionality)

#### 3.4 Version Information
1. **What's New in This Version**:
   - Write release notes
   - Highlight new features

2. **App Review Information**:
   - Contact Information
   - Demo Account credentials
   - Notes for Review

#### 3.5 Screenshots and App Preview
- Upload screenshots for all required sizes
- Add app preview video (optional but recommended)
- Ensure screenshots show key features

#### 3.6 Submit for Review
1. Complete all required information
2. Click "Save" then "Submit for Review"
3. Wait for Apple's review (typically 1-7 days)
4. Address any issues if app is rejected

### Phase 4: Google Play Store Publishing

#### 4.1 Google Play Console Setup
1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in app information:
   - App name: "MyJournal"
   - Default language: English
   - App or game: App
   - Free or paid: Free or Paid

#### 4.2 Store Listing
1. **App Details**:
   - Short description: Brief app description (80 chars max)
   - Full description: Detailed description (4000 chars max)
   - Graphics: Upload feature graphic (1024x500px)

2. **App Access**:
   - Choose release type (Production, Internal testing, etc.)

#### 4.3 Content Rating
1. Complete content rating questionnaire
2. Answer questions about app content
3. Get your content rating

#### 4.4 App Content
1. **Privacy Policy**: Upload your privacy policy
2. **App Category**: Select appropriate category
3. **Tags**: Add relevant tags for discoverability

#### 4.5 Store Listing Assets
1. **Screenshots**: Upload for phone and tablet
2. **Feature Graphic**: 1024x500px promotional image
3. **App Video**: Upload promotional video (optional)

#### 4.6 Release Management
1. **Production Track**:
   - Upload your APK/AAB file
   - Add release notes
   - Set rollout percentage (start with 10%)

2. **Review Process**:
   - Submit for review
   - Wait for Google's review (typically 1-3 days)
   - Address any issues if app is rejected

### Phase 5: Post-Publishing

#### 5.1 Monitor Your App
- Track downloads and ratings
- Monitor crash reports
- Respond to user reviews
- Analyze app performance

#### 5.2 Update Your App
```bash
# For updates, increment version numbers:
# - app.json: "version": "1.0.1"
# - iOS: "buildNumber": "2"
# - Android: "versionCode": 2

# Build new versions
npm run build:all

# Submit updates
npm run submit:ios
npm run submit:android
```

#### 5.3 Marketing and Promotion
- Optimize app store listings
- Use App Store Optimization (ASO)
- Promote on social media
- Consider paid advertising

## Common Issues and Solutions

### iOS Rejections
- **Missing Privacy Policy**: Ensure privacy policy is accessible
- **Incomplete App**: Make sure all features work properly
- **Metadata Issues**: Ensure app description matches functionality
- **Guideline Violations**: Review Apple's App Store Guidelines

### Android Rejections
- **Content Rating**: Complete content rating questionnaire
- **Privacy Policy**: Upload privacy policy
- **App Bundle**: Use Android App Bundle (AAB) format
- **Target API Level**: Ensure app targets recent API level

### Build Issues
- **EAS Build Failures**: Check build logs and fix issues
- **Certificate Problems**: Ensure proper certificates are configured
- **Dependency Issues**: Update dependencies and fix conflicts

## Important Notes

1. **Bundle Identifiers**: Must be unique across all apps
2. **Version Numbers**: Must increment with each update
3. **Review Process**: Can take 1-7 days for iOS, 1-3 days for Android
4. **Rejections**: Common for first-time submissions, address issues and resubmit
5. **Compliance**: Ensure your app complies with all store guidelines
6. **Testing**: Always test thoroughly before submission

## Resources

- [Apple App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Developer Program Policies](https://play.google.com/about/developer-content-policy/)
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
