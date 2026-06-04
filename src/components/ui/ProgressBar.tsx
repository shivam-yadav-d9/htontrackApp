import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, BorderRadius } from '@/constants/theme';

interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  height?: number;
  color?: string;
}

export function ProgressBar({ value, showLabel = false, height = 8, color }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const barColor = color ?? (clamped >= 100 ? COLORS.success : clamped >= 70 ? COLORS.orange : clamped >= 40 ? COLORS.warning : COLORS.error);

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: barColor, height }]} />
      </View>
      {showLabel && <Text style={styles.label}>{Math.round(clamped)}%</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  track: {
    backgroundColor: COLORS.grayLight,
    borderRadius: BorderRadius.pill,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: BorderRadius.pill,
  },
  label: { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
});
