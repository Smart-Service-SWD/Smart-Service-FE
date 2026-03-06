import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../../app/theme/colors";

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}

export default function ActionButton({
  label,
  onPress,
  disabled = false,
  variant = "primary"
}: ActionButtonProps) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  return (
    <Pressable
      style={[
        styles.button,
        isPrimary && styles.primaryButton,
        variant === "secondary" && styles.secondaryButton,
        isDanger && styles.dangerButton,
        disabled && styles.disabled
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.label,
          isPrimary && styles.primaryLabel,
          variant === "secondary" && styles.secondaryLabel,
          isDanger && styles.primaryLabel
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center"
  },
  primaryButton: {
    backgroundColor: colors.primary
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderColor: colors.primary,
    borderWidth: 1
  },
  dangerButton: {
    backgroundColor: colors.danger
  },
  label: {
    fontSize: 14,
    fontWeight: "700"
  },
  primaryLabel: {
    color: "#fff"
  },
  secondaryLabel: {
    color: colors.primary
  },
  disabled: {
    opacity: 0.65
  }
});

