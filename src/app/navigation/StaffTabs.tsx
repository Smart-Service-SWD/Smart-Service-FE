import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import ReviewQueueScreen from "../../features/staff/screens/ReviewQueueScreen";
import DispatchCenterScreen from "../../features/staff/screens/DispatchCenterScreen";
import ActivityMonitorScreen from "../../features/staff/screens/ActivityMonitorScreen";
import ProfileScreen from "../../features/common/screens/ProfileScreen";
import type { StaffTabParamList } from "./types";
import { getTabScreenOptions } from "./tabScreenOptions";

const Tab = createBottomTabNavigator<StaffTabParamList>();

export default function StaffTabs() {
  return (
    <Tab.Navigator screenOptions={getTabScreenOptions}>
      <Tab.Screen name="ReviewQueue" component={ReviewQueueScreen} />
      <Tab.Screen name="DispatchCenter" component={DispatchCenterScreen} />
      <Tab.Screen name="ActivityMonitor" component={ActivityMonitorScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
