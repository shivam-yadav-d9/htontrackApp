import { router, usePathname } from "expo-router";
import {
  CalendarCheck,
  LayoutDashboard,
  MoreHorizontal,
  Target,
  UsersRound,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const C = { orange: "#C95F18", muted: "#8A8178", cream: "#FFFDF8" };

const TABS = [
  { key: "dashboard", label: "Home", Icon: LayoutDashboard, route: "/admin/dashboard" },
  { key: "attendance", label: "Attend", Icon: CalendarCheck, route: "/admin/attendance" },
  { key: "teams", label: "Teams", Icon: UsersRound, route: "/admin/teams" },
  { key: "targets", label: "Targets", Icon: Target, route: "/admin/targets" },
  { key: "more", label: "More", Icon: MoreHorizontal, route: "/admin/more" },
] as const;

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <View style={styles.wrap}>
      <View style={styles.nav}>
        {TABS.map(({ key, label, Icon, route }) => {
          const isActive = pathname === route || pathname.startsWith(route + "/");
          return (
            <TouchableOpacity
              key={key}
              style={styles.item}
              activeOpacity={0.8}
              onPress={() => router.push(route as any)}
            >
              <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                <Icon size={19} color={isActive ? C.orange : C.muted} />
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "rgba(246,235,220,0.96)",
  },
  nav: {
    backgroundColor: C.cream,
    borderRadius: 26,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#EAD7C2",
    shadowColor: "#3A2314",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  item: { flex: 1, alignItems: "center", gap: 3 },
  iconBox: {
    width: 36,
    height: 32,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxActive: { backgroundColor: "#FFF1E5" },
  label: { fontSize: 9, color: "#8A8178", fontWeight: "800" },
  labelActive: { color: "#C95F18" },
});
