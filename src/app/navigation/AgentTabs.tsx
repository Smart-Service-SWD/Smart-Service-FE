import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AssignmentsScreen from "../../features/agent/screens/AssignmentsScreen";
import AgentRequestBoardScreen from "../../features/agent/screens/AgentRequestBoardScreen";
import ProfileScreen from "../../features/common/screens/ProfileScreen";
import type { AgentTabParamList } from "./types";
import { getTabScreenOptions } from "./tabScreenOptions";

const Tab = createBottomTabNavigator<AgentTabParamList>();

export default function AgentTabs() {
  return (
    <Tab.Navigator screenOptions={getTabScreenOptions}>
      <Tab.Screen name="Assignments" component={AssignmentsScreen} />
      <Tab.Screen name="RequestBoard" component={AgentRequestBoardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
