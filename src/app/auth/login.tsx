import { router } from "expo-router";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import type { User } from "@/types/auth.types";

import hometownLogo from "../../assets/images/react-logo-removebg-preview.png";

export default function LoginScreen() {
  const { login } = useAuthStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function openHomeTownSite() {
    try {
      await Linking.openURL("https://www.hometown.in");
    } catch (error) {
      console.log("Unable to open hometown.in:", error);
    }
  }

  async function handleEmailLogin() {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setError("Please enter Employee ID.");
      return;
    }

    if (!cleanPassword) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await authService.loginWithEmail({
        username: cleanUsername,
        password: cleanPassword,
      });

      const role = String(result.user.role).toUpperCase() as User["role"];

      const normalizedUser: User = {
        ...result.user,
        full_name:
          result.user.full_name ||
          (role === "ADMIN"
            ? "HomeTown Admin"
            : role === "MANAGER"
              ? "Rohan Malhotra"
              : "Priya Sharma"),
        role,
      };

      await login(normalizedUser, result.access_token, result.refresh_token);

      if (role === "ADMIN") {
        router.replace("/admin/dashboard");
      } else if (role === "MANAGER") {
        router.replace("/manager/dashboard");
      } else {
        router.replace("/staff/dashboard");
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.screen}>
            <View style={styles.bgOrbOne} />
            <View style={styles.bgOrbTwo} />
            <View style={styles.goldBeam} />

            {/* ── Header ── */}
            <View style={styles.appHeader}>
              <View style={styles.logoGlowWrap}>
                <View style={styles.logoGlowOne} />
                <View style={styles.logoGlowTwo} />
                <Image
                  source={hometownLogo}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.brandLine}>
                <Text style={styles.homeText}>Home</Text>
                <Text style={styles.townText}>Town</Text>
                <Text style={styles.onTrackText}> OnTrack</Text>
              </View>

              <View style={styles.luxuryPill}>
                <Sparkles size={12} color={COLORS.goldLight} />
                <Text style={styles.luxuryPillText}>
                  Smart Retail Workforce Platform
                </Text>
              </View>
            </View>

            {/* ── Card ── */}
            <View style={styles.loginCard}>
              <View style={styles.cardTitleBlock}>
                <Text style={styles.cardEyebrow}>WELCOME BACK</Text>
                <Text style={styles.cardTitle}>Sign In</Text>
                <Text style={styles.cardSubtitle}>
                  Enter your credentials — we'll take you straight to your
                  dashboard.
                </Text>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Email */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Employee ID</Text>
                <View style={styles.inputWrapper}>
                  <Mail
                    size={16}
                    color={COLORS.orange}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="RC000447"
                    placeholderTextColor={COLORS.gray}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    value={username}
                    onChangeText={setUsername}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock
                    size={16}
                    color={COLORS.orange}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor={COLORS.gray}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword((prev) => !prev)}
                    activeOpacity={0.8}
                  >
                    {showPassword ? (
                      <EyeOff size={16} color={COLORS.gray} />
                    ) : (
                      <Eye size={16} color={COLORS.gray} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.signInButton, loading && styles.btnDisabled]}
                onPress={handleEmailLogin}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.signInText}>Sign In to HomeTown</Text>
                    <ArrowRight size={18} color={COLORS.white} />
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.hint}>
                You'll be redirected automatically based on your account role.
              </Text>
            </View>

            {/* ── Footer ── */}
            <View style={styles.footer}>
              <View style={styles.footerBrandRow}>
                <Text style={styles.footerHome}>Home</Text>
                <Text style={styles.footerTown}>Town</Text>
                <Text style={styles.footerOnTrack}> OnTrack Workforce App</Text>
              </View>

              <TouchableOpacity activeOpacity={0.85} onPress={openHomeTownSite}>
                <Text style={styles.footerVisit}>Visit hometown.in</Text>
              </TouchableOpacity>

              <View style={styles.footerMetaRow}>
                <View style={styles.secureLoginPill}>
                  <ShieldCheck size={11} color={COLORS.goldLight} />
                  <Text style={styles.secureLoginText}>Secure Login</Text>
                </View>

                <Text style={styles.footerDot}>•</Text>

                <TouchableOpacity activeOpacity={0.85}>
                  <Text style={styles.footerMetaLink}>Terms of Service</Text>
                </TouchableOpacity>

                <Text style={styles.footerDot}>•</Text>

                <TouchableOpacity activeOpacity={0.85}>
                  <Text style={styles.footerMetaLink}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.footerQuote}>
                "Empowering every store team to learn, perform and grow."
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const COLORS = {
  brownDark: "#2B170D",
  brown: "#5B341E",
  brownSoft: "#8A5A32",

  orange: "#C95F18",
  orangeDeep: "#9A3F0C",
  orangeSoft: "#FFF1E5",

  blue: "#102B45",
  blueSoft: "#EAF2FB",

  gold: "#C9852B",
  goldLight: "#FFD28A",

  gray: "#8A8178",
  beige: "#FFF6EA",
  beigeDark: "#EAD6BD",
  cream: "#FFFDF8",

  white: "#FFFFFF",
  black: "#111827",
  error: "#DC2626",
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.brownDark,
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  screen: {
    flexGrow: 1,
    backgroundColor: COLORS.brown,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 8 : 18,
    paddingBottom: 14,
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },

  bgOrbOne: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(255,210,138,0.20)",
    top: -96,
    right: -86,
  },
  bgOrbTwo: {
    position: "absolute",
    width: 174,
    height: 174,
    borderRadius: 87,
    backgroundColor: "rgba(16,43,69,0.28)",
    bottom: 48,
    left: -70,
  },
  goldBeam: {
    position: "absolute",
    width: 76,
    height: 480,
    backgroundColor: "rgba(255,210,138,0.08)",
    top: -40,
    right: 78,
    borderRadius: 999,
    transform: [{ rotate: "22deg" }],
  },

  appHeader: {
    alignItems: "center",
    marginBottom: 14,
  },
  logoGlowWrap: {
    width: 140,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  logoGlowOne: {
    position: "absolute",
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: "rgba(255,210,138,0.24)",
    elevation: 10,
  },
  logoGlowTwo: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  logoImage: {
    width: 136,
    height: 108,
    zIndex: 2,
  },
  brandLine: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  homeText: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.brownDark,
  },
  townText: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.orange,
  },
  onTrackText: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.goldLight,
    letterSpacing: -1,
  },
  luxuryPill: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(43,23,13,0.56)",
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,210,138,0.36)",
  },
  luxuryPillText: {
    color: "rgba(255,246,234,0.92)",
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.35,
  },

  loginCard: {
    backgroundColor: COLORS.cream,
    borderRadius: 30,
    padding: 16,
    gap: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    elevation: 10,
  },
  cardTitleBlock: {
    gap: 3,
  },
  cardEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    color: COLORS.orange,
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.brown,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    lineHeight: 16,
    fontWeight: "600",
  },

  fieldBlock: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: "900",
    color: COLORS.brown,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 15,
    borderWidth: 1.3,
    borderColor: "#E4D8CC",
    overflow: "hidden",
  },
  inputIcon: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: COLORS.black,
    paddingHorizontal: 9,
    paddingVertical: 11,
    fontWeight: "700",
  },
  eyeButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  signInButton: {
    borderRadius: 17,
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    elevation: 4,
    backgroundColor: COLORS.orange,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  signInText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },
  hint: {
    fontSize: 11,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 15,
    fontWeight: "600",
  },

  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 9,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: 12,
    color: "#B91C1C",
    fontWeight: "800",
  },

  footer: {
    alignItems: "center",
    paddingTop: 13,
    gap: 5,
  },
  footerBrandRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  footerHome: {
    fontSize: 12,
    color: COLORS.cream,
    fontWeight: "900",
  },
  footerTown: {
    fontSize: 12,
    color: COLORS.orange,
    fontWeight: "900",
  },
  footerOnTrack: {
    fontSize: 12,
    color: COLORS.goldLight,
    fontWeight: "900",
  },
  footerVisit: {
    fontSize: 11.5,
    color: COLORS.white,
    fontWeight: "900",
    textDecorationLine: "underline",
  },
  footerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 5,
    paddingHorizontal: 8,
  },
  secureLoginPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  secureLoginText: {
    fontSize: 10.5,
    color: COLORS.goldLight,
    fontWeight: "900",
  },
  footerDot: {
    fontSize: 12,
    color: "rgba(255,246,234,0.55)",
    fontWeight: "900",
  },
  footerMetaLink: {
    fontSize: 10.5,
    color: "rgba(255,246,234,0.86)",
    fontWeight: "800",
  },
  footerQuote: {
    marginTop: 1,
    fontSize: 10.5,
    color: "rgba(255,246,234,0.78)",
    fontWeight: "600",
    textAlign: "center",
    fontStyle: "italic",
  },
});