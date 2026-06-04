import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, BorderRadius } from '@/constants/theme';

type BadgeVariant = 'orange' | 'blue' | 'success' | 'warning' | 'error' | 'gray' | 'brown';

const BG: Record<BadgeVariant, string> = {
  orange: COLORS.orange,
  blue: COLORS.blue,
  success: COLORS.success,
  warning: COLORS.warning,
  error: COLORS.error,
  gray: COLORS.gray,
  brown: COLORS.brown,
};

interface AppBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export function AppBadge({ label, variant = 'orange', size = 'md' }: AppBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: BG[variant] }, size === 'sm' && styles.sm]}>
      <Text style={[styles.text, size === 'sm' && styles.textSm]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  sm: { paddingHorizontal: 7, paddingVertical: 2 },
  text: { color: COLORS.white, fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  textSm: { fontSize: 9 },
});
