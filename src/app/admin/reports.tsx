import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { router } from "expo-router";
import {
  BarChart3,
  BookOpenCheck,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  ShieldCheck,
  Store,
  Target,
  UsersRound,
  WalletCards,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  navy: "#102B45",
  orange: "#C95F18",
  gold: "#B7791F",
  beige: "#F6EBDC",
  cream: "#FFFDF8",
  muted: "#8A8178",
  brown: "#6B3F20",
  green: "#166534",
  red: "#B91C1C",
  white: "#FFFFFF",
};

type FeatureCard = { icon: React.ReactNode; title: string; sub: string; route: string };
type ReportFilter = "all" | "operational" | "system";

function FeatureRow({ card }: { card: FeatureCard }) {
  return (
    <TouchableOpacity style={s.featureRow} activeOpacity={0.85} onPress={() => router.push(card.route as any)}>
      <View style={s.featureIconBox}>{card.icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.featureTitle}>{card.title}</Text>
        <Text style={s.featureSub}>{card.sub}</Text>
      </View>
      <ChevronRight size={16} color={C.muted} />
    </TouchableOpacity>
  );
}

export default function ReportsScreen() {
  const [filter, setFilter] = useState<ReportFilter>("all");
  const operationalCards: FeatureCard[] = [
    { icon: <CalendarCheck size={20} color={C.navy} />, title: "Attendance Report", sub: "Daily, monthly, store-wise attendance data", route: "/admin/reports/attendance" },
    { icon: <Target size={20} color={C.orange} />, title: "Targets Report", sub: "Achievement vs target across stores", route: "/admin/reports/targets" },
    { icon: <BookOpenCheck size={20} color={C.green} />, title: "Course & LMS Report", sub: "Course completion and pass rates", route: "/admin/reports/courses" },
    { icon: <ClipboardList size={20} color={C.brown} />, title: "Checklist Report", sub: "Checklist completion and issues", route: "/admin/reports/checklists" },
    { icon: <WalletCards size={20} color={C.gold} />, title: "Incentives Report", sub: "Incentive calculations and payout status", route: "/admin/reports/incentives" },
    { icon: <Store size={20} color={C.navy} />, title: "Store Conversions Report", sub: "Lead to order conversion by store", route: "/admin/reports/store-conversions" },
    { icon: <UsersRound size={20} color={C.orange} />, title: "Employee Report", sub: "Workforce summary and mapping status", route: "/admin/reports/employees" },
  ];

  const systemCards: FeatureCard[] = [
    { icon: <Download size={20} color={C.navy} />, title: "Download History", sub: "Previously generated report downloads", route: "/admin/reports/download-history" },
    { icon: <ShieldCheck size={20} color={C.green} />, title: "Audit Logs", sub: "Admin action audit trail", route: "/admin/audit-logs" },
    { icon: <FileText size={20} color={C.muted} />, title: "Custom Report Builder", sub: "Build and schedule custom reports", route: "/admin/reports/custom" },
  ];

  const FILTER_CHIPS: { key: ReportFilter; label: string }[] = [
    { key: "all", label: "All Reports" },
    { key: "operational", label: "Operational" },
    { key: "system", label: "System & Audit" },
  ];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.root}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Reports</Text>
          <Text style={s.headerSub}>Generate, view, and download all admin reports</Text>
        </View>

        <View style={s.filterRow}>
          {FILTER_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip.key}
              style={[s.filterChip, filter === chip.key && s.filterChipActive]}
              onPress={() => setFilter(chip.key)}
              activeOpacity={0.8}
            >
              <Text style={[s.filterChipText, filter === chip.key && s.filterChipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {(filter === "all" || filter === "operational") && (
            <View style={s.sectionCard}>
              <TouchableOpacity style={s.sectionHeader} activeOpacity={0.7} onPress={() => setFilter(filter === "operational" ? "all" : "operational")}>
                <Text style={s.sectionTitle}>OPERATIONAL REPORTS</Text>
                <Text style={s.sectionCount}>{operationalCards.length}</Text>
              </TouchableOpacity>
              {operationalCards.map((c) => <FeatureRow key={c.route} card={c} />)}
            </View>
          )}

          {(filter === "all" || filter === "system") && (
            <View style={s.sectionCard}>
              <TouchableOpacity style={s.sectionHeader} activeOpacity={0.7} onPress={() => setFilter(filter === "system" ? "all" : "system")}>
                <Text style={s.sectionTitle}>SYSTEM & AUDIT</Text>
                <Text style={s.sectionCount}>{systemCards.length}</Text>
              </TouchableOpacity>
              {systemCards.map((c) => <FeatureRow key={c.route} card={c} />)}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <AdminBottomNav />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },
  root: { flex: 1, backgroundColor: C.cream },
  header: { backgroundColor: C.navy, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3 },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.beige },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.beige, borderWidth: 1, borderColor: C.beige },
  filterChipActive: { backgroundColor: C.navy, borderColor: C.navy },
  filterChipText: { fontSize: 12, fontWeight: "600", color: C.muted },
  filterChipTextActive: { color: C.white },
  sectionCard: { backgroundColor: "#FFFFFF", borderRadius: 12, overflow: "hidden", marginBottom: 12, borderWidth: 1, borderColor: C.beige },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: C.muted, letterSpacing: 1 },
  sectionCount: { fontSize: 11, fontWeight: "700", color: C.white, backgroundColor: C.navy, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  featureRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.beige, gap: 12 },
  featureIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.beige, alignItems: "center", justifyContent: "center" },
  featureTitle: { fontSize: 14, fontWeight: "600", color: C.navy },
  featureSub: { fontSize: 12, color: C.muted, marginTop: 1 },
});
