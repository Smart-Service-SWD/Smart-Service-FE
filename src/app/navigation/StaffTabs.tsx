import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import ReviewQueueScreen from "../../features/staff/screens/ReviewQueueScreen";
import DispatchCenterScreen from "../../features/staff/screens/DispatchCenterScreen";
import ActivityMonitorScreen from "../../features/staff/screens/ActivityMonitorScreen";
import ProfileScreen from "../../features/common/screens/ProfileScreen";
import type { StaffTabParamList } from "./types";

const Tab = createBottomTabNavigator<StaffTabParamList>();

export default function StaffTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="ReviewQueue"
        component={ReviewQueueScreen}
        options={{ title: "Review Queue" }}
      />
      <Tab.Screen
        name="DispatchCenter"
        component={DispatchCenterScreen}
        options={{ title: "Dispatch" }}
      />
      <Tab.Screen
        name="ActivityMonitor"
        component={ActivityMonitorScreen}
        options={{ title: "Activity" }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
