import * as ImagePicker from 'expo-image-picker';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from './src/shared/ui/toast';
import { AnalysisProvider } from './src/app/providers/analysis/AnalysisContext';
import { AuthProvider } from './src/app/providers/auth/AuthContext';
import { RootNavigator } from './src/app/navigation/RootNavigator';

// Keep splash screen visible while we're preparing the app
SplashScreen.preventAutoHideAsync().catch(() => { });

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
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ToastProvider>
          <AuthProvider>
            <AnalysisProvider>
              <StatusBar barStyle="light-content" />
              <RootNavigator />
            </AnalysisProvider>
          </AuthProvider>
        </ToastProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

