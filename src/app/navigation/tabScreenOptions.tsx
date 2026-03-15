import { Text } from "react-native";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { initialWindowMetrics } from "react-native-safe-area-context";
import { colors } from "../theme/colors";

interface TabMeta {
  label: string;
  icon: string;
}

const tabMeta: Record<string, TabMeta> = {
  Home: { label: "Trang chủ", icon: "🏠" },
  CreateRequest: { label: "Tạo mới", icon: "➕" },
  MyRequests: { label: "Yêu cầu", icon: "📄" },
  Feedback: { label: "Đánh giá", icon: "⭐" },
  Profile: { label: "Tài khoản", icon: "👤" },
  Assignments: { label: "Phân công", icon: "🧰" },
  RequestBoard: { label: "Bảng việc", icon: "📋" },
  ReviewQueue: { label: "Yêu cầu", icon: "📥" },
  DispatchCenter: { label: "Điều phối", icon: "🚚" },
  DispatchHistory: { label: "Lịch sử", icon: "🧾" },
  Dashboard: { label: "Tổng quan", icon: "📊" },
  Users: { label: "Người dùng", icon: "👥" },
  Services: { label: "Dịch vụ", icon: "🛠️" },
  AdminFeedback: { label: "Feedback", icon: "⭐" }
};

export const getTabScreenOptions = ({
  route
}: {
  route: { name: string };
}): BottomTabNavigationOptions => {
  const meta = tabMeta[route.name] ?? {
    label: route.name,
    icon: "•"
  };

  const bottomInset = initialWindowMetrics?.insets?.bottom ?? 0;

  return {
    headerShown: false,
    tabBarHideOnKeyboard: true,
    tabBarActiveTintColor: colors.primaryStrong,
    tabBarInactiveTintColor: colors.textMuted,
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
      backgroundColor: colors.surface,
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
    tabBarIcon: ({ focused }) => (
      <Text
        style={{
          fontSize: focused ? 18 : 17,
          opacity: focused ? 1 : 0.72
        }}
      >
        {meta.icon}
      </Text>
    ),
    tabBarLabel: meta.label
  };
};
