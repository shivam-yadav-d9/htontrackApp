import { router } from 'expo-router';
import { CheckCircle2, ClipboardPenLine } from 'lucide-react-native';
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
import type { CoachingPlan } from '@/types/coaching.types';

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    assigned: { label: 'Assigned', bg: '#FEE2E2', color: '#B91C1C' },
    in_progress: { label: 'In Progress', bg: '#FEF3C7', color: '#92400E' },
    staff_completed: { label: 'Completed', bg: '#DBEAFE', color: '#1D4ED8' },
    manager_reviewed: { label: 'Reviewed', bg: '#DBEAFE', color: '#1D4ED8' },
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

function RoleCoachingCard({ plan }: { plan: any }) {
  const score = plan.current_score ?? 0;
  const levelColor = score < 40 ? '#B91C1C' : score < 60 ? '#92400E' : '#166534';
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{plan.coaching_title ?? plan.title ?? 'Coaching Plan'}</Text>
          <Text style={styles.cardSub}>{plan.skill_name ?? plan.category} • {plan.manager_name ?? 'Manager'}</Text>
        </View>
        <StatusChip status={plan.status} />
      </View>
      <View style={styles.priorityRow}>
        <PriorityChip priority={plan.priority ?? 'medium'} />
        {plan.due_date ? <Text style={styles.dateText}>Due: {plan.due_date}</Text> : null}
      </View>
      {plan.coaching_notes ? <Text style={styles.descText}>{plan.coaching_notes}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.progressLabel, { marginBottom: 4 }]}>Score Progress</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.min(score, 100)}%` as any, backgroundColor: levelColor }]} />
          </View>
        </View>
        <Text style={[styles.progressPct, { color: levelColor }]}>{score}% → {plan.target_score ?? 70}%</Text>
      </View>
    </View>
  );
}

export default function StaffCoachingPlansScreen() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<CoachingPlan[]>([]);
  const [isRoleBased, setIsRoleBased] = useState(false);
  const [completing, setCompleting] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => { loadPlans(); }, []);

  async function loadPlans() {
    try {
      setLoading(true);
      // Try role-based coaching plans first
      try {
        const result = await coachingService.getMyRoleCoachingPlans();
        if (result.plans.length > 0) {
          setPlans(result.plans as CoachingPlan[]);
          setIsRoleBased(true);
          return;
        }
      } catch {
        // fall through to legacy
      }
      const data = await coachingService.getMyCoachingPlans();
      setPlans(data as CoachingPlan[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function markComplete(planId: string, actionId: string) {
    const key = `${planId}-${actionId}`;
    try {
      setCompleting((prev) => ({ ...prev, [key]: true }));
      const note = notes[key] ?? '';
      const updated = await coachingService.completeAction(planId, actionId, {
        completion_note: note.trim() || undefined,
      });
      setPlans((prev) => prev.map((p) => (p.id === planId ? (updated as CoachingPlan) : p)));
      setNotes((prev) => { const n = { ...prev }; delete n[key]; return n; });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to complete action.');
    } finally {
      setCompleting((prev) => ({ ...prev, [key]: false }));
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Coaching Plans</Text>
        <Text style={styles.headerSub}>Track your improvement actions</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#C95F18" style={{ marginTop: 40 }} />
        ) : plans.length === 0 ? (
          <View style={styles.empty}>
            <ClipboardPenLine size={36} color="#C95F18" />
            <Text style={styles.emptyTitle}>No Coaching Plans</Text>
            <Text style={styles.emptyText}>Your manager hasn't assigned any coaching plans yet.</Text>
          </View>
        ) : isRoleBased ? (
          plans.map((plan: any) => <RoleCoachingCard key={plan.id} plan={plan} />)
        ) : (
          plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              notes={notes}
              completing={completing}
              setNotes={setNotes}
              onComplete={markComplete}
            />
          ))
        )}
        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanCard({
  plan, notes, completing, setNotes, onComplete,
}: {
  plan: CoachingPlan;
  notes: Record<string, string>;
  completing: Record<string, boolean>;
  setNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onComplete: (planId: string, actionId: string) => void;
}) {
  const isFinal = plan.status === 'closed' || plan.status === 'manager_reviewed';
  const completedIds = new Set(plan.completed_action_ids ?? []);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{plan.title}</Text>
          <Text style={styles.cardSub}>{plan.category} • Assigned by {plan.created_by_name ?? 'Manager'}</Text>
        </View>
        <StatusChip status={plan.status} />
      </View>

      <View style={styles.priorityRow}>
        <PriorityChip priority={plan.priority} />
        {plan.due_date ? <Text style={styles.dateText}>Due: {plan.due_date}</Text> : null}
      </View>

      <Text style={styles.descText}>{plan.description}</Text>

      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>Progress</Text>
        <Text style={styles.progressPct}>{plan.progress_percentage}%</Text>
      </View>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${plan.progress_percentage}%` as any }]} />
      </View>

      <View style={styles.criteriaBox}>
        <Text style={styles.criteriaLabel}>Success Criteria</Text>
        <Text style={styles.criteriaText}>{plan.success_criteria}</Text>
      </View>

      <Text style={styles.sectionLabel}>Action Items</Text>
      {(plan.action_items ?? []).map((action) => {
        const done = completedIds.has(action.id);
        const key = `${plan.id}-${action.id}`;
        const isLoading = completing[key] ?? false;
        return (
          <View key={action.id} style={styles.actionBox}>
            <View style={styles.actionHeader}>
              <Text style={[styles.actionTitle, done && styles.actionTitleDone]}>
                {action.sort_order}. {action.title}
              </Text>
              {done && (
                <View style={styles.doneChip}>
                  <CheckCircle2 size={12} color="#166534" />
                  <Text style={styles.doneChipText}>Done</Text>
                </View>
              )}
            </View>
            {!done && !isFinal && (
              <View style={styles.completeSection}>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Add completion note (optional)..."
                  placeholderTextColor="#8A8178"
                  value={notes[key] ?? ''}
                  onChangeText={(v) => setNotes((prev) => ({ ...prev, [key]: v }))}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.completeBtn, isLoading && { opacity: 0.6 }]}
                  onPress={() => onComplete(plan.id, action.id)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.completeBtnText}>Mark Complete</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}

      {plan.manager_remarks ? (
        <View style={styles.remarksBox}>
          <Text style={styles.remarksLabel}>Manager Feedback</Text>
          <Text style={styles.remarksText}>{plan.manager_remarks}</Text>
          {plan.final_score != null && (
            <Text style={styles.scoreText}>Score: {plan.final_score}/100</Text>
          )}
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
  descText: { color: '#374151', fontSize: 13, fontWeight: '600' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: '#6B3F20', fontSize: 12, fontWeight: '900' },
  progressPct: { color: '#C95F18', fontSize: 12, fontWeight: '900' },
  progressBg: { height: 8, backgroundColor: '#EAD7C2', borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: '#C95F18', borderRadius: 4 },
  criteriaBox: {
    backgroundColor: '#FFF3E8',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F6A15A',
    gap: 4,
  },
  criteriaLabel: { color: '#C95F18', fontSize: 11, fontWeight: '900' },
  criteriaText: { color: '#102B45', fontSize: 13, fontWeight: '700' },
  sectionLabel: { color: '#6B3F20', fontSize: 13, fontWeight: '900' },
  actionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 8,
  },
  actionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionTitle: { color: '#102B45', fontSize: 13, fontWeight: '700', flex: 1 },
  actionTitleDone: { color: '#6B3F20', textDecorationLine: 'line-through' },
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
  completeSection: { gap: 8 },
  noteInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    padding: 10,
    color: '#102B45',
    fontSize: 13,
    fontWeight: '600',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  completeBtn: {
    backgroundColor: '#166534',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  completeBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
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
