import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import {
  AlertCircle, BarChart2, Check, CheckCircle2,
  CreditCard, Target, TrendingUp, Trophy, Users, Wallet, X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { adminDataService } from "@/services/team.service";
import { api } from "@/services/api";

const C = {
  navy: "#102B45", orange: "#C95F18", gold: "#B7791F", beige: "#F6EBDC",
  cream: "#FFFDF8", muted: "#8A8178", brown: "#6B3F20", green: "#166534",
  red: "#B91C1C", white: "#FFFFFF", amber: "#92400E", amberBg: "#FEF3C7",
};


function buildPeriods(n = 6): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

function periodLabel(pk: string): string {
  try {
    const [y, m] = pk.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "short", year: "numeric" });
  } catch { return pk; }
}

function fmt(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

const SLAB_COLOR: Record<string, { bg: string; text: string }> = {
  "Super Achiever": { bg: "#FEF9C3", text: "#854D0E" },
  "Achieved":       { bg: "#DCFCE7", text: "#166534" },
  "On Track":       { bg: "#DBEAFE", text: "#1E40AF" },
  "Needs Push":     { bg: "#FEF3C7", text: "#92400E" },
  "Critical":       { bg: "#FEE2E2", text: "#B91C1C" },
};

const APPROVAL_COLOR: Record<string, { bg: string; text: string }> = {
  pending:  { bg: "#FEF3C7", text: "#92400E" },
  Pending:  { bg: "#FEF3C7", text: "#92400E" },
  approved: { bg: "#DCFCE7", text: "#166534" },
  Approved: { bg: "#DCFCE7", text: "#166534" },
  rejected: { bg: "#FEE2E2", text: "#B91C1C" },
  Rejected: { bg: "#FEE2E2", text: "#B91C1C" },
  paid:     { bg: "#E0E7FF", text: "#3730A3" },
};

const EMPTY_INC_CC = {
  summary: {
    total_payable: 0, approved_amount: 0, pending_amount: 0,
    paid_amount: 0, payout_requests: 0,
    top_store_name: "—", top_store_amount: 0,
    top_earner_name: "—", top_earner_amount: 0,
    staff_count: 0, approved_count: 0, pending_count: 0, paid_count: 0,
    rejected_count: 0, open_requests: 0,
  },
};

// ── API Fetchers ───────────────────────────────────────────────────────────────

async function fetchIncentivesJoined(period: string, status?: string) {
  try {
    const data = await adminDataService.getIncentivesJoined({ period_id: period, status, limit: 200 });
    return data?.items ?? [];
  } catch { return []; }
}

async function fetchCC(period: string) {
  const items = await fetchIncentivesJoined(period);
  if (!items.length) return EMPTY_INC_CC;
  const total = items.reduce((s: number, i: any) => s + (i.earned_amount ?? i.incentive_amount ?? 0), 0);
  const approved = items.filter((i: any) => i.status === "approved" || i.payout_status === "paid");
  const pending = items.filter((i: any) => i.status === "pending");
  return {
    summary: {
      total_payable: total,
      approved_amount: approved.reduce((s: number, i: any) => s + (i.earned_amount ?? 0), 0),
      pending_amount: pending.reduce((s: number, i: any) => s + (i.earned_amount ?? 0), 0),
      paid_amount: items.filter((i: any) => i.payout_status === "paid").reduce((s: number, i: any) => s + (i.earned_amount ?? 0), 0),
      payout_requests: pending.length,
      top_store_name: EMPTY_INC_CC.summary.top_store_name,
      top_store_amount: EMPTY_INC_CC.summary.top_store_amount,
      top_earner_name: EMPTY_INC_CC.summary.top_earner_name,
      top_earner_amount: EMPTY_INC_CC.summary.top_earner_amount,
      staff_count: items.length,
      approved_count: approved.length,
      pending_count: pending.length,
      paid_count: items.filter((i: any) => i.payout_status === "paid").length,
      rejected_count: items.filter((i: any) => i.status === "rejected").length,
      open_requests: pending.length,
    },
  };
}

async function fetchStoresInc(period: string) {
  const items = await fetchIncentivesJoined(period);
  if (!items.length) return [];
  const byStore: Record<string, any> = {};
  for (const i of items as any[]) {
    const sc = i.site_code ?? "";
    if (!byStore[sc]) {
      byStore[sc] = {
        store_code: sc, store_name: i.store_name ?? "", city: i.city ?? "", zone: i.zone ?? "",
        manager_name: i.manager_name ?? "", staff_count: 0,
        total_target: 0, total_achieved: 0, total_incentive: 0,
        approved_amount: 0, pending_amount: 0, paid_amount: 0, payout_requests: 0,
      };
    }
    const s = byStore[sc];
    s.staff_count++;
    s.total_target += i.target_amount ?? 0;
    s.total_achieved += i.achieved_amount ?? 0;
    s.total_incentive += i.earned_amount ?? i.incentive_amount ?? 0;
    if (i.status === "approved" || i.payout_status === "paid") s.approved_amount += i.earned_amount ?? 0;
    if (i.status === "pending") { s.pending_amount += i.earned_amount ?? 0; s.payout_requests++; }
    if (i.payout_status === "paid") s.paid_amount += i.earned_amount ?? 0;
  }
  return Object.values(byStore).map((s: any) => ({
    ...s,
    achievement_percentage: s.total_target > 0 ? parseFloat(((s.total_achieved / s.total_target) * 100).toFixed(1)) : 0,
  }));
}

async function fetchStaffInc(period: string, filters: Record<string, string>) {
  const items = await fetchIncentivesJoined(period, filters.approval_status);
  if (!items.length) return [];
  return (items as any[]).map((i: any) => ({
    id: i.id ?? i.employee_number,
    staff_name: i.employee_name ?? "",
    employee_code: i.employee_number ?? "",
    department: i.department ?? "",
    store_name: i.store_name ?? "",
    target_amount: i.target_amount ?? 0,
    achieved_amount: i.achieved_amount ?? 0,
    achievement_percentage: parseFloat((i.achievement_percentage ?? 0).toFixed(1)),
    slab: (i.achievement_percentage ?? 0) >= 100 ? "Super Achiever" : (i.achievement_percentage ?? 0) >= 90 ? "Achieved" : (i.achievement_percentage ?? 0) >= 75 ? "On Track" : (i.achievement_percentage ?? 0) >= 70 ? "Needs Push" : "Critical",
    total_incentive: i.earned_amount ?? i.incentive_amount ?? 0,
    approval_status: i.status ?? "pending",
    payout_status: i.payout_status ?? "pending",
  }));
}

async function fetchPayouts(period: string, status: string) {
  const items = await fetchIncentivesJoined(period, status || undefined);
  if (!items.length) return [];
  return (items as any[]).map((i: any) => ({
    id: i.id ?? i.employee_number,
    staff_name: i.employee_name ?? "",
    store_name: i.store_name ?? "",
    requested_amount: i.earned_amount ?? i.incentive_amount ?? 0,
    approved_amount: i.status === "approved" ? (i.earned_amount ?? 0) : null,
    period_key: i.period_id ?? period,
    reason: "Monthly incentive",
    approval_status: i.status ?? "pending",
    payout_status: i.payout_status ?? "pending",
  }));
}

async function postAction(url: string, body: object) {
  return api.post(url, body);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatRow({ items }: { items: { label: string; value: string | number; sub?: string }[] }) {
  return (
    <View style={ss.statRow}>
      {items.map((it) => (
        <View key={it.label} style={ss.statCell}>
          <Text style={ss.statVal}>{it.value}</Text>
          <Text style={ss.statLbl}>{it.label}</Text>
          {it.sub ? <Text style={[ss.statLbl, { color: C.orange }]}>{it.sub}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function Pill({ label, value, bg, text }: { label: string; value: number | string; bg: string; text: string }) {
  return (
    <View style={[ss.pill, { backgroundColor: bg }]}>
      <Text style={[ss.pillVal, { color: text }]}>{value}</Text>
      <Text style={[ss.pillLbl, { color: text }]}>{label}</Text>
    </View>
  );
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={ss.pbarBg}>
      <View style={[ss.pbarFill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function SlabBadge({ slab }: { slab?: string }) {
  if (!slab) return null;
  const s = SLAB_COLOR[slab] ?? { bg: "#F3F4F6", text: "#6B7280" };
  return (
    <View style={[ss.badge, { backgroundColor: s.bg }]}>
      <Text style={[ss.badgeTxt, { color: s.text }]}>{slab}</Text>
    </View>
  );
}

function ApprovalBadge({ status }: { status?: string }) {
  const s = APPROVAL_COLOR[status ?? "pending"] ?? { bg: "#FEF3C7", text: "#92400E" };
  return (
    <View style={[ss.badge, { backgroundColor: s.bg }]}>
      <Text style={[ss.badgeTxt, { color: s.text }]}>{status ?? "pending"}</Text>
    </View>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────

function OverviewTab({ period }: { period: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchCC(period).then(setData);
  }, [period]);

  if (!data) return <ActivityIndicator color={C.navy} style={{ marginTop: 40 }} />;
  const s = data.summary ?? data ?? {};

  return (
    <View style={{ gap: 14 }}>
      <View style={ss.card}>
        <Text style={ss.sectionTitle}>Summary</Text>
        <StatRow items={[
          { label: "Total Payable", value: fmt(s.total_payable ?? 0) },
          { label: "Approved", value: fmt(s.approved_amount ?? 0) },
          { label: "Pending", value: fmt(s.pending_amount ?? 0) },
        ]} />
        <StatRow items={[
          { label: "Paid Out", value: fmt(s.paid_amount ?? 0) },
          { label: "Top Store", value: s.top_store_name ?? "—", sub: fmt(s.top_store_amount ?? 0) },
          { label: "Top Earner", value: s.top_earner_name ?? "—", sub: fmt(s.top_earner_amount ?? 0) },
        ]} />
      </View>

      <View style={ss.card}>
        <Text style={ss.sectionTitle}>Staff Status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
          <Pill label="Total" value={s.staff_count ?? 0} bg="#E0E7FF" text="#3730A3" />
          <Pill label="Approved" value={s.approved_count ?? 0} bg="#DCFCE7" text="#166534" />
          <Pill label="Pending" value={s.pending_count ?? 0} bg="#FEF3C7" text="#92400E" />
          <Pill label="Paid" value={s.paid_count ?? 0} bg="#DBEAFE" text="#1E40AF" />
          <Pill label="Rejected" value={s.rejected_count ?? 0} bg="#FEE2E2" text="#B91C1C" />
          <Pill label="Requests" value={s.payout_requests ?? 0} bg="#FEF9C3" text="#854D0E" />
        </ScrollView>
      </View>

      <View style={ss.card}>
        <Text style={ss.sectionTitle}>Policy</Text>
        <View style={ss.policyBox}>
          <Wallet size={16} color="#166534" />
          <Text style={ss.policyTxt}>Each staff member earns <Text style={{ fontWeight: "800" }}>10% of their achieved sales amount</Text> for the period.</Text>
        </View>
      </View>
    </View>
  );
}

// ── Stores Tab ─────────────────────────────────────────────────────────────────

function StoresTab({ period }: { period: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [zone, setZone] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchStoresInc(period).then((d) => { setRows(d); setLoading(false); });
  }, [period]);

  const zones = Array.from(new Set(rows.map((r) => r.zone).filter(Boolean)));
  const filtered = zone ? rows.filter((r) => r.zone === zone) : rows;

  return (
    <View style={{ gap: 12 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
        {["", ...zones].map((z) => (
          <TouchableOpacity key={z || "all"} onPress={() => setZone(z)}
            style={[ss.chip, zone === z && ss.chipActive]}>
            <Text style={[ss.chipTxt, zone === z && ss.chipTxtActive]}>{z || "All Zones"}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? <ActivityIndicator color={C.navy} /> : filtered.map((r) => {
        const ach = r.achievement_percentage ?? 0;
        const barColor = ach >= 100 ? "#166534" : ach >= 80 ? C.navy : "#D97706";
        return (
          <View key={r.store_code} style={ss.card}>
            <View style={ss.row}>
              <View style={{ flex: 1 }}>
                <Text style={ss.cardTitle}>{r.store_name}</Text>
                <Text style={ss.cardSub}>{r.city} · {r.zone} · {r.manager_name}</Text>
              </View>
              <View style={[ss.badge, { backgroundColor: r.payout_requests > 0 ? C.amberBg : "#F3F4F6" }]}>
                <Text style={[ss.badgeTxt, { color: r.payout_requests > 0 ? C.amber : C.muted }]}>
                  {r.payout_requests > 0 ? `${r.payout_requests} req` : "—"}
                </Text>
              </View>
            </View>
            <View style={[ss.statRow, { marginTop: 8 }]}>
              <View style={ss.statCell}>
                <Text style={ss.statVal}>{r.staff_count}</Text>
                <Text style={ss.statLbl}>Staff</Text>
              </View>
              <View style={ss.statCell}>
                <Text style={ss.statVal}>{fmt(r.total_target)}</Text>
                <Text style={ss.statLbl}>Target</Text>
              </View>
              <View style={ss.statCell}>
                <Text style={ss.statVal}>{fmt(r.total_achieved)}</Text>
                <Text style={ss.statLbl}>Achieved</Text>
              </View>
              <View style={ss.statCell}>
                <Text style={[ss.statVal, { color: C.orange }]}>{fmt(r.total_incentive)}</Text>
                <Text style={ss.statLbl}>Incentive</Text>
              </View>
            </View>
            <View style={{ marginTop: 6 }}>
              <View style={ss.row}>
                <Text style={ss.statLbl}>Achievement</Text>
                <Text style={[ss.statLbl, { color: barColor }]}>{ach.toFixed(1)}%</Text>
              </View>
              <ProgressBar pct={ach} color={barColor} />
            </View>
            <View style={[ss.row, { marginTop: 8, gap: 16 }]}>
              <Text style={ss.statLbl}>Approved: <Text style={{ color: C.green }}>{fmt(r.approved_amount)}</Text></Text>
              <Text style={ss.statLbl}>Pending: <Text style={{ color: C.amber }}>{fmt(r.pending_amount)}</Text></Text>
              <Text style={ss.statLbl}>Paid: <Text style={{ color: C.navy }}>{fmt(r.paid_amount)}</Text></Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Staff Tab ──────────────────────────────────────────────────────────────────

function StaffTab({ period, onRefresh }: { period: string; onRefresh(): void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const filters: Record<string, string> = {};
    if (statusFilter) filters.approval_status = statusFilter;
    fetchStaffInc(period, filters).then((d) => { setRows(d); setLoading(false); });
  }, [period, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((r) => !search || r.staff_name?.toLowerCase().includes(search.toLowerCase()) || r.store_name?.toLowerCase().includes(search.toLowerCase()));

  const handleAction = async (id: string, action: "approve" | "reject" | "paid") => {
    try {
      if (action === "approve") await postAction(`/admin/incentives/${id}/approve`, {});
      else if (action === "reject") await postAction(`/admin/incentives/${id}/reject`, { reason: "Rejected" });
      else await postAction(`/admin/incentives/${id}/mark-paid`, {});
      load(); onRefresh();
    } catch {
      Alert.alert("Error", "Action failed. Please try again.");
    }
  };

  const confirmAction = (id: string, action: "approve" | "reject" | "paid", name: string) => {
    const labels: Record<string, string> = { approve: "Approve", reject: "Reject", paid: "Mark Paid" };
    Alert.alert(`${labels[action]} Incentive`, `${labels[action]} incentive for ${name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => handleAction(id, action) },
    ]);
  };

  return (
    <View style={{ gap: 12 }}>
      <TextInput
        style={ss.searchInput} placeholder="Search staff or store…"
        placeholderTextColor={C.muted} value={search} onChangeText={setSearch}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
        {["", "pending", "approved", "rejected"].map((s) => (
          <TouchableOpacity key={s || "all"} onPress={() => setStatusFilter(s)}
            style={[ss.chip, statusFilter === s && ss.chipActive]}>
            <Text style={[ss.chipTxt, statusFilter === s && ss.chipTxtActive]}>{s || "All"}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? <ActivityIndicator color={C.navy} /> : filtered.map((r) => {
        const ach = r.achievement_percentage ?? 0;
        const canApprove = (r.approval_status ?? "pending").toLowerCase() === "pending";
        const canPay = r.approval_status === "approved" && r.payout_status !== "paid";
        return (
          <View key={r.id} style={ss.card}>
            <View style={ss.row}>
              <View style={{ flex: 1 }}>
                <Text style={ss.cardTitle}>{r.staff_name}</Text>
                <Text style={ss.cardSub}>{r.employee_code} · {r.department}</Text>
                <Text style={ss.cardSub}>{r.store_name}</Text>
              </View>
              <SlabBadge slab={r.slab} />
            </View>
            <View style={[ss.statRow, { marginTop: 8 }]}>
              <View style={ss.statCell}>
                <Text style={ss.statVal}>{fmt(r.target_amount ?? 0)}</Text>
                <Text style={ss.statLbl}>Target</Text>
              </View>
              <View style={ss.statCell}>
                <Text style={ss.statVal}>{fmt(r.achieved_amount ?? 0)}</Text>
                <Text style={ss.statLbl}>Achieved</Text>
              </View>
              <View style={ss.statCell}>
                <Text style={[ss.statVal, { color: C.orange }]}>{fmt(r.total_incentive ?? 0)}</Text>
                <Text style={ss.statLbl}>Incentive</Text>
              </View>
            </View>
            <View style={{ marginTop: 6 }}>
              <View style={ss.row}>
                <Text style={ss.statLbl}>Achievement</Text>
                <Text style={[ss.statLbl, { color: ach >= 100 ? C.green : C.navy }]}>{ach.toFixed(1)}%</Text>
              </View>
              <ProgressBar pct={ach} color={ach >= 100 ? C.green : C.navy} />
            </View>
            <View style={[ss.row, { marginTop: 8, justifyContent: "space-between" }]}>
              <View style={ss.row}>
                <ApprovalBadge status={r.approval_status} />
                <ApprovalBadge status={r.payout_status} />
              </View>
              <View style={ss.row}>
                {canApprove && (
                  <>
                    <TouchableOpacity style={ss.actionBtn} onPress={() => confirmAction(r.id, "approve", r.staff_name)}>
                      <Check size={14} color={C.green} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[ss.actionBtn, { backgroundColor: "#FEE2E2" }]} onPress={() => confirmAction(r.id, "reject", r.staff_name)}>
                      <X size={14} color={C.red} />
                    </TouchableOpacity>
                  </>
                )}
                {canPay && (
                  <TouchableOpacity style={[ss.actionBtn, { backgroundColor: "#E0E7FF" }]} onPress={() => confirmAction(r.id, "paid", r.staff_name)}>
                    <CreditCard size={14} color="#3730A3" />
                  </TouchableOpacity>
                )}
                {!canApprove && !canPay && <Text style={ss.statLbl}>—</Text>}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Payouts Tab ────────────────────────────────────────────────────────────────

function PayoutsTab({ period, onRefresh }: { period: string; onRefresh(): void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchPayouts(period, statusFilter).then((d) => { setRows(d); setLoading(false); });
  }, [period, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id: string, action: "approve" | "reject" | "paid") => {
    try {
      if (action === "approve") await postAction(`/admin/incentives/payout-requests/${id}/approve`, {});
      else if (action === "reject") await postAction(`/admin/incentives/payout-requests/${id}/reject`, { reason: "Rejected" });
      else await postAction(`/admin/incentives/payout-requests/${id}/mark-paid`, {});
      load(); onRefresh();
    } catch {
      Alert.alert("Error", "Action failed.");
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
        {["", "pending", "approved", "paid", "rejected"].map((s) => (
          <TouchableOpacity key={s || "all"} onPress={() => setStatusFilter(s)}
            style={[ss.chip, statusFilter === s && ss.chipActive]}>
            <Text style={[ss.chipTxt, statusFilter === s && ss.chipTxtActive]}>{s || "All"}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? <ActivityIndicator color={C.navy} /> : rows.map((r) => {
        const isPending = (r.approval_status ?? "pending").toLowerCase() === "pending";
        const canPay = r.approval_status === "approved" && r.payout_status !== "paid";
        return (
          <View key={r.id} style={ss.card}>
            <View style={ss.row}>
              <View style={{ flex: 1 }}>
                <Text style={ss.cardTitle}>{r.staff_name ?? r.employee_code}</Text>
                <Text style={ss.cardSub}>{r.store_name} · {r.period_key}</Text>
              </View>
              <Text style={[ss.cardTitle, { color: C.orange }]}>{fmt(r.requested_amount ?? 0)}</Text>
            </View>
            {r.reason ? <Text style={[ss.cardSub, { marginTop: 4 }]}>"{r.reason}"</Text> : null}
            {r.approved_amount ? (
              <Text style={[ss.cardSub, { color: C.green }]}>Approved: {fmt(r.approved_amount)}</Text>
            ) : null}
            <View style={[ss.row, { marginTop: 8, justifyContent: "space-between" }]}>
              <View style={ss.row}>
                <ApprovalBadge status={r.approval_status} />
                <ApprovalBadge status={r.payout_status} />
              </View>
              <View style={ss.row}>
                {isPending && (
                  <>
                    <TouchableOpacity style={ss.actionBtn} onPress={() => handleAction(r.id, "approve")}>
                      <Check size={14} color={C.green} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[ss.actionBtn, { backgroundColor: "#FEE2E2" }]} onPress={() => handleAction(r.id, "reject")}>
                      <X size={14} color={C.red} />
                    </TouchableOpacity>
                  </>
                )}
                {canPay && (
                  <TouchableOpacity style={[ss.actionBtn, { backgroundColor: "#E0E7FF" }]} onPress={() => handleAction(r.id, "paid")}>
                    <CreditCard size={14} color="#3730A3" />
                  </TouchableOpacity>
                )}
                {!isPending && !canPay && <Text style={ss.statLbl}>—</Text>}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "stores",   label: "Store-wise" },
  { id: "staff",    label: "Staff" },
  { id: "payouts",  label: "Payout Req" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function IncentivesScreen() {
  const periods = buildPeriods(6);
  const [period, setPeriod] = useState(periods[0]);
  const [tab, setTab] = useState<TabId>("overview");
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

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
            <Text style={ss.eyebrow}>REWARDS</Text>
            <Text style={ss.title}>Incentive Earnings</Text>
            <Text style={ss.subtitle}>10% of achieved sales · Approve, track and pay across all stores.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8, marginTop: 12 }}>
              {periods.map((pk) => (
                <TouchableOpacity key={pk} onPress={() => setPeriod(pk)}
                  style={[ss.periodChip, period === pk && ss.periodChipActive]}>
                  <Text style={[ss.periodChipTxt, period === pk && ss.periodChipTxtActive]}>{periodLabel(pk)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tab bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ss.tabBar}>
            {TABS.map(({ id, label }) => (
              <TouchableOpacity key={id} onPress={() => setTab(id)} style={[ss.tabChip, tab === id && ss.tabChipActive]}>
                <Text style={[ss.tabChipTxt, tab === id && ss.tabChipTxtActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ padding: 16, paddingBottom: 100 }}>
            {tab === "overview" && <OverviewTab key={`ov-${period}-${refreshKey}`} period={period} />}
            {tab === "stores" && <StoresTab key={`st-${period}-${refreshKey}`} period={period} />}
            {tab === "staff" && <StaffTab key={`sf-${period}-${refreshKey}`} period={period} onRefresh={onRefresh} />}
            {tab === "payouts" && <PayoutsTab key={`py-${period}-${refreshKey}`} period={period} onRefresh={onRefresh} />}
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
  tabBar: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  tabChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  tabChipActive: { backgroundColor: C.orange, borderColor: C.orange },
  tabChipTxt: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.7)" },
  tabChipTxtActive: { color: C.white },
  periodChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  periodChipActive: { backgroundColor: C.white },
  periodChipTxt: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.8)" },
  periodChipTxtActive: { color: C.navy },
  card: { backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: C.navy, marginBottom: 10, letterSpacing: 0.5 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  statRow: { flexDirection: "row", justifyContent: "space-between" },
  statCell: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 14, fontWeight: "800", color: C.navy },
  statLbl: { fontSize: 10, color: C.muted, textAlign: "center", marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeTxt: { fontSize: 10, fontWeight: "700" },
  pill: { alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  pillVal: { fontSize: 18, fontWeight: "800" },
  pillLbl: { fontSize: 10, fontWeight: "600", marginTop: 2 },
  pbarBg: { height: 6, backgroundColor: "#E5E7EB", borderRadius: 3, overflow: "hidden", marginTop: 4 },
  pbarFill: { height: 6, borderRadius: 3 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: C.white, borderWidth: 1, borderColor: "#E5E7EB" },
  chipActive: { backgroundColor: C.navy, borderColor: C.navy },
  chipTxt: { fontSize: 11, fontWeight: "700", color: C.muted },
  chipTxtActive: { color: C.white },
  cardTitle: { fontSize: 13, fontWeight: "700", color: C.navy },
  cardSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  searchInput: { backgroundColor: C.white, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, fontSize: 13, color: C.navy, borderWidth: 1, borderColor: "#E5E7EB" },
  policyBox: { flexDirection: "row", gap: 8, backgroundColor: "#DCFCE7", borderRadius: 10, padding: 12, alignItems: "flex-start" },
  policyTxt: { flex: 1, fontSize: 12, color: "#166534" },
  actionBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center" },
});
