import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '@/store/auth.store';
import { COLORS } from '@/constants/theme';
import { seedLocalDb } from '@/services/localJsonDb';

const hometownLogo = require('../../assets/images/logo-glow.png');

const KarmyogiTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.blue,
    background: COLORS.beigeLight,
    card: COLORS.white,
    text: COLORS.brown,
    border: COLORS.border,
    notification: COLORS.orange,
  },
};

export default function RootLayout() {
  const { is_authenticated, is_loading, user, restoreSession } = useAuthStore();

  useEffect(() => {
    seedLocalDb().catch(() => { });
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    console.log('AUTH STATE', {
      is_loading,
      is_authenticated,
      user,
    });

    if (!is_loading) {
      if (is_authenticated && user) {
        console.log('GOING TO DASHBOARD');

        const role = String(user.role).toUpperCase();
        const targetRoute =
          role === 'ADMIN'
            ? '/admin/dashboard'
            : role === 'MANAGER'
              ? '/manager/dashboard'
              : '/staff/dashboard';

        router.replace(targetRoute);
      } else {
        console.log('GOING TO LOGIN');
        router.replace('/auth/login');
      }
    }
  }, [is_loading, is_authenticated, user]);

  if (is_loading) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={hometownLogo} style={styles.loadingLogo} resizeMode="contain" />
        <View style={styles.loadingTextContainer}>
          <Text style={styles.loadingBrandOrange}>HomeTown</Text>
          <Text style={styles.loadingBrandWhite}> ON-TRACK App</Text>
        </View>
        <ActivityIndicator size="large" color={COLORS.orange} style={styles.loadingSpinner} />
      </View>
    );
  }

  return (
    <ThemeProvider value={KarmyogiTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/verify-otp" />
        <Stack.Screen name="staff" />
        <Stack.Screen name="manager" />
        <Stack.Screen name="admin" />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.blue,
    paddingHorizontal: 20,
  },
  loadingLogo: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  loadingTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 32,
  },
  loadingBrandOrange: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.orange,
    letterSpacing: 1,
  },
  loadingBrandWhite: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
  },
  loadingSpinner: {
    marginTop: 20,
  },
});