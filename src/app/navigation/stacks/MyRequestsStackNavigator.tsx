import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AIReviewScreen } from '../../../pages/user/AIReviewScreen';
import { FeedbackScreen } from '../../../pages/user/FeedbackPage';
import { MyRequestsScreen } from '../../../pages/user/MyRequestsScreen';
import { RequestDetailScreen } from '../../../pages/user/RequestDetailScreen';
import { RequestPage } from '../../../pages/user/RequestPage';

const Stack = createNativeStackNavigator();

export const MyRequestsStackNavigator = () => {
  return (
    <Stack.Navigator
      id="MyRequestsStack"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MyRequestsMain" component={MyRequestsScreen} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="NewRequest" component={RequestPage} />
      <Stack.Screen name="AIReview" component={AIReviewScreen} />
    </Stack.Navigator>
  );
};


