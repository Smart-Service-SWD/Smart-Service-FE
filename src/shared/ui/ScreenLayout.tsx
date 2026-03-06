import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../app/theme/colors";

interface ScreenLayoutProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export default function ScreenLayout({
  title,
  subtitle,
  right,
  children
}: ScreenLayoutProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12
  },
  headerText: {
    flex: 1
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2
  },
  right: {
    marginLeft: 12
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12
  }
});

