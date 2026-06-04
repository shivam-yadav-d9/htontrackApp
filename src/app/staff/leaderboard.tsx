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

export default function StaffLeaderboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardRow | null>(null);

  useEffect(() => { loadLeaderboard(); }, []);

  async function loadLeaderboard() {
    try {
      setLoading(true);
      const data = await rewardService.getStaffLeaderboard() as any;
      setRows(data.leaderboard ?? []);
      setMyRank(data.my_rank ?? null);
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
        <Text style={styles.headerTitle}>Store Leaderboard</Text>
        <Text style={styles.headerSub}>Your rank among store colleagues</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {myRank ? (
          <View style={styles.myRankCard}>
            <View style={styles.myRankTop}>
              <Text style={styles.myRankLabel}>My Rank</Text>
              <View style={styles.myRankBadge}>
                <Text style={styles.myRankNumber}>#{myRank.rank}</Text>
              </View>
            </View>
            <Text style={styles.myRankScore}>{myRank.total_score} points</Text>
            <LevelChip level={myRank.level} />
            <View style={styles.myBreakdown}>
              {[
                { label: 'Rewards', value: myRank.reward_points },
                { label: 'Quiz', value: myRank.quiz_points },
                { label: 'Course', value: myRank.course_points },
                { label: 'Skills', value: myRank.skill_points },
                { label: 'Target', value: myRank.target_points },
                { label: 'Certs', value: myRank.certificate_points },
              ].map((b) => (
                <View key={b.label} style={styles.myBreakdownItem}>
                  <Text style={styles.myBreakdownValue}>{b.value}</Text>
                  <Text style={styles.myBreakdownLabel}>{b.label}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>All Rankings</Text>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#C95F18" />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.emptyCard}>
            <Trophy size={36} color="#C95F18" />
            <Text style={styles.emptyTitle}>No rankings yet</Text>
            <Text style={styles.emptyText}>Earn points by completing courses, quizzes, and hitting targets!</Text>
          </View>
        ) : (
          rows.map((row) => (
            <View
              key={row.staff_id}
              style={[
                styles.rowCard,
                row.is_me && styles.rowCardMe,
                row.rank <= 3 && !row.is_me && styles.rowCardTop,
              ]}
            >
              <View style={styles.rowMain}>
                <RankBadge rank={row.rank} />
                <View style={styles.rowInfo}>
                  <View style={styles.rowNameRow}>
                    <Text style={[styles.rowName, row.is_me && styles.rowNameMe]}>
                      {row.staff_name ?? '—'}
                    </Text>
                    {row.is_me && (
                      <View style={styles.meChip}>
                        <Text style={styles.meChipText}>You</Text>
                      </View>
                    )}
                  </View>
                  {row.employee_code ? <Text style={styles.rowEmp}>{row.employee_code}</Text> : null}
                </View>
                <View style={styles.rowScoreBlock}>
                  <Text style={[styles.rowScore, row.is_me && styles.rowScoreMe]}>{row.total_score}</Text>
                  <Text style={styles.rowScorePts}>pts</Text>
                </View>
              </View>
              <LevelChip level={row.level} />
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
  myRankCard: {
    backgroundColor: '#C95F18',
    borderRadius: 28,
    padding: 20,
    gap: 10,
  },
  myRankTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  myRankLabel: { color: '#FFEAC7', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  myRankBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  myRankNumber: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  myRankScore: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
  myBreakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  myBreakdownItem: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 48,
  },
  myBreakdownValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  myBreakdownLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 9, fontWeight: '800', marginTop: 1 },
  sectionTitle: { color: '#102B45', fontSize: 17, fontWeight: '900' },
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
    borderRadius: 20,
    padding: 13,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 8,
  },
  rowCardMe: { backgroundColor: '#FFF3E8', borderColor: '#C95F18', borderWidth: 2 },
  rowCardTop: { borderColor: '#F6A15A', borderWidth: 2 },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankBadge: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center',
  },
  rankBadgeText: { color: '#C95F18', fontSize: 13, fontWeight: '900' },
  rowInfo: { flex: 1 },
  rowNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowName: { color: '#102B45', fontSize: 14, fontWeight: '900' },
  rowNameMe: { color: '#C95F18' },
  meChip: {
    backgroundColor: '#C95F18',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  meChipText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  rowEmp: { color: '#8A8178', fontSize: 11, fontWeight: '700', marginTop: 1 },
  rowScoreBlock: { alignItems: 'flex-end' },
  rowScore: { color: '#102B45', fontSize: 18, fontWeight: '900' },
  rowScoreMe: { color: '#C95F18' },
  rowScorePts: { color: '#8A8178', fontSize: 10, fontWeight: '700' },
  levelChip: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  levelText: { fontSize: 11, fontWeight: '900' },
});
