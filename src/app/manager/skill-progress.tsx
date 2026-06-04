import { router } from 'expo-router';
import { AlertCircle, BarChart3, Brain, Star, TrendingUp, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { skillService } from '@/services/skill.service';
import { managerTeamService } from '@/services/manager-team.service';
import type { SkillMatrix, SkillProgressResponse, CompetencyLevel } from '@/types/skill.types';

function CompetencyChip({ level }: { level?: CompetencyLevel | null }) {
  if (!level) return null;
  const map: Record<CompetencyLevel, { bg: string; text: string; label: string }> = {
    excellent: { bg: '#DCFCE7', text: '#166534', label: 'Excellent' },
    good: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Good' },
    needs_improvement: { bg: '#FEF3C7', text: '#92400E', label: 'Needs Work' },
    critical: { bg: '#FEE2E2', text: '#B91C1C', label: 'Critical' },
  };
  const style = map[level];
  return (
    <View style={[styles.competencyChip, { backgroundColor: style.bg }]}>
      <Text style={[styles.competencyText, { color: style.text }]}>{style.label}</Text>
    </View>
  );
}

export default function SkillProgressScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState<SkillProgressResponse | null>(null);
  const [matrices, setMatrices] = useState<SkillMatrix[]>([]);
  const [teamStaff, setTeamStaff] = useState<{ id: string; full_name: string; employee_code?: string }[]>([]);

  // Rate staff form state
  const [selectedMatrix, setSelectedMatrix] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [overallRemarks, setOverallRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [prog, mats, team] = await Promise.all([
        skillService.getManagerSkillProgress(),
        skillService.getManagerSkillMatrices(),
        managerTeamService.getTeam(),
      ]);
      setProgress(prog);
      setMatrices(mats);
      setTeamStaff((team as any).staff ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  async function submitRating() {
    if (!selectedMatrix || !selectedStaff) {
      Alert.alert('Required', 'Select a matrix and a staff member.');
      return;
    }
    const matrix = matrices.find((m) => m.id === selectedMatrix);
    if (!matrix) return;

    const ratingPayload = matrix.skills.map((s) => ({
      skill_id: s.id,
      rating: parseInt(ratings[s.id] ?? '3', 10),
    }));

    const invalidRating = ratingPayload.find((r) => isNaN(r.rating) || r.rating < 1 || r.rating > 5);
    if (invalidRating) {
      Alert.alert('Invalid', 'All skill ratings must be between 1 and 5.');
      return;
    }

    try {
      setSubmitting(true);
      await skillService.rateStaffSkills(selectedMatrix, {
        staff_id: selectedStaff,
        ratings: ratingPayload,
        overall_remarks: overallRemarks.trim() || undefined,
      });
      Alert.alert('Saved', 'Skill ratings submitted successfully.');
      setRatings({});
      setOverallRemarks('');
      await refresh();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit ratings.');
    } finally {
      setSubmitting(false);
    }
  }

  const currentMatrix = matrices.find((m) => m.id === selectedMatrix);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Skill Progress</Text>
        <Text style={styles.headerSub}>Rate staff competencies and track growth</Text>
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
            {/* Summary Grid */}
            {progress && (
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Users size={18} color="#1D4ED8" />
                  <Text style={styles.summaryValue}>{progress.summary.total_rated_staff}</Text>
                  <Text style={styles.summaryLabel}>Rated Staff</Text>
                </View>
                <View style={styles.summaryCard}>
                  <TrendingUp size={18} color="#166534" />
                  <Text style={styles.summaryValue}>{progress.summary.average_score}%</Text>
                  <Text style={styles.summaryLabel}>Avg Score</Text>
                </View>
                <View style={styles.summaryCard}>
                  <AlertCircle size={18} color="#B91C1C" />
                  <Text style={styles.summaryValue}>{progress.summary.low_skill_staff}</Text>
                  <Text style={styles.summaryLabel}>Needs Help</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Star size={18} color="#C95F18" />
                  <Text style={styles.summaryValue}>{progress.summary.excellent_staff}</Text>
                  <Text style={styles.summaryLabel}>Excellent</Text>
                </View>
              </View>
            )}

            {/* Rate Staff Form */}
            <View style={styles.rateCard}>
              <View style={styles.rateCardHeader}>
                <Brain size={18} color="#C95F18" />
                <Text style={styles.rateCardTitle}>Rate Staff Skills</Text>
              </View>

              <Text style={styles.fieldLabel}>Select Matrix</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {matrices.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.chip, selectedMatrix === m.id && styles.chipActive]}
                      onPress={() => { setSelectedMatrix(m.id); setRatings({}); }}
                    >
                      <Text style={[styles.chipText, selectedMatrix === m.id && styles.chipTextActive]} numberOfLines={1}>
                        {m.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.fieldLabel}>Select Staff</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {teamStaff.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.chip, selectedStaff === s.id && styles.chipActive]}
                      onPress={() => setSelectedStaff(s.id)}
                    >
                      <Text style={[styles.chipText, selectedStaff === s.id && styles.chipTextActive]} numberOfLines={1}>
                        {s.full_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {currentMatrix && currentMatrix.skills.map((skill) => (
                <View key={skill.id} style={styles.skillRatingRow}>
                  <Text style={styles.skillRatingTitle} numberOfLines={2}>{skill.title}</Text>
                  <TextInput
                    style={styles.ratingInput}
                    value={ratings[skill.id] ?? ''}
                    onChangeText={(v) => setRatings((prev) => ({ ...prev, [skill.id]: v }))}
                    placeholder="1–5"
                    placeholderTextColor="#8A8178"
                    keyboardType="number-pad"
                    maxLength={1}
                  />
                </View>
              ))}

              {currentMatrix && (
                <>
                  <Text style={styles.fieldLabel}>Overall Remarks</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={overallRemarks}
                    onChangeText={setOverallRemarks}
                    placeholder="Optional remarks..."
                    placeholderTextColor="#8A8178"
                    multiline
                  />

                  <TouchableOpacity
                    style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                    onPress={submitRating}
                    disabled={submitting}
                  >
                    <Text style={styles.submitText}>{submitting ? 'Saving...' : 'Submit Ratings'}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Rated Staff List */}
            {progress && progress.ratings.length > 0 && (
              <View style={styles.ratingsSection}>
                <View style={styles.sectionRow}>
                  <BarChart3 size={16} color="#C95F18" />
                  <Text style={styles.sectionTitle}>Recent Ratings ({progress.ratings.length})</Text>
                </View>

                {progress.ratings.map((r) => {
                  const staff = teamStaff.find((s) => s.id === r.staff_id);
                  const matrix = matrices.find((m) => m.id === r.matrix_id);
                  return (
                    <View key={r.id} style={styles.ratingCard}>
                      <View style={styles.ratingTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.ratingName}>{staff?.full_name ?? r.staff_id}</Text>
                          <Text style={styles.ratingMatrix}>{matrix?.title ?? r.matrix_id}</Text>
                        </View>
                        <CompetencyChip level={r.competency_level} />
                      </View>
                      <View style={styles.ratingMeta}>
                        <Text style={styles.ratingScore}>{r.score_percentage}%</Text>
                        <Text style={styles.ratingDetailText}>
                          {r.low_skill_count} low · {r.high_skill_count} high
                        </Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${r.score_percentage}%` as any,
                              backgroundColor:
                                r.score_percentage >= 80
                                  ? '#166534'
                                  : r.score_percentage >= 60
                                  ? '#1D4ED8'
                                  : r.score_percentage >= 40
                                  ? '#D97706'
                                  : '#B91C1C',
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {progress && progress.ratings.length === 0 && (
              <View style={styles.emptyCard}>
                <Brain size={28} color="#8A8178" />
                <Text style={styles.emptyTitle}>No ratings yet</Text>
                <Text style={styles.emptySub}>Use the form above to rate staff skills</Text>
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
  content: { padding: 16, gap: 14, paddingBottom: 36 },
  summaryGrid: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFDF8',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#EAD7C2',
  },
  summaryValue: { color: '#102B45', fontSize: 18, fontWeight: '900' },
  summaryLabel: { color: '#8A8178', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  rateCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 10,
  },
  rateCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  rateCardTitle: { color: '#102B45', fontSize: 15, fontWeight: '900' },
  fieldLabel: { color: '#6B3F20', fontSize: 12, fontWeight: '800' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#102B45', borderColor: '#102B45' },
  chipText: { color: '#4B5563', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#FFFFFF' },
  skillRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9F5F0',
    borderRadius: 12,
    padding: 10,
  },
  skillRatingTitle: { flex: 1, color: '#102B45', fontSize: 13, fontWeight: '800' },
  ratingInput: {
    width: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#102B45',
    fontWeight: '900',
    fontSize: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: '#102B45',
    fontWeight: '700',
    fontSize: 14,
  },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: '#102B45',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  ratingsSection: { gap: 10 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4 },
  sectionTitle: { color: '#102B45', fontSize: 15, fontWeight: '900' },
  ratingCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 8,
  },
  ratingTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ratingName: { color: '#102B45', fontSize: 14, fontWeight: '900' },
  ratingMatrix: { color: '#8A8178', fontSize: 12, fontWeight: '700', marginTop: 2 },
  ratingMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ratingScore: { color: '#102B45', fontSize: 20, fontWeight: '900' },
  ratingDetailText: { color: '#8A8178', fontSize: 12, fontWeight: '700' },
  progressTrack: {
    height: 6,
    backgroundColor: '#EAD7C2',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 999 },
  competencyChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  competencyText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
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
});
