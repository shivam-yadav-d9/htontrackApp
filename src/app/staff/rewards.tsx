import { router } from 'expo-router';
import { Award, Medal } from 'lucide-react-native';
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
import type { Certificate, Reward, RewardSummary } from '@/types/reward.types';

export default function StaffRewardsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<RewardSummary | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [rewardData, certificateData] = await Promise.all([
        rewardService.getMyRewards(),
        rewardService.getMyCertificates(),
      ]);
      setSummary((rewardData as any).summary ?? null);
      setRewards((rewardData as any).rewards ?? []);
      setCertificates(certificateData as Certificate[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    try { setRefreshing(true); await loadAll(); } finally { setRefreshing(false); }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Rewards</Text>
        <Text style={styles.headerSub}>Your badges, points and certificates</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {summary ? (
          <View style={styles.summaryGrid}>
            <SummaryCard label="Points" value={summary.total_points} />
            <SummaryCard label="Rewards" value={summary.total_rewards} />
            <SummaryCard label="Badges" value={summary.badges} />
            <SummaryCard label="Certificates" value={certificates.length} />
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#C95F18" />
            <Text style={styles.loadingText}>Loading rewards...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>My Rewards</Text>

            {rewards.length === 0 ? (
              <EmptyCard text="No rewards yet. Keep performing well!" />
            ) : rewards.map((item) => (
              <View key={item.id} style={styles.rewardCard}>
                <View style={styles.itemTop}>
                  <View style={styles.iconBox}>
                    <Award size={20} color="#C95F18" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemMeta}>{item.reward_type} · {item.category} · {item.points} pts</Text>
                  </View>
                  {item.badge_level ? (
                    <View style={[styles.badgeChip, badgeColor(item.badge_level)]}>
                      <Text style={styles.badgeText}>{item.badge_level}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.itemDesc}>{item.description}</Text>
                {item.awarded_by_name ? (
                  <Text style={styles.awardedBy}>Awarded by {item.awarded_by_name}</Text>
                ) : null}
              </View>
            ))}

            <Text style={styles.sectionTitle}>My Certificates</Text>

            {certificates.length === 0 ? (
              <EmptyCard text="No certificates yet. Complete courses and hit targets!" />
            ) : certificates.map((item) => (
              <View key={item.id} style={styles.certificateCard}>
                <View style={styles.itemTop}>
                  <View style={styles.certIconBox}>
                    <Medal size={20} color="#FFEAC7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.certTitle}>{item.title}</Text>
                    <Text style={styles.certMeta}>{item.certificate_type}</Text>
                  </View>
                  {item.score_percentage != null ? (
                    <View style={styles.scoreChip}>
                      <Text style={styles.scoreText}>{item.score_percentage}%</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.certDesc}>{item.description}</Text>
                <View style={styles.certNumberBox}>
                  <Text style={styles.certLabel}>Certificate No.</Text>
                  <Text style={styles.certNumber}>{item.certificate_number}</Text>
                </View>
                {item.issued_by_name ? (
                  <Text style={styles.issuedBy}>Issued by {item.issued_by_name}</Text>
                ) : null}
              </View>
            ))}
          </>
        )}

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function badgeColor(level: string): object {
  const map: Record<string, object> = {
    bronze: { backgroundColor: '#CD7F3220' },
    silver: { backgroundColor: '#C0C0C020' },
    gold: { backgroundColor: '#FFD70020' },
    platinum: { backgroundColor: '#E5E4E220' },
  };
  return map[level] ?? {};
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{text}</Text>
    </View>
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
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: {
    width: '47%',
    backgroundColor: '#FFFDF8',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAD7C2',
  },
  summaryValue: { color: '#102B45', fontSize: 26, fontWeight: '900' },
  summaryLabel: { color: '#8A8178', fontSize: 11, fontWeight: '800', marginTop: 3 },
  loadingCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: { color: '#8A8178', fontWeight: '700' },
  sectionTitle: { color: '#102B45', fontSize: 17, fontWeight: '900' },
  emptyCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAD7C2',
  },
  emptyTitle: { color: '#6B3F20', fontWeight: '700', textAlign: 'center' },
  rewardCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 8,
  },
  certificateCard: {
    backgroundColor: '#102B45',
    borderRadius: 24,
    padding: 15,
    gap: 10,
  },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  iconBox: {
    width: 44, height: 44, borderRadius: 16,
    backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center',
  },
  certIconBox: {
    width: 44, height: 44, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  itemTitle: { color: '#102B45', fontSize: 14, fontWeight: '900' },
  itemMeta: { color: '#8A8178', fontSize: 11, fontWeight: '800', marginTop: 2, textTransform: 'capitalize' },
  itemDesc: { color: '#6B3F20', fontSize: 12, fontWeight: '700' },
  awardedBy: { color: '#8A8178', fontSize: 11, fontWeight: '700' },
  badgeChip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderColor: '#EAD7C2' },
  badgeText: { color: '#C95F18', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  certTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  certMeta: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '800', marginTop: 2 },
  certDesc: { color: 'rgba(255,255,255,0.84)', fontSize: 12, fontWeight: '700' },
  scoreChip: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  scoreText: { color: '#FFEAC7', fontSize: 13, fontWeight: '900' },
  certNumberBox: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 10 },
  certLabel: { color: '#FFEAC7', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  certNumber: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', marginTop: 3 },
  issuedBy: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700' },
});
