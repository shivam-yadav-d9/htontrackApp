import { ChevronDown, Filter, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";

const C = {
  navy: "#102B45", orange: "#C95F18", gold: "#B7791F",
  cream: "#FFFDF8", muted: "#8A8178", white: "#FFFFFF",
};

export type GlobalFilterValues = {
  zone?: string;
  state?: string;
  city?: string;
  store?: string;
  department?: string;
  jobTitle?: string;
  band?: string;
  role?: string;
  manager?: string;
  dataSource?: string;
};

export type GlobalFilterOptions = {
  zones?: string[];
  states?: string[];
  cities?: string[];
  stores?: { code: string; name: string }[];
  departments?: string[];
  jobTitles?: string[];
  bands?: string[];
  roles?: string[];
  managers?: { id: string; name: string }[];
  dataSources?: string[];
};

interface Props {
  values: GlobalFilterValues;
  options: GlobalFilterOptions;
  onChange: (v: GlobalFilterValues) => void;
  onClear: () => void;
}

const FILTER_DEFS: { key: keyof GlobalFilterValues; label: string; optionKey: keyof GlobalFilterOptions }[] = [
  { key: "zone",       label: "Zone",       optionKey: "zones" },
  { key: "state",      label: "State",      optionKey: "states" },
  { key: "city",       label: "City",       optionKey: "cities" },
  { key: "department", label: "Department", optionKey: "departments" },
  { key: "role",       label: "Role",       optionKey: "roles" },
  { key: "band",       label: "Band",       optionKey: "bands" },
  { key: "dataSource", label: "Data Source",optionKey: "dataSources" },
];

function FilterChip({
  label, value, options, onSelect,
}: { label: string; value?: string; options: string[]; onSelect(v: string | undefined): void }) {
  const [open, setOpen] = useState(false);
  const active = !!value;

  return (
    <>
      <TouchableOpacity
        style={[ss.chip, active && ss.chipActive]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[ss.chipTxt, active && ss.chipTxtActive]} numberOfLines={1}>
          {value ?? label}
        </Text>
        {active
          ? <X size={11} color={C.white} />
          : <ChevronDown size={11} color={C.muted} />
        }
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={ss.overlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={ss.picker}>
            <Text style={ss.pickerTitle}>{label}</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity style={ss.pickerItem} onPress={() => { onSelect(undefined); setOpen(false); }}>
                <Text style={[ss.pickerItemTxt, !value && { color: C.navy, fontWeight: "700" }]}>All</Text>
              </TouchableOpacity>
              {options.map((opt) => (
                <TouchableOpacity key={opt} style={ss.pickerItem} onPress={() => { onSelect(opt); setOpen(false); }}>
                  <Text style={[ss.pickerItemTxt, value === opt && { color: C.navy, fontWeight: "700" }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

export function GlobalFilters({ values, options, onChange, onClear }: Props) {
  const activeCount = Object.values(values).filter(Boolean).length;

  const visible = FILTER_DEFS.filter((d) => {
    const opts = options[d.optionKey];
    return Array.isArray(opts) && opts.length > 0;
  });

  if (visible.length === 0) return null;

  return (
    <View style={ss.root}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ss.row}>
        <View style={ss.filterIcon}>
          <Filter size={12} color={C.navy} />
          {activeCount > 0 && (
            <View style={ss.badge}>
              <Text style={ss.badgeTxt}>{activeCount}</Text>
            </View>
          )}
        </View>

        {visible.map((def) => {
          const rawOpts = options[def.optionKey];
          const opts: string[] = Array.isArray(rawOpts)
            ? (rawOpts as any[]).map((o) => (typeof o === "string" ? o : o?.name ?? String(o)))
            : [];

          return (
            <FilterChip
              key={def.key}
              label={def.label}
              value={values[def.key]}
              options={opts}
              onSelect={(v) => onChange({ ...values, [def.key]: v })}
            />
          );
        })}

        {activeCount > 0 && (
          <TouchableOpacity style={ss.clearBtn} onPress={onClear}>
            <X size={11} color={C.orange} />
            <Text style={ss.clearTxt}>Clear</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { backgroundColor: "#F0EAE0", paddingVertical: 6 },
  row: { paddingHorizontal: 12, gap: 6, alignItems: "center" },
  filterIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.white, alignItems: "center", justifyContent: "center", elevation: 1 },
  badge: { position: "absolute", top: -3, right: -3, backgroundColor: C.orange, borderRadius: 8, width: 14, height: 14, alignItems: "center", justifyContent: "center" },
  badgeTxt: { fontSize: 8, fontWeight: "800", color: C.white },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: C.white, borderWidth: 1, borderColor: "#DDD", elevation: 1 },
  chipActive: { backgroundColor: C.navy, borderColor: C.navy },
  chipTxt: { fontSize: 11, fontWeight: "600", color: C.muted, maxWidth: 90 },
  chipTxtActive: { color: C.white },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: "#FFF7F0", borderWidth: 1, borderColor: "#FED7AA" },
  clearTxt: { fontSize: 11, fontWeight: "700", color: C.orange },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  picker: { backgroundColor: C.white, borderRadius: 16, width: 260, padding: 16, elevation: 8 },
  pickerTitle: { fontSize: 13, fontWeight: "800", color: C.navy, marginBottom: 10 },
  pickerItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  pickerItemTxt: { fontSize: 13, color: "#374151" },
});
