import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../app/theme/colors";

type MetricTone = "default" | "primary" | "success" | "warning";

interface MetricTileProps {
  label: string;
  value: string | number;
  helper?: string;
  tone?: MetricTone;
}

const toneMap: Record<MetricTone, { backgroundColor: string; borderColor: string }> = {
  default: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border
  },
  primary: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft
  },
  success: {
    backgroundColor: colors.successSoft,
    borderColor: "#bbf7d0"
  },
  warning: {
    backgroundColor: colors.warningSoft,
    borderColor: "#fde68a"
  }
};

export default function MetricTile({
  label,
  value,
  helper,
  tone = "default"
}: MetricTileProps) {
  const currentTone = toneMap[tone];

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: currentTone.backgroundColor,
          borderColor: currentTone.borderColor
        }
      ]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    minWidth: 140,
    flexGrow: 1,
    flexBasis: "48%",
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 6
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  value: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800"
  },
  helper: {
    color: colors.textSoft,
    fontSize: 12,
    lineHeight: 17
  }
});
