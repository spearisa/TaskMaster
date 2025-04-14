# Task Manager Mobile App

This directory contains the React Native implementation of the Task Manager application for iOS and Android platforms.

## Project Structure

```
TaskManagerApp/
├── assets/                # App icons, images and other assets
├── src/
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── navigation/        # Navigation configuration
│   ├── screens/           # Screen components
│   ├── services/          # API services and data fetching
│   └── utils/             # Utility functions
├── App.tsx                # Main application component
└── package.json           # Project dependencies
```

## Key Features

- **Cross-Platform Compatibility**: Built with React Native to work on both iOS and Android devices
- **Shared Backend Integration**: Uses the same API endpoints as the web application
- **Offline Support**: Local data caching for offline access to tasks
- **Push Notifications**: Native notifications for task reminders and deadlines
- **User Authentication**: Secure login and account management
- **Task Management**: Create, update, and complete tasks
- **AI Assistant**: Integrated AI assistance for task optimization and delegation
- **Real-time Messaging**: Direct messaging between users with real-time updates
- **Calendar Integration**: View and manage tasks in a calendar view
- **User Profiles**: View and edit user profile with skills and interests

## Technology Stack

- **React Native**: Core framework for cross-platform mobile development
- **React Navigation**: Navigation library for React Native applications
- **TanStack Query**: Data fetching and state management
- **Axios**: HTTP client for API requests
- **Async Storage**: Local data persistence
- **Zod**: Runtime type validation
- **React Native Vector Icons**: Icon library for mobile UI

## Development Approach

The mobile application uses the same backend API as the web application, ensuring data consistency across platforms. The UI is optimized for mobile devices with touch-friendly controls and native navigation patterns.

### Key Design Considerations:

1. **Shared Logic**: Business logic and API integration are shared with the web application
2. **Native UX**: Interface designed specifically for mobile interaction patterns
3. **Offline First**: Data is cached locally for offline use and synchronized when online
4. **Performance Optimization**: Mobile-specific optimizations for smooth performance
5. **Battery Efficiency**: Minimized background processing to preserve battery life

## Getting Started

1. Install dependencies:
   ```
   cd TaskManagerApp
   npm install
   ```

2. Run on iOS:
   ```
   npm run ios
   ```

3. Run on Android:
   ```
   npm run android
   ```

## Deployment

### iOS Deployment
- Build the app using Xcode
- Submit to App Store Connect for review
- Publish to the App Store

### Android Deployment
- Generate a signed APK/AAB
- Submit to Google Play Console
- Publish to Google Play Store