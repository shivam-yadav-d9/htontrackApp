import React, { useEffect, useState } from 'react';
import { useAuthStore } from "@/store/auth.store";
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
import { TrendingUp, TrendingDown, Calendar, Target, CheckCircle2, AlertCircle } from 'lucide-react-native';

import ScreenLayout from '@/components/ScreenLayout';
import { AppCard } from '@/components/ui/AppCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { targetService } from '@/services/target.service';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

// ─── helpers ────────────────────────────────────────────────────────────────

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

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
}

// ─── types ───────────────────────────────────────────────────────────────────

interface MonthlyTarget {
  _id: string;
  employeeId: number;
  storeId: number;
  year: number;
  month: number;
  salesTargetAmount: number;
  createdAt: string;
}

interface DailyTarget {
  _id: string;
  employeeId: number;
  storeId: number;
  targetDate: string;
  salesTargetAmount: number;
  targetAchieved: number;
}

// ─── component ───────────────────────────────────────────────────────────────

export default function TargetsScreen() {
  // The employeeId should come from your auth context / AsyncStorage in your real app
  // Replace this with however you store the logged-in user's id
  const user = useAuthStore((state) => state.user);

  const EMPLOYEE_ID = user?.employee_code;
  const [monthly, setMonthly] = useState<MonthlyTarget | null>(null);
  const [daily, setDaily] = useState<DailyTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      if (!EMPLOYEE_ID) {
        console.log("NO EMPLOYEE ID FOUND");
        return;
      }

      setError('');

      console.log("TARGET USER =", user);
      console.log("TARGET EMPLOYEE ID =", EMPLOYEE_ID);

      const [monthlyRes, dailyRes] = await Promise.all([
        targetService.getMonthlyTarget(EMPLOYEE_ID),
        targetService.getDailyTargets(EMPLOYEE_ID),
      ]);

      console.log("MONTHLY TARGET =", monthlyRes);
      console.log("DAILY TARGET =", dailyRes);

      console.log('MONTHLY', monthlyRes);
      console.log('DAILY', dailyRes);

      setMonthly(monthlyRes ?? null);
      setDaily(dailyRes ?? []);
    } catch (err) {
      console.log("TARGET ERROR =", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load targets"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  // ── derived values ──────────────────────────────────────────────────────────
  const totalDailyTarget = daily.reduce((s, d) => s + d.salesTargetAmount, 0);
  const totalDailyAchieved = daily.reduce((s, d) => s + (d.targetAchieved ?? 0), 0);

  // Use daily achieved sum as the "achieved amount" for the monthly card
  const achievedAmount = totalDailyAchieved;
  const targetAmount = monthly?.salesTargetAmount ?? 0;
  const shortfall = Math.max(0, targetAmount - achievedAmount);
  const pct = targetAmount > 0 ? Math.round((achievedAmount / targetAmount) * 100) : 0;
  const color = riskColor(pct);

  // ── loading / error states ──────────────────────────────────────────────────

  if (loading && !monthly) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator
          style={{ marginTop: 40 }}
          color={COLORS.orange}
        />
      </SafeAreaView>
    );
  }

  if (error && !monthly) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorWrap}>
          <AlertCircle size={32} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity
            style={styles.retryBtn}
            onPress={loadData}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <ScreenLayout title="Targets">
      <SafeAreaView style={styles.safe} edges={[]}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.orange]}
            />
          }
        >
          {!monthly ? (
            // ── no target ────────────────────────────────────────────────────
            <AppCard style={styles.noTarget}>
              <Target size={32} color={COLORS.border} />
              <Text style={styles.noTargetTitle}>No Target Assigned</Text>
              <Text style={styles.noTargetSub}>
                Your manager hasn't set a target for this month yet.
              </Text>
            </AppCard>
          ) : (
            <>
              {/* ── monthly summary card ───────────────────────────────────── */}
              <AppCard style={styles.mainCard}>
                <View style={styles.mainTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.periodLabel}>
                      {monthLabel(monthly.year, monthly.month)}
                    </Text>
                    <Text style={styles.mainTitle}>Monthly Sales Target</Text>
                  </View>
                  <View style={[styles.riskBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.riskText, { color }]}>{riskLabel(pct)}</Text>
                  </View>
                </View>

                <View style={styles.pctRow}>
                  <Text style={[styles.pctBig, { color }]}>{pct}%</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.targetAmt}>{formatInr(targetAmount)}</Text>
                    <Text style={styles.targetAmtLabel}>Monthly Target</Text>
                  </View>
                </View>

                <ProgressBar value={Math.min(pct, 100)} height={10} color={color} showLabel />

                <View style={styles.amtRow}>
                  <View style={styles.amtBox}>
                    <Text style={[styles.amtVal, { color: COLORS.success }]}>
                      {formatInr(achievedAmount)}
                    </Text>
                    <Text style={styles.amtLabel}>Achieved</Text>
                  </View>
                  <View style={styles.amtDivider} />
                  <View style={styles.amtBox}>
                    <Text style={[styles.amtVal, { color: COLORS.error }]}>
                      {formatInr(shortfall)}
                    </Text>
                    <Text style={styles.amtLabel}>Shortfall</Text>
                  </View>
                  <View style={styles.amtDivider} />
                  <View style={styles.amtBox}>
                    <Text style={[styles.amtVal, { color: COLORS.blue }]}>
                      {daily.length}
                    </Text>
                    <Text style={styles.amtLabel}>Days Set</Text>
                  </View>
                </View>
              </AppCard>

              {/* ── daily breakdown ────────────────────────────────────────── */}
              {daily.length > 0 && (
                <AppCard style={styles.dailyCard}>
                  <View style={styles.dailyHeader}>
                    <Calendar size={14} color={COLORS.orange} />
                    <Text style={styles.dailyTitle}>Daily Breakdown</Text>
                  </View>

                  {daily.map((item, idx) => {
                    const dayPct =
                      item.salesTargetAmount > 0
                        ? Math.round((item.targetAchieved / item.salesTargetAmount) * 100)
                        : 0;
                    const dayColor = riskColor(dayPct);
                    const isLast = idx === daily.length - 1;

                    return (
                      <View
                        key={item._id}
                        style={[styles.dayRow, !isLast && styles.dayRowBorder]}
                      >
                        <View style={styles.dayLeft}>
                          <Text style={styles.dayDate}>{formatDate(item.targetDate)}</Text>
                          <Text style={styles.dayTarget}>
                            Target: {formatInr(item.salesTargetAmount)}
                          </Text>
                        </View>

                        <View style={styles.dayRight}>
                          <View style={styles.dayBarWrap}>
                            <View style={styles.dayBarBg}>
                              <View
                                style={[
                                  styles.dayBarFill,
                                  {
                                    width: `${Math.min(dayPct, 100)}%` as any,
                                    backgroundColor: dayColor,
                                  },
                                ]}
                              />
                            </View>
                          </View>

                          <View style={styles.dayAmtRow}>
                            <Text style={[styles.dayAchieved, { color: dayColor }]}>
                              {formatInr(item.targetAchieved)}
                            </Text>
                            <View
                              style={[
                                styles.dayPctBadge,
                                { backgroundColor: dayColor + '18' },
                              ]}
                            >
                              <Text style={[styles.dayPctText, { color: dayColor }]}>
                                {dayPct}%
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}

                  {/* daily totals row */}
                  <View style={styles.dailyTotals}>
                    <Text style={styles.dailyTotalsLabel}>Total (set days)</Text>
                    <View style={styles.dailyTotalsVals}>
                      <Text style={[styles.dailyTotalsVal, { color: COLORS.gray }]}>
                        {formatInr(totalDailyTarget)}
                      </Text>
                      <Text style={styles.dailyTotalsSep}>→</Text>
                      <Text style={[styles.dailyTotalsVal, { color: COLORS.success }]}>
                        {formatInr(totalDailyAchieved)}
                      </Text>
                    </View>
                  </View>
                </AppCard>
              )}

              {/* ── store info ─────────────────────────────────────────────── */}
              <AppCard style={styles.metaCard}>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Store ID</Text>
                    <Text style={styles.metaVal}>#{monthly.storeId}</Text>
                  </View>
                  <View style={styles.metaDivider} />
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Employee ID</Text>
                    <Text style={styles.metaVal}>#{monthly.employeeId}</Text>
                  </View>
                  <View style={styles.metaDivider} />
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Period</Text>
                    <Text style={styles.metaVal}>
                      {String(monthly.month).padStart(2, '0')}/{monthly.year}
                    </Text>
                  </View>
                </View>
              </AppCard>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenLayout>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },

  // error / empty
  errorWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
  errorText: { fontSize: 14, color: COLORS.error, textAlign: 'center' },
  retryBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: { color: COLORS.white, fontWeight: '700' },

  noTarget: { alignItems: 'center', paddingVertical: Spacing.four, gap: Spacing.two },
  noTargetTitle: { fontSize: 16, fontWeight: '800', color: COLORS.blue },
  noTargetSub: { fontSize: 13, color: COLORS.gray, textAlign: 'center', lineHeight: 20 },

  // main card
  mainCard: { gap: Spacing.two },
  mainTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  periodLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.orange,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainTitle: { fontSize: 16, fontWeight: '800', color: COLORS.blue, marginTop: 2 },
  riskBadge: { borderRadius: BorderRadius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  riskText: { fontSize: 12, fontWeight: '700' },
  pctRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  pctBig: { fontSize: 44, fontWeight: '900', lineHeight: 52 },
  targetAmt: { fontSize: 18, fontWeight: '800', color: COLORS.blue, textAlign: 'right' },
  targetAmtLabel: { fontSize: 11, color: COLORS.gray, textAlign: 'right' },
  amtRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.one,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  amtBox: { alignItems: 'center', flex: 1 },
  amtVal: { fontSize: 16, fontWeight: '800' },
  amtLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  amtDivider: { width: 1, backgroundColor: COLORS.border, alignSelf: 'stretch' },

  // daily card
  dailyCard: { gap: Spacing.two },
  dailyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dailyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.blue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayRow: { paddingVertical: 10, gap: 6 },
  dayRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dayLeft: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayDate: { fontSize: 13, fontWeight: '700', color: COLORS.blue },
  dayTarget: { fontSize: 12, color: COLORS.gray },
  dayRight: { gap: 4 },
  dayBarWrap: {},
  dayBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  dayBarFill: { height: '100%', borderRadius: 3 },
  dayAmtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayAchieved: { fontSize: 13, fontWeight: '700' },
  dayPctBadge: {
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dayPctText: { fontSize: 11, fontWeight: '700' },
  dailyTotals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.one,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dailyTotalsLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray },
  dailyTotalsVals: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dailyTotalsVal: { fontSize: 13, fontWeight: '800' },
  dailyTotalsSep: { fontSize: 12, color: COLORS.gray },

  // meta card
  metaCard: { paddingVertical: Spacing.two },
  metaRow: { flexDirection: 'row', justifyContent: 'space-around' },
  metaItem: { alignItems: 'center', flex: 1 },
  metaLabel: { fontSize: 11, color: COLORS.gray, marginBottom: 2 },
  metaVal: { fontSize: 13, fontWeight: '700', color: COLORS.blue },
  metaDivider: { width: 1, backgroundColor: COLORS.border, alignSelf: 'stretch' },
});