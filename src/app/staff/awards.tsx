import { router } from 'expo-router';
import { Award, Crown, Medal, Star, Trophy } from 'lucide-react-native';
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

import { awardService } from '@/services/award.service';

const BADGE_STYLES: Record<string, { bg: string; border: string; color: string; icon: React.ReactNode }> = {
  platinum: { bg: '#F0F4FF', border: '#C7D7FF', color: '#3730A3', icon: <Crown size={16} color="#3730A3" /> },
  gold: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', icon: <Trophy size={16} color="#92400E" /> },
  silver: { bg: '#F9FAFB', border: '#D1D5DB', color: '#374151', icon: <Medal size={16} color="#374151" /> },
  bronze: { bg: '#FFF7ED', border: '#FED7AA', color: '#92400E', icon: <Award size={16} color="#92400E" /> },
};

const CATEGORY_COLORS: Record<string, string> = {
  target_award: '#C95F18',
  sales_award: '#166534',
  attendance_award: '#1D4ED8',
  learning_award: '#7C3AED',
  assignment_award: '#0E7490',
  checklist_award: '#065F46',
  task_award: '#B45309',
  coaching_award: '#9D174D',
  festival_award: '#B91C1C',
  manager_award: '#1D4ED8',
  store_award: '#6B21A8',
};

function BadgeIcon({ level }: { level: string }) {
  const s = BADGE_STYLES[level] ?? BADGE_STYLES.bronze;
  return (
    <View style={[styles.badgeIconWrap, { backgroundColor: s.bg, borderColor: s.border }]}>
      {s.icon}
    </View>
  );
}

function AwardCard({ award }: { award: any }) {
  const badgeStyle = BADGE_STYLES[award.badge_level] ?? BADGE_STYLES.bronze;
  const catColor = CATEGORY_COLORS[award.award_category] ?? '#6B3F20';
  return (
    <View style={[styles.awardCard, { borderColor: badgeStyle.border }]}>
      <View style={styles.awardCardTop}>
        <BadgeIcon level={award.badge_level} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.awardName, { color: badgeStyle.color }]}>{award.award_name}</Text>
          <Text style={[styles.awardCategory, { color: catColor }]}>
            {award.award_category.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
          </Text>
        </View>
        <View style={styles.pointsPill}>
          <Star size={11} color="#C95F18" fill="#C95F18" />
          <Text style={styles.pointsText}>{award.points} pts</Text>
        </View>
      </View>
      {award.reason ? <Text style={styles.reason}>{award.reason}</Text> : null}
      <Text style={styles.issuedAt}>
        {award.issued_by_name ?? 'System'} • {new Date(award.issued_at).toLocaleDateString()}
      </Text>
    </View>
  );
}

function LeaderboardRow({ entry }: { entry: any }) {
  const rankColors = ['#C8A24A', '#B0B8C1', '#CD7F32'];
  const rankColor = entry.rank <= 3 ? rankColors[entry.rank - 1] : '#8A8178';
  return (
    <View style={[styles.leaderRow, entry.rank === 1 && styles.leaderRowTop]}>
      <Text style={[styles.rankText, { color: rankColor }]}>#{entry.rank}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.leaderName}>{entry.staff_name}</Text>
        <Text style={styles.leaderStore}>{entry.store_name ?? entry.store_code}</Text>
      </View>
      <View style={styles.leaderRight}>
        <View style={styles.pointsPill}>
          <Star size={10} color="#C95F18" fill="#C95F18" />
          <Text style={styles.pointsText}>{entry.total_points}</Text>
        </View>
        <Text style={styles.awardCountText}>{entry.award_count} awards</Text>
      </View>
    </View>
  );
}

export default function StaffAwardsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [awardsData, setAwardsData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'awards' | 'leaderboard'>('awards');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const [myData, lbData] = await Promise.all([
        awardService.getMyAwards(),
        awardService.getMyStoreLeaderboard(),
      ]);
      setAwardsData(myData);
      setLeaderboard(lbData);
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

  const awards: any[] = awardsData?.awards ?? [];
  const goldCount = awards.filter((a) => a.badge_level === 'gold').length;
  const silverCount = awards.filter((a) => a.badge_level === 'silver').length;
  const platinumCount = awards.filter((a) => a.badge_level === 'platinum').length;

  const myRank = leaderboard?.leaderboard?.find((e: any) => awardsData?.staff_id && e.staff_id === awardsData.staff_id)?.rank;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Awards</Text>
        <Text style={styles.headerSub}>Recognition and achievements</Text>
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
            {/* Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{awardsData?.total_points ?? 0}</Text>
                  <Text style={styles.summaryLabel}>Total Points</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{awardsData?.count ?? 0}</Text>
                  <Text style={styles.summaryLabel}>Awards</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{myRank ? `#${myRank}` : '—'}</Text>
                  <Text style={styles.summaryLabel}>Store Rank</Text>
                </View>
              </View>
              <View style={styles.badgeCounts}>
                {platinumCount > 0 && (
                  <View style={[styles.levelChip, { backgroundColor: '#EEF2FF', borderColor: '#C7D7FF' }]}>
                    <Crown size={12} color="#3730A3" />
                    <Text style={[styles.levelChipText, { color: '#3730A3' }]}>{platinumCount} Platinum</Text>
                  </View>
                )}
                {goldCount > 0 && (
                  <View style={[styles.levelChip, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                    <Trophy size={12} color="#92400E" />
                    <Text style={[styles.levelChipText, { color: '#92400E' }]}>{goldCount} Gold</Text>
                  </View>
                )}
                {silverCount > 0 && (
                  <View style={[styles.levelChip, { backgroundColor: '#F9FAFB', borderColor: '#D1D5DB' }]}>
                    <Medal size={12} color="#374151" />
                    <Text style={[styles.levelChipText, { color: '#374151' }]}>{silverCount} Silver</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsRow}>
              {(['awards', 'leaderboard'] as const).map((tab) => (
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

            {/* Awards list */}
            {activeTab === 'awards' && (
              awards.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Trophy size={32} color="#8A8178" />
                  <Text style={styles.emptyTitle}>No awards yet</Text>
                  <Text style={styles.emptySub}>Keep achieving your targets to earn awards!</Text>
                </View>
              ) : (
                awards.map((award) => <AwardCard key={award.id} award={award} />)
              )
            )}

            {/* Leaderboard */}
            {activeTab === 'leaderboard' && (
              <View style={styles.leaderCard}>
                <Text style={styles.sectionTitle}>Store Leaderboard</Text>
                {(leaderboard?.leaderboard ?? []).length === 0 ? (
                  <Text style={styles.emptySub}>No leaderboard data yet.</Text>
                ) : (
                  (leaderboard?.leaderboard ?? []).map((entry: any) => (
                    <LeaderboardRow key={entry.staff_id} entry={entry} />
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
  summaryCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 12,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { color: '#102B45', fontSize: 24, fontWeight: '900' },
  summaryLabel: { color: '#8A8178', fontSize: 11, fontWeight: '700', marginTop: 2 },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#EAD7C2' },
  badgeCounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  levelChipText: { fontSize: 11, fontWeight: '800' },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: '#EAD7C2',
  },
  tabActive: { backgroundColor: '#102B45' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#6B3F20' },
  tabTextActive: { color: '#FFFFFF' },
  emptyCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#EAD7C2',
  },
  emptyTitle: { color: '#102B45', fontSize: 15, fontWeight: '900' },
  emptySub: { color: '#8A8178', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  awardCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  awardCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badgeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  awardName: { fontSize: 14, fontWeight: '900' },
  awardCategory: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E8',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pointsText: { color: '#C95F18', fontSize: 11, fontWeight: '900' },
  reason: { color: '#374151', fontSize: 12, fontWeight: '600', fontStyle: 'italic' },
  issuedAt: { color: '#8A8178', fontSize: 11, fontWeight: '700' },
  leaderCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 2,
  },
  sectionTitle: { color: '#102B45', fontSize: 14, fontWeight: '900', marginBottom: 10 },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8DE',
    gap: 10,
  },
  leaderRowTop: { backgroundColor: '#FFFBEB', borderRadius: 12, paddingHorizontal: 8, borderBottomWidth: 0, marginBottom: 2 },
  rankText: { fontSize: 16, fontWeight: '900', width: 28 },
  leaderName: { color: '#102B45', fontSize: 13, fontWeight: '800' },
  leaderStore: { color: '#8A8178', fontSize: 11, fontWeight: '700', marginTop: 1 },
  leaderRight: { alignItems: 'flex-end', gap: 4 },
  awardCountText: { color: '#8A8178', fontSize: 10, fontWeight: '700' },
});
