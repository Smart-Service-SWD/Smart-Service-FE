import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { GraphQLDemoScreen } from '../../../pages/common/GraphQLDemoScreen';
import { HomeScreen } from '../../../pages/common/HomeScreen';
import { ServiceDetailScreen } from '../../../pages/common/ServiceDetailScreen';
import { ServiceListScreen } from '../../../pages/common/ServiceListScreen';
import { AIReviewScreen } from '../../../pages/user/AIReviewScreen';
import { RequestDetailScreen } from '../../../pages/user/RequestDetailScreen';
import { RequestPage } from '../../../pages/user/RequestPage';

const Stack = createNativeStackNavigator();

export const HomeStackNavigator = () => {
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
        name="GraphQLDemo"
        component={GraphQLDemoScreen}
        options={{ title: 'GraphQL Demo', headerShown: true }}
      />
      <Stack.Screen
        name="CreateRequest"
        component={RequestPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AIReview"
        component={AIReviewScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RequestDetail"
        component={RequestDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};


