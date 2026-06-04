import { router } from 'expo-router';
import {
  Award, BookOpen, ChevronRight, GraduationCap, HelpCircle,
  Map, Route, Trophy, UserCheck,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StaffPageHeader } from '@/components/StaffPageHeader';
import { COLORS, BorderRadius, Spacing, Shadow } from '@/constants/theme';
import { courseService } from '@/services/course.service';
import { quizService } from '@/services/quiz.service';

type HubItem = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  route: string;
  badge?: number;
  color: string;
};

function HubCard({ item }: { item: HubItem }) {
  return (
    <TouchableOpacity
      style={[styles.card, Shadow.card]}
      onPress={() => router.push(item.route as any)}
      activeOpacity={0.8}
    >
      <View style={[styles.cardIconBox, { backgroundColor: item.color + '18' }]}>
        {item.icon}
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSub} numberOfLines={1}>{item.subtitle}</Text>
      </View>
      {item.badge !== undefined && item.badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      ) : (
        <ChevronRight size={18} color={COLORS.gray} />
      )}
    </TouchableOpacity>
  );
}

export default function LearningScreen() {
  const [coursesTotal, setCoursesTotal] = useState(0);
  const [coursesCompleted, setCoursesCompleted] = useState(0);
  const [pendingQuizzes, setPendingQuizzes] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const courses: any[] = await courseService.getStaffCourses().catch(() => []);
      setCoursesTotal(courses.length);
      setCoursesCompleted(courses.filter((c: any) => c.staff_status === 'completed').length);
    } catch {}
    try {
      const quizzes: any[] = await quizService.getMyQuizzes().catch(() => []);
      const pending = quizzes.filter((q: any) => !q.attempted && q.status === 'published').length;
      setPendingQuizzes(pending);
    } catch {}
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const pct = coursesTotal > 0 ? Math.round((coursesCompleted / coursesTotal) * 100) : 0;

  const items: HubItem[] = [
    {
      icon: <GraduationCap size={22} color={COLORS.blue} />,
      title: 'My Courses',
      subtitle: coursesTotal > 0 ? `${coursesCompleted}/${coursesTotal} completed · ${pct}%` : 'No courses assigned yet',
      route: '/staff/courses',
      color: COLORS.blue,
    },
    {
      icon: <HelpCircle size={22} color={COLORS.success} />,
      title: 'Quizzes',
      subtitle: pendingQuizzes > 0 ? `${pendingQuizzes} quiz${pendingQuizzes > 1 ? 'zes' : ''} pending` : 'Attempt and view scores',
      route: '/staff/quizzes',
      badge: pendingQuizzes || undefined,
      color: COLORS.success,
    },
    {
      icon: <Award size={22} color={COLORS.orange} />,
      title: 'Certificates',
      subtitle: 'View and download earned certificates',
      route: '/staff/certificates',
      color: COLORS.orange,
    },
    {
      icon: <Route size={22} color='#7C3AED' />,
      title: 'Learning Paths',
      subtitle: 'Structured paths for your role',
      route: '/staff/learning-paths',
      color: '#7C3AED',
    },
    {
      icon: <UserCheck size={22} color='#0891B2' />,
      title: 'Coaching Plans',
      subtitle: 'Guidance from your manager',
      route: '/staff/coaching-plans',
      color: '#0891B2',
    },
    {
      icon: <Trophy size={22} color={COLORS.gold ?? '#C8A24A'} />,
      title: 'Awards & Badges',
      subtitle: 'Recognition and achievements',
      route: '/staff/awards',
      color: COLORS.gold ?? '#C8A24A',
    },
    {
      icon: <Map size={22} color={COLORS.brown} />,
      title: 'Skill Matrix',
      subtitle: 'Track competency and growth',
      route: '/staff/skill-matrix',
      color: COLORS.brown,
    },
    {
      icon: <BookOpen size={22} color={COLORS.gray} />,
      title: 'Leaderboard',
      subtitle: 'See how you rank in your store',
      route: '/staff/leaderboard',
      color: COLORS.gray,
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StaffPageHeader
        title="Learning Hub"
        subtitle={coursesTotal > 0 ? `${coursesCompleted} of ${coursesTotal} courses completed` : 'Start learning today'}
      />

      {/* Progress bar */}
      {coursesTotal > 0 && (
        <View style={styles.progressBar}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
          </View>
          <Text style={styles.progressLabel}>{pct}% overall</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[COLORS.orange]} />}
      >
        {items.map((item) => <HubCard key={item.route} item={item} />)}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  progressBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: Spacing.three, paddingVertical: 10,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  progressTrack: {
    flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.orange, borderRadius: 4 },
  progressLabel: { fontSize: 12, fontWeight: '700', color: COLORS.orange, minWidth: 48 },
  content: { padding: Spacing.three, gap: Spacing.two },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    backgroundColor: COLORS.white, borderRadius: BorderRadius.large,
    padding: Spacing.three, borderWidth: 1, borderColor: COLORS.border,
  },
  cardIconBox: {
    width: 44, height: 44, borderRadius: BorderRadius.medium,
    alignItems: 'center', justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.grayDark },
  cardSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  badge: {
    backgroundColor: COLORS.orange, borderRadius: 12,
    minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
});
