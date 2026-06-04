import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface RequiredLabelProps {
  label: string;
  required?: boolean;
}

export function RequiredLabel({ label, required = false }: RequiredLabelProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {required && <Text style={styles.asterisk}> *</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  asterisk: {
    fontSize: 13,
    fontWeight: "600",
    color: "#DC2626",
  },
});
