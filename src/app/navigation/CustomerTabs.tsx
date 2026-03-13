import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../../features/customer/screens/HomeScreen";
import CreateRequestScreen from "../../features/customer/screens/CreateRequestScreen";
import MyRequestsScreen from "../../features/customer/screens/MyRequestsScreen";
import FeedbackScreen from "../../features/customer/screens/FeedbackScreen";
import ProfileScreen from "../../features/common/screens/ProfileScreen";
import type { CustomerTabParamList } from "./types";
import { getTabScreenOptions } from "./tabScreenOptions";

const Tab = createBottomTabNavigator<CustomerTabParamList>();

export default function CustomerTabs() {
  return (
    <Tab.Navigator screenOptions={getTabScreenOptions}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="CreateRequest" component={CreateRequestScreen} />
      <Tab.Screen name="MyRequests" component={MyRequestsScreen} />
      <Tab.Screen name="Feedback" component={FeedbackScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
