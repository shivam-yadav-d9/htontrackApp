import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import {
  Award, BarChart2, BookOpen, CheckCircle2, Clock,
  GraduationCap, Star, Users, AlertTriangle, Play,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { adminDataService } from "@/services/team.service";

const C = {
  navy: "#102B45", orange: "#C95F18", gold: "#B7791F", beige: "#F6EBDC",
  cream: "#FFFDF8", muted: "#8A8178", white: "#FFFFFF", green: "#166534",
  red: "#B91C1C", amber: "#92400E",
};


// ── API Fetchers ───────────────────────────────────────────────────────────────

async function fetchCourses() {
  try {
    const data = await adminDataService.getCoursesJoined({ limit: 200 });
    const items: any[] = data?.items ?? [];
    if (!items.length) return { library: [] };

    // Build library from unique courses in the progress data
    const courseMap: Record<string, any> = {};
    for (const i of items) {
      if (!courseMap[i.course_id]) {
        courseMap[i.course_id] = {
          id: i.course_id, title: i.course_title ?? i.course_id,
          section: i.category ?? "General", type: "Course",
          audience: "All Roles", stores: 0, staff: 0, status: "Published",
          dueDate: "", attempts: 0, passRate: 0, avgScore: 0, certEnabled: false,
          _storeSet: new Set<string>(),
        };
      }
      const c = courseMap[i.course_id];
      c.staff++;
      c._storeSet.add(i.site_code);
      if (i.status !== "not_started") c.attempts++;
    }
    const library = Object.values(courseMap).map((c: any) => {
      const { _storeSet, ...rest } = c;
      return { ...rest, stores: _storeSet.size };
    });
    return { library: library.length ? library : [] };
  } catch { return { library: [] }; }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={ss.pbarBg}>
      <View style={[ss.pbarFill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    "Excellent":     { bg: "#DCFCE7", text: "#166534" },
    "Good":          { bg: "#DBEAFE", text: "#1E40AF" },
    "Needs Coaching":{ bg: "#FEF3C7", text: "#92400E" },
    "At Risk":       { bg: "#FEE2E2", text: "#B91C1C" },
    "Published":     { bg: "#DCFCE7", text: "#166534" },
    "Draft":         { bg: "#F3F4F6", text: "#6B7280" },
    "Failed":        { bg: "#FEE2E2", text: "#B91C1C" },
    "Overdue":       { bg: "#FEE2E2", text: "#B91C1C" },
    "Pending":       { bg: "#FEF3C7", text: "#92400E" },
  };
  const s = map[status] ?? { bg: "#F3F4F6", text: "#6B7280" };
  return (
    <View style={[ss.badge, { backgroundColor: s.bg }]}>
      <Text style={[ss.badgeTxt, { color: s.text }]}>{status}</Text>
    </View>
  );
}

// ── Library Tab ────────────────────────────────────────────────────────────────

function LibraryTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = [].filter((c) => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.section.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <View style={{ gap: 12 }}>
      <TextInput style={ss.searchInput} placeholder="Search courses…" placeholderTextColor={C.muted}
        value={search} onChangeText={setSearch} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
        {["", "Published", "Draft"].map((s) => (
          <TouchableOpacity key={s || "all"} onPress={() => setStatusFilter(s)}
            style={[ss.chip, statusFilter === s && ss.chipActive]}>
            <Text style={[ss.chipTxt, statusFilter === s && ss.chipTxtActive]}>{s || "All"}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {filtered.map((c) => (
        <TouchableOpacity key={c.id} style={ss.card} activeOpacity={0.9}
          onPress={() => Alert.alert(c.title, `Section: ${c.section}\nType: ${c.type}\nAudience: ${c.audience}\nStores: ${c.stores} · Staff: ${c.staff}\nAttempts: ${c.attempts} · Pass Rate: ${c.passRate}%`)}>
          <View style={ss.row}>
            <View style={{ flex: 1 }}>
              <Text style={ss.cardTitle}>{c.title}</Text>
              <Text style={ss.cardSub}>{c.section} · {c.type}</Text>
              <Text style={ss.cardSub}>Due: {c.dueDate} · {c.audience}</Text>
            </View>
            <View style={{ gap: 4, alignItems: "flex-end" }}>
              <StatusBadge status={c.status} />
              {c.certEnabled && (
                <View style={[ss.badge, { backgroundColor: "#FEF9C3" }]}>
                  <Text style={[ss.badgeTxt, { color: "#854D0E" }]}>Cert</Text>
                </View>
              )}
            </View>
          </View>
          {c.attempts > 0 && (
            <View style={[ss.row, { marginTop: 10, gap: 16 }]}>
              <View style={ss.statCell}>
                <Text style={ss.statVal}>{c.stores}</Text>
                <Text style={ss.statLbl}>Stores</Text>
              </View>
              <View style={ss.statCell}>
                <Text style={ss.statVal}>{c.staff}</Text>
                <Text style={ss.statLbl}>Staff</Text>
              </View>
              <View style={ss.statCell}>
                <Text style={ss.statVal}>{c.attempts}</Text>
                <Text style={ss.statLbl}>Attempts</Text>
              </View>
              <View style={ss.statCell}>
                <Text style={[ss.statVal, { color: c.passRate >= 80 ? C.green : C.amber }]}>{c.passRate}%</Text>
                <Text style={ss.statLbl}>Pass Rate</Text>
              </View>
              <View style={ss.statCell}>
                <Text style={ss.statVal}>{c.avgScore}</Text>
                <Text style={ss.statLbl}>Avg Score</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Assigned Tab ───────────────────────────────────────────────────────────────

function AssignedTab() {
  return (
    <View style={{ gap: 12 }}>
      {[].map((a) => (
        <View key={a.id} style={ss.card}>
          <Text style={ss.cardTitle}>{a.course}</Text>
          <Text style={ss.cardSub}>{a.stores} · {a.roles}</Text>
          <Text style={ss.cardSub}>Due: {a.dueDate}</Text>
          <View style={[ss.row, { marginTop: 10, gap: 16 }]}>
            <View style={ss.statCell}>
              <Text style={ss.statVal}>{a.staffCount}</Text>
              <Text style={ss.statLbl}>Assigned</Text>
            </View>
            <View style={ss.statCell}>
              <Text style={[ss.statVal, { color: C.green }]}>{a.completed}</Text>
              <Text style={ss.statLbl}>Done</Text>
            </View>
            <View style={ss.statCell}>
              <Text style={[ss.statVal, { color: C.amber }]}>{a.pending}</Text>
              <Text style={ss.statLbl}>Pending</Text>
            </View>
            <View style={ss.statCell}>
              <Text style={[ss.statVal, { color: C.red }]}>{a.failed}</Text>
              <Text style={ss.statLbl}>Failed</Text>
            </View>
          </View>
          <View style={{ marginTop: 8 }}>
            <View style={ss.row}>
              <Text style={ss.statLbl}>Completion</Text>
              <Text style={[ss.statLbl, { color: a.completionPct >= 80 ? C.green : C.amber }]}>{a.completionPct}%</Text>
            </View>
            <ProgressBar pct={a.completionPct} color={a.completionPct >= 80 ? C.green : C.amber} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Progress Tab ───────────────────────────────────────────────────────────────

function ProgressTab() {
  const [view, setView] = useState<"stores" | "staff">("stores");
  return (
    <View style={{ gap: 12 }}>
      <View style={ss.segmentRow}>
        <TouchableOpacity onPress={() => setView("stores")} style={[ss.segBtn, view === "stores" && ss.segBtnActive]}>
          <Text style={[ss.segTxt, view === "stores" && ss.segTxtActive]}>Stores</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView("staff")} style={[ss.segBtn, view === "staff" && ss.segBtnActive]}>
          <Text style={[ss.segTxt, view === "staff" && ss.segTxtActive]}>Staff</Text>
        </TouchableOpacity>
      </View>

      {view === "stores" ? [].map((s) => (
        <View key={s.code} style={ss.card}>
          <View style={ss.row}>
            <View style={{ flex: 1 }}>
              <Text style={ss.cardTitle}>{s.name}</Text>
              <Text style={ss.cardSub}>{s.manager} · {s.staff} staff</Text>
            </View>
            <Text style={[ss.statVal, { color: s.completionPct >= 80 ? C.green : C.amber }]}>{s.completionPct}%</Text>
          </View>
          <View style={[ss.row, { marginTop: 8, gap: 12 }]}>
            <Text style={ss.cardSub}>Done: <Text style={{ color: C.green }}>{s.completed}</Text></Text>
            <Text style={ss.cardSub}>Pending: <Text style={{ color: C.amber }}>{s.pending}</Text></Text>
            <Text style={ss.cardSub}>Failed: <Text style={{ color: C.red }}>{s.failed}</Text></Text>
            <Text style={ss.cardSub}>Avg: {s.avgScore}</Text>
          </View>
          <ProgressBar pct={s.completionPct} color={s.completionPct >= 80 ? C.green : C.amber} />
        </View>
      )) : [].map((s) => (
        <View key={s.id} style={ss.card}>
          <View style={ss.row}>
            <View style={{ flex: 1 }}>
              <Text style={ss.cardTitle}>{s.name}</Text>
              <Text style={ss.cardSub}>{s.code} · {s.dept} · {s.store}</Text>
            </View>
            <StatusBadge status={s.status} />
          </View>
          <View style={[ss.row, { marginTop: 8, gap: 12 }]}>
            <Text style={ss.cardSub}>Assigned: {s.assigned}</Text>
            <Text style={ss.cardSub}>Done: <Text style={{ color: C.green }}>{s.completed}</Text></Text>
            <Text style={ss.cardSub}>Certs: <Text style={{ color: C.gold }}>{s.certs}</Text></Text>
            <Text style={ss.cardSub}>Avg: {s.avgScore}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Pending Tab ────────────────────────────────────────────────────────────────

function PendingTab() {
  return (
    <View style={{ gap: 12 }}>
      <View style={ss.card}>
        <Text style={ss.cardSub}>Staff who failed or haven't started assigned courses</Text>
      </View>
      {[].map((p) => (
        <View key={p.id} style={ss.card}>
          <View style={ss.row}>
            <View style={{ flex: 1 }}>
              <Text style={ss.cardTitle}>{p.staff}</Text>
              <Text style={ss.cardSub}>{p.store}</Text>
              <Text style={[ss.cardSub, { color: C.navy }]}>{p.course}</Text>
            </View>
            <StatusBadge status={p.status} />
          </View>
          <View style={[ss.row, { marginTop: 8 }]}>
            <Text style={ss.cardSub}>Due: {p.dueDate}</Text>
            {p.failedAttempts > 0 && <Text style={[ss.cardSub, { color: C.red }]}>{p.failedAttempts} failed attempts · Score: {p.score}%</Text>}
          </View>
          <TouchableOpacity style={ss.actionBtn} onPress={() => Alert.alert("Reminder Sent", `Reminder sent to ${p.staff} for ${p.course}`)}>
            <Text style={ss.actionBtnTxt}>Send Reminder</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "library",  label: "Library",  icon: BookOpen },
  { id: "assigned", label: "Assigned", icon: Users },
  { id: "progress", label: "Progress", icon: BarChart2 },
  { id: "pending",  label: "Pending",  icon: AlertTriangle },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function CoursesScreen() {
  const [tab, setTab] = useState<TabId>("library");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses().finally(() => setLoading(false));
  }, []);

  const totalStaff = 145;
  const totalCompleted = [].reduce((a, r) => a + r.completed, 0);
  const totalCourses = [].length;
  const publishedCourses = [].filter((c) => c.status === "Published").length;

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
            <Text style={ss.eyebrow}>LMS</Text>
            <Text style={ss.title}>Courses & Learning</Text>
            <Text style={ss.subtitle}>Manage, assign and track training across all stores and staff.</Text>

            {/* Summary pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginTop: 14, paddingRight: 8 }}>
              {[
                { label: "Courses", value: totalCourses, Icon: BookOpen },
                { label: "Published", value: publishedCourses, Icon: CheckCircle2 },
                { label: "Staff", value: totalStaff, Icon: Users },
                { label: "Completions", value: totalCompleted, Icon: GraduationCap },
                { label: "Pending", value: [].length, Icon: Clock },
                { label: "Certs Issued", value: 306, Icon: Award },
              ].map(({ label, value, Icon }) => (
                <View key={label} style={ss.headerPill}>
                  <Icon size={13} color={C.orange} />
                  <Text style={ss.headerPillVal}>{value}</Text>
                  <Text style={ss.headerPillLbl}>{label}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Tab bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ss.tabBar}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <TouchableOpacity key={id} onPress={() => setTab(id)} style={[ss.tabChip, tab === id && ss.tabChipActive]}>
                <Icon size={12} color={tab === id ? C.white : "rgba(255,255,255,0.6)"} />
                <Text style={[ss.tabChipTxt, tab === id && ss.tabChipTxtActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ padding: 16, paddingBottom: 100 }}>
            {loading ? <ActivityIndicator color={C.navy} style={{ marginTop: 40 }} /> : (
              <>
                {tab === "library"  && <LibraryTab />}
                {tab === "assigned" && <AssignedTab />}
                {tab === "progress" && <ProgressTab />}
                {tab === "pending"  && <PendingTab />}
              </>
            )}
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
  headerPill: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, gap: 3 },
  headerPillVal: { fontSize: 16, fontWeight: "800", color: C.white },
  headerPillLbl: { fontSize: 9, color: "rgba(255,255,255,0.7)" },
  tabBar: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  tabChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  tabChipActive: { backgroundColor: C.orange, borderColor: C.orange },
  tabChipTxt: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.7)" },
  tabChipTxtActive: { color: C.white },
  card: { backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: C.navy },
  cardSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeTxt: { fontSize: 10, fontWeight: "700" },
  statCell: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 14, fontWeight: "800", color: C.navy, textAlign: "center" },
  statLbl: { fontSize: 10, color: C.muted, textAlign: "center", marginTop: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: C.white, borderWidth: 1, borderColor: "#E5E7EB" },
  chipActive: { backgroundColor: C.navy, borderColor: C.navy },
  chipTxt: { fontSize: 11, fontWeight: "700", color: C.muted },
  chipTxtActive: { color: C.white },
  searchInput: { backgroundColor: C.white, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, fontSize: 13, color: C.navy, borderWidth: 1, borderColor: "#E5E7EB" },
  pbarBg: { height: 5, backgroundColor: "#E5E7EB", borderRadius: 3, overflow: "hidden", marginTop: 4 },
  pbarFill: { height: 5, borderRadius: 3 },
  segmentRow: { flexDirection: "row", backgroundColor: "#E5E7EB", borderRadius: 10, padding: 3 },
  segBtn: { flex: 1, paddingVertical: 7, alignItems: "center", borderRadius: 8 },
  segBtnActive: { backgroundColor: C.white, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  segTxt: { fontSize: 12, fontWeight: "700", color: C.muted },
  segTxtActive: { color: C.navy },
  actionBtn: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: C.navy, borderRadius: 8, alignSelf: "flex-start" },
  actionBtnTxt: { fontSize: 11, fontWeight: "700", color: C.white },
});
