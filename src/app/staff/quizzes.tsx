import { router } from 'expo-router';
import { BookOpen, CheckCircle2, Clock, XCircle } from 'lucide-react-native';
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

import { StaffPageHeader } from '@/components/StaffPageHeader';
import { AppBadge } from '@/components/ui/AppBadge';
import { AppCard } from '@/components/ui/AppCard';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { quizService } from '@/services/quiz.service';
import type { Quiz } from '@/types/quiz.types';
import { BorderRadius, COLORS, Shadow, Spacing } from '@/constants/theme';

const PRIORITY_COLOR: Record<string, string> = {
  urgent: '#B91C1C',
  high: '#92400E',
  medium: '#1D4ED8',
  low: '#6B7280',
};
const PRIORITY_BG: Record<string, string> = {
  urgent: '#FEE2E2',
  high: '#FEF3C7',
  medium: '#DBEAFE',
  low: '#F3F4F6',
};

export default function StaffQuizzesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const data = await quizService.getStaffQuizzes();
      setQuizzes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quizzes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending = quizzes.filter((q) => q.staff_status !== 'completed');
  const completed = quizzes.filter((q) => q.staff_status === 'completed');

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StaffPageHeader title="My Quizzes" />
        <LoadingState message="Loading quizzes..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StaffPageHeader title="My Quizzes" />
        <ErrorState message={error} onRetry={() => load()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StaffPageHeader
        title="My Quizzes"
        subtitle={`${pending.length} pending · ${completed.length} done`}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}>

        {quizzes.length === 0 && (
          <View style={styles.emptyState}>
            <BookOpen size={40} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No Quizzes Assigned</Text>
            <Text style={styles.emptySubtitle}>Quizzes assigned to you will appear here.</Text>
          </View>
        )}

        {pending.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Pending</Text>
            {pending.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </>
        )}

        {completed.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Completed</Text>
            {completed.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function QuizCard({ quiz }: { quiz: Quiz }) {
  const isDone = quiz.staff_status === 'completed';
  const passed = quiz.passed;
  const pct = quiz.score_percentage;
  const pri = quiz.priority ?? 'medium';

  return (
    <AppCard
      style={[styles.card, isDone && styles.cardDone]}
      onPress={() => router.push({ pathname: '/staff/quiz-attempt', params: { id: quiz.id } })}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={2}>{quiz.title}</Text>
          {isDone ? (
            passed ? (
              <CheckCircle2 size={20} color={COLORS.success} />
            ) : (
              <XCircle size={20} color={COLORS.error} />
            )
          ) : (
            <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_BG[pri] }]}>
              <Text style={[styles.priorityText, { color: PRIORITY_COLOR[pri] }]}>
                {pri.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{quiz.description}</Text>
      </View>

      <View style={styles.cardMeta}>
        {(quiz.duration_minutes ?? quiz.time_limit_minutes) ? (
          <View style={styles.metaItem}>
            <Clock size={12} color={COLORS.gray} />
            <Text style={styles.metaText}>{quiz.duration_minutes ?? quiz.time_limit_minutes} min</Text>
          </View>
        ) : null}
        <Text style={styles.dot}>•</Text>
        <Text style={styles.metaText}>{quiz.total_questions ?? quiz.questions?.length ?? 0} questions</Text>
        {(quiz.pass_percentage ?? quiz.passing_score) ? (
          <>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.metaText}>Pass {quiz.pass_percentage ?? quiz.passing_score}%</Text>
          </>
        ) : null}
        {quiz.due_date ? (
          <>
            <Text style={styles.dot}>•</Text>
            <Text style={[styles.metaText, { color: COLORS.warning }]}>Due {quiz.due_date}</Text>
          </>
        ) : null}
      </View>

      {isDone && pct != null && (
        <View style={[styles.resultRow, { backgroundColor: passed ? '#DCFCE7' : '#FEE2E2' }]}>
          <Text style={[styles.resultText, { color: passed ? COLORS.success : COLORS.error }]}>
            {passed ? 'Passed' : 'Failed'} — {pct}%
          </Text>
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { padding: Spacing.three, gap: Spacing.two },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.gray, paddingLeft: 2 },
  card: { gap: Spacing.two },
  cardDone: { opacity: 0.9 },
  cardTop: { gap: 4 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.two },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.grayDark, flex: 1 },
  cardDesc: { fontSize: 13, color: COLORS.gray, lineHeight: 18 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, color: COLORS.gray },
  dot: { fontSize: 12, color: COLORS.gray },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  resultRow: { borderRadius: BorderRadius.small, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  resultText: { fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.two },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.grayDark },
  emptySubtitle: { fontSize: 13, color: COLORS.gray, textAlign: 'center' },
});
