import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, Spacing } from '@/constants/theme';

export default function LeaveApprovalsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leave Approvals</Text>
      </View>
      <View style={styles.center}>
        <Text style={styles.icon}>📅</Text>
        <Text style={styles.title}>Coming Soon</Text>
        <Text style={styles.sub}>Leave management will be available in the next update.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  header: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: 12 },
  icon: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.grayDark },
  sub: { fontSize: 14, color: COLORS.gray, textAlign: 'center', lineHeight: 20 },
});
