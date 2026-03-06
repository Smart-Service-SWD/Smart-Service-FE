import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AdminDashboardScreen from "../../features/admin/screens/AdminDashboardScreen";
import UserAdminScreen from "../../features/admin/screens/UserAdminScreen";
import ServiceAdminScreen from "../../features/admin/screens/ServiceAdminScreen";
import ProfileScreen from "../../features/common/screens/ProfileScreen";
import type { AdminTabParamList } from "./types";
import { getTabScreenOptions } from "./tabScreenOptions";

const Tab = createBottomTabNavigator<AdminTabParamList>();

export default function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={getTabScreenOptions}>
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Users" component={UserAdminScreen} />
      <Tab.Screen name="Services" component={ServiceAdminScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
