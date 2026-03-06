import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StaffRequestDetailScreen } from '../../../pages/staff/StaffRequestDetailScreen';
import { StaffTabNavigator } from '../tabs/StaffTabNavigator';

const Stack = createNativeStackNavigator();

export const StaffStackNavigator = () => {
  return (
    <Stack.Navigator
      id="StaffStack"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="StaffTabs" component={StaffTabNavigator} />
      <Stack.Screen
        name="StaffRequestDetail"
        component={StaffRequestDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};


