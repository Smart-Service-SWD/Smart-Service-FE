import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { AgentProfileScreen } from '../../../pages/agent/AgentProfileScreen';
import { createTabScreenOptions } from '../options/tabScreenOptions';
import { AgentHomeStackNavigator } from '../stacks/AgentHomeStackNavigator';

const Tab = createBottomTabNavigator();

const resolveAgentTabIcon = (routeName: string, focused: boolean) => {
  if (routeName === 'AgentHome') {
    return focused ? 'home' : 'home-outline';
  }
  if (routeName === 'AgentProfile') {
    return focused ? 'person' : 'person-outline';
  }
  return focused ? 'ellipse' : 'ellipse-outline';
};

export const AgentTabNavigator = () => {
  return (
    <Tab.Navigator
      id="AgentTabs"
      screenOptions={createTabScreenOptions({
        activeTintColor: '#34C759',
        resolveIcon: resolveAgentTabIcon,
      })}
    >
      <Tab.Screen
        name="AgentHome"
        component={AgentHomeStackNavigator}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="AgentProfile"
        component={AgentProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};


