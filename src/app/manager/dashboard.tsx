import { router } from "expo-router";
import {
  AlertTriangle,
  Award,
  BadgeCheck,
  BarChart3,
  Bell,
  BellRing,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileCheck,
  GraduationCap,
  ListChecks,
  LogOut,
  MapPin,
  Megaphone,
  MessageSquare,
  ShieldCheck,
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
import { SafeAreaView } from "react-native-safe-area-context";

import { managerDashboardService } from "@/services/manager-dashboard.service";
import { useAuthStore } from "@/store/auth.store";
import type { ManagerDashboardResponse } from "@/types/dashboard.types";

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
};

type Tone = "orange" | "blue" | "brown" | "green" | "red" | "gold" | "gray";

type SectionTheme =
  | "team"
  | "task"
  | "training"
  | "growth"
  | "communication"
  | "tools";

interface SmallCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: Tone;
  route: string;
  badge?: number;
}

interface SectionBoxProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  theme: SectionTheme;
  children: React.ReactNode;
}

function getTone(tone: Tone) {
  switch (tone) {
    case "orange":
      return {
        bg: "#FFF1E5",
        text: "#C95F18",
        border: "#FED7AA",
      };

    case "blue":
      return {
        bg: "#EAF2FB",
        text: "#102B45",
        border: "#C9DBEF",
      };

    case "brown":
      return {
        bg: "#F4E7D8",
        text: "#6B3F20",
        border: "#E6CDB3",
      };

    case "green":
      return {
        bg: "#DCFCE7",
        text: "#166534",
        border: "#BBF7D0",
      };

    case "red":
      return {
        bg: "#FEE2E2",
        text: "#B91C1C",
        border: "#FECACA",
      };

    case "gold":
      return {
        bg: "#FFF4D8",
        text: "#B7791F",
        border: "#F5D28A",
      };

    case "gray":
    default:
      return {
        bg: "#F3F4F6",
        text: "#4B5563",
        border: "#E5E7EB",
      };
  }
}

function getSectionTheme(theme: SectionTheme) {
  switch (theme) {
    case "team":
      return {
        bg: "#EFF6FF",
        border: "#BFDBFE",
        iconBg: "#DBEAFE",
        title: C.navy,
        subtitle: C.muted,
      };

    case "task":
      return {
        bg: "#FDF2F8",
        border: "#FBCFE8",
        iconBg: "#FCE7F3",
        title: C.navy,
        subtitle: C.muted,
      };

    case "training":
      return {
        bg: "#EEF6FF",
        border: "#C9DBEF",
        iconBg: "#DBEAFE",
        title: C.navy,
        subtitle: C.muted,
      };

    case "growth":
      return {
        bg: "#F0FDF4",
        border: "#BBF7D0",
        iconBg: "#DCFCE7",
        title: C.navy,
        subtitle: C.muted,
      };

    case "communication":
      return {
        bg: "#FEFCE8",
        border: "#FDE68A",
        iconBg: "#FEF3C7",
        title: C.navy,
        subtitle: C.muted,
      };

    case "tools":
    default:
      return {
        bg: "#F8FAFC",
        border: "#CBD5E1",
        iconBg: "#EAF2FB",
        title: C.navy,
        subtitle: C.muted,
      };
  }
}

function SectionBox({
  title,
  subtitle,
  icon,
  theme,
  children,
}: SectionBoxProps) {
  const t = getSectionTheme(theme);

  return (
    <View
      style={[
        styles.sectionBox,
        {
          backgroundColor: t.bg,
          borderColor: t.border,
        },
      ]}
    >
      <View style={styles.sectionHead}>
        <View
          style={[
            styles.sectionIcon,
            {
              backgroundColor: t.iconBg,
              borderColor: t.border,
            },
          ]}
        >
          {icon}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: t.title }]}>{title}</Text>
          <Text style={[styles.sectionSubtitle, { color: t.subtitle }]}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function SmallCard({
  title,
  subtitle,
  icon,
  tone,
  route,
  badge,
}: SmallCardProps) {
  const t = getTone(tone);

  return (
    <TouchableOpacity
      style={[styles.smallCard, { borderColor: t.border }]}
      activeOpacity={0.86}
      onPress={() => router.push(route as any)}
    >
      <View style={[styles.smallIcon, { backgroundColor: t.bg }]}>
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

function LeaderboardTopButton() {
  return (
    <TouchableOpacity
      style={styles.leaderboardTopCard}
      activeOpacity={0.9}
      onPress={() => router.push("/manager/leaderboard" as any)}
    >
      <View style={styles.leaderboardGlowOne} />
      <View style={styles.leaderboardGlowTwo} />

      <View style={styles.leaderboardIconBox}>
        <Trophy size={28} color="#FFFFFF" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.leaderboardEyebrow}>STORE RANKING</Text>
        <Text style={styles.leaderboardTitle}>Leaderboard</Text>
        <Text style={styles.leaderboardSub} numberOfLines={2}>
          View top performers, growth score and store ranking in one place.
        </Text>
      </View>

      <View style={styles.leaderboardArrow}>
        <ChevronRight size={18} color={C.gold} />
      </View>
    </TouchableOpacity>
  );
}

function ManagerOverviewCard({
  teamSize,
  presentToday,
  attendancePercent,
  pendingApprovals,
  targetPercent,
  targetTone,
}: {
  teamSize: number;
  presentToday: number;
  attendancePercent: number;
  pendingApprovals: number;
  targetPercent: number;
  targetTone: Tone;
}) {
  const targetColor = getTone(targetTone).text;
  const safeTarget = Math.max(0, Math.min(targetPercent, 100));

  return (
    <View style={styles.overviewBox}>
      <View style={styles.overviewTop}>
        <View style={styles.overviewTitleBlock}>
          <Text style={styles.overviewEyebrow}>STORE OVERVIEW</Text>
          <Text style={styles.overviewTitle}>Today’s Store Health</Text>
        </View>

        <TouchableOpacity
          style={styles.overviewReportBtn}
          activeOpacity={0.85}
          onPress={() => router.push("/manager/reports" as any)}
        >
          <BarChart3 size={15} color={C.orange} />
          <Text style={styles.overviewReportText}>Report</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.compactHealthRow}>
        <View style={styles.compactHealthLeft}>
          <Store size={18} color="#FFFFFF" />
          <View style={{ flex: 1 }}>
            <Text style={styles.compactHealthTitle}>Performance</Text>
            <Text style={styles.compactHealthSub} numberOfLines={1}>
              {targetPercent >= 75
                ? "Good store health"
                : targetPercent >= 50
                  ? "Moderate follow-up"
                  : "Needs attention"}
            </Text>
          </View>
        </View>

        <View style={styles.compactScoreBox}>
          <Text style={[styles.compactScoreValue, { color: targetColor }]}>
            {safeTarget}%
          </Text>
          <Text style={styles.compactScoreLabel}>Target</Text>
        </View>
      </View>

      <View style={styles.compactProgressTrack}>
        <View
          style={[
            styles.compactProgressFill,
            {
              width: `${safeTarget}%`,
              backgroundColor: targetColor,
            },
          ]}
        />
      </View>

      <View style={styles.overviewGridCompact}>
        <TouchableOpacity
          style={styles.overviewMiniCardCompact}
          activeOpacity={0.86}
          onPress={() => router.push("/manager/team" as any)}
        >
          <UsersRound size={18} color={C.navy} />
          <Text style={styles.overviewMiniValue}>{teamSize}</Text>
          <Text style={styles.overviewMiniLabel}>Team</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.overviewMiniCardCompact}
          activeOpacity={0.86}
          onPress={() => router.push("/manager/attendance" as any)}
        >
          <CalendarClock size={18} color={C.orange} />
          <Text style={styles.overviewMiniValue}>
            {teamSize > 0 ? `${presentToday}/${teamSize}` : presentToday}
          </Text>
          <Text style={styles.overviewMiniLabel}>Present</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.overviewMiniCardCompact}
          activeOpacity={0.86}
          onPress={() => router.push("/manager/approvals" as any)}
        >
          <BadgeCheck
            size={18}
            color={pendingApprovals > 0 ? C.red : C.green}
          />
          <Text style={styles.overviewMiniValue}>{pendingApprovals}</Text>
          <Text style={styles.overviewMiniLabel}>Approvals</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.overviewMiniCardCompact}
          activeOpacity={0.86}
          onPress={() => router.push("/manager/target-progress" as any)}
        >
          <Target size={18} color={C.brown} />
          <Text style={styles.overviewMiniValue}>{attendancePercent}%</Text>
          <Text style={styles.overviewMiniLabel}>Attendance</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ManagerDashboardScreen() {
  const { user, logout } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [dashboard, setDashboard] = useState<ManagerDashboardResponse | null>(null);
  const [attendanceAlerts, setAttendanceAlerts] = useState<any[]>([]);
  const [replyAlertId, setReplyAlertId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [targetNotifs, setTargetNotifs] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
    loadAttendanceAlerts();
    loadTargetNotifications();
  }, []);

  async function loadAttendanceAlerts() {
    try {
      const alerts = await managerDashboardService.getAttendanceAlerts();
      setAttendanceAlerts(alerts ?? []);
    } catch {
      // non-critical, silently ignore
    }
  }

  async function handleReplyAlert() {
    if (!replyAlertId || !replyText.trim()) return;
    try {
      await managerDashboardService.replyToAlert(replyAlertId, replyText.trim());
      setReplyAlertId(null);
      setReplyText("");
      await loadAttendanceAlerts();
    } catch (e) {
      Alert.alert("Error", "Could not send reply. Please try again.");
    }
  }

  async function loadTargetNotifications() {
    try {
      const data = await managerDashboardService.getTargetNotifications();
      setTargetNotifs((data ?? []).filter((n: any) => !n.is_read));
    } catch {
      // non-critical
    }
  }

  async function markTargetNotifRead(notifId: string) {
    try {
      await managerDashboardService.markTargetNotificationRead(notifId);
      setTargetNotifs((prev) => prev.filter((n) => n.id !== notifId));
    } catch {
      // non-critical
    }
  }

  async function loadDashboard() {
    try {
      setLoading(true);
      setDashboardError("");

      const data = await managerDashboardService.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.log("Manager dashboard load error:", error);
      setDashboardError(
        error instanceof Error ? error.message : "Unable to load manager dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await loadDashboard();
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

  const teamSize = dashboard?.team?.team_size ?? 0;
  const presentToday = dashboard?.attendance?.present_today ?? 0;
  const pendingApprovals = dashboard?.approvals?.total_pending ?? 0;
  const assignmentSubmissions = dashboard?.approvals?.assignment_submissions ?? 0;
  const documentApprovals = dashboard?.approvals?.documents ?? 0;
  const leaveRequests = dashboard?.approvals?.leave_requests ?? 0;
  const attendanceCorrections =
    dashboard?.approvals?.attendance_corrections ?? 0;
  const openTickets = dashboard?.tickets?.open ?? 0;
  const activeAssignments = dashboard?.assignments?.active ?? 0;
  const activeQuizzes = dashboard?.quizzes?.active ?? 0;
  const activeChecklists = dashboard?.checklists?.active ?? 0;
  const targetPercent = Math.round(dashboard?.targets?.average_percentage ?? 0);
  const attendancePercent =
    teamSize > 0 ? Math.round((presentToday / teamSize) * 100) : 0;

  const managerName =
    dashboard?.manager?.full_name ?? user?.full_name ?? "Store Manager";

  const storeName =
    dashboard?.manager?.store_name ??
    (user as any)?.store_name ??
    "Store not assigned";

  const region =
    dashboard?.manager?.region ?? (user as any)?.region ?? "Region not available";

  const targetTone: Tone = useMemo(() => {
    if (targetPercent >= 75) return "green";
    if (targetPercent >= 50) return "orange";
    return "red";
  }, [targetPercent]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[C.orange]}
              tintColor={C.orange}
            />
          }
        >
          <View style={styles.header}>
            <View style={styles.headerGlowOne} />
            <View style={styles.headerGlowTwo} />

            <View style={styles.headerTop}>
              <View style={styles.avatarBox}>
                <UserRound size={26} color="#FFF8EF" />
                <View style={styles.avatarSpark}>
                  <Sparkles size={11} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.headerText}>
                <Text style={styles.greeting}>{greeting()},</Text>
                <Text style={styles.managerName} numberOfLines={1}>
                  {managerName}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.roleChip}>
                    <Text style={styles.roleChipText}>MANAGER</Text>
                  </View>

                  <View style={styles.storeChip}>
                    <Store size={10} color="#F6A15A" />
                    <Text style={styles.storeChipText} numberOfLines={1}>
                      {storeName}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.bellBtn}
                activeOpacity={0.84}
                onPress={() => router.push("/manager/notifications" as any)}
              >
                <BellRing size={19} color="#FFFFFF" />
                {pendingApprovals > 0 ? <View style={styles.notifDot} /> : null}
              </TouchableOpacity>
            </View>

            <View style={styles.headerStats}>
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>{teamSize}</Text>
                <Text style={styles.headerStatLabel}>Team</Text>
              </View>

              <View style={styles.headerDivider} />

              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>{attendancePercent}%</Text>
                <Text style={styles.headerStatLabel}>Attendance</Text>
              </View>

              <View style={styles.headerDivider} />

              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>{targetPercent}%</Text>
                <Text style={styles.headerStatLabel}>Target</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.approvalBanner}
              activeOpacity={0.88}
              onPress={() => router.push("/manager/approvals" as any)}
            >
              <View
                style={[
                  styles.approvalBannerIcon,
                  {
                    backgroundColor:
                      pendingApprovals > 0 ? "#FEE2E2" : "#DCFCE7",
                  },
                ]}
              >
                {pendingApprovals > 0 ? (
                  <AlertTriangle size={18} color={C.red} />
                ) : (
                  <ShieldCheck size={18} color={C.green} />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.approvalBannerTitle}>
                  {pendingApprovals > 0
                    ? `${pendingApprovals} pending approvals`
                    : "All approvals clear"}
                </Text>
                <Text style={styles.approvalBannerSub} numberOfLines={1}>
                  {pendingApprovals > 0
                    ? "Review staff submissions, documents and requests"
                    : "No urgent manager action required"}
                </Text>
              </View>

              <View style={styles.reviewPill}>
                <Text style={styles.reviewPillText}>
                  {pendingApprovals > 0 ? "Review" : "View"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={C.orange} size="large" />
              <Text style={styles.loadingText}>Loading manager dashboard...</Text>
            </View>
          ) : null}

          {dashboardError ? (
            <TouchableOpacity
              style={styles.errorCard}
              activeOpacity={0.85}
              onPress={loadDashboard}
            >
              <Text style={styles.errorTitle}>Could not load dashboard</Text>
              <Text style={styles.errorMessage}>{dashboardError}</Text>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          ) : null}

          <LeaderboardTopButton />

          <View style={styles.storeInfoCard}>
            <View style={styles.storeInfoRow}>
              <View style={styles.storeIcon}>
                <MapPin size={18} color={C.navy} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.storeLabel}>MY STORE</Text>
                <Text style={styles.storeName} numberOfLines={1}>
                  {storeName}
                </Text>
                <Text style={styles.storeSub} numberOfLines={1}>
                  {region}
                </Text>
              </View>
            </View>
          </View>

          <ManagerOverviewCard
            teamSize={teamSize}
            presentToday={presentToday}
            attendancePercent={attendancePercent}
            pendingApprovals={pendingApprovals}
            targetPercent={targetPercent}
            targetTone={targetTone}
          />

          {/* Reply modal */}
          <Modal
            visible={!!replyAlertId}
            transparent
            animationType="slide"
            onRequestClose={() => { setReplyAlertId(null); setReplyText(""); }}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Reply to Admin Alert</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Type your reply here…"
                  value={replyText}
                  onChangeText={setReplyText}
                  multiline
                  numberOfLines={3}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => { setReplyAlertId(null); setReplyText(""); }}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSendBtn}
                    onPress={handleReplyAlert}
                    disabled={!replyText.trim()}
                  >
                    <Text style={styles.modalSendText}>Send Reply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <SectionBox
            icon={<UsersRound size={15} color={C.navy} />}
            title="Team Operations"
            subtitle="Staff, attendance, leave and corrections"
            theme="team"
          >
            {attendanceAlerts.length > 0 && (
              <View style={styles.alertsCard}>
                <View style={styles.alertsHeader}>
                  <Bell size={13} color={C.orange} />
                  <Text style={styles.alertsTitle}>
                    Admin Attendance Alerts ({attendanceAlerts.length})
                  </Text>
                </View>
                {attendanceAlerts.slice(0, 3).map((alert: any) => (
                  <View key={alert.id} style={styles.alertRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.alertType}>
                        {(alert.alert_type || "NOTE").replace(/_/g, " ")}
                        {" · "}
                        <Text style={[styles.alertSeverity, { color: alert.severity === "critical" ? C.red : C.gold }]}>
                          {alert.severity?.toUpperCase()}
                        </Text>
                      </Text>
                      <Text style={styles.alertNote} numberOfLines={2}>{alert.note}</Text>
                    </View>
                    {alert.reply_status === "pending" && alert.requires_reply ? (
                      <TouchableOpacity
                        style={styles.replyBtn}
                        onPress={() => { setReplyAlertId(alert.id); setReplyText(""); }}
                      >
                        <MessageSquare size={11} color={C.white} />
                        <Text style={styles.replyBtnText}>Reply</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.repliedBadge}>
                        <Text style={styles.repliedBadgeText}>
                          {alert.reply_status === "replied" ? "Replied" : "Sent"}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
            <View style={styles.cardGrid}>
              <SmallCard
                title="Team"
                subtitle="View staff"
                icon={<UsersRound size={22} color={C.navy} />}
                tone="blue"
                route="/manager/team"
              />

              <SmallCard
                title="Attendance"
                subtitle="Daily status"
                icon={<CalendarCheck size={22} color={C.orange} />}
                tone="orange"
                route="/manager/attendance"
              />

              <SmallCard
                title="Leave"
                subtitle="Approve requests"
                icon={<CalendarDays size={22} color={C.brown} />}
                tone="brown"
                route="/manager/leave-requests"
                badge={leaveRequests}
              />

              <SmallCard
                title="Corrections"
                subtitle="Punch fixes"
                icon={<Clock3 size={22} color={C.red} />}
                tone="red"
                route="/manager/attendance-corrections"
                badge={attendanceCorrections}
              />
            </View>
          </SectionBox>

          <SectionBox
            icon={<ClipboardCheck size={15} color={C.red} />}
            title="Tasks & Approvals"
            subtitle="Documents, tickets and pending reviews"
            theme="task"
          >
            <View style={styles.cardGrid}>
              <SmallCard
                title="Documents"
                subtitle="Approve files"
                icon={<FileCheck size={22} color={C.red} />}
                tone="red"
                route="/manager/document-approvals"
                badge={documentApprovals}
              />

              <SmallCard
                title="Tickets"
                subtitle={`${openTickets} open`}
                icon={<Ticket size={22} color={C.brown} />}
                tone="brown"
                route="/manager/tickets"
                badge={openTickets}
              />

              <SmallCard
                title="Approvals"
                subtitle="All pending reviews"
                icon={<BadgeCheck size={22} color={C.gold} />}
                tone="gold"
                route="/manager/approvals"
                badge={pendingApprovals}
              />
            </View>
          </SectionBox>

          <SectionBox
            icon={<BookOpenCheck size={15} color={C.navy} />}
            title="Learning Controls"
            subtitle="Assignments, submissions, courses and quizzes"
            theme="training"
          >
            <View style={styles.cardGrid}>
              <SmallCard
                title="Create Assignment"
                subtitle={`${activeAssignments} active`}
                icon={<ClipboardList size={22} color={C.orange} />}
                tone="orange"
                route="/manager/create-assignment"
              />

              <SmallCard
                title="Submissions"
                subtitle="Review assignment work"
                icon={<ClipboardCheck size={22} color={C.green} />}
                tone="green"
                route="/manager/assignment-submissions"
                badge={assignmentSubmissions}
              />

              <SmallCard
                title="Courses"
                subtitle="Create course"
                icon={<BookOpenCheck size={22} color={C.navy} />}
                tone="blue"
                route="/manager/create-course"
              />

              <SmallCard
                title="Progress"
                subtitle="Course tracking"
                icon={<BarChart3 size={22} color={C.brown} />}
                tone="brown"
                route="/manager/course-progress"
              />

              <SmallCard
                title="Create Quiz"
                subtitle={`${activeQuizzes} active`}
                icon={<GraduationCap size={22} color={C.gold} />}
                tone="gold"
                route="/manager/create-quiz"
              />

              <SmallCard
                title="Quiz Results"
                subtitle="Staff scores"
                icon={<ClipboardList size={22} color="#4B5563" />}
                tone="gray"
                route="/manager/quiz-attempts"
              />
            </View>
          </SectionBox>

          <SectionBox
            icon={<TrendingUp size={15} color={C.green} />}
            title="Growth & Performance"
            subtitle="Skills, alerts, coaching and rewards"
            theme="growth"
          >
            <View style={styles.cardGrid}>
              <SmallCard
                title="Skill Matrix"
                subtitle="Competencies"
                icon={<TrendingUp size={22} color={C.green} />}
                tone="green"
                route="/manager/skill-matrix"
              />

              <SmallCard
                title="Performance"
                subtitle="Low performer alerts"
                icon={<AlertTriangle size={22} color={C.red} />}
                tone="red"
                route="/manager/performance-alerts"
              />

              <SmallCard
                title="Coaching"
                subtitle="Improvement plans"
                icon={<BriefcaseBusiness size={22} color={C.brown} />}
                tone="brown"
                route="/manager/coaching-plans"
              />

              <SmallCard
                title="Rewards"
                subtitle="Badges & points"
                icon={<Award size={22} color={C.gold} />}
                tone="gold"
                route="/manager/rewards"
              />
            </View>
          </SectionBox>

          <SectionBox
            icon={<Megaphone size={15} color={C.gold} />}
            title="Store Communication"
            subtitle="Updates, reminders, checklists and reports"
            theme="communication"
          >
            <View style={styles.cardGrid}>
              <SmallCard
                title="Announcements"
                subtitle="Post updates"
                icon={<Megaphone size={22} color={C.orange} />}
                tone="orange"
                route="/manager/announcements"
              />

              <SmallCard
                title="Reminders"
                subtitle="Send reminders"
                icon={<BellRing size={22} color={C.brown} />}
                tone="brown"
                route="/manager/reminders"
              />

              <SmallCard
                title="Checklists"
                subtitle={`${activeChecklists} active`}
                icon={<ListChecks size={22} color={C.green} />}
                tone="green"
                route="/manager/checklists"
              />

              <SmallCard
                title="Reports"
                subtitle="Store reports"
                icon={<BarChart3 size={22} color={C.gold} />}
                tone="gold"
                route="/manager/reports"
              />

              <SmallCard
                title="Audit Logs"
                subtitle="Activity trace"
                icon={<ShieldCheck size={22} color={C.navy} />}
                tone="blue"
                route="/manager/audit-logs"
              />
            </View>
          </SectionBox>

          <SectionBox
            icon={<Target size={15} color={C.navy} />}
            title="Manager Tools"
            subtitle="Targets and progress tracking"
            theme="tools"
          >
            {targetNotifs.length > 0 && (
              <View style={styles.targetNotifBanner}>
                <View style={styles.targetNotifHeaderRow}>
                  <Bell size={13} color={C.orange} />
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
                  onPress={() => router.push("/manager/target-progress" as any)}
                >
                  <Text style={styles.targetNotifViewAllText}>
                    View target progress
                  </Text>
                  <ChevronRight size={13} color={C.orange} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.cardGrid}>
              <SmallCard
                title="Set Targets"
                subtitle="Assign goals"
                icon={<Target size={22} color={C.brown} />}
                tone="brown"
                route="/manager/set-targets"
              />

              <SmallCard
                title="Target Progress"
                subtitle="Track goals"
                icon={<BarChart3 size={22} color={C.green} />}
                tone="green"
                route="/manager/target-progress"
              />
            </View>
          </SectionBox>

          {dashboard?.team?.staff_preview?.length ? (
            <SectionBox
              icon={<UsersRound size={15} color={C.navy} />}
              title="Team Preview"
              subtitle="Recently active team members"
              theme="team"
            >
              <View style={styles.staffListCard}>
                {dashboard.team.staff_preview.slice(0, 3).map((staff) => (
                  <TouchableOpacity
                    key={staff.id}
                    style={styles.staffRow}
                    activeOpacity={0.84}
                    onPress={() =>
                      router.push({
                        pathname: "/manager/team/[staffId]" as any,
                        params: { staffId: staff.id },
                      })
                    }
                  >
                    <View style={styles.staffAvatar}>
                      <Text style={styles.staffAvatarText}>
                        {staff.full_name
                          ?.split(" ")
                          .map((item: string) => item[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.staffName} numberOfLines={1}>
                        {staff.full_name}
                      </Text>
                      <Text style={styles.staffMeta} numberOfLines={1}>
                        {staff.designation} · Target {staff.target_percentage ?? 0}%
                      </Text>
                    </View>

                    <ChevronRight size={15} color={C.muted} />
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={styles.viewAllButton}
                  activeOpacity={0.84}
                  onPress={() => router.push("/manager/team" as any)}
                >
                  <Text style={styles.viewAllText}>View full team</Text>
                  <ChevronRight size={14} color={C.orange} />
                </TouchableOpacity>
              </View>
            </SectionBox>
          ) : null}

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
              <Text style={styles.logoutSub}>End your manager session</Text>
            </View>

            <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.beige,
  },

  root: {
    flex: 1,
    backgroundColor: C.beige,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingBottom: 28,
    gap: 12,
  },

  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
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
    backgroundColor: C.orange,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.navy,
  },

  headerText: {
    flex: 1,
  },

  greeting: {
    fontSize: 12,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "600",
  },

  managerName: {
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
    backgroundColor: C.orange,
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
    borderColor: C.navy,
  },

  headerStats: {
    backgroundColor: "rgba(255,255,255,0.11)",
    borderRadius: 19,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  headerStat: {
    flex: 1,
    alignItems: "center",
  },

  headerStatValue: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFEAC7",
  },

  headerStatLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.66)",
    fontWeight: "700",
    marginTop: 2,
  },

  headerDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  approvalBanner: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  approvalBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  approvalBannerTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  approvalBannerSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.66)",
    marginTop: 2,
    fontWeight: "600",
  },

  reviewPill: {
    backgroundColor: C.orange,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  reviewPillText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 11,
  },

  loadingCard: {
    marginHorizontal: 16,
    backgroundColor: C.cream,
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: "#EAD7C2",
  },

  loadingText: {
    color: C.muted,
    fontSize: 13,
    fontWeight: "700",
  },

  errorCard: {
    marginHorizontal: 16,
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

  leaderboardTopCard: {
    marginHorizontal: 16,
    backgroundColor: "#6B3F20",
    borderRadius: 26,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,210,138,0.45)",
    shadowColor: "#6B3F20",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  leaderboardGlowOne: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 80,
    backgroundColor: "rgba(255,210,138,0.20)",
    top: -65,
    right: -45,
  },

  leaderboardGlowTwo: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.08)",
    bottom: -35,
    left: -25,
  },

  leaderboardIconBox: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },

  leaderboardEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFEAC7",
    letterSpacing: 1,
  },

  leaderboardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 2,
  },

  leaderboardSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.74)",
    fontWeight: "600",
    lineHeight: 15,
    marginTop: 3,
  },

  leaderboardArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFDF8",
    alignItems: "center",
    justifyContent: "center",
  },

  storeInfoCard: {
    marginHorizontal: 16,
    backgroundColor: C.cream,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EAD7C2",
    shadowColor: "#3A2314",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  storeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  storeIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#EAF2FB",
    alignItems: "center",
    justifyContent: "center",
  },

  storeLabel: {
    fontSize: 9,
    color: C.muted,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  storeName: {
    fontSize: 14,
    fontWeight: "900",
    color: C.navy,
    marginTop: 1,
  },

  storeSub: {
    fontSize: 11,
    color: C.muted,
    fontWeight: "600",
    marginTop: 1,
  },

  overviewBox: {
    marginHorizontal: 16,
    backgroundColor: C.cream,
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EAD7C2",
    gap: 10,
    shadowColor: "#3A2314",
    shadowOpacity: 0.05,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  overviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  overviewTitleBlock: {
    flex: 1,
  },

  overviewEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    color: C.orange,
    letterSpacing: 1,
  },

  overviewTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: C.navy,
    marginTop: 2,
  },

  overviewReportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFF3E8",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },

  overviewReportText: {
    fontSize: 10,
    color: C.orange,
    fontWeight: "900",
  },

  compactHealthRow: {
    backgroundColor: C.navy,
    borderRadius: 18,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  compactHealthLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  compactHealthTitle: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "900",
  },

  compactHealthSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.72)",
    fontWeight: "600",
    marginTop: 1,
  },

  compactScoreBox: {
    minWidth: 54,
    backgroundColor: C.cream,
    borderRadius: 15,
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },

  compactScoreValue: {
    fontSize: 15,
    fontWeight: "900",
  },

  compactScoreLabel: {
    fontSize: 8,
    color: C.muted,
    fontWeight: "800",
  },

  compactProgressTrack: {
    height: 5,
    backgroundColor: "#F1E4D6",
    borderRadius: 999,
    overflow: "hidden",
  },

  compactProgressFill: {
    height: 5,
    borderRadius: 999,
  },

  overviewGridCompact: {
    flexDirection: "row",
    gap: 7,
  },

  overviewMiniCardCompact: {
    flex: 1,
    backgroundColor: "#FFF8EF",
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAD7C2",
    minHeight: 76,
  },

  overviewMiniValue: {
    fontSize: 14,
    fontWeight: "900",
    color: C.navy,
    marginTop: 4,
  },

  overviewMiniLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: C.muted,
    marginTop: 1,
  },

  sectionBox: {
    marginHorizontal: 16,
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
  },

  sectionSubtitle: {
    fontSize: 11,
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
    backgroundColor: C.cream,
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
    color: C.navy,
    fontWeight: "900",
  },

  smallSubtitle: {
    fontSize: 10.5,
    color: C.muted,
    fontWeight: "600",
    lineHeight: 15,
    marginTop: 3,
  },

  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: C.red,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.cream,
    paddingHorizontal: 4,
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  staffListCard: {
    backgroundColor: C.cream,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EAD7C2",
    overflow: "hidden",
  },

  staffRow: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1E4D6",
  },

  staffAvatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#FFF3E8",
    alignItems: "center",
    justifyContent: "center",
  },

  staffAvatarText: {
    fontSize: 12,
    fontWeight: "900",
    color: C.orange,
  },

  staffName: {
    fontSize: 13,
    fontWeight: "900",
    color: C.navy,
  },

  staffMeta: {
    fontSize: 11,
    color: C.muted,
    fontWeight: "600",
    marginTop: 2,
  },

  viewAllButton: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },

  viewAllText: {
    color: C.orange,
    fontSize: 12,
    fontWeight: "900",
  },

  logoutButton: {
    marginHorizontal: 16,
    backgroundColor: C.navy,
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
    fontSize: 10,
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
    fontWeight: "600",
  },

  bottomSpacer: {
    height: 14,
  },

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
    color: C.orange,
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
    color: C.navy,
  },

  alertSeverity: {
    fontSize: 10,
    fontWeight: "900",
  },

  alertNote: {
    fontSize: 11,
    color: C.muted,
    fontWeight: "600",
    marginTop: 2,
    lineHeight: 15,
  },

  replyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.orange,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },

  replyBtnText: {
    fontSize: 10,
    fontWeight: "900",
    color: C.white,
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
    color: C.navy,
  },

  modalInput: {
    borderWidth: 1,
    borderColor: "#EAD7C2",
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: C.navy,
    textAlignVertical: "top",
    minHeight: 80,
  },

  modalButtons: {
    flexDirection: "row",
    gap: 10,
  },

  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#EAD7C2",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },

  modalCancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.muted,
  },

  modalSendBtn: {
    flex: 1,
    backgroundColor: C.orange,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },

  modalSendText: {
    fontSize: 13,
    fontWeight: "900",
    color: C.white,
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