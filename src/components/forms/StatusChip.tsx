import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type ChipVariant = "default" | "primary" | "success" | "warning" | "danger" | "info";

interface StatusChipProps {
  label: string;
  variant?: ChipVariant;
  selected?: boolean;
  onPress?: () => void;
}

const VARIANT_STYLES: Record<ChipVariant, { bg: string; text: string; border: string }> = {
  default: { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" },
  primary: { bg: "#EFF6FF", text: "#123C69", border: "#123C69" },
  success: { bg: "#ECFDF5", text: "#065F46", border: "#059669" },
  warning: { bg: "#FFFBEB", text: "#92400E", border: "#F59E0B" },
  danger: { bg: "#FEF2F2", text: "#991B1B", border: "#DC2626" },
  info: { bg: "#F0F9FF", text: "#0C4A6E", border: "#0EA5E9" },
};

export function StatusChip({ label, variant = "default", selected = false, onPress }: StatusChipProps) {
  const colors = VARIANT_STYLES[variant];
  const chip = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.bg : "#F9FAFB",
          borderColor: selected ? colors.border : "#E5E7EB",
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? colors.text : "#6B7280" },
          selected && styles.selectedLabel,
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
        {chip}
      </TouchableOpacity>
    );
  }
  return chip;
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
  },
  selectedLabel: {
    fontWeight: "700",
  },
});
