import React from "react";
import { StyleSheet, Text, View } from "react-native";

type DataSource = "real" | "derived" | "seeded" | "missing" | string;

const CONFIGS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  real:                { label: "Real",    bg: "#DCFCE7", text: "#166534", border: "#BBF7D0" },
  real_employee_master:{ label: "Real",    bg: "#DCFCE7", text: "#166534", border: "#BBF7D0" },
  derived:             { label: "Derived", bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" },
  seeded:              { label: "Seeded",  bg: "#FEF9C3", text: "#854D0E", border: "#FDE68A" },
  missing:             { label: "Missing", bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA" },
};

function resolveConfig(source: string) {
  const key = (source ?? "").toLowerCase();
  return CONFIGS[key] ?? { label: source || "Unknown", bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" };
}

interface BadgeProps {
  source: DataSource;
  size?: "sm" | "md";
  showDot?: boolean;
}

export function DataSourceBadge({ source, size = "sm", showDot = false }: BadgeProps) {
  const c = resolveConfig(source);
  const isMd = size === "md";

  return (
    <View style={[
      ss.badge,
      { backgroundColor: c.bg, borderColor: c.border },
      isMd && ss.badgeMd,
    ]}>
      {showDot && (
        <View style={[ss.dot, { backgroundColor: c.text }]} />
      )}
      <Text style={[ss.text, { color: c.text }, isMd && ss.textMd]}>{c.label}</Text>
    </View>
  );
}

interface RowProps {
  fields: { label: string; source: DataSource }[];
}

export function DataSourceRow({ fields }: RowProps) {
  return (
    <View style={ss.row}>
      {fields.map((f) => (
        <View key={f.label} style={ss.rowItem}>
          <Text style={ss.rowLabel}>{f.label}</Text>
          <DataSourceBadge source={f.source} size="sm" />
        </View>
      ))}
    </View>
  );
}

const ss = StyleSheet.create({
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 5, borderWidth: 1,
  },
  badgeMd: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  text: { fontSize: 9, fontWeight: "700" },
  textMd: { fontSize: 11 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  rowItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowLabel: { fontSize: 10, color: "#6B7280" },
});
