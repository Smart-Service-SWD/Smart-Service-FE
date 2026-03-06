import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useAuth } from '../../providers/auth/AuthContext';
import { AdminProfileScreen } from '../../../pages/admin/AdminProfileScreen';
import { AgentProfileScreen } from '../../../pages/agent/AgentProfileScreen';
import { ForgotPasswordScreen } from '../../../pages/auth/ForgotPasswordScreen';
import { LoginScreen } from '../../../pages/auth/LoginScreen';
import { RegisterScreen } from '../../../pages/auth/RegisterScreen';
import { StaffProfilePage } from '../../../pages/staff/profile/StaffProfilePage';
import { UserProfileScreen } from '../../../pages/user/UserProfileScreen';

const Stack = createNativeStackNavigator();

const getProfileComponentByRole = (role?: string) => {
  switch (role) {
    case 'ADMIN':
      return AdminProfileScreen;
    case 'STAFF':
      return StaffProfilePage;
    case 'AGENT':
      return AgentProfileScreen;
    case 'CUSTOMER':
    default:
      return UserProfileScreen;
  }
};

export const ProfileStackNavigator = () => {
  const { user, token } = useAuth();
  const isAuthenticated = !!user && !!token;
  const ProfileComponent = getProfileComponentByRole(user?.role);

  return (
    <Stack.Navigator
      id="ProfileStack"
      screenOptions={{
        headerShown: false,
      }}
    >
      {isAuthenticated ? (
        <Stack.Screen
          name="ProfileMain"
          component={ProfileComponent}
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


