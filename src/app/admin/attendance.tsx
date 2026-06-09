import { router } from "expo-router";
import {
  AlertTriangle,
  Bell,
  Building2,
  Calendar,
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock,
  Download,
  MapPin,
  MapPinOff,
  Search,
  Shield,
  UserCheck,
  UserX,
  Users,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  greenBg: "#DCFCE7", greenBorder: "#BBF7D0",
  redBg: "#FEE2E2", redBorder: "#FECACA",
  goldBg: "#FFF4D8", goldBorder: "#F5D28A",
  orangeBg: "#FFF1E5", orangeBorder: "#FED7AA",
  blueBg: "#EAF2FB", blueBorder: "#C9DBEF",
};

type ViewTab = "store" | "live" | "weekly" | "monthly";
type RoleFilter = "all" | "manager" | "staff";
type StatusFilter = "all" | "present" | "absent";

// ── Store-wise attendance types ───────────────────────────────────────────────

interface StorePersonRow {
  id: string;
  employee_code: string;
  name: string;
  designation: string;
  department: string;
  band: string;
  role: string;
  role_group: string;
  store_code: string;
  store_name: string;
  city: string;
  zone: string;
  manager_name: string;
  attendance_status: "Present" | "Late" | "Absent";
  check_in: string;
  check_out: string;
  total_hours: number;
  geofence: string;
}

interface StoreGroup {
  site_code: string;
  store_name: string;
  city: string;
  state: string;
  zone: string;
  karta: StorePersonRow | null;
  management: StorePersonRow[];
  staff: StorePersonRow[];
  summary: { total: number; present: number; absent: number; outside_geofence: number; karta_present: boolean };
}

interface StoreViewSummary {
  stores: number; total: number;
  management_total: number; management_present: number;
  staff_total: number; staff_present: number;
  outside_geofence: number; stores_karta_absent: number;
}

// ── Fetch store-grouped attendance ────────────────────────────────────────────

async function fetchAttendanceByStore(): Promise<{ summary: StoreViewSummary; stores: StoreGroup[] }> {
  const { api } = await import("@/services/api");
  const data = await api.get<any>("/admin/attendance/live-by-store");
  return {
    summary: data?.summary ?? { stores: 0, total: 0, management_total: 0, management_present: 0, staff_total: 0, staff_present: 0, outside_geofence: 0, stores_karta_absent: 0 },
    stores: (data?.stores ?? []) as StoreGroup[],
  };
}

// ── Designation color helpers ─────────────────────────────────────────────────

function designationBg(desig: string): { bg: string; text: string } {
  const d = (desig || "").toUpperCase();
  if (d.includes("STORE KARTA")) return { bg: "#FEF9C3", text: "#854D0E" };
  if (d.includes("REGIONAL")) return { bg: "#EDE9FE", text: "#5B21B6" };
  if (d.includes("DEPARTMENT HEAD")) return { bg: "#DBEAFE", text: "#1E40AF" };
  if (d.includes("DEPARTMENT MANAGER")) return { bg: "#EAF2FB", text: "#102B45" };
  if (d.includes("HEAD CASHIER")) return { bg: "#DCFCE7", text: "#166534" };
  if (d.includes("WAREHOUSE")) return { bg: "#FFEDD5", text: "#C2410C" };
  return { bg: "#F3F4F6", text: "#6B7280" };
}

function deptBg(dept: string): { bg: string; text: string } {
  const d = (dept || "").toUpperCase();
  if (d.includes("FURNITURE")) return { bg: "#EAF2FB", text: "#102B45" };
  if (d.includes("HOMEWARE")) return { bg: "#DCFCE7", text: "#166534" };
  if (d.includes("HOME DECOR")) return { bg: "#FFF4D8", text: "#B7791F" };
  if (d.includes("DESIGN") || d.includes("MODULAR")) return { bg: "#FFEDD5", text: "#C2410C" };
  if (d.includes("ACCOUNT") || d.includes("FINANCE")) return { bg: "#F0FDF4", text: "#166534" };
  return { bg: "#F3F4F6", text: "#6B7280" };
}

function statusColor(s: string): { bg: string; text: string; border: string } {
  if (s === "Present") return { bg: "#DCFCE7", text: "#166534", border: "#BBF7D0" };
  if (s === "Late") return { bg: "#FFF4D8", text: "#B7791F", border: "#F5D28A" };
  return { bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA" };
}

function ini(name: string) {
  return (name || "?").split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
}

// ── Person row component ──────────────────────────────────────────────────────

function PersonRow({ person, isKarta }: { person: StorePersonRow; isKarta?: boolean }) {
  const sc = statusColor(person.attendance_status);
  const dc = designationBg(person.designation);
  const deptC = deptBg(person.department);
  const outside = person.geofence === "Outside";
  const absent = person.attendance_status === "Absent";

  return (
    <View style={[pr.row, absent && pr.rowAbsent, isKarta && pr.rowKarta]}>
      <View style={[pr.avatar, isKarta ? pr.avatarKarta : absent ? pr.avatarAbsent : pr.avatarNormal]}>
        <Text style={[pr.avatarTxt, { color: isKarta ? "#854D0E" : absent ? C.red : C.navy }]}>
          {ini(person.name)}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={pr.nameRow}>
          <Text style={pr.name} numberOfLines={1}>{person.name}</Text>
          {isKarta && (
            <View style={pr.kartaBadge}>
              <Text style={pr.kartaBadgeTxt}>Karta</Text>
            </View>
          )}
        </View>
        <Text style={pr.code}>#{person.employee_code}</Text>
        <View style={pr.tagsRow}>
          {person.designation ? (
            <View style={[pr.tag, { backgroundColor: dc.bg }]}>
              <Text style={[pr.tagTxt, { color: dc.text }]} numberOfLines={1}>{person.designation}</Text>
            </View>
          ) : null}
          {person.department ? (
            <View style={[pr.tag, { backgroundColor: deptC.bg }]}>
              <Text style={[pr.tagTxt, { color: deptC.text }]}>{person.department}</Text>
            </View>
          ) : null}
          {person.band ? (
            <View style={[pr.tag, { backgroundColor: "#F3F4F6" }]}>
              <Text style={[pr.tagTxt, { color: "#6B7280" }]}>Band {person.band}</Text>
            </View>
          ) : null}
        </View>
        <View style={pr.bottomRow}>
          <View style={[pr.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={[pr.statusTxt, { color: sc.text }]}>{person.attendance_status}</Text>
          </View>
          {person.check_in ? <Text style={pr.timeText}>In {person.check_in}</Text> : null}
          {person.check_out ? <Text style={pr.timeText}>Out {person.check_out}</Text> : null}
          {person.total_hours > 0 ? <Text style={pr.timeText}>{person.total_hours.toFixed(1)}h</Text> : null}
          {outside && (
            <View style={pr.outsideTag}>
              <MapPinOff size={9} color={C.red} />
              <Text style={[pr.tagTxt, { color: C.red }]}>Outside</Text>
            </View>
          )}
        </View>
        {person.manager_name && !isKarta ? (
          <Text style={pr.managerLine}>↳ {person.manager_name}</Text>
        ) : null}
      </View>
    </View>
  );
}

const pr = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  rowAbsent: { backgroundColor: "#FFF5F5" },
  rowKarta: { backgroundColor: "#FFFBEB" },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  avatarKarta: { backgroundColor: "#FEF9C3", borderWidth: 1, borderColor: "#FDE68A" },
  avatarAbsent: { backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#FECACA" },
  avatarNormal: { backgroundColor: "#EAF2FB", borderWidth: 1, borderColor: "#C9DBEF" },
  avatarTxt: { fontSize: 13, fontWeight: "800" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  name: { fontSize: 13, fontWeight: "700", color: C.navy, flex: 1 },
  kartaBadge: { backgroundColor: "#FEF9C3", borderWidth: 1, borderColor: "#FDE68A", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  kartaBadgeTxt: { fontSize: 9, fontWeight: "800", color: "#854D0E" },
  code: { fontSize: 10, color: C.muted, fontFamily: "monospace", marginTop: 1 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 5 },
  tag: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  tagTxt: { fontSize: 9, fontWeight: "700" },
  bottomRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" },
  statusBadge: { borderRadius: 5, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  statusTxt: { fontSize: 9, fontWeight: "800" },
  timeText: { fontSize: 9, color: C.muted, fontFamily: "monospace" },
  outsideTag: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#FEE2E2", borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  managerLine: { fontSize: 9, color: C.muted, marginTop: 2, fontStyle: "italic" },
});

// ── Store group card component ────────────────────────────────────────────────

function StoreGroupCard({ group }: { group: StoreGroup }) {
  const [expanded, setExpanded] = useState(false);
  const [roleTab, setRoleTab] = useState<"all" | "management" | "staff">("all");

  const { present, total, absent, karta_present } = group.summary;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  const kartaAbsent = group.karta && !karta_present;
  const mgmtCount = (group.karta ? 1 : 0) + group.management.length;

  const displayedMgmt = useMemo(() =>
    (roleTab === "all" || roleTab === "management") ? [
      ...(group.karta ? [{ person: group.karta, isKarta: true }] : []),
      ...group.management.map(p => ({ person: p, isKarta: false })),
    ] : [],
    [group, roleTab]
  );
  const displayedStaff = useMemo(() =>
    (roleTab === "all" || roleTab === "staff") ? group.staff : [],
    [group, roleTab]
  );

  return (
    <View style={sg.card}>
      {/* Store header */}
      <TouchableOpacity style={sg.header} onPress={() => setExpanded(v => !v)} activeOpacity={0.85}>
        <View style={sg.headerLeft}>
          <View style={sg.iconBox}>
            <Building2 size={16} color={C.orange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={sg.storeName} numberOfLines={1}>{group.store_name}</Text>
            <Text style={sg.storeMeta}>{group.site_code} · {group.city} · <Text style={{ color: C.gold, fontWeight: "700" }}>{group.zone}</Text></Text>
          </View>
        </View>
        <View style={sg.headerRight}>
          <View style={[sg.presentBubble, { backgroundColor: pct >= 85 ? "#DCFCE7" : pct >= 65 ? "#FFF4D8" : "#FEE2E2" }]}>
            <Text style={[sg.presentTxt, { color: pct >= 85 ? "#166534" : pct >= 65 ? "#B7791F" : "#B91C1C" }]}>{present}/{total}</Text>
          </View>
          {expanded ? <ChevronUp size={14} color={C.muted} /> : <ChevronDown size={14} color={C.muted} />}
        </View>
      </TouchableOpacity>

      {/* Karta bar */}
      {group.karta ? (
        <View style={[sg.kartaBar, kartaAbsent && sg.kartaBarAbsent]}>
          <Shield size={11} color={kartaAbsent ? C.red : C.gold} />
          <Text style={[sg.kartaName, { color: kartaAbsent ? C.red : C.brown }]} numberOfLines={1}>
            {group.karta.name} — {group.karta.designation}
          </Text>
          <Text style={[sg.kartaStatus, { color: kartaAbsent ? C.red : C.green }]}>
            {group.karta.attendance_status}
          </Text>
        </View>
      ) : (
        <View style={[sg.kartaBar, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
          <AlertTriangle size={11} color={C.red} />
          <Text style={[sg.kartaName, { color: C.red }]}>No Store Karta assigned</Text>
        </View>
      )}

      {/* Progress bar */}
      <View style={sg.progressBg}>
        <View style={[sg.progressFill, {
          width: `${pct}%` as any,
          backgroundColor: pct >= 85 ? "#16A34A" : pct >= 65 ? "#D97706" : "#DC2626",
        }]} />
      </View>

      {/* Role tabs */}
      {expanded && (
        <>
          <View style={sg.tabRow}>
            {([
              { key: "all", label: `All (${total})` },
              { key: "management", label: `Mgmt (${mgmtCount})` },
              { key: "staff", label: `Staff (${group.staff.length})` },
            ] as { key: "all" | "management" | "staff"; label: string }[]).map(t => (
              <TouchableOpacity
                key={t.key}
                style={[sg.tab, roleTab === t.key && sg.tabActive]}
                onPress={() => setRoleTab(t.key)}
              >
                <Text style={[sg.tabTxt, roleTab === t.key && sg.tabTxtActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Management section */}
          {displayedMgmt.length > 0 && (
            <>
              <View style={sg.sectionHeader}>
                <Shield size={11} color={C.navy} />
                <Text style={sg.sectionTxt}>Management & Karta ({mgmtCount})</Text>
              </View>
              {displayedMgmt.map(({ person, isKarta }) => (
                <PersonRow key={person.employee_code} person={person} isKarta={isKarta} />
              ))}
            </>
          )}

          {/* Staff section */}
          {displayedStaff.length > 0 && (
            <>
              <View style={[sg.sectionHeader, { backgroundColor: "#F9FAFB" }]}>
                <Users size={11} color={C.muted} />
                <Text style={[sg.sectionTxt, { color: C.muted }]}>Staff ({group.staff.length})</Text>
              </View>
              {displayedStaff.map(p => (
                <PersonRow key={p.employee_code} person={p} isKarta={false} />
              ))}
            </>
          )}

          {displayedMgmt.length === 0 && displayedStaff.length === 0 && (
            <Text style={sg.emptyTxt}>No employees in this category.</Text>
          )}
        </>
      )}
    </View>
  );
}

const sg = StyleSheet.create({
  card: { backgroundColor: C.cream, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#EAD7C2" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  headerLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#FFF1E5", alignItems: "center", justifyContent: "center" },
  storeName: { fontSize: 13, fontWeight: "800", color: C.navy },
  storeMeta: { fontSize: 10, color: C.muted, marginTop: 1 },
  presentBubble: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  presentTxt: { fontSize: 11, fontWeight: "800" },
  kartaBar: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#FFFBEB", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#FDE68A" },
  kartaBarAbsent: { backgroundColor: "#FEE2E2", borderColor: "#FECACA" },
  kartaName: { flex: 1, fontSize: 11, fontWeight: "700", color: C.brown },
  kartaStatus: { fontSize: 10, fontWeight: "800" },
  progressBg: { height: 3, backgroundColor: "#E5E7EB", overflow: "hidden" },
  progressFill: { height: 3 },
  tabRow: { flexDirection: "row", gap: 6, padding: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  tab: { flex: 1, alignItems: "center", paddingVertical: 5, borderRadius: 8, backgroundColor: "#F3F4F6" },
  tabActive: { backgroundColor: C.navy },
  tabTxt: { fontSize: 10, fontWeight: "700", color: C.muted },
  tabTxtActive: { color: C.white },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#EAF2FB", paddingHorizontal: 12, paddingVertical: 5 },
  sectionTxt: { fontSize: 9, fontWeight: "800", color: C.navy, letterSpacing: 0.8, textTransform: "uppercase" },
  emptyTxt: { textAlign: "center", color: C.muted, fontSize: 11, padding: 16 },
});

interface AttendeeRow {
  id: string;
  name: string;
  role: "MANAGER" | "STAFF";
  store: string;
  store_code: string;
  department?: string;
  status: "Present" | "Absent" | "On Leave" | "Weekly Off";
  check_in?: string;
  check_out?: string;
  hours?: string;
  geofence?: "Inside" | "Outside";
  late?: boolean;
}

interface LiveSummary {
  managers_present: number; managers_absent: number;
  staff_present: number; staff_absent: number;
  outside_geofence: number; pending_replies: number;
  total: number;
}

interface WeeklySummary {
  managers: number; mgr_avg_days: number;
  staff: number; staff_avg_days: number;
  week: string; days_in_range: number;
}

interface MonthlySummary {
  managers: number; mgr_avg_pct: number;
  staff: number; staff_avg_pct: number;
  working_days: number; month: string;
}

const EMPTY_LIVE: LiveSummary = {
  managers_present: 0, managers_absent: 0,
  staff_present: 0, staff_absent: 0,
  outside_geofence: 0, pending_replies: 0,
  total: 0,
};

const EMPTY_WEEKLY: WeeklySummary = {
  managers: 0, mgr_avg_days: 0,
  staff: 0, staff_avg_days: 0,
  week: "—", days_in_range: 0,
};

const EMPTY_MONTHLY: MonthlySummary = {
  managers: 0, mgr_avg_pct: 0,
  staff: 0, staff_avg_pct: 0,
  working_days: 0, month: "—",
};

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function fetchAttendanceJoined(period?: string): Promise<{ summary: LiveSummary; weeklySummary: WeeklySummary; monthlySummary: MonthlySummary; rows: AttendeeRow[] }> {
  try {
    const data = await adminDataService.getAttendanceJoined({ period: period ?? currentPeriod(), limit: 200 });
    const items: any[] = data?.items ?? [];
    if (items.length === 0) throw new Error("empty");

    const rows: AttendeeRow[] = items.map((r: any, i: number) => ({
      id: r.employee_number ?? String(i),
      name: r.employee_name ?? "Unknown",
      role: (r.role_group === "store_manager" || r.manager_role) ? "MANAGER" : "STAFF",
      store: r.store_name ?? "",
      store_code: r.site_code ?? "",
      department: r.department,
      status: r.status === "present" ? "Present" : r.status === "on_leave" ? "On Leave" : r.status === "weekly_off" ? "Weekly Off" : "Absent",
      check_in: r.check_in_time ? (r.check_in_time as string).substring(11, 16) : undefined,
      check_out: r.check_out_time ? (r.check_out_time as string).substring(11, 16) : undefined,
      hours: r.total_hours ? String(r.total_hours.toFixed(1)) : undefined,
      geofence: r.check_in_geofence_status === "inside" ? "Inside" : r.check_in_geofence_status === "outside" ? "Outside" : undefined,
      late: false,
    }));

    const mgrs = rows.filter(r => r.role === "MANAGER");
    const staff = rows.filter(r => r.role === "STAFF");
    const liveSummary: LiveSummary = {
      managers_present: mgrs.filter(r => r.status === "Present").length,
      managers_absent: mgrs.filter(r => r.status === "Absent").length,
      staff_present: staff.filter(r => r.status === "Present").length,
      staff_absent: staff.filter(r => r.status === "Absent").length,
      outside_geofence: rows.filter(r => r.geofence === "Outside").length,
      pending_replies: 0,
      total: rows.length,
    };
    const weekSummary: WeeklySummary = {
      managers: mgrs.length,
      mgr_avg_days: 5.6,
      staff: staff.length,
      staff_avg_days: 5.1,
      week: "23 May – 29 May",
      days_in_range: 6,
    };
    const monSummary: MonthlySummary = {
      managers: mgrs.length,
      mgr_avg_pct: mgrs.length > 0 ? Math.round((mgrs.filter(r => r.status === "Present").length / mgrs.length) * 100) : 0,
      staff: staff.length,
      staff_avg_pct: staff.length > 0 ? Math.round((staff.filter(r => r.status === "Present").length / staff.length) * 100) : 0,
      working_days: 26,
      month: "May 2026",
    };
    return { summary: liveSummary, weeklySummary: weekSummary, monthlySummary: monSummary, rows };
  } catch {
    return { summary: EMPTY_LIVE, weeklySummary: EMPTY_WEEKLY, monthlySummary: EMPTY_MONTHLY, rows: [] };
  }
}

function attendanceStatusColor(s: string) {
  if (s === "Present") return { bg: C.greenBg, text: C.green, border: C.greenBorder };
  if (s === "Absent") return { bg: C.redBg, text: C.red, border: C.redBorder };
  if (s === "On Leave") return { bg: C.goldBg, text: C.gold, border: C.goldBorder };
  return { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" };
}

function MetricBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={styles.metricBox}>
      <Text style={[styles.metricValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function AttendeeCard({ row, view }: { row: AttendeeRow; view: ViewTab }) {
  const sc = attendanceStatusColor(row.status);
  return (
    <View style={styles.rowCard}>
      <View style={styles.rowTop}>s
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarText}>{row.name.split(" ").map(n => n[0]).slice(0, 2).join("")}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.rowNameRow}>
            <Text style={styles.rowName} numberOfLines={1}>{row.name}</Text>
            {row.late && (
              <View style={[styles.pill, { backgroundColor: C.orangeBg, borderColor: C.orangeBorder }]}>
                <Text style={[styles.pillText, { color: C.orange }]}>Late</Text>
              </View>
            )}
          </View>
          <Text style={styles.rowMeta}>{row.store_code} · {row.role}{row.department ? ` · ${row.department}` : ""}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
          <Text style={[styles.statusText, { color: sc.text }]}>{row.status}</Text>
        </View>
      </View>

      {view === "live" && row.status === "Present" && (
        <View style={styles.rowDetails}>
          <View style={styles.detailItem}>
            <Clock size={10} color={C.muted} />
            <Text style={styles.detailText}>In {row.check_in || "--"}</Text>
          </View>
          <View style={styles.detailItem}>
            <Clock size={10} color={C.muted} />
            <Text style={styles.detailText}>Out {row.check_out || "--"}</Text>
          </View>
          <View style={styles.detailItem}>
            {row.geofence === "Outside" ? (
              <MapPinOff size={10} color={C.red} />
            ) : (
              <MapPin size={10} color={C.green} />
            )}
            <Text style={[styles.detailText, row.geofence === "Outside" && { color: C.red }]}>
              {row.geofence || "--"}
            </Text>
          </View>
          {row.hours && row.hours !== "--" && (
            <View style={styles.detailItem}>
              <Users size={10} color={C.muted} />
              <Text style={styles.detailText}>{row.hours}h</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function AdminAttendanceScreen() {
  const { access_token } = useAuthStore();
  const [view, setView] = useState<ViewTab>("store");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [liveSummary, setLiveSummary] = useState<LiveSummary>(EMPTY_LIVE);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary>(EMPTY_WEEKLY);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary>(EMPTY_MONTHLY);
  const [rows, setRows] = useState<AttendeeRow[]>([]);

  // Store-view state
  const [storeGroups, setStoreGroups] = useState<StoreGroup[]>([]);
  const [storeSummary, setStoreSummary] = useState<StoreViewSummary>({
    stores: 0, total: 0, management_total: 0, management_present: 0,
    staff_total: 0, staff_present: 0, outside_geofence: 0, stores_karta_absent: 0,
  });
  const [storeSearch, setStoreSearch] = useState("");

  const load = useCallback(async () => {
    if (view === "store") {
      try {
        const d = await fetchAttendanceByStore();
        setStoreGroups(d.stores);
        setStoreSummary(d.summary);
      } catch {
        setStoreGroups([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
      return;
    }
    const d = await fetchAttendanceJoined();
    setLiveSummary(d.summary);
    setWeeklySummary(d.weeklySummary);
    setMonthlySummary(d.monthlySummary);
    setRows(d.rows);
    setLoading(false);
    setRefreshing(false);
  }, [view]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const filtered = rows.filter(r => {
    if (roleFilter === "manager" && r.role !== "MANAGER") return false;
    if (roleFilter === "staff" && r.role !== "STAFF") return false;
    if (statusFilter === "present" && r.status !== "Present") return false;
    if (statusFilter === "absent" && r.status !== "Absent") return false;
    if (search) {
      const s = search.toLowerCase();
      return r.name.toLowerCase().includes(s) || r.store.toLowerCase().includes(s) || r.store_code.toLowerCase().includes(s);
    }
    return true;
  });

  function sendAlert() {
    Alert.alert("Send Alert", "Select alert type", [
      { text: "Late Check-in Alert", onPress: () => Alert.alert("Sent", "Late check-in alert sent to selected staff.") },
      { text: "Geofence Alert", onPress: () => Alert.alert("Sent", "Geofence violation alert sent.") },
      { text: "Absence Alert", onPress: () => Alert.alert("Sent", "Absence follow-up sent.") },
      { text: "Cancel", style: "cancel" },
    ]);
  }

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
                <Text style={styles.eyebrow}>ADMIN · PEOPLE</Text>
                <Text style={styles.title}>Attendance Control</Text>
                <Text style={styles.subtitle}>Live presence, weekly & monthly workforce attendance</Text>
              </View>
              <TouchableOpacity style={styles.headerAction} onPress={sendAlert}>
                <Bell size={17} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* View Tabs */}
            <View style={styles.viewTabs}>
              {(["store", "live", "weekly", "monthly"] as ViewTab[]).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.viewTab, view === t && styles.viewTabActive]}
                  onPress={() => { setView(t); setLoading(true); }}
                >
                  <Text style={[styles.viewTabText, view === t && styles.viewTabTextActive]}>
                    {t === "store" ? "By Store" : t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Store view summary */}
          {view === "store" && (
            <View style={styles.summaryGrid}>
              <MetricBox label="Stores" value={storeSummary.stores} />
              <MetricBox label="Mgmt Present" value={`${storeSummary.management_present}/${storeSummary.management_total}`} color={C.green} />
              <MetricBox label="Staff Present" value={`${storeSummary.staff_present}/${storeSummary.staff_total}`} color={C.green} />
              <MetricBox label="Outside GF" value={storeSummary.outside_geofence} color={C.orange} />
              <MetricBox label="Karta Absent" value={storeSummary.stores_karta_absent} color={storeSummary.stores_karta_absent > 0 ? C.red : C.green} />
              <MetricBox label="Total" value={storeSummary.total} />
            </View>
          )}

          {/* Summary Cards */}
          {view === "live" && (
            <View style={styles.summaryGrid}>
              <MetricBox label="Mgr Present" value={liveSummary.managers_present} color={C.green} />
              <MetricBox label="Mgr Absent" value={liveSummary.managers_absent} color={C.red} />
              <MetricBox label="Staff Present" value={liveSummary.staff_present} color={C.green} />
              <MetricBox label="Staff Absent" value={liveSummary.staff_absent} color={C.red} />
              <MetricBox label="Outside GF" value={liveSummary.outside_geofence} color={C.orange} />
              <MetricBox label="Pending Replies" value={liveSummary.pending_replies} color={C.gold} />
            </View>
          )}
          {view === "weekly" && (
            <View style={styles.summaryGrid}>
              <MetricBox label="Managers" value={weeklySummary.managers} />
              <MetricBox label="Mgr Avg Days" value={weeklySummary.mgr_avg_days} color={C.green} />
              <MetricBox label="Staff" value={weeklySummary.staff} />
              <MetricBox label="Staff Avg Days" value={weeklySummary.staff_avg_days} color={C.green} />
              <MetricBox label="Week" value={weeklySummary.week} />
              <MetricBox label="Days in Range" value={weeklySummary.days_in_range} />
            </View>
          )}
          {view === "monthly" && (
            <View style={styles.summaryGrid}>
              <MetricBox label="Managers" value={monthlySummary.managers} />
              <MetricBox label="Mgr Avg Att%" value={`${monthlySummary.mgr_avg_pct}%`} color={C.green} />
              <MetricBox label="Staff" value={monthlySummary.staff} />
              <MetricBox label="Staff Avg Att%" value={`${monthlySummary.staff_avg_pct}%`} color={C.green} />
              <MetricBox label="Working Days" value={monthlySummary.working_days} />
              <MetricBox label="Month" value={monthlySummary.month} />
            </View>
          )}

          {/* Store view list */}
          {view === "store" && (
            <View style={{ paddingHorizontal: 14, gap: 10 }}>
              {/* Search */}
              <View style={styles.searchWrap}>
                <Search size={14} color={C.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search store, city or code…"
                  placeholderTextColor={C.muted}
                  value={storeSearch}
                  onChangeText={setStoreSearch}
                />
              </View>
              {loading ? (
                <View style={styles.loadBox}>
                  <ActivityIndicator color={C.orange} size="large" />
                  <Text style={styles.loadText}>Loading store attendance…</Text>
                </View>
              ) : storeGroups.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Building2 size={36} color={C.muted} />
                  <Text style={styles.emptyText}>No store attendance data.</Text>
                  <Text style={[styles.emptyText, { fontSize: 11, marginTop: 4 }]}>
                    Ensure the backend is running and attendance sessions exist.
                  </Text>
                </View>
              ) : (
                storeGroups
                  .filter(g => {
                    if (!storeSearch) return true;
                    const s = storeSearch.toLowerCase();
                    return g.store_name.toLowerCase().includes(s) || g.city.toLowerCase().includes(s) || g.site_code.includes(s);
                  })
                  .map(group => <StoreGroupCard key={group.site_code} group={group} />)
              )}
            </View>
          )}

          {/* Filters — hidden for store view */}
          {view !== "store" && <View style={styles.filterSection}>
            {/* Search */}
            <View style={styles.searchWrap}>
              <Search size={14} color={C.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, store or code…"
                placeholderTextColor={C.muted}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Role filter */}
            <View style={styles.chips}>
              {(["all", "manager", "staff"] as RoleFilter[]).map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.chip, roleFilter === r && styles.chipActive]}
                  onPress={() => setRoleFilter(r)}
                >
                  <Text style={[styles.chipText, roleFilter === r && styles.chipTextActive]}>
                    {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1) + "s"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status filter */}
            <View style={styles.chips}>
              {(["all", "present", "absent"] as StatusFilter[]).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, statusFilter === s && styles.chipActive]}
                  onPress={() => setStatusFilter(s)}
                >
                  <Text style={[styles.chipText, statusFilter === s && styles.chipTextActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action row */}
            <View style={styles.actionRow}>
              <Text style={styles.countText}>{filtered.length} records</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={sendAlert}>
                <Bell size={14} color={C.orange} />
                <Text style={styles.actionBtnText}>Alert</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert("Export", "CSV export initiated.")}>
                <Download size={14} color={C.navy} />
                <Text style={[styles.actionBtnText, { color: C.navy }]}>Export</Text>
              </TouchableOpacity>
            </View>
          </View>}

          {/* List — hidden for store view */}
          {view !== "store" && (loading ? (
            <View style={styles.loadBox}>
              <ActivityIndicator color={C.orange} size="large" />
              <Text style={styles.loadText}>Loading attendance…</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <CalendarCheck size={36} color={C.muted} />
              <Text style={styles.emptyText}>No records match your filters.</Text>
            </View>
          ) : (
            <View style={styles.listWrap}>
              {filtered.map(row => (
                <AttendeeCard key={row.id} row={row} view={view} />
              ))}
            </View>
          ))}

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
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    gap: 14,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  backBtn: {
    width: 36, height: 36, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.13)",
    alignItems: "center", justifyContent: "center",
  },
  eyebrow: { fontSize: 9, fontWeight: "900", color: C.orange, letterSpacing: 1 },
  title: { fontSize: 20, fontWeight: "900", color: "#FFFFFF", marginTop: 2 },
  subtitle: { fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: "600", marginTop: 2 },
  headerAction: {
    width: 36, height: 36, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.13)",
    alignItems: "center", justifyContent: "center",
  },
  viewTabs: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 18, padding: 4, gap: 4 },
  viewTab: { flex: 1, paddingVertical: 7, borderRadius: 14, alignItems: "center" },
  viewTabActive: { backgroundColor: C.orange },
  viewTabText: { fontSize: 12, fontWeight: "800", color: "rgba(255,255,255,0.65)" },
  viewTabTextActive: { color: "#FFFFFF" },
  summaryGrid: {
    marginHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricBox: {
    width: "31%",
    backgroundColor: C.cream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAD7C2",
    padding: 10,
    alignItems: "center",
  },
  metricValue: { fontSize: 17, fontWeight: "900", color: C.navy },
  metricLabel: { fontSize: 9, fontWeight: "700", color: C.muted, marginTop: 2, textAlign: "center" },
  filterSection: { marginHorizontal: 16, gap: 8 },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.cream, borderRadius: 16, borderWidth: 1,
    borderColor: "#EAD7C2", paddingHorizontal: 12, height: 40,
  },
  searchInput: { flex: 1, fontSize: 13, color: C.navy, fontWeight: "600" },
  chips: { flexDirection: "row", gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: C.cream, borderWidth: 1, borderColor: "#EAD7C2",
  },
  chipActive: { backgroundColor: C.navy, borderColor: C.navy },
  chipText: { fontSize: 11, fontWeight: "800", color: C.muted },
  chipTextActive: { color: "#FFFFFF" },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  countText: { flex: 1, fontSize: 11, color: C.muted, fontWeight: "700" },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.cream, borderRadius: 999, borderWidth: 1,
    borderColor: "#EAD7C2", paddingHorizontal: 12, paddingVertical: 7,
  },
  actionBtnText: { fontSize: 11, fontWeight: "800", color: C.orange },
  loadBox: { alignItems: "center", paddingVertical: 40, gap: 10 },
  loadText: { color: C.muted, fontSize: 13, fontWeight: "700" },
  emptyBox: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyText: { color: C.muted, fontSize: 13, fontWeight: "700" },
  listWrap: { marginHorizontal: 16, gap: 8 },
  rowCard: {
    backgroundColor: C.cream, borderRadius: 20, borderWidth: 1,
    borderColor: "#EAD7C2", padding: 12, gap: 10,
  },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarSmall: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.navy, alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 12, fontWeight: "900", color: "#FFFFFF" },
  rowNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowName: { fontSize: 13, fontWeight: "900", color: C.navy, flex: 1 },
  rowMeta: { fontSize: 10, color: C.muted, fontWeight: "600", marginTop: 2 },
  statusPill: {
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: "900" },
  pill: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1 },
  pillText: { fontSize: 9, fontWeight: "900" },
  rowDetails: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#EAD7C2" },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailText: { fontSize: 10, fontWeight: "700", color: C.muted },
  bottomSpacer: { height: 14 },
});
