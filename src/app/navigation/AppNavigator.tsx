import React from 'react';
import { useAuth } from '../providers/auth/AuthContext';
import { AgentTabNavigator } from './tabs/AgentTabNavigator';
import { AdminTabNavigator } from './tabs/AdminTabNavigator';
import { CustomerTabNavigator } from './tabs/CustomerTabNavigator';
import { StaffStackNavigator } from './stacks/StaffStackNavigator';

export const AppNavigator = () => {
  const { user } = useAuth();

  if (user?.role === 'ADMIN') {
    return <AdminTabNavigator />;
  }

  if (user?.role === 'STAFF') {
    return <StaffStackNavigator />;
  }

  if (user?.role === 'AGENT') {
    return <AgentTabNavigator />;
  }

  return <CustomerTabNavigator />;
};
