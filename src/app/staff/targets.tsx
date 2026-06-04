import { TrendingDown, TrendingUp } from 'lucide-react-native';
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

import { StaffPageHeader } from '@/components/StaffPageHeader';
import { AppCard } from '@/components/ui/AppCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { staffTargetService } from '@/services/target.service';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

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

export default function TargetsScreen() {
  const [periodKey, setPeriodKey] = useState(PERIODS[0].key);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadSummary(); }, [periodKey]);

  async function loadSummary() {
    try {
      setError('');
      const data = await staffTargetService.getMyTargetSummary(periodKey);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load target');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadSummary();
  }

  const target = summary?.target ?? null;
  const lastMonth = summary?.last_month ?? null;
  const pct = target?.achievement_percentage ?? 0;
  const color = riskColor(pct);

  if (loading && !summary) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StaffPageHeader title="My Target" subtitle="Performance Overview" />
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.orange} />
      </SafeAreaView>
    );
  }

  if (error && !summary) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StaffPageHeader title="My Target" subtitle="Performance Overview" />
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadSummary}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StaffPageHeader title="My Target" subtitle="Performance Overview" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.orange]} />}
      >
        {/* Period selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodRow} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
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
        ) : !target ? (
          <AppCard style={styles.noTarget}>
            <Text style={styles.noTargetTitle}>No Target Assigned</Text>
            <Text style={styles.noTargetSub}>
              Your manager or head office has not set a target for {PERIODS.find((p) => p.key === periodKey)?.label ?? periodKey}.
            </Text>
          </AppCard>
        ) : (
          <>
            {/* Main achievement card */}
            <AppCard style={styles.mainCard}>
              <View style={styles.mainTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.periodLabel}>{PERIODS.find((p) => p.key === periodKey)?.label ?? periodKey}</Text>
                  <Text style={styles.mainTitle}>Monthly Sales Target</Text>
                </View>
                <View style={[styles.riskBadge, { backgroundColor: color + '20' }]}>
                  <Text style={[styles.riskText, { color }]}>{riskLabel(pct)}</Text>
                </View>
              </View>

              <View style={styles.pctRow}>
                <Text style={[styles.pctBig, { color }]}>{pct}%</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.targetAmt}>{formatInr(target.target_amount)}</Text>
                  <Text style={styles.targetAmtLabel}>Target</Text>
                </View>
              </View>

              <ProgressBar value={Math.min(pct, 100)} height={10} color={color} showLabel />

              <View style={styles.amtRow}>
                <View style={styles.amtBox}>
                  <Text style={[styles.amtVal, { color: COLORS.success }]}>{formatInr(target.achieved_amount)}</Text>
                  <Text style={styles.amtLabel}>Achieved</Text>
                </View>
                <View style={styles.amtDivider} />
                <View style={styles.amtBox}>
                  <Text style={[styles.amtVal, { color: COLORS.error }]}>{formatInr(target.shortfall_amount)}</Text>
                  <Text style={styles.amtLabel}>Shortfall</Text>
                </View>
                {summary.daily_sales_count > 0 && (
                  <>
                    <View style={styles.amtDivider} />
                    <View style={styles.amtBox}>
                      <Text style={[styles.amtVal, { color: COLORS.blue }]}>{summary.daily_sales_count}</Text>
                      <Text style={styles.amtLabel}>Orders</Text>
                    </View>
                  </>
                )}
              </View>
            </AppCard>

            {/* Last month comparison */}
            {lastMonth && lastMonth.target_amount > 0 && (
              <AppCard style={styles.compareCard}>
                <Text style={styles.compareTitle}>vs Last Month</Text>
                <View style={styles.compareRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.compareLabel}>Last Month Achievement</Text>
                    <Text style={styles.compareVal}>{formatInr(lastMonth.achieved_amount)}</Text>
                    <Text style={styles.compareSubVal}>{lastMonth.achievement_percentage}% of {formatInr(lastMonth.target_amount)}</Text>
                  </View>
                  <View style={styles.deltaBadge}>
                    {lastMonth.difference_amount >= 0
                      ? <TrendingUp size={14} color={COLORS.success} />
                      : <TrendingDown size={14} color={COLORS.error} />}
                    <Text style={[styles.deltaText, { color: lastMonth.difference_amount >= 0 ? COLORS.success : COLORS.error }]}>
                      {lastMonth.difference_amount >= 0 ? '+' : ''}{formatInr(lastMonth.difference_amount)}
                    </Text>
                  </View>
                </View>
              </AppCard>
            )}

            {/* Admin remark if any */}
            {summary?.target?.admin_remark ? (
              <AppCard style={styles.remarkCard}>
                <Text style={styles.remarkLabel}>Message from Manager / HO</Text>
                <Text style={styles.remarkText}>{summary.target.admin_remark}</Text>
              </AppCard>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },
  periodRow: { marginBottom: 4, marginHorizontal: -Spacing.three, paddingHorizontal: Spacing.three },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  periodChipActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  periodChipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  periodChipTextActive: { color: COLORS.white, fontWeight: '700' },

  noTarget: { alignItems: 'center', paddingVertical: Spacing.four, gap: Spacing.two },
  noTargetTitle: { fontSize: 16, fontWeight: '800', color: COLORS.blue },
  noTargetSub: { fontSize: 13, color: COLORS.gray, textAlign: 'center', lineHeight: 20 },

  mainCard: { gap: Spacing.two },
  mainTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  periodLabel: { fontSize: 11, fontWeight: '700', color: COLORS.orange, textTransform: 'uppercase', letterSpacing: 0.5 },
  mainTitle: { fontSize: 16, fontWeight: '800', color: COLORS.blue, marginTop: 2 },
  riskBadge: { borderRadius: BorderRadius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  riskText: { fontSize: 12, fontWeight: '700' },

  pctRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  pctBig: { fontSize: 44, fontWeight: '900', lineHeight: 52 },
  targetAmt: { fontSize: 18, fontWeight: '800', color: COLORS.blue, textAlign: 'right' },
  targetAmtLabel: { fontSize: 11, color: COLORS.gray, textAlign: 'right' },

  amtRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: Spacing.one, borderTopWidth: 1, borderTopColor: COLORS.border },
  amtBox: { alignItems: 'center', flex: 1 },
  amtVal: { fontSize: 16, fontWeight: '800' },
  amtLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  amtDivider: { width: 1, backgroundColor: COLORS.border, alignSelf: 'stretch' },

  compareCard: { gap: Spacing.one },
  compareTitle: { fontSize: 13, fontWeight: '800', color: COLORS.blue, textTransform: 'uppercase', letterSpacing: 0.5 },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  compareLabel: { fontSize: 12, color: COLORS.gray },
  compareVal: { fontSize: 16, fontWeight: '800', color: COLORS.blue, marginTop: 2 },
  compareSubVal: { fontSize: 11, color: COLORS.gray },
  deltaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.medium, backgroundColor: COLORS.beigeLight },
  deltaText: { fontSize: 13, fontWeight: '700' },

  remarkCard: { gap: 6 },
  remarkLabel: { fontSize: 12, fontWeight: '700', color: COLORS.orange, textTransform: 'uppercase', letterSpacing: 0.5 },
  remarkText: { fontSize: 13, color: COLORS.grayDark, lineHeight: 20 },

  errorWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
  errorText: { fontSize: 14, color: COLORS.error },
  retryBtn: { backgroundColor: COLORS.orange, borderRadius: BorderRadius.medium, paddingHorizontal: 24, paddingVertical: 10 },
  retryText: { color: COLORS.white, fontWeight: '700' },
});
