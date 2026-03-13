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
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <View style={styles.orbPrimary} />
        <View style={styles.orbSecondary} />
      </View>

      <View style={styles.headerShell}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              {showLogo ? (
                <View style={styles.logoWrap}>
                  <BrandLogo size={48} />
                </View>
              ) : null}
              <View style={styles.titleBlock}>
                <Text style={styles.eyebrow}>Smart Service</Text>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
            </View>
          </View>
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
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
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject
  },
  orbPrimary: {
    position: "absolute",
    top: -110,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    opacity: 0.8
  },
  orbSecondary: {
    position: "absolute",
    top: 60,
    left: -110,
    width: 210,
    height: 210,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    opacity: 0.8
  },
  headerShell: {
    paddingHorizontal: 16,
    paddingTop: 8
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.92)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 12
    },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 3
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
    width: 52,
    height: 52,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.surfaceRaised
  },
  titleBlock: {
    flex: 1,
    gap: 2
  },
  eyebrow: {
    color: colors.primaryStrong,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 20
  },
  right: {
    marginLeft: 8,
    alignSelf: "stretch",
    justifyContent: "center"
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 112,
    gap: 14
  }
});
