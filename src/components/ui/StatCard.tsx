import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

interface StatCardProps {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

export function StatCard({ value, label, icon, color = COLORS.orange }: StatCardProps) {
  return (
    <View style={styles.card}>
      {icon && <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>{icon}</View>}
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    alignItems: 'center',
    gap: 6,
    ...Shadow.card,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontSize: 22, fontWeight: '900' },
  label: { fontSize: 11, color: COLORS.gray, textAlign: 'center', fontWeight: '500' },
});
