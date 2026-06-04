import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft, Award, BookOpen, CheckCircle, ChevronRight,
  Clock, Lock, Play, Trophy,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, BorderRadius, Spacing, Shadow } from '@/constants/theme';
import { courseService } from '@/services/course.service';
import type { Course } from '@/types/course.types';

const DIFF_COLOR: Record<string, string> = {
  beginner: COLORS.success,
  intermediate: COLORS.warning,
  advanced: COLORS.error,
};

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!id || id === 'undefined') return;
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await courseService.getStaffCourseLMS(id);
      setCourse(data);
    } catch {
      try {
        const data = await courseService.getStaffCourse(id);
        setCourse(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleStart() {
    if (!course) return;
    setStarting(true);
    try {
      await courseService.startCourseLMS(course.id);
      const updated = await courseService.getStaffCourseLMS(course.id);
      setCourse(updated);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to start');
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.orange} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? 'Course not found'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // LMS flat-lessons course
  const isLMS = Array.isArray(course.lessons) && course.lessons.length > 0 && !course.modules?.length;

  if (isLMS) {
    const lessons = course.lessons ?? [];
    const completedIds = course.completed_lessons ?? [];
    const pct = course.progress_percentage ?? 0;
    const allDone = pct >= 100;
    const status = course.staff_status ?? 'not_started';
    const notStarted = status === 'not_started';
    const isCompleted = status === 'completed';
    const difficulty = (course as any).difficulty ?? course.level ?? 'beginner';
    const dur = (course as any).duration_minutes ?? course.total_duration_minutes ?? 0;
    const pass = (course as any).pass_percentage ?? 70;

    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={2}>{course.title}</Text>
            <Text style={styles.headerSub}>
              {(course as any).category ?? difficulty ?? 'Training'}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true); }}
              colors={[COLORS.orange]}
            />
          }>

          {/* Info card */}
          <View style={[styles.card, Shadow.card]}>
            <View style={styles.metaRow}>
              {difficulty ? (
                <View style={[styles.diffBadge, { backgroundColor: (DIFF_COLOR[difficulty] ?? COLORS.gray) + '22' }]}>
                  <Text style={[styles.diffText, { color: DIFF_COLOR[difficulty] ?? COLORS.gray }]}>
                    {difficulty}
                  </Text>
                </View>
              ) : null}
              {dur > 0 && (
                <View style={styles.metaItem}>
                  <Clock size={13} color={COLORS.gray} />
                  <Text style={styles.metaText}>{dur} min</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <BookOpen size={13} color={COLORS.gray} />
                <Text style={styles.metaText}>{lessons.length} lessons</Text>
              </View>
            </View>

            {course.description ? (
              <Text style={styles.description}>{course.description}</Text>
            ) : null}

            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>
                {completedIds.length}/{lessons.length} lessons · {pct}%
              </Text>
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>Completed</Text>
                </View>
              )}
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%` as `${number}%` }]} />
            </View>

            <Text style={styles.passNote}>Pass score: {pass}%</Text>

            {notStarted && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleStart}
                disabled={starting}>
                {starting
                  ? <ActivityIndicator color={COLORS.white} />
                  : <>
                      <Play size={16} color={COLORS.white} />
                      <Text style={styles.primaryBtnText}>Start Course</Text>
                    </>
                }
              </TouchableOpacity>
            )}
          </View>

          {/* Lessons */}
          <Text style={styles.sectionTitle}>Lessons</Text>
          {lessons.map((lesson, idx) => {
            const isDone = completedIds.includes(lesson.id);
            const isLocked = notStarted;
            return (
              <TouchableOpacity
                key={lesson.id}
                style={[styles.lessonRow, Shadow.card]}
                disabled={isLocked}
                onPress={() =>
                  router.push({
                    pathname: '/staff/course-reading',
                    params: { courseId: course.id, lessonId: lesson.id },
                  })
                }>
                <View style={[
                  styles.lessonNum,
                  { backgroundColor: isDone ? COLORS.success + '22' : COLORS.orangeLight },
                ]}>
                  {isDone
                    ? <CheckCircle size={16} color={COLORS.success} />
                    : <Text style={styles.lessonNumText}>{idx + 1}</Text>
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.lessonTitle, isDone && { color: COLORS.gray }]}>
                    {lesson.title}
                  </Text>
                  <Text style={styles.lessonMeta}>
                    {(lesson as any).estimated_minutes ?? lesson.duration_minutes ?? 5} min
                  </Text>
                </View>
                {isLocked
                  ? <Lock size={14} color={COLORS.gray} />
                  : isDone
                    ? <View style={styles.doneChip}><Text style={styles.doneChipText}>Done</Text></View>
                    : <ChevronRight size={16} color={COLORS.gray} />
                }
              </TouchableOpacity>
            );
          })}

          {/* Assessment section */}
          <View style={[styles.assessmentCard, Shadow.card]}>
            <View style={styles.assessmentHeader}>
              <Trophy size={20} color={allDone ? COLORS.orange : COLORS.gray} />
              <View style={{ flex: 1 }}>
                <Text style={styles.assessmentTitle}>Final Assessment</Text>
                <Text style={styles.assessmentSub}>
                  {allDone
                    ? isCompleted
                      ? 'Assessment completed'
                      : 'Ready to take the test!'
                    : `Complete all lessons to unlock (${pct}% done)`
                  }
                </Text>
              </View>
              {!allDone && <Lock size={16} color={COLORS.gray} />}
            </View>
            {allDone && !isCompleted && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() =>
                  router.push({ pathname: '/staff/course-assessment', params: { courseId: course.id } })
                }>
                <Play size={16} color={COLORS.white} />
                <Text style={styles.primaryBtnText}>Take Assessment</Text>
              </TouchableOpacity>
            )}
            {isCompleted && (
              <View style={styles.completedRow}>
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() =>
                    router.push({ pathname: '/staff/course-result', params: { courseId: course.id } })
                  }>
                  <Text style={styles.outlineBtnText}>View Result</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() =>
                    router.push({ pathname: '/staff/course-certificate', params: { courseId: course.id } })
                  }>
                  <Award size={16} color={COLORS.white} />
                  <Text style={styles.primaryBtnText}>Certificate</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Legacy DB modules fallback
  const pct = course.progress_percentage ?? 0;
  const notStarted = course.progress_status === 'not_started';
  const totalLessons = course.modules?.reduce((s, m) => s + m.lessons.length, 0) ?? 0;
  const completedCount = course.modules?.reduce((s, m) => s + m.lessons.filter((l) => l.is_completed).length, 0) ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={2}>{course.title}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, Shadow.card]}>
          {course.description ? <Text style={styles.description}>{course.description}</Text> : null}
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>{completedCount}/{totalLessons} · {pct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` as `${number}%` }]} />
          </View>
          {notStarted && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={async () => {
                try { await courseService.startCourse(id); const u = await courseService.getCourse(id); setCourse(u); }
                catch (err) { Alert.alert('Error', String(err)); }
              }}>
              <Play size={16} color={COLORS.white} />
              <Text style={styles.primaryBtnText}>Start Course</Text>
            </TouchableOpacity>
          )}
        </View>
        {course.modules?.map((mod) => (
          <View key={mod.id} style={[styles.card, Shadow.card]}>
            <Text style={styles.sectionTitle}>{mod.title}</Text>
            {mod.lessons.map((lesson) => (
              <View key={lesson.id} style={styles.legacyLessonRow}>
                {lesson.is_completed
                  ? <CheckCircle size={16} color={COLORS.success} />
                  : <View style={styles.lessonDot} />
                }
                <Text style={[styles.lessonTitle, lesson.is_completed && { color: COLORS.gray }]}>
                  {lesson.title}
                </Text>
              </View>
            ))}
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  header: {
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  backBtn: { padding: 4, marginTop: 2 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.white, lineHeight: 22 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, textTransform: 'capitalize' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 14, color: COLORS.error, textAlign: 'center' },
  retryBtn: { backgroundColor: COLORS.orange, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: COLORS.white, fontWeight: '700' },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  diffText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.gray },
  description: { fontSize: 13, color: COLORS.gray, lineHeight: 18 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: { fontSize: 12, color: COLORS.gray },
  completedBadge: { backgroundColor: COLORS.success + '22', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  completedBadgeText: { fontSize: 11, fontWeight: '800', color: COLORS.success },
  progressTrack: { height: 6, backgroundColor: COLORS.beigeLight, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.orange, borderRadius: 3 },
  passNote: { fontSize: 12, color: COLORS.gray },
  primaryBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: BorderRadius.medium,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
  },
  primaryBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    borderRadius: BorderRadius.medium,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
  },
  outlineBtnText: { color: COLORS.orange, fontWeight: '700', fontSize: 14 },
  completedRow: { flexDirection: 'row', gap: Spacing.two },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.grayDark, marginBottom: 4 },

  lessonRow: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  lessonNum: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  lessonNumText: { fontSize: 13, fontWeight: '900', color: COLORS.orange },
  lessonTitle: { fontSize: 14, fontWeight: '700', color: COLORS.grayDark },
  lessonMeta: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  doneChip: { backgroundColor: COLORS.success + '22', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  doneChipText: { fontSize: 10, fontWeight: '800', color: COLORS.success },

  assessmentCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  assessmentHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  assessmentTitle: { fontSize: 15, fontWeight: '800', color: COLORS.grayDark },
  assessmentSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },

  // Legacy
  legacyLessonRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: 6 },
  lessonDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.beigeLight },
});
