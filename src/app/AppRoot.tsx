import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../features/auth/AuthContext";
import AuthNavigator from "./navigation/AuthNavigator";
import RoleNavigator from "./navigation/RoleNavigator";
import { colors } from "./theme/colors";
import BrandLogo from "../shared/ui/BrandLogo";

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
    notification: colors.danger
  }
};

function Router() {
  const { session, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.center}>
        <BrandLogo size={88} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.centerTitle}>Smart Service</Text>
        <Text style={styles.centerText}>Đang khởi tạo phiên đăng nhập...</Text>
      </View>
    );
  }

  if (!session) {
    return <AuthNavigator />;
  }

  return <RoleNavigator role={session.role} />;
}

export default function AppRoot() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer theme={navTheme}>
            <Router />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  centerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700"
  },
  centerText: {
    color: colors.textMuted
  }
});
