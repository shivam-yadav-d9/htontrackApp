import { router } from 'expo-router';
import { AlertCircle, Brain, CheckCircle2, Star, TrendingUp } from 'lucide-react-native';
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

import { skillService } from '@/services/skill.service';
import type { CompetencyLevel, SkillMatrix, SkillRatingDetail } from '@/types/skill.types';

function CompetencyBanner({ level, score }: { level?: CompetencyLevel | null; score?: number }) {
  if (!level) return null;
  const map: Record<CompetencyLevel, { bg: string; border: string; text: string; label: string; icon: React.ReactNode }> = {
    excellent: { bg: '#DCFCE7', border: '#BBF7D0', text: '#166534', label: 'Excellent', icon: <Star size={15} color="#166534" /> },
    good: { bg: '#DBEAFE', border: '#C9DBEF', text: '#1D4ED8', label: 'Good', icon: <CheckCircle2 size={15} color="#1D4ED8" /> },
    needs_improvement: { bg: '#FEF3C7', border: '#FDE68A', text: '#92400E', label: 'Needs Improvement', icon: <TrendingUp size={15} color="#92400E" /> },
    critical: { bg: '#FEE2E2', border: '#FECACA', text: '#B91C1C', label: 'Critical', icon: <AlertCircle size={15} color="#B91C1C" /> },
  };
  const style = map[level];
  return (
    <View style={[styles.competencyBanner, { backgroundColor: style.bg, borderColor: style.border }]}>
      {style.icon}
      <Text style={[styles.competencyLabel, { color: style.text }]}>{style.label}</Text>
      {typeof score === 'number' && (
        <Text style={[styles.competencyScore, { color: style.text }]}>{score}%</Text>
      )}
    </View>
  );
}

function RatingDots({ rating, expected }: { rating: number; expected: number }) {
  return (
    <View style={styles.dotsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i <= rating && styles.dotFilled,
            i === expected && styles.dotExpected,
          ]}
        />
      ))}
    </View>
  );
}

export default function StaffSkillMatrixScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matrices, setMatrices] = useState<SkillMatrix[]>([]);
  const [roleMatrix, setRoleMatrix] = useState<any>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      // Try new role-based skill matrix first
      try {
        const rm = await skillService.getMyRoleSkills();
        if (rm && rm.overall_score !== undefined) {
          setRoleMatrix(rm);
          return;
        }
      } catch {
        // fall through to legacy
      }
      const data = await skillService.getMySkillMatrices();
      setMatrices(data);
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

  const rated = matrices.filter((m) => m.staff_status === 'rated');
  const pending = matrices.filter((m) => m.staff_status !== 'rated');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Skills</Text>
        <Text style={styles.headerSub}>Competency ratings from your manager</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {loading ? (
          <ActivityIndicator color="#C95F18" style={{ marginTop: 24 }} />
        ) : roleMatrix ? (
          <>
            <View style={[styles.matrixCard, { gap: 12 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.matrixTitle}>{roleMatrix.template_name ?? 'Role Skill Matrix'}</Text>
                <CompetencyBanner
                  level={roleMatrix.overall_level as CompetencyLevel}
                  score={roleMatrix.overall_score}
                />
              </View>
              <Text style={styles.matrixRole}>{roleMatrix.role_key} • {roleMatrix.department ?? ''}</Text>
              <Text style={styles.ratedAt}>Period: {roleMatrix.period_key ?? '—'}</Text>

              {(roleMatrix.skills ?? []).map((s: any) => {
                const levelColors: Record<string, string> = {
                  excellent: '#166534', good: '#1D4ED8', developing: '#92400E',
                  needs_improvement: '#C95F18', critical: '#B91C1C',
                };
                const barColor = levelColors[s.level] ?? '#C95F18';
                return (
                  <View key={s.skill_key} style={styles.skillRow}>
                    <View style={styles.skillInfo}>
                      <Text style={styles.skillTitle}>{s.skill_name}</Text>
                      <Text style={[styles.skillCategory, { color: barColor }]}>{s.level?.replace('_', ' ')}</Text>
                    </View>
                    <View style={styles.skillRatingWrap}>
                      <View style={{ width: 80, height: 6, backgroundColor: '#EAD7C2', borderRadius: 4 }}>
                        <View style={{ width: `${Math.min(s.score ?? 0, 100)}%` as any, height: 6, backgroundColor: barColor, borderRadius: 4 }} />
                      </View>
                      <Text style={[styles.ratingValue, { color: barColor }]}>{s.score}%</Text>
                    </View>
                  </View>
                );
              })}

              {(roleMatrix.recommended_coaching ?? []).length > 0 && (
                <View style={styles.remarksBox}>
                  <Text style={styles.remarksLabel}>Coaching Recommended</Text>
                  {(roleMatrix.recommended_coaching as any[]).map((rc: any) => (
                    <Text key={rc.skill_key} style={styles.remarksText}>• {rc.title} ({rc.current_score}% → {rc.target_score}%)</Text>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : matrices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Brain size={32} color="#8A8178" />
            <Text style={styles.emptyTitle}>No skill matrices assigned</Text>
            <Text style={styles.emptySub}>Your manager will assign competency frameworks soon</Text>
          </View>
        ) : (
          <>
            {rated.length > 0 && (
              <>
                <Text style={styles.groupLabel}>Rated ({rated.length})</Text>
                {rated.map((m) => {
                  const ratingById: Record<string, SkillRatingDetail> = {};
                  m.rating?.ratings?.forEach((r) => { ratingById[r.skill_id] = r; });
                  return (
                    <View key={m.id} style={styles.matrixCard}>
                      <Text style={styles.matrixTitle}>{m.title}</Text>
                      {m.role_name && <Text style={styles.matrixRole}>{m.role_name}</Text>}

                      <CompetencyBanner level={m.competency_level} score={m.score_percentage} />

                      {m.skills?.map((skill) => {
                        const detail = ratingById[skill.id];
                        const actualRating = detail?.rating ?? 0;
                        return (
                          <View key={skill.id} style={styles.skillRow}>
                            <View style={styles.skillInfo}>
                              <Text style={styles.skillTitle}>{skill.title}</Text>
                              <Text style={styles.skillCategory}>{skill.category}</Text>
                            </View>
                            <View style={styles.skillRatingWrap}>
                              <RatingDots rating={actualRating} expected={skill.expected_level} />
                              <Text style={styles.ratingValue}>{actualRating}/5</Text>
                            </View>
                          </View>
                        );
                      })}

                      {m.rating?.overall_remarks && (
                        <View style={styles.remarksBox}>
                          <Text style={styles.remarksLabel}>Manager Remarks</Text>
                          <Text style={styles.remarksText}>{m.rating.overall_remarks}</Text>
                        </View>
                      )}

                      {m.rating?.rated_at && (
                        <Text style={styles.ratedAt}>
                          Rated: {new Date(m.rating.rated_at).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </>
            )}

            {pending.length > 0 && (
              <>
                <Text style={styles.groupLabel}>Pending Rating ({pending.length})</Text>
                {pending.map((m) => (
                  <View key={m.id} style={[styles.matrixCard, styles.matrixCardPending]}>
                    <Text style={styles.matrixTitle}>{m.title}</Text>
                    {m.role_name && <Text style={styles.matrixRole}>{m.role_name}</Text>}
                    <View style={styles.pendingBanner}>
                      <Brain size={14} color="#8A8178" />
                      <Text style={styles.pendingText}>Awaiting manager rating</Text>
                    </View>
                    <Text style={styles.skillCount}>{m.total_skills} skills defined</Text>
                  </View>
                ))}
              </>
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
  content: { padding: 16, gap: 14, paddingBottom: 36 },
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
  groupLabel: { color: '#102B45', fontSize: 13, fontWeight: '900', paddingLeft: 4 },
  matrixCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 10,
  },
  matrixCardPending: { opacity: 0.8 },
  matrixTitle: { color: '#102B45', fontSize: 15, fontWeight: '900' },
  matrixRole: { color: '#C95F18', fontSize: 12, fontWeight: '700' },
  competencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
  },
  competencyLabel: { flex: 1, fontSize: 13, fontWeight: '900' },
  competencyScore: { fontSize: 18, fontWeight: '900' },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8DE',
  },
  skillInfo: { flex: 1 },
  skillTitle: { color: '#102B45', fontSize: 13, fontWeight: '800' },
  skillCategory: { color: '#8A8178', fontSize: 11, fontWeight: '700', marginTop: 2 },
  skillRatingWrap: { alignItems: 'flex-end', gap: 4 },
  dotsRow: { flexDirection: 'row', gap: 5 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EAD7C2',
    borderWidth: 1,
    borderColor: '#D4B896',
  },
  dotFilled: { backgroundColor: '#C95F18', borderColor: '#C95F18' },
  dotExpected: { borderWidth: 2, borderColor: '#102B45' },
  ratingValue: { color: '#6B3F20', fontSize: 11, fontWeight: '900' },
  remarksBox: {
    backgroundColor: '#FFF3E8',
    borderRadius: 14,
    padding: 11,
  },
  remarksLabel: { color: '#C95F18', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  remarksText: { color: '#102B45', fontSize: 12, fontWeight: '700', marginTop: 4 },
  ratedAt: { color: '#8A8178', fontSize: 11, fontWeight: '700' },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 10,
  },
  pendingText: { color: '#6B7280', fontSize: 12, fontWeight: '700' },
  skillCount: { color: '#8A8178', fontSize: 12, fontWeight: '700' },
});
