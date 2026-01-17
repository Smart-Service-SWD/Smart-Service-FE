# Smart Service Mobile FE

React Native + Expo mobile application for Smart Service Backend integration with camera analysis and AI capabilities.

## Features

- 📷 **Camera Integration** - Capture images for analysis
- 🤖 **AI Analysis** - Send images to backend for AI processing
- 📝 **Service Requests** - Create service requests from analysis results
- 📜 **History** - View analysis history and details
- 🔄 **Real-time Updates** - Live feedback during processing

## Prerequisites

- Node.js 16+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (for testing)
- Backend running (Smart Service BE API)

## Installation

1. **Clone and navigate to project**
   ```bash
   cd SmartService-FE
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Backend URL**
   Edit `src/config/api.config.js`:
   ```javascript
   BASE_URL: 'http://YOUR_BACKEND_IP:5000/api'
   ```

## Running the App

### Option 1: Expo Go (Recommended for Development)

1. **Start the Expo server**
   ```bash
   npm start
   ```

2. **Scan the QR code** with:
   - **Android**: Expo Go app
   - **iOS**: Camera app (iOS 11+) or Expo Go app

### Option 2: Android Studio Emulator

```bash
npm run android
```

### Option 3: Web (Limited functionality)

```bash
npm run web
```

## Project Structure

```
src/
├── config/           # Configuration files (API endpoints)
├── navigation/       # Navigation structure (Bottom tabs + Stack)
├── screens/          # Screen components
│   ├── CameraScreen.js           # Camera capture
│   ├── HistoryScreen.js          # Analysis history
│   ├── AnalysisDetailScreen.js   # Detail view
│   ├── AnalysisResultScreen.js   # Result display
│   └── CreateRequestScreen.js    # Create request form
├── services/         # API services
│   ├── apiClient.js          # Axios HTTP client
│   └── analysisService.js    # Analysis API calls
├── context/          # React Context (State management)
│   └── AnalysisContext.js    # Analysis state
├── utils/            # Utility functions
│   └── permissions.js        # Camera & photo permissions
└── components/       # Reusable components (empty, add as needed)
```

## API Endpoints Used

The app communicates with these BE endpoints:

```
POST   /api/ServiceAnalysis/analyze       - Send image for analysis
GET    /api/ServiceAnalysis/history       - Get analysis history
GET    /api/ServiceAnalysis/:id           - Get analysis details
POST   /api/ServiceRequest/create         - Create service request
GET    /api/ServiceRequest/list           - Get service requests
```

## Key Dependencies

- **expo-camera** - Camera functionality
- **expo-image-picker** - Photo library access
- **@react-navigation** - Navigation
- **axios** - HTTP client
- **expo-permissions** - Permission handling

## Configuration

### API Configuration (`src/config/api.config.js`)

Change `BASE_URL` to match your backend:

```javascript
// For local development with emulator
BASE_URL: 'http://10.0.2.2:5000/api'  // Android emulator

// For physical device
BASE_URL: 'http://192.168.1.100:5000/api'  // Your machine IP

// For deployed backend
BASE_URL: 'https://api.example.com/api'
```

## Usage Flow

1. **Camera Tab**: 
   - Launch camera
   - Capture photo
   - App sends to BE for analysis
   - View results

2. **History Tab**:
   - View all past analyses
   - Tap to view details
   - Create service request from analysis

## Troubleshooting

### Camera not working
- Check permissions in `src/utils/permissions.js`
- Ensure `expo-camera` plugin is properly configured in `app.json`

### Backend connection error
- Verify backend is running
- Check IP address in `api.config.js`
- Ensure firewall allows connection

### Images not uploading
- Check file format (should be JPEG)
- Verify backend accepts multipart/form-data
- Check network connection

## Development Tips

- Use `expo-dev-client` for faster iteration
- Enable debug mode in browser: `exp://your-machine-ip:19000`
- Monitor network requests with Flipper or React Native Debugger

## Building for Production

### APK (Android)
```bash
expo build:android -t apk
```

### IPA (iOS)
```bash
expo build:ios
```

### Update EAS Config
Update `eas.json` with your project ID and credentials.

## License

MIT

## Support

For issues or questions, contact the development team.
