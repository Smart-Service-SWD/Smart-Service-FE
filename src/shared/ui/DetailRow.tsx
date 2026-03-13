import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../app/theme/colors";

interface DetailRowProps {
  label: string;
  value: string;
}

export default function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20
  }
});
