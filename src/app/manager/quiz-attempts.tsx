import { router } from 'expo-router';
import { CheckCircle2, ChevronDown, ChevronRight, Users, XCircle } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ManagerPageHeader } from '@/components/ManagerPageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { quizService } from '@/services/quiz.service';
import type { QuizAttempt } from '@/types/quiz.types';
import { BorderRadius, COLORS, Shadow, Spacing } from '@/constants/theme';

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function QuizAttemptsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const data = await quizService.getManagerAttempts();
      setAttempts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attempts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Group attempts by quiz title
  const grouped = attempts.reduce<Record<string, QuizAttempt[]>>((acc, a) => {
    const key = a.quiz_title ?? a.quiz_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const quizKeys = Object.keys(grouped);

  const summary = {
    total: attempts.length,
    passed: attempts.filter((a) => a.passed).length,
    avgScore: attempts.length
      ? Math.round(attempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / attempts.length)
      : 0,
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ManagerPageHeader title="Quiz Attempts" showBack onBack={() => router.back()} />
        <LoadingState message="Loading attempts..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ManagerPageHeader title="Quiz Attempts" showBack onBack={() => router.back()} />
        <ErrorState message={error} onRetry={() => load()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ManagerPageHeader title="Quiz Attempts" showBack onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}>

        {/* Summary row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryVal}>{summary.total}</Text>
            <Text style={styles.summaryLbl}>Total</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={[styles.summaryVal, { color: COLORS.success }]}>{summary.passed}</Text>
            <Text style={styles.summaryLbl}>Passed</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={[styles.summaryVal, { color: summary.total - summary.passed > 0 ? COLORS.error : COLORS.gray }]}>
              {summary.total - summary.passed}
            </Text>
            <Text style={styles.summaryLbl}>Failed</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={[styles.summaryVal, { color: COLORS.orange }]}>{summary.avgScore}%</Text>
            <Text style={styles.summaryLbl}>Avg Score</Text>
          </View>
        </View>

        {quizKeys.length === 0 && (
          <View style={styles.emptyState}>
            <Users size={40} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No Attempts Yet</Text>
            <Text style={styles.emptySubtitle}>Staff quiz attempts will appear here once submitted.</Text>
          </View>
        )}

        {quizKeys.map((quizTitle) => {
          const list = grouped[quizTitle];
          const passCount = list.filter((a) => a.passed).length;
          const avg = Math.round(list.reduce((s, a) => s + (a.percentage ?? 0), 0) / list.length);
          const isExpanded = expandedId === quizTitle;
          return (
            <View key={quizTitle} style={styles.quizGroup}>
              <TouchableOpacity
                style={styles.quizGroupHeader}
                onPress={() => setExpandedId(isExpanded ? null : quizTitle)}
                activeOpacity={0.8}>
                <View style={styles.quizGroupLeft}>
                  <Text style={styles.quizGroupTitle} numberOfLines={1}>{quizTitle}</Text>
                  <View style={styles.quizGroupMeta}>
                    <Text style={styles.metaText}>{list.length} attempts</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={[styles.metaText, { color: COLORS.success }]}>{passCount} passed</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={[styles.metaText, { color: COLORS.orange }]}>{avg}% avg</Text>
                  </View>
                </View>
                {isExpanded ? (
                  <ChevronDown size={18} color={COLORS.gray} />
                ) : (
                  <ChevronRight size={18} color={COLORS.gray} />
                )}
              </TouchableOpacity>

              {isExpanded && list.map((attempt) => (
                <View key={attempt.id} style={styles.attemptRow}>
                  <View style={styles.attemptLeft}>
                    {attempt.passed ? (
                      <CheckCircle2 size={18} color={COLORS.success} />
                    ) : (
                      <XCircle size={18} color={COLORS.error} />
                    )}
                    <View style={styles.attemptInfo}>
                      <Text style={styles.staffName}>{attempt.staff_name ?? 'Unknown'}</Text>
                      <Text style={styles.attemptDate}>{fmt(attempt.submitted_at)}</Text>
                    </View>
                  </View>
                  <View style={styles.attemptRight}>
                    <Text style={[styles.attemptScore, { color: attempt.passed ? COLORS.success : COLORS.error }]}>
                      {attempt.percentage ?? 0}%
                    </Text>
                    {attempt.earned_points != null && attempt.total_points != null && (
                      <Text style={styles.attemptPoints}>
                        {attempt.earned_points}/{attempt.total_points} pts
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { padding: Spacing.three, gap: Spacing.two },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: 0,
    ...Shadow.card,
  },
  summaryBox: { flex: 1, alignItems: 'center', gap: 2 },
  summaryVal: { fontSize: 22, fontWeight: '900', color: COLORS.grayDark },
  summaryLbl: { fontSize: 11, color: COLORS.gray },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.two },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.grayDark },
  emptySubtitle: { fontSize: 13, color: COLORS.gray, textAlign: 'center' },
  quizGroup: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    ...Shadow.card,
  },
  quizGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    backgroundColor: COLORS.beigeLight,
  },
  quizGroupLeft: { flex: 1, gap: 2 },
  quizGroupTitle: { fontSize: 14, fontWeight: '800', color: COLORS.grayDark },
  quizGroupMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: COLORS.gray },
  dot: { fontSize: 12, color: COLORS.gray },
  attemptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  attemptLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  attemptInfo: { gap: 2 },
  staffName: { fontSize: 13, fontWeight: '700', color: COLORS.grayDark },
  attemptDate: { fontSize: 11, color: COLORS.gray },
  attemptRight: { alignItems: 'flex-end', gap: 2 },
  attemptScore: { fontSize: 15, fontWeight: '800' },
  attemptPoints: { fontSize: 11, color: COLORS.gray },
});
