import { router } from "expo-router";
import ScreenLayout from "@/components/ScreenLayout";

import {
  BellRing,
  BookOpen,
  CalendarCheck,
  MapPin,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";
import { useAuthStore } from "@/store/auth.store";

// ── Hardcoded stat data ──────────────────────────────────────────────────────
const STAT_DATA = {
  today_target: 15,
  total_target: 120,
  achieved_target: 85,
  attendance_status: "P",
  total_courses_enrolled: 12,
  pass_percentage: 83.5,
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

// ── StatCard ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  bg: string;
  iconBg: string;
  valueColor: string;
}

function StatCard({ icon, value, label, bg, iconBg, valueColor }: StatCardProps) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <Text style={[styles.statCardValue, { color: valueColor }]}>{value}</Text>
      <Text style={styles.statCardLabel}>{label}</Text>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const displayName = user?.full_name ?? "Team Member";
  const storeName = user?.store_name ?? "No store assigned";

  // Derive a safe "unreadAlerts" value (0 for now since we dropped the API)
  const unreadAlerts = 0;

  async function handleRefresh() {
    setRefreshing(true);
    // Re-fetch logic can go here when API is wired back up
    setRefreshing(false);
  }

  return (
    <ScreenLayout title="Dashboard">
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.root}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            {/* ── Header (unchanged) ─────────────────────────────────────── */}
            <View style={styles.header}>
              <View style={styles.headerGlowOne} />
              <View style={styles.headerGlowTwo} />

              <View style={styles.headerTop}>
                <View style={styles.avatarBox}>
                  <UserRound size={25} color="#FFF8EF" />
                  <View style={styles.avatarSpark}>
                    <Sparkles size={11} color="#FFFFFF" />
                  </View>
                </View>

                <View style={styles.headerText}>
                  <Text style={styles.greetingText}>{greeting()},</Text>
                  <Text style={styles.name} numberOfLines={1}>
                    {displayName}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={styles.roleChip}>
                      <Text style={styles.roleChipText}>STORE STAFF</Text>
                    </View>

                    <View style={styles.storeChip}>
                      <MapPin size={10} color="#F6A15A" />
                      <Text style={styles.storeChipText} numberOfLines={1}>
                        {storeName}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.bellBtn}
                  activeOpacity={0.84}
                  onPress={() => router.push("/staff/notifications" as any)}
                >
                  <BellRing size={19} color="#FFFFFF" />
                  {unreadAlerts > 0 ? <View style={styles.notifDot} /> : null}
                </TouchableOpacity>
              </View>

              {/* Top stat bar inside header */}
              <View style={styles.topStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {STAT_DATA.achieved_target}/{STAT_DATA.total_target}
                  </Text>
                  <Text style={styles.statLabel}>Target</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {STAT_DATA.attendance_status}
                  </Text>
                  <Text style={styles.statLabel}>Attendance</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {STAT_DATA.pass_percentage}%
                  </Text>
                  <Text style={styles.statLabel}>Pass %</Text>
                </View>
              </View>
            </View>

            {/* ── 2-column stat grid ─────────────────────────────────────── */}
            <View style={styles.gridWrap}>
              <StatCard
                icon={<Target size={13} color="#C95F18" />}
                value={STAT_DATA.today_target}
                label="Today's Target"
                bg="#FFF1E5"
                iconBg="#FED7AA"
                valueColor="#C95F18"
              />

              <StatCard
                icon={<TrendingUp size={13} color="#102B45" />}
                value={STAT_DATA.total_target}
                label="Total Target"
                bg="#EAF2FB"
                iconBg="#C9DBEF"
                valueColor="#102B45"
              />

              <StatCard
                icon={<Target size={13} color="#166534" />}
                value={STAT_DATA.achieved_target}
                label="Achieved"
                bg="#DCFCE7"
                iconBg="#BBF7D0"
                valueColor="#166534"
              />

              <StatCard
                icon={<CalendarCheck size={13} color="#B7791F" />}
                value={STAT_DATA.attendance_status}
                label="Attendance"
                bg="#FFF4D8"
                iconBg="#F5D28A"
                valueColor="#B7791F"
              />

              <StatCard
                icon={<BookOpen size={13} color="#6D28D9" />}
                value={STAT_DATA.total_courses_enrolled}
                label="Courses"
                bg="#F3E8FF"
                iconBg="#E9D5FF"
                valueColor="#6D28D9"
              />

              <StatCard
                icon={<TrendingUp size={13} color="#166534" />}
                value={`${STAT_DATA.pass_percentage}%`}
                label="Pass %"
                bg="#DCFCE7"
                iconBg="#BBF7D0"
                valueColor="#166534"
              />
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      </SafeAreaView>
    </ScreenLayout>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const LOCAL_COLORS = {
  navy: "#102B45",
  orange: "#C95F18",
  cream: "#FFFDF8",
  beige: "#F6EBDC",
  muted: "#8A8178",
  brown: "#6B3F20",
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: LOCAL_COLORS.beige,
  },

  root: {
    flex: 1,
    backgroundColor: LOCAL_COLORS.beige,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingBottom: 28,
    gap: 16,
  },

  // ── Header (all original styles preserved) ────────────────────────────────
  header: {
    backgroundColor: LOCAL_COLORS.navy,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    gap: 13,
    overflow: "hidden",
    position: "relative",
  },

  headerGlowOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(201,95,24,0.28)",
    top: -70,
    right: -60,
  },

  headerGlowTwo: {
    position: "absolute",
    width: 135,
    height: 135,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -55,
    left: -35,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  avatarBox: {
    position: "relative",
    width: 55,
    height: 55,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },

  avatarSpark: {
    position: "absolute",
    right: -4,
    bottom: -3,
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: LOCAL_COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: LOCAL_COLORS.navy,
  },

  headerText: {
    flex: 1,
  },

  greetingText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "600",
  },

  name: {
    fontSize: 21,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 2,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 7,
  },

  roleChip: {
    backgroundColor: LOCAL_COLORS.orange,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  roleChipText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.6,
  },

  storeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.11)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },

  storeChipText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.72)",
    fontWeight: "700",
    flex: 1,
  },

  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#F6A15A",
    borderWidth: 1.5,
    borderColor: LOCAL_COLORS.navy,
  },

  topStats: {
    backgroundColor: "rgba(255,255,255,0.11)",
    borderRadius: 19,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFEAC7",
  },

  statLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.66)",
    fontWeight: "700",
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  // ── Stat grid ─────────────────────────────────────────────────────────────
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: Spacing.three,
  },

  statCard: {
    width: "47%",
    flexGrow: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
    shadowColor: "#3A2314",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  statIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  statCardValue: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 18,
  },

  statCardLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: LOCAL_COLORS.muted,
  },

  bottomSpacer: {
    height: 14,
  },
});