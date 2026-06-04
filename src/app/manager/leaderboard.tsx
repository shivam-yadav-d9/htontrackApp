import { router } from 'expo-router';
import { Crown, Medal, Trophy } from 'lucide-react-native';
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

import { rewardService } from '@/services/reward.service';
import type { LeaderboardRow } from '@/types/reward.types';

const LEVEL_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  Platinum: { bg: '#E5E4E2', color: '#374151', border: '#C9C8C6' },
  Gold: { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
  Silver: { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' },
  Bronze: { bg: '#FFF3E8', color: '#C95F18', border: '#EAD7C2' },
};

function LevelChip({ level }: { level: string }) {
  const c = LEVEL_COLORS[level] ?? LEVEL_COLORS.Bronze;
  return (
    <View style={[styles.levelChip, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.levelText, { color: c.color }]}>{level}</Text>
    </View>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={22} color="#F59E0B" />;
  if (rank === 2) return <Trophy size={22} color="#94A3B8" />;
  if (rank === 3) return <Medal size={22} color="#CD7F32" />;
  return (
    <View style={styles.rankBadge}>
      <Text style={styles.rankBadgeText}>#{rank}</Text>
    </View>
  );
}

export default function ManagerLeaderboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [topPerformer, setTopPerformer] = useState<LeaderboardRow | null>(null);

  useEffect(() => { loadLeaderboard(); }, []);

  async function loadLeaderboard() {
    try {
      setLoading(true);
      const data = await rewardService.getManagerLeaderboard() as any;
      setRows(data.leaderboard ?? []);
      setTopPerformer(data.top_performer ?? null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    try { setRefreshing(true); await loadLeaderboard(); } finally { setRefreshing(false); }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSub}>Store performance ranking</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {topPerformer ? (
          <View style={styles.heroCard}>
            <Crown size={34} color="#FFEAC7" />
            <Text style={styles.heroLabel}>Top Performer</Text>
            <Text style={styles.heroName}>{topPerformer.staff_name}</Text>
            <Text style={styles.heroScore}>{topPerformer.total_score} pts · {topPerformer.level}</Text>
            {topPerformer.employee_code ? (
              <Text style={styles.heroEmp}>{topPerformer.employee_code}</Text>
            ) : null}
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#C95F18" />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.emptyCard}>
            <Trophy size={36} color="#C95F18" />
            <Text style={styles.emptyTitle}>No leaderboard data yet</Text>
            <Text style={styles.emptyText}>Staff performance data will appear here as activities are recorded.</Text>
          </View>
        ) : (
          rows.map((row) => (
            <View key={row.staff_id} style={[styles.rowCard, row.rank <= 3 && styles.rowCardTop]}>
              <View style={styles.rowLeft}>
                <RankBadge rank={row.rank} />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{row.staff_name ?? '—'}</Text>
                  <Text style={styles.rowEmp}>{row.employee_code ?? ''}</Text>
                </View>
              </View>

              <View style={styles.rowRight}>
                <Text style={styles.rowScore}>{row.total_score} pts</Text>
                <LevelChip level={row.level} />
              </View>

              <View style={styles.breakdown}>
                {[
                  { label: 'Rewards', value: row.reward_points },
                  { label: 'Quiz', value: row.quiz_points },
                  { label: 'Course', value: row.course_points },
                  { label: 'Skills', value: row.skill_points },
                  { label: 'Target', value: row.target_points },
                  { label: 'Certs', value: row.certificate_points },
                ].map((b) => (
                  <View key={b.label} style={styles.breakdownItem}>
                    <Text style={styles.breakdownValue}>{b.value}</Text>
                    <Text style={styles.breakdownLabel}>{b.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
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
  headerTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.72)', marginTop: 4, fontSize: 13, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 36 },
  heroCard: {
    backgroundColor: '#C95F18',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  heroLabel: { color: '#FFEAC7', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  heroName: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 4 },
  heroScore: { color: 'rgba(255,255,255,0.84)', fontSize: 14, fontWeight: '700' },
  heroEmp: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700' },
  loadingCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: { color: '#8A8178', fontWeight: '700' },
  emptyCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#EAD7C2',
  },
  emptyTitle: { color: '#102B45', fontSize: 16, fontWeight: '900' },
  emptyText: { color: '#6B3F20', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  rowCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 10,
  },
  rowCardTop: { borderColor: '#F6A15A', borderWidth: 2 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankBadge: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center',
  },
  rankBadgeText: { color: '#C95F18', fontSize: 13, fontWeight: '900' },
  rowInfo: { flex: 1 },
  rowName: { color: '#102B45', fontSize: 15, fontWeight: '900' },
  rowEmp: { color: '#8A8178', fontSize: 11, fontWeight: '700', marginTop: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  rowScore: { color: '#C95F18', fontSize: 18, fontWeight: '900' },
  levelChip: {
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1,
  },
  levelText: { fontSize: 11, fontWeight: '900' },
  breakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  breakdownItem: {
    backgroundColor: '#F6EBDC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 48,
  },
  breakdownValue: { color: '#102B45', fontSize: 13, fontWeight: '900' },
  breakdownLabel: { color: '#8A8178', fontSize: 9, fontWeight: '800', marginTop: 1 },
});
