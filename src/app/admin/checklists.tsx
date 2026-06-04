import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { adminDataService } from "@/services/team.service";
import { api } from "@/services/api";
import { router } from "expo-router";
import {
  AlertTriangle, BarChart3, CheckCircle2, ChevronDown, ChevronRight,
  ChevronUp, ClipboardCheck, ClipboardList, Download, Filter,
  RefreshCcw, Search, Shield, Star, Store, Users,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, RefreshControl, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  navy: "#102B45", orange: "#C95F18", gold: "#B7791F", beige: "#F6EBDC",
  cream: "#FFFDF8", muted: "#8A8178", white: "#FFFFFF", green: "#166534",
  red: "#B91C1C", amber: "#92400E",
  greenBg: "#DCFCE7", greenBorder: "#BBF7D0",
  redBg: "#FEE2E2", redBorder: "#FECACA",
  goldBg: "#FFF4D8", goldBorder: "#F5D28A",
  blueBg: "#EAF2FB", blueBorder: "#C9DBEF",
};

type ViewTab = "templates" | "store_compliance" | "past";
type FreqFilter = "all" | "daily" | "weekly" | "monthly" | "per_job" | "event";

interface ChecklistTemplate {
  template_id: string;
  title: string;
  category: string;
  target_roles: string[];
  frequency: string;
  description: string;
  estimated_minutes: number;
  data_source: string;
  created_at: string;
  updated_at: string;
  item_count?: number;
  assigned_stores?: number;
  completion_rate?: number;
  status?: string;
}

interface StoreCompliance {
  store_code: string;
  store_name: string;
  city: string;
  zone: string;
  template_id: string;
  template_title: string;
  frequency: string;
  total_assigned: number;
  completed: number;
  pending: number;
  overdue: number;
  completion_pct: number;
  last_completed_at: string | null;
  data_source: string;
}

interface PastCompletion {
  id: string;
  title: string;
  period: string;
  stores: number;
  staff: number;
  completion: number;
  due_date: string;
  data_source: string;
}

const FREQ_COLOR: Record<string, { bg: string; text: string }> = {
  daily:   { bg: "#DCFCE7", text: "#166534" },
  weekly:  { bg: "#DBEAFE", text: "#1E40AF" },
  monthly: { bg: "#FEF9C3", text: "#854D0E" },
  per_job: { bg: "#EDE9FE", text: "#5B21B6" },
  event:   { bg: "#FFEDD5", text: "#C2410C" },
};

const CAT_COLOR: Record<string, { bg: string; text: string }> = {
  "Daily Operations":    { bg: "#DCFCE7", text: "#166534" },
  "Installation":        { bg: "#EDE9FE", text: "#5B21B6" },
  "Display & VM":        { bg: "#DBEAFE", text: "#1E40AF" },
  "Warehouse":           { bg: "#FEF9C3", text: "#854D0E" },
  "Customer Service":    { bg: "#FFEDD5", text: "#C2410C" },
  "Safety & Compliance": { bg: "#FEE2E2", text: "#B91C1C" },
};

function datasourceBadge(src: string): { label: string; bg: string; text: string } {
  if (src === "real" || src === "real_employee_master") return { label: "Real", bg: "#DCFCE7", text: "#166534" };
  if (src === "seeded") return { label: "Seeded", bg: "#FEF9C3", text: "#854D0E" };
  if (src === "derived") return { label: "Derived", bg: "#DBEAFE", text: "#1E40AF" };
  return { label: "—", bg: "#F3F4F6", text: "#6B7280" };
}

function complianceBadge(pct: number): { bg: string; text: string; border: string } {
  if (pct >= 85) return { bg: C.greenBg, text: C.green, border: C.greenBorder };
  if (pct >= 60) return { bg: C.goldBg, text: C.amber, border: C.goldBorder };
  return { bg: C.redBg, text: C.red, border: C.redBorder };
}

function TemplateCard({ tmpl, onPress }: { tmpl: ChecklistTemplate; onPress(): void }) {
  const fc = FREQ_COLOR[tmpl.frequency] ?? { bg: "#F3F4F6", text: "#374151" };
  const cc = CAT_COLOR[tmpl.category] ?? { bg: "#F3F4F6", text: "#374151" };
  const ds = datasourceBadge(tmpl.data_source ?? "");
  const compPct = tmpl.completion_rate ?? 0;
  const cpb = complianceBadge(compPct);

  return (
    <TouchableOpacity style={ss.card} onPress={onPress} activeOpacity={0.8}>
      <View style={ss.row}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={ss.cardTitle} numberOfLines={2}>{tmpl.title}</Text>
          <Text style={ss.cardSub}>{tmpl.description}</Text>
        </View>
        <ChevronRight size={14} color={C.muted} />
      </View>

      <View style={[ss.row, { marginTop: 8, gap: 6, flexWrap: "wrap" }]}>
        <View style={[ss.badge, { backgroundColor: fc.bg }]}>
          <Text style={[ss.badgeTxt, { color: fc.text }]}>{tmpl.frequency}</Text>
        </View>
        <View style={[ss.badge, { backgroundColor: cc.bg }]}>
          <Text style={[ss.badgeTxt, { color: cc.text }]}>{tmpl.category}</Text>
        </View>
        <View style={[ss.badge, { backgroundColor: ds.bg }]}>
          <Text style={[ss.badgeTxt, { color: ds.text }]}>{ds.label}</Text>
        </View>
      </View>

      <View style={[ss.row, { marginTop: 10, gap: 16 }]}>
        <View style={ss.statMini}>
          <Text style={ss.statMiniVal}>{tmpl.item_count ?? "—"}</Text>
          <Text style={ss.statMiniLbl}>Items</Text>
        </View>
        <View style={ss.statMini}>
          <Text style={ss.statMiniVal}>{tmpl.assigned_stores ?? "—"}</Text>
          <Text style={ss.statMiniLbl}>Stores</Text>
        </View>
        <View style={ss.statMini}>
          <Text style={[ss.statMiniVal, { color: cpb.text }]}>{compPct}%</Text>
          <Text style={ss.statMiniLbl}>Completion</Text>
        </View>
        <View style={ss.statMini}>
          <Text style={ss.statMiniVal}>{tmpl.estimated_minutes}m</Text>
          <Text style={ss.statMiniLbl}>Est. Time</Text>
        </View>
      </View>

      {compPct > 0 && (
        <View style={ss.pbarBg}>
          <View style={[ss.pbarFill, { width: `${Math.min(compPct, 100)}%` as any, backgroundColor: cpb.text }]} />
        </View>
      )}

      <Text style={ss.rolesLine}>
        Roles: {tmpl.target_roles.join(", ")}
      </Text>
    </TouchableOpacity>
  );
}

function StoreComplianceRow({ row }: { row: StoreCompliance }) {
  const cpb = complianceBadge(row.completion_pct);
  return (
    <View style={ss.complianceRow}>
      <View style={{ flex: 1 }}>
        <Text style={ss.cardTitle} numberOfLines={1}>{row.store_name}</Text>
        <Text style={ss.cardSub}>{row.city} · {row.zone}</Text>
        <Text style={[ss.cardSub, { marginTop: 2 }]}>{row.template_title}</Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <View style={[ss.badge, { backgroundColor: cpb.bg, borderColor: cpb.border }]}>
          <Text style={[ss.badgeTxt, { color: cpb.text }]}>{row.completion_pct}%</Text>
        </View>
        <Text style={ss.cardSub}>{row.completed}/{row.total_assigned}</Text>
        {row.overdue > 0 && (
          <View style={[ss.badge, { backgroundColor: C.redBg }]}>
            <AlertTriangle size={10} color={C.red} />
            <Text style={[ss.badgeTxt, { color: C.red }]}>{row.overdue} overdue</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function PastCompletionRow({ row }: { row: PastCompletion }) {
  const cpb = complianceBadge(row.completion);
  const ds = datasourceBadge(row.data_source ?? "seeded");
  return (
    <View style={ss.complianceRow}>
      <View style={{ flex: 1 }}>
        <Text style={ss.cardTitle}>{row.title}</Text>
        <Text style={ss.cardSub}>{row.period} · Due: {row.due_date}</Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <View style={[ss.badge, { backgroundColor: cpb.bg }]}>
          <Text style={[ss.badgeTxt, { color: cpb.text }]}>{row.completion}%</Text>
        </View>
        <Text style={ss.cardSub}>{row.stores} stores · {row.staff} staff</Text>
        <View style={[ss.badge, { backgroundColor: ds.bg }]}>
          <Text style={[ss.badgeTxt, { color: ds.text }]}>{ds.label}</Text>
        </View>
      </View>
    </View>
  );
}

export default function ChecklistsPage() {
  const [tab, setTab] = useState<ViewTab>("templates");
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [compliance, setCompliance] = useState<StoreCompliance[]>([]);
  const [past, setPast] = useState<PastCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [freqFilter, setFreqFilter] = useState<FreqFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [tmplRes, joinedRes] = await Promise.allSettled([
        api.get<any>('/admin/checklists/templates'),
        adminDataService.getChecklistsJoined({ limit: 100 }),
      ]);

      if (tmplRes.status === "fulfilled") {
        const raw = tmplRes.value;
        const items: any[] = Array.isArray(raw) ? raw : (raw?.data ?? raw?.items ?? []);
        setTemplates(items.map((t: any) => ({
          template_id: t.template_id ?? t.id ?? "",
          title: t.title ?? "",
          category: t.category ?? "—",
          target_roles: t.target_roles ?? [],
          frequency: t.frequency ?? "—",
          description: t.description ?? "",
          estimated_minutes: t.estimated_minutes ?? 0,
          data_source: t.data_source ?? t.base_source ?? "seeded",
          created_at: t.created_at ?? "",
          updated_at: t.updated_at ?? "",
          item_count: t.item_count ?? t.items_count ?? null,
          assigned_stores: t.assigned_stores ?? null,
          completion_rate: t.completion_rate ?? null,
          status: t.status ?? "active",
        })));
      }

      if (joinedRes.status === "fulfilled") {
        const raw = joinedRes.value;
        const items: any[] = Array.isArray(raw) ? raw : (raw?.data ?? raw?.items ?? []);
        const compRows: StoreCompliance[] = items.map((r: any) => ({
          store_code: r.store_code ?? r.site_code ?? "",
          store_name: r.store_name ?? "",
          city: r.city ?? "",
          zone: r.zone ?? "",
          template_id: r.template_id ?? "",
          template_title: r.template_title ?? r.title ?? "",
          frequency: r.frequency ?? "",
          total_assigned: r.total_assigned ?? 0,
          completed: r.completed ?? 0,
          pending: r.pending ?? 0,
          overdue: r.overdue ?? 0,
          completion_pct: r.completion_pct ?? r.completion_rate ?? 0,
          last_completed_at: r.last_completed_at ?? null,
          data_source: r.data_source ?? "seeded",
        }));
        setCompliance(compRows);

        const pastRaw = await api.get<any>('/admin/checklists/past-completions').catch(() => []);
        const pastItems: any[] = Array.isArray(pastRaw) ? pastRaw : (pastRaw?.data ?? pastRaw?.items ?? []);
        setPast(pastItems.map((p: any) => ({
          id: p.id ?? p.template_id ?? "",
          title: p.title ?? "",
          period: p.period ?? "",
          stores: p.stores ?? p.store_count ?? 0,
          staff: p.staff ?? p.staff_count ?? 0,
          completion: p.completion ?? p.completion_pct ?? 0,
          due_date: p.due_date ?? p.completed_at ?? "",
          data_source: p.data_source ?? "seeded",
        })));
      }
    } catch (e: any) {
      setError("Could not load checklist data. Check API connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = useCallback(() => { setRefreshing(true); loadAll(); }, [loadAll]);

  const TABS: { key: ViewTab; label: string; icon: React.ReactNode }[] = [
    { key: "templates", label: "Templates", icon: <ClipboardList size={13} color={C.navy} /> },
    { key: "store_compliance", label: "Compliance", icon: <BarChart3 size={13} color={C.navy} /> },
    { key: "past", label: "History", icon: <CheckCircle2 size={13} color={C.navy} /> },
  ];

  const FREQS: { key: FreqFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "per_job", label: "Per Job" },
    { key: "event", label: "Event" },
  ];

  const filteredTemplates = templates.filter((t) => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
    const matchFreq = freqFilter === "all" || t.frequency === freqFilter;
    return matchSearch && matchFreq;
  });

  const filteredCompliance = compliance.filter((c) => {
    return !search || c.store_name.toLowerCase().includes(search.toLowerCase()) || c.template_title.toLowerCase().includes(search.toLowerCase());
  });

  const totalTemplates = templates.length;
  const dailyCount = templates.filter((t) => t.frequency === "daily").length;
  const avgCompletion = templates.length
    ? Math.round(templates.filter((t) => t.completion_rate != null).reduce((s, t) => s + (t.completion_rate ?? 0), 0) / Math.max(templates.filter((t) => t.completion_rate != null).length, 1))
    : 0;
  const overdueCount = compliance.reduce((s, r) => s + r.overdue, 0);

  return (
    <SafeAreaView style={ss.safe} edges={["top"]}>
      <View style={ss.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.orange} />}
          contentContainerStyle={ss.scrollContent}
        >
          {/* Header */}
          <View style={ss.header}>
            <Text style={ss.eyebrow}>OPERATIONS</Text>
            <Text style={ss.title}>Checklists</Text>
            <Text style={ss.subtitle}>Checklist templates, store compliance, and completion history.</Text>
          </View>

          <View style={{ padding: 16, gap: 14, paddingBottom: 100 }}>
            {/* KPI row */}
            <View style={ss.kpiRow}>
              <View style={ss.kpiCard}>
                <ClipboardList size={14} color={C.navy} />
                <Text style={ss.kpiVal}>{totalTemplates}</Text>
                <Text style={ss.kpiLbl}>Templates</Text>
              </View>
              <View style={ss.kpiCard}>
                <RefreshCcw size={14} color={C.orange} />
                <Text style={ss.kpiVal}>{dailyCount}</Text>
                <Text style={ss.kpiLbl}>Daily</Text>
              </View>
              <View style={ss.kpiCard}>
                <CheckCircle2 size={14} color={C.green} />
                <Text style={ss.kpiVal}>{avgCompletion}%</Text>
                <Text style={ss.kpiLbl}>Avg. Compl.</Text>
              </View>
              <View style={ss.kpiCard}>
                <AlertTriangle size={14} color={overdueCount > 0 ? C.red : C.muted} />
                <Text style={[ss.kpiVal, { color: overdueCount > 0 ? C.red : C.navy }]}>{overdueCount}</Text>
                <Text style={ss.kpiLbl}>Overdue</Text>
              </View>
            </View>

            {/* Error banner */}
            {error && (
              <View style={ss.errorBanner}>
                <AlertTriangle size={14} color={C.red} />
                <Text style={ss.errorText}>{error}</Text>
              </View>
            )}

            {/* Tabs */}
            <View style={ss.tabRow}>
              {TABS.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[ss.tabBtn, tab === t.key && ss.tabBtnActive]}
                  onPress={() => setTab(t.key)}
                >
                  {t.icon}
                  <Text style={[ss.tabBtnTxt, tab === t.key && ss.tabBtnTxtActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search */}
            <View style={ss.searchRow}>
              <Search size={14} color={C.muted} />
              <TextInput
                style={ss.searchInput}
                placeholder="Search checklists..."
                placeholderTextColor={C.muted}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Frequency chips — only on templates tab */}
            {tab === "templates" && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
                {FREQS.map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    style={[ss.chip, freqFilter === f.key && ss.chipActive]}
                    onPress={() => setFreqFilter(f.key)}
                  >
                    <Text style={[ss.chipTxt, freqFilter === f.key && ss.chipTxtActive]}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {loading ? (
              <ActivityIndicator color={C.navy} style={{ marginTop: 40 }} />
            ) : (
              <>
                {tab === "templates" && (
                  <View style={{ gap: 10 }}>
                    <Text style={ss.sectionTitle}>
                      Templates ({filteredTemplates.length})
                    </Text>
                    {filteredTemplates.length === 0 ? (
                      <View style={ss.emptyBox}>
                        <ClipboardList size={32} color={C.muted} />
                        <Text style={ss.emptyText}>No checklist templates found.</Text>
                        <Text style={ss.emptySubText}>Templates are loaded from backend storage.</Text>
                      </View>
                    ) : (
                      filteredTemplates.map((t) => (
                        <TemplateCard
                          key={t.template_id}
                          tmpl={t}
                          onPress={() => setExpandedId(expandedId === t.template_id ? null : t.template_id)}
                        />
                      ))
                    )}
                  </View>
                )}

                {tab === "store_compliance" && (
                  <View style={{ gap: 8 }}>
                    <Text style={ss.sectionTitle}>
                      Store Compliance ({filteredCompliance.length})
                    </Text>
                    {filteredCompliance.length === 0 ? (
                      <View style={ss.emptyBox}>
                        <BarChart3 size={32} color={C.muted} />
                        <Text style={ss.emptyText}>No compliance data available.</Text>
                        <Text style={ss.emptySubText}>
                          Compliance data loads from seeded checklist responses.
                          Use backend to seed checklist assignments.
                        </Text>
                      </View>
                    ) : (
                      filteredCompliance.map((r, i) => (
                        <StoreComplianceRow key={`${r.store_code}-${r.template_id}-${i}`} row={r} />
                      ))
                    )}
                  </View>
                )}

                {tab === "past" && (
                  <View style={{ gap: 8 }}>
                    <Text style={ss.sectionTitle}>
                      Completion History ({past.length})
                    </Text>
                    {past.length === 0 ? (
                      <View style={ss.emptyBox}>
                        <CheckCircle2 size={32} color={C.muted} />
                        <Text style={ss.emptyText}>No past completions yet.</Text>
                        <Text style={ss.emptySubText}>
                          History appears after checklists are completed by stores.
                        </Text>
                      </View>
                    ) : (
                      past.map((p) => (
                        <PastCompletionRow key={p.id} row={p} />
                      ))
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>

        <AdminBottomNav active="more" />
      </View>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  root: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  header: { backgroundColor: C.navy, padding: 20, paddingTop: 12, paddingBottom: 20 },
  eyebrow: { fontSize: 10, fontWeight: "700", color: C.gold, letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "800", color: C.white },
  subtitle: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
  kpiRow: { flexDirection: "row", gap: 8 },
  kpiCard: { flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 10, alignItems: "center", gap: 4, elevation: 1 },
  kpiVal: { fontSize: 18, fontWeight: "800", color: C.navy },
  kpiLbl: { fontSize: 9, color: C.muted, textAlign: "center" },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.redBg, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: C.redBorder },
  errorText: { flex: 1, fontSize: 12, color: C.red },
  tabRow: { flexDirection: "row", backgroundColor: C.white, borderRadius: 12, padding: 4, gap: 4, elevation: 1 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderRadius: 8 },
  tabBtnActive: { backgroundColor: C.navy },
  tabBtnTxt: { fontSize: 11, fontWeight: "600", color: C.muted },
  tabBtnTxtActive: { color: C.white },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.white, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, elevation: 1 },
  searchInput: { flex: 1, fontSize: 13, color: C.navy },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.white, borderWidth: 1, borderColor: "#E2E8F0" },
  chipActive: { backgroundColor: C.navy, borderColor: C.navy },
  chipTxt: { fontSize: 11, fontWeight: "600", color: C.muted },
  chipTxtActive: { color: C.white },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: C.navy },
  card: { backgroundColor: C.white, borderRadius: 12, padding: 14, elevation: 2 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: C.navy },
  cardSub: { fontSize: 11, color: C.muted },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: "transparent" },
  badgeTxt: { fontSize: 10, fontWeight: "700" },
  pbarBg: { height: 4, backgroundColor: "#E5E7EB", borderRadius: 2, marginTop: 8, overflow: "hidden" },
  pbarFill: { height: 4, borderRadius: 2 },
  statMini: { alignItems: "center", flex: 1 },
  statMiniVal: { fontSize: 14, fontWeight: "700", color: C.navy },
  statMiniLbl: { fontSize: 9, color: C.muted },
  rolesLine: { fontSize: 10, color: C.muted, marginTop: 6, fontStyle: "italic" },
  complianceRow: { backgroundColor: C.white, borderRadius: 10, padding: 12, flexDirection: "row", gap: 8, elevation: 1 },
  emptyBox: { backgroundColor: C.white, borderRadius: 12, padding: 32, alignItems: "center", gap: 8 },
  emptyText: { fontSize: 14, fontWeight: "700", color: C.navy, textAlign: "center" },
  emptySubText: { fontSize: 11, color: C.muted, textAlign: "center" },
});
