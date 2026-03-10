import { Text } from "react-native";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
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

  return {
    headerShown: false,
    tabBarHideOnKeyboard: true,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: "700"
    },
    tabBarStyle: {
      height: 68,
      paddingTop: 8,
      paddingBottom: 8,
      backgroundColor: colors.surface,
      borderTopColor: colors.border
    },
    tabBarIcon: ({ focused }) => (
      <Text
        style={{
          fontSize: focused ? 18 : 17,
          opacity: focused ? 1 : 0.7
        }}
      >
        {meta.icon}
      </Text>
    ),
    tabBarLabel: meta.label
  };
};
