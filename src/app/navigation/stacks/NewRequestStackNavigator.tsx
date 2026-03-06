import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AIReviewScreen } from '../../../pages/user/AIReviewScreen';
import { FeedbackScreen } from '../../../pages/user/FeedbackPage';
import { RequestDetailScreen } from '../../../pages/user/RequestDetailScreen';
import { RequestPage } from '../../../pages/user/RequestPage';

const Stack = createNativeStackNavigator();

export const NewRequestStackNavigator = () => {
  return (
    <Stack.Navigator
      id="NewRequestStack"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="NewRequestMain" component={RequestPage} />
      <Stack.Screen name="AIReview" component={AIReviewScreen} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
    </Stack.Navigator>
  );
};


