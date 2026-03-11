import { useState } from "react";
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
  onBlur,
  onFocus,
  ...props
}: LabeledInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            focused && styles.inputFocused,
            !!actionLabel && styles.inputWithAction,
            style
          ]}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
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
    gap: 7
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.18)",
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 14,
    color: colors.text,
    backgroundColor: colors.surfaceRaised,
    fontSize: 15,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 6
    },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 1
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface
  },
  inputRow: {
    position: "relative",
    justifyContent: "center"
  },
  inputWithAction: {
    paddingRight: 78
  },
  actionButton: {
    position: "absolute",
    right: 14,
    paddingVertical: 6,
    paddingHorizontal: 4
  },
  actionText: {
    color: colors.primaryStrong,
    fontSize: 12,
    fontWeight: "800"
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  }
});
