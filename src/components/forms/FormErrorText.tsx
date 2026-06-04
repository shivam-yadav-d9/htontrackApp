import React from "react";
import { Text, StyleSheet } from "react-native";

interface FormErrorTextProps {
  error?: string;
}

export function FormErrorText({ error }: FormErrorTextProps) {
  if (!error) return null;
  return <Text style={styles.error}>{error}</Text>;
}

const styles = StyleSheet.create({
  error: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 4,
    marginLeft: 2,
  },
});
