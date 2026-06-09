import { Ionicons } from "@expo/vector-icons";
import { router } from 'expo-router';
import ScreenLayout from "@/components/ScreenLayout";

import {
  ChevronRight,
  ClipboardList,
} from "lucide-react-native";

import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl, SafeAreaView, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';

import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ManagerPageHeader } from '@/components/ManagerPageHeader';
import { lmsService } from '@/services/lms.service';
import { BorderRadius, COLORS, Shadow, Spacing } from '@/constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

// type RoleAssignment = {
//   id: string;
//   template_title: string;
//   assignment_type?: string;
//   priority?: string;
//   difficulty?: string;
//   due_date: string;
//   assigned_date?: string;
//   status: string;
//   submission_status?: string;
//   review_status?: string | null;
//   marks_awarded?: number | null;
//   result?: string | null;
// };

// ─── Quiz Data ────────────────────────────────────────────────────────────────


// ─── Status / Priority / Type configs (unchanged) ────────────────────────────

// const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
//   assigned: { label: 'Pending', color: '#1D4ED8', bg: '#DBEAFE', icon: Clock },
//   submitted: { label: 'Submitted', color: '#92400E', bg: '#FEF3C7', icon: Clock },
//   reviewed: { label: 'Reviewed', color: '#166534', bg: '#DCFCE7', icon: CheckCircle2 },
//   rejected: { label: 'Rejected', color: '#B91C1C', bg: '#FEE2E2', icon: AlertCircle },
//   needs_correction: { label: 'Needs Fix', color: '#92400E', bg: '#FEF3C7', icon: RotateCcw },
// };

// const PRIORITY_COLOR: Record<string, string> = {
//   urgent: '#B91C1C', high: '#D97706', medium: '#2563EB', low: '#6B7280',
// };

// const TYPE_LABEL: Record<string, string> = {
//   customer_followup: 'Customer Follow-up',
//   visual_merchandising: 'Visual Merchandising',
//   store_operations: 'Store Operations',
//   product_knowledge: 'Product Knowledge',
//   sales_target: 'Sales Target',
//   general: 'General',
// };

// ─── Assignment Card (unchanged) ─────────────────────────────────────────────

// function AssignmentCard({ assignment }: { assignment: RoleAssignment }) {
//   const cfg = STATUS_CONFIG[assignment.status] ?? STATUS_CONFIG.assigned;
//   const StatusIcon = cfg.icon;
//   const priorityColor = PRIORITY_COLOR[assignment.priority ?? 'medium'] ?? PRIORITY_COLOR.medium;
//   const typeLabel = TYPE_LABEL[assignment.assignment_type ?? ''] ?? (assignment.assignment_type ?? 'General');
//   const isPassed = assignment.result === 'pass';
//   const isFailed = assignment.result === 'fail';

//   return (
//     <TouchableOpacity
//       style={[styles.card, Shadow.card]}
//       onPress={() => router.push({ pathname: '/staff/assignment-detail' as any, params: { id: assignment.id } })}
//       activeOpacity={0.85}
//     >
//       <View style={styles.cardRow}>
//         <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
//         <Text style={styles.typeLabel}>{typeLabel}</Text>
//         <View style={{ flex: 1 }} />
//         <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
//           <StatusIcon size={11} color={cfg.color} />
//           <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
//         </View>
//       </View>
//       <Text style={styles.cardTitle} numberOfLines={2}>{assignment.template_title}</Text>
//       <View style={styles.footer}>
//         <View style={styles.metaRow}>
//           <Clock size={12} color={COLORS.gray} />
//           <Text style={styles.metaText}>Due: {assignment.due_date}</Text>
//         </View>
//         {assignment.difficulty && (
//           <Text style={styles.diffBadge}>{assignment.difficulty}</Text>
//         )}
//         {isPassed && (
//           <View style={styles.resultBadge}>
//             <Star size={10} color={COLORS.success} />
//             <Text style={[styles.resultText, { color: COLORS.success }]}>
//               Passed {assignment.marks_awarded != null ? `· ${assignment.marks_awarded}` : ''}
//             </Text>
//           </View>
//         )}
//         {isFailed && (
//           <View style={[styles.resultBadge, { backgroundColor: '#FEE2E2' }]}>
//             <Text style={[styles.resultText, { color: COLORS.error }]}>
//               Failed {assignment.marks_awarded != null ? `· ${assignment.marks_awarded}` : ''}
//             </Text>
//           </View>
//         )}
//         <ChevronRight size={14} color={COLORS.gray} />
//       </View>
//     </TouchableOpacity>
//   );
// }

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function AssignmentsScreen() {
  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [courses, setCourses] =
    useState<any[]>([]);


  // ── Data loading ────────────────────────────────────────────────────────────

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError('');

    try {
      const data = await lmsService.getCourses();

      setCourses(
        Array.isArray(data)
          ? data
          : data?.data || []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load courses'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Quiz logic ──────────────────────────────────────────────────────────────







  // ── Loading / Error guards ──────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ManagerPageHeader title="My Assignments" showBack onBack={() => router.back()} />
        <LoadingState message="Loading assignments..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <ManagerPageHeader title="My Assignments" showBack onBack={() => router.back()} />
        <ErrorState message={error} onRetry={() => load()} />
      </SafeAreaView>
    );
  }

  // ── Quiz view ───────────────────────────────────────────────────────────────



  // ── LMS Dashboard view ──────────────────────────────────────────────────────

  // const active = assignments.filter(
  //   (a) => !['reviewed'].includes(a.status) || a.review_status === 'needs_correction'
  // );
  // const done = assignments.filter(
  //   (a) => a.status === 'reviewed' && a.review_status !== 'needs_correction'
  // );

  return (

    <ScreenLayout title="LMS">

      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        >
          {/* ── LMS Header ── */}
          <View style={styles.header}>
            <Text style={styles.smallTitle}>LEARNING HUB</Text>
            <Text style={styles.title}>My Learning</Text>
            <Text style={styles.subtitle}>Complete courses and grow your retail skills.</Text>
          </View>

     

          {/* ── Stats ── */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {courses.length}
              </Text>
              <Text style={styles.statText}>Courses</Text>
            </View>
            
            <View style={styles.statBox}>

              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statText}>Completed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statText}>Certificates</Text>
            </View>
          </View>

          {/* ── Continue Learning ── */}



          {/* ── Assigned Courses (from API) ── */}
          {courses.length === 0 ? (
            <View style={styles.empty}>
              <ClipboardList size={48} color={COLORS.gray} />
              <Text style={styles.emptyTitle}>No Courses Found</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Available Courses</Text>

              {courses.map((course) => (
                <TouchableOpacity
                  key={course._id}
                  style={styles.courseCard}
                  onPress={() =>
                    router.push({
                      pathname: "/staff/course-detail",
                      params: {
                        id: course._id,
                      },
                    })
                  }
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.courseTitle}>
                      {course.title}
                    </Text>

                    <Text style={styles.courseSubtitle}>
                      {course.description}
                    </Text>

                    <Text
                      style={{
                        marginTop: 8,
                        color: "#ff7b00",
                        fontWeight: "700",
                      }}
                    >
                      Pass Marks: {course.passingPercentage}%
                    </Text>
                  </View>

                  <ChevronRight
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* ── Certificates ── */}
          <Text style={styles.sectionTitle}>Certificates</Text>
          <View style={styles.certificateCard}>
            <Ionicons name="ribbon-outline" size={32} color="#ff7b00" />
            <Text style={styles.certificateText}>Retail Excellence Certification</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </ScreenLayout>

  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Shared ──
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  container: { flex: 1, backgroundColor: '#F7F8FA' },

  // ── LMS Dashboard ──
  header: {
    backgroundColor: '#0B2D4A',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  smallTitle: { color: '#F5A623', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { color: '#fff', fontSize: 30, fontWeight: 'bold', marginTop: 6 },
  subtitle: { color: '#D8DDE5', marginTop: 6 },

  progressCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -25,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  progressLabel: { color: '#777' },
  progressValue: { fontSize: 34, fontWeight: 'bold', color: '#0B2D4A' },
  circle: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#ff7b00',
    justifyContent: 'center', alignItems: 'center',
  },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 20 },
  statBox: { flex: 1, backgroundColor: '#fff', padding: 18, marginHorizontal: 4, borderRadius: 16, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#ff7b00' },
  statText: { marginTop: 5, color: '#666' },

  sectionTitle: { marginTop: 25, marginHorizontal: 20, marginBottom: 12, fontSize: 18, fontWeight: 'bold', color: '#222' },

  courseCard: {
    backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 18,
    padding: 15, flexDirection: 'row', alignItems: 'center',
  },
  courseIcon: { marginRight: 15 },
  courseTitle: { fontWeight: 'bold', fontSize: 16 },
  courseSubtitle: { color: '#777', marginTop: 4 },
  progressBar: { height: 8, backgroundColor: '#E5E5E5', borderRadius: 10, marginTop: 10 },
  progressFill: { width: '50%', height: '100%', backgroundColor: '#ff7b00', borderRadius: 10 },
  playButton: {
    backgroundColor: '#ff7b00', width: 45, height: 45, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },

  section: { gap: Spacing.two, marginHorizontal: 20 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: Spacing.two },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.grayDark },
  emptySub: { fontSize: 13, color: COLORS.gray, textAlign: 'center', lineHeight: 20 },

  certificateCard: {
    backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 16,
    padding: 18, flexDirection: 'row', alignItems: 'center',
  },
  certificateText: { marginLeft: 15, fontWeight: '600', fontSize: 15 },

  // ── Assignment Card (from file 2) ──
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: 10,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  typeLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray, textTransform: 'uppercase', letterSpacing: 0.4 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.grayDark, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  metaText: { fontSize: 12, color: COLORS.gray },
  diffBadge: {
    fontSize: 10, fontWeight: '600', color: COLORS.gray,
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, textTransform: 'capitalize',
  },
  resultBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
  },
  resultText: { fontSize: 10, fontWeight: '700' },

  // ── Quiz ──
  quizContainer: { flex: 1, backgroundColor: '#F7F8FA' },
  quizHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E5E5',
    marginTop: 40,
  },
  backButton: { padding: 4 },
  quizHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#0B2D4A' },
  quizProgress: { fontSize: 14, fontWeight: '600', color: '#ff7b00' },
  quizContent: { flex: 1, padding: 20, justifyContent: 'center' },
  questionText: {
    fontSize: 22, fontWeight: 'bold', color: '#0B2D4A',
    marginBottom: 30, textAlign: 'center', lineHeight: 28,
  },
  optionsContainer: { width: '100%', marginBottom: 20 },
  optionButton: {
    backgroundColor: '#fff', padding: 18, borderRadius: 12, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E5E5', elevation: 1,
  },
  optionText: { fontSize: 16, color: '#333', fontWeight: '500' },
  correctOption: { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' },
  correctOptionText: { color: '#2E7D32', fontWeight: 'bold' },
  wrongOption: { backgroundColor: '#FFEBEE', borderColor: '#C62828' },
  wrongOptionText: { color: '#C62828', fontWeight: 'bold' },
  nextButton: {
    backgroundColor: '#0B2D4A', padding: 16, borderRadius: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10,
  },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  resultTitle: { fontSize: 26, fontWeight: 'bold', color: '#0B2D4A', marginTop: 20, marginBottom: 10 },
  resultScore: { fontSize: 20, fontWeight: '600', color: '#444', marginBottom: 10 },
  resultFeedback: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 40 },
  primaryButton: {
    backgroundColor: '#ff7b00', paddingHorizontal: 30, paddingVertical: 15,
    borderRadius: 25, elevation: 2,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});