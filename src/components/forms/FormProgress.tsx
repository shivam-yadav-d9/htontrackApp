import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  completed: number;
  total: number;
  label?: string;
}

export function FormProgress({ completed, total, label }: Props) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const barColor = pct === 100 ? '#16A34A' : pct >= 60 ? '#D97706' : '#E87525';

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label ?? `${completed} of ${total} sections complete`}</Text>
        <Text style={[styles.pct, { color: barColor }]}>{pct}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  pct: { fontSize: 12, fontWeight: '800' },
  track: {
    height: 6, backgroundColor: '#E5E7EB', borderRadius: 999, overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: 999 },
});
