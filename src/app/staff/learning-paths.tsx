import { router } from 'expo-router';
import { BookOpen, ChevronRight, Lock, MapPin } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, BorderRadius, Spacing, Shadow } from '@/constants/theme';
import { learningPathService, type LearningPath } from '@/services/learning-path.service';

function ProgressBar({ pct }: { pct: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%` as `${number}%` }]} />
    </View>
  );
}

export default function LearningPathsScreen() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      setPaths(await learningPathService.getMyPaths());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load learning paths');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <MapPin size={22} color={COLORS.white} />
        <View>
          <Text style={styles.headerTitle}>Learning Paths</Text>
          <Text style={styles.headerSub}>Sequential course journeys</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.orange} size="large" /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} colors={[COLORS.orange]} />}
        >
          {paths.length === 0 ? (
            <View style={styles.emptyBox}>
              <BookOpen size={40} color={COLORS.gray} />
              <Text style={styles.emptyTitle}>No learning paths</Text>
              <Text style={styles.emptySub}>Ask your manager to enroll you in a learning path</Text>
            </View>
          ) : (
            paths.map(path => (
              <TouchableOpacity
                key={path.id}
                style={[styles.card, Shadow.card]}
                onPress={() => router.push({ pathname: '/staff/learning-path-detail', params: { id: path.id } })}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.iconBox, { backgroundColor: COLORS.blue + '15' }]}>
                    <BookOpen size={24} color={COLORS.blue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pathTitle}>{path.title}</Text>
                    <Text style={styles.pathCategory}>{path.category}</Text>
                  </View>
                  <ChevronRight size={18} color={COLORS.gray} />
                </View>

                {path.description ? (
                  <Text style={styles.pathDesc} numberOfLines={2}>{path.description}</Text>
                ) : null}

                <View style={styles.statsRow}>
                  <Text style={styles.statText}>{path.completed_courses}/{path.total_courses} courses</Text>
                  <Text style={styles.pctText}>{path.progress_percentage}%</Text>
                </View>
                <ProgressBar pct={path.progress_percentage} />

                <View style={styles.coursePreview}>
                  {path.courses.slice(0, 3).map((c, i) => (
                    <View key={c.id} style={styles.courseChip}>
                      {c.is_locked
                        ? <Lock size={10} color={COLORS.gray} />
                        : <View style={[styles.dot, { backgroundColor: c.is_completed ? COLORS.success : COLORS.orange }]} />}
                      <Text style={styles.courseChipText} numberOfLines={1}>{i + 1}. {c.course_title}</Text>
                    </View>
                  ))}
                  {path.courses.length > 3 && (
                    <Text style={styles.moreText}>+{path.courses.length - 3} more courses</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  header: {
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 14, color: COLORS.error, textAlign: 'center' },
  retryBtn: { backgroundColor: COLORS.orange, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: COLORS.white, fontWeight: '700' },
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: 40 },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.grayDark },
  emptySub: { fontSize: 14, color: COLORS.gray, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  iconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pathTitle: { fontSize: 15, fontWeight: '800', color: COLORS.black, lineHeight: 20 },
  pathCategory: { fontSize: 12, color: COLORS.orange, fontWeight: '700', marginTop: 2 },
  pathDesc: { fontSize: 13, color: COLORS.gray, lineHeight: 18 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statText: { fontSize: 12, color: COLORS.gray },
  pctText: { fontSize: 13, fontWeight: '800', color: COLORS.blue },
  progressTrack: { height: 6, backgroundColor: COLORS.beigeLight, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.orange, borderRadius: 3 },
  coursePreview: { gap: 6 },
  courseChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  courseChipText: { fontSize: 12, color: COLORS.grayDark, flex: 1 },
  moreText: { fontSize: 11, color: COLORS.gray, fontStyle: 'italic' },
});
