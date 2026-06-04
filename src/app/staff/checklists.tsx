import { router } from 'expo-router';
import { AlertCircle, CheckCircle2, ClipboardList, Clock, RotateCcw } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ManagerPageHeader } from '@/components/ManagerPageHeader';
import { checklistService } from '@/services/checklist.service';
import type { ChecklistAssignment } from '@/types/checklist.types';
import { BorderRadius, COLORS, Shadow, Spacing } from '@/constants/theme';

const TYPE_LABELS: Record<string, string> = {
  opening: 'Opening',
  closing: 'Closing',
  audit: 'Audit',
  cleanliness: 'Cleanliness',
  safety: 'Safety',
  festive_setup: 'Festive Setup',
  customer_followup: 'Follow-up',
  lighting_decor: 'Lighting & Decor',
  general: 'General',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  assigned:          { label: 'Pending',     color: '#1D4ED8', bg: '#DBEAFE', icon: Clock },
  in_progress:       { label: 'In Progress', color: '#92400E', bg: '#FEF3C7', icon: Clock },
  submitted:         { label: 'Submitted',   color: '#166534', bg: '#DCFCE7', icon: CheckCircle2 },
  reviewed:          { label: 'Reviewed',    color: '#166534', bg: '#DCFCE7', icon: CheckCircle2 },
  rejected:          { label: 'Rejected',    color: '#B91C1C', bg: '#FEE2E2', icon: AlertCircle },
  needs_correction:  { label: 'Needs Fix',   color: '#92400E', bg: '#FEF3C7', icon: RotateCcw },
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: '#B91C1C',
  high:   '#D97706',
  medium: '#2563EB',
  low:    '#6B7280',
};

export default function StaffChecklistsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState<ChecklistAssignment[]>([]);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const { assignments: data } = await checklistService.getMyAssignments();
      setAssignments(data);
    } catch {
      try {
        const legacy = await checklistService.getMyChecklists();
        setAssignments(legacy as unknown as ChecklistAssignment[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load checklists');
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
        <ManagerPageHeader title="My Checklists" showBack onBack={() => router.back()} />
        <LoadingState message="Loading checklists..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ManagerPageHeader title="My Checklists" showBack onBack={() => router.back()} />
        <ErrorState message={error} onRetry={() => load()} />
      </SafeAreaView>
    );
  }

  const active = assignments.filter((a) => !['submitted', 'reviewed'].includes(a.status));
  const done   = assignments.filter((a) => ['submitted', 'reviewed'].includes(a.status));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ManagerPageHeader title="My Checklists" showBack onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}>

        {assignments.length === 0 && (
          <View style={styles.emptyState}>
            <ClipboardList size={48} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No Checklists Assigned</Text>
            <Text style={styles.emptySubtitle}>
              Your manager will assign store checklists here.
            </Text>
          </View>
        )}

        {active.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PENDING ({active.length})</Text>
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

function AssignmentCard({ assignment }: { assignment: ChecklistAssignment }) {
  const status = STATUS_CONFIG[assignment.status] ?? STATUS_CONFIG.assigned;
  const StatusIcon = status.icon;
  const checklist_type = assignment.checklist_type ?? '';
  const priorityColor = PRIORITY_DOT[checklist_type] ?? PRIORITY_DOT.medium;
  const typeLabel = TYPE_LABELS[checklist_type] ?? (checklist_type || 'General');
  const isDone = ['submitted', 'reviewed'].includes(assignment.status);
  const pct = Math.round(assignment.completion_percentage ?? 0);

  function handlePress() {
    router.push({ pathname: '/staff/checklist-detail' as any, params: { id: assignment.id } });
  }

  return (
    <TouchableOpacity
      style={[styles.card, Shadow.card]}
      onPress={handlePress}
      activeOpacity={0.85}>
      <View style={styles.cardRow}>
        <View style={[styles.typeDot, { backgroundColor: priorityColor }]} />
        <Text style={styles.typeLabel}>{typeLabel}</Text>
        <View style={{ flex: 1 }} />
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <StatusIcon size={11} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>{assignment.template_title}</Text>

      {pct > 0 && pct < 100 && (
        <View style={styles.progressWrap}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
          </View>
          <Text style={styles.pctText}>{pct}%</Text>
        </View>
      )}

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Due: {assignment.due_date}</Text>
        {!isDone && (
          <Text style={styles.tapHint}>Tap to complete →</Text>
        )}
        {isDone && assignment.manager_remarks && (
          <Text style={styles.managerRemark} numberOfLines={1}>
            Manager: {assignment.manager_remarks}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { padding: Spacing.three, gap: Spacing.two },
  emptyState: { alignItems: 'center', paddingVertical: 64, gap: Spacing.two },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.grayDark },
  emptySubtitle: { fontSize: 13, color: COLORS.gray, textAlign: 'center', lineHeight: 20 },
  section: { gap: Spacing.two },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.gray, letterSpacing: 0.6 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: 10,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeDot: { width: 8, height: 8, borderRadius: 4 },
  typeLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.grayDark, lineHeight: 20 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBg: {
    flex: 1,
    height: 5,
    backgroundColor: COLORS.grayLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.orange, borderRadius: 3 },
  pctText: { fontSize: 11, fontWeight: '700', color: COLORS.orange, width: 32, textAlign: 'right' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { fontSize: 12, color: COLORS.gray },
  tapHint: { fontSize: 12, fontWeight: '600', color: COLORS.orange },
  managerRemark: { fontSize: 11, color: COLORS.gray, flex: 1, textAlign: 'right' },
});
