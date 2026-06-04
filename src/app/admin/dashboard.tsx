import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { useAuthStore } from "@/store/auth.store";
import { router } from "expo-router";
import {
  AlertTriangle,
  ArrowLeftRight,
  Award,
  BadgeCheck,
  BarChart3,
  BellRing,
  BookOpenCheck,
  Building2,
  Calendar,
  CalendarCheck,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Link2,
  ListChecks,
  LogOut,
  MapPin,
  MapPinOff,
  Megaphone,
  PieChart,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Target,
  Ticket,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserCheck,
  UserCog,
  UserPlus,
  UsersRound,
  WalletCards,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
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
};

type Tone = "orange" | "blue" | "brown" | "green" | "red" | "gold" | "gray";

type SectionTheme =
  | "command"
  | "people"
  | "attendance"
  | "performance"
  | "learning"
  | "operations"
  | "communication"
  | "reports";

type DashboardAlert = {
  severity: "critical" | "warning" | "info";
  module: string;
  title: string;
  description?: string;
  cta?: string;
};

type StorePerformance = {
  store_code: string;
  store_name: string;
  city?: string;
  manager_name?: string;
  staff_count?: number;
  attendance_percentage?: number;
  target_percentage?: number;
  lms_percentage?: number;
  checklist_percentage?: number;
  risk_badge?: string;
  target_label?: string;
  achieved_label?: string;
};

type MiniTrendPoint = {
  label: string;
  target?: number;
  achievement?: number;
  present?: number;
  absent?: number;
  leads?: number;
  converted?: number;
  value?: number;
};

type AdminCommandCenterData = {
  overview: {
    total_stores: number;
    active_stores: number;
    inactive_stores: number;
    total_staff: number;
    active_staff: number;
    unmapped_staff: number;
    total_managers: number;
    mapped_managers: number;
    stores_without_manager: number;
  };
  attendance: {
    attendance_percentage: number;
    present: number;
    absent: number;
    late_checkins: number;
    outside_geofence: number;
    weekly_off: number;
    on_leave: number;
    total_staff: number;
    managers_total?: number;
    managers_present?: number;
    managers_absent?: number;
    staff_total?: number;
    staff_present?: number;
    staff_absent?: number;
    pending_alert_replies?: number;
  };
  targets: {
    target_amount: number;
    achieved_amount: number;
    shortfall_amount: number;
    achievement_percentage: number;
    target_achievers: number;
    low_performers: number;
    target_amount_label?: string;
    achieved_amount_label?: string;
    shortfall_amount_label?: string;
    top_store?: StorePerformance | null;
    lowest_store?: StorePerformance | null;
  };
  workforce: {
    total_employees: number;
    active_employees: number;
    inactive_employees: number;
    mapped_to_store: number;
    unmapped_to_store: number;
    mapped_to_manager: number;
    without_manager: number;
    role_assigned: number;
    role_missing: number;
    weekly_off_assigned: number;
    weekly_off_missing: number;
  };
  lms: {
    total_courses: number;
    published_courses: number;
    draft_courses: number;
    attempts: number;
    pass_rate: number;
    failed_attempts: number;
    pending_staff: number;
    pending_course_reviews?: number;
    certificates_issued: number;
    certificates_delta?: number;
  };
  incentives: {
    total_payable: number;
    approved_amount: number;
    pending_amount: number;
    paid_amount: number;
    payout_requests: number;
    dream_goal_amount: number;
    top_earning_store?: string;
    top_earning_staff?: string;
  };
  conversions: {
    stores_tracked: number;
    total_leads: number;
    meta_leads: number;
    converted_leads: number;
    pending_leads: number;
    lost_leads: number;
    avg_conversion_percentage: number;
    converted_revenue: number;
    best_store?: string;
    weak_store?: string;
    best_category?: string;
    weak_category?: string;
  };
  checklists: {
    assigned_today: number;
    completed: number;
    pending: number;
    completion_rate: number;
    issues_found: number;
    pending_review: number;
  };
  documents: {
    notices_published: number;
    notices_pending_ack: number;
    certificates_issued: number;
    gold_badges: number;
    silver_badges: number;
    bronze_badges: number;
  };
  insights: {
    anomalies_count: number;
    ai_suggestions_count: number;
    reports_generated_this_month: number;
    top_growing_store?: string;
    needs_attention_store?: string;
  };
  store_performance: {
    top_stores: StorePerformance[];
    risk_stores: StorePerformance[];
  };
  charts: {
    sales_vs_target: MiniTrendPoint[];
    department_performance: MiniTrendPoint[];
    store_wise_achievement: MiniTrendPoint[];
    attendance_trend: MiniTrendPoint[];
    leads_vs_conversion: MiniTrendPoint[];
    zone_mix: MiniTrendPoint[];
  };
  alerts: {
    critical: DashboardAlert[];
    warnings: DashboardAlert[];
    critical_count: number;
    warning_count: number;
    total_count: number;
  };
};

const EMPTY_DASHBOARD: AdminCommandCenterData = {
  overview: {
    total_stores: 0,
    active_stores: 0,
    inactive_stores: 0,
    total_staff: 0,
    active_staff: 0,
    unmapped_staff: 0,
    total_managers: 0,
    mapped_managers: 0,
    stores_without_manager: 0,
  },
  attendance: {
    attendance_percentage: 0, present: 0, absent: 0,
    late_checkins: 0, outside_geofence: 0, weekly_off: 0, on_leave: 0,
    total_staff: 0, managers_total: 0, managers_present: 0, managers_absent: 0,
    staff_total: 0, staff_present: 0, staff_absent: 0, pending_alert_replies: 0,
  },
  targets: {
    target_amount: 0, achieved_amount: 0, shortfall_amount: 0,
    achievement_percentage: 0, target_achievers: 0, low_performers: 0,
    target_amount_label: "₹0", achieved_amount_label: "₹0", shortfall_amount_label: "₹0",
    top_store: null, lowest_store: null,
  },
  workforce: {
    total_employees: 0, active_employees: 0, inactive_employees: 0,
    mapped_to_store: 0, unmapped_to_store: 0,
    mapped_to_manager: 0, without_manager: 0,
    role_assigned: 0, role_missing: 0,
    weekly_off_assigned: 0, weekly_off_missing: 0,
  },
  lms: {
    total_courses: 0, published_courses: 0, draft_courses: 0,
    attempts: 0, pass_rate: 0, failed_attempts: 0,
    pending_staff: 0, pending_course_reviews: 0,
    certificates_issued: 0, certificates_delta: 0,
  },
  incentives: {
    total_payable: 0, approved_amount: 0, pending_amount: 0, paid_amount: 0,
    payout_requests: 0, dream_goal_amount: 0,
    top_earning_store: "—", top_earning_staff: "—",
  },
  conversions: {
    stores_tracked: 0, total_leads: 0, meta_leads: 0, converted_leads: 0,
    pending_leads: 0, lost_leads: 0, avg_conversion_percentage: 0,
    converted_revenue: 0, best_store: "—", weak_store: "—",
    best_category: "—", weak_category: "—",
  },
  checklists: {
    assigned_today: 0, completed: 0, pending: 0,
    completion_rate: 0, issues_found: 0, pending_review: 0,
  },
  documents: {
    notices_published: 0, notices_pending_ack: 0,
    certificates_issued: 0, gold_badges: 0, silver_badges: 0, bronze_badges: 0,
  },
  insights: {
    anomalies_count: 0, ai_suggestions_count: 0,
    reports_generated_this_month: 0,
    top_growing_store: "—", needs_attention_store: "—",
  },
  store_performance: { top_stores: [], risk_stores: [] },
  charts: {
    sales_vs_target: [], department_performance: [],
    store_wise_achievement: [], attendance_trend: [],
    leads_vs_conversion: [], zone_mix: [],
  },
  alerts: { critical_count: 0, warning_count: 0, total_count: 0, critical: [], warnings: [] },
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

function getTone(tone: Tone) {
  switch (tone) {
    case "orange":
      return { bg: "#FFF1E5", text: "#C95F18", border: "#FED7AA" };
    case "blue":
      return { bg: "#EAF2FB", text: "#102B45", border: "#C9DBEF" };
    case "brown":
      return { bg: "#F4E7D8", text: "#6B3F20", border: "#E6CDB3" };
    case "green":
      return { bg: "#DCFCE7", text: "#166534", border: "#BBF7D0" };
    case "red":
      return { bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA" };
    case "gold":
      return { bg: "#FFF4D8", text: "#B7791F", border: "#F5D28A" };
    case "gray":
    default:
      return { bg: "#F3F4F6", text: "#4B5563", border: "#E5E7EB" };
  }
}

function getSectionTheme(theme: SectionTheme) {
  switch (theme) {
    case "command":
      return { bg: "#FEFCE8", border: "#FDE68A", iconBg: "#FEF3C7" };
    case "people":
      return { bg: "#EFF6FF", border: "#BFDBFE", iconBg: "#DBEAFE" };
    case "attendance":
      return { bg: "#FFF7ED", border: "#FED7AA", iconBg: "#FFEDD5" };
    case "performance":
      return { bg: "#F0FDF4", border: "#BBF7D0", iconBg: "#DCFCE7" };
    case "learning":
      return { bg: "#EEF6FF", border: "#C9DBEF", iconBg: "#DBEAFE" };
    case "operations":
      return { bg: "#FDF2F8", border: "#FBCFE8", iconBg: "#FCE7F3" };
    case "communication":
      return { bg: "#FEFCE8", border: "#FDE68A", iconBg: "#FEF3C7" };
    case "reports":
    default:
      return { bg: "#F8FAFC", border: "#CBD5E1", iconBg: "#EAF2FB" };
  }
}

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "₹0";
  }

  if (Number(value) >= 10000000) {
    return `₹${(Number(value) / 10000000).toFixed(1)} Cr`;
  }

  if (Number(value) >= 100000) {
    return `₹${(Number(value) / 100000).toFixed(1)} L`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "0%";
  }

  return `${Number(value).toFixed(0)}%`;
}

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";

  return "Good Evening";
}

async function getAdminCommandCenter(token?: string): Promise<AdminCommandCenterData> {
  if (!token) {
    return new Promise((resolve) => setTimeout(() => resolve(EMPTY_DASHBOARD), 400));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/command-center`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return EMPTY_DASHBOARD;

    const json = await response.json();
    const raw = json?.data ?? json;

    if (!raw?.overview) return EMPTY_DASHBOARD;

    return {
      ...EMPTY_DASHBOARD,
      ...raw,
      overview: { ...EMPTY_DASHBOARD.overview, ...(raw.overview || {}) },
      attendance: { ...EMPTY_DASHBOARD.attendance, ...(raw.attendance || {}) },
      targets: { ...EMPTY_DASHBOARD.targets, ...(raw.targets || {}) },
      workforce: { ...EMPTY_DASHBOARD.workforce, ...(raw.workforce || {}) },
      lms: { ...EMPTY_DASHBOARD.lms, ...(raw.lms || {}) },
      incentives: { ...EMPTY_DASHBOARD.incentives, ...(raw.incentives || {}) },
      conversions: { ...EMPTY_DASHBOARD.conversions, ...(raw.conversions || {}) },
      checklists: { ...EMPTY_DASHBOARD.checklists, ...(raw.checklists || {}) },
      documents: { ...EMPTY_DASHBOARD.documents, ...(raw.documents || {}) },
      insights: { ...EMPTY_DASHBOARD.insights, ...(raw.insights || {}) },
      store_performance: {
        ...EMPTY_DASHBOARD.store_performance,
        ...(raw.store_performance || {}),
      },
      charts: { ...EMPTY_DASHBOARD.charts, ...(raw.charts || {}) },
      alerts: { ...EMPTY_DASHBOARD.alerts, ...(raw.alerts || {}) },
    };
  } catch {
    return EMPTY_DASHBOARD;
  }
}

type SmallCardProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: Tone;
  route: string;
  badge?: number;
};

function SmallCard({ title, subtitle, icon, tone, route, badge }: SmallCardProps) {
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

function SectionBox({
  title,
  subtitle,
  icon,
  theme,
  children,
  ctaRoute,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  theme: SectionTheme;
  children: React.ReactNode;
  ctaRoute?: string;
}) {
  const t = getSectionTheme(theme);

  return (
    <View style={[styles.sectionBox, { backgroundColor: t.bg, borderColor: t.border }]}>
      <TouchableOpacity
        style={styles.sectionHead}
        activeOpacity={ctaRoute ? 0.85 : 1}
        onPress={ctaRoute ? () => router.push(ctaRoute as any) : undefined}
      >
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
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>

        {ctaRoute ? (
          <View style={styles.sectionCTA}>
            <Text style={styles.sectionCTAText}>View All</Text>
            <ChevronRight size={13} color={C.muted} />
          </View>
        ) : null}
      </TouchableOpacity>

      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function KpiTile({
  label,
  value,
  sub,
  tone,
  icon,
  route,
}: {
  label: string;
  value: string | number;
  sub: string;
  tone: Tone;
  icon: React.ReactNode;
  route: string;
}) {
  const t = getTone(tone);

  return (
    <TouchableOpacity
      style={[styles.kpiTile, { borderColor: t.border }]}
      activeOpacity={0.86}
      onPress={() => router.push(route as any)}
    >
      <View style={[styles.kpiIcon, { backgroundColor: t.bg }]}>{icon}</View>
      <Text style={styles.kpiLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.kpiValue, { color: t.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.kpiSub} numberOfLines={2}>
        {sub}
      </Text>
    </TouchableOpacity>
  );
}

function MetricPill({
  label,
  value,
  tone,
  route,
}: {
  label: string;
  value: string | number;
  tone: Tone;
  route?: string;
}) {
  const t = getTone(tone);
  const content = (
    <>
      <Text style={[styles.metricPillValue, { color: t.text }]}>{value}</Text>
      <Text style={styles.metricPillLabel}>{label}</Text>
    </>
  );

  if (route) {
    return (
      <TouchableOpacity
        style={[styles.metricPill, { backgroundColor: t.bg, borderColor: t.border }]}
        activeOpacity={0.82}
        onPress={() => router.push(route as any)}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.metricPill, { backgroundColor: t.bg, borderColor: t.border }]}>
      {content}
    </View>
  );
}

function MiniBarChart({
  title,
  data,
  firstKey,
  secondKey,
  firstLabel,
  secondLabel,
  firstColor,
  secondColor,
}: {
  title: string;
  data: MiniTrendPoint[];
  firstKey: keyof MiniTrendPoint;
  secondKey?: keyof MiniTrendPoint;
  firstLabel: string;
  secondLabel?: string;
  firstColor: string;
  secondColor?: string;
}) {
  const safeData = Array.isArray(data) ? data : [];
  const max = Math.max(
    1,
    ...safeData.map((item) =>
      Math.max(Number(item[firstKey] || 0), secondKey ? Number(item[secondKey] || 0) : 0)
    )
  );

  return (
    <View style={styles.chartBox}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: firstColor }]} />
          <Text style={styles.legendText}>{firstLabel}</Text>

          {secondKey && secondLabel ? (
            <>
              <View style={[styles.legendDot, { backgroundColor: secondColor || C.gold }]} />
              <Text style={styles.legendText}>{secondLabel}</Text>
            </>
          ) : null}
        </View>
      </View>

      <View style={styles.miniBarWrap}>
        {safeData.slice(-7).map((item) => {
          const v1 = Number(item[firstKey] || 0);
          const v2 = secondKey ? Number(item[secondKey] || 0) : 0;

          return (
            <View key={item.label} style={styles.barColumn}>
              <View style={styles.barPair}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(8, (v1 / max) * 76),
                      backgroundColor: firstColor,
                    },
                  ]}
                />
                {secondKey ? (
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(8, (v2 / max) * 76),
                        backgroundColor: secondColor || C.gold,
                      },
                    ]}
                  />
                ) : null}
              </View>

              <Text style={styles.barLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ShareListChart({
  title,
  data,
  route,
}: {
  title: string;
  data: MiniTrendPoint[];
  route: string;
}) {
  const safeData = Array.isArray(data) ? data : [];
  const total = Math.max(1, safeData.reduce((sum, item) => sum + Number(item.value || 0), 0));

  return (
    <TouchableOpacity
      style={styles.chartBox}
      activeOpacity={0.85}
      onPress={() => router.push(route as any)}
    >
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{title}</Text>
        <ChevronRight size={16} color={C.muted} />
      </View>

      <View style={styles.shareList}>
        {safeData.map((item, index) => {
          const pct = Math.round((Number(item.value || 0) / total) * 100);
          const colors = [C.navy, C.orange, C.gold, C.green, C.brown, C.red];
          const color = colors[index % colors.length];

          return (
            <View key={item.label} style={styles.shareRow}>
              <View style={styles.shareTop}>
                <Text style={styles.shareLabel}>{item.label}</Text>
                <Text style={styles.shareValue}>{pct}%</Text>
              </View>
              <View style={styles.shareTrack}>
                <View style={[styles.shareFill, { width: `${pct}%`, backgroundColor: color }]} />
              </View>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

function StoreRow({ store }: { store: StorePerformance }) {
  const riskTone: Tone =
    store.risk_badge === "Critical"
      ? "red"
      : store.risk_badge === "At Risk"
        ? "orange"
        : store.risk_badge === "Watch"
          ? "gold"
          : "green";

  const t = getTone(riskTone);

  return (
    <TouchableOpacity
      style={styles.storeRow}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: "/admin/stores/[storeCode]" as any,
          params: { storeCode: store.store_code },
        })
      }
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.storeRowTitle} numberOfLines={1}>
          {store.store_name}
        </Text>
        <Text style={styles.storeRowMeta} numberOfLines={1}>
          {store.city || "—"} · {store.store_code} · {store.manager_name || "No manager"}
        </Text>

        <View style={styles.storeMetricRow}>
          <Text style={styles.storeMetric}>Target {formatPercent(store.target_percentage)}</Text>
          <Text style={styles.storeMetric}>
            Attendance {formatPercent(store.attendance_percentage)}
          </Text>
        </View>
      </View>

      <View style={[styles.riskPill, { backgroundColor: t.bg, borderColor: t.border }]}>
        <Text style={[styles.riskPillText, { color: t.text }]}>
          {store.risk_badge || "Watch"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function AlertRow({ alert }: { alert: DashboardAlert }) {
  const isCritical = alert.severity === "critical";
  const tone = isCritical ? getTone("red") : getTone("gold");

  return (
    <TouchableOpacity
      style={[styles.alertRow, { backgroundColor: tone.bg, borderColor: tone.border }]}
      activeOpacity={0.85}
      onPress={() => router.push("/admin/alerts" as any)}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.alertModule, { color: tone.text }]}>
          {alert.module} · {alert.severity.toUpperCase()}
        </Text>
        <Text style={styles.alertTitle}>{alert.title}</Text>
        <Text style={styles.alertDescription} numberOfLines={2}>
          {alert.description || "Action required from admin."}
        </Text>
      </View>

      <ChevronRight size={16} color={tone.text} />
    </TouchableOpacity>
  );
}

function AdminHeader({
  adminName,
  dashboard,
  onLogout,
}: {
  adminName: string;
  dashboard: AdminCommandCenterData;
  onLogout: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerGlowOne} />
      <View style={styles.headerGlowTwo} />

      <View style={styles.headerTop}>
        <View style={styles.avatarBox}>
          <ShieldCheck size={26} color="#FFF8EF" />
          <View style={styles.avatarSpark}>
            <Sparkles size={11} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.headerText}>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.managerName} numberOfLines={1}>
            {adminName}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>ADMIN</Text>
            </View>

            <View style={styles.storeChip}>
              <LayoutDashboard size={10} color="#F6A15A" />
              <Text style={styles.storeChipText} numberOfLines={1}>
                All stores in view
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bellBtn}
          activeOpacity={0.84}
          onPress={() => router.push("/admin/notifications" as any)}
        >
          <BellRing size={19} color="#FFFFFF" />
          {dashboard.alerts.total_count ? <View style={styles.notifDot} /> : null}
        </TouchableOpacity>
      </View>

      <View style={styles.headerStats}>
        <TouchableOpacity
          style={styles.headerStat}
          activeOpacity={0.82}
          onPress={() => router.push("/admin/stores" as any)}
        >
          <Text style={styles.headerStatValue}>{dashboard.overview.total_stores}</Text>
          <Text style={styles.headerStatLabel}>Stores</Text>
        </TouchableOpacity>

        <View style={styles.headerDivider} />

        <TouchableOpacity
          style={styles.headerStat}
          activeOpacity={0.82}
          onPress={() => router.push("/admin/attendance" as any)}
        >
          <Text style={styles.headerStatValue}>{dashboard.attendance.attendance_percentage}%</Text>
          <Text style={styles.headerStatLabel}>Attendance</Text>
        </TouchableOpacity>

        <View style={styles.headerDivider} />

        <TouchableOpacity
          style={styles.headerStat}
          activeOpacity={0.82}
          onPress={() => router.push("/admin/targets" as any)}
        >
          <Text style={styles.headerStatValue}>{dashboard.targets.achievement_percentage}%</Text>
          <Text style={styles.headerStatLabel}>Target</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.approvalBanner}
        activeOpacity={0.88}
        onPress={() => router.push("/admin/alerts" as any)}
      >
        <View
          style={[
            styles.approvalBannerIcon,
            {
              backgroundColor:
                dashboard.alerts.critical_count > 0 ? "#FEE2E2" : "#DCFCE7",
            },
          ]}
        >
          {dashboard.alerts.critical_count > 0 ? (
            <AlertTriangle size={18} color={C.red} />
          ) : (
            <ShieldCheck size={18} color={C.green} />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.approvalBannerTitle}>
            {dashboard.alerts.total_count > 0
              ? `${dashboard.alerts.total_count} admin alerts`
              : "No critical alerts"}
          </Text>
          <Text style={styles.approvalBannerSub} numberOfLines={1}>
            {dashboard.alerts.total_count > 0
              ? "Review workforce, store, target and attendance issues"
              : "All command center alerts are clear"}
          </Text>
        </View>

        <View style={styles.reviewPill}>
          <Text style={styles.reviewPillText}>
            {dashboard.alerts.total_count > 0 ? "Review" : "View"}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutHeaderBtn} onPress={onLogout} activeOpacity={0.85}>
        <LogOut size={13} color="rgba(255,255,255,0.8)" />
        <Text style={styles.logoutHeaderText}>Secure Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const auth = useAuthStore() as any;

  const user = auth.user;
  const logout = auth.logout;
  const accessToken = auth.access_token || auth.accessToken || auth.token || "";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [dashboard, setDashboard] = useState<AdminCommandCenterData>(EMPTY_DASHBOARD);

  const adminName = user?.full_name || user?.name || "HomeTown Admin";

  const criticalAlerts = dashboard.alerts.critical || [];
  const warningAlerts = dashboard.alerts.warnings || [];

  const targetTone: Tone = useMemo(() => {
    const pct = dashboard.targets.achievement_percentage || 0;
    if (pct >= 75) return "green";
    if (pct >= 50) return "orange";
    return "red";
  }, [dashboard.targets.achievement_percentage]);

  const loadDashboard = useCallback(async () => {
    try {
      setDashboardError("");
      const data = await getAdminCommandCenter(accessToken);
      setDashboard(data);
    } catch (error) {
      console.log("Admin dashboard load error:", error);
      setDashboardError(
        error instanceof Error ? error.message : "Unable to load admin dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
  }, [loadDashboard]);

  function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout from ON TRACK?", [
      { text: "Cancel", style: "cancel" },
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
          <AdminHeader adminName={adminName} dashboard={dashboard} onLogout={handleLogout} />

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={C.orange} size="large" />
              <Text style={styles.loadingText}>Loading admin dashboard...</Text>
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

          <View style={styles.commandTitleBlock}>
            <Text style={styles.commandEyebrow}>COMMAND CENTER</Text>
            <Text style={styles.commandTitle}>HomeTown Store Operations Overview</Text>
            <Text style={styles.commandSub}>
              Mobile summary of attendance, targets, incentives, conversions, courses,
              certificates, notices, reports and alerts.
            </Text>
          </View>

          <View style={styles.kpiGrid}>
            <KpiTile
              label="Total Stores"
              value={dashboard.overview.total_stores}
              sub={`${dashboard.overview.active_stores} active stores`}
              tone="blue"
              icon={<Store size={19} color={C.navy} />}
              route="/admin/stores"
            />
            <KpiTile
              label="Employees"
              value={dashboard.overview.total_staff}
              sub={`${dashboard.overview.total_managers} managers`}
              tone="gold"
              icon={<UsersRound size={19} color={C.gold} />}
              route="/admin/teams"
            />
            <KpiTile
              label="Present Today"
              value={dashboard.attendance.present}
              sub={`${dashboard.attendance.absent} absent · ${dashboard.attendance.weekly_off} weekly off`}
              tone="green"
              icon={<CalendarCheck size={19} color={C.green} />}
              route="/admin/attendance"
            />
            <KpiTile
              label="Absent Today"
              value={dashboard.attendance.absent}
              sub={`${dashboard.attendance.late_checkins} late check-ins`}
              tone="red"
              icon={<AlertTriangle size={19} color={C.red} />}
              route="/admin/attendance"
            />
            <KpiTile
              label="Monthly Target"
              value={dashboard.targets.target_amount_label || formatCurrency(dashboard.targets.target_amount)}
              sub="All stores target"
              tone="blue"
              icon={<Target size={19} color={C.navy} />}
              route="/admin/targets"
            />
            <KpiTile
              label="Achievement"
              value={formatPercent(dashboard.targets.achievement_percentage)}
              sub={dashboard.targets.achieved_amount_label || formatCurrency(dashboard.targets.achieved_amount)}
              tone={targetTone}
              icon={<TrendingUp size={19} color={getTone(targetTone).text} />}
              route="/admin/targets"
            />
            <KpiTile
              label="Shortfall"
              value={dashboard.targets.shortfall_amount_label || formatCurrency(dashboard.targets.shortfall_amount)}
              sub="Remaining target gap"
              tone="red"
              icon={<TrendingDown size={19} color={C.red} />}
              route="/admin/targets/shortfall"
            />
            <KpiTile
              label="Course Reviews"
              value={dashboard.lms.pending_course_reviews || 0}
              sub={`${dashboard.lms.pending_staff} pending learners`}
              tone="gold"
              icon={<BookOpenCheck size={19} color={C.gold} />}
              route="/admin/courses/pending-learners"
            />
            <KpiTile
              label="Certificates"
              value={dashboard.lms.certificates_issued}
              sub={`+${dashboard.lms.certificates_delta || 0} recently`}
              tone="green"
              icon={<Award size={19} color={C.green} />}
              route="/admin/certificates"
            />
            <KpiTile
              label="Incentives"
              value={formatCurrency(dashboard.incentives.total_payable)}
              sub={`${dashboard.incentives.payout_requests} payout requests`}
              tone="gold"
              icon={<WalletCards size={19} color={C.gold} />}
              route="/admin/incentives"
            />
            <KpiTile
              label="Risk Stores"
              value={dashboard.store_performance.risk_stores.length}
              sub="Needs HO attention"
              tone="red"
              icon={<AlertTriangle size={19} color={C.red} />}
              route="/admin/risk-stores"
            />
            <KpiTile
              label="Meta Leads"
              value={dashboard.conversions.meta_leads}
              sub={`${dashboard.conversions.converted_leads} converted`}
              tone="orange"
              icon={<BarChart3 size={19} color={C.orange} />}
              route="/admin/store-conversions"
            />
          </View>

          <SectionBox
            icon={<BarChart3 size={15} color={C.navy} />}
            title="Mobile Insights Snapshot"
            subtitle="Compact chart summaries from the web command center"
            theme="reports"
            ctaRoute="/admin/insights"
          >
            <MiniBarChart
              title="Sales vs Target"
              data={dashboard.charts.sales_vs_target}
              firstKey="target"
              secondKey="achievement"
              firstLabel="Target"
              secondLabel="Achieved"
              firstColor={C.navy}
              secondColor={C.orange}
            />
            <MiniBarChart
              title="Attendance Trend"
              data={dashboard.charts.attendance_trend}
              firstKey="present"
              secondKey="absent"
              firstLabel="Present"
              secondLabel="Absent"
              firstColor={C.green}
              secondColor={C.red}
            />
            <MiniBarChart
              title="Leads vs Conversion"
              data={dashboard.charts.leads_vs_conversion}
              firstKey="leads"
              secondKey="converted"
              firstLabel="Leads"
              secondLabel="Converted"
              firstColor={C.navy}
              secondColor={C.gold}
            />
            <ShareListChart
              title="Department Performance"
              data={dashboard.charts.department_performance}
              route="/admin/insights"
            />
            <ShareListChart title="Zone Mix" data={dashboard.charts.zone_mix} route="/admin/zone-view" />
          </SectionBox>

          <SectionBox
            icon={<Store size={15} color={C.navy} />}
            title="Store Command"
            subtitle="Store master, geofence, conversions, ranking and risk"
            theme="command"
            ctaRoute="/admin/stores"
          >
            <View style={styles.cardGrid}>
              <SmallCard title="All Stores" subtitle={`${dashboard.overview.active_stores} active`} icon={<Store size={22} color={C.navy} />} tone="blue" route="/admin/stores" />
              <SmallCard title="Store Geofence" subtitle="Location boundaries" icon={<MapPin size={22} color={C.orange} />} tone="orange" route="/admin/store-geofence" />
              <SmallCard title="No Manager" subtitle={`${dashboard.overview.stores_without_manager} stores`} icon={<AlertTriangle size={22} color={C.red} />} tone="red" route="/admin/stores-without-manager" badge={dashboard.overview.stores_without_manager} />
              <SmallCard title="Zone View" subtitle="Region-wise breakdown" icon={<PieChart size={22} color={C.brown} />} tone="brown" route="/admin/zone-view" />
              <SmallCard title="Store Conversions" subtitle={`${dashboard.conversions.avg_conversion_percentage}% avg conversion`} icon={<Trophy size={22} color={C.gold} />} tone="gold" route="/admin/store-conversions" />
              <SmallCard title="Risk Stores" subtitle={`${dashboard.store_performance.risk_stores.length} need review`} icon={<TrendingDown size={22} color={C.red} />} tone="red" route="/admin/risk-stores" badge={dashboard.store_performance.risk_stores.length} />
            </View>
          </SectionBox>

          <SectionBox
            icon={<UsersRound size={15} color={C.navy} />}
            title="Teams & Workforce"
            subtitle="Managers, employees, mapping, roles and transfers"
            theme="people"
            ctaRoute="/admin/teams"
          >
            <View style={styles.cardGrid}>
              <SmallCard title="All Employees" subtitle={`${dashboard.overview.total_staff} total`} icon={<UsersRound size={22} color={C.navy} />} tone="blue" route="/admin/employees" />
              <SmallCard title="Create Employee" subtitle="Add staff/manager" icon={<UserPlus size={22} color={C.green} />} tone="green" route="/admin/employees/create" />
              <SmallCard title="Employee Profile" subtitle="Edit details" icon={<UserCheck size={22} color={C.brown} />} tone="brown" route="/admin/employees" />
              <SmallCard title="Role Assignment" subtitle={`${dashboard.workforce.role_missing} missing`} icon={<ShieldCheck size={22} color={C.orange} />} tone="orange" route="/admin/role-assignment" badge={dashboard.workforce.role_missing} />
              <SmallCard title="Dept Assignment" subtitle="Department mapping" icon={<Building2 size={22} color={C.gold} />} tone="gold" route="/admin/department-assignment" />
              <SmallCard title="Weekly Off" subtitle={`${dashboard.workforce.weekly_off_missing} missing`} icon={<Calendar size={22} color={C.red} />} tone="red" route="/admin/weekly-off-missing" badge={dashboard.workforce.weekly_off_missing} />
              <SmallCard title="Employee Transfer" subtitle="Move stores" icon={<ArrowLeftRight size={22} color={C.brown} />} tone="brown" route="/admin/employee-transfer" />
              <SmallCard title="Manager Mapping" subtitle={`${dashboard.overview.mapped_managers} mapped`} icon={<Link2 size={22} color={C.navy} />} tone="blue" route="/admin/manager-mapping" />
            </View>
          </SectionBox>

          <SectionBox
            icon={<CalendarCheck size={15} color={C.orange} />}
            title="Live Attendance"
            subtitle="Real-time manager & staff presence, geofence and alerts"
            theme="attendance"
            ctaRoute="/admin/attendance"
          >
            <View style={styles.metricGrid}>
              <MetricPill label="Mgr Present" value={dashboard.attendance.managers_present ?? 0} tone="green" route="/admin/attendance" />
              <MetricPill label="Mgr Absent" value={dashboard.attendance.managers_absent ?? 0} tone="red" route="/admin/attendance" />
              <MetricPill label="Staff Present" value={dashboard.attendance.staff_present ?? dashboard.attendance.present} tone="green" route="/admin/attendance" />
              <MetricPill label="Staff Absent" value={dashboard.attendance.staff_absent ?? dashboard.attendance.absent} tone="red" route="/admin/attendance" />
              <MetricPill label="Outside GF" value={dashboard.attendance.outside_geofence} tone="orange" route="/admin/attendance/outside-geofence" />
              <MetricPill label="Pending Replies" value={dashboard.attendance.pending_alert_replies ?? 0} tone="gold" route="/admin/attendance" />
            </View>

            <View style={styles.cardGrid}>
              <SmallCard title="Today Attendance" subtitle={`${dashboard.attendance.attendance_percentage}% present`} icon={<CalendarCheck size={22} color={C.orange} />} tone="orange" route="/admin/attendance" />
              <SmallCard title="Outside Geofence" subtitle={`${dashboard.attendance.outside_geofence} flagged`} icon={<MapPinOff size={22} color={C.red} />} tone="red" route="/admin/attendance/outside-geofence" badge={dashboard.attendance.outside_geofence} />
              <SmallCard title="Monthly Report" subtitle="Month-wise view" icon={<Calendar size={22} color={C.brown} />} tone="brown" route="/admin/attendance/monthly" />
              <SmallCard title="Absent Staff" subtitle={`${dashboard.attendance.absent} absent today`} icon={<AlertTriangle size={22} color={C.red} />} tone="red" route="/admin/attendance/absent-staff" badge={dashboard.attendance.absent} />
            </View>
          </SectionBox>

          <SectionBox
            icon={<Target size={15} color={C.green} />}
            title="Targets & Incentives"
            subtitle="Targets, shortfall, incentives, payout and dream goals"
            theme="performance"
            ctaRoute="/admin/targets"
          >
            <View style={styles.targetSummary}>
              <TouchableOpacity onPress={() => router.push("/admin/targets/stores" as any)} activeOpacity={0.82}>
                <Text style={styles.targetLabel}>Monthly Target</Text>
                <Text style={styles.targetValue}>
                  {dashboard.targets.target_amount_label || formatCurrency(dashboard.targets.target_amount)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push("/admin/targets/achievers" as any)} activeOpacity={0.82}>
                <Text style={styles.targetLabel}>Achieved</Text>
                <Text style={[styles.targetValue, { color: C.green }]}>
                  {dashboard.targets.achieved_amount_label || formatCurrency(dashboard.targets.achieved_amount)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push("/admin/targets/shortfall" as any)} activeOpacity={0.82}>
                <Text style={styles.targetLabel}>Shortfall</Text>
                <Text style={[styles.targetValue, { color: C.red }]}>
                  {dashboard.targets.shortfall_amount_label || formatCurrency(dashboard.targets.shortfall_amount)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cardGrid}>
              <SmallCard title="Store Targets" subtitle="Store-wise target" icon={<Store size={22} color={C.green} />} tone="green" route="/admin/targets/stores" />
              <SmallCard title="Staff Targets" subtitle="Individual target" icon={<Target size={22} color={C.navy} />} tone="blue" route="/admin/targets/employees" />
              <SmallCard title="Manager Targets" subtitle="Manager KPI" icon={<UserCog size={22} color={C.brown} />} tone="brown" route="/admin/targets/managers" />
              <SmallCard title="Shortfall" subtitle={`${dashboard.targets.low_performers} low performers`} icon={<TrendingDown size={22} color={C.red} />} tone="red" route="/admin/targets/shortfall" badge={dashboard.targets.low_performers} />
              <SmallCard title="Incentives" subtitle={formatCurrency(dashboard.incentives.total_payable)} icon={<WalletCards size={22} color={C.gold} />} tone="gold" route="/admin/incentives" />
              <SmallCard title="Payout Requests" subtitle={`${dashboard.incentives.payout_requests} pending`} icon={<BadgeCheck size={22} color={C.orange} />} tone="orange" route="/admin/incentives/payout-requests" badge={dashboard.incentives.payout_requests} />
              <SmallCard title="Dream Goals" subtitle={formatCurrency(dashboard.incentives.dream_goal_amount)} icon={<Star size={22} color={C.gold} />} tone="gold" route="/admin/dream-goals" />
            </View>
          </SectionBox>

          <SectionBox
            icon={<BarChart3 size={15} color={C.navy} />}
            title="Store Conversions"
            subtitle="Meta leads, categories, campaign conversion and store funnel"
            theme="command"
            ctaRoute="/admin/store-conversions"
          >
            <View style={styles.metricGrid}>
              <MetricPill label="Total Leads" value={dashboard.conversions.total_leads} tone="blue" route="/admin/store-conversions" />
              <MetricPill label="Meta Leads" value={dashboard.conversions.meta_leads} tone="orange" route="/admin/store-conversions" />
              <MetricPill label="Converted" value={dashboard.conversions.converted_leads} tone="green" route="/admin/store-conversions" />
              <MetricPill label="Lost" value={dashboard.conversions.lost_leads} tone="red" route="/admin/store-conversions" />
              <MetricPill label="Conv %" value={`${dashboard.conversions.avg_conversion_percentage}%`} tone="gold" route="/admin/store-conversions" />
              <MetricPill label="Revenue" value={formatCurrency(dashboard.conversions.converted_revenue)} tone="brown" route="/admin/store-conversions" />
            </View>
          </SectionBox>

          <SectionBox
            icon={<BookOpenCheck size={15} color={C.navy} />}
            title="Learning & LMS"
            subtitle="Courses, quiz, attempts, skill matrix, certificates"
            theme="learning"
            ctaRoute="/admin/courses"
          >
            <View style={styles.metricGrid}>
              <MetricPill label="Courses" value={dashboard.lms.total_courses} tone="blue" route="/admin/courses" />
              <MetricPill label="Published" value={dashboard.lms.published_courses} tone="green" route="/admin/courses" />
              <MetricPill label="Pass Rate" value={`${dashboard.lms.pass_rate}%`} tone="gold" route="/admin/courses/analytics" />
              <MetricPill label="Pending Staff" value={dashboard.lms.pending_staff} tone="red" route="/admin/courses/pending-learners" />
            </View>

            <View style={styles.cardGrid}>
              <SmallCard title="Course Builder" subtitle="Create & publish" icon={<BookOpenCheck size={22} color={C.navy} />} tone="blue" route="/admin/courses/builder" />
              <SmallCard title="Quiz Builder" subtitle="Inside courses" icon={<ClipboardCheck size={22} color={C.brown} />} tone="brown" route="/admin/quizzes/builder" />
              <SmallCard title="Attempts" subtitle={`${dashboard.lms.attempts} total`} icon={<BookOpenCheck size={22} color={C.gold} />} tone="gold" route="/admin/courses/attempts" />
              <SmallCard title="Pending Learners" subtitle={`${dashboard.lms.pending_staff} pending`} icon={<GraduationCap size={22} color={C.orange} />} tone="orange" route="/admin/courses/pending-learners" badge={dashboard.lms.pending_staff} />
              <SmallCard title="Failed Attempts" subtitle={`${dashboard.lms.failed_attempts} failed`} icon={<AlertTriangle size={22} color={C.red} />} tone="red" route="/admin/courses/failed-attempts" badge={dashboard.lms.failed_attempts} />
              <SmallCard title="Skill Matrix" subtitle="Role-wise skills" icon={<Zap size={22} color={C.gold} />} tone="gold" route="/admin/skill-matrix" />
              <SmallCard title="Certificates" subtitle={`${dashboard.lms.certificates_issued} issued`} icon={<Award size={22} color={C.green} />} tone="green" route="/admin/certificates" />
            </View>
          </SectionBox>

          <SectionBox
            icon={<ListChecks size={15} color={C.green} />}
            title="Operations & Checklists"
            subtitle="Templates, submissions, reviews, SOP and issues"
            theme="operations"
            ctaRoute="/admin/checklists"
          >
            <View style={styles.metricGrid}>
              <MetricPill label="Assigned" value={dashboard.checklists.assigned_today} tone="blue" route="/admin/checklists/submissions" />
              <MetricPill label="Completed" value={dashboard.checklists.completed} tone="green" route="/admin/checklists/submissions" />
              <MetricPill label="Pending" value={dashboard.checklists.pending} tone="orange" route="/admin/checklists/pending-reviews" />
              <MetricPill label="Issues" value={dashboard.checklists.issues_found} tone="red" route="/admin/checklists/issues" />
            </View>

            <View style={styles.cardGrid}>
              <SmallCard title="Templates" subtitle="Checklist library" icon={<ListChecks size={22} color={C.green} />} tone="green" route="/admin/checklists/templates" />
              <SmallCard title="Submissions" subtitle={`${dashboard.checklists.completion_rate}% done`} icon={<ClipboardCheck size={22} color={C.navy} />} tone="blue" route="/admin/checklists/submissions" />
              <SmallCard title="Pending Reviews" subtitle={`${dashboard.checklists.pending_review} to review`} icon={<BadgeCheck size={22} color={C.orange} />} tone="orange" route="/admin/checklists/pending-reviews" badge={dashboard.checklists.pending_review} />
              <SmallCard title="Tickets" subtitle="Store complaints" icon={<Ticket size={22} color={C.brown} />} tone="brown" route="/admin/tickets" />
            </View>
          </SectionBox>

          <SectionBox
            icon={<Megaphone size={15} color={C.gold} />}
            title="Communication, Notices & Certificates"
            subtitle="Notices, certificates, campaigns, policy updates and compliance"
            theme="communication"
            ctaRoute="/admin/notices"
          >
            <View style={styles.metricGrid}>
              <MetricPill label="Notices" value={dashboard.documents.notices_published} tone="blue" route="/admin/notices" />
              <MetricPill label="Pending Ack" value={dashboard.documents.notices_pending_ack} tone="orange" route="/admin/notices" />
              <MetricPill label="Certificates" value={dashboard.documents.certificates_issued} tone="green" route="/admin/certificates" />
              <MetricPill label="Gold Badges" value={dashboard.documents.gold_badges} tone="gold" route="/admin/certificates" />
            </View>

            <View style={styles.cardGrid}>
              <SmallCard title="Notice Builder" subtitle="Preview & PDF" icon={<ScrollText size={22} color={C.navy} />} tone="blue" route="/admin/notices" />
              <SmallCard title="Certificates" subtitle="Gold/Silver/Bronze" icon={<Award size={22} color={C.gold} />} tone="gold" route="/admin/certificates" />
              <SmallCard title="Campaign Updates" subtitle="Marketing broadcasts" icon={<Megaphone size={22} color={C.orange} />} tone="orange" route="/admin/updates/campaign" />
              <SmallCard title="Policy Updates" subtitle="HR & compliance" icon={<FileText size={22} color={C.navy} />} tone="blue" route="/admin/updates/policy" />
              <SmallCard title="Compliance Alert" subtitle="Urgent notices" icon={<ShieldCheck size={22} color={C.red} />} tone="red" route="/admin/updates/urgent-compliance" />
            </View>
          </SectionBox>

          <SectionBox
            icon={<PieChart size={15} color={C.navy} />}
            title="Reports & AI Insights"
            subtitle="Exports, anomalies, recommendations and report library"
            theme="reports"
            ctaRoute="/admin/reports"
          >
            <View style={styles.metricGrid}>
              <MetricPill label="Anomalies" value={dashboard.insights.anomalies_count} tone="red" route="/admin/insights" />
              <MetricPill label="AI Suggestions" value={dashboard.insights.ai_suggestions_count} tone="gold" route="/admin/insights" />
              <MetricPill label="Reports" value={dashboard.insights.reports_generated_this_month} tone="blue" route="/admin/reports" />
              <MetricPill label="Exports" value="Excel/PDF" tone="green" route="/admin/reports" />
            </View>

            <View style={styles.cardGrid}>
              <SmallCard title="Attendance Reports" subtitle="Daily & monthly" icon={<CalendarCheck size={22} color={C.orange} />} tone="orange" route="/admin/reports/attendance" />
              <SmallCard title="Target Reports" subtitle="Store & staff" icon={<Target size={22} color={C.green} />} tone="green" route="/admin/reports/targets" />
              <SmallCard title="Course Reports" subtitle="LMS results" icon={<BookOpenCheck size={22} color={C.navy} />} tone="blue" route="/admin/reports/courses" />
              <SmallCard title="Incentive Reports" subtitle="Payout history" icon={<WalletCards size={22} color={C.gold} />} tone="gold" route="/admin/reports/incentives" />
              <SmallCard title="Download History" subtitle="Past exports" icon={<Download size={22} color={C.muted} />} tone="gray" route="/admin/reports/download-history" />
              <SmallCard title="Audit Logs" subtitle="Admin actions" icon={<FileCheck size={22} color={C.navy} />} tone="blue" route="/admin/audit-logs" />
            </View>
          </SectionBox>

          <SectionBox
            icon={<Trophy size={15} color={C.gold} />}
            title="Store Performance Preview"
            subtitle="Top stores and risk stores"
            theme="performance"
            ctaRoute="/admin/store-conversions"
          >
            <Text style={styles.previewHeading}>Top Stores</Text>
            {dashboard.store_performance.top_stores.slice(0, 3).map((store) => (
              <StoreRow key={`top-${store.store_code}`} store={store} />
            ))}

            <Text style={styles.previewHeading}>Risk Stores</Text>
            {dashboard.store_performance.risk_stores.slice(0, 3).map((store) => (
              <StoreRow key={`risk-${store.store_code}`} store={store} />
            ))}
          </SectionBox>

          <SectionBox
            icon={<AlertTriangle size={15} color={C.red} />}
            title="Action Alerts"
            subtitle="Critical and warning items"
            theme="operations"
            ctaRoute="/admin/alerts"
          >
            {criticalAlerts.length === 0 && warningAlerts.length === 0 ? (
              <View style={styles.emptyAlert}>
                <ShieldCheck size={20} color={C.green} />
                <Text style={styles.emptyAlertText}>
                  No critical alerts found based on current backend data.
                </Text>
              </View>
            ) : (
              <>
                {criticalAlerts.map((item, index) => (
                  <AlertRow key={`critical-${index}`} alert={item} />
                ))}

                {warningAlerts.map((item, index) => (
                  <AlertRow key={`warning-${index}`} alert={item} />
                ))}
              </>
            )}
          </SectionBox>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <AdminBottomNav />
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
    paddingBottom: 100,
    gap: 12,
  },
  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
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
  logoutHeaderBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  logoutHeaderText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 10,
    fontWeight: "800",
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
  commandTitleBlock: {
    marginHorizontal: 16,
    backgroundColor: C.cream,
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EAD7C2",
  },
  commandEyebrow: {
    color: C.orange,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  commandTitle: {
    color: C.navy,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  commandSub: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
    marginTop: 5,
  },
  kpiGrid: {
    marginHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  kpiTile: {
    width: "48.5%",
    backgroundColor: C.cream,
    borderRadius: 20,
    padding: 11,
    borderWidth: 1,
    minHeight: 122,
    shadowColor: "#3A2314",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  kpiIcon: {
    width: 39,
    height: 39,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 10,
    color: C.muted,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: "900",
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 10,
    color: C.muted,
    fontWeight: "600",
    lineHeight: 14,
    marginTop: 3,
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
    color: C.navy,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
    color: C.muted,
  },
  sectionCTA: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: 6,
  },
  sectionCTAText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.muted,
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
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricPill: {
    width: "48.5%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
  },
  metricPillValue: {
    fontSize: 16,
    fontWeight: "900",
  },
  metricPillLabel: {
    marginTop: 2,
    color: C.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  targetSummary: {
    backgroundColor: C.cream,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EAD7C2",
    padding: 13,
    gap: 10,
  },
  targetLabel: {
    fontSize: 10,
    color: C.muted,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  targetValue: {
    fontSize: 18,
    color: C.navy,
    fontWeight: "900",
    marginTop: 2,
  },
  chartBox: {
    backgroundColor: C.cream,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EAD7C2",
    padding: 12,
    gap: 10,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
  },
  chartTitle: {
    color: C.navy,
    fontSize: 13,
    fontWeight: "900",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    color: C.muted,
    fontSize: 9,
    fontWeight: "700",
  },
  miniBarWrap: {
    height: 105,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 6,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  barPair: {
    height: 80,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 2,
  },
  bar: {
    width: 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barLabel: {
    color: C.muted,
    fontSize: 8,
    fontWeight: "700",
  },
  shareList: {
    gap: 8,
  },
  shareRow: {
    gap: 4,
  },
  shareTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  shareLabel: {
    color: C.navy,
    fontSize: 11,
    fontWeight: "800",
  },
  shareValue: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "800",
  },
  shareTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "#F1E4D6",
    overflow: "hidden",
  },
  shareFill: {
    height: 7,
    borderRadius: 999,
  },
  previewHeading: {
    fontSize: 12,
    fontWeight: "900",
    color: C.brown,
    marginTop: 3,
  },
  storeRow: {
    backgroundColor: C.cream,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EAD7C2",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  storeRowTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: C.navy,
  },
  storeRowMeta: {
    fontSize: 10.5,
    color: C.muted,
    marginTop: 3,
    fontWeight: "600",
  },
  storeMetricRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 5,
  },
  storeMetric: {
    fontSize: 10,
    color: C.brown,
    fontWeight: "800",
  },
  riskPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
  },
  riskPillText: {
    fontSize: 9,
    fontWeight: "900",
  },
  alertRow: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alertModule: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  alertTitle: {
    marginTop: 3,
    fontSize: 13,
    color: C.navy,
    fontWeight: "900",
  },
  alertDescription: {
    marginTop: 3,
    color: C.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  emptyAlert: {
    backgroundColor: C.cream,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EAD7C2",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyAlertText: {
    flex: 1,
    color: C.green,
    fontSize: 12,
    fontWeight: "800",
  },
  bottomSpacer: {
    height: 14,
  },
});