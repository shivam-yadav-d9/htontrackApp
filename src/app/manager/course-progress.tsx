import { router } from 'expo-router';
import { BookOpen, CheckCircle2, ChevronDown, ChevronRight, TrendingUp } from 'lucide-react-native';
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
import { ProgressBar } from '@/components/ui/ProgressBar';
import { courseService } from '@/services/course.service';
import type { CourseProgress } from '@/types/course.types';
import { BorderRadius, COLORS, Shadow, Spacing } from '@/constants/theme';

function fmt(iso: string | undefined | null) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function CourseProgressScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<{
    total_progress_records: number;
    completed: number;
    in_progress: number;
    average_progress: number;
  } | null>(null);
  const [progress, setProgress] = useState<CourseProgress[]>([]);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const data = await courseService.getManagerCourseProgress();
      setSummary(data.summary);
      setProgress(data.progress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Group by course title
  const grouped = progress.reduce<Record<string, CourseProgress[]>>((acc, p) => {
    const key = p.course_title ?? p.course_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});
  const courseKeys = Object.keys(grouped);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ManagerPageHeader title="Course Progress" showBack onBack={() => router.back()} />
        <LoadingState message="Loading progress..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ManagerPageHeader title="Course Progress" showBack onBack={() => router.back()} />
        <ErrorState message={error} onRetry={() => load()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ManagerPageHeader title="Course Progress" showBack onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}>

        {/* Summary */}
        {summary && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryVal}>{summary.total_progress_records}</Text>
                <Text style={styles.summaryLbl}>Enrolled</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={[styles.summaryVal, { color: COLORS.success }]}>{summary.completed}</Text>
                <Text style={styles.summaryLbl}>Completed</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={[styles.summaryVal, { color: COLORS.warning }]}>{summary.in_progress}</Text>
                <Text style={styles.summaryLbl}>In Progress</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={[styles.summaryVal, { color: COLORS.orange }]}>{summary.average_progress}%</Text>
                <Text style={styles.summaryLbl}>Avg</Text>
              </View>
            </View>
            <View style={styles.avgProgressRow}>
              <TrendingUp size={14} color={COLORS.orange} />
              <Text style={styles.avgLabel}>Store Average Completion</Text>
              <Text style={styles.avgVal}>{summary.average_progress}%</Text>
            </View>
            <ProgressBar value={summary.average_progress} height={6} color={COLORS.orange} />
          </View>
        )}

        {courseKeys.length === 0 && (
          <View style={styles.emptyState}>
            <BookOpen size={40} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No Progress Yet</Text>
            <Text style={styles.emptySubtitle}>Staff course progress will appear here once they start learning.</Text>
          </View>
        )}

        {courseKeys.map((courseTitle) => {
          const list = grouped[courseTitle];
          const completedCount = list.filter((p) => p.status === 'completed').length;
          const avg = Math.round(list.reduce((s, p) => s + (p.progress_percentage ?? 0), 0) / list.length);
          const isExpanded = expandedCourse === courseTitle;

          return (
            <View key={courseTitle} style={styles.courseGroup}>
              <TouchableOpacity
                style={styles.courseGroupHeader}
                onPress={() => setExpandedCourse(isExpanded ? null : courseTitle)}
                activeOpacity={0.8}>
                <View style={styles.courseGroupLeft}>
                  <Text style={styles.courseGroupTitle} numberOfLines={1}>{courseTitle}</Text>
                  <View style={styles.courseGroupMeta}>
                    <Text style={styles.metaText}>{list.length} staff</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={[styles.metaText, { color: COLORS.success }]}>{completedCount} done</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={[styles.metaText, { color: COLORS.orange }]}>{avg}% avg</Text>
                  </View>
                  <ProgressBar value={avg} height={4} color={avg >= 80 ? COLORS.success : COLORS.orange} />
                </View>
                {isExpanded ? (
                  <ChevronDown size={18} color={COLORS.gray} />
                ) : (
                  <ChevronRight size={18} color={COLORS.gray} />
                )}
              </TouchableOpacity>

              {isExpanded && list.map((p) => (
                <View key={p.id} style={styles.staffRow}>
                  <View style={styles.staffLeft}>
                    {p.status === 'completed'
                      ? <CheckCircle2 size={18} color={COLORS.success} />
                      : (
                        <View style={[styles.progressDot, { backgroundColor: p.progress_percentage > 0 ? COLORS.warning : COLORS.border }]} />
                      )
                    }
                    <View style={styles.staffInfo}>
                      <Text style={styles.staffName}>{p.staff_name ?? 'Unknown'}</Text>
                      <Text style={styles.staffMeta}>
                        {p.completed_lessons?.length ?? 0} lessons
                        {p.completed_at ? ` · Done ${fmt(p.completed_at)}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.staffRight}>
                    <Text style={[
                      styles.staffPct,
                      { color: p.status === 'completed' ? COLORS.success : p.progress_percentage > 0 ? COLORS.warning : COLORS.gray }
                    ]}>
                      {p.progress_percentage ?? 0}%
                    </Text>
                    <View style={[
                      styles.statusChip,
                      p.status === 'completed' && styles.statusDone,
                      p.status === 'in_progress' && styles.statusProgress,
                    ]}>
                      <Text style={[
                        styles.statusText,
                        p.status === 'completed' && styles.statusDoneText,
                        p.status === 'in_progress' && styles.statusProgressText,
                      ]}>
                        {p.status === 'not_started' ? 'NEW' : p.status === 'in_progress' ? 'PROGRESS' : 'DONE'}
                      </Text>
                    </View>
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
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.two,
    ...Shadow.card,
  },
  summaryRow: { flexDirection: 'row' },
  summaryBox: { flex: 1, alignItems: 'center', gap: 2 },
  summaryVal: { fontSize: 22, fontWeight: '900', color: COLORS.grayDark },
  summaryLbl: { fontSize: 11, color: COLORS.gray },
  avgProgressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  avgLabel: { flex: 1, fontSize: 12, color: COLORS.gray },
  avgVal: { fontSize: 13, fontWeight: '700', color: COLORS.orange },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.two },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.grayDark },
  emptySubtitle: { fontSize: 13, color: COLORS.gray, textAlign: 'center' },
  courseGroup: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    ...Shadow.card,
  },
  courseGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    backgroundColor: COLORS.beigeLight,
    gap: Spacing.two,
  },
  courseGroupLeft: { flex: 1, gap: 4 },
  courseGroupTitle: { fontSize: 14, fontWeight: '800', color: COLORS.grayDark },
  courseGroupMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: COLORS.gray },
  dot: { fontSize: 12, color: COLORS.gray },
  staffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  staffLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  progressDot: { width: 18, height: 18, borderRadius: 9 },
  staffInfo: { gap: 1 },
  staffName: { fontSize: 13, fontWeight: '700', color: COLORS.grayDark },
  staffMeta: { fontSize: 11, color: COLORS.gray },
  staffRight: { alignItems: 'flex-end', gap: 4 },
  staffPct: { fontSize: 14, fontWeight: '800' },
  statusChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: COLORS.grayLight,
  },
  statusDone: { backgroundColor: '#DCFCE7' },
  statusProgress: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 9, fontWeight: '800', color: COLORS.gray, textTransform: 'uppercase' },
  statusDoneText: { color: '#166534' },
  statusProgressText: { color: '#92400E' },
});
