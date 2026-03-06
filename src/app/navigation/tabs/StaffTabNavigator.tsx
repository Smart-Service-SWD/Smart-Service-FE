import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StaffDashboardPage } from '../../../pages/staff/dashboard/StaffDashboardPage';
import { PendingEvaluationsPage } from '../../../pages/staff/pending-evaluations/PendingEvaluationsPage';
import { StaffProfilePage } from '../../../pages/staff/profile/StaffProfilePage';
import { ReEvaluationsScreen } from '../../../pages/staff/ReEvaluationsScreen';
import { createTabScreenOptions } from '../options/tabScreenOptions';

const Tab = createBottomTabNavigator();

const resolveStaffTabIcon = (routeName: string, focused: boolean) => {
  if (routeName === 'StaffDashboard') {
    return focused ? 'stats-chart' : 'stats-chart-outline';
  }
  if (routeName === 'PendingEvaluations') {
    return focused ? 'checkmark-circle' : 'checkmark-circle-outline';
  }
  if (routeName === 'ReEvaluations') {
    return focused ? 'refresh-circle' : 'refresh-circle-outline';
  }
  if (routeName === 'StaffProfile') {
    return focused ? 'person' : 'person-outline';
  }
  return focused ? 'ellipse' : 'ellipse-outline';
};

export const StaffTabNavigator = () => {
  return (
    <Tab.Navigator
      id="StaffTabs"
      screenOptions={createTabScreenOptions({
        activeTintColor: '#007AFF',
        resolveIcon: resolveStaffTabIcon,
      })}
    >
      <Tab.Screen
        name="StaffDashboard"
        component={StaffDashboardPage}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="PendingEvaluations"
        component={PendingEvaluationsPage}
        options={{ title: 'Confirm AI' }}
      />
      <Tab.Screen
        name="ReEvaluations"
        component={ReEvaluationsScreen}
        options={{ title: 'Re-evaluate' }}
      />
      <Tab.Screen
        name="StaffProfile"
        component={StaffProfilePage}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};


