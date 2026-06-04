import { router } from 'expo-router';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Crown,
  Layers,
  MapPin,
  Plus,
  Search,
  Store,
  UserRound,
  UsersRound,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { managerTeamService } from '@/services/manager-team.service';
import type { GroupedTeamResponse, StoreTeamGroup } from '@/services/manager-team.service';
import type { User } from '@/types/auth.types';

export default function ManagerTeamScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<GroupedTeamResponse | null>(null);
  const [search, setSearch] = useState('');
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTeam();
  }, []);

  async function loadTeam() {
    try {
      setLoading(true);
      const res = await managerTeamService.getTeamGrouped();
      setData(res);
      // Auto-expand first store and all its departments
      if (res.stores.length > 0) {
        const first = res.stores[0].store_code;
        setExpandedStores(new Set([first]));
        const deptKeys = res.stores[0].departments.map((d) => `${first}__${d.department}`);
        setExpandedDepts(new Set(deptKeys));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadTeam();
    setRefreshing(false);
  }

  function toggleStore(code: string) {
    setExpandedStores((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }

  function toggleDept(key: string) {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const q = search.trim().toLowerCase();

  const filteredStores = useMemo(() => {
    if (!data) return [];
    if (!q) return data.stores;
    return data.stores
      .map((store) => ({
        ...store,
        managers: store.managers.filter(
          (m) =>
            m.full_name?.toLowerCase().includes(q) ||
            m.department?.toLowerCase().includes(q) ||
            m.designation?.toLowerCase().includes(q),
        ),
        departments: store.departments
          .map((d) => ({
            ...d,
            staff: d.staff.filter(
              (s) =>
                s.full_name?.toLowerCase().includes(q) ||
                s.department?.toLowerCase().includes(q) ||
                s.designation?.toLowerCase().includes(q) ||
                (s as any).employee_code?.toLowerCase().includes(q),
            ),
          }))
          .filter((d) => d.staff.length > 0 || d.department.toLowerCase().includes(q)),
      }))
      .filter(
        (store) =>
          store.managers.length > 0 ||
          store.departments.length > 0 ||
          store.store_name.toLowerCase().includes(q) ||
          store.store_code.toLowerCase().includes(q) ||
          store.city?.toLowerCase().includes(q),
      );
  }, [data, q]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backPill}
          onPress={() => router.replace('/manager/dashboard')}
          activeOpacity={0.85}
        >
          <Text style={styles.backPillText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Teams</Text>
        <Text style={styles.headerSub}>Stores · Managers · Departments</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#C95F18']} tintColor="#C95F18" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top summary */}
        {data && (
          <View style={styles.summaryRow}>
            <SummaryPill icon={<Store size={14} color="#C95F18" />} label="Stores" value={data.total_stores} />
            <SummaryPill icon={<Crown size={14} color="#C95F18" />} label="Managers" value={data.total_managers} />
            <SummaryPill icon={<UsersRound size={14} color="#C95F18" />} label="Staff" value={data.total_staff} />
          </View>
        )}

        {/* Add member */}
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.88}
          onPress={() => router.push('/manager/team/add' as any)}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add New Team Member</Text>
        </TouchableOpacity>

        {/* Search */}
        <View style={styles.searchBox}>
          <Search size={16} color="#8A8178" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, department, designation..."
            placeholderTextColor="#8A8178"
          />
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#C95F18" size="large" />
            <Text style={styles.stateText}>Loading team structure...</Text>
          </View>
        ) : filteredStores.length === 0 ? (
          <View style={styles.stateCard}>
            <UserRound size={34} color="#8A8178" />
            <Text style={styles.stateTitle}>No results found</Text>
            <Text style={styles.stateText}>Try a different search term.</Text>
          </View>
        ) : (
          filteredStores.map((store) => (
            <StoreBlock
              key={store.store_code}
              store={store}
              expanded={expandedStores.has(store.store_code)}
              expandedDepts={expandedDepts}
              onToggleStore={() => toggleStore(store.store_code)}
              onToggleDept={toggleDept}
              onPressMember={(id) =>
                router.push({ pathname: '/manager/team/[staffId]', params: { staffId: id } } as any)
              }
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Store block ────────────────────────────────────────────────────────────────

function StoreBlock({
  store,
  expanded,
  expandedDepts,
  onToggleStore,
  onToggleDept,
  onPressMember,
}: {
  store: StoreTeamGroup;
  expanded: boolean;
  expandedDepts: Set<string>;
  onToggleStore: () => void;
  onToggleDept: (key: string) => void;
  onPressMember: (id: string) => void;
}) {
  return (
    <View style={styles.storeBlock}>
      {/* Store header */}
      <TouchableOpacity style={styles.storeHeader} onPress={onToggleStore} activeOpacity={0.88}>
        <View style={styles.storeIconBox}>
          <Store size={20} color="#C95F18" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.storeName} numberOfLines={1}>{store.store_name}</Text>
          <View style={styles.storeMetaRow}>
            <MapPin size={11} color="#8A8178" />
            <Text style={styles.storeMeta}>{[store.city, store.state].filter(Boolean).join(', ')}</Text>
            {store.zone ? <Text style={styles.zoneChip}>{store.zone}</Text> : null}
          </View>
        </View>
        <View style={styles.storeCountBadge}>
          <Text style={styles.storeCountText}>{store.staff_count + store.managers.length}</Text>
        </View>
        {expanded ? <ChevronUp size={18} color="#8A8178" /> : <ChevronDown size={18} color="#8A8178" />}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.storeBody}>
          {/* Managers section */}
          {store.managers.length > 0 && (
            <View style={styles.managerSection}>
              <View style={styles.sectionLabelRow}>
                <Crown size={13} color="#C95F18" />
                <Text style={styles.sectionLabel}>
                  {store.managers.length === 1 ? 'Store Manager' : `Managers (${store.managers.length})`}
                </Text>
              </View>
              {store.managers.map((mgr) => (
                <ManagerCard key={mgr.id} manager={mgr} onPress={() => onPressMember(mgr.id)} />
              ))}
            </View>
          )}

          {/* Departments */}
          {store.departments.map((dept) => {
            const deptKey = `${store.store_code}__${dept.department}`;
            const deptExpanded = expandedDepts.has(deptKey);
            return (
              <DeptBlock
                key={deptKey}
                deptKey={deptKey}
                department={dept.department}
                staff={dept.staff}
                expanded={deptExpanded}
                onToggle={() => onToggleDept(deptKey)}
                onPressMember={onPressMember}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

// ── Manager card ───────────────────────────────────────────────────────────────

function ManagerCard({ manager, onPress }: { manager: User; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.managerCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.managerAvatar}>
        <Text style={styles.managerAvatarText}>{getInitials(manager.full_name)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.managerName} numberOfLines={1}>{manager.full_name}</Text>
        <Text style={styles.managerRole} numberOfLines={1}>
          {manager.designation ?? 'Manager'}{manager.department ? ` · ${manager.department}` : ''}
        </Text>
      </View>
      <View style={styles.managerBadge}>
        <Crown size={10} color="#C95F18" />
        <Text style={styles.managerBadgeText}>MGR</Text>
      </View>
      <ChevronRight size={15} color="#8A8178" />
    </TouchableOpacity>
  );
}

// ── Department block ───────────────────────────────────────────────────────────

function DeptBlock({
  deptKey,
  department,
  staff,
  expanded,
  onToggle,
  onPressMember,
}: {
  deptKey: string;
  department: string;
  staff: User[];
  expanded: boolean;
  onToggle: () => void;
  onPressMember: (id: string) => void;
}) {
  return (
    <View style={styles.deptBlock}>
      <TouchableOpacity style={styles.deptHeader} onPress={onToggle} activeOpacity={0.85}>
        <View style={styles.deptIconBox}>
          <Layers size={13} color="#6B3F20" />
        </View>
        <Text style={styles.deptName} numberOfLines={1}>{department}</Text>
        <View style={styles.deptCountChip}>
          <Text style={styles.deptCount}>{staff.length}</Text>
        </View>
        {expanded ? <ChevronUp size={14} color="#8A8178" /> : <ChevronDown size={14} color="#8A8178" />}
      </TouchableOpacity>

      {expanded &&
        staff.map((member, idx) => (
          <StaffRow
            key={member.id}
            member={member}
            last={idx === staff.length - 1}
            onPress={() => onPressMember(member.id)}
          />
        ))}
    </View>
  );
}

// ── Staff row ──────────────────────────────────────────────────────────────────

function StaffRow({
  member,
  last,
  onPress,
}: {
  member: User;
  last: boolean;
  onPress: () => void;
}) {
  const isInactive = member.status === 'inactive';
  return (
    <TouchableOpacity
      style={[styles.staffRow, !last && styles.staffDivider]}
      onPress={onPress}
      activeOpacity={0.84}
    >
      <View style={styles.staffAvatar}>
        <Text style={styles.staffAvatarText}>{getInitials(member.full_name)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.staffName} numberOfLines={1}>{member.full_name}</Text>
          {isInactive && (
            <View style={styles.inactiveChip}>
              <Text style={styles.inactiveText}>INACTIVE</Text>
            </View>
          )}
        </View>
        <Text style={styles.staffDesig} numberOfLines={1}>
          {member.designation ?? 'Staff'}
          {member.employee_code ? ` · ${member.employee_code}` : ''}
        </Text>
        {(member.target_percentage != null || member.attendance_percentage != null) && (
          <View style={styles.metricsRow}>
            {member.target_percentage != null && (
              <MetricPill label="Target" value={`${member.target_percentage}%`} />
            )}
            {member.attendance_percentage != null && (
              <MetricPill label="Attendance" value={`${member.attendance_percentage}%`} />
            )}
            {member.courses_completed != null && (
              <MetricPill label="Courses" value={`${member.courses_completed}/${member.courses_total ?? 0}`} />
            )}
          </View>
        )}
      </View>
      <ChevronRight size={15} color="#8A8178" />
    </TouchableOpacity>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function SummaryPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <View style={styles.summaryPill}>
      {icon}
      <Text style={styles.summaryPillValue}>{value}</Text>
      <Text style={styles.summaryPillLabel}>{label}</Text>
    </View>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricPill}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function getInitials(name?: string) {
  if (!name) return 'ST';
  return name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6EBDC' },

  header: {
    backgroundColor: '#102B45',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  backPillText: { color: '#FFEAC7', fontSize: 12, fontWeight: '900' },
  headerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.72)', marginTop: 4, fontSize: 13, fontWeight: '700' },

  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },

  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryPill: {
    flex: 1,
    backgroundColor: '#FFFDF8',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 4,
  },
  summaryPillValue: { fontSize: 22, fontWeight: '900', color: '#102B45' },
  summaryPillLabel: { fontSize: 10, fontWeight: '800', color: '#8A8178' },

  addButton: {
    backgroundColor: '#C95F18',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },

  searchBox: {
    backgroundColor: '#FFFDF8',
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, color: '#102B45', fontSize: 14, fontWeight: '700', paddingVertical: 10 },

  stateCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  stateTitle: { fontSize: 16, fontWeight: '900', color: '#102B45' },
  stateText: { color: '#8A8178', fontWeight: '700', fontSize: 13 },

  // Store block
  storeBlock: {
    backgroundColor: '#FFFDF8',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    overflow: 'hidden',
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  storeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: { color: '#102B45', fontSize: 15, fontWeight: '900' },
  storeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  storeMeta: { color: '#8A8178', fontSize: 11, fontWeight: '700' },
  zoneChip: {
    backgroundColor: '#E0F2FE',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 9,
    fontWeight: '900',
    color: '#0369A1',
  },
  storeCountBadge: {
    backgroundColor: '#102B45',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  storeCountText: { color: '#FFEAC7', fontSize: 12, fontWeight: '900' },

  storeBody: { borderTopWidth: 1, borderTopColor: '#F1E4D6', paddingBottom: 8 },

  // Manager section
  managerSection: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionLabel: { color: '#C95F18', fontSize: 11, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' },

  managerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#FFF8F0',
    borderRadius: 16,
    padding: 11,
    borderWidth: 1,
    borderColor: '#F6D9B0',
    marginBottom: 8,
  },
  managerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#C95F18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  managerAvatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  managerName: { color: '#102B45', fontSize: 14, fontWeight: '900' },
  managerRole: { color: '#6B3F20', fontSize: 11, fontWeight: '700', marginTop: 2 },
  managerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E8',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
    gap: 3,
    borderWidth: 1,
    borderColor: '#F6D9B0',
  },
  managerBadgeText: { color: '#C95F18', fontSize: 9, fontWeight: '900' },

  // Department block
  deptBlock: {
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: '#F9F3EC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    overflow: 'hidden',
  },
  deptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deptIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#EFE1CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptName: { flex: 1, color: '#3B2416', fontSize: 12, fontWeight: '900', textTransform: 'capitalize' },
  deptCountChip: {
    backgroundColor: '#102B45',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 22,
    alignItems: 'center',
  },
  deptCount: { color: '#FFEAC7', fontSize: 11, fontWeight: '900' },

  // Staff row
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFDF8',
  },
  staffDivider: { borderBottomWidth: 1, borderBottomColor: '#F1E4D6' },
  staffAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  staffAvatarText: { color: '#C95F18', fontSize: 12, fontWeight: '900' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  staffName: { flex: 1, color: '#102B45', fontSize: 13, fontWeight: '900' },
  staffDesig: { color: '#6B3F20', fontSize: 11, fontWeight: '700', marginTop: 2 },
  inactiveChip: { backgroundColor: '#FEE2E2', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  inactiveText: { color: '#B91C1C', fontSize: 8, fontWeight: '900' },

  metricsRow: { flexDirection: 'row', gap: 6, marginTop: 5, flexWrap: 'wrap' },
  metricPill: { backgroundColor: '#F1E4D6', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 4 },
  metricValue: { color: '#102B45', fontSize: 10, fontWeight: '900' },
  metricLabel: { color: '#8A8178', fontSize: 8, fontWeight: '700', marginTop: 1 },
});
