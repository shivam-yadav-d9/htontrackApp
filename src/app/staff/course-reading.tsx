import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, BadgeCheck, ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, BorderRadius, Spacing, Shadow } from '@/constants/theme';
import { courseService } from '@/services/course.service';
import type { Course } from '@/types/course.types';

export default function CourseReadingScreen() {
  const { courseId, lessonId } = useLocalSearchParams<{ courseId: string; lessonId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const load = useCallback(async () => {
    if (!courseId || courseId === 'undefined') return;
    setLoading(true);
    try {
      const data = await courseService.getStaffCourseLMS(courseId);
      setCourse(data);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  if (loading || !course) {
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

  const lessons = course.lessons ?? [];
  const currentIndex = lessons.findIndex((l) => l.id === lessonId);
  const lesson = lessons[currentIndex];
  const completedIds = course.completed_lessons ?? [];
  const isDone = completedIds.includes(lessonId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < lessons.length - 1;

  if (!lesson) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>Lesson not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  async function handleComplete() {
    if (!course || isDone) return;
    setCompleting(true);
    try {
      await courseService.completeLessonLMS(courseId, lessonId);
      const updated = await courseService.getStaffCourseLMS(courseId);
      setCourse(updated);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
    } finally {
      setCompleting(false);
    }
  }

  function navigate(direction: 'prev' | 'next') {
    const target = lessons[direction === 'prev' ? currentIndex - 1 : currentIndex + 1];
    if (target) {
      router.replace({ pathname: '/staff/course-reading', params: { courseId, lessonId: target.id } });
    }
  }

  const estimatedMins = (lesson as any).estimated_minutes ?? lesson.duration_minutes ?? 5;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{course.title}</Text>
          <Text style={styles.headerSub}>
            Lesson {currentIndex + 1} of {lessons.length}
          </Text>
        </View>
      </View>

      {/* Progress strip */}
      <View style={styles.progressStrip}>
        {lessons.map((l, i) => (
          <View
            key={l.id}
            style={[
              styles.progressSegment,
              {
                backgroundColor: completedIds.includes(l.id)
                  ? COLORS.success
                  : i === currentIndex
                    ? COLORS.orange
                    : COLORS.border,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Lesson header */}
        <View style={[styles.lessonHeader, Shadow.card]}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{estimatedMins} min read</Text>
            {isDone && (
              <View style={styles.doneChip}>
                <BadgeCheck size={12} color={COLORS.success} />
                <Text style={styles.doneChipText}>Completed</Text>
              </View>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={[styles.contentCard, Shadow.card]}>
          <Text style={styles.contentText}>
            {(lesson as any).content ?? 'No content available for this lesson.'}
          </Text>
        </View>

        {/* Mark complete */}
        {!isDone && (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={handleComplete}
            disabled={completing}>
            {completing
              ? <ActivityIndicator color={COLORS.white} />
              : <>
                  <BadgeCheck size={18} color={COLORS.white} />
                  <Text style={styles.completeBtnText}>Mark as Complete</Text>
                </>
            }
          </TouchableOpacity>
        )}

        {isDone && (
          <View style={styles.doneBox}>
            <BadgeCheck size={20} color={COLORS.success} />
            <Text style={styles.doneBoxText}>Lesson completed!</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Prev / Next nav */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navBtn, !hasPrev && styles.navBtnDisabled]}
          onPress={() => navigate('prev')}
          disabled={!hasPrev}>
          <ChevronLeft size={18} color={hasPrev ? COLORS.orange : COLORS.border} />
          <Text style={[styles.navBtnText, !hasPrev && { color: COLORS.border }]}>Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navBtnCenter}
          onPress={() => router.back()}>
          <Text style={styles.navBtnCenterText}>All Lessons</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, styles.navBtnRight, !hasNext && styles.navBtnDisabled]}
          onPress={() => navigate('next')}
          disabled={!hasNext}>
          <Text style={[styles.navBtnText, !hasNext && { color: COLORS.border }]}>Next</Text>
          <ChevronRight size={18} color={hasNext ? COLORS.orange : COLORS.border} />
        </TouchableOpacity>
      </View>
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
  headerTitle: { fontSize: 15, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 14, color: COLORS.error },

  progressStrip: { flexDirection: 'row', height: 4, gap: 2, paddingHorizontal: 2 },
  progressSegment: { flex: 1, borderRadius: 2 },

  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 20 },

  lessonHeader: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: 6,
  },
  lessonTitle: { fontSize: 18, fontWeight: '900', color: COLORS.grayDark, lineHeight: 24 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  metaText: { fontSize: 12, color: COLORS.gray },
  doneChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.success + '22',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  doneChipText: { fontSize: 11, fontWeight: '700', color: COLORS.success },

  contentCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
  },
  contentText: { fontSize: 14, color: COLORS.grayDark, lineHeight: 22 },

  completeBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: BorderRadius.medium,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },

  doneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.success + '15',
    borderRadius: BorderRadius.medium,
    padding: Spacing.two,
  },
  doneBoxText: { fontSize: 14, fontWeight: '700', color: COLORS.success },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: Spacing.two },
  navBtnRight: { justifyContent: 'flex-end' },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.orange },
  navBtnCenter: { flex: 1, alignItems: 'center' },
  navBtnCenterText: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
});
