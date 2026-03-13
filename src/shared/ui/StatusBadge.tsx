import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../app/theme/colors";

type BadgeTone = "primary" | "neutral" | "success" | "danger" | "warning";

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
}

const badgeTones: Record<BadgeTone, { backgroundColor: string; color: string }> = {
  primary: {
    backgroundColor: colors.primarySoft,
    color: colors.primaryStrong
  },
  neutral: {
    backgroundColor: colors.surfaceMuted,
    color: colors.textSoft
  },
  success: {
    backgroundColor: colors.successSoft,
    color: colors.success
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    color: colors.danger
  },
  warning: {
    backgroundColor: colors.warningSoft,
    color: colors.warning
  }
};

export default function StatusBadge({
  label,
  tone = "neutral"
}: StatusBadgeProps) {
  const currentTone = badgeTones[tone];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: currentTone.backgroundColor
        }
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: currentTone.color
          }
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start"
  },
  label: {
    fontSize: 11,
    fontWeight: "800"
  }
});
