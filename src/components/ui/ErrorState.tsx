import { AlertCircle } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from './AppButton';
import { COLORS, Spacing } from '@/constants/theme';

interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <AlertCircle size={48} color={COLORS.error} />
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && <AppButton label="Try Again" onPress={onRetry} variant="outline" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 48, gap: Spacing.two, paddingHorizontal: 32 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.grayDark },
  message: { fontSize: 13, color: COLORS.gray, textAlign: 'center', lineHeight: 20 },
});
