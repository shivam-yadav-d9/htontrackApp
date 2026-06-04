import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const C = {
  navy: "#102B45", orange: "#C95F18", muted: "#8A8178", white: "#FFFFFF",
  green: "#166534", red: "#B91C1C", amber: "#92400E",
};

type AlertSeverity = "critical" | "warning" | "info" | "ok";

export interface DataQualityAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  count?: number;
  affectedEmployees?: string[];
  affectedStores?: string[];
  action?: string;
}

const SEVERITY_CONFIG: Record<AlertSeverity, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  critical: { bg: "#FEE2E2", border: "#FECACA", text: "#B91C1C", icon: <AlertTriangle size={14} color="#B91C1C" /> },
  warning:  { bg: "#FEF9C3", border: "#FDE68A", text: "#854D0E", icon: <AlertTriangle size={14} color="#D97706" /> },
  info:     { bg: "#DBEAFE", border: "#BFDBFE", text: "#1E40AF", icon: <Info size={14} color="#1D4ED8" /> },
  ok:       { bg: "#DCFCE7", border: "#BBF7D0", text: "#166534", icon: <CheckCircle2 size={14} color="#166534" /> },
};

interface AlertCardProps {
  alert: DataQualityAlert;
  dismissable?: boolean;
  onDismiss?(): void;
}

export function DataQualityAlertCard({ alert, dismissable, onDismiss }: AlertCardProps) {
  const sc = SEVERITY_CONFIG[alert.severity];
  return (
    <View style={[ss.card, { backgroundColor: sc.bg, borderColor: sc.border }]}>
      <View style={ss.row}>
        {sc.icon}
        <View style={{ flex: 1 }}>
          <Text style={[ss.title, { color: sc.text }]}>{alert.title}</Text>
          <Text style={[ss.desc, { color: sc.text }]}>{alert.description}</Text>
        </View>
        {alert.count != null && (
          <View style={[ss.countBadge, { backgroundColor: sc.text }]}>
            <Text style={ss.countTxt}>{alert.count}</Text>
          </View>
        )}
        {dismissable && onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={ss.closeBtn}>
            <X size={12} color={sc.text} />
          </TouchableOpacity>
        )}
      </View>
      {alert.action && (
        <Text style={[ss.action, { color: sc.text }]}>{alert.action}</Text>
      )}
    </View>
  );
}

interface AlertBannerProps {
  alerts: DataQualityAlert[];
  maxVisible?: number;
}

export function DataQualityAlertBanner({ alerts, maxVisible = 3 }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const visible = alerts.filter((a) => !dismissed.has(a.id));
  const displayed = showAll ? visible : visible.slice(0, maxVisible);
  const hidden = visible.length - maxVisible;

  if (visible.length === 0) return null;

  const critCount = visible.filter((a) => a.severity === "critical").length;
  const warnCount = visible.filter((a) => a.severity === "warning").length;

  return (
    <View style={ss.banner}>
      <View style={ss.bannerHeader}>
        <AlertTriangle size={13} color={critCount > 0 ? C.red : C.orange} />
        <Text style={[ss.bannerTitle, { color: critCount > 0 ? C.red : C.orange }]}>
          Data Quality Alerts
        </Text>
        <View style={ss.bannerStats}>
          {critCount > 0 && <Text style={ss.criticalTxt}>{critCount} critical</Text>}
          {warnCount > 0 && <Text style={ss.warningTxt}>{warnCount} warning</Text>}
        </View>
      </View>
      <View style={ss.alertList}>
        {displayed.map((a) => (
          <DataQualityAlertCard
            key={a.id}
            alert={a}
            dismissable
            onDismiss={() => setDismissed((prev) => new Set([...prev, a.id]))}
          />
        ))}
      </View>
      {hidden > 0 && !showAll && (
        <TouchableOpacity style={ss.showMoreBtn} onPress={() => setShowAll(true)}>
          <Text style={ss.showMoreTxt}>+{hidden} more alerts</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function buildDataQualityAlerts(params: {
  missingEmail?: number;
  missingPhone?: number;
  missingManager?: number;
  missingGeo?: number;
  missingRole?: number;
  missingTargets?: number;
  missingCourses?: number;
  lowManpowerStores?: string[];
}): DataQualityAlert[] {
  const alerts: DataQualityAlert[] = [];

  if (params.missingEmail && params.missingEmail > 0) {
    alerts.push({
      id: "missing_email",
      title: "Missing Email Addresses",
      description: `${params.missingEmail} employees have no email address on record.`,
      severity: params.missingEmail > 20 ? "critical" : "warning",
      count: params.missingEmail,
      action: "Update employee master in HR system.",
    });
  }
  if (params.missingPhone && params.missingPhone > 0) {
    alerts.push({
      id: "missing_phone",
      title: "Missing Mobile Numbers",
      description: `${params.missingPhone} employees have no mobile number. OTP login will fail.`,
      severity: params.missingPhone > 10 ? "critical" : "warning",
      count: params.missingPhone,
      action: "Add mobile numbers to enable OTP login.",
    });
  }
  if (params.missingManager && params.missingManager > 0) {
    alerts.push({
      id: "missing_manager",
      title: "Unmapped Employees",
      description: `${params.missingManager} employees have no manager mapped.`,
      severity: params.missingManager > 15 ? "critical" : "warning",
      count: params.missingManager,
      action: "Map employees to managers via Teams page.",
    });
  }
  if (params.missingGeo && params.missingGeo > 0) {
    alerts.push({
      id: "missing_geo",
      title: "Missing Geo Coordinates",
      description: `${params.missingGeo} stores have no geofence coordinates set.`,
      severity: "critical",
      count: params.missingGeo,
      action: "Add store latitude/longitude for attendance geofencing.",
    });
  }
  if (params.missingRole && params.missingRole > 0) {
    alerts.push({
      id: "missing_role",
      title: "Unclassified Roles",
      description: `${params.missingRole} employees have no role classification.`,
      severity: "warning",
      count: params.missingRole,
      action: "Run role classification or update job titles.",
    });
  }
  if (params.missingTargets && params.missingTargets > 0) {
    alerts.push({
      id: "missing_targets",
      title: "Employees Without Targets",
      description: `${params.missingTargets} employees have no targets assigned for this period.`,
      severity: "warning",
      count: params.missingTargets,
      action: "Assign targets via the Targets page.",
    });
  }
  if (params.missingCourses && params.missingCourses > 0) {
    alerts.push({
      id: "missing_courses",
      title: "Employees Without Courses",
      description: `${params.missingCourses} employees have no courses assigned.`,
      severity: "info",
      count: params.missingCourses,
      action: "Assign learning paths via the Courses page.",
    });
  }
  if (params.lowManpowerStores && params.lowManpowerStores.length > 0) {
    alerts.push({
      id: "low_manpower",
      title: "Low Manpower Stores",
      description: `${params.lowManpowerStores.length} stores have below-minimum staff count.`,
      severity: "warning",
      count: params.lowManpowerStores.length,
      affectedStores: params.lowManpowerStores,
      action: "Review staffing for: " + params.lowManpowerStores.slice(0, 3).join(", "),
    });
  }

  return alerts;
}

const ss = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  title: { fontSize: 12, fontWeight: "700" },
  desc: { fontSize: 11, marginTop: 1 },
  action: { fontSize: 10, marginTop: 6, fontStyle: "italic" },
  countBadge: { borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start" },
  countTxt: { fontSize: 10, fontWeight: "800", color: "#fff" },
  closeBtn: { padding: 2 },
  banner: { backgroundColor: "#FFFDF8", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#FDE68A" },
  bannerHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  bannerTitle: { fontSize: 12, fontWeight: "800", flex: 1 },
  bannerStats: { flexDirection: "row", gap: 6 },
  criticalTxt: { fontSize: 10, fontWeight: "700", color: "#B91C1C", backgroundColor: "#FEE2E2", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  warningTxt: { fontSize: 10, fontWeight: "700", color: "#854D0E", backgroundColor: "#FEF9C3", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  alertList: { gap: 4 },
  showMoreBtn: { marginTop: 6, alignItems: "center" },
  showMoreTxt: { fontSize: 11, color: C.orange, fontWeight: "700" },
});
