import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { createTabScreenOptions } from '../options/tabScreenOptions';
import { HomeStackNavigator } from '../stacks/HomeStackNavigator';
import { MyRequestsStackNavigator } from '../stacks/MyRequestsStackNavigator';
import { NewRequestStackNavigator } from '../stacks/NewRequestStackNavigator';
import { ProfileStackNavigator } from '../stacks/ProfileStackNavigator';

const Tab = createBottomTabNavigator();

const resolveCustomerTabIcon = (routeName: string, focused: boolean) => {
  if (routeName === 'Home') {
    return focused ? 'home' : 'home-outline';
  }
  if (routeName === 'NewRequest') {
    return focused ? 'add-circle' : 'add-circle-outline';
  }
  if (routeName === 'MyRequests') {
    return focused ? 'clipboard' : 'clipboard-outline';
  }
  if (routeName === 'Profile') {
    return focused ? 'person' : 'person-outline';
  }
  return focused ? 'ellipse' : 'ellipse-outline';
};

export const CustomerTabNavigator = () => {
  return (
    <Tab.Navigator
      id="AppTabs"
      screenOptions={createTabScreenOptions({
        activeTintColor: '#007AFF',
        resolveIcon: resolveCustomerTabIcon,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ title: 'Trang chủ' }}
      />
      <Tab.Screen
        name="NewRequest"
        component={NewRequestStackNavigator}
        options={{ title: 'Tạo yêu cầu' }}
      />
      <Tab.Screen
        name="MyRequests"
        component={MyRequestsStackNavigator}
        options={{ title: 'Yêu cầu' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ title: 'Tài khoản' }}
      />
    </Tab.Navigator>
  );
};

