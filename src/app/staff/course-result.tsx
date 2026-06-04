import { router, useLocalSearchParams } from 'expo-router';
import {
  Award, CheckCircle, RotateCcw, Trophy, XCircle,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, BorderRadius, Spacing, Shadow } from '@/constants/theme';
import { courseService } from '@/services/course.service';

type ResultData = {
  passed: boolean;
  percentage: number;
  score: number;
  total_marks: number;
  correct_count: number;
  total_questions: number;
  attempt_number?: number;
  pass_percentage?: number;
  grade?: string;
  certificate_earned?: boolean;
  answers?: { question: string; selected_answer: string; correct_answer: string; is_correct: boolean; explanation?: string }[];
};

export default function CourseResultScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);

  const load = useCallback(async () => {
    if (!courseId || courseId === 'undefined') return;
    setLoading(true);
    setError(null);
    try {
      const data = await courseService.getCourseResult(courseId);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load result');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.orange} size="large" />
          <Text style={styles.loadingText}>Loading result...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !result) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? 'Result not found'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const passed = result.passed;
  const pct = Math.round(result.percentage ?? 0);
  const grade = result.grade ?? '';
  const hasCert = result.certificate_earned ?? passed;
  const answers = result.answers ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={[styles.heroCard, { backgroundColor: passed ? COLORS.success : COLORS.error }, Shadow.card]}>
          <View style={styles.heroIcon}>
            {passed
              ? <Trophy size={40} color={COLORS.white} />
              : <XCircle size={40} color={COLORS.white} />
            }
          </View>
          <Text style={styles.heroTitle}>{passed ? 'Congratulations!' : 'Better Luck Next Time'}</Text>
          <Text style={styles.heroSub}>
            {passed ? 'You have passed the assessment.' : 'You did not meet the passing score.'}
          </Text>
          <View style={styles.scoreBubble}>
            <Text style={styles.scoreNum}>{pct}%</Text>
            {grade ? <Text style={styles.scoreGrade}>{grade}</Text> : null}
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, Shadow.card]}>
          <View style={styles.statRow}>
            <StatItem label="Score" value={`${result.score ?? 0} / ${result.total_marks ?? result.total_questions ?? 0}`} />
            <View style={styles.statDivider} />
            <StatItem label="Correct" value={`${result.correct_count ?? 0} / ${result.total_questions ?? 0}`} />
            <View style={styles.statDivider} />
            <StatItem label="Pass Mark" value={`${result.pass_percentage ?? 70}%`} />
          </View>
          {result.attempt_number && (
            <Text style={styles.attemptText}>Attempt #{result.attempt_number}</Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          {hasCert && (
            <TouchableOpacity
              style={styles.certBtn}
              onPress={() => router.push({ pathname: '/staff/course-certificate', params: { courseId } })}>
              <Award size={18} color={COLORS.white} />
              <Text style={styles.certBtnText}>View Certificate</Text>
            </TouchableOpacity>
          )}

          {!passed && (
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={() => router.replace({ pathname: '/staff/course-assessment', params: { courseId } })}>
              <RotateCcw size={16} color={COLORS.orange} />
              <Text style={styles.retakeBtnText}>Retake Assessment</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push({ pathname: '/staff/course-detail', params: { id: courseId } })}>
            <Text style={styles.backBtnText}>Back to Course</Text>
          </TouchableOpacity>
        </View>

        {/* Answer review */}
        {answers.length > 0 && (
          <>
            <TouchableOpacity
              style={styles.toggleReview}
              onPress={() => setShowReview((v) => !v)}>
              <Text style={styles.toggleReviewText}>
                {showReview ? 'Hide Answer Review' : 'Show Answer Review'}
              </Text>
            </TouchableOpacity>

            {showReview && answers.map((ans, i) => (
              <View key={i} style={[styles.reviewCard, Shadow.card]}>
                <View style={styles.reviewHeader}>
                  {ans.is_correct
                    ? <CheckCircle size={16} color={COLORS.success} />
                    : <XCircle size={16} color={COLORS.error} />
                  }
                  <Text style={styles.reviewQ}>Q{i + 1}. {ans.question}</Text>
                </View>
                <View style={[styles.reviewAnswer, { backgroundColor: ans.is_correct ? COLORS.success + '15' : COLORS.error + '15' }]}>
                  <Text style={styles.reviewAnswerLabel}>Your answer:</Text>
                  <Text style={[styles.reviewAnswerText, { color: ans.is_correct ? COLORS.success : COLORS.error }]}>
                    {ans.selected_answer || '(not answered)'}
                  </Text>
                </View>
                {!ans.is_correct && (
                  <View style={[styles.reviewAnswer, { backgroundColor: COLORS.success + '15' }]}>
                    <Text style={styles.reviewAnswerLabel}>Correct answer:</Text>
                    <Text style={[styles.reviewAnswerText, { color: COLORS.success }]}>{ans.correct_answer}</Text>
                  </View>
                )}
                {ans.explanation ? (
                  <Text style={styles.explanation}>{ans.explanation}</Text>
                ) : null}
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.grayDark }}>{value}</Text>
      <Text style={{ fontSize: 11, color: COLORS.gray, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.gray },
  errorText: { fontSize: 14, color: COLORS.error, textAlign: 'center' },
  retryBtn: { backgroundColor: COLORS.orange, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: COLORS.white, fontWeight: '700' },

  content: { padding: Spacing.three, gap: Spacing.two, paddingTop: 40 },

  heroCard: {
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: 22, fontWeight: '900', color: COLORS.white },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  scoreBubble: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: BorderRadius.xlarge,
    paddingHorizontal: 24,
    paddingVertical: 10,
    alignItems: 'center',
  },
  scoreNum: { fontSize: 32, fontWeight: '900', color: COLORS.grayDark },
  scoreGrade: { fontSize: 14, fontWeight: '800', color: COLORS.orange, marginTop: -4 },

  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
  attemptText: { fontSize: 12, color: COLORS.gray, textAlign: 'center' },

  actionsCard: { gap: Spacing.two },
  certBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: BorderRadius.medium,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  certBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
  retakeBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    borderRadius: BorderRadius.medium,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  retakeBtnText: { color: COLORS.orange, fontWeight: '700', fontSize: 14 },
  backBtn: {
    borderRadius: BorderRadius.medium,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backBtnText: { color: COLORS.gray, fontWeight: '600', fontSize: 14 },

  toggleReview: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  toggleReviewText: { fontSize: 14, color: COLORS.orange, fontWeight: '700' },

  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  reviewQ: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.grayDark, lineHeight: 18 },
  reviewAnswer: { borderRadius: BorderRadius.small, padding: Spacing.two, gap: 2 },
  reviewAnswerLabel: { fontSize: 11, fontWeight: '700', color: COLORS.gray, textTransform: 'uppercase' },
  reviewAnswerText: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  explanation: { fontSize: 12, color: COLORS.gray, lineHeight: 17, fontStyle: 'italic' },
});
