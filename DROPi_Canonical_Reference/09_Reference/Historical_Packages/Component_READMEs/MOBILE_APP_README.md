# DROPi Mobile Application

React Native mobile application for DROPi - Autonomous Drone Delivery Platform.

## Features

- Role-based dashboards (Customer, Merchant, Pilot, Operator, Admin)
- Real-time order tracking
- Delivery management
- Support chat system
- Push notifications
- Offline support
- Maps integration
- Payment processing
- Analytics dashboard
- User profile management

## Prerequisites

- Node.js 18+
- React Native CLI
- Xcode (for iOS)
- Android Studio (for Android)
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Install iOS pods
cd ios && pod install && cd ..

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Project Structure

```
src/
├── screens/
│   ├── auth/                    # Authentication screens
│   │   ├── LoginScreen.js
│   │   └── RegisterScreen.js
│   ├── dashboards/              # Role-specific dashboards
│   │   ├── CustomerDashboard.js
│   │   ├── MerchantDashboard.js
│   │   ├── PilotDashboard.js
│   │   ├── OperatorDashboard.js
│   │   └── AdminDashboard.js
│   ├── features/                # Feature screens
│   │   ├── OrdersScreen.js
│   │   ├── DeliveriesScreen.js
│   │   ├── SupportScreen.js
│   │   └── ProfileScreen.js
│   └── SplashScreen.js
├── components/                  # Reusable components
│   ├── Button.js
│   ├── Card.js
│   ├── Map.js
│   ├── OrderCard.js
│   └── ...
├── services/                    # API services
│   ├── api.js
│   ├── authService.js
│   ├── orderService.js
│   ├── deliveryService.js
│   └── supportService.js
├── store/                       # Redux store
│   ├── index.js
│   └── slices/
│       ├── authSlice.js
│       ├── ordersSlice.js
│       ├── deliveriesSlice.js
│       └── uiSlice.js
├── hooks/                       # Custom hooks
│   ├── useAuth.js
│   ├── useOrders.js
│   └── useDeliveries.js
├── utils/                       # Utility functions
│   ├── constants.js
│   ├── helpers.js
│   └── validators.js
├── types/                       # TypeScript types
│   ├── user.ts
│   ├── order.ts
│   └── delivery.ts
├── App.js                       # Main app component
└── index.js                     # Entry point
```

## Building for Production

### Android

```bash
# Build APK
npm run build:android

# Build AAB (for Google Play)
cd android && ./gradlew bundleRelease && cd ..

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### iOS

```bash
# Build for iOS
npm run build:ios

# Or use Xcode
open ios/DROPi.xcworkspace
# Select Product > Archive
```

## Deployment

### Google Play Store

1. Build AAB: `npm run build:android`
2. Sign APK/AAB with release key
3. Upload to Google Play Console
4. Fill in store listing details
5. Submit for review

### Apple App Store

1. Build for iOS: `npm run build:ios`
2. Archive in Xcode
3. Upload to App Store Connect
4. Fill in app information
5. Submit for review

## Configuration

### Environment Variables

Create `.env` file in project root:

```
REACT_APP_API_URL=https://api.dropi.com
REACT_APP_FIREBASE_CONFIG={"apiKey":"..."}
REACT_APP_GOOGLE_MAPS_KEY=your-key-here
REACT_APP_STRIPE_KEY=your-key-here
```

### API Configuration

Edit `src/services/api.js`:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
```

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

## Debugging

### React Native Debugger

```bash
# Install globally
npm install -g react-native-debugger

# Run debugger
react-native-debugger
```

### Chrome DevTools

```bash
# Open debugger in Chrome
# Press Cmd+D (iOS) or Cmd+M (Android)
# Select "Debug JS Remotely"
```

## Performance Optimization

- Use FlatList for long lists
- Memoize components with React.memo
- Optimize images and assets
- Use native modules for heavy computations
- Implement code splitting

## Troubleshooting

### Build Issues

```bash
# Clear cache
npm start -- --reset-cache

# Clean build
rm -rf node_modules && npm install
```

### Metro Bundler Issues

```bash
# Kill metro bundler
lsof -i :8081 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Restart
npm start
```

### iOS Pod Issues

```bash
# Update pods
cd ios && pod repo update && pod install && cd ..
```

## Documentation

- [React Native Docs](https://reactnative.dev)
- [Redux Docs](https://redux.js.org)
- [React Navigation Docs](https://reactnavigation.org)
- [Firebase Docs](https://firebase.google.com/docs)

## Support

For issues or questions, refer to:
- `/DROPI_CANONICAL/12_DOCUMENTATION/COMPLETE_GUIDE.md`
- `/DROPI_CANONICAL/12_DOCUMENTATION/TROUBLESHOOTING.md`

## License

MIT
