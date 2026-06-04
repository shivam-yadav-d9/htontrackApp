import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { router } from "expo-router";
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  MapPin,
  MapPinOff,
  Store,
  TrendingDown,
  Trophy,
  UserCog,
  Zap,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  navy: "#102B45",
  orange: "#C95F18",
  gold: "#B7791F",
  beige: "#F6EBDC",
  cream: "#FFFDF8",
  muted: "#8A8178",
  brown: "#6B3F20",
  green: "#166534",
  red: "#B91C1C",
  white: "#FFFFFF",
  blueLight: "#EAF2FB",
  goldLight: "#FFF4D8",
  redLight: "#FEE2E2",
  greenLight: "#DCFCE7",
};

type FeatureCard = {
  icon: React.ReactNode;
  title: string;
  sub: string;
  route: string;
};
type StoreFilter = "all" | "master" | "performance" | "operations";

function FeatureRow({ card }: { card: FeatureCard }) {
  return (
    <TouchableOpacity style={s.featureRow} activeOpacity={0.85} onPress={() => router.push(card.route as any)}>
      <View style={s.featureIconBox}>{card.icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.featureTitle}>{card.title}</Text>
        <Text style={s.featureSub}>{card.sub}</Text>
      </View>
      <ChevronRight size={16} color={C.muted} />
    </TouchableOpacity>
  );
}

export default function StoresScreen() {
  const [filter, setFilter] = useState<StoreFilter>("all");

  const masterCards: FeatureCard[] = [
    { icon: <Building2 size={20} color={C.navy} />, title: "Store Overview", sub: "All stores, status, managers, staff count", route: "/admin/store-overview" },
    { icon: <MapPin size={20} color={C.green} />, title: "Store Geofence", sub: "Manage store location and geofence radius", route: "/admin/store-geofence" },
    { icon: <Zap size={20} color={C.gold} />, title: "Zone View", sub: "Region and zone-wise store breakdown", route: "/admin/zone-view" },
    { icon: <UserCog size={20} color={C.brown} />, title: "Manager Mapping", sub: "Assign and reassign store managers", route: "/admin/manager-mapping" },
    { icon: <MapPinOff size={20} color={C.red} />, title: "Stores Without Manager", sub: "Stores missing a manager assignment", route: "/admin/stores-without-manager" },
  ];

  const performanceCards: FeatureCard[] = [
    { icon: <Trophy size={20} color={C.orange} />, title: "Store Conversions", sub: "Lead conversions and sales performance", route: "/admin/store-conversions" },
    { icon: <TrendingDown size={20} color={C.red} />, title: "Risk Stores", sub: "Stores with low targets or attendance", route: "/admin/risk-stores" },
  ];

  const operationsCards: FeatureCard[] = [
    { icon: <AlertTriangle size={20} color={C.orange} />, title: "Store Alerts", sub: "Pending issues and action items per store", route: "/admin/alerts" },
  ];

  const FILTER_CHIPS: { key: StoreFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "master", label: "Store Master" },
    { key: "performance", label: "Performance" },
    { key: "operations", label: "Operations" },
  ];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.root}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Store Command</Text>
          <Text style={s.headerSub}>Manage all stores, geofences, and zones</Text>
        </View>

        <View style={s.filterRow}>
          {FILTER_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip.key}
              style={[s.filterChip, filter === chip.key && s.filterChipActive]}
              onPress={() => setFilter(chip.key)}
              activeOpacity={0.8}
            >
              <Text style={[s.filterChipText, filter === chip.key && s.filterChipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {(filter === "all" || filter === "master") && (
            <View style={s.sectionCard}>
              <TouchableOpacity style={s.sectionHeader} activeOpacity={0.7} onPress={() => setFilter(filter === "master" ? "all" : "master")}>
                <Text style={s.sectionTitle}>STORE MASTER</Text>
                <Text style={s.sectionCount}>{masterCards.length}</Text>
              </TouchableOpacity>
              {masterCards.map((card) => <FeatureRow key={card.route} card={card} />)}
            </View>
          )}

          {(filter === "all" || filter === "performance") && (
            <View style={s.sectionCard}>
              <TouchableOpacity style={s.sectionHeader} activeOpacity={0.7} onPress={() => setFilter(filter === "performance" ? "all" : "performance")}>
                <Text style={s.sectionTitle}>PERFORMANCE</Text>
                <Text style={s.sectionCount}>{performanceCards.length}</Text>
              </TouchableOpacity>
              {performanceCards.map((card) => <FeatureRow key={card.route} card={card} />)}
            </View>
          )}

          {(filter === "all" || filter === "operations") && (
            <View style={s.sectionCard}>
              <TouchableOpacity style={s.sectionHeader} activeOpacity={0.7} onPress={() => setFilter(filter === "operations" ? "all" : "operations")}>
                <Text style={s.sectionTitle}>OPERATIONS</Text>
                <Text style={s.sectionCount}>{operationsCards.length}</Text>
              </TouchableOpacity>
              {operationsCards.map((card) => <FeatureRow key={card.route} card={card} />)}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <AdminBottomNav />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },
  root: { flex: 1, backgroundColor: C.cream },
  header: { backgroundColor: C.navy, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: C.white, letterSpacing: 0.3 },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.beige },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.beige, borderWidth: 1, borderColor: C.beige },
  filterChipActive: { backgroundColor: C.navy, borderColor: C.navy },
  filterChipText: { fontSize: 12, fontWeight: "600", color: C.muted },
  filterChipTextActive: { color: C.white },
  sectionCard: { backgroundColor: C.white, borderRadius: 12, overflow: "hidden", marginBottom: 12, borderWidth: 1, borderColor: C.beige },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: C.muted, letterSpacing: 1 },
  sectionCount: { fontSize: 11, fontWeight: "700", color: C.white, backgroundColor: C.navy, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  featureRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.beige, gap: 12 },
  featureIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.beige, alignItems: "center", justifyContent: "center" },
  featureTitle: { fontSize: 14, fontWeight: "600", color: C.navy },
  featureSub: { fontSize: 12, color: C.muted, marginTop: 1 },
});
