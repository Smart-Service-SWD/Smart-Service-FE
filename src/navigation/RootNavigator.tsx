import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useAuth } from '../context/AuthContext';

// Auth Screens
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Common Screens
import { HomeScreen } from '../screens/common/HomeScreen';
import { ProfileScreen } from '../screens/common/ProfileScreen';
import { ServiceDetailScreen } from '../screens/common/ServiceDetailScreen';
import { ServiceListScreen } from '../screens/common/ServiceListScreen';

// Customer Screens
import { AnalysisDetailScreen } from '../screens/AnalysisDetailScreen';
import { AnalysisResultScreen } from '../screens/AnalysisResultScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { CreateRequestScreen } from '../screens/CreateRequestScreen';
import { HistoryScreen } from '../screens/HistoryScreen';

// Staff Screens

// Agent Screens

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

// Home Stack Navigator (for service browsing)
const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      id="HomeStack"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Stack.Screen
        name="ServiceList"
        component={ServiceListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ServiceDetail"
        component={ServiceDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateRequest"
        component={CreateRequestScreen}
        options={{ 
          headerShown: true,
          title: 'Book Service',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
};

// Auth Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      id="AuthStack"
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
};

// Customer (Camera) Stack Navigator
const CameraStackNavigator = () => {
  return (
    <Stack.Navigator
      id="CameraStack"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="CameraMain"
        component={CameraScreen}
        options={{ title: 'Service Analysis' }}
      />
      <Stack.Screen
        name="AnalysisResult"
        component={AnalysisResultScreen}
        options={{ title: 'Result' }}
      />
      <Stack.Screen
        name="CreateRequest"
        component={CreateRequestScreen}
        options={{ title: 'Create Request' }}
      />
    </Stack.Navigator>
  );
};

const HistoryStackNavigator = () => {
  return (
    <Stack.Navigator
      id="HistoryStack"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="HistoryMain"
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
      <Stack.Screen
        name="AnalysisDetail"
        component={AnalysisDetailScreen}
        options={{ title: 'Details' }}
      />
      <Stack.Screen
        name="CreateRequest"
        component={CreateRequestScreen}
        options={{ title: 'Create Request' }}
      />
    </Stack.Navigator>
  );
};

// Profile Stack Navigator (includes Login/Register)
const ProfileStackNavigator = () => {
  const { user, token } = useAuth();
  const isAuthenticated = !!user && !!token;
  
  return (
    <Stack.Navigator
      id="ProfileStack"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      {isAuthenticated ? (
        <Stack.Screen
          name="ProfileMain"
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
      ) : (
        <>
          <Stack.Screen
            name="ProfileLogin"
            component={LoginScreen}
            options={{ title: 'Login' }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Sign Up' }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ title: 'Reset Password' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

// App Navigator (Always available - no login required to browse)
const AppNavigator = () => {
  return (
    <Tab.Navigator
      id="AppTabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Camera') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Camera"
        component={CameraStackNavigator}
        options={{ title: 'Analyze' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryStackNavigator}
        options={{ title: 'History' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ title: 'Account' }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const { loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
};
