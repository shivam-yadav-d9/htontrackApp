import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { adminDataService } from "@/services/team.service";
import { MapPin, Target, TrendingUp, Users } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  navy: "#102B45", orange: "#C95F18", gold: "#B7791F", beige: "#F6EBDC",
  cream: "#FFFDF8", muted: "#8A8178", white: "#FFFFFF", green: "#166534",
  red: "#B91C1C", amber: "#92400E", amberBg: "#FEF3C7",
};

const CATEGORY_COLORS: Record<string, string> = {
  "Sofa & Sectional":  "#E87525",
  "Mattress":          "#123C69",
  "Modular Kitchen":   "#1F8A5B",
  "Bedroom":           "#7C3AED",
  "Home Decor":        "#F59E0B",
  "Dining":            "#DC2626",
};

function convBadge(pct: number): { bg: string; text: string } {
  if (pct >= 35) return { bg: "#DCFCE7", text: "#166534" };
  if (pct >= 25) return { bg: "#FEF3C7", text: "#92400E" };
  return { bg: "#FEE2E2", text: "#B91C1C" };
}

function perfBadge(status: string): { bg: string; text: string } {
  if (status === "excellent")  return { bg: "#DCFCE7", text: "#166534" };
  if (status === "good")       return { bg: "#DBEAFE", text: "#1E40AF" };
  if (status === "needs_push") return { bg: "#FEF3C7", text: "#92400E" };
  return { bg: "#FEE2E2", text: "#B91C1C" };
}

function perfLabel(status: string): string {
  if (status === "excellent")  return "Excellent";
  if (status === "good")       return "Good";
  if (status === "needs_push") return "Needs Push";
  return "Critical";
}

function fmt(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

// ── Types ──────────────────────────────────────────────────────────────────────

type CategoryBreakdownItem = {
  category: string;
  leads: number;
  converted: number;
  conversion_pct: number;
  sales_amount: number;
};

type StoreRow = {
  id: string;
  store: string;
  city: string;
  zone: string;
  totalLeads: number;
  totalConverted: number;
  conversionPct: number;
  performanceStatus: string;
  salesAmount: number;
  avgOrderValue: number;
  manager: string;
  categoryBreakdown: CategoryBreakdownItem[];
};

// ── API Fetcher ────────────────────────────────────────────────────────────────

function normaliseRow(r: any): StoreRow {
  return {
    id: r.id ?? r.store_code ?? "",
    store: r.store_name ?? r.store ?? "",
    city: r.city ?? "",
    zone: r.zone ?? "",
    totalLeads: r.total_leads ?? r.totalLeads ?? 0,
    totalConverted: r.total_converted ?? r.totalConverted ?? 0,
    conversionPct: r.conversion_pct ?? r.conversionPct ?? 0,
    performanceStatus: r.performance_status ?? r.performanceStatus ?? "needs_push",
    salesAmount: r.sales_amount ?? r.salesAmount ?? 0,
    avgOrderValue: r.avg_order_value ?? r.avgOrderValue ?? 0,
    manager: r.manager_name ?? r.manager ?? "—",
    categoryBreakdown: (r.category_breakdown ?? r.categoryBreakdown ?? []).map((c: any) => ({
      category: c.category ?? "",
      leads: c.leads ?? 0,
      converted: c.converted ?? 0,
      conversion_pct: c.conversion_pct ?? 0,
      sales_amount: c.sales_amount ?? 0,
    })),
  };
}

async function fetchConversions(): Promise<StoreRow[]> {
  const data = await adminDataService.getStoreConversions({ period_key: "2026-05" });
  const items: any[] = Array.isArray(data) ? data : ((data as any)?.data ?? (data as any)?.items ?? []);
  return items.map(normaliseRow);
}

// ── Components ─────────────────────────────────────────────────────────────────

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={ss.pbarBg}>
      <View style={[ss.pbarFill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function StoreCard({ store, onPress, selected }: { store: StoreRow; onPress(): void; selected: boolean }) {
  const cb = convBadge(store.conversionPct);
  const pb = perfBadge(store.performanceStatus);
  return (
    <TouchableOpacity onPress={onPress} style={[ss.storeCard, selected && ss.storeCardActive]} activeOpacity={0.8}>
      <View style={ss.row}>
        <View style={{ flex: 1 }}>
          <Text style={ss.storeTitle}>{store.store}</Text>
          <Text style={ss.storeSub}>{store.city} · {store.zone} · {store.totalLeads} leads</Text>
        </View>
        <View style={[ss.badge, { backgroundColor: cb.bg }]}>
          <Text style={[ss.badgeTxt, { color: cb.text }]}>{store.conversionPct}%</Text>
        </View>
      </View>
      <View style={[ss.row, { marginTop: 6 }]}>
        <View style={[ss.badge, { backgroundColor: pb.bg }]}>
          <Text style={[ss.badgeTxt, { color: pb.text }]}>{perfLabel(store.performanceStatus)}</Text>
        </View>
        <Text style={ss.storeSub}>{store.totalConverted} converted · {fmt(store.salesAmount)}</Text>
      </View>
      <View style={ss.catBar}>
        {store.categoryBreakdown.sort((a, b) => b.converted - a.converted).map((cat) => (
          <View key={cat.category} style={{ flex: cat.converted, height: 4, backgroundColor: CATEGORY_COLORS[cat.category] ?? "#9CA3AF", borderRadius: 2 }} />
        ))}
      </View>
    </TouchableOpacity>
  );
}

function CategoryBreakdown({ store }: { store: StoreRow }) {
  const maxConv = Math.max(...store.categoryBreakdown.map((c) => c.converted));
  return (
    <View style={ss.card}>
      <Text style={ss.sectionTitle}>{store.store} — Categories</Text>
      <View style={[ss.row, { marginBottom: 12, justifyContent: "space-between" }]}>
        <View style={ss.statCell}>
          <Text style={ss.statVal}>{store.totalLeads}</Text>
          <Text style={ss.statLbl}>Total Leads</Text>
        </View>
        <View style={ss.statCell}>
          <Text style={ss.statVal}>{store.totalConverted}</Text>
          <Text style={ss.statLbl}>Converted</Text>
        </View>
        <View style={ss.statCell}>
          <Text style={[ss.statVal, { color: C.orange }]}>{store.conversionPct}%</Text>
          <Text style={ss.statLbl}>Conv Rate</Text>
        </View>
        <View style={ss.statCell}>
          <Text style={ss.statVal}>{fmt(store.salesAmount)}</Text>
          <Text style={ss.statLbl}>Sales</Text>
        </View>
      </View>
      {[...store.categoryBreakdown].sort((a, b) => b.converted - a.converted).map((cat) => {
        const cb = convBadge(cat.conversion_pct);
        const sharePct = maxConv ? Math.round((cat.converted / maxConv) * 100) : 0;
        return (
          <View key={cat.category} style={ss.catRow}>
            <View style={ss.row}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: CATEGORY_COLORS[cat.category] ?? "#9CA3AF" }} />
              <Text style={[ss.storeTitle, { flex: 1, fontSize: 12 }]}>{cat.category}</Text>
              <View style={[ss.badge, { backgroundColor: cb.bg }]}>
                <Text style={[ss.badgeTxt, { color: cb.text }]}>{cat.conversion_pct}%</Text>
              </View>
            </View>
            <View style={[ss.row, { marginTop: 4, gap: 12 }]}>
              <Text style={ss.storeSub}>Leads: {cat.leads}</Text>
              <Text style={ss.storeSub}>Conv: {cat.converted}</Text>
              <Text style={ss.storeSub}>{fmt(cat.sales_amount)}</Text>
            </View>
            <ProgressBar pct={sharePct} color={CATEGORY_COLORS[cat.category] ?? "#9CA3AF"} />
          </View>
        );
      })}
    </View>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function StoreConversionsScreen() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [perfFilter, setPerfFilter] = useState("");

  const load = () => {
    fetchConversions()
      .then((d: StoreRow[]) => {
        setStores(d);
        if (!selectedId) setSelectedId(d[0]?.id ?? null);
      })
      .catch(() => setStores([]))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { load(); }, []);

  const PERF_FILTERS = ["", "excellent", "good", "needs_push", "critical"];
  const filtered = perfFilter ? stores.filter((s) => s.performanceStatus === perfFilter) : stores;
  const totalLeads = stores.reduce((a, r) => a + r.totalLeads, 0);
  const totalConverted = stores.reduce((a, r) => a + r.totalConverted, 0);
  const avgConv = totalLeads ? Math.round((totalConverted / totalLeads) * 100) : 0;
  const selected = stores.find((s) => s.id === selectedId) ?? stores[0];

  return (
    <SafeAreaView style={ss.safe} edges={["top"]}>
      <View style={ss.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.orange} />}
          contentContainerStyle={ss.scrollContent}
        >
          {/* Header */}
          <View style={ss.header}>
            <Text style={ss.eyebrow}>LEAD FUNNEL</Text>
            <Text style={ss.title}>Store Conversions</Text>
            <Text style={ss.subtitle}>Lead generation, walk-ins and category-wise conversions per store.</Text>
          </View>

          <View style={{ padding: 16, gap: 14, paddingBottom: 100 }}>
            {/* KPI row */}
            <View style={ss.kpiRow}>
              <View style={ss.kpiCard}>
                <MapPin size={14} color={C.navy} />
                <Text style={ss.kpiVal}>{stores.length}</Text>
                <Text style={ss.kpiLbl}>Stores</Text>
              </View>
              <View style={ss.kpiCard}>
                <Users size={14} color={C.orange} />
                <Text style={ss.kpiVal}>{totalLeads}</Text>
                <Text style={ss.kpiLbl}>Total Leads</Text>
              </View>
              <View style={ss.kpiCard}>
                <Target size={14} color={C.green} />
                <Text style={ss.kpiVal}>{totalConverted}</Text>
                <Text style={ss.kpiLbl}>Converted</Text>
              </View>
              <View style={ss.kpiCard}>
                <TrendingUp size={14} color={C.gold} />
                <Text style={ss.kpiVal}>{avgConv}%</Text>
                <Text style={ss.kpiLbl}>Avg Conv</Text>
              </View>
            </View>

            {/* Performance filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
              {PERF_FILTERS.map((f) => (
                <TouchableOpacity key={f || "all"} onPress={() => setPerfFilter(f)}
                  style={[ss.chip, perfFilter === f && ss.chipActive]}>
                  <Text style={[ss.chipTxt, perfFilter === f && ss.chipTxtActive]}>
                    {f ? perfLabel(f) : "All Stores"}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Store list */}
            <Text style={ss.sectionTitle}>Stores ({filtered.length})</Text>
            {loading ? <ActivityIndicator color={C.navy} style={{ marginTop: 20 }} /> : (
              <View style={{ gap: 10 }}>
                {filtered.map((store) => (
                  <StoreCard
                    key={store.id}
                    store={store}
                    selected={selected?.id === store.id}
                    onPress={() => setSelectedId(store.id)}
                  />
                ))}
              </View>
            )}

            {/* Category breakdown for selected store */}
            {selected && !loading && <CategoryBreakdown store={selected} />}
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
  header: { backgroundColor: C.navy, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  eyebrow: { fontSize: 10, fontWeight: "800", color: C.orange, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "800", color: C.white },
  subtitle: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 4 },
  kpiRow: { flexDirection: "row", gap: 8 },
  kpiCard: { flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 10, alignItems: "center", gap: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  kpiVal: { fontSize: 16, fontWeight: "800", color: C.navy },
  kpiLbl: { fontSize: 9, color: C.muted, textAlign: "center" },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: C.white, borderWidth: 1, borderColor: "#E5E7EB" },
  chipActive: { backgroundColor: C.navy, borderColor: C.navy },
  chipTxt: { fontSize: 11, fontWeight: "700", color: C.muted },
  chipTxtActive: { color: C.white },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: C.navy, letterSpacing: 0.5 },
  storeCard: { backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: "transparent", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  storeCardActive: { borderColor: C.orange },
  storeTitle: { fontSize: 13, fontWeight: "700", color: C.navy },
  storeSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeTxt: { fontSize: 10, fontWeight: "700" },
  catBar: { flexDirection: "row", gap: 2, marginTop: 10, height: 4, borderRadius: 2, overflow: "hidden" },
  card: { backgroundColor: C.white, borderRadius: 14, padding: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  statCell: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 14, fontWeight: "800", color: C.navy, textAlign: "center" },
  statLbl: { fontSize: 10, color: C.muted, textAlign: "center", marginTop: 2 },
  catRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  pbarBg: { height: 5, backgroundColor: "#E5E7EB", borderRadius: 3, overflow: "hidden", marginTop: 4 },
  pbarFill: { height: 5, borderRadius: 3 },
});
