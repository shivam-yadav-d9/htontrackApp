import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ShieldCheck } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

const OTP_LENGTH = 6;

export default function VerifyOtpScreen() {
  const { mobile, countryCode } = useLocalSearchParams<{ mobile: string; countryCode: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputs = useRef<(TextInput | null)[]>([]);
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((n) => n - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  function handleChange(text: string, idx: number) {
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const next = [...otp];
      digits.forEach((d, i) => { if (idx + i < OTP_LENGTH) next[idx + i] = d; });
      setOtp(next);
      const focusIdx = Math.min(idx + digits.length, OTP_LENGTH - 1);
      inputs.current[focusIdx]?.focus();
      return;
    }
    const next = [...otp];
    next[idx] = text;
    setOtp(next);
    if (text && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
  }

  function handleKeyPress(key: string, idx: number) {
    if (key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      Alert.alert('Incomplete OTP', 'Please enter all 6 digits.');
      return;
    }
    setLoading(true);
    try {
      const result = await authService.verifyOtp(mobile ?? '', code, countryCode ?? '+91');
      await login(result.user, result.access_token, result.refresh_token);
      router.replace('/staff/dashboard');
    } catch (err) {
      Alert.alert('Invalid OTP', err instanceof Error ? err.message : 'Verification failed. Please try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  const filledCount = otp.filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Blue Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Content Card */}
        <View style={styles.card}>
          <View style={styles.iconRow}>
            <View style={styles.iconCircle}>
              <ShieldCheck size={32} color={COLORS.orange} strokeWidth={2} />
            </View>
          </View>

          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.mobileHighlight}>{countryCode} {mobile}</Text>
          </Text>

          {/* OTP Boxes */}
          <View style={styles.otpRow}>
            {otp.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(el) => { inputs.current[idx] = el; }}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                value={digit}
                onChangeText={(t) => handleChange(t, idx)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, idx)}
                keyboardType="number-pad"
                maxLength={6}
                selectTextOnFocus
                textAlign="center"
              />
            ))}
          </View>

          {/* Progress indicator */}
          <Text style={styles.progress}>{filledCount} / {OTP_LENGTH} digits entered</Text>

          <TouchableOpacity
            style={[styles.verifyBtn, loading && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.verifyBtnText}>Verify & Login</Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendRow}>
            {resendTimer > 0 ? (
              <Text style={styles.resendTimer}>
                Resend OTP in <Text style={{ color: COLORS.orange, fontWeight: '700' }}>{resendTimer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={() => setResendTimer(60)}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.demoBox, Shadow.card]}>
            <Text style={styles.demoText}>🔑 Demo: Enter any 6 digits (e.g. <Text style={{ fontWeight: '700', color: COLORS.orange }}>123456</Text>) to login</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.blue },
  kav: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: Spacing.four,
    gap: Spacing.three,
    alignItems: 'center',
  },
  iconRow: { marginBottom: Spacing.one },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.blue },
  subtitle: { fontSize: 15, color: COLORS.gray, textAlign: 'center', lineHeight: 22 },
  mobileHighlight: { color: COLORS.orange, fontWeight: '700' },
  otpRow: { flexDirection: 'row', gap: Spacing.two, marginVertical: Spacing.one },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: BorderRadius.medium,
    backgroundColor: COLORS.grayLight,
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.blue,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  otpBoxFilled: {
    borderColor: COLORS.orange,
    backgroundColor: COLORS.orangeLight,
    color: COLORS.orange,
  },
  progress: { fontSize: 12, color: COLORS.gray },
  verifyBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.three,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  verifyBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  resendRow: { alignItems: 'center' },
  resendTimer: { fontSize: 14, color: COLORS.gray },
  resendLink: { fontSize: 14, color: COLORS.orange, fontWeight: '700' },
  demoBox: {
    backgroundColor: COLORS.beigeLight,
    borderRadius: BorderRadius.medium,
    padding: Spacing.two,
    alignSelf: 'stretch',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.orange,
  },
  demoText: { fontSize: 12, color: COLORS.brown, lineHeight: 18 },
});
