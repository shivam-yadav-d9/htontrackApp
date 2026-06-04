import { router, useLocalSearchParams } from 'expo-router';
import { AlertCircle, CheckCircle2, Clock, FileText, Star } from 'lucide-react-native';
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

import { taskService, type ManagerTask } from '@/services/task.service';

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    urgent: { bg: '#FEE2E2', color: '#B91C1C' },
    high: { bg: '#FFEDD5', color: '#C95F18' },
    medium: { bg: '#FEF3C7', color: '#92400E' },
    low: { bg: '#DCFCE7', color: '#166534' },
  };
  const c = map[priority] ?? { bg: '#F3F4F6', color: '#6B7280' };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.color }]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    assigned: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Assigned' },
    in_progress: { bg: '#FEF3C7', color: '#92400E', label: 'In Progress' },
    completed: { bg: '#DCFCE7', color: '#166534', label: 'Completed' },
    reviewed: { bg: '#D1FAE5', color: '#065F46', label: 'Reviewed' },
    reopened: { bg: '#FFEDD5', color: '#C95F18', label: 'Reopened' },
    cancelled: { bg: '#F3F4F6', color: '#6B7280', label: 'Cancelled' },
  };
  const c = map[status] ?? { bg: '#F3F4F6', color: '#6B7280', label: status };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

function TimelineItem({ event }: { event: any }) {
  const icons: Record<string, React.ReactNode> = {
    task_created: <FileText size={12} color="#1D4ED8" />,
    task_progress_updated: <Clock size={12} color="#92400E" />,
    task_completed: <CheckCircle2 size={12} color="#166534" />,
    task_reviewed: <Star size={12} color="#C95F18" />,
    task_reopened: <AlertCircle size={12} color="#B91C1C" />,
  };
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineDot}>{icons[event.event_type] ?? <View style={styles.timelineDotInner} />}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.timelineMessage}>{event.message}</Text>
        <Text style={styles.timelineTime}>
          {event.actor_name ?? 'System'} • {new Date(event.created_at).toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

export default function StaffTaskDetailScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<ManagerTask | null>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [progress, setProgress] = useState('');
  const [note, setNote] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [completionNote, setCompletionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (taskId) loadDetail();
  }, [taskId]);

  async function loadDetail() {
    try {
      setLoading(true);
      const data = await taskService.getMyTaskDetail(taskId!);
      setTask(data.task);
      setUpdates(data.updates ?? []);
      setReviews(data.reviews ?? []);
      setTimeline(data.timeline ?? []);
      setProgress(String(data.task.progress_percentage));
      setProofUrl(data.task.proof_url ?? '');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load task.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProgress() {
    const pct = parseFloat(progress);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      Alert.alert('Invalid', 'Progress must be between 0 and 100.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await taskService.updateMyTask(taskId!, {
        progress_percentage: pct,
        staff_note: note.trim() || undefined,
        proof_url: proofUrl.trim() || undefined,
      });
      setTask(result.task);
      setNote('');
      await loadDetail();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update progress.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleComplete() {
    if (task?.proof_required && !proofUrl.trim()) {
      Alert.alert('Proof Required', 'Please enter a proof URL before completing this task.');
      return;
    }
    if (task?.completion_note_required && !completionNote.trim()) {
      Alert.alert('Note Required', 'Please add a completion note before completing this task.');
      return;
    }
    setCompleting(true);
    try {
      const updated = await taskService.completeMyTask(taskId!, {
        completion_note: completionNote.trim() || undefined,
        proof_url: proofUrl.trim() || undefined,
      });
      setTask(updated);
      setCompletionNote('');
      await loadDetail();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to complete task.');
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color="#C95F18" style={{ flex: 1, alignSelf: 'center' }} />
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
            <Text style={styles.backPillText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: '#102B45', textAlign: 'center', marginTop: 40 }}>Task not found.</Text>
      </SafeAreaView>
    );
  }

  const canAct = !['completed', 'reviewed', 'cancelled'].includes(task.status);
  const latestReview = reviews[reviews.length - 1] ?? null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={2}>{task.title}</Text>
        <Text style={styles.headerSub}>
          {task.task_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} • Assigned by {task.manager_name}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Overdue Warning */}
        {task.is_overdue && (
          <View style={styles.overdueBar}>
            <AlertCircle size={14} color="#B91C1C" />
            <Text style={styles.overdueText}>
              Overdue by {task.overdue_hours.toFixed(1)} hours
            </Text>
          </View>
        )}

        {/* Status + Priority Row */}
        <View style={styles.badgeRow}>
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </View>

        {/* Task Info */}
        <View style={styles.card}>
          {task.description ? (
            <Text style={styles.descText}>{task.description}</Text>
          ) : null}

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Assigned</Text>
              <Text style={styles.infoValue}>{task.assigned_date}</Text>
            </View>
            {task.due_date ? (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Due</Text>
                <Text style={[styles.infoValue, task.is_overdue && { color: '#B91C1C' }]}>
                  {task.due_date}{task.due_time ? ` ${task.due_time}` : ''}
                </Text>
              </View>
            ) : null}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>SLA</Text>
              <Text style={styles.infoValue}>{task.sla_hours}h</Text>
            </View>
            {task.sla_deadline ? (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Deadline</Text>
                <Text style={[styles.infoValue, task.is_overdue && { color: '#B91C1C' }]}>
                  {new Date(task.sla_deadline).toLocaleString()}
                </Text>
              </View>
            ) : null}
          </View>

          {task.source_type && task.source_type !== 'manual' ? (
            <Text style={styles.sourceText}>Source: {task.source_type.replace(/_/g, ' ')}</Text>
          ) : null}
        </View>

        {/* Progress Bar */}
        <View style={styles.card}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>Progress</Text>
            <Text style={styles.progressPct}>{task.progress_percentage}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${task.progress_percentage}%` as any }]} />
          </View>
          {task.staff_note ? (
            <Text style={styles.staffNoteText}>"{task.staff_note}"</Text>
          ) : null}
          {task.proof_url ? (
            <Text style={styles.proofText}>Proof: {task.proof_url}</Text>
          ) : null}
        </View>

        {/* Update / Complete Actions */}
        {canAct && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Update Task</Text>

            <Text style={styles.inputLabel}>Progress % (0-100)</Text>
            <TextInput
              style={styles.smallInput}
              value={progress}
              onChangeText={setProgress}
              keyboardType="decimal-pad"
              placeholder="0-100"
              placeholderTextColor="#8A8178"
            />

            <Text style={styles.inputLabel}>Update Note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Describe your progress..."
              placeholderTextColor="#8A8178"
              multiline
            />

            <Text style={styles.inputLabel}>
              Proof URL{task.proof_required ? ' *' : ' (optional)'}
            </Text>
            <TextInput
              style={styles.smallInput}
              value={proofUrl}
              onChangeText={setProofUrl}
              placeholder="https://..."
              placeholderTextColor="#8A8178"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.updateBtn, submitting && { opacity: 0.6 }]}
              onPress={handleUpdateProgress}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.updateBtnText}>Save Progress</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Complete Task</Text>
            <Text style={styles.inputLabel}>
              Completion Note{task.completion_note_required ? ' *' : ' (optional)'}
            </Text>
            <TextInput
              style={styles.noteInput}
              value={completionNote}
              onChangeText={setCompletionNote}
              placeholder="Describe what was done..."
              placeholderTextColor="#8A8178"
              multiline
            />

            <TouchableOpacity
              style={[styles.completeBtn, completing && { opacity: 0.6 }]}
              onPress={handleComplete}
              disabled={completing}
            >
              {completing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={15} color="#FFFFFF" />
                  <Text style={styles.completeBtnText}>Mark as Complete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Manager Review */}
        {latestReview && (
          <View style={[styles.card, { backgroundColor: latestReview.review_status === 'approved' ? '#F0FDF4' : '#FFF7ED' }]}>
            <Text style={styles.sectionTitle}>Manager Review</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, {
                backgroundColor: latestReview.review_status === 'approved' ? '#DCFCE7' : '#FEE2E2',
              }]}>
                <Text style={[styles.badgeText, {
                  color: latestReview.review_status === 'approved' ? '#166534' : '#B91C1C',
                }]}>
                  {latestReview.review_status === 'approved' ? 'Approved' : latestReview.review_status.replace('_', ' ')}
                </Text>
              </View>
              {latestReview.rating ? (
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={14}
                      color={i <= latestReview.rating ? '#C95F18' : '#EAD7C2'}
                      fill={i <= latestReview.rating ? '#C95F18' : 'none'}
                    />
                  ))}
                </View>
              ) : null}
            </View>
            {latestReview.manager_remarks ? (
              <Text style={styles.remarksText}>{latestReview.manager_remarks}</Text>
            ) : null}
            <Text style={styles.reviewedAt}>
              {latestReview.manager_name} • {new Date(latestReview.created_at).toLocaleDateString()}
            </Text>
          </View>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Activity</Text>
            {timeline.map((event, i) => (
              <TimelineItem key={event.id ?? i} event={event} />
            ))}
          </View>
        )}

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
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
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.72)', marginTop: 4, fontSize: 12, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 14, gap: 12, paddingBottom: 36 },
  overdueBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  overdueText: { color: '#B91C1C', fontSize: 13, fontWeight: '900', flex: 1 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 11, fontWeight: '900' },
  card: {
    backgroundColor: '#FFFDF8',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 10,
  },
  descText: { color: '#374151', fontSize: 14, fontWeight: '600', lineHeight: 20 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoItem: { minWidth: 110 },
  infoLabel: { color: '#8A8178', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  infoValue: { color: '#102B45', fontSize: 13, fontWeight: '800', marginTop: 2 },
  sourceText: { color: '#6B3F20', fontSize: 11, fontWeight: '700' },
  sectionTitle: { color: '#102B45', fontSize: 14, fontWeight: '900' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressPct: { color: '#C95F18', fontSize: 18, fontWeight: '900' },
  progressBg: { height: 8, backgroundColor: '#EAD7C2', borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: '#C95F18', borderRadius: 4 },
  staffNoteText: { color: '#6B3F20', fontSize: 13, fontWeight: '600', fontStyle: 'italic' },
  proofText: { color: '#1D4ED8', fontSize: 12, fontWeight: '700' },
  inputLabel: { color: '#6B3F20', fontSize: 11, fontWeight: '900' },
  smallInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    padding: 10,
    color: '#102B45',
    fontSize: 14,
    fontWeight: '700',
  },
  noteInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    padding: 10,
    color: '#102B45',
    fontSize: 13,
    fontWeight: '600',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  updateBtn: {
    backgroundColor: '#102B45',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  updateBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  divider: { height: 1, backgroundColor: '#EAD7C2' },
  completeBtn: {
    backgroundColor: '#166534',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  ratingRow: { flexDirection: 'row', gap: 3 },
  remarksText: { color: '#102B45', fontSize: 13, fontWeight: '700' },
  reviewedAt: { color: '#8A8178', fontSize: 11, fontWeight: '700' },
  timelineItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8DE',
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0E8DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C95F18' },
  timelineMessage: { color: '#102B45', fontSize: 12, fontWeight: '700' },
  timelineTime: { color: '#8A8178', fontSize: 11, fontWeight: '600', marginTop: 2 },
});
