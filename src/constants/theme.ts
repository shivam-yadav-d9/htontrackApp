import '@/global.css';

import { Platform } from 'react-native';

export const COLORS = {
  orange: '#E87525',
  orangeDark: '#B85C1E',
  orangeLight: '#FFF0E5',

  blue: '#123C69',
  blueDark: '#0B2545',
  blueLight: '#EAF2FF',

  brown: '#5A3825',
  brownDark: '#3A2418',
  brownLight: '#EFE1D1',

  beige: '#F7EFE5',
  beigeDark: '#E6D4BF',
  beigeLight: '#FFF9F1',

  gray: '#6B7280',
  grayDark: '#374151',
  grayLight: '#F3F4F6',

  white: '#FFFFFF',
  black: '#111827',

  success: '#1F8A5B',
  warning: '#F59E0B',
  error: '#DC2626',
  border: '#E5E7EB',
} as const;

export const Colors = {
  light: {
    text: COLORS.black,
    background: COLORS.beige,
    backgroundElement: COLORS.beigeLight,
    backgroundSelected: COLORS.orange,
    textSecondary: COLORS.gray,
    card: COLORS.white,
    border: COLORS.border,
    primary: COLORS.orange,
    accent: COLORS.blue,
    tabBar: COLORS.white,
    tabBarActive: COLORS.orange,
    tabBarInactive: COLORS.gray,
  },
  dark: {
    text: COLORS.beigeLight,
    background: COLORS.blueDark,
    backgroundElement: COLORS.blue,
    backgroundSelected: COLORS.orange,
    textSecondary: COLORS.beigeDark,
    card: COLORS.blue,
    border: COLORS.brown,
    primary: COLORS.orange,
    accent: COLORS.orange,
    tabBar: COLORS.blueDark,
    tabBarActive: COLORS.orange,
    tabBarInactive: COLORS.beigeDark,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BorderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
  pill: 100,
} as const;

export const Shadow = {
  card: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  strong: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
