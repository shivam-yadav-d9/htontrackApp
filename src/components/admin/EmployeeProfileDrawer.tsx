import {
  Award, BarChart3, BookOpen, CalendarCheck, CheckSquare,
  Mail, MapPin, Phone, Shield, Star, Target, User, Users, X,
} from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";

const C = {
  navy: "#102B45", orange: "#C95F18", gold: "#B7791F", beige: "#F6EBDC",
  cream: "#FFFDF8", muted: "#8A8178", white: "#FFFFFF", green: "#166534",
  red: "#B91C1C", amber: "#92400E",
  greenBg: "#DCFCE7", greenBorder: "#BBF7D0",
  redBg: "#FEE2E2", redBorder: "#FECACA",
  goldBg: "#FFF4D8", goldBorder: "#F5D28A",
  blueBg: "#EAF2FB", blueBorder: "#C9DBEF",
};

export type EmployeeProfileData = {
  employee_number: string;
  employee_name: string;
  job_title?: string;
  department?: string;
  band?: string;
  email?: string | null;
  mobile?: string | null;
  role?: string;
  role_group?: string;
  store_name?: string;
  site_code?: string;
  city?: string;
  zone?: string;
  state?: string;
  manager_name?: string | null;
  manager_number?: string | null;
  login_enabled?: boolean;
  auth_type?: string;
  employment_status?: string;
  // enriched / seeded fields
  attendance_pct?: number | null;
  target_achievement_pct?: number | null;
  courses_completed?: number | null;
  courses_assigned?: number | null;
  checklists_completed?: number | null;
  checklists_assigned?: number | null;
  incentive_amount?: number | null;
  incentive_status?: string | null;
  data_source?: string;
};

interface Props {
  employee: EmployeeProfileData | null;
  visible: boolean;
  loading?: boolean;
  onClose(): void;
}

function DataTag({ label, source }: { label: string; source: string }) {
  let bg = "#F3F4F6", text = "#6B7280";
  if (source === "real" || source === "real_employee_master") { bg = "#DCFCE7"; text = "#166534"; }
  else if (source === "seeded") { bg = "#FEF9C3"; text = "#854D0E"; }
  else if (source === "derived") { bg = "#DBEAFE"; text = "#1E40AF"; }
  else if (source === "missing" || !source) { bg = "#FEE2E2"; text = "#B91C1C"; }
  return (
    <View style={[ss.tag, { backgroundColor: bg }]}>
      <Text style={[ss.tagTxt, { color: text }]}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value, source }: { icon: React.ReactNode; label: string; value?: string | null; source?: string }) {
  const missing = !value;
  return (
    <View style={ss.infoRow}>
      <View style={ss.infoIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={ss.infoLabel}>{label}</Text>
        <Text style={[ss.infoValue, missing && { color: C.muted, fontStyle: "italic" }]}>
          {missing ? "Not available" : value}
        </Text>
      </View>
      {source && <DataTag label={source} source={source} />}
    </View>
  );
}

function KpiBox({ label, value, color, source }: { label: string; value: string | number | null; color?: string; source?: string }) {
  const missing = value == null || value === "" || value === "—";
  return (
    <View style={ss.kpiBox}>
      <Text style={[ss.kpiVal, { color: missing ? C.muted : (color ?? C.navy) }]}>
        {missing ? "—" : String(value)}
      </Text>
      <Text style={ss.kpiLbl}>{label}</Text>
      {source && <DataTag label={source} source={source} />}
    </View>
  );
}

export function EmployeeProfileDrawer({ employee: emp, visible, loading, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={ss.overlay}>
        <View style={ss.sheet}>
          {/* Header */}
          <View style={ss.header}>
            <View style={ss.avatar}>
              <Text style={ss.avatarTxt}>
                {emp?.employee_name?.split(" ").slice(0, 2).map((w) => w[0]).join("") ?? "?"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ss.name} numberOfLines={2}>{emp?.employee_name ?? "Loading…"}</Text>
              <Text style={ss.subName}>{emp?.employee_number} · {emp?.job_title ?? "—"}</Text>
              {emp?.employment_status && (
                <View style={[ss.tag, { backgroundColor: "#DCFCE7", marginTop: 4, alignSelf: "flex-start" }]}>
                  <Text style={[ss.tagTxt, { color: C.green }]}>{emp.employment_status}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={ss.closeBtn}>
              <X size={18} color={C.muted} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={C.navy} style={{ marginTop: 40 }} />
          ) : !emp ? null : (
            <ScrollView style={ss.body} showsVerticalScrollIndicator={false}>
              {/* Store & Manager */}
              <Text style={ss.section}>Store & Assignment</Text>
              <InfoRow icon={<MapPin size={13} color={C.navy} />} label="Store" value={emp.store_name ? `${emp.store_name} (${emp.site_code ?? ""})` : null} source="real" />
              <InfoRow icon={<Shield size={13} color={C.navy} />} label="Department" value={emp.department} source="real" />
              <InfoRow icon={<Users size={13} color={C.navy} />} label="Manager" value={emp.manager_name ? `${emp.manager_name} (${emp.manager_number ?? ""})` : null} source={emp.manager_name ? "real" : "missing"} />
              <InfoRow icon={<Star size={13} color={C.navy} />} label="Band / Role" value={[emp.band, emp.role].filter(Boolean).join(" · ")} source="derived" />
              <InfoRow icon={<User size={13} color={C.navy} />} label="City / Zone" value={[emp.city, emp.zone].filter(Boolean).join(", ")} source="real" />

              {/* Contact */}
              <Text style={ss.section}>Contact</Text>
              <InfoRow icon={<Mail size={13} color={C.navy} />} label="Email" value={emp.email} source={emp.email ? "real" : "missing"} />
              <InfoRow icon={<Phone size={13} color={C.navy} />} label="Mobile" value={emp.mobile} source={emp.mobile ? "real" : "missing"} />
              <InfoRow icon={<Shield size={13} color={C.navy} />} label="Login" value={emp.login_enabled ? `Enabled (${emp.auth_type ?? ""})` : "Disabled"} source="real" />

              {/* Performance KPIs */}
              <Text style={ss.section}>Performance</Text>
              <View style={ss.kpiRow}>
                <KpiBox label="Attendance" value={emp.attendance_pct != null ? `${emp.attendance_pct}%` : null} color={C.green} source="seeded" />
                <KpiBox label="Target Achv." value={emp.target_achievement_pct != null ? `${emp.target_achievement_pct}%` : null} color={C.orange} source="seeded" />
                <KpiBox label="Incentive" value={emp.incentive_amount != null ? `₹${(emp.incentive_amount / 1000).toFixed(1)}K` : null} color={C.gold} source={emp.incentive_status ?? "seeded"} />
              </View>

              {/* Learning */}
              <Text style={ss.section}>Learning</Text>
              <View style={ss.kpiRow}>
                <KpiBox label="Courses Done" value={emp.courses_completed != null && emp.courses_assigned != null ? `${emp.courses_completed}/${emp.courses_assigned}` : null} color={C.navy} source="seeded" />
                <KpiBox label="Checklists" value={emp.checklists_completed != null && emp.checklists_assigned != null ? `${emp.checklists_completed}/${emp.checklists_assigned}` : null} color={C.navy} source="seeded" />
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const ss = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "88%", minHeight: 300 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: "#EAD7C2" },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontSize: 18, fontWeight: "800", color: C.white },
  name: { fontSize: 16, fontWeight: "800", color: C.navy, flex: 1 },
  subName: { fontSize: 11, color: C.muted, marginTop: 2 },
  closeBtn: { padding: 4 },
  body: { flex: 1, paddingHorizontal: 16 },
  section: { fontSize: 10, fontWeight: "800", color: C.muted, letterSpacing: 1.2, marginTop: 14, marginBottom: 6 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  infoIcon: { width: 28, alignItems: "center" },
  infoLabel: { fontSize: 10, color: C.muted, marginBottom: 1 },
  infoValue: { fontSize: 13, fontWeight: "600", color: C.navy },
  kpiRow: { flexDirection: "row", gap: 8 },
  kpiBox: { flex: 1, backgroundColor: C.white, borderRadius: 10, padding: 10, alignItems: "center", gap: 3, elevation: 1 },
  kpiVal: { fontSize: 16, fontWeight: "800" },
  kpiLbl: { fontSize: 9, color: C.muted, textAlign: "center" },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  tagTxt: { fontSize: 9, fontWeight: "700" },
});
