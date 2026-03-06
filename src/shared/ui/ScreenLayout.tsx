import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../app/theme/colors";
import BrandLogo from "./BrandLogo";

interface ScreenLayoutProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  showLogo?: boolean;
}

export default function ScreenLayout({
  title,
  subtitle,
  right,
  showLogo = true,
  children
}: ScreenLayoutProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            {showLogo ? (
              <View style={styles.logoWrap}>
                <BrandLogo size={44} />
              </View>
            ) : null}
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
          </View>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerText: {
    flex: 1
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: "hidden"
  },
  titleBlock: {
    flex: 1
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 20
  },
  right: {
    marginLeft: 12
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 28,
    gap: 14
  }
});
