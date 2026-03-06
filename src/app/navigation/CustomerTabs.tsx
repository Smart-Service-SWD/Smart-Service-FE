import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../../features/customer/screens/HomeScreen";
import CreateRequestScreen from "../../features/customer/screens/CreateRequestScreen";
import MyRequestsScreen from "../../features/customer/screens/MyRequestsScreen";
import FeedbackScreen from "../../features/customer/screens/FeedbackScreen";
import ProfileScreen from "../../features/common/screens/ProfileScreen";
import type { CustomerTabParamList } from "./types";

const Tab = createBottomTabNavigator<CustomerTabParamList>();

export default function CustomerTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="CreateRequest"
        component={CreateRequestScreen}
        options={{ title: "New Request" }}
      />
      <Tab.Screen
        name="MyRequests"
        component={MyRequestsScreen}
        options={{ title: "My Requests" }}
      />
      <Tab.Screen name="Feedback" component={FeedbackScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
