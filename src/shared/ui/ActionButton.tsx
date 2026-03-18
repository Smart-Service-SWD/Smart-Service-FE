import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../../app/theme/colors";

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  size?: "md" | "sm";
}

export default function ActionButton({
  label,
  onPress,
  disabled = false,
  variant = "primary",
  size = "md"
}: ActionButtonProps) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const isSecondary = variant === "secondary";
  const isSmall = size === "sm";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isSmall && styles.buttonSm,
        isPrimary && styles.primaryButton,
        isSecondary && styles.secondaryButton,
        isDanger && styles.dangerButton,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.label,
          isSmall && styles.labelSm,
          isPrimary && styles.primaryLabel,
          isSecondary && styles.secondaryLabel,
          isDanger && styles.primaryLabel
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 8
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 1
  },
  buttonSm: {
    minHeight: 42,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12
  },

  primaryButton: {
    backgroundColor: colors.primary
  },
  secondaryButton: {
    backgroundColor: colors.primarySoft,
    borderColor: "transparent",
    borderWidth: 1
  },
  dangerButton: {
    backgroundColor: colors.danger
  },

  label: {
    fontSize: 15,
    fontWeight: "800"
  },
  labelSm: {
    fontSize: 12,
    fontWeight: "800"
  },

  primaryLabel: {
    color: "#fff"
  },
  secondaryLabel: {
    color: colors.primaryStrong
  },

  disabled: {
    opacity: 0.6
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.94
  }
});