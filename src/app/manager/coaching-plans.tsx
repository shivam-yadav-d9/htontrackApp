import { router } from 'expo-router';
import { CheckCircle2, ClipboardPenLine, PlusCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { coachingService } from '@/services/coaching.service';
import type { CoachingPlan, CoachingReviewPayload } from '@/types/coaching.types';

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    assigned: { label: 'Assigned', bg: '#FEE2E2', color: '#B91C1C' },
    in_progress: { label: 'In Progress', bg: '#FEF3C7', color: '#92400E' },
    staff_completed: { label: 'Staff Completed', bg: '#DBEAFE', color: '#1D4ED8' },
    manager_reviewed: { label: 'Reviewed', bg: '#EDE9FE', color: '#6D28D9' },
    closed: { label: 'Closed', bg: '#DCFCE7', color: '#166534' },
  };
  const c = map[status] ?? { label: status, bg: '#F3F4F6', color: '#374151' };
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <Text style={[styles.chipText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

function PriorityChip({ priority }: { priority: string }) {
  const map: Record<string, string> = { low: '#166534', medium: '#92400E', high: '#C95F18', urgent: '#B91C1C' };
  const color = map[priority] ?? '#374151';
  return (
    <View style={[styles.chip, { backgroundColor: color + '22' }]}>
      <Text style={[styles.chipText, { color }]}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</Text>
    </View>
  );
}

export default function ManagerCoachingPlansScreen() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<CoachingPlan[]>([]);
  const [summary, setSummary] = useState({ total: 0, assigned: 0, in_progress: 0, staff_completed: 0, closed: 0 });
  const [reviewing, setReviewing] = useState<Record<string, boolean>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, string>>({});

  useEffect(() => { loadPlans(); }, []);

  async function loadPlans() {
    try {
      setLoading(true);
      const data = await coachingService.getManagerCoachingPlans() as any;
      setPlans(data.plans ?? []);
      setSummary(data.summary ?? { total: 0, assigned: 0, in_progress: 0, staff_completed: 0, closed: 0 });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function reviewPlan(planId: string, status: 'manager_reviewed' | 'closed') {
    const remark = remarks[planId]?.trim();
    if (!remark) {
      Alert.alert('Validation', 'Manager remarks are required.');
      return;
    }
    const scoreRaw = scores[planId]?.trim();
    const finalScore = scoreRaw ? parseInt(scoreRaw, 10) : null;
    if (scoreRaw && (isNaN(finalScore!) || finalScore! < 0 || finalScore! > 100)) {
      Alert.alert('Validation', 'Score must be between 0 and 100.');
      return;
    }
    const payload: CoachingReviewPayload = { status, manager_remarks: remark, final_score: finalScore };
    try {
      setReviewing((prev) => ({ ...prev, [planId]: true }));
      const updated = await coachingService.reviewCoachingPlan(planId, payload) as CoachingPlan;
      setPlans((prev) => prev.map((p) => (p.id === planId ? updated : p)));
      await loadPlans();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to review plan.');
    } finally {
      setReviewing((prev) => ({ ...prev, [planId]: false }));
    }
  }

  const summaryGrid = [
    { label: 'Total', value: summary.total, color: '#102B45' },
    { label: 'Assigned', value: summary.assigned, color: '#B91C1C' },
    { label: 'In Progress', value: summary.in_progress, color: '#92400E' },
    { label: 'Completed', value: summary.staff_completed, color: '#1D4ED8' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coaching Plans</Text>
        <Text style={styles.headerSub}>Manage staff improvement plans</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.summaryGrid}>
          {summaryGrid.map((item) => (
            <View key={item.label} style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/manager/create-coaching-plan')}
          activeOpacity={0.8}
        >
          <PlusCircle size={18} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Create Coaching Plan</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#C95F18" style={{ marginTop: 32 }} />
        ) : plans.length === 0 ? (
          <View style={styles.empty}>
            <ClipboardPenLine size={36} color="#C95F18" />
            <Text style={styles.emptyTitle}>No Coaching Plans</Text>
            <Text style={styles.emptyText}>Assign improvement plans to staff who need guidance.</Text>
          </View>
        ) : (
          plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              remarks={remarks}
              scores={scores}
              reviewing={reviewing}
              setRemarks={setRemarks}
              setScores={setScores}
              onReview={reviewPlan}
            />
          ))
        )}
        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanCard({
  plan, remarks, scores, reviewing, setRemarks, setScores, onReview,
}: {
  plan: CoachingPlan;
  remarks: Record<string, string>;
  scores: Record<string, string>;
  reviewing: Record<string, boolean>;
  setRemarks: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setScores: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onReview: (planId: string, status: 'manager_reviewed' | 'closed') => void;
}) {
  const isLoading = reviewing[plan.id] ?? false;
  const isFinal = plan.status === 'manager_reviewed' || plan.status === 'closed';
  const canReview = plan.status === 'staff_completed';
  const completedIds = new Set(plan.completed_action_ids ?? []);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{plan.title}</Text>
          <Text style={styles.cardSub}>{plan.staff_name ?? 'Staff'} • {plan.category}</Text>
        </View>
        <StatusChip status={plan.status} />
      </View>

      <View style={styles.priorityRow}>
        <PriorityChip priority={plan.priority} />
        {plan.due_date ? <Text style={styles.dateText}>Due: {plan.due_date}</Text> : null}
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>Progress</Text>
        <Text style={styles.progressPct}>{plan.progress_percentage}% ({plan.completed_actions}/{plan.total_actions})</Text>
      </View>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${plan.progress_percentage}%` as any }]} />
      </View>

      {(plan.action_items ?? []).map((action) => {
        const done = completedIds.has(action.id);
        const note = (plan.action_completion_notes ?? []).find((n) => n.action_id === action.id);
        return (
          <View key={action.id} style={styles.actionBox}>
            <View style={styles.actionHeader}>
              <Text style={[styles.actionTitle, done && styles.actionTitleDone]}>
                {action.sort_order}. {action.title}
              </Text>
              {done ? (
                <View style={styles.doneChip}>
                  <CheckCircle2 size={12} color="#166534" />
                  <Text style={styles.doneChipText}>Done</Text>
                </View>
              ) : (
                <View style={[styles.doneChip, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.doneChipText, { color: '#92400E' }]}>Pending</Text>
                </View>
              )}
            </View>
            {done && note?.completion_note ? (
              <Text style={styles.noteText}>Note: {note.completion_note}</Text>
            ) : null}
          </View>
        );
      })}

      {canReview && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Review This Plan</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Manager remarks (required)..."
            placeholderTextColor="#8A8178"
            value={remarks[plan.id] ?? ''}
            onChangeText={(v) => setRemarks((prev) => ({ ...prev, [plan.id]: v }))}
            multiline
          />
          <TextInput
            style={[styles.reviewInput, { minHeight: 44, textAlignVertical: 'center' }]}
            placeholder="Final score 0-100 (optional)"
            placeholderTextColor="#8A8178"
            value={scores[plan.id] ?? ''}
            onChangeText={(v) => setScores((prev) => ({ ...prev, [plan.id]: v }))}
            keyboardType="numeric"
          />
          <View style={styles.reviewBtnRow}>
            <TouchableOpacity
              style={[styles.reviewBtn, { backgroundColor: '#6D28D9' }, isLoading && { opacity: 0.6 }]}
              onPress={() => onReview(plan.id, 'manager_reviewed')}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.reviewBtnText}>Mark Reviewed</Text>
              )}
            </TouchableOpacity>
            {plan.progress_percentage === 100 && (
              <TouchableOpacity
                style={[styles.reviewBtn, { backgroundColor: '#166534' }, isLoading && { opacity: 0.6 }]}
                onPress={() => onReview(plan.id, 'closed')}
                disabled={isLoading}
              >
                <Text style={styles.reviewBtnText}>Close Plan</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {isFinal && plan.manager_remarks ? (
        <View style={styles.remarksBox}>
          <Text style={styles.remarksLabel}>Manager Remarks</Text>
          <Text style={styles.remarksText}>{plan.manager_remarks}</Text>
          {plan.final_score != null ? (
            <Text style={styles.scoreText}>Final Score: {plan.final_score}/100</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6EBDC' },
  header: {
    backgroundColor: '#102B45',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  backPillText: { color: '#FFEAC7', fontSize: 12, fontWeight: '900' },
  headerTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.72)', marginTop: 4, fontSize: 13, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 36 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    width: '47%',
    alignItems: 'center',
  },
  summaryValue: { fontSize: 28, fontWeight: '900' },
  summaryLabel: { color: '#6B3F20', fontSize: 12, fontWeight: '700', marginTop: 2 },
  createBtn: {
    backgroundColor: '#C95F18',
    borderRadius: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { color: '#102B45', fontSize: 18, fontWeight: '900' },
  emptyText: { color: '#6B3F20', fontSize: 13, fontWeight: '700', textAlign: 'center', paddingHorizontal: 24 },
  card: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { color: '#102B45', fontSize: 16, fontWeight: '900' },
  cardSub: { color: '#6B3F20', fontSize: 12, fontWeight: '700', marginTop: 2 },
  priorityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { color: '#8A8178', fontSize: 12, fontWeight: '700' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: '#6B3F20', fontSize: 12, fontWeight: '900' },
  progressPct: { color: '#C95F18', fontSize: 12, fontWeight: '900' },
  progressBg: { height: 8, backgroundColor: '#EAD7C2', borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: '#C95F18', borderRadius: 4 },
  actionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 4,
  },
  actionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionTitle: { color: '#102B45', fontSize: 13, fontWeight: '700', flex: 1 },
  actionTitleDone: { color: '#6B3F20', textDecorationLine: 'line-through' },
  noteText: { color: '#8A8178', fontSize: 12, fontWeight: '600' },
  doneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  doneChipText: { color: '#166534', fontSize: 11, fontWeight: '900' },
  reviewSection: {
    backgroundColor: '#F0F4FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C7D7F7',
    gap: 10,
  },
  reviewSectionTitle: { color: '#1D4ED8', fontSize: 13, fontWeight: '900' },
  reviewInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D7F7',
    padding: 10,
    color: '#102B45',
    fontSize: 13,
    fontWeight: '600',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  reviewBtnRow: { flexDirection: 'row', gap: 8 },
  reviewBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  reviewBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  remarksBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 4,
  },
  remarksLabel: { color: '#166534', fontSize: 11, fontWeight: '900' },
  remarksText: { color: '#102B45', fontSize: 13, fontWeight: '700' },
  scoreText: { color: '#166534', fontSize: 12, fontWeight: '900', marginTop: 4 },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 11, fontWeight: '900' },
});
