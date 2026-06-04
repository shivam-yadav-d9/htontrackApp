import { router } from "expo-router";
import {
  BellRing,
  ChevronRight,
  LogOut,
  Mail,
  MapPin,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/store/auth.store";

const C = {
  navy: "#102B45",
  orange: "#C95F18",
  gold: "#B7791F",
  beige: "#F6EBDC",
  cream: "#FFFDF8",
  muted: "#8A8178",
  brown: "#6B3F20",
  red: "#B91C1C",
  green: "#166534",
  white: "#FFFFFF",
};

function ProfileAction({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionCard} activeOpacity={0.86} onPress={onPress}>
      <View style={styles.actionIcon}>{icon}</View>

      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>

      <ChevronRight size={17} color={C.muted} />
    </TouchableOpacity>
  );
}

export default function ManagerProfileScreen() {
  const { user, logout } = useAuthStore();

  const managerName = user?.full_name ?? "Store Manager";
  const email = user?.email ?? "manager@hometown.com";
  const role = user?.role ?? "MANAGER";
  const storeName = (user as any)?.store_name ?? "HomeTown Store";
  const region = (user as any)?.region ?? "Region not assigned";

  function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth/login");
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <UserRound size={34} color="#FFFFFF" />
          </View>

          <Text style={styles.name}>{managerName}</Text>
          <Text style={styles.role}>{String(role).toUpperCase()}</Text>

          <View style={styles.infoPill}>
            <Store size={13} color={C.orange} />
            <Text style={styles.infoPillText} numberOfLines={1}>
              {storeName}
            </Text>
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Mail size={18} color={C.orange} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MapPin size={18} color={C.brown} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Region</Text>
              <Text style={styles.detailValue}>{region}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manager Shortcuts</Text>

          <ProfileAction
            title="Notifications"
            subtitle="View manager alerts and updates"
            icon={<BellRing size={21} color={C.orange} />}
            onPress={() => router.push("/manager/notifications" as any)}
          />

          <ProfileAction
            title="Security"
            subtitle="Account access and secure session"
            icon={<ShieldCheck size={21} color={C.green} />}
            onPress={() => router.push("/manager/settings" as any)}
          />
        </View>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.88} onPress={handleLogout}>
          <View style={styles.logoutIcon}>
            <LogOut size={17} color="#FFFFFF" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.logoutTitle}>Logout Securely</Text>
            <Text style={styles.logoutSub}>End your manager session</Text>
          </View>

          <ChevronRight size={17} color="rgba(255,255,255,0.72)" />
        </TouchableOpacity>

        <View style={{ height: 22 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.beige,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingBottom: 28,
    gap: 14,
  },

  header: {
    backgroundColor: C.navy,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 30,
    padding: 20,
    alignItems: "center",
    overflow: "hidden",
  },

  avatar: {
    width: 74,
    height: 74,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },

  name: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  role: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "900",
    color: "#FFEAC7",
    letterSpacing: 1,
  },

  infoPill: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: "92%",
  },

  infoPillText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "700",
  },

  profileCard: {
    marginHorizontal: 16,
    backgroundColor: C.cream,
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EAD7C2",
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#FFF3E8",
    alignItems: "center",
    justifyContent: "center",
  },

  detailLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: C.muted,
    letterSpacing: 0.6,
  },

  detailValue: {
    fontSize: 13,
    fontWeight: "800",
    color: C.navy,
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: "#F1E4D6",
    marginVertical: 12,
  },

  section: {
    marginHorizontal: 16,
    gap: 10,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: C.navy,
    marginLeft: 3,
  },

  actionCard: {
    backgroundColor: C.cream,
    borderRadius: 20,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderWidth: 1,
    borderColor: "#EAD7C2",
  },

  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#FFF3E8",
    alignItems: "center",
    justifyContent: "center",
  },

  actionTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: C.navy,
  },

  actionSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: C.muted,
    marginTop: 2,
  },

  logoutButton: {
    marginHorizontal: 16,
    backgroundColor: C.navy,
    borderRadius: 22,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  logoutIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: C.red,
    alignItems: "center",
    justifyContent: "center",
  },

  logoutTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  logoutSub: {
    fontSize: 10.5,
    color: "rgba(255,255,255,0.66)",
    marginTop: 2,
    fontWeight: "600",
  },
});