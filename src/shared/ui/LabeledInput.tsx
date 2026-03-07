import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View
} from "react-native";
import { colors } from "../../app/theme/colors";

interface LabeledInputProps extends TextInputProps {
  label: string;
  hint?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export default function LabeledInput({
  label,
  hint,
  actionLabel,
  onActionPress,
  style,
  ...props
}: LabeledInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, !!actionLabel && styles.inputWithAction, style]}
          placeholderTextColor={colors.textMuted}
          {...props}
        />
        {actionLabel && onActionPress ? (
          <Pressable style={styles.actionButton} onPress={onActionPress}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
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
  inputRow: {
    position: "relative",
    justifyContent: "center"
  },
  inputWithAction: {
    paddingRight: 72
  },
  actionButton: {
    position: "absolute",
    right: 12,
    paddingVertical: 6,
    paddingHorizontal: 4
  },
  actionText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700"
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  }
});
