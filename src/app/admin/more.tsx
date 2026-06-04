import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { router } from "expo-router";
import {
  Award, BarChart3, ClipboardList, CreditCard, FileText,
  GraduationCap, LogOut, ShoppingBag, Sparkles, Store, UserCog,
} from "lucide-react-native";
import React from "react";
import {
  Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  navy: "#102B45", orange: "#C95F18", gold: "#B7791F", beige: "#F6EBDC",
  cream: "#FFFDF8", muted: "#8A8178", white: "#FFFFFF", green: "#166534",
};

const MODULES = [
  {
    id: "incentives",
    label: "Incentives",
    sub: "Approve, track & pay staff incentives",
    icon: CreditCard,
    color: "#166534",
    bg: "#DCFCE7",
    route: "/admin/incentives",
  },
  {
    id: "store-conversions",
    label: "Store Conversions",
    sub: "Lead funnel & category-wise conversion",
    icon: ShoppingBag,
    color: "#C95F18",
    bg: "#FFEDD5",
    route: "/admin/store-conversions",
  },
  {
    id: "courses",
    label: "Courses & LMS",
    sub: "Assign, track, and manage training",
    icon: GraduationCap,
    color: "#B7791F",
    bg: "#FEF9C3",
    route: "/admin/courses",
  },
  {
    id: "insights",
    label: "Insights & Reports",
    sub: "Checklists, anomalies and reports",
    icon: BarChart3,
    color: "#102B45",
    bg: "#E0E7FF",
    route: "/admin/insights",
  },
  {
    id: "notices",
    label: "Notices",
    sub: "Create, publish and track notices",
    icon: FileText,
    color: "#1D4ED8",
    bg: "#DBEAFE",
    route: "/admin/notices",
  },
  {
    id: "certificates",
    label: "Certificates",
    sub: "Issue and verify course certificates",
    icon: Award,
    color: "#B7791F",
    bg: "#FEF3C7",
    route: "/admin/certificates",
  },
];

const QUICK_LINKS = [
  { label: "Stores",    icon: Store,    route: "/admin/stores" },
  { label: "Reports",   icon: ClipboardList, route: "/admin/reports" },
  { label: "AI Insights", icon: Sparkles, route: "/admin/insights" },
  { label: "Settings",  icon: UserCog,  route: null },
];

export default function MoreScreen() {
  return (
    <SafeAreaView style={ss.safe} edges={["top"]}>
      <View style={ss.root}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ss.scroll}>

          {/* Header */}
          <View style={ss.header}>
            <Text style={ss.eyebrow}>MORE</Text>
            <Text style={ss.title}>All Modules</Text>
            <Text style={ss.subtitle}>Access all admin features from one place.</Text>
          </View>

          <View style={{ padding: 16, gap: 16, paddingBottom: 100 }}>

            {/* Module grid */}
            <Text style={ss.sectionTitle}>Modules</Text>
            <View style={ss.grid}>
              {MODULES.map((mod) => {
                const Icon = mod.icon;
                return (
                  <TouchableOpacity
                    key={mod.id}
                    style={[ss.moduleCard, { borderTopColor: mod.color }]}
                    activeOpacity={0.85}
                    onPress={() => router.push(mod.route as any)}
                  >
                    <View style={[ss.moduleIcon, { backgroundColor: mod.bg }]}>
                      <Icon size={22} color={mod.color} />
                    </View>
                    <Text style={ss.moduleLabel}>{mod.label}</Text>
                    <Text style={ss.moduleSub}>{mod.sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick links */}
            <Text style={ss.sectionTitle}>Quick Access</Text>
            <View style={ss.quickRow}>
              {QUICK_LINKS.map(({ label, icon: Icon, route }) => (
                <TouchableOpacity
                  key={label}
                  style={ss.quickCard}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (route) router.push(route as any);
                    else Alert.alert("Coming Soon", `${label} settings coming soon.`);
                  }}
                >
                  <Icon size={18} color={C.navy} />
                  <Text style={ss.quickLabel}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* App info */}
            <View style={ss.infoCard}>
              <Text style={ss.infoTitle}>Karmyogi Admin</Text>
              <Text style={ss.infoSub}>HomeTown Staff Management Platform</Text>
              <View style={ss.infoRow}>
                <Text style={ss.infoMeta}>v1.0.0</Text>
                <Text style={ss.infoMeta}>•</Text>
                <Text style={ss.infoMeta}>Admin Panel</Text>
              </View>
            </View>

            {/* Sign out */}
            <TouchableOpacity
              style={ss.signOutBtn}
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert("Sign Out", "Are you sure you want to sign out?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Sign Out", style: "destructive", onPress: () => router.replace("/(auth)/login" as any) },
                ])
              }
            >
              <LogOut size={16} color={C.orange} />
              <Text style={ss.signOutTxt}>Sign Out</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>

        <AdminBottomNav />
      </View>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },
  root: { flex: 1, backgroundColor: C.beige },
  scroll: { flexGrow: 1 },
  header: { backgroundColor: C.navy, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  eyebrow: { fontSize: 10, fontWeight: "800", color: C.orange, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: "800", color: C.white },
  subtitle: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: C.navy, letterSpacing: 0.5 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  moduleCard: {
    width: "47%",
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 16,
    borderTopWidth: 3,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    gap: 8,
  },
  moduleIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  moduleLabel: { fontSize: 13, fontWeight: "800", color: C.navy },
  moduleSub: { fontSize: 11, color: C.muted, lineHeight: 15 },
  quickRow: { flexDirection: "row", gap: 10 },
  quickCard: { flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 14, alignItems: "center", gap: 6, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  quickLabel: { fontSize: 11, fontWeight: "700", color: C.navy, textAlign: "center" },
  infoCard: { backgroundColor: C.navy, borderRadius: 16, padding: 18, alignItems: "center", gap: 4 },
  infoTitle: { fontSize: 16, fontWeight: "800", color: C.white },
  infoSub: { fontSize: 12, color: "rgba(255,255,255,0.65)" },
  infoRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  infoMeta: { fontSize: 11, color: "rgba(255,255,255,0.4)" },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: C.orange, borderRadius: 14, paddingVertical: 14 },
  signOutTxt: { fontSize: 14, fontWeight: "700", color: C.orange },
});
