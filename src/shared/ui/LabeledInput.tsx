import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";
import { colors } from "../../app/theme/colors";

interface LabeledInputProps extends TextInputProps {
  label: string;
  hint?: string;
}

export default function LabeledInput({
  label,
  hint,
  style,
  ...props
}: LabeledInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600"
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: colors.text,
    backgroundColor: "#fff",
    fontSize: 15
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  }
});
