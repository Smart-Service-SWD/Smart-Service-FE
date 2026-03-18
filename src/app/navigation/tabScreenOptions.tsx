import { MaterialIcons } from "@expo/vector-icons";
import { initialWindowMetrics } from "react-native-safe-area-context";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import type { ComponentProps } from "react";
import { colors } from "../theme/colors";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

type TabName =
  | "Home"
  | "CreateRequest"
  | "MyRequests"
  | "Feedback"
  | "Profile"
  | "Assignments"
  | "RequestBoard"
  | "ReviewQueue"
  | "DispatchCenter"
  | "DispatchHistory"
  | "Dashboard"
  | "Users"
  | "Services"
  | "AdminFeedback";

interface TabMeta {
  label: string;
  icon: MaterialIconName;
}

const tabMeta: Record<TabName, TabMeta> = {
  Home: { label: "Trang chủ", icon: "home" },
  CreateRequest: { label: "Tạo mới", icon: "add-circle-outline" },
  MyRequests: { label: "Yêu cầu", icon: "description" },
  Feedback: { label: "Đánh giá", icon: "star-outline" },
  Profile: { label: "Tài khoản", icon: "person-outline" },
  Assignments: { label: "Phân công", icon: "build" },
  RequestBoard: { label: "Bảng việc", icon: "view-kanban" },
  ReviewQueue: { label: "Yêu cầu", icon: "inbox" },
  DispatchCenter: { label: "Điều phối", icon: "local-shipping" },
  DispatchHistory: { label: "Lịch sử", icon: "history" },
  Dashboard: { label: "Tổng quan", icon: "dashboard" },
  Users: { label: "Người dùng", icon: "groups" },
  Services: { label: "Dịch vụ", icon: "miscellaneous-services" },
  AdminFeedback: { label: "Feedback", icon: "star-outline" }
};

export const getTabScreenOptions = ({
  route
}: {
  route: { name: TabName };
}): BottomTabNavigationOptions => {
  const meta = tabMeta[route.name];

  const bottomInset = initialWindowMetrics?.insets?.bottom ?? 0;

  return {
    headerShown: false,
    tabBarHideOnKeyboard: true,

    tabBarActiveTintColor: colors.primaryStrong,
    tabBarInactiveTintColor: colors.textMuted,

    tabBarLabel: meta.label,

    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: "800",
      marginTop: 2
    },

    tabBarItemStyle: {
      borderRadius: 18,
      marginHorizontal: 4,
      marginVertical: 4
    },

    tabBarActiveBackgroundColor: colors.primarySoft,

    tabBarStyle: {
      height: 60 + Math.max(0, bottomInset - 8),
      paddingTop: 8,
      paddingBottom: Math.max(8, bottomInset),
      backgroundColor: colors.  tabBar,
      borderTopWidth: 0,
      borderRadius: 26,

      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 12
      },
      shadowOpacity: 1,
      shadowRadius: 24,

      elevation: 6
    },

    tabBarIcon: ({ focused, color }) => (
      <MaterialIcons
        name={meta.icon}
        size={focused ? 22 : 20}
        color={color}
      />
    )
  };
};