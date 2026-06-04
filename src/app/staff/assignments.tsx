import { router } from 'expo-router';
import {
  AlertCircle, CheckCircle2, ChevronRight, Clock,
  ClipboardList, RotateCcw, Star,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ManagerPageHeader } from '@/components/ManagerPageHeader';
import { assignmentService } from '@/services/assignment.service';
import { BorderRadius, COLORS, Shadow, Spacing } from '@/constants/theme';

type RoleAssignment = {
  id: string;
  template_title: string;
  assignment_type?: string;
  priority?: string;
  difficulty?: string;
  due_date: string;
  assigned_date?: string;
  status: string;
  submission_status?: string;
  review_status?: string | null;
  marks_awarded?: number | null;
  result?: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  assigned:         { label: 'Pending',    color: '#1D4ED8', bg: '#DBEAFE', icon: Clock },
  submitted:        { label: 'Submitted',  color: '#92400E', bg: '#FEF3C7', icon: Clock },
  reviewed:         { label: 'Reviewed',   color: '#166534', bg: '#DCFCE7', icon: CheckCircle2 },
  rejected:         { label: 'Rejected',   color: '#B91C1C', bg: '#FEE2E2', icon: AlertCircle },
  needs_correction: { label: 'Needs Fix',  color: '#92400E', bg: '#FEF3C7', icon: RotateCcw },
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: '#B91C1C',
  high:   '#D97706',
  medium: '#2563EB',
  low:    '#6B7280',
};

const TYPE_LABEL: Record<string, string> = {
  customer_followup:     'Customer Follow-up',
  visual_merchandising:  'Visual Merchandising',
  store_operations:      'Store Operations',
  product_knowledge:     'Product Knowledge',
  sales_target:          'Sales Target',
  general:               'General',
};

export default function AssignmentsScreen() {
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState('');
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const { assignments: data } = await assignmentService.getRoleAssignments();
      setAssignments(data as RoleAssignment[]);
    } catch {
      try {
        const legacy = await assignmentService.getMyAssignments();
        setAssignments(legacy as unknown as RoleAssignment[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assignments');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ManagerPageHeader title="My Assignments" showBack onBack={() => router.back()} />
        <LoadingState message="Loading assignments..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ManagerPageHeader title="My Assignments" showBack onBack={() => router.back()} />
        <ErrorState message={error} onRetry={() => load()} />
      </SafeAreaView>
    );
  }

  const active = assignments.filter((a) => !['reviewed'].includes(a.status) || a.review_status === 'needs_correction');
  const done   = assignments.filter((a) => a.status === 'reviewed' && a.review_status !== 'needs_correction');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ManagerPageHeader
        title="My Assignments"
        subtitle={`${assignments.length} total`}
        showBack
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}>

        {assignments.length === 0 && (
          <View style={styles.empty}>
            <ClipboardList size={48} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No Assignments</Text>
            <Text style={styles.emptySub}>Your manager hasn't assigned any tasks yet.</Text>
          </View>
        )}

        {active.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ACTIVE ({active.length})</Text>
            {active.map((a) => <AssignmentCard key={a.id} assignment={a} />)}
          </View>
        )}

        {done.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>COMPLETED ({done.length})</Text>
            {done.map((a) => <AssignmentCard key={a.id} assignment={a} />)}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function AssignmentCard({ assignment }: { assignment: RoleAssignment }) {
  const cfg = STATUS_CONFIG[assignment.status] ?? STATUS_CONFIG.assigned;
  const StatusIcon = cfg.icon;
  const priorityColor = PRIORITY_COLOR[assignment.priority ?? 'medium'] ?? PRIORITY_COLOR.medium;
  const typeLabel = TYPE_LABEL[assignment.assignment_type ?? ''] ?? (assignment.assignment_type ?? 'General');
  const isPassed = assignment.result === 'pass';
  const isFailed = assignment.result === 'fail';

  return (
    <TouchableOpacity
      style={[styles.card, Shadow.card]}
      onPress={() => router.push({ pathname: '/staff/assignment-detail' as any, params: { id: assignment.id } })}
      activeOpacity={0.85}>
      <View style={styles.cardRow}>
        <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
        <Text style={styles.typeLabel}>{typeLabel}</Text>
        <View style={{ flex: 1 }} />
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <StatusIcon size={11} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>{assignment.template_title}</Text>

      <View style={styles.footer}>
        <View style={styles.metaRow}>
          <Clock size={12} color={COLORS.gray} />
          <Text style={styles.metaText}>Due: {assignment.due_date}</Text>
        </View>
        {assignment.difficulty && (
          <Text style={styles.diffBadge}>{assignment.difficulty}</Text>
        )}
        {isPassed && (
          <View style={styles.resultBadge}>
            <Star size={10} color={COLORS.success} />
            <Text style={[styles.resultText, { color: COLORS.success }]}>
              Passed {assignment.marks_awarded != null ? `· ${assignment.marks_awarded}` : ''}
            </Text>
          </View>
        )}
        {isFailed && (
          <View style={[styles.resultBadge, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.resultText, { color: COLORS.error }]}>
              Failed {assignment.marks_awarded != null ? `· ${assignment.marks_awarded}` : ''}
            </Text>
          </View>
        )}
        <ChevronRight size={14} color={COLORS.gray} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { padding: Spacing.three, gap: Spacing.two },
  empty: { alignItems: 'center', paddingVertical: 64, gap: Spacing.two },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.grayDark },
  emptySub: { fontSize: 13, color: COLORS.gray, textAlign: 'center', lineHeight: 20 },
  section: { gap: Spacing.two },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.gray, letterSpacing: 0.6 },
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
  title: { fontSize: 15, fontWeight: '700', color: COLORS.grayDark, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  metaText: { fontSize: 12, color: COLORS.gray },
  diffBadge: {
    fontSize: 10, fontWeight: '600', color: COLORS.gray,
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
    textTransform: 'capitalize',
  },
  resultBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
  },
  resultText: { fontSize: 10, fontWeight: '700' },
});
