import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AdminDashboardScreen } from '../../../pages/admin/AdminDashboardScreen';
import { AgentManagementScreen } from '../../../pages/admin/AgentManagementScreen';
import { RequestManagementScreen } from '../../../pages/admin/RequestManagementScreen';
import { StaffManagementScreen } from '../../../pages/admin/StaffManagementScreen';

const Stack = createNativeStackNavigator();

export const AdminDashboardStackNavigator = () => {
  return (
    <Stack.Navigator
      id="AdminDashboardStack"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AdminDashboardMain" component={AdminDashboardScreen} />
      <Stack.Screen
        name="StaffManagement"
        component={StaffManagementScreen}
        options={{
          headerShown: true,
          title: 'Quản lý nhân viên',
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="AgentManagement"
        component={AgentManagementScreen}
        options={{
          headerShown: true,
          title: 'Quản lý thợ',
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="RequestManagement"
        component={RequestManagementScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};


