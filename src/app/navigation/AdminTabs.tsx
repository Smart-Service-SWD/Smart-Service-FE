import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AdminDashboardScreen from "../../features/admin/screens/AdminDashboardScreen";
import UserAdminScreen from "../../features/admin/screens/UserAdminScreen";
import ServiceAdminScreen from "../../features/admin/screens/ServiceAdminScreen";
import ProfileScreen from "../../features/common/screens/ProfileScreen";
import type { AdminTabParamList } from "./types";

const Tab = createBottomTabNavigator<AdminTabParamList>();

export default function AdminTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{ title: "Dashboard" }}
      />
      <Tab.Screen name="Users" component={UserAdminScreen} />
      <Tab.Screen name="Services" component={ServiceAdminScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
