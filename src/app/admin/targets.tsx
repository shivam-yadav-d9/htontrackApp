import { router } from "expo-router";
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Edit3,
  FileText,
  RefreshCw,
  Store,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { useAuthStore } from "@/store/auth.store";
import { adminDataService } from "@/services/team.service";

const C = {
  navy: "#102B45", orange: "#C95F18", gold: "#B7791F",
  beige: "#F6EBDC", cream: "#FFFDF8", muted: "#8A8178",
  brown: "#6B3F20", green: "#166534", red: "#B91C1C", white: "#FFFFFF",
};

type TargetTab = "overview" | "stores" | "staff" | "logs";

const PERIODS = ["Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026", "Nov 2026", "Dec 2026"];

interface CommandCenter {
  summary: {
    store_target: number; staff_target: number; achieved: number;
    shortfall: number; achievement_pct: number;
    low_performers: number; stores: number; staff_with_targets: number;
    target_achievers: number; stores_below_60: number;
  };
  recent_changes: Array<{ id: string; store: string; field: string; old_val: string; new_val: string; changed_by: string; changed_at: string }>;
}

interface StoreTarget {
  id: string; store_code: string; store_name: string; city: string; zone: string;
  manager?: string; target_amount: number; achieved_amount: number; shortfall: number;
  achievement_pct: number; status: string; admin_remark?: string;
}

interface StaffTarget {
  id: string; employee_code: string; full_name: string; store_code: string;
  store_name: string; department: string; designation: string;
  manager?: string; target_amount: number; achieved_amount: number;
  shortfall: number; achievement_pct: number; status: string; admin_remark?: string;
}

const EMPTY_CC: CommandCenter = {
  summary: {
    store_target: 0, staff_target: 0, achieved: 0,
    shortfall: 0, achievement_pct: 0, low_performers: 0,
    stores: 0, staff_with_targets: 0, target_achievers: 0, stores_below_60: 0,
  },
  recent_changes: [],
};

function periodToId(period: string): string {
  const [mon, yr] = period.split(" ");
  const months: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
  return `${yr}-${months[mon] ?? "05"}`;
}

async function fetchStoreTargets(period: string): Promise<StoreTarget[]> {
  try {
    const data = await adminDataService.getTargetsJoined({ period_id: periodToId(period), level: "store", limit: 50 });
    const arr: any[] = data?.items ?? [];
    if (!arr.length) return [];
    return arr.map((t: any) => ({
      id: t.id ?? `st-${t.site_code}`,
      store_code: t.site_code ?? t.store_code ?? "",
      store_name: t.store_name ?? "",
      city: t.city ?? "",
      zone: t.zone ?? "",
      manager: t.manager_name ?? t.store_karta_name,
      target_amount: t.target_amount ?? 0,
      achieved_amount: t.achieved_amount ?? 0,
      shortfall: Math.max(0, (t.target_amount ?? 0) - (t.achieved_amount ?? 0)),
      achievement_pct: parseFloat((t.achievement_percentage ?? 0).toFixed(1)),
      status: t.status ?? "active",
      admin_remark: t.admin_remark,
    }));
  } catch { return []; }
}

async function fetchStaffTargets(period: string): Promise<StaffTarget[]> {
  try {
    const data = await adminDataService.getTargetsJoined({ period_id: periodToId(period), level: "employee", limit: 100 });
    const arr: any[] = data?.items ?? [];
    if (!arr.length) return [];
    return arr.map((t: any) => ({
      id: t.id ?? `et-${t.employee_number}`,
      employee_code: t.employee_number ?? "",
      full_name: t.employee_name ?? "",
      store_code: t.site_code ?? "",
      store_name: t.store_name ?? "",
      department: t.department ?? "",
      designation: t.role ?? t.job_title ?? "",
      manager: t.manager_name,
      target_amount: t.target_amount ?? 0,
      achieved_amount: t.achieved_amount ?? 0,
      shortfall: Math.max(0, (t.target_amount ?? 0) - (t.achieved_amount ?? 0)),
      achievement_pct: parseFloat((t.achievement_percentage ?? 0).toFixed(1)),
      status: t.status ?? "active",
      admin_remark: t.admin_remark,
    }));
  } catch { return []; }
}

function buildCC(storeTargets: StoreTarget[], staffTargets: StaffTarget[]): CommandCenter {
  const totalStoreTarget = storeTargets.reduce((s, t) => s + t.target_amount, 0);
  const totalStaffTarget = staffTargets.reduce((s, t) => s + t.target_amount, 0);
  const totalAchieved = storeTargets.reduce((s, t) => s + t.achieved_amount, 0);
  const shortfall = Math.max(0, totalStoreTarget - totalAchieved);
  const pct = totalStoreTarget > 0 ? Math.round((totalAchieved / totalStoreTarget) * 100) : 0;
  return {
    summary: {
      store_target: totalStoreTarget,
      staff_target: totalStaffTarget,
      achieved: totalAchieved,
      shortfall,
      achievement_pct: pct,
      low_performers: staffTargets.filter(t => t.achievement_pct < 70).length,
      stores: storeTargets.length,
      staff_with_targets: staffTargets.length,
      target_achievers: staffTargets.filter(t => t.achievement_pct >= 100).length,
      stores_below_60: storeTargets.filter(t => t.achievement_pct < 60).length,
    },
    recent_changes: EMPTY_CC.recent_changes,
  };
}

function fmt(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${(v / 1000).toFixed(0)}K`;
}

function statusStyle(s: string) {
  if (s === "on_track" || s === "achieved") return { bg: "#DCFCE7", text: "#166534", border: "#BBF7D0", label: s === "achieved" ? "Achieved" : "On Track" };
  if (s === "watch") return { bg: "#FFF4D8", text: "#B7791F", border: "#F5D28A", label: "Watch" };
  if (s === "at_risk") return { bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA", label: "At Risk" };
  return { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB", label: s };
}

function pctBar(pct: number) {
  const color = pct >= 100 ? C.green : pct >= 80 ? C.gold : pct >= 60 ? C.orange : C.red;
  return { color, width: `${Math.min(pct, 100)}%` as any };
}

function SummaryCard({ label, value, color, icon: Icon }: { label: string; value: string; color?: string; icon?: any }) {
  return (
    <View style={styles.sumCard}>
      {Icon && <Icon size={16} color={color || C.navy} />}
      <Text style={[styles.sumValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.sumLabel}>{label}</Text>
    </View>
  );
}

function StoreTargetRow({ t }: { t: StoreTarget }) {
  const s = statusStyle(t.status);
  const pb = pctBar(t.achievement_pct);
  return (
    <View style={styles.targetRow}>
      <View style={styles.targetRowTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.targetStoreName} numberOfLines={1}>{t.store_name}</Text>
          <Text style={styles.targetMeta}>{t.store_code} · {t.city} · {t.zone}</Text>
          {t.manager && <Text style={styles.targetMeta}>Mgr: {t.manager}</Text>}
        </View>
        <View style={styles.targetRight}>
          <View style={[styles.statusBadge, { backgroundColor: s.bg, borderColor: s.border }]}>
            <Text style={[styles.statusBadgeText, { color: s.text }]}>{s.label}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => Alert.alert("Edit Target", `Edit target for ${t.store_name}`)}>
            <Edit3 size={13} color={C.orange} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.targetAmounts}>
        <View>
          <Text style={styles.amtLabel}>Target</Text>
          <Text style={styles.amtValue}>{fmt(t.target_amount)}</Text>
        </View>
        <View>
          <Text style={styles.amtLabel}>Achieved</Text>
          <Text style={[styles.amtValue, { color: C.green }]}>{fmt(t.achieved_amount)}</Text>
        </View>
        <View>
          <Text style={styles.amtLabel}>Shortfall</Text>
          <Text style={[styles.amtValue, { color: t.shortfall > 0 ? C.red : C.green }]}>{t.shortfall > 0 ? fmt(t.shortfall) : "—"}</Text>
        </View>
        <View>
          <Text style={styles.amtLabel}>Achieved%</Text>
          <Text style={[styles.amtValue, { color: pb.color }]}>{t.achievement_pct}%</Text>
        </View>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: pb.width, backgroundColor: pb.color }]} />
      </View>
      {t.admin_remark ? <Text style={styles.remark}>📝 {t.admin_remark}</Text> : null}
    </View>
  );
}

function StaffTargetRow({ t }: { t: StaffTarget }) {
  const s = statusStyle(t.status);
  const pb = pctBar(t.achievement_pct);
  return (
    <View style={styles.targetRow}>
      <View style={styles.targetRowTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.targetStoreName} numberOfLines={1}>{t.full_name}</Text>
          <Text style={styles.targetMeta}>{t.employee_code} · {t.department} · {t.designation}</Text>
          <Text style={styles.targetMeta}>{t.store_name}</Text>
        </View>
        <View style={styles.targetRight}>
          <View style={[styles.statusBadge, { backgroundColor: s.bg, borderColor: s.border }]}>
            <Text style={[styles.statusBadgeText, { color: s.text }]}>{s.label}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => Alert.alert("Edit Target", `Edit target for ${t.full_name}`)}>
            <Edit3 size={13} color={C.orange} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.targetAmounts}>
        <View><Text style={styles.amtLabel}>Target</Text><Text style={styles.amtValue}>{fmt(t.target_amount)}</Text></View>
        <View><Text style={styles.amtLabel}>Achieved</Text><Text style={[styles.amtValue, { color: C.green }]}>{fmt(t.achieved_amount)}</Text></View>
        <View><Text style={styles.amtLabel}>Ach%</Text><Text style={[styles.amtValue, { color: pb.color }]}>{t.achievement_pct}%</Text></View>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: pb.width, backgroundColor: pb.color }]} />
      </View>
    </View>
  );
}

export default function AdminTargetsScreen() {
  const { access_token } = useAuthStore();
  const [tab, setTab] = useState<TargetTab>("overview");
  const [period, setPeriod] = useState("May 2026");
  const [showPeriods, setShowPeriods] = useState(false);
  const [cc, setCC] = useState<CommandCenter>(EMPTY_CC);
  const [storeTargets, setStoreTargets] = useState<StoreTarget[]>([]);
  const [staffTargets, setStaffTargets] = useState<StaffTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [st, sf] = await Promise.all([fetchStoreTargets(period), fetchStaffTargets(period)]);
    setStoreTargets(st); setStaffTargets(sf);
    setCC(buildCC(st, sf));
    setLoading(false); setRefreshing(false);
  }, [period]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const sum = cc.summary;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.orange]} tintColor={C.orange} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <ChevronLeft size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>ADMIN · PERFORMANCE</Text>
                <Text style={styles.title}>Target Management</Text>
                <Text style={styles.subtitle}>Store & staff target planning and achievement tracking</Text>
              </View>
              <TouchableOpacity style={styles.periodBtn} onPress={() => setShowPeriods(!showPeriods)}>
                <Text style={styles.periodBtnText}>{period}</Text>
                {showPeriods ? <ChevronUp size={12} color={C.orange} /> : <ChevronDown size={12} color={C.orange} />}
              </TouchableOpacity>
            </View>

            {showPeriods && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
                {PERIODS.map(p => (
                  <TouchableOpacity key={p} style={[styles.periodChip, period === p && styles.periodChipActive]} onPress={() => { setPeriod(p); setShowPeriods(false); }}>
                    <Text style={[styles.periodChipText, period === p && styles.periodChipTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
              {(["overview", "stores", "staff", "logs"] as TargetTab[]).map(t => (
                <TouchableOpacity key={t} style={[styles.tabChip, tab === t && styles.tabChipActive]} onPress={() => setTab(t)}>
                  <Text style={[styles.tabChipText, tab === t && styles.tabChipTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}{t === "stores" ? " Targets" : t === "staff" ? " Targets" : t === "logs" ? " Logs" : ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {loading ? (
            <View style={styles.loadBox}><ActivityIndicator color={C.orange} size="large" /><Text style={styles.loadText}>Loading targets…</Text></View>
          ) : (
            <>
              {/* Overview Tab */}
              {tab === "overview" && (
                <View style={styles.section}>
                  <View style={styles.sumGrid}>
                    <SummaryCard label="Store Target" value={fmt(sum.store_target)} icon={Store} />
                    <SummaryCard label="Staff Target" value={fmt(sum.staff_target)} icon={Users} />
                    <SummaryCard label="Achieved" value={fmt(sum.achieved)} color={C.green} icon={TrendingUp} />
                    <SummaryCard label="Shortfall" value={fmt(sum.shortfall)} color={C.red} icon={TrendingDown} />
                    <SummaryCard label="Achievement %" value={`${sum.achievement_pct}%`} color={sum.achievement_pct >= 80 ? C.green : sum.achievement_pct >= 60 ? C.gold : C.red} icon={Target} />
                    <SummaryCard label="Low Performers" value={sum.low_performers} color={C.red} icon={AlertTriangle} />
                    <SummaryCard label="Stores" value={sum.stores} icon={Store} />
                    <SummaryCard label="Staff w/ Targets" value={sum.staff_with_targets} icon={Users} />
                    <SummaryCard label="Achievers" value={sum.target_achievers} color={C.green} icon={Trophy} />
                    <SummaryCard label="Below 60%" value={sum.stores_below_60} color={C.red} icon={AlertTriangle} />
                  </View>

                  <Text style={styles.sectionTitle}>Recent Target Changes</Text>
                  {cc.recent_changes.map(rc => (
                    <View key={rc.id} style={styles.logRow}>
                      <Clock size={12} color={C.muted} style={{ marginTop: 2 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.logStore}>{rc.store}</Text>
                        <Text style={styles.logDetail}>{rc.field}: {rc.old_val} → {rc.new_val}</Text>
                        <Text style={styles.logMeta}>{rc.changed_by} · {rc.changed_at}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Store Targets Tab */}
              {tab === "stores" && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{storeTargets.length} Stores</Text>
                    <TouchableOpacity style={styles.syncBtn} onPress={() => Alert.alert("Sync", "Syncing store targets…")}>
                      <RefreshCw size={13} color={C.orange} />
                      <Text style={styles.syncBtnText}>Sync</Text>
                    </TouchableOpacity>
                  </View>
                  {storeTargets.map(t => <StoreTargetRow key={t.id} t={t} />)}
                </View>
              )}

              {/* Staff Targets Tab */}
              {tab === "staff" && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{staffTargets.length} Staff</Text>
                    <TouchableOpacity style={styles.syncBtn} onPress={() => Alert.alert("Export", "Exporting staff targets as CSV…")}>
                      <FileText size={13} color={C.orange} />
                      <Text style={styles.syncBtnText}>Export</Text>
                    </TouchableOpacity>
                  </View>
                  {staffTargets.map(t => <StaffTargetRow key={t.id} t={t} />)}
                </View>
              )}

              {/* Change Logs Tab */}
              {tab === "logs" && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Change Logs</Text>
                  {cc.recent_changes.map(rc => (
                    <View key={rc.id} style={styles.logRow}>
                      <Clock size={12} color={C.muted} style={{ marginTop: 2 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.logStore}>{rc.store} · {rc.field}</Text>
                        <Text style={styles.logDetail}>{rc.old_val} → <Text style={{ color: C.orange }}>{rc.new_val}</Text></Text>
                        <Text style={styles.logMeta}>{rc.changed_by} · {rc.changed_at}</Text>
                      </View>
                    </View>
                  ))}
                  <View style={styles.logRow}>
                    <Clock size={12} color={C.muted} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.logStore}>HT-AMD-001 · target_amount</Text>
                      <Text style={styles.logDetail}>₹55L → <Text style={{ color: C.orange }}>₹59L</Text></Text>
                      <Text style={styles.logMeta}>Admin · 2026-05-20 10:15</Text>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
        <AdminBottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.beige },
  root: { flex: 1, backgroundColor: C.beige },
  scroll: { flex: 1 },
  content: { paddingBottom: 100, gap: 12 },
  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 16, paddingTop: 18, paddingBottom: 14,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30, gap: 12,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.13)", alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: 9, fontWeight: "900", color: C.orange, letterSpacing: 1 },
  title: { fontSize: 20, fontWeight: "900", color: "#FFFFFF", marginTop: 2 },
  subtitle: { fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: "600", marginTop: 2 },
  periodBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.cream, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  periodBtnText: { fontSize: 11, fontWeight: "900", color: C.navy },
  periodScroll: { marginBottom: 2 },
  periodChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", marginRight: 6 },
  periodChipActive: { backgroundColor: C.orange, borderColor: C.orange },
  periodChipText: { fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.7)" },
  periodChipTextActive: { color: "#FFFFFF" },
  tabScroll: { marginBottom: 2 },
  tabChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", marginRight: 6 },
  tabChipActive: { backgroundColor: C.orange, borderColor: C.orange },
  tabChipText: { fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.65)" },
  tabChipTextActive: { color: "#FFFFFF" },
  loadBox: { alignItems: "center", paddingVertical: 40, gap: 10 },
  loadText: { color: C.muted, fontSize: 13, fontWeight: "700" },
  section: { marginHorizontal: 16, gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 14, fontWeight: "900", color: C.navy },
  sumGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sumCard: { width: "48%", backgroundColor: C.cream, borderRadius: 16, borderWidth: 1, borderColor: "#EAD7C2", padding: 12, gap: 4 },
  sumValue: { fontSize: 16, fontWeight: "900", color: C.navy },
  sumLabel: { fontSize: 10, fontWeight: "700", color: C.muted },
  targetRow: { backgroundColor: C.cream, borderRadius: 18, borderWidth: 1, borderColor: "#EAD7C2", padding: 12, gap: 10 },
  targetRowTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  targetStoreName: { fontSize: 13, fontWeight: "900", color: C.navy },
  targetMeta: { fontSize: 10, color: C.muted, fontWeight: "600", marginTop: 2 },
  targetRight: { gap: 6, alignItems: "flex-end" },
  statusBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  statusBadgeText: { fontSize: 10, fontWeight: "900" },
  editBtn: { width: 28, height: 28, borderRadius: 10, backgroundColor: "#FFF1E5", borderWidth: 1, borderColor: "#FED7AA", alignItems: "center", justifyContent: "center" },
  targetAmounts: { flexDirection: "row", justifyContent: "space-between" },
  amtLabel: { fontSize: 9, fontWeight: "700", color: C.muted, textTransform: "uppercase" },
  amtValue: { fontSize: 13, fontWeight: "900", color: C.navy, marginTop: 2 },
  barBg: { height: 5, backgroundColor: "#EAD7C2", borderRadius: 999, overflow: "hidden" },
  barFill: { height: 5, borderRadius: 999 },
  remark: { fontSize: 10, color: C.brown, fontWeight: "600", fontStyle: "italic" },
  logRow: { flexDirection: "row", gap: 10, backgroundColor: C.cream, borderRadius: 14, borderWidth: 1, borderColor: "#EAD7C2", padding: 12 },
  logStore: { fontSize: 12, fontWeight: "900", color: C.navy },
  logDetail: { fontSize: 11, color: C.muted, fontWeight: "700", marginTop: 2 },
  logMeta: { fontSize: 10, color: C.muted, fontWeight: "600", marginTop: 3 },
  syncBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#FFF1E5", borderRadius: 999, borderWidth: 1, borderColor: "#FED7AA", paddingHorizontal: 10, paddingVertical: 6 },
  syncBtnText: { fontSize: 11, fontWeight: "800", color: C.orange },
  bottomSpacer: { height: 14 },
});
