import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from "react-native";

interface FormSubmitButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: "primary" | "danger" | "outline";
}

export function FormSubmitButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  style,
  variant = "primary",
}: FormSubmitButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        variant === "primary" && styles.primary,
        variant === "danger" && styles.danger,
        variant === "outline" && styles.outline,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? "#123C69" : "#FFFFFF"} size="small" />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "outline" && styles.outlineLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: "#E87525",
  },
  danger: {
    backgroundColor: "#DC2626",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#123C69",
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  outlineLabel: {
    color: "#123C69",
  },
});
