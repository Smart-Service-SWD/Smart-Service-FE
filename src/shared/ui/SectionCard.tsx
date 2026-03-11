import type { PropsWithChildren, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../app/theme/colors";

type SectionTone = "default" | "primary" | "success" | "danger" | "muted";

interface SectionCardProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
  tone?: SectionTone;
  right?: ReactNode;
}

const toneStyles: Record<SectionTone, { backgroundColor: string; borderColor: string }> = {
  default: {
    backgroundColor: colors.surface,
    borderColor: colors.border
  },
  primary: {
    backgroundColor: colors.primarySoftAlt,
    borderColor: colors.primarySoft
  },
  success: {
    backgroundColor: colors.successSoft,
    borderColor: "#bbf7d0"
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: "#fecaca"
  },
  muted: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border
  }
};

export default function SectionCard({
  title,
  subtitle,
  tone = "default",
  right,
  children
}: SectionCardProps) {
  const sectionTone = toneStyles[tone];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: sectionTone.backgroundColor,
          borderColor: sectionTone.borderColor
        }
      ]}
    >
      {title || subtitle || right ? (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 12,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 10
    },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 2
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  headerText: {
    flex: 1,
    gap: 4
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18
  },
  right: {
    maxWidth: "42%"
  }
});
