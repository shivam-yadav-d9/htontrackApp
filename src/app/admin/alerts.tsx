import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { dataQualityService, type PerformanceAlert } from "@/services";
import { router } from "expo-router";
import {
  AlertTriangle,
  BellRing,
  CheckCircle,
  ChevronRight,
  Info,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
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
  redLight: "#FEE2E2",
  goldLight: "#FFF4D8",
  greenLight: "#DCFCE7",
};

type AlertItem = { id: string; severity: "critical" | "warning" | "info"; title: string; description: string; module: string; cta: string };


function ctaFromModule(module: string): string {
  switch (module.toLowerCase()) {
    case "stores": return "View Stores";
    case "targets": return "View Targets";
    case "attendance": return "View Attendance";
    case "lms": return "View Courses";
    case "leave": return "Review Leave";
    case "checklists": return "View Checklists";
    case "workforce": return "View Teams";
    case "incentives": return "View Incentives";
    default: return "View Details";
  }
}

function mapAlert(pa: PerformanceAlert, index: number): AlertItem {
  const sev = (pa.severity === "critical" || pa.severity === "warning" || pa.severity === "info")
    ? pa.severity
    : "info";
  return {
    id: pa.id ?? `pa-${index}`,
    severity: sev as AlertItem["severity"],
    title: pa.title,
    description: pa.description,
    module: pa.module ?? "General",
    cta: ctaFromModule(pa.module ?? ""),
  };
}

function moduleRoute(module: string): string {
  switch (module.toLowerCase()) {
    case "stores": return "/admin/stores";
    case "targets": return "/admin/risk-stores";
    case "attendance": return "/admin/attendance";
    case "lms": return "/admin/courses/pending-learners";
    case "leave": return "/admin/attendance-control";
    case "checklists": return "/admin/checklists/templates";
    case "workforce": return "/admin/teams";
    default: return "/admin/dashboard";
  }
}

function AlertCard({ alert }: { alert: AlertItem }) {
  const isCritical = alert.severity === "critical";
  const isWarning = alert.severity === "warning";

  const bg = isCritical ? C.redLight : isWarning ? C.goldLight : "#EAF2FB";
  const border = isCritical ? "#FECACA" : isWarning ? "#FDE68A" : "#BFDBFE";
  const textColor = isCritical ? C.red : isWarning ? C.gold : C.navy;
  const icon = isCritical
    ? <AlertTriangle size={18} color={C.red} />
    : isWarning
      ? <AlertTriangle size={18} color={C.gold} />
      : <Info size={18} color={C.navy} />;

  return (
    <TouchableOpacity
      style={[s.alertCard, { backgroundColor: bg, borderColor: border }]}
      activeOpacity={0.85}
      onPress={() => router.push(moduleRoute(alert.module) as any)}
    >
      <View style={s.alertHeader}>
        {icon}
        <Text style={[s.alertModule, { color: textColor }]}>{alert.module} · {alert.severity.toUpperCase()}</Text>
      </View>
      <Text style={s.alertTitle}>{alert.title}</Text>
      <Text style={s.alertDesc} numberOfLines={2}>{alert.description}</Text>
      <View style={s.alertCTA}>
        <Text style={[s.alertCTAText, { color: textColor }]}>{alert.cta}</Text>
        <ChevronRight size={14} color={textColor} />
      </View>
    </TouchableOpacity>
  );
}

type AlertFilter = "all" | "critical" | "warning" | "info";

export default function AlertsScreen() {
  const [filter, setFilter] = useState<AlertFilter>("all");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    dataQualityService.getAlerts({ status: "open" })
      .then((data) => {
        setAlerts((data ?? []).map(mapAlert));
      })
      .catch(() => setAlerts([]));
  }, []);

  const criticals = alerts.filter((a) => a.severity === "critical");
  const warnings = alerts.filter((a) => a.severity === "warning");
  const infos = alerts.filter((a) => a.severity === "info");

  const FILTER_CHIPS: { key: AlertFilter; label: string; count: number; activeColor: string }[] = [
    { key: "all", label: "All", count: alerts.length, activeColor: C.navy },
    { key: "critical", label: "Critical", count: criticals.length, activeColor: C.red },
    { key: "warning", label: "Warnings", count: warnings.length, activeColor: C.gold },
    { key: "info", label: "Info", count: infos.length, activeColor: C.navy },
  ];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.root}>
        <View style={s.header}>
          <View style={s.headerRow}>
            <BellRing size={20} color="#FFFFFF" />
            <Text style={s.headerTitle}>Alerts</Text>
          </View>
          <Text style={s.headerSub}>{criticals.length} critical · {warnings.length} warning{warnings.length !== 1 ? "s" : ""} · {infos.length} info</Text>
        </View>

        <View style={s.filterRow}>
          {FILTER_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip.key}
              style={[s.filterChip, filter === chip.key && { backgroundColor: chip.activeColor, borderColor: chip.activeColor }]}
              onPress={() => setFilter(chip.key)}
              activeOpacity={0.8}
            >
              <Text style={[s.filterChipText, filter === chip.key && s.filterChipTextActive]}>
                {chip.label}
              </Text>
              {chip.count > 0 && (
                <View style={[s.filterBadge, filter === chip.key ? s.filterBadgeActive : null]}>
                  <Text style={[s.filterBadgeText, filter === chip.key && { color: chip.activeColor }]}>{chip.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {(filter === "all" || filter === "critical") && criticals.length > 0 && (
            <View style={s.group}>
              <TouchableOpacity style={s.groupHeader} activeOpacity={0.7} onPress={() => setFilter(filter === "critical" ? "all" : "critical")}>
                <Text style={[s.groupLabel, { color: C.red }]}>CRITICAL</Text>
                <View style={[s.groupBadge, { backgroundColor: C.redLight, borderColor: "#FECACA" }]}>
                  <Text style={[s.groupBadgeText, { color: C.red }]}>{criticals.length}</Text>
                </View>
              </TouchableOpacity>
              {criticals.map((a) => <AlertCard key={a.id} alert={a} />)}
            </View>
          )}

          {(filter === "all" || filter === "warning") && warnings.length > 0 && (
            <View style={s.group}>
              <TouchableOpacity style={s.groupHeader} activeOpacity={0.7} onPress={() => setFilter(filter === "warning" ? "all" : "warning")}>
                <Text style={[s.groupLabel, { color: C.gold }]}>WARNINGS</Text>
                <View style={[s.groupBadge, { backgroundColor: C.goldLight, borderColor: "#FDE68A" }]}>
                  <Text style={[s.groupBadgeText, { color: C.gold }]}>{warnings.length}</Text>
                </View>
              </TouchableOpacity>
              {warnings.map((a) => <AlertCard key={a.id} alert={a} />)}
            </View>
          )}

          {(filter === "all" || filter === "info") && infos.length > 0 && (
            <View style={s.group}>
              <TouchableOpacity style={s.groupHeader} activeOpacity={0.7} onPress={() => setFilter(filter === "info" ? "all" : "info")}>
                <Text style={[s.groupLabel, { color: C.navy }]}>INFORMATION</Text>
                <View style={[s.groupBadge, { backgroundColor: "#EAF2FB", borderColor: "#BFDBFE" }]}>
                  <Text style={[s.groupBadgeText, { color: C.navy }]}>{infos.length}</Text>
                </View>
              </TouchableOpacity>
              {infos.map((a) => <AlertCard key={a.id} alert={a} />)}
            </View>
          )}

          {alerts.length === 0 && (
            <View style={s.emptyBox}>
              <CheckCircle size={40} color={C.green} />
              <Text style={s.emptyTitle}>All Clear</Text>
              <Text style={s.emptySub}>No active alerts. Everything is running smoothly.</Text>
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
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3 },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.beige },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: C.beige, borderWidth: 1, borderColor: C.beige },
  filterChipText: { fontSize: 12, fontWeight: "600", color: C.muted },
  filterChipTextActive: { color: C.white },
  filterBadge: { backgroundColor: C.white, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  filterBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  filterBadgeText: { fontSize: 10, fontWeight: "700", color: C.muted },
  group: { marginBottom: 20 },
  groupHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  groupLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  groupBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  groupBadgeText: { fontSize: 11, fontWeight: "700" },
  alertCard: { borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1 },
  alertHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  alertModule: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  alertTitle: { fontSize: 14, fontWeight: "700", color: C.navy, marginBottom: 4 },
  alertDesc: { fontSize: 13, color: C.muted, lineHeight: 18 },
  alertCTA: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 4 },
  alertCTAText: { fontSize: 13, fontWeight: "700" },
  emptyBox: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: C.navy },
  emptySub: { fontSize: 14, color: C.muted, textAlign: "center" },
});
