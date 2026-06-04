import React from 'react';
import { StyleSheet, TouchableOpacity, View, type ViewStyle } from 'react-native';

import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

interface AppCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
}

export function AppCard({ children, onPress, style, padding = Spacing.three }: AppCardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, { padding }, style]}
        onPress={onPress}
        activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, { padding }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    ...Shadow.card,
  },
});
