import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";
import { colors } from "../../app/theme/colors";

interface LabeledInputProps extends TextInputProps {
  label: string;
}

export default function LabeledInput({ label, style, ...props }: LabeledInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600"
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: colors.text,
    backgroundColor: "#fff"
  }
});

