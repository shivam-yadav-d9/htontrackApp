import { router, usePathname } from "expo-router";
import { ArrowLeft, Clock, Wrench } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  navy: "#102B45",
  orange: "#C95F18",
  gold: "#B7791F",
  beige: "#F6EBDC",
  cream: "#FFFDF8",
  muted: "#8A8178",
  white: "#FFFFFF",
};

function toTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function AdminCatchAll() {
  const pathname = usePathname(); // e.g. "/admin/store-geofence"
  const segments = pathname.split("/").filter(Boolean); // ["admin", "store-geofence"]
  // Drop the "admin" prefix
  const parts = segments.slice(1); // ["store-geofence"] or ["reports", "attendance"]
  const pageName = parts.length > 0 ? toTitle(parts[parts.length - 1]) : "Admin";
  const displayPath = parts.join(" › ");

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={20} color={C.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{pageName}</Text>
      </View>

      <View style={s.body}>
        <View style={s.iconBox}>
          <Wrench size={40} color={C.gold} />
        </View>

        <Text style={s.title}>Coming Soon</Text>
        {displayPath ? <Text style={s.path}>{displayPath}</Text> : null}
        <Text style={s.desc}>
          This feature is currently under development and will be available in the next release.
        </Text>

        <View style={s.pillRow}>
          <Clock size={14} color={C.muted} />
          <Text style={s.pillText}>In development</Text>
        </View>

        <TouchableOpacity style={s.backButton} onPress={() => router.back()} activeOpacity={0.85}>
          <ArrowLeft size={16} color={C.white} />
          <Text style={s.backButtonText}>Go Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.homeButton}
          onPress={() => router.push("/admin/dashboard" as any)}
          activeOpacity={0.85}
        >
          <Text style={s.homeButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: {
    backgroundColor: C.navy,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: C.white, flex: 1 },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#FFF4D8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  title: { fontSize: 22, fontWeight: "700", color: C.navy, marginBottom: 6 },
  path: { fontSize: 12, color: C.muted, marginBottom: 14, textAlign: "center", letterSpacing: 0.5 },
  desc: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 21, marginBottom: 20 },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.beige,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 32,
  },
  pillText: { fontSize: 12, color: C.muted, fontWeight: "600" },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.navy,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 10,
    marginBottom: 12,
    width: "100%",
    justifyContent: "center",
  },
  backButtonText: { color: C.white, fontWeight: "700", fontSize: 15 },
  homeButton: {
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.navy,
    width: "100%",
    alignItems: "center",
  },
  homeButtonText: { color: C.navy, fontWeight: "700", fontSize: 15 },
});
