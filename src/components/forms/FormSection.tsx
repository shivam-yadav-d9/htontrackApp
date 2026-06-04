import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface FormSectionProps {
  title?: string;
  children: React.ReactNode;
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#123C69",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
});
