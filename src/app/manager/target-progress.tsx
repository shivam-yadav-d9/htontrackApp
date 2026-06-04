import { router } from 'expo-router';
import { ArrowLeft, Store, TrendingUp, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { managerTargetService } from '@/services/target.service';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AppCard } from '@/components/ui/AppCard';

function formatInr(val: number): string {
  if (val >= 10_00_000) return `₹${(val / 10_00_000).toFixed(2)}L`;
  if (val >= 1_000) return `₹${(val / 1_000).toFixed(1)}K`;
  return `₹${Math.round(val)}`;
}

function riskLabel(pct: number): string {
  if (pct >= 120) return 'Super Achiever';
  if (pct >= 100) return 'Achieved';
  if (pct >= 80) return 'On Track';
  if (pct >= 60) return 'Needs Push';
  return 'Critical';
}

function riskColor(pct: number): string {
  if (pct >= 120) return '#7C3AED';
  if (pct >= 100) return COLORS.success;
  if (pct >= 80) return COLORS.blue;
  if (pct >= 60) return COLORS.warning;
  return COLORS.error;
}

function buildPeriods(): { key: string; label: string }[] {
  const now = new Date();
  const periods = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
    periods.push({ key, label });
  }
  return periods;
}

const PERIODS = buildPeriods();

export default function TargetProgressScreen() {
  const [periodKey, setPeriodKey] = useState(PERIODS[0].key);
  const [summary, setSummary] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, [periodKey]);

  async function loadData() {
    try {
      setError('');
      const [summaryData, empData] = await Promise.all([
        managerTargetService.getSummary(periodKey),
        managerTargetService.getEmployeeTargets(periodKey),
      ]);
      setSummary(summaryData);
      setEmployees(empData?.employees ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  const storeTarget = summary?.store_target ?? null;
  const teamSummary = summary?.team_summary ?? null;
  const storePct = storeTarget ? (storeTarget.achievement_percentage ?? 0) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Target Progress</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.orange]} />}
      >
        {/* Period selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
        >
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodChip, periodKey === p.key && styles.periodChipActive]}
              onPress={() => { setPeriodKey(p.key); setLoading(true); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.periodChipText, periodKey === p.key && styles.periodChipTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={COLORS.orange} style={{ marginTop: 32 }} />
        ) : error ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Store target card */}
            <AppCard style={styles.storeCard}>
              <View style={styles.cardTitleRow}>
                <Store size={16} color={COLORS.blue} />
                <Text style={styles.cardTitle}>Store Target</Text>
                <Text style={styles.periodLabel}>{PERIODS.find((p) => p.key === periodKey)?.label ?? periodKey}</Text>
              </View>
              {!storeTarget ? (
                <Text style={styles.noData}>No store target assigned for this period.</Text>
              ) : (
                <>
                  <View style={styles.pctRow}>
                    <Text style={[styles.pctBig, { color: riskColor(storePct) }]}>{storePct}%</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.amtMain}>{formatInr(storeTarget.target_amount ?? 0)}</Text>
                      <Text style={styles.amtSub}>Target</Text>
                    </View>
                  </View>
                  <ProgressBar value={Math.min(storePct, 100)} height={10} color={riskColor(storePct)} showLabel />
                  <View style={styles.amtRow}>
                    <View style={styles.amtBox}>
                      <Text style={[styles.amtVal, { color: COLORS.success }]}>{formatInr(storeTarget.achieved_amount ?? 0)}</Text>
                      <Text style={styles.amtLabel}>Achieved</Text>
                    </View>
                    <View style={styles.amtDivider} />
                    <View style={styles.amtBox}>
                      <Text style={[styles.amtVal, { color: COLORS.error }]}>{formatInr(storeTarget.shortfall_amount ?? 0)}</Text>
                      <Text style={styles.amtLabel}>Shortfall</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: riskColor(storePct) + '20' }]}>
                    <TrendingUp size={12} color={riskColor(storePct)} />
                    <Text style={[styles.statusText, { color: riskColor(storePct) }]}>{riskLabel(storePct)}</Text>
                  </View>
                </>
              )}
            </AppCard>

            {/* Team summary */}
            {teamSummary && (
              <AppCard style={styles.teamCard}>
                <View style={styles.cardTitleRow}>
                  <Users size={16} color={COLORS.blue} />
                  <Text style={styles.cardTitle}>Team Summary</Text>
                  <Text style={styles.periodLabel}>{teamSummary.employees_with_target}/{teamSummary.total_employees} with targets</Text>
                </View>
                <View style={styles.statsGrid}>
                  <View style={[styles.statBox, { borderColor: COLORS.success + '40', backgroundColor: COLORS.success + '10' }]}>
                    <Text style={[styles.statVal, { color: COLORS.success }]}>{teamSummary.achieved_count}</Text>
                    <Text style={styles.statLabel}>Achieved</Text>
                  </View>
                  <View style={[styles.statBox, { borderColor: COLORS.blue + '40', backgroundColor: COLORS.blue + '10' }]}>
                    <Text style={[styles.statVal, { color: COLORS.blue }]}>{teamSummary.on_track_count}</Text>
                    <Text style={styles.statLabel}>On Track</Text>
                  </View>
                  <View style={[styles.statBox, { borderColor: COLORS.warning + '40', backgroundColor: COLORS.warning + '10' }]}>
                    <Text style={[styles.statVal, { color: COLORS.warning }]}>{teamSummary.behind_count}</Text>
                    <Text style={styles.statLabel}>Behind</Text>
                  </View>
                  <View style={[styles.statBox, { borderColor: COLORS.error + '40', backgroundColor: COLORS.error + '10' }]}>
                    <Text style={[styles.statVal, { color: COLORS.error }]}>{teamSummary.critical_count}</Text>
                    <Text style={styles.statLabel}>Critical</Text>
                  </View>
                </View>
                <View style={styles.teamTotalRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teamTotalLabel}>Team Target</Text>
                    <Text style={styles.teamTotalVal}>{formatInr(teamSummary.total_target_amount)}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.teamTotalLabel}>Team Achieved</Text>
                    <Text style={[styles.teamTotalVal, { color: COLORS.success }]}>{formatInr(teamSummary.total_achieved_amount)}</Text>
                  </View>
                </View>
                <ProgressBar
                  value={Math.min(teamSummary.average_achievement_percentage ?? 0, 100)}
                  height={8}
                  color={riskColor(teamSummary.average_achievement_percentage ?? 0)}
                  showLabel
                />
              </AppCard>
            )}

            {/* Employee list */}
            {employees.length > 0 && (
              <View style={styles.empSection}>
                <Text style={styles.empSectionTitle}>Staff Targets ({employees.length})</Text>
                {employees.map((emp, i) => {
                  const t = emp.target;
                  const empPct = t ? (t.achievement_percentage ?? 0) : 0;
                  const color = riskColor(empPct);
                  return (
                    <View key={emp.staff_id ?? i} style={[styles.empCard, Shadow.card]}>
                      <View style={styles.empTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.empName}>{emp.staff_name}</Text>
                          <Text style={styles.empSub}>{emp.designation || emp.department || ''}</Text>
                        </View>
                        {t ? (
                          <View style={[styles.empPctBadge, { backgroundColor: color + '20' }]}>
                            <Text style={[styles.empPct, { color }]}>{empPct}%</Text>
                          </View>
                        ) : (
                          <View style={styles.noTargetBadge}>
                            <Text style={styles.noTargetBadgeText}>No Target</Text>
                          </View>
                        )}
                      </View>
                      {t ? (
                        <>
                          <ProgressBar value={Math.min(empPct, 100)} height={7} color={color} />
                          <View style={styles.empAmtRow}>
                            <Text style={styles.empAmtText}>
                              {formatInr(t.achieved_amount ?? 0)} / {formatInr(t.target_amount ?? 0)}
                            </Text>
                            <Text style={[styles.empStatusText, { color }]}>{riskLabel(empPct)}</Text>
                          </View>
                        </>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}

            {employees.length === 0 && !loading && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No Staff Targets</Text>
                <Text style={styles.emptySub}>Use "Set Targets" to assign targets to your team for this period.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  header: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },

  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },

  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  periodChipActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  periodChipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  periodChipTextActive: { color: COLORS.white, fontWeight: '700' },

  storeCard: { gap: Spacing.two },
  teamCard: { gap: Spacing.two },

  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: COLORS.blue },
  periodLabel: { fontSize: 11, fontWeight: '600', color: COLORS.orange },

  noData: { fontSize: 13, color: COLORS.gray, fontStyle: 'italic', paddingVertical: Spacing.two },

  pctRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  pctBig: { fontSize: 40, fontWeight: '900', lineHeight: 48 },
  amtMain: { fontSize: 18, fontWeight: '800', color: COLORS.blue, textAlign: 'right' },
  amtSub: { fontSize: 11, color: COLORS.gray, textAlign: 'right' },

  amtRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: Spacing.one, borderTopWidth: 1, borderTopColor: COLORS.border },
  amtBox: { alignItems: 'center', flex: 1 },
  amtVal: { fontSize: 15, fontWeight: '800' },
  amtLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  amtDivider: { width: 1, backgroundColor: COLORS.border, alignSelf: 'stretch' },

  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.pill, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '700' },

  statsGrid: { flexDirection: 'row', gap: Spacing.one },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: BorderRadius.medium, borderWidth: 1 },
  statVal: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2 },

  teamTotalRow: { flexDirection: 'row', paddingTop: Spacing.one, borderTopWidth: 1, borderTopColor: COLORS.border },
  teamTotalLabel: { fontSize: 11, color: COLORS.gray },
  teamTotalVal: { fontSize: 16, fontWeight: '800', color: COLORS.blue, marginTop: 2 },

  empSection: { gap: Spacing.one },
  empSectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.blue, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },

  empCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  empTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  empName: { fontSize: 14, fontWeight: '700', color: COLORS.blue },
  empSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  empPctBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.pill },
  empPct: { fontSize: 14, fontWeight: '800' },
  noTargetBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.pill, backgroundColor: COLORS.grayLight },
  noTargetBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.gray },

  empAmtRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empAmtText: { fontSize: 12, color: COLORS.gray },
  empStatusText: { fontSize: 12, fontWeight: '700' },

  errorWrap: { alignItems: 'center', marginTop: 40, gap: 12 },
  errorText: { fontSize: 14, color: COLORS.error },
  retryBtn: { backgroundColor: COLORS.orange, borderRadius: BorderRadius.medium, paddingHorizontal: 24, paddingVertical: 10 },
  retryText: { color: COLORS.white, fontWeight: '700' },

  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
});
