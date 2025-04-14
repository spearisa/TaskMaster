# Building the Task Manager Mobile App

This guide explains how to build and generate APK (Android) and IPA (iOS) files for the Task Manager mobile app.

## Prerequisites

1. **Expo Account**: Create an account at [expo.dev](https://expo.dev)
2. **Developer Accounts**:
   - For Android: Google Play Developer account ($25 one-time fee)
   - For iOS: Apple Developer account ($99/year)
3. **EAS CLI**: Install with `npm install -g eas-cli`
4. **Required Tools**:
   - For iOS: macOS with Xcode installed
   - For Android: Android Studio (recommended)

## Setup

1. **Login to Expo**:
   ```
   npx eas login
   ```

2. **Configure your project**:
   ```
   npx eas build:configure
   ```

3. **Update app.json**:
   - Update the package/bundle identifiers
   - Set your app version and build numbers
   - Configure any needed permissions

## Building for Android (APK)

To build an APK file that can be installed directly on Android devices:

```bash
npm run build:android
# or
npx eas build -p android --profile androidApk
```

The EAS build service will:
1. Queue your build
2. Compile your app
3. Generate the APK file
4. Provide a download link when complete

## Building for iOS (IPA)

To build an IPA file for iOS:

```bash
npm run build:ios
# or
npx eas build -p ios --profile production
```

Note: Building for iOS requires an Apple Developer account and provisioning profiles. The EAS CLI will guide you through this process.

## Building for Testing

To create a build for internal testing:

```bash
npm run build:preview
# or
npx eas build --profile preview
```

## iOS Simulator Build

To build for the iOS simulator (developers only):

```bash
npm run build:simulator
# or
npx eas build -p ios --profile simulator
```

## Downloading Your Builds

After the build completes:

1. You'll receive an email with download links
2. Or visit the [Expo Dashboard](https://expo.dev) and navigate to your project
3. You can also download your builds directly through the EAS CLI:
   ```
   npx eas build:list
   # Find the build ID, then:
   npx eas build:download --id [BUILD_ID]
   ```

## Publishing to App Stores

### Google Play Store

```bash
npm run submit:android
# or
npx eas submit -p android
```

### Apple App Store

```bash
npm run submit:ios
# or
npx eas submit -p ios
```

## Troubleshooting

- **Build Fails**: Check the build logs for specific errors
- **iOS Provisioning Issues**: Use `npx eas credentials` to manage iOS credentials
- **Android Keystore Issues**: EAS manages your keystore by default, but you can configure your own
- **App Size Too Large**: Consider using app bundles and dynamic imports

## Resources

- [Expo EAS Documentation](https://docs.expo.dev/build/introduction/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com/)