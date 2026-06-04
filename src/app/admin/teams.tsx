import { router } from "expo-router";
import {
  Building2, ChevronDown, ChevronUp, Mail, MapPin,
  Phone, Search, Shield, Store, UserCog, Users, UsersRound,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, RefreshControl, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { adminDataService, AdminEmployeeEnriched } from "@/services/team.service";

const C = {
  navy: "#102B45", orange: "#C95F18", gold: "#B7791F",
  beige: "#F6EBDC", cream: "#FFFDF8", muted: "#8A8178",
  brown: "#6B3F20", green: "#166534", red: "#B91C1C", white: "#FFFFFF",
  greenBg: "#DCFCE7", greenBorder: "#BBF7D0",
  redBg: "#FEE2E2", redBorder: "#FECACA",
  goldBg: "#FFF4D8", goldBorder: "#F5D28A",
  blueBg: "#EAF2FB", blueBorder: "#C9DBEF",
  purpleBg: "#EDE9FE", purpleBorder: "#C4B5FD",
};

type RoleFilter = "all" | "management" | "staff";
type ZoneFilter = string;

interface StoreGroup {
  site_code: string;
  store_name: string;
  city: string;
  state: string;
  zone: string;
  karta: AdminEmployeeEnriched | null;
  managers: AdminEmployeeEnriched[];
  staff: AdminEmployeeEnriched[];
  total: number;
}

// ── Role classification helpers ─────────────────────────────────────────────

const MANAGEMENT_TITLES = [
  "STORE KARTA", "ASSISTANT STORE KARTA", "STORE MANAGER", "ASSISTANT STORE MANAGER",
  "DEPARTMENT MANAGER", "ASSISTANT DEPARTMENT MANAGER", "DEPARTMENT HEAD",
  "HEAD CASHIER", "WAREHOUSE MANAGER", "REGIONAL COMMERCIAL HEAD",
];

function isManagement(emp: AdminEmployeeEnriched): boolean {
  const title = (emp.job_title ?? "").toUpperCase();
  const rg = (emp.role_group ?? "").toLowerCase();
  return rg === "store_management" || MANAGEMENT_TITLES.some(t => title.includes(t));
}

function isKarta(emp: AdminEmployeeEnriched): boolean {
  const title = (emp.job_title ?? "").toUpperCase();
  return title.includes("STORE KARTA") || title === "ASSISTANT STORE KARTA" || (emp.role ?? "") === "store_manager";
}

function roleColor(emp: AdminEmployeeEnriched): { bg: string; text: string; border: string } {
  const title = (emp.job_title ?? "").toUpperCase();
  if (title.includes("STORE KARTA"))          return { bg: C.goldBg, text: C.gold, border: C.goldBorder };
  if (title.includes("REGIONAL"))             return { bg: C.purpleBg, text: "#6D28D9", border: C.purpleBorder };
  if (title.includes("DEPARTMENT HEAD"))      return { bg: C.blueBg, text: C.navy, border: C.blueBorder };
  if (title.includes("DEPARTMENT MANAGER"))   return { bg: C.blueBg, text: C.navy, border: C.blueBorder };
  if (title.includes("WAREHOUSE"))            return { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" };
  if (title.includes("HEAD CASHIER"))         return { bg: "#F0FDF4", text: C.green, border: C.greenBorder };
  if (isManagement(emp))                      return { bg: C.blueBg, text: C.navy, border: C.blueBorder };
  return { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" };
}

function deptColor(dept: string): { bg: string; text: string } {
  const d = (dept ?? "").toUpperCase();
  if (d.includes("FURNITURE"))           return { bg: "#EEF6FF", text: C.navy };
  if (d.includes("HOMEWARE"))            return { bg: C.greenBg, text: C.green };
  if (d.includes("MODULAR") || d.includes("DESIGN")) return { bg: "#FFF7ED", text: "#C2410C" };
  if (d.includes("HOME DECOR"))          return { bg: C.goldBg, text: C.gold };
  if (d.includes("ACCOUNT") || d.includes("FINANCE")) return { bg: "#F0FDF4", text: C.green };
  if (d.includes("SUPPLY") || d.includes("WAREHOUSE")) return { bg: "#FFEDD5", text: "#C2410C" };
  if (d.includes("OPERATIONS"))          return { bg: C.purpleBg, text: "#6D28D9" };
  return { bg: "#F3F4F6", text: "#6B7280" };
}

function initials(name: string) {
  return (name || "?").split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
}

// ── Employee Row ────────────────────────────────────────────────────────────

function EmployeeRow({ emp, isKartaFlag }: { emp: AdminEmployeeEnriched; isKartaFlag?: boolean }) {
  const rc = roleColor(emp);
  const dc = deptColor(emp.department ?? "");
  const mgmt = isManagement(emp);

  return (
    <View style={[styles.empRow, mgmt && styles.empRowMgmt]}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: mgmt ? C.navy : "#E5E7EB" }]}>
        <Text style={[styles.avatarTxt, { color: mgmt ? C.white : "#6B7280" }]}>
          {initials(emp.employee_name)}
        </Text>
      </View>

      {/* Main info */}
      <View style={{ flex: 1 }}>
        <View style={styles.rowTop}>
          <Text style={styles.empName} numberOfLines={1}>{emp.employee_name}</Text>
          {isKartaFlag && (
            <View style={[styles.badge, { backgroundColor: C.goldBg, borderColor: C.goldBorder }]}>
              <Text style={[styles.badgeTxt, { color: C.gold }]}>Store Karta</Text>
            </View>
          )}
        </View>
        <Text style={styles.empCode}>#{emp.employee_number}</Text>

        {/* Job title badge */}
        <View style={[styles.badge, { backgroundColor: rc.bg, borderColor: rc.border, marginTop: 4, alignSelf: "flex-start" }]}>
          <Text style={[styles.badgeTxt, { color: rc.text }]} numberOfLines={1}>
            {emp.job_title || emp.role || "Staff"}
          </Text>
        </View>

        {/* Department */}
        {emp.department && (
          <View style={[styles.badge, { backgroundColor: dc.bg, marginTop: 3, alignSelf: "flex-start" }]}>
            <Text style={[styles.badgeTxt, { color: dc.text }]}>{emp.department}</Text>
          </View>
        )}

        {/* Contact */}
        <View style={[styles.rowTop, { marginTop: 4 }]}>
          {emp.email ? (
            <View style={styles.contactChip}>
              <Mail size={9} color={C.muted} />
              <Text style={styles.contactTxt} numberOfLines={1}>{emp.email}</Text>
            </View>
          ) : (
            <View style={styles.contactChip}>
              <Mail size={9} color={C.redBorder} />
              <Text style={[styles.contactTxt, { color: C.red }]}>No email</Text>
            </View>
          )}
          {emp.mobile ? (
            <View style={styles.contactChip}>
              <Phone size={9} color={C.muted} />
              <Text style={styles.contactTxt}>{emp.mobile}</Text>
            </View>
          ) : null}
        </View>

        {/* Manager link */}
        {emp.manager_name && (
          <Text style={styles.managerLine}>
            Reports to: {emp.manager_name} ({emp.manager_number})
          </Text>
        )}
        {!emp.manager_name && !isKartaFlag && !isManagement(emp) && (
          <Text style={[styles.managerLine, { color: C.red }]}>⚠ No manager mapped</Text>
        )}
      </View>

      {/* Band */}
      {emp.band ? (
        <View style={styles.bandBox}>
          <Text style={styles.bandTxt}>{emp.band}</Text>
          <Text style={styles.bandLbl}>Band</Text>
        </View>
      ) : null}
    </View>
  );
}

// ── Store Card ───────────────────────────────────────────────────────────────

function StoreCard({ group }: { group: StoreGroup }) {
  const [expanded, setExpanded] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const filteredEmps = useMemo(() => {
    const all = [...group.managers, ...group.staff];
    if (roleFilter === "management") return all.filter(isManagement);
    if (roleFilter === "staff") return all.filter(e => !isManagement(e));
    return all;
  }, [group.managers, group.staff, roleFilter]);

  const mgmtCount = group.managers.length;
  const staffCount = group.staff.length;

  return (
    <View style={styles.storeCard}>
      {/* Store header */}
      <TouchableOpacity style={styles.storeHeader} onPress={() => setExpanded(v => !v)} activeOpacity={0.8}>
        <View style={styles.storeIconBox}>
          <Building2 size={18} color={C.orange} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.storeName}>{group.store_name}</Text>
          <Text style={styles.storeMeta}>
            {group.city} · {group.state} · <Text style={{ color: C.gold, fontWeight: "700" }}>{group.zone}</Text>
          </Text>
          <Text style={styles.storeCode}>Site Code: {group.site_code}</Text>
        </View>
        <View style={styles.countBubbles}>
          <View style={[styles.countBubble, { backgroundColor: C.blueBg }]}>
            <UserCog size={10} color={C.navy} />
            <Text style={[styles.countTxt, { color: C.navy }]}>{mgmtCount}</Text>
          </View>
          <View style={[styles.countBubble, { backgroundColor: C.greenBg }]}>
            <Users size={10} color={C.green} />
            <Text style={[styles.countTxt, { color: C.green }]}>{staffCount}</Text>
          </View>
          {expanded ? <ChevronUp size={14} color={C.muted} /> : <ChevronDown size={14} color={C.muted} />}
        </View>
      </TouchableOpacity>

      {/* Store Karta summary bar */}
      {group.karta && (
        <View style={styles.kartaBar}>
          <Shield size={11} color={C.gold} />
          <Text style={styles.kartaTxt}>
            {group.karta.employee_name} — {group.karta.job_title}
          </Text>
          <Text style={styles.kartaCode}>#{group.karta.employee_number}</Text>
        </View>
      )}
      {!group.karta && (
        <View style={[styles.kartaBar, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
          <Shield size={11} color={C.red} />
          <Text style={[styles.kartaTxt, { color: C.red }]}>No Store Karta assigned</Text>
        </View>
      )}

      {/* Expanded employee list */}
      {expanded && (
        <View style={styles.empSection}>
          {/* Filter chips */}
          <View style={styles.filterRow}>
            {([
              { key: "all", label: `All (${group.total})` },
              { key: "management", label: `Management (${mgmtCount})` },
              { key: "staff", label: `Staff (${staffCount})` },
            ] as { key: RoleFilter; label: string }[]).map(chip => (
              <TouchableOpacity
                key={chip.key}
                style={[styles.chip, roleFilter === chip.key && styles.chipActive]}
                onPress={() => setRoleFilter(chip.key)}
              >
                <Text style={[styles.chipTxt, roleFilter === chip.key && styles.chipTxtActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredEmps.length === 0 ? (
            <Text style={styles.emptyTxt}>No employees in this category.</Text>
          ) : (
            filteredEmps.map(emp => (
              <EmployeeRow
                key={emp.employee_number}
                emp={emp}
                isKartaFlag={isKarta(emp)}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminTeamsScreen() {
  const [allEmployees, setAllEmployees] = useState<AdminEmployeeEnriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>("all");
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    setError(null);
    try {
      let all: AdminEmployeeEnriched[] = [];
      let page = 1;
      // Paginate until we get all employees
      while (true) {
        const res = await adminDataService.getEmployeesEnriched({ page, limit: 200 });
        const items = res?.items ?? [];
        all = [...all, ...items];
        if (items.length < 200) break;
        page++;
      }
      setAllEmployees(all);
    } catch (e: any) {
      setError("Could not load employee data. Check API connection.");
      setAllEmployees([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  const onRefresh = useCallback(() => { setRefreshing(true); loadEmployees(); }, [loadEmployees]);

  // Group employees by store
  const storeGroups = useMemo<StoreGroup[]>(() => {
    const byStore: Record<string, AdminEmployeeEnriched[]> = {};
    for (const emp of allEmployees) {
      const sc = emp.site_code ?? "unassigned";
      if (!byStore[sc]) byStore[sc] = [];
      byStore[sc].push(emp);
    }

    return Object.entries(byStore)
      .filter(([sc]) => sc !== "unassigned")
      .map(([sc, emps]) => {
        const first = emps[0];
        const karta = emps.find(isKarta) ?? null;
        const managers = emps.filter(e => isManagement(e) && !isKarta(e));
        const staff = emps.filter(e => !isManagement(e));
        return {
          site_code: sc,
          store_name: first.store_name ?? sc,
          city: first.city ?? "",
          state: first.state ?? "",
          zone: first.zone ?? "",
          karta,
          managers: karta ? [karta, ...managers] : managers,
          staff,
          total: emps.length,
        };
      })
      .sort((a, b) => a.store_name.localeCompare(b.store_name));
  }, [allEmployees]);

  const zones = useMemo(() =>
    ["all", ...Array.from(new Set(storeGroups.map(g => g.zone).filter(Boolean))).sort()],
    [storeGroups]
  );

  const filteredGroups = useMemo(() => {
    return storeGroups.filter(g => {
      const matchZone = zoneFilter === "all" || g.zone === zoneFilter;
      const matchSearch = !search || g.store_name.toLowerCase().includes(search.toLowerCase())
        || g.city.toLowerCase().includes(search.toLowerCase())
        || g.site_code.includes(search);
      return matchZone && matchSearch;
    });
  }, [storeGroups, zoneFilter, search]);

  const totalMgmt = allEmployees.filter(isManagement).length;
  const totalStaff = allEmployees.filter(e => !isManagement(e)).length;
  const noManager = allEmployees.filter(e => !e.manager_name && !isKarta(e) && !isManagement(e)).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.orange} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.eyebrow}>WORKFORCE</Text>
            <Text style={styles.title}>Teams</Text>
            <Text style={styles.subtitle}>All stores · All managers · All staff · Real data</Text>

            {/* KPI row */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Store size={13} color={C.gold} />
                <Text style={styles.kpiVal}>{storeGroups.length}</Text>
                <Text style={styles.kpiLbl}>Stores</Text>
              </View>
              <View style={styles.kpiCard}>
                <UsersRound size={13} color={C.white} />
                <Text style={styles.kpiVal}>{allEmployees.length}</Text>
                <Text style={styles.kpiLbl}>Total Staff</Text>
              </View>
              <View style={styles.kpiCard}>
                <UserCog size={13} color="#93C5FD" />
                <Text style={styles.kpiVal}>{totalMgmt}</Text>
                <Text style={styles.kpiLbl}>Management</Text>
              </View>
              <View style={styles.kpiCard}>
                <Users size={13} color="#86EFAC" />
                <Text style={styles.kpiVal}>{totalStaff}</Text>
                <Text style={styles.kpiLbl}>Staff</Text>
              </View>
              {noManager > 0 && (
                <View style={[styles.kpiCard, { backgroundColor: "rgba(185,28,28,0.18)" }]}>
                  <Text style={[styles.kpiVal, { color: "#FCA5A5" }]}>{noManager}</Text>
                  <Text style={styles.kpiLbl}>No Mgr</Text>
                </View>
              )}
            </View>
          </View>

          <View style={{ padding: 14, gap: 12, paddingBottom: 100 }}>
            {/* Search */}
            <View style={styles.searchBox}>
              <Search size={14} color={C.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search store, city, or code…"
                placeholderTextColor={C.muted}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Zone filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {zones.map(z => (
                <TouchableOpacity
                  key={z}
                  style={[styles.chip, zoneFilter === z && styles.chipActive]}
                  onPress={() => setZoneFilter(z)}
                >
                  <Text style={[styles.chipTxt, zoneFilter === z && styles.chipTxtActive]}>
                    {z === "all" ? "All Zones" : z}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loading ? (
              <ActivityIndicator color={C.navy} style={{ marginTop: 40 }} />
            ) : error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTxt}>{error}</Text>
              </View>
            ) : filteredGroups.length === 0 ? (
              <View style={styles.emptyBox}>
                <Building2 size={32} color={C.muted} />
                <Text style={styles.emptyTitle}>No stores found</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your filters.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionLabel}>
                  {filteredGroups.length} store{filteredGroups.length !== 1 ? "s" : ""} · {filteredGroups.reduce((s, g) => s + g.total, 0)} employees
                </Text>
                {filteredGroups.map(group => (
                  <StoreCard key={group.site_code} group={group} />
                ))}
              </>
            )}
          </View>
        </ScrollView>

        <AdminBottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },
  root: { flex: 1, backgroundColor: "#F5EEE5" },
  header: { backgroundColor: C.navy, padding: 18, paddingBottom: 20 },
  eyebrow: { fontSize: 10, fontWeight: "800", color: C.gold, letterSpacing: 1.5, marginBottom: 2 },
  title: { fontSize: 24, fontWeight: "800", color: C.white },
  subtitle: { fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2, marginBottom: 14 },
  kpiRow: { flexDirection: "row", gap: 8 },
  kpiCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 10, padding: 8, alignItems: "center", gap: 3 },
  kpiVal: { fontSize: 16, fontWeight: "800", color: C.white },
  kpiLbl: { fontSize: 8, color: "rgba(255,255,255,0.6)", textAlign: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.white, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, elevation: 1 },
  searchInput: { flex: 1, fontSize: 13, color: C.navy },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: C.white, borderWidth: 1, borderColor: "#DDD" },
  chipActive: { backgroundColor: C.navy, borderColor: C.navy },
  chipTxt: { fontSize: 11, fontWeight: "600", color: C.muted },
  chipTxtActive: { color: C.white },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: C.muted },
  storeCard: { backgroundColor: C.white, borderRadius: 14, overflow: "hidden", elevation: 2 },
  storeHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  storeIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#FFF4E6", alignItems: "center", justifyContent: "center" },
  storeName: { fontSize: 14, fontWeight: "800", color: C.navy },
  storeMeta: { fontSize: 11, color: C.muted, marginTop: 1 },
  storeCode: { fontSize: 10, color: C.muted, fontFamily: "monospace", marginTop: 1 },
  countBubbles: { flexDirection: "row", alignItems: "center", gap: 5 },
  countBubble: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  countTxt: { fontSize: 11, fontWeight: "700" },
  kartaBar: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#FFFBEB", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#FDE68A", paddingHorizontal: 14, paddingVertical: 7 },
  kartaTxt: { flex: 1, fontSize: 11, fontWeight: "700", color: C.brown },
  kartaCode: { fontSize: 10, color: C.muted, fontFamily: "monospace" },
  empSection: { borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingBottom: 8 },
  filterRow: { flexDirection: "row", gap: 6, padding: 10, paddingBottom: 6 },
  empRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F9FAFB" },
  empRowMgmt: { backgroundColor: "#FAFBFF" },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarTxt: { fontSize: 13, fontWeight: "800" },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  empName: { fontSize: 13, fontWeight: "700", color: C.navy, flex: 1 },
  empCode: { fontSize: 10, color: C.muted, fontFamily: "monospace", marginTop: 1 },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1, borderColor: "transparent" },
  badgeTxt: { fontSize: 9, fontWeight: "700" },
  contactChip: { flexDirection: "row", alignItems: "center", gap: 3 },
  contactTxt: { fontSize: 9, color: C.muted, maxWidth: 130 },
  managerLine: { fontSize: 9, color: C.muted, marginTop: 3, fontStyle: "italic" },
  bandBox: { alignItems: "center", justifyContent: "center", width: 36 },
  bandTxt: { fontSize: 11, fontWeight: "800", color: C.navy },
  bandLbl: { fontSize: 8, color: C.muted },
  errorBox: { backgroundColor: "#FEE2E2", borderRadius: 10, padding: 16, borderWidth: 1, borderColor: "#FECACA" },
  errorTxt: { fontSize: 12, color: C.red, textAlign: "center" },
  emptyBox: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: C.navy },
  emptySubtitle: { fontSize: 11, color: C.muted },
  emptyTxt: { fontSize: 11, color: C.muted, textAlign: "center", padding: 16 },
});
