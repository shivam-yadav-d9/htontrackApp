import React from "react";
import { Text, StyleSheet } from "react-native";

interface CharacterCounterProps {
  current: number;
  max: number;
}

export function CharacterCounter({ current, max }: CharacterCounterProps) {
  const isOver = current > max;
  return (
    <Text style={[styles.counter, isOver && styles.over]}>
      {current}/{max}
    </Text>
  );
}

const styles = StyleSheet.create({
  counter: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 2,
  },
  over: {
    color: "#DC2626",
  },
});
