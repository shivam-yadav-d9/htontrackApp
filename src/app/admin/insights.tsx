import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { api } from "@/services/api";
import {
  AlertTriangle, BarChart3, CheckCircle2, ClipboardList,
  Download, FileText, Plus, Sparkles, Store, Target, TrendingDown, TrendingUp,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  navy: "#102B45", orange: "#C95F18", gold: "#B7791F", beige: "#F6EBDC",
  cream: "#FFFDF8", muted: "#8A8178", white: "#FFFFFF", green: "#166534",
  red: "#B91C1C", amber: "#92400E",
};

// ── Mock Data — Checklists ─────────────────────────────────────────────────────

type ChecklistType = "Store Opening" | "Store Closing" | "Festive Ready" | "Big Event / Anniversary" | "Offers / Promotion" | "Daily SOP" | "Safety & Compliance";

const CHECKLIST_TYPE_COLOR: Record<ChecklistType, { bg: string; text: string }> = {
  "Store Opening":           { bg: "#DCFCE7", text: "#166534" },
  "Store Closing":           { bg: "#DBEAFE", text: "#1E40AF" },
  "Festive Ready":           { bg: "#FEF9C3", text: "#854D0E" },
  "Big Event / Anniversary": { bg: "#EDE9FE", text: "#5B21B6" },
  "Offers / Promotion":      { bg: "#FFEDD5", text: "#C2410C" },
  "Daily SOP":               { bg: "#F3F4F6", text: "#374151" },
  "Safety & Compliance":     { bg: "#FEE2E2", text: "#B91C1C" },
};


// ── Mock Data — Reports ────────────────────────────────────────────────────────

const ANOMALIES: { store: string; metric: string; drop: string; severity: string; action: string }[] = [];
const AI_INSIGHTS: { title: string; body: string; impact: string; tone: string }[] = [];

const REPORT_TYPES = [
  { id: "attendance", label: "Attendance Report", sub: "Daily, weekly, monthly attendance by store", icon: CheckCircle2, color: "#166534" },
  { id: "sales", label: "Sales & Target Report", sub: "Achievement vs target by store and staff", icon: Target, color: C.navy },
  { id: "course", label: "Course Completion", sub: "Training progress and certification stats", icon: BarChart3, color: C.gold },
  { id: "conversion", label: "Conversion Report", sub: "Lead funnel and category-wise performance", icon: TrendingUp, color: C.orange },
  { id: "incentive", label: "Incentive Summary", sub: "Approved, paid, pending payouts", icon: FileText, color: "#7C3AED" },
  { id: "anomaly", label: "Anomaly Report", sub: "Store-level metric dips and alerts", icon: AlertTriangle, color: C.red },
];

// ── API Fetchers ───────────────────────────────────────────────────────────────

async function fetchChecklists() {
  try {
    const data = await api.get<any>('/admin/checklists/templates');
    const items: any[] = Array.isArray(data) ? data : (data?.items ?? data?.templates ?? data?.data ?? []);
    return items;
  } catch { return []; }
}

// ── Components ─────────────────────────────────────────────────────────────────

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={ss.pbarBg}>
      <View style={[ss.pbarFill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    High:   { bg: "#FEE2E2", text: "#B91C1C" },
    Medium: { bg: "#FEF3C7", text: "#92400E" },
    Low:    { bg: "#F3F4F6", text: "#6B7280" },
  };
  const s = map[severity] ?? { bg: "#F3F4F6", text: "#6B7280" };
  return (
    <View style={[ss.badge, { backgroundColor: s.bg }]}>
      <Text style={[ss.badgeTxt, { color: s.text }]}>{severity}</Text>
    </View>
  );
}

// ── Checklists Tab ─────────────────────────────────────────────────────────────

function ChecklistsTab() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    fetchChecklists().then((d) => { setTemplates(d); setLoading(false); });
  }, []);

  const totalItems = templates.reduce((a, r) => a + r.items, 0);
  const avgCompletion = templates.length ? Math.round(templates.reduce((a, r) => a + r.completion, 0) / templates.length) : 0;

  const TYPES = Array.from(new Set(templates.map((t) => t.type))) as ChecklistType[];
  const filtered = typeFilter ? templates.filter((t) => t.type === typeFilter) : templates;

  return (
    <View style={{ gap: 12 }}>
      {/* Stats */}
      <View style={ss.kpiRow}>
        <View style={ss.kpiCard}>
          <Text style={ss.kpiVal}>{templates.length}</Text>
          <Text style={ss.kpiLbl}>Templates</Text>
        </View>
        <View style={ss.kpiCard}>
          <Text style={ss.kpiVal}>{totalItems}</Text>
          <Text style={ss.kpiLbl}>Total Items</Text>
        </View>
        <View style={ss.kpiCard}>
          <Text style={ss.kpiVal}>14</Text>
          <Text style={ss.kpiLbl}>Stores</Text>
        </View>
        <View style={ss.kpiCard}>
          <Text style={[ss.kpiVal, { color: C.green }]}>{avgCompletion}%</Text>
          <Text style={ss.kpiLbl}>Avg Done</Text>
        </View>
      </View>

      {/* Type filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
        <TouchableOpacity onPress={() => setTypeFilter("")} style={[ss.chip, typeFilter === "" && ss.chipActive]}>
          <Text style={[ss.chipTxt, typeFilter === "" && ss.chipTxtActive]}>All Types</Text>
        </TouchableOpacity>
        {TYPES.map((t) => {
          const color = CHECKLIST_TYPE_COLOR[t];
          return (
            <TouchableOpacity key={t} onPress={() => setTypeFilter(t === typeFilter ? "" : t)}
              style={[ss.chip, typeFilter === t && { backgroundColor: color.bg, borderColor: color.bg }]}>
              <Text style={[ss.chipTxt, typeFilter === t && { color: color.text }]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={ss.createBtn} onPress={() => Alert.alert("Create Checklist", "Checklist creation form opens here.")}>
        <Plus size={14} color={C.white} />
        <Text style={ss.createBtnTxt}>Create Checklist</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator color={C.navy} /> : filtered.map((t) => {
        const tc = CHECKLIST_TYPE_COLOR[t.type as ChecklistType] ?? { bg: "#F3F4F6", text: "#374151" };
        const barColor = t.completion >= 90 ? C.green : t.completion >= 70 ? C.navy : C.amber;
        return (
          <View key={t.id} style={ss.card}>
            <View style={ss.row}>
              <View style={{ flex: 1 }}>
                <Text style={ss.cardTitle}>{t.title}</Text>
                <Text style={ss.cardSub}>{t.role} · {t.frequency}</Text>
              </View>
              <View style={[ss.badge, { backgroundColor: tc.bg }]}>
                <Text style={[ss.badgeTxt, { color: tc.text }]}>{t.type}</Text>
              </View>
            </View>
            <View style={[ss.row, { marginTop: 8 }]}>
              <Text style={ss.cardSub}>{t.items} items</Text>
              <View style={[ss.badge, { backgroundColor: t.priority === "High" ? "#FEE2E2" : "#FEF3C7" }]}>
                <Text style={[ss.badgeTxt, { color: t.priority === "High" ? C.red : C.amber }]}>{t.priority}</Text>
              </View>
              <Text style={[ss.cardTitle, { color: barColor, marginLeft: "auto" as any }]}>{t.completion}%</Text>
            </View>
            <ProgressBar pct={t.completion} color={barColor} />
          </View>
        );
      })}

      {/* Past completions note */}
      <Text style={ss.sectionTitle}>Past Completions</Text>
      <View style={[ss.card, { alignItems: "center", paddingVertical: 20 }]}>
        <Text style={[ss.cardSub, { textAlign: "center" }]}>
          Past completion history loads from backend checklist submissions.
          {"\n"}See the Checklists page for full history.
        </Text>
      </View>
    </View>
  );
}

// ── Reports Tab ────────────────────────────────────────────────────────────────

function ReportsTab() {
  const [range, setRange] = useState("30d");
  const RANGES = ["7d", "30d", "90d", "YTD"];

  const toneColor: Record<string, string> = {
    success: "#166534", navy: C.navy, warning: C.amber, burnt: C.orange,
  };
  const toneBg: Record<string, string> = {
    success: "#DCFCE7", navy: "#E0E7FF", warning: "#FEF3C7", burnt: "#FFEDD5",
  };

  return (
    <View style={{ gap: 14 }}>
      {/* Range selector */}
      <View style={ss.rangeRow}>
        {RANGES.map((r) => (
          <TouchableOpacity key={r} onPress={() => setRange(r)}
            style={[ss.rangeBtn, range === r && ss.rangeBtnActive]}>
            <Text style={[ss.rangeTxt, range === r && ss.rangeTxtActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* KPI row */}
      <View style={ss.kpiRow}>
        <View style={ss.kpiCard}>
          <TrendingUp size={13} color={C.green} />
          <Text style={ss.kpiVal}>HT-Kolkata</Text>
          <Text style={ss.kpiLbl}>Top Growing</Text>
        </View>
        <View style={ss.kpiCard}>
          <TrendingDown size={13} color={C.red} />
          <Text style={ss.kpiVal}>Aurangabad</Text>
          <Text style={ss.kpiLbl}>Needs Attention</Text>
        </View>
        <View style={ss.kpiCard}>
          <AlertTriangle size={13} color={C.amber} />
          <Text style={ss.kpiVal}>{ANOMALIES.length}</Text>
          <Text style={ss.kpiLbl}>Anomalies</Text>
        </View>
        <View style={ss.kpiCard}>
          <Target size={13} color={C.navy} />
          <Text style={ss.kpiVal}>103%</Text>
          <Text style={ss.kpiLbl}>Goal Pacing</Text>
        </View>
      </View>

      {/* AI Insights */}
      <Text style={ss.sectionTitle}>AI Insights</Text>
      {AI_INSIGHTS.map((ins, i) => (
        <View key={i} style={[ss.insightCard, { borderLeftColor: toneColor[ins.tone], backgroundColor: toneBg[ins.tone] + "20" }]}>
          <View style={ss.row}>
            <View style={[ss.insightIcon, { backgroundColor: C.white }]}>
              <Sparkles size={13} color={C.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ss.cardTitle}>{ins.title}</Text>
              <Text style={[ss.cardSub, { marginTop: 3 }]}>{ins.body}</Text>
              <View style={[ss.row, { marginTop: 6, justifyContent: "space-between" }]}>
                <Text style={[ss.badgeTxt, { color: toneColor[ins.tone], textTransform: "uppercase", letterSpacing: 0.5 }]}>{ins.impact}</Text>
                <TouchableOpacity onPress={() => Alert.alert("Apply Insight", ins.title)}>
                  <Text style={[ss.badgeTxt, { color: C.navy }]}>Apply →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ))}

      {/* Anomalies */}
      <Text style={ss.sectionTitle}>Store Anomalies</Text>
      {ANOMALIES.map((a, i) => (
        <View key={i} style={ss.card}>
          <View style={ss.row}>
            <View style={{ flex: 1 }}>
              <Text style={ss.cardTitle}>{a.store}</Text>
              <Text style={ss.cardSub}>{a.metric} · {a.drop}</Text>
            </View>
            <SeverityBadge severity={a.severity} />
          </View>
          <Text style={[ss.cardSub, { color: C.navy, marginTop: 6 }]}>Action: {a.action}</Text>
        </View>
      ))}

      {/* Report downloads */}
      <Text style={ss.sectionTitle}>Download Reports</Text>
      {REPORT_TYPES.map((rep) => {
        const Icon = rep.icon;
        return (
          <TouchableOpacity key={rep.id} style={ss.reportRow}
            onPress={() => Alert.alert("Generate Report", `Generating ${rep.label}…`)}>
            <View style={[ss.reportIcon, { backgroundColor: rep.color + "20" }]}>
              <Icon size={16} color={rep.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ss.cardTitle}>{rep.label}</Text>
              <Text style={ss.cardSub}>{rep.sub}</Text>
            </View>
            <Download size={16} color={C.muted} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "checklists", label: "Checklists", icon: ClipboardList },
  { id: "reports",    label: "Reports",    icon: BarChart3 },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function InsightsScreen() {
  const [tab, setTab] = useState<TabId>("checklists");
  const [refreshing, setRefreshing] = useState(false);

  return (
    <SafeAreaView style={ss.safe} edges={["top"]}>
      <View style={ss.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); }} tintColor={C.orange} />}
          contentContainerStyle={ss.scrollContent}
        >
          {/* Header */}
          <View style={ss.header}>
            <Text style={ss.eyebrow}>INSIGHTS & REPORTS</Text>
            <Text style={ss.title}>Checklists & Reports</Text>
            <Text style={ss.subtitle}>Manage store checklists · Trends, anomalies, and enterprise reports.</Text>

            {/* Tab bar inside header */}
            <View style={ss.tabRow}>
              {TABS.map(({ id, label, icon: Icon }) => (
                <TouchableOpacity key={id} onPress={() => setTab(id)}
                  style={[ss.tabBtn, tab === id && ss.tabBtnActive]}>
                  <Icon size={13} color={tab === id ? C.navy : "rgba(255,255,255,0.7)"} />
                  <Text style={[ss.tabTxt, tab === id && ss.tabTxtActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ padding: 16, paddingBottom: 100, gap: 12 }}>
            {tab === "checklists" && <ChecklistsTab />}
            {tab === "reports" && <ReportsTab />}
          </View>
        </ScrollView>

        <AdminBottomNav />
      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const ss = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },
  root: { flex: 1, backgroundColor: C.beige },
  scrollContent: { flexGrow: 1 },
  header: { backgroundColor: C.navy, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  eyebrow: { fontSize: 10, fontWeight: "800", color: C.orange, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "800", color: C.white },
  subtitle: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 4 },
  tabRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  tabBtnActive: { backgroundColor: C.white },
  tabTxt: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.8)" },
  tabTxtActive: { color: C.navy },
  card: { backgroundColor: C.white, borderRadius: 14, padding: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: C.navy },
  cardSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeTxt: { fontSize: 10, fontWeight: "700" },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: C.navy, letterSpacing: 0.5, marginTop: 4 },
  kpiRow: { flexDirection: "row", gap: 8 },
  kpiCard: { flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 10, alignItems: "center", gap: 3 },
  kpiVal: { fontSize: 13, fontWeight: "800", color: C.navy, textAlign: "center" },
  kpiLbl: { fontSize: 9, color: C.muted, textAlign: "center" },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: C.white, borderWidth: 1, borderColor: "#E5E7EB" },
  chipActive: { backgroundColor: C.navy, borderColor: C.navy },
  chipTxt: { fontSize: 11, fontWeight: "700", color: C.muted },
  chipTxtActive: { color: C.white },
  pbarBg: { height: 5, backgroundColor: "#E5E7EB", borderRadius: 3, overflow: "hidden", marginTop: 4 },
  pbarFill: { height: 5, borderRadius: 3 },
  createBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.navy, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14, alignSelf: "flex-start" },
  createBtnTxt: { fontSize: 12, fontWeight: "700", color: C.white },
  insightCard: { borderRadius: 14, padding: 14, borderLeftWidth: 4 },
  insightIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rangeRow: { flexDirection: "row", backgroundColor: "#E5E7EB", borderRadius: 10, padding: 3, gap: 2 },
  rangeBtn: { flex: 1, paddingVertical: 6, alignItems: "center", borderRadius: 8 },
  rangeBtnActive: { backgroundColor: C.white, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  rangeTxt: { fontSize: 11, fontWeight: "700", color: C.muted },
  rangeTxtActive: { color: C.navy },
  reportRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.white, borderRadius: 12, padding: 14 },
  reportIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
