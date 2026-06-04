import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';

import { COLORS, BorderRadius, Spacing } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  icon,
}: AppButtonProps) {
  const btnStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.label,
    styles[`label_${variant}`],
    styles[`labelSize_${size}`],
  ];

  return (
    <TouchableOpacity
      style={btnStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? COLORS.orange : COLORS.white} />
      ) : (
        <>
          {icon}
          <Text style={textStyle}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.medium,
    gap: Spacing.one,
  },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.55 },

  primary: { backgroundColor: COLORS.orange },
  secondary: { backgroundColor: COLORS.blue },
  outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: COLORS.orange },
  danger: { backgroundColor: COLORS.error },
  ghost: { backgroundColor: 'transparent' },

  size_sm: { paddingVertical: Spacing.one + 2, paddingHorizontal: Spacing.three },
  size_md: { paddingVertical: Spacing.two + 4, paddingHorizontal: Spacing.four },
  size_lg: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.four },

  label: { fontWeight: '700' },
  label_primary: { color: COLORS.white },
  label_secondary: { color: COLORS.white },
  label_outline: { color: COLORS.orange },
  label_danger: { color: COLORS.white },
  label_ghost: { color: COLORS.orange },

  labelSize_sm: { fontSize: 13 },
  labelSize_md: { fontSize: 15 },
  labelSize_lg: { fontSize: 16 },
});
