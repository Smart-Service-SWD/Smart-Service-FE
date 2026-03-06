import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AgentDashboardScreen } from '../../../pages/agent/AgentDashboardScreen';
import { AvailableJobsScreen } from '../../../pages/agent/AvailableJobsScreen';
import { JobTabNavigator } from '../../../pages/agent/JobTabNavigator';

const Stack = createNativeStackNavigator();

export const AgentHomeStackNavigator = () => {
  return (
    <Stack.Navigator
      id="AgentHomeStack"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="AgentDashboardMain" component={AgentDashboardScreen} />
      <Stack.Screen name="AvailableJobs" component={AvailableJobsScreen} />
      <Stack.Screen name="JobTabs" component={JobTabNavigator} />
    </Stack.Navigator>
  );
};


