import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, BookOpen, CheckCircle, ChevronRight, Clock, Lock } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, BorderRadius, Spacing, Shadow } from '@/constants/theme';
import { learningPathService, type LearningPath, type LearningPathCourse } from '@/services/learning-path.service';

export default function LearningPathDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [path, setPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!id || id === 'undefined') return;
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      setPath(await learningPathService.getPath(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleEnroll() {
    setEnrolling(true);
    try {
      const updated = await learningPathService.enroll(id);
      setPath(updated);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  }

  function handleCoursePress(c: LearningPathCourse) {
    if (c.is_locked) {
      Alert.alert('Locked', 'Complete the previous course to unlock this one.');
      return;
    }
    router.push({ pathname: '/staff/course-detail', params: { id: c.course_id } });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingHeader}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <ArrowLeft size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}><ActivityIndicator color={COLORS.orange} size="large" /></View>
      </SafeAreaView>
    );
  }

  if (error || !path) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingHeader}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <ArrowLeft size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? 'Not found'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isEnrolled = path.enrollment_status !== 'not_enrolled';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={20} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={2}>{path.title}</Text>
          <Text style={styles.headerSub}>{path.category}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} colors={[COLORS.orange]} />}
      >
        {/* Progress Card */}
        <View style={[styles.progressCard, Shadow.card]}>
          <View style={styles.progressRow}>
            <Text style={styles.progressPct}>{path.progress_percentage}%</Text>
            <Text style={styles.progressDetail}>{path.completed_courses} / {path.total_courses} courses completed</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${path.progress_percentage}%` as `${number}%` }]} />
          </View>
          {path.description ? <Text style={styles.pathDesc}>{path.description}</Text> : null}
        </View>

        {/* Enroll button if not enrolled */}
        {!isEnrolled && (
          <TouchableOpacity style={[styles.enrollBtn, enrolling && { opacity: 0.6 }]} onPress={handleEnroll} disabled={enrolling}>
            {enrolling
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.enrollBtnText}>Enroll in Learning Path</Text>}
          </TouchableOpacity>
        )}

        {/* Course List */}
        <Text style={styles.sectionTitle}>Course Journey</Text>
        {path.courses.map((c, idx) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.courseCard, Shadow.card, c.is_locked && styles.courseCardLocked]}
            onPress={() => handleCoursePress(c)}
            activeOpacity={c.is_locked ? 1 : 0.85}
          >
            <View style={[styles.stepBadge, { backgroundColor: c.is_completed ? COLORS.success : c.is_locked ? COLORS.gray : COLORS.orange }]}>
              <Text style={styles.stepNum}>{idx + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.courseTitle, c.is_locked && { color: COLORS.gray }]}>{c.course_title}</Text>
              <Text style={styles.courseMeta}>{c.course_category} · {c.estimated_duration_minutes}m</Text>
              {!c.is_locked && c.progress_percentage > 0 && (
                <View style={styles.miniProgress}>
                  <View style={[styles.miniProgressFill, { width: `${c.progress_percentage}%` as `${number}%` }]} />
                </View>
              )}
            </View>
            {c.is_completed
              ? <CheckCircle size={20} color={COLORS.success} />
              : c.is_locked
                ? <Lock size={18} color={COLORS.gray} />
                : <ChevronRight size={18} color={COLORS.gray} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  loadingHeader: { backgroundColor: COLORS.blue, padding: Spacing.three },
  header: {
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.white, lineHeight: 22 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 14, color: COLORS.error },
  retryBtn: { backgroundColor: COLORS.orange, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: COLORS.white, fontWeight: '700' },
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: 40 },
  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  progressRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  progressPct: { fontSize: 36, fontWeight: '900', color: COLORS.blue },
  progressDetail: { fontSize: 14, color: COLORS.gray },
  progressTrack: { height: 8, backgroundColor: COLORS.beigeLight, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.orange, borderRadius: 4 },
  pathDesc: { fontSize: 13, color: COLORS.gray, lineHeight: 18 },
  enrollBtn: {
    backgroundColor: COLORS.blue,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  enrollBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.blue },
  courseCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  courseCardLocked: { opacity: 0.6 },
  stepBadge: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { color: COLORS.white, fontWeight: '900', fontSize: 14 },
  courseTitle: { fontSize: 14, fontWeight: '700', color: COLORS.black, lineHeight: 20 },
  courseMeta: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  miniProgress: { height: 4, backgroundColor: COLORS.beigeLight, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  miniProgressFill: { height: '100%', backgroundColor: COLORS.orange, borderRadius: 2 },
});
