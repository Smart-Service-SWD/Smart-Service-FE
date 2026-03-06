import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { AdminProfileScreen } from '../../../pages/admin/AdminProfileScreen';
import { ReportsScreen } from '../../../pages/admin/ReportsScreen';
import { ServiceManagementScreen } from '../../../pages/admin/ServiceManagementScreen';
import { UserManagementScreen } from '../../../pages/admin/UserManagementScreen';
import { createTabScreenOptions } from '../options/tabScreenOptions';
import { AdminDashboardStackNavigator } from '../stacks/AdminDashboardStackNavigator';

const Tab = createBottomTabNavigator();

const resolveAdminTabIcon = (routeName: string, focused: boolean) => {
  if (routeName === 'AdminDashboard') {
    return focused ? 'analytics' : 'analytics-outline';
  }
  if (routeName === 'UserManagement') {
    return focused ? 'people' : 'people-outline';
  }
  if (routeName === 'ServiceManagement') {
    return focused ? 'construct' : 'construct-outline';
  }
  if (routeName === 'Reports') {
    return focused ? 'bar-chart' : 'bar-chart-outline';
  }
  if (routeName === 'AdminProfile') {
    return focused ? 'person' : 'person-outline';
  }
  return focused ? 'ellipse' : 'ellipse-outline';
};

export const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      id="AdminTabs"
      screenOptions={createTabScreenOptions({
        activeTintColor: '#007AFF',
        resolveIcon: resolveAdminTabIcon,
      })}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardStackNavigator}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="UserManagement"
        component={UserManagementScreen}
        options={{ title: 'Người dùng' }}
      />
      <Tab.Screen
        name="ServiceManagement"
        component={ServiceManagementScreen}
        options={{ title: 'Dịch vụ' }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: 'Báo cáo' }}
      />
      <Tab.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};


