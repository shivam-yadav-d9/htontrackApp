import { router } from 'expo-router';
import { ChevronLeft, Home } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StaffPageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function StaffPageHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  rightAction,
}: StaffPageHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={styles.row}>
        {showBack && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onBack ?? (() => router.back())}
            activeOpacity={0.8}
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>

        {rightAction ? (
          <View>{rightAction}</View>
        ) : (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.replace('/staff/dashboard')}
            activeOpacity={0.8}
          >
            <Home size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#102B45',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    flexShrink: 0,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
    fontWeight: '600',
  },
});
