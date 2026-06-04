import { router } from 'expo-router';
import { BookOpen, ChevronRight, Clock } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StaffPageHeader } from '@/components/StaffPageHeader';
import { AppBadge } from '@/components/ui/AppBadge';
import { AppCard } from '@/components/ui/AppCard';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { courseService } from '@/services/course.service';
import type { Course } from '@/types/course.types';
import { COLORS, Spacing } from '@/constants/theme';

type StaffStatus = 'completed' | 'in_progress' | 'not_started';
const STATUS_VARIANT: Record<StaffStatus, 'success' | 'warning' | 'gray'> = {
  completed: 'success',
  in_progress: 'warning',
  not_started: 'gray',
};
const STATUS_LABEL: Record<StaffStatus, string> = {
  completed: 'DONE',
  in_progress: 'IN PROGRESS',
  not_started: 'NEW',
};

export default function CoursesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      let data: Course[];
      try {
        data = await courseService.getStaffCoursesLMS();
      } catch {
        data = await courseService.getStaffCourses();
      }
      // Merge nested progress into top-level fields
      const normalizeStatus = (s?: string): StaffStatus => {
        if (s === 'completed') return 'completed';
        if (s === 'in_progress' || s === 'content_completed' || s === 'assessment_failed') return 'in_progress';
        return 'not_started';
      };
      const enriched = data.map((c: any) => ({
        ...c,
        progress_percentage: c.progress_percentage ?? c.progress?.progress_percentage ?? 0,
        staff_status: normalizeStatus(c.staff_status ?? c.progress?.status),
        completed_lessons: c.completed_lessons ?? c.progress?.completed_lessons ?? [],
      }));
      setCourses(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const completed = courses.filter((c) => c.staff_status === 'completed').length;
  const inProgress = courses.filter((c) => c.staff_status === 'in_progress').length;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StaffPageHeader title="My Courses" />
        <LoadingState message="Loading courses..." />
      </SafeAreaView>
    );
  }

  if (error && courses.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StaffPageHeader title="My Courses" />
        <ErrorState message={error} onRetry={() => load()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StaffPageHeader
        title="My Courses"
        subtitle={`${completed} done · ${inProgress} in progress`}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            colors={[COLORS.orange]}
          />
        }>
        {courses.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <BookOpen size={48} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No Courses Assigned</Text>
            <Text style={styles.emptySubtitle}>Check back later for new learning material.</Text>
          </View>
        )}
        {courses.map((course) => {
          const status = (course.staff_status ?? 'not_started') as StaffStatus;
          const pct = course.progress_percentage ?? 0;
          const dur = course.total_duration_minutes ?? course.estimated_duration_minutes;
          const totalLessons = course.total_lessons ?? course.lessons?.length ?? course.modules?.reduce((s, m) => s + m.lessons.length, 0) ?? 0;
          return (
            <AppCard
              key={course.id}
              style={styles.card}
              onPress={() => router.push({ pathname: '/staff/course-detail', params: { id: course.id } })}>
              <View style={styles.cardTop}>
                <Text style={styles.catLabel}>{course.category ?? course.level ?? 'Training'}</Text>
                <View style={styles.rightMeta}>
                  <AppBadge
                    label={STATUS_LABEL[status] ?? 'NEW'}
                    variant={STATUS_VARIANT[status] ?? 'gray'}
                    size="sm"
                  />
                  <ChevronRight size={16} color={COLORS.gray} />
                </View>
              </View>
              <Text style={styles.cardTitle}>{course.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{course.description}</Text>
              <ProgressBar value={pct} height={6} />
              <View style={styles.cardFooter}>
                <Text style={styles.metaText}>{pct}% complete</Text>
                {dur ? (
                  <View style={styles.metaItem}>
                    <Clock size={12} color={COLORS.gray} />
                    <Text style={styles.metaText}>{dur} min</Text>
                  </View>
                ) : totalLessons > 0 ? (
                  <Text style={styles.metaText}>{totalLessons} lessons</Text>
                ) : null}
              </View>
            </AppCard>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },
  card: { gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rightMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  catLabel: { fontSize: 11, color: COLORS.orange, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.grayDark },
  cardDesc: { fontSize: 13, color: COLORS.gray, lineHeight: 18 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.gray },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.two },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.grayDark },
  emptySubtitle: { fontSize: 14, color: COLORS.gray, textAlign: 'center' },
});
