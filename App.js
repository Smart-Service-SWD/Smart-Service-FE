import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { AnalysisProvider } from './src/context/AnalysisContext';
import * as SplashScreen from 'expo-splash-screen';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

// Keep splash screen visible while we're preparing the app
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  useEffect(() => {
    async function prepare() {
      try {
        // Request camera and media library permissions
        const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (mediaLibraryStatus.status === 'granted') {
          console.log('Permissions granted');
        }
      } catch (e) {
        console.warn('Permission request failed:', e);
      } finally {
        // Hide the splash screen
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  return (
    <AuthProvider>
      <AnalysisProvider>
        <StatusBar barStyle="light-content" />
        <RootNavigator />
      </AnalysisProvider>
    </AuthProvider>
  );
}
