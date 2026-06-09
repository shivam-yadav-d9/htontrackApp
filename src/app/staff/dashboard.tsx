import { router } from "expo-router";
import ScreenLayout from "@/components/ScreenLayout";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BellRing,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileBadge,
  GraduationCap,
  HelpCircle,
  ListChecks,
  LogOut,
  Mail,
  MapPin,
  Medal,
  MessageSquare,
  PencilLine,
  Sparkles,
  Store,
  Target,
  Ticket,
  Trophy,
  TrendingUp,
  UserRound,
  UsersRound,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";
import { staffDashboardService } from "@/services/staff-dashboard.service";
import { useAuthStore } from "@/store/auth.store";
import type { StaffDashboardResponse } from "@/types/dashboard.types";

type Tone =
  | "orange"
  | "blue"
  | "brown"
  | "gray"
  | "red"
  | "green"
  | "gold"
  | "purple"
  | "beige";

type SectionTheme =
  | "attendance"
  | "learning"
  | "work"
  | "growth"
  | "updates"
  | "default";

interface SmallCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  route: string;
  tone?: Tone;
  badge?: number;
}

interface BigCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  route: string;
  tone?: Tone;
  progress?: number;
}

interface SectionBoxProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  theme?: SectionTheme;
}

interface ChartCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

function getTone(tone: Tone = "beige") {
  switch (tone) {
    case "orange":
      return {
        bg: "#FFF1E5",
        text: "#C95F18",
        border: "#FED7AA",
        chip: "rgba(201,95,24,0.12)",
      };

    case "blue":
      return {
        bg: "#EAF2FB",
        text: "#102B45",
        border: "#C9DBEF",
        chip: "rgba(16,43,69,0.10)",
      };

    case "brown":
      return {
        bg: "#F4E7D8",
        text: "#6B3F20",
        border: "#E6CDB3",
        chip: "rgba(107,63,32,0.10)",
      };

    case "gray":
      return {
        bg: "#F3F4F6",
        text: "#4B5563",
        border: "#E5E7EB",
        chip: "rgba(75,85,99,0.10)",
      };

    case "red":
      return {
        bg: "#FEE2E2",
        text: "#B91C1C",
        border: "#FECACA",
        chip: "rgba(185,28,28,0.10)",
      };

    case "green":
      return {
        bg: "#DCFCE7",
        text: "#166534",
        border: "#BBF7D0",
        chip: "rgba(22,101,52,0.10)",
      };

    case "gold":
      return {
        bg: "#FFF4D8",
        text: "#B7791F",
        border: "#F5D28A",
        chip: "rgba(183,121,31,0.12)",
      };

    case "purple":
      return {
        bg: "#F3E8FF",
        text: "#6D28D9",
        border: "#E9D5FF",
        chip: "rgba(109,40,217,0.10)",
      };

    default:
      return {
        bg: "#FFF8EF",
        text: "#8A5A32",
        border: "#EAD7C2",
        chip: "rgba(138,90,50,0.10)",
      };
  }
}

function getSectionTheme(theme: SectionTheme = "default") {
  switch (theme) {
    case "attendance":
      return {
        bg: "#FFF7ED",
        border: "#FED7AA",
        iconBg: "#FFEDD5",
      };

    case "learning":
      return {
        bg: "#EFF6FF",
        border: "#BFDBFE",
        iconBg: "#DBEAFE",
      };

    case "work":
      return {
        bg: "#FDF8F0",
        border: "#EAD7C2",
        iconBg: "#FFF3E8",
      };

    case "growth":
      return {
        bg: "#F0FDF4",
        border: "#BBF7D0",
        iconBg: "#DCFCE7",
      };

    case "updates":
      return {
        bg: "#FEFCE8",
        border: "#FDE68A",
        iconBg: "#FEF3C7",
      };

    default:
      return {
        bg: "rgba(255,255,255,0.42)",
        border: "rgba(234,215,194,0.9)",
        iconBg: "#FFF3E8",
      };
  }
}

function SectionBox({
  title,
  subtitle,
  icon,
  children,
  theme = "default",
}: SectionBoxProps) {
  const sectionTheme = getSectionTheme(theme);

  return (
    <View
      style={[
        styles.sectionBox,
        {
          backgroundColor: sectionTheme.bg,
          borderColor: sectionTheme.border,
        },
      ]}
    >
      <View style={styles.sectionHead}>
        <View
          style={[
            styles.sectionIcon,
            {
              backgroundColor: sectionTheme.iconBg,
              borderColor: sectionTheme.border,
            },
          ]}
        >
          {icon}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <Text style={styles.chartSubtitle}>{subtitle}</Text>
      <View style={styles.chartBody}>{children}</View>
    </View>
  );
}

function SmallCard({
  icon,
  title,
  subtitle,
  route,
  tone = "beige",
  badge,
}: SmallCardProps) {
  const toneColor = getTone(tone);

  return (
    <TouchableOpacity
      style={[styles.smallCard, { borderColor: toneColor.border }]}
      activeOpacity={0.86}
      onPress={() => router.push(route as any)}
    >
      <View style={[styles.smallIcon, { backgroundColor: toneColor.bg }]}>
        {icon}

        {badge && badge > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.smallTitle} numberOfLines={1}>
        {title}
      </Text>

      <Text style={styles.smallSubtitle} numberOfLines={2}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

function BigCard({
  icon,
  title,
  value,
  subtitle,
  route,
  tone = "beige",
  progress,
}: BigCardProps) {
  const toneColor = getTone(tone);

  return (
    <TouchableOpacity
      style={[styles.bigCard, { borderColor: toneColor.border }]}
      activeOpacity={0.87}
      onPress={() => router.push(route as any)}
    >
      <View style={[styles.bigIcon, { backgroundColor: toneColor.bg }]}>
        {icon}
      </View>

      <View style={styles.bigCardBody}>
        <Text style={styles.bigLabel}>{title}</Text>
        <Text style={[styles.bigValue, { color: toneColor.text }]} numberOfLines={1}>
          {value}
        </Text>

        {typeof progress === "number" ? (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.max(0, Math.min(progress, 100))}%`,
                  backgroundColor: toneColor.text,
                },
              ]}
            />
          </View>
        ) : null}

        <Text style={styles.bigSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>

      <View style={[styles.arrowCircle, { backgroundColor: toneColor.chip }]}>
        <ChevronRight size={15} color={toneColor.text} />
      </View>
    </TouchableOpacity>
  );
}

function MyActivityTopCard({
  unreadAlerts,
  pendingAssignments,
  pendingTodos,
}: {
  unreadAlerts: number;
  pendingAssignments: number;
  pendingTodos: number;
}) {
  return (
    <TouchableOpacity
      style={styles.activityTopCard}
      activeOpacity={0.9}
      onPress={() => router.push("/staff/activity-timeline" as any)}
    >
      <View style={styles.activityGlowOne} />
      <View style={styles.activityGlowTwo} />

      <View style={styles.activityIconWrap}>
        <Activity size={28} color="#FFFFFF" />
        {unreadAlerts > 0 ? <View style={styles.activityPulseDot} /> : null}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.activityEyebrow}>TODAY'S QUICK VIEW</Text>
        <Text style={styles.activityTitle}>My Activity</Text>
        <Text style={styles.activitySubtitle} numberOfLines={2}>
          Track your work timeline, pending tasks, updates, alerts and daily progress.
        </Text>

        <View style={styles.activityStatsRow}>
          <View style={styles.activityStatPill}>
            <Text style={styles.activityStatValue}>{pendingAssignments}</Text>
            <Text style={styles.activityStatLabel}>Tasks</Text>
          </View>

          <View style={styles.activityStatPill}>
            <Text style={styles.activityStatValue}>{pendingTodos}</Text>
            <Text style={styles.activityStatLabel}>To-Do</Text>
          </View>

          <View style={styles.activityStatPill}>
            <Text style={styles.activityStatValue}>{unreadAlerts}</Text>
            <Text style={styles.activityStatLabel}>Alerts</Text>
          </View>
        </View>
      </View>

      <View style={styles.activityArrow}>
        <ChevronRight size={18} color="#C95F18" />
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();

  const [dashboardData, setDashboardData] =
    useState<StaffDashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceAlerts, setAttendanceAlerts] = useState<any[]>([]);
  const [replyAlertId, setReplyAlertId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [targetNotifs, setTargetNotifs] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
    loadAttendanceAlerts();
    loadTargetNotifications();
  }, []);

  async function loadAttendanceAlerts() {
    try {
      const alerts = await staffDashboardService.getAttendanceAlerts();
      setAttendanceAlerts(alerts ?? []);
    } catch {
      // non-critical
    }
  }

  async function handleReplyAlert() {
    if (!replyAlertId || !replyText.trim()) return;
    try {
      await staffDashboardService.replyToAlert(replyAlertId, replyText.trim());
      setReplyAlertId(null);
      setReplyText("");
      await loadAttendanceAlerts();
    } catch {
      Alert.alert("Error", "Could not send reply. Please try again.");
    }
  }

  async function loadTargetNotifications() {
    try {
      const data = await staffDashboardService.getTargetNotifications();
      setTargetNotifs((data ?? []).filter((n: any) => !n.is_read));
    } catch {
      // non-critical
    }
  }

  async function markTargetNotifRead(notifId: string) {
    try {
      await staffDashboardService.markTargetNotificationRead(notifId);
      setTargetNotifs((prev) => prev.filter((n) => n.id !== notifId));
    } catch {
      // non-critical
    }
  }

  async function loadDashboardData() {
    try {
      setDashboardLoading(true);
      setDashboardError("");

      const data = await staffDashboardService.getDashboard();
      setDashboardData(data);
    } catch (error) {
      console.log("Staff dashboard load error:", error);
      setDashboardError(
        error instanceof Error ? error.message : "Unable to load staff dashboard."
      );
    } finally {
      setDashboardLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await loadDashboardData();
    } finally {
      setRefreshing(false);
    }
  }

  function greeting() {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";

    return "Good Evening";
  }

  function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout from ON TRACK?", [
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

  const displayName =
    dashboardData?.user?.full_name ?? user?.full_name ?? "Team Member";

  const storeName =
    dashboardData?.user?.store_name ?? user?.store_name ?? "No store assigned";

  const region = dashboardData?.user?.region ?? user?.region ?? "";

  const learningPercent = useMemo(() => {
    if (typeof dashboardData?.courses?.percentage === "number") {
      return dashboardData.courses.percentage;
    }

    const completed = dashboardData?.courses?.completed ?? 0;
    const total = dashboardData?.courses?.total ?? 0;

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [dashboardData]);

  const coursesCompleted = dashboardData?.courses?.completed ?? 0;
  const coursesTotal = dashboardData?.courses?.total ?? 0;
  const pendingAssignments = dashboardData?.assignments?.pending ?? 0;
  const overdueAssignments = dashboardData?.assignments?.overdue ?? 0;
  const targetProgress = dashboardData?.targets?.average_percentage ?? 0;
  const activeTargets = dashboardData?.targets?.active ?? 0;
  const pendingTodos = dashboardData?.todos?.pending ?? 0;
  const unreadAlerts = dashboardData?.alerts?.unread ?? 0;
  const attendanceStatus =
    dashboardData?.attendance?.today_status ?? "not_checked_in";

  const safeTargetProgress = Math.max(0, Math.min(targetProgress, 100));

  const attendanceChartData = [
    { value: 1, label: "M", frontColor: "#166534" },
    { value: 1, label: "T", frontColor: "#166534" },
    { value: 0.6, label: "W", frontColor: "#C95F18" },
    { value: 1, label: "T", frontColor: "#166534" },
    { value: 0, label: "F", frontColor: "#B91C1C" },
    { value: 1, label: "S", frontColor: "#166534" },
  ];

  const learningPieData = [
    {
      value: learningPercent,
      color: "#102B45",
      text: `${learningPercent}%`,
    },
    {
      value: Math.max(100 - learningPercent, 0),
      color: "#EAD7C2",
    },
  ];

  const targetHalfDonutData = [
    {
      value: safeTargetProgress,
      color: "#6B3F20",
    },
    {
      value: 100 - safeTargetProgress,
      color: "#EAD7C2",
    },
  ];

  return (
    <ScreenLayout title="Dashboard">

      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.root}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
          <View style={styles.header}>
            <View style={styles.headerGlowOne} />
            <View style={styles.headerGlowTwo} />

            <View style={styles.headerTop}>
              <View style={styles.avatarBox}>
                <UserRound size={25} color="#FFF8EF" />
                <View style={styles.avatarSpark}>
                  <Sparkles size={11} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.headerText}>
                <Text style={styles.greeting}>{greeting()},</Text>
                <Text style={styles.name} numberOfLines={1}>
                  {displayName}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.roleChip}>
                    <Text style={styles.roleChipText}>STORE STAFF</Text>
                  </View>

                  <View style={styles.storeChip}>
                    <MapPin size={10} color="#F6A15A" />
                    <Text style={styles.storeChipText} numberOfLines={1}>
                      {storeName}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.bellBtn}
                activeOpacity={0.84}
                onPress={() => router.push("/staff/notifications" as any)}
              >
                <BellRing size={19} color="#FFFFFF" />
                {unreadAlerts > 0 ? <View style={styles.notifDot} /> : null}
              </TouchableOpacity>
            </View>

            <View style={styles.topStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{learningPercent}%</Text>
                <Text style={styles.statLabel}>Learning</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{pendingAssignments}</Text>
                <Text style={styles.statLabel}>Tasks</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{safeTargetProgress}%</Text>
                <Text style={styles.statLabel}>Targets</Text>
              </View>
            </View>
          </View>

          {dashboardLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#C95F18" size="large" />
              <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
          ) : null}

          {dashboardError ? (
            <TouchableOpacity
              style={styles.errorCard}
              activeOpacity={0.85}
              onPress={loadDashboardData}
            >
              <Text style={styles.errorTitle}>Unable to load dashboard</Text>
              <Text style={styles.errorMessage}>{dashboardError}</Text>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          ) : null}

          <MyActivityTopCard
            unreadAlerts={unreadAlerts}
            pendingAssignments={pendingAssignments}
            pendingTodos={pendingTodos}
          />

          <View style={styles.storeInfoCard}>
            <View style={styles.storeInfoRow}>
              <View style={styles.storeInfoIcon}>
                <Store size={19} color="#102B45" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.storeLabel}>MY STORE</Text>
                <Text style={styles.storeName} numberOfLines={1}>
                  {storeName}
                </Text>
                <Text style={styles.storeDetails} numberOfLines={1}>
                  {[dashboardData?.user?.store_code, region, dashboardData?.user?.city]
                    .filter(Boolean)
                    .join(" · ") || "Store details"}
                </Text>
              </View>
            </View>

            {dashboardData?.user?.reporting_manager ? (
              <View style={styles.managerRow}>
                <View style={styles.managerIcon}>
                  <UsersRound size={17} color="#6B3F20" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.storeLabel}>REPORTING MANAGER</Text>
                  <Text style={styles.managerName} numberOfLines={1}>
                    {dashboardData.user.reporting_manager}
                  </Text>

                  {dashboardData.user.reporting_manager_email ? (
                    <View style={styles.emailRow}>
                      <Mail size={10} color="#8A8178" />
                      <Text style={styles.managerEmail} numberOfLines={1}>
                        {dashboardData.user.reporting_manager_email}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>

          {/* Reply modal */}
          <Modal
            visible={!!replyAlertId}
            transparent
            animationType="slide"
            onRequestClose={() => { setReplyAlertId(null); setReplyText(""); }}
          >
            <View style={staffAlertStyles.modalOverlay}>
              <View style={staffAlertStyles.modalBox}>
                <Text style={staffAlertStyles.modalTitle}>Reply to Admin Alert</Text>
                <TextInput
                  style={staffAlertStyles.modalInput}
                  placeholder="Type your reply here…"
                  value={replyText}
                  onChangeText={setReplyText}
                  multiline
                  numberOfLines={3}
                />
                <View style={staffAlertStyles.modalButtons}>
                  <TouchableOpacity
                    style={staffAlertStyles.cancelBtn}
                    onPress={() => { setReplyAlertId(null); setReplyText(""); }}
                  >
                    <Text style={staffAlertStyles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={staffAlertStyles.sendBtn}
                    onPress={handleReplyAlert}
                  >
                    <Text style={staffAlertStyles.sendText}>Send Reply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <SectionBox
            icon={<CalendarCheck size={15} color="#C95F18" />}
            title="Attendance Center"
            subtitle="Attendance, weekly pattern, leave and correction"
            theme="attendance"
          >
            {attendanceAlerts.length > 0 && (
              <View style={staffAlertStyles.alertsCard}>
                <View style={staffAlertStyles.alertsHeader}>
                  <Bell size={13} color="#C95F18" />
                  <Text style={staffAlertStyles.alertsTitle}>
                    Attendance Alerts from Admin ({attendanceAlerts.length})
                  </Text>
                </View>
                {attendanceAlerts.slice(0, 3).map((alert: any) => (
                  <View key={alert.id} style={staffAlertStyles.alertRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={staffAlertStyles.alertType}>
                        {(alert.alert_type || "NOTE").replace(/_/g, " ")}
                        {" · "}
                        <Text style={{
                          color: alert.severity === "critical" ? "#B91C1C" : "#B7791F",
                          fontWeight: "900",
                          fontSize: 10,
                        }}>
                          {(alert.severity || "").toUpperCase()}
                        </Text>
                      </Text>
                      <Text style={staffAlertStyles.alertNote} numberOfLines={2}>{alert.note}</Text>
                    </View>
                    {alert.reply_status === "pending" && alert.requires_reply ? (
                      <TouchableOpacity
                        style={staffAlertStyles.replyBtn}
                        onPress={() => { setReplyAlertId(alert.id); setReplyText(""); }}
                      >
                        <MessageSquare size={11} color="#FFFFFF" />
                        <Text style={staffAlertStyles.replyBtnText}>Reply</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={staffAlertStyles.repliedBadge}>
                        <Text style={staffAlertStyles.repliedBadgeText}>
                          {alert.reply_status === "replied" ? "Replied" : "Sent"}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
            <BigCard
              icon={<CalendarCheck size={22} color="#C95F18" />}
              title="TODAY'S ATTENDANCE"
              value={
                attendanceStatus === "not_checked_in"
                  ? "Not checked in"
                  : dashboardData?.attendance?.check_out
                    ? "Checked out"
                    : dashboardData?.attendance?.check_in
                      ? "Checked in"
                      : "Mark attendance"
              }
              subtitle={
                dashboardData?.attendance?.check_out
                  ? `Checked out at ${dashboardData.attendance.check_out}`
                  : dashboardData?.attendance?.check_in
                    ? `Checked in at ${dashboardData.attendance.check_in}`
                    : "Tap to check in or check out for today"
              }
              tone={attendanceStatus === "not_checked_in" ? "orange" : "green"}
              route="/staff/attendance"
            />

            <ChartCard
              title="Weekly Attendance"
              subtitle="Present, late and absent pattern"
            >
              <BarChart
                data={attendanceChartData}
                height={110}
                barWidth={22}
                spacing={16}
                roundedTop
                roundedBottom
                hideRules
                yAxisThickness={0}
                xAxisThickness={0}
                noOfSections={2}
                maxValue={1}
                isAnimated
              />
            </ChartCard>

            <View style={styles.cardGrid}>
              <SmallCard
                icon={<CalendarDays size={22} color="#102B45" />}
                title="Leave Apply"
                subtitle="Apply and track leave"
                tone="blue"
                route="/staff/leave-requests"
              />

              <SmallCard
                icon={<Clock3 size={22} color="#6B3F20" />}
                title="Correction"
                subtitle="Fix missed or late punch"
                tone="brown"
                route="/staff/attendance-corrections"
              />
            </View>
          </SectionBox>

          <SectionBox
            icon={<BookOpenCheck size={15} color="#102B45" />}
            title="Learning Hub"
            subtitle="Courses, completion, assignments and coaching"
            theme="learning"
          >
            <BigCard
              icon={<GraduationCap size={22} color="#102B45" />}
              title="COURSES"
              value={
                coursesTotal
                  ? `${coursesCompleted} / ${coursesTotal} completed`
                  : "No courses assigned"
              }
              subtitle={
                coursesTotal
                  ? "Certificates unlock after completion"
                  : "Your manager will assign courses"
              }
              tone="blue"
              progress={learningPercent}
              route="/staff/courses"
            />

            <ChartCard
              title="Learning Completion"
              subtitle="Completed vs pending training"
            >
              <View style={styles.donutRow}>
                <PieChart
                  data={learningPieData}
                  donut
                  radius={52}
                  innerRadius={34}
                  centerLabelComponent={() => (
                    <View style={styles.donutCenter}>
                      <Text style={styles.donutValue}>{learningPercent}%</Text>
                      <Text style={styles.donutLabel}>Done</Text>
                    </View>
                  )}
                />

                <View style={styles.donutLegend}>
                  <Text style={styles.legendTitle}>Training Status</Text>
                  <Text style={styles.legendText}>
                    {coursesCompleted} completed out of {coursesTotal || 0}
                  </Text>
                  <Text style={styles.legendMuted}>
                    Complete courses and quizzes to unlock certificates.
                  </Text>
                </View>
              </View>
            </ChartCard>

            <BigCard
              icon={<ClipboardList size={22} color="#C95F18" />}
              title="ASSIGNMENTS"
              value={
                pendingAssignments > 0
                  ? `${pendingAssignments} pending`
                  : "All clear"
              }
              subtitle={
                overdueAssignments > 0
                  ? `${overdueAssignments} overdue · submit soon`
                  : "Submit assigned store tasks"
              }
              tone={overdueAssignments > 0 ? "red" : "orange"}
              route="/staff/assignments"
            />

            <View style={styles.cardGrid}>
              <SmallCard
                icon={<HelpCircle size={22} color="#166534" />}
                title="Quizzes"
                subtitle="Attempt and view scores"
                tone="green"
                route="/staff/quizzes"
              />

              <SmallCard
                icon={<BriefcaseBusiness size={22} color="#6B3F20" />}
                title="Coaching"
                subtitle="Guidance and improvement plan"
                tone="brown"
                route="/staff/coaching-plans"
              />
            </View>
          </SectionBox>

          <SectionBox
            icon={<Target size={15} color="#6B3F20" />}
            title="Daily Work"
            subtitle="Targets, tickets, checklists and to-do"
            theme="work"
          >
            <BigCard
              icon={<Target size={22} color="#6B3F20" />}
              title="MY TARGETS"
              value={`${safeTargetProgress}% progress`}
              subtitle={
                activeTargets
                  ? `${activeTargets} active target${activeTargets > 1 ? "s" : ""}`
                  : "No active target assigned"
              }
              tone="brown"
              progress={safeTargetProgress}
              route="/staff/targets"
            />

            {targetNotifs.length > 0 && (
              <View style={styles.targetNotifBanner}>
                <View style={styles.targetNotifHeaderRow}>
                  <Bell size={13} color="#C95F18" />
                  <Text style={styles.targetNotifHeaderText}>
                    Target Update from Head Office
                  </Text>
                  <View style={styles.targetNotifBadge}>
                    <Text style={styles.targetNotifBadgeText}>
                      {targetNotifs.length}
                    </Text>
                  </View>
                </View>
                {targetNotifs.slice(0, 2).map((n) => (
                  <View key={n.id} style={styles.targetNotifItem}>
                    <Text style={styles.targetNotifMsg} numberOfLines={2}>
                      {n.message}
                    </Text>
                    {n.note ? (
                      <Text style={styles.targetNotifNote} numberOfLines={2}>
                        Remark: {n.note}
                      </Text>
                    ) : null}
                    <TouchableOpacity
                      onPress={() => markTargetNotifRead(n.id)}
                      style={styles.targetNotifMarkReadBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.targetNotifMarkReadText}>
                        Mark as read
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.targetNotifViewAll}
                  activeOpacity={0.8}
                  onPress={() => router.push("/staff/targets" as any)}
                >
                  <Text style={styles.targetNotifViewAllText}>
                    View my targets
                  </Text>
                  <ChevronRight size={13} color="#C95F18" />
                </TouchableOpacity>
              </View>
            )}

            <ChartCard title="Target Breakdown" subtitle="Monthly target completion">
              <View style={styles.halfDonutWrap}>
                <PieChart
                  data={targetHalfDonutData}
                  donut
                  semiCircle
                  radius={96}
                  innerRadius={68}
                  showText={false}
                  centerLabelComponent={() => (
                    <View style={styles.halfDonutCenter}>
                      <Text style={styles.halfDonutValue}>{safeTargetProgress}%</Text>
                      <Text style={styles.halfDonutLabel}>Completed</Text>
                    </View>
                  )}
                />

                <View style={styles.halfDonutBottomRow}>
                  <View style={styles.targetInfoBox}>
                    <Text style={styles.targetInfoValue}>{safeTargetProgress}%</Text>
                    <Text style={styles.targetInfoLabel}>Done</Text>
                  </View>

                  <View style={styles.targetInfoBox}>
                    <Text style={styles.targetInfoValue}>
                      {100 - safeTargetProgress}%
                    </Text>
                    <Text style={styles.targetInfoLabel}>Pending</Text>
                  </View>
                </View>

                <View style={styles.halfDonutLegend}>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#6B3F20" }]}
                    />
                    <Text style={styles.legendSmallText}>Completed</Text>
                  </View>

                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#EAD7C2" }]}
                    />
                    <Text style={styles.legendSmallText}>Pending</Text>
                  </View>
                </View>
              </View>
            </ChartCard>

            <View style={styles.cardGrid}>
              <SmallCard
                icon={<Ticket size={22} color="#B91C1C" />}
                title="Tickets"
                subtitle="Raise store issues"
                tone="red"
                route="/staff/tickets"
              />

              <SmallCard
                icon={<ListChecks size={22} color="#166534" />}
                title="Checklists"
                subtitle="Store task checks"
                tone="green"
                route="/staff/checklists"
              />

              <SmallCard
                icon={<PencilLine size={22} color="#102B45" />}
                title="To-Do"
                subtitle={`${pendingTodos} pending`}
                tone="blue"
                badge={pendingTodos}
                route="/staff/todos"
              />
            </View>
          </SectionBox>

          <SectionBox
            icon={<Trophy size={15} color="#166534" />}
            title="Leaderboard & Growth"
            subtitle="Ranking, skills, rewards and certificates"
            theme="growth"
          >
            <BigCard
              icon={<Trophy size={22} color="#166534" />}
              title="LEADERBOARD"
              value="View ranking"
              subtitle="Compare your progress with your store team"
              tone="green"
              route="/staff/leaderboard"
            />

            <View style={styles.cardGrid}>
              <SmallCard
                icon={<TrendingUp size={22} color="#166534" />}
                title="Skills"
                subtitle="Skill progress"
                tone="green"
                route="/staff/skill-matrix"
              />

              <SmallCard
                icon={<AlertTriangle size={22} color="#B91C1C" />}
                title="Alerts"
                subtitle="Performance alerts"
                tone="red"
                badge={unreadAlerts}
                route="/staff/performance-alerts"
              />

              <SmallCard
                icon={<Medal size={22} color="#B7791F" />}
                title="Rewards"
                subtitle="Points and badges"
                tone="gold"
                route="/staff/rewards"
              />

              <SmallCard
                icon={<FileBadge size={22} color="#6D28D9" />}
                title="Certificates"
                subtitle="Earned after completion"
                tone="purple"
                route="/staff/certificates"
              />

              <SmallCard
                icon={<BarChart3 size={22} color="#102B45" />}
                title="My Report"
                subtitle="Performance analytics"
                tone="blue"
                route="/staff/reports"
              />
            </View>
          </SectionBox>

          <SectionBox
            icon={<BellRing size={15} color="#B7791F" />}
            title="Updates & Alerts"
            subtitle="Announcements and reminders"
            theme="updates"
          >
            <View style={styles.cardGrid}>
              <SmallCard
                icon={<BellRing size={22} color="#C95F18" />}
                title="Updates"
                subtitle="Announcements"
                tone="orange"
                route="/staff/announcements"
              />

              <SmallCard
                icon={<Clock3 size={22} color="#6B3F20" />}
                title="Reminders"
                subtitle="Deadlines"
                tone="brown"
                route="/staff/reminders"
              />
            </View>

            {dashboardData?.announcements?.length ? (
              <View style={styles.listCard}>
                {dashboardData.announcements.slice(0, 2).map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.listRow,
                      index <
                      Math.min(dashboardData.announcements.length, 2) - 1 &&
                      styles.listDivider,
                    ]}
                    activeOpacity={0.82}
                    onPress={() => router.push("/staff/announcements" as any)}
                  >
                    <View style={styles.orangeDot} />

                    <View style={{ flex: 1 }}>
                      <Text style={styles.listTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.listText} numberOfLines={2}>
                        {item.description ?? "Tap to view announcement"}
                      </Text>
                    </View>

                    <ChevronRight size={15} color="#8A8178" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </SectionBox>

          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.88}
            onPress={handleLogout}
          >
            <View style={styles.logoutIcon}>
              <LogOut size={16} color="#FFFFFF" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.logoutTitle}>Logout Securely</Text>
              <Text style={styles.logoutSub}>End your ON TRACK session</Text>
            </View>

            <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
        </View>
      </SafeAreaView>
    </ScreenLayout>

  );
}

const LOCAL_COLORS = {
  navy: "#102B45",
  orange: "#C95F18",
  cream: "#FFFDF8",
  beige: "#F6EBDC",
  muted: "#8A8178",
  brown: "#6B3F20",
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: LOCAL_COLORS.beige,
  },

  root: {
    flex: 1,
    backgroundColor: LOCAL_COLORS.beige,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingBottom: 28,
    gap: 12,
  },

  header: {
    backgroundColor: LOCAL_COLORS.navy,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    gap: 13,
    overflow: "hidden",
    position: "relative",
  },

  headerGlowOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(201,95,24,0.28)",
    top: -70,
    right: -60,
  },

  headerGlowTwo: {
    position: "absolute",
    width: 135,
    height: 135,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -55,
    left: -35,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  avatarBox: {
    position: "relative",
    width: 55,
    height: 55,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },

  avatarSpark: {
    position: "absolute",
    right: -4,
    bottom: -3,
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: LOCAL_COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: LOCAL_COLORS.navy,
  },

  headerText: {
    flex: 1,
  },

  greeting: {
    fontSize: 12,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "600",
  },

  name: {
    fontSize: 21,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 2,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 7,
  },

  roleChip: {
    backgroundColor: LOCAL_COLORS.orange,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  roleChipText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.6,
  },

  storeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.11)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },

  storeChipText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.72)",
    fontWeight: "700",
    flex: 1,
  },

  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#F6A15A",
    borderWidth: 1.5,
    borderColor: LOCAL_COLORS.navy,
  },

  topStats: {
    backgroundColor: "rgba(255,255,255,0.11)",
    borderRadius: 19,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFEAC7",
  },

  statLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.66)",
    fontWeight: "700",
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  activityTopCard: {
    marginHorizontal: Spacing.three,
    backgroundColor: LOCAL_COLORS.navy,
    borderRadius: 28,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,210,138,0.35)",
    shadowColor: "#102B45",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  activityGlowOne: {
    position: "absolute",
    width: 145,
    height: 145,
    borderRadius: 80,
    backgroundColor: "rgba(201,95,24,0.34)",
    top: -60,
    right: -45,
  },

  activityGlowTwo: {
    position: "absolute",
    width: 95,
    height: 95,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.07)",
    bottom: -38,
    left: -22,
  },

  activityIconWrap: {
    position: "relative",
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: LOCAL_COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },

  activityPulseDot: {
    position: "absolute",
    right: -2,
    top: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FDE68A",
    borderWidth: 2,
    borderColor: LOCAL_COLORS.navy,
  },

  activityEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFD28A",
    letterSpacing: 0.9,
  },

  activityTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 2,
  },

  activitySubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.72)",
    fontWeight: "600",
    lineHeight: 15,
    marginTop: 3,
  },

  activityStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 9,
  },

  activityStatPill: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  activityStatValue: {
    color: "#FFEAC7",
    fontSize: 11,
    fontWeight: "900",
  },

  activityStatLabel: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 9,
    fontWeight: "700",
  },

  activityArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF8EF",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingCard: {
    marginHorizontal: Spacing.three,
    backgroundColor: LOCAL_COLORS.cream,
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: "#EAD7C2",
  },

  loadingText: {
    color: LOCAL_COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
  },

  errorCard: {
    marginHorizontal: Spacing.three,
    backgroundColor: "#FEE2E2",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  errorTitle: {
    color: "#B91C1C",
    fontSize: 14,
    fontWeight: "900",
  },

  errorMessage: {
    color: "#7F1D1D",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },

  retryText: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 8,
  },

  storeInfoCard: {
    marginHorizontal: Spacing.three,
    backgroundColor: LOCAL_COLORS.cream,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EAD7C2",
    gap: 10,
    shadowColor: "#3A2314",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  storeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  storeInfoIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#EAF2FB",
    alignItems: "center",
    justifyContent: "center",
  },

  storeLabel: {
    fontSize: 9,
    color: LOCAL_COLORS.muted,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  storeName: {
    fontSize: 14,
    fontWeight: "900",
    color: LOCAL_COLORS.navy,
    marginTop: 2,
  },

  storeDetails: {
    fontSize: 11,
    color: LOCAL_COLORS.muted,
    fontWeight: "600",
    marginTop: 2,
  },

  managerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1E4D6",
  },

  managerIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#F4E7D8",
    alignItems: "center",
    justifyContent: "center",
  },

  managerName: {
    fontSize: 14,
    fontWeight: "900",
    color: LOCAL_COLORS.navy,
    marginTop: 2,
  },

  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },

  managerEmail: {
    flex: 1,
    fontSize: 11,
    color: LOCAL_COLORS.muted,
    fontWeight: "600",
  },

  sectionBox: {
    marginHorizontal: Spacing.three,
    borderRadius: 26,
    padding: 11,
    borderWidth: 1,
    gap: 10,
  },

  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 3,
  },

  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: LOCAL_COLORS.navy,
  },

  sectionSubtitle: {
    fontSize: 11,
    color: LOCAL_COLORS.muted,
    fontWeight: "600",
    marginTop: 1,
  },

  sectionBody: {
    gap: 10,
  },

  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  smallCard: {
    width: "48.5%",
    backgroundColor: LOCAL_COLORS.cream,
    borderRadius: 20,
    padding: 11,
    borderWidth: 1,
    minHeight: 112,
    shadowColor: "#3A2314",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  smallIcon: {
    position: "relative",
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  smallTitle: {
    fontSize: 13,
    color: LOCAL_COLORS.navy,
    fontWeight: "900",
  },

  smallSubtitle: {
    fontSize: 10.5,
    color: LOCAL_COLORS.muted,
    fontWeight: "600",
    lineHeight: 15,
    marginTop: 3,
  },

  bigCard: {
    backgroundColor: LOCAL_COLORS.cream,
    borderRadius: 20,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    shadowColor: "#3A2314",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  bigIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  bigCardBody: {
    flex: 1,
  },

  bigLabel: {
    fontSize: 9,
    color: LOCAL_COLORS.muted,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  bigValue: {
    fontSize: 14,
    fontWeight: "900",
    marginTop: 2,
  },

  bigSubtitle: {
    fontSize: 10.5,
    color: LOCAL_COLORS.muted,
    lineHeight: 15,
    marginTop: 3,
    fontWeight: "600",
  },

  arrowCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  progressTrack: {
    height: 5,
    backgroundColor: "#F1E4D6",
    borderRadius: 999,
    marginTop: 6,
    overflow: "hidden",
  },

  progressFill: {
    height: 5,
    borderRadius: 999,
  },

  chartCard: {
    backgroundColor: LOCAL_COLORS.cream,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EAD7C2",
    overflow: "hidden",
    shadowColor: "#3A2314",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  chartTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: LOCAL_COLORS.navy,
  },

  chartSubtitle: {
    fontSize: 10.5,
    color: LOCAL_COLORS.muted,
    fontWeight: "600",
    marginTop: 2,
    marginBottom: 8,
  },

  chartBody: {
    overflow: "hidden",
  },

  donutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  donutCenter: {
    alignItems: "center",
    justifyContent: "center",
  },

  donutValue: {
    fontSize: 15,
    fontWeight: "900",
    color: LOCAL_COLORS.navy,
  },

  donutLabel: {
    fontSize: 9,
    color: LOCAL_COLORS.muted,
    fontWeight: "700",
  },

  donutLegend: {
    flex: 1,
  },

  legendTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: LOCAL_COLORS.navy,
  },

  legendText: {
    fontSize: 11,
    color: LOCAL_COLORS.brown,
    fontWeight: "700",
    marginTop: 4,
  },

  legendMuted: {
    fontSize: 10.5,
    color: LOCAL_COLORS.muted,
    fontWeight: "600",
    marginTop: 4,
    lineHeight: 15,
  },

  halfDonutWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
    paddingBottom: 8,
  },

  halfDonutCenter: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -24,
  },

  halfDonutValue: {
    fontSize: 25,
    fontWeight: "900",
    color: "#6B3F20",
  },

  halfDonutLabel: {
    fontSize: 10,
    color: LOCAL_COLORS.muted,
    fontWeight: "800",
    marginTop: 2,
  },

  halfDonutBottomRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: -18,
    paddingHorizontal: 20,
  },

  targetInfoBox: {
    minWidth: 86,
    backgroundColor: "#FFF8EF",
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAD7C2",
  },

  targetInfoValue: {
    fontSize: 15,
    fontWeight: "900",
    color: "#102B45",
  },

  targetInfoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8A8178",
    marginTop: 2,
  },

  halfDonutLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    marginTop: 12,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  legendSmallText: {
    fontSize: 10.5,
    color: "#8A8178",
    fontWeight: "700",
  },

  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#B91C1C",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFDF8",
    paddingHorizontal: 4,
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  listCard: {
    backgroundColor: LOCAL_COLORS.cream,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EAD7C2",
    overflow: "hidden",
  },

  listRow: {
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  listDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1E4D6",
  },

  orangeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LOCAL_COLORS.orange,
  },

  listTitle: {
    color: LOCAL_COLORS.navy,
    fontSize: 13,
    fontWeight: "900",
  },

  listText: {
    color: LOCAL_COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
    lineHeight: 15,
  },

  logoutButton: {
    marginHorizontal: Spacing.three,
    backgroundColor: LOCAL_COLORS.navy,
    borderRadius: 22,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#102B45",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  logoutIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#B91C1C",
    alignItems: "center",
    justifyContent: "center",
  },

  logoutTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  logoutSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
    fontWeight: "600",
  },

  bottomSpacer: {
    height: 14,
  },
});

const staffAlertStyles = StyleSheet.create({
  alertsCard: {
    backgroundColor: "#FFF8EF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FED7AA",
    padding: 11,
    gap: 8,
  },
  alertsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  alertsTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#C95F18",
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1E4D6",
  },
  alertType: {
    fontSize: 11,
    fontWeight: "900",
    color: "#102B45",
  },
  alertNote: {
    fontSize: 11,
    color: "#8A8178",
    fontWeight: "600",
    marginTop: 2,
    lineHeight: 15,
  },
  replyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#C95F18",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },
  replyBtnText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  repliedBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  repliedBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#166534",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#FFFDF8",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    gap: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#102B45",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#EAD7C2",
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: "#102B45",
    textAlignVertical: "top",
    minHeight: 80,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#EAD7C2",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8A8178",
  },
  sendBtn: {
    flex: 1,
    backgroundColor: "#C95F18",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  sendText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  targetNotifBanner: {
    backgroundColor: "#FFF8F0",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    borderLeftWidth: 4,
    borderLeftColor: "#C95F18",
    padding: 12,
    gap: 8,
  },
  targetNotifHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  targetNotifHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    color: "#C95F18",
  },
  targetNotifBadge: {
    backgroundColor: "#C95F18",
    borderRadius: 999,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  targetNotifBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  targetNotifItem: {
    backgroundColor: "#FFFDF8",
    borderRadius: 10,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: "#EAD7C2",
  },
  targetNotifMsg: {
    fontSize: 12,
    color: "#1F2937",
    fontWeight: "600",
    lineHeight: 18,
  },
  targetNotifNote: {
    fontSize: 11,
    color: "#6B7280",
    fontStyle: "italic",
    lineHeight: 16,
  },
  targetNotifMarkReadBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#EAD7C2",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  targetNotifMarkReadText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6B3F20",
  },
  targetNotifViewAll: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 4,
  },
  targetNotifViewAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#C95F18",
  },
});