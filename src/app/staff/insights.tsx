import { router } from 'expo-router';
import { AlertTriangle, BookOpen, CheckCircle, Star, Target, TrendingUp, Zap } from 'lucide-react-native';
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

import { insightService } from '@/services/insight.service';

const LEVEL_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  excellent: { bg: '#F0FDF4', border: '#86EFAC', text: '#166534', label: 'Excellent' },
  good: { bg: '#EFF6FF', border: '#93C5FD', text: '#1D4ED8', label: 'Good' },
  average: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', label: 'Average' },
  needs_attention: { bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B', label: 'Needs Attention' },
  no_data: { bg: '#F9FAFB', border: '#D1D5DB', text: '#6B7280', label: 'No Data' },
};

const SEVERITY_COLORS: Record<string, string> = {
  high: '#DC2626',
  medium: '#D97706',
  low: '#2563EB',
};

function ScoreGauge({ score, level }: { score: number; level: string }) {
  const lc = LEVEL_COLORS[level] ?? LEVEL_COLORS.no_data;
  const barWidth = `${Math.max(4, score)}%`;
  return (
    <View style={[styles.gaugeCard, { backgroundColor: lc.bg, borderColor: lc.border }]}>
      <View style={styles.gaugeHeader}>
        <Text style={[styles.gaugeScore, { color: lc.text }]}>{score}</Text>
        <View style={[styles.levelBadge, { backgroundColor: lc.border }]}>
          <Text style={[styles.levelBadgeText, { color: lc.text }]}>{lc.label}</Text>
        </View>
      </View>
      <Text style={[styles.gaugeLabel, { color: lc.text }]}>Health Score</Text>
      <View style={styles.gaugeBar}>
        <View style={[styles.gaugeBarFill, { width: barWidth as any, backgroundColor: lc.text }]} />
      </View>
    </View>
  );
}

function BreakdownRow({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const color = value >= 70 ? '#166534' : value >= 40 ? '#92400E' : '#991B1B';
  return (
    <View style={styles.breakdownRow}>
      {icon}
      <Text style={styles.breakdownLabel}>{label}</Text>
      <View style={[styles.breakdownPill, { backgroundColor: value >= 70 ? '#F0FDF4' : value >= 40 ? '#FFFBEB' : '#FEF2F2' }]}>
        <Text style={[styles.breakdownValue, { color }]}>{value}%</Text>
      </View>
    </View>
  );
}

function RiskCard({ risk }: { risk: any }) {
  const color = SEVERITY_COLORS[risk.severity] ?? '#6B7280';
  return (
    <View style={[styles.riskCard, { borderLeftColor: color }]}>
      <AlertTriangle size={14} color={color} />
      <Text style={[styles.riskMessage, { color: '#374151' }]}>{risk.message}</Text>
    </View>
  );
}

function OpportunityCard({ op }: { op: any }) {
  return (
    <View style={styles.opCard}>
      <Zap size={14} color="#D97706" />
      <Text style={styles.opMessage}>{op.message}</Text>
    </View>
  );
}

function RecommendationCard({ text }: { text: string }) {
  return (
    <View style={styles.recoCard}>
      <CheckCircle size={13} color="#1D4ED8" />
      <Text style={styles.recoText}>{text}</Text>
    </View>
  );
}

export default function StaffInsightsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [recos, setRecos] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'risks' | 'actions'>('overview');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const [ins, rec] = await Promise.all([
        insightService.getMyInsights(),
        insightService.getMyRecommendations(),
      ]);
      setData(ins);
      setRecos(rec);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const health = data?.health ?? { score: 0, level: 'no_data', breakdown: {} };
  const summary = data?.summary ?? {};
  const risks: any[] = data?.risks ?? [];
  const opportunities: any[] = data?.opportunities ?? [];
  const recommendations: string[] = data?.recommendations ?? [];
  const actions: any[] = recos?.recommended_actions ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Insights</Text>
        <Text style={styles.headerSub}>Performance intelligence</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {loading ? (
          <ActivityIndicator color="#C95F18" style={{ marginTop: 32 }} />
        ) : (
          <>
            <ScoreGauge score={health.score} level={health.level} />

            {/* Breakdown */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Score Breakdown</Text>
              <BreakdownRow label="Target Achievement" value={health.breakdown?.target_score ?? 0} icon={<Target size={14} color="#C95F18" />} />
              <BreakdownRow label="Course Completion" value={health.breakdown?.course_score ?? 0} icon={<BookOpen size={14} color="#1D4ED8" />} />
              <BreakdownRow label="Assignments" value={health.breakdown?.assignment_score ?? 0} icon={<CheckCircle size={14} color="#166534" />} />
              {(health.breakdown?.award_bonus ?? 0) > 0 && (
                <BreakdownRow label="Award Bonus" value={health.breakdown.award_bonus} icon={<Star size={14} color="#92400E" />} />
              )}
            </View>

            {/* Summary stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{summary.awards_earned ?? 0}</Text>
                <Text style={styles.statLabel}>Awards</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{summary.courses_passed ?? 0}</Text>
                <Text style={styles.statLabel}>Courses Passed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{summary.target_days ?? 0}</Text>
                <Text style={styles.statLabel}>Target Days</Text>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsRow}>
              {(['overview', 'risks', 'actions'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeTab === 'overview' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Opportunities</Text>
                {opportunities.length === 0 ? (
                  <View style={styles.emptyRow}>
                    <TrendingUp size={24} color="#8A8178" />
                    <Text style={styles.emptyText}>No opportunities flagged — you are on track!</Text>
                  </View>
                ) : (
                  opportunities.map((op, i) => <OpportunityCard key={i} op={op} />)
                )}
              </View>
            )}

            {activeTab === 'risks' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Risk Flags</Text>
                {risks.length === 0 ? (
                  <View style={styles.emptyRow}>
                    <CheckCircle size={24} color="#166534" />
                    <Text style={styles.emptyText}>No risks detected — keep it up!</Text>
                  </View>
                ) : (
                  risks.map((r, i) => <RiskCard key={i} risk={r} />)
                )}
              </View>
            )}

            {activeTab === 'actions' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Recommended Actions</Text>
                {[...recommendations, ...actions.map((a: any) => a.action)].length === 0 ? (
                  <Text style={styles.emptyText}>Nothing specific right now — stay consistent!</Text>
                ) : (
                  [...recommendations, ...actions.map((a: any) => a.action)].map((r, i) => (
                    <RecommendationCard key={i} text={r} />
                  ))
                )}
              </View>
            )}
          </>
        )}
        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
  headerTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.72)', marginTop: 4, fontSize: 13, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 14, gap: 14, paddingBottom: 36 },
  gaugeCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    gap: 8,
  },
  gaugeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gaugeScore: { fontSize: 48, fontWeight: '900' },
  levelBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  levelBadgeText: { fontSize: 12, fontWeight: '800' },
  gaugeLabel: { fontSize: 12, fontWeight: '700', marginTop: -4 },
  gaugeBar: { height: 8, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden' },
  gaugeBarFill: { height: 8, borderRadius: 4 },
  card: {
    backgroundColor: '#FFFDF8',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 10,
  },
  cardTitle: { color: '#102B45', fontSize: 13, fontWeight: '900', marginBottom: 2 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownLabel: { flex: 1, color: '#374151', fontSize: 12, fontWeight: '700' },
  breakdownPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  breakdownValue: { fontSize: 11, fontWeight: '900' },
  statsGrid: {
    backgroundColor: '#FFFDF8',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#102B45', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#8A8178', fontSize: 11, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: '#EAD7C2' },
  tabsRow: { flexDirection: 'row', gap: 6 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 999, alignItems: 'center', backgroundColor: '#EAD7C2' },
  tabActive: { backgroundColor: '#102B45' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#6B3F20' },
  tabTextActive: { color: '#FFFFFF' },
  riskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  riskMessage: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 18 },
  opCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  opMessage: { flex: 1, color: '#92400E', fontSize: 12, fontWeight: '600', lineHeight: 18 },
  recoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  recoText: { flex: 1, color: '#1D4ED8', fontSize: 12, fontWeight: '600', lineHeight: 18 },
  emptyRow: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  emptyText: { color: '#8A8178', fontSize: 13, fontWeight: '700', textAlign: 'center' },
});
