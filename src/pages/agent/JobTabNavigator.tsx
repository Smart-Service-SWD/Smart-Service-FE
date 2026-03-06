// JobTabNavigator.tsx - NO SWIPE (chỉ tap tab)
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { JobDetailsScreen } from './JobDetailsScreen';
import JobOverviewScreen from './JobOverviewScreen';

const Tab = createBottomTabNavigator();

interface JobTabNavigatorProps {
    route: any;
    navigation: any;
}

export const JobTabNavigator: React.FC<JobTabNavigatorProps> = ({ route, navigation }) => {
    const job = route?.params?.job || {};
    const serviceRequestId = job?.serviceRequestId || job?.id;

    return (
        <Tab.Navigator
            id="JobTabNavigator"
            initialRouteName="Overview"
            screenOptions={{
                tabBarStyle: { display: 'none' },
                headerShown: false,
                lazy: true,
            }}
        >
            <Tab.Screen
                name="Overview"
                component={JobOverviewScreen}
                initialParams={{ jobId: serviceRequestId, job }}
            />

            <Tab.Screen
                name="Details"
                component={JobDetailsScreen}
                initialParams={{ jobId: serviceRequestId, job }}
            />
        </Tab.Navigator>
    );
};

export default JobTabNavigator;

