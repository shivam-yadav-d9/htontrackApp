import { router } from 'expo-router';
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { taskService, type ManagerTask } from '@/services/task.service';

const STATUS_TABS = ['all', 'assigned', 'in_progress', 'completed'] as const;

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    urgent: '#B91C1C',
    high: '#C95F18',
    medium: '#92400E',
    low: '#166534',
  };
  return (
    <View style={[styles.priorityDot, { backgroundColor: colors[priority] ?? '#6B7280' }]} />
  );
}

function StatusBadge({ status, isOverdue }: { status: string; isOverdue: boolean }) {
  if (isOverdue) {
    return (
      <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
        <AlertCircle size={10} color="#B91C1C" />
        <Text style={[styles.badgeText, { color: '#B91C1C' }]}>Overdue</Text>
      </View>
    );
  }
  const map: Record<string, { bg: string; color: string; label: string }> = {
    assigned: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Assigned' },
    in_progress: { bg: '#FEF3C7', color: '#92400E', label: 'In Progress' },
    completed: { bg: '#DCFCE7', color: '#166534', label: 'Completed' },
    cancelled: { bg: '#F3F4F6', color: '#6B7280', label: 'Cancelled' },
  };
  const c = map[status] ?? { bg: '#F3F4F6', color: '#6B7280', label: status };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

function TaskTypeLabel({ taskType }: { taskType: string }) {
  const label = taskType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return <Text style={styles.taskTypeText}>{label}</Text>;
}

function TaskCard({
  task,
  onUpdate,
  onComplete,
}: {
  task: ManagerTask;
  onUpdate: (taskId: string, progress: number, note: string) => void;
  onComplete: (taskId: string, note: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState(String(task.progress_percentage));
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canAct = !['completed', 'cancelled'].includes(task.status);

  async function handleUpdate() {
    const pct = parseInt(progress, 10);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      Alert.alert('Invalid', 'Progress must be 0-100.');
      return;
    }
    setSubmitting(true);
    try {
      await onUpdate(task.id, pct, note.trim());
      setNote('');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleComplete() {
    setSubmitting(true);
    try {
      await onComplete(task.id, note.trim());
      setNote('');
      setExpanded(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <TouchableOpacity
      style={styles.taskCard}
      onPress={() => canAct && setExpanded((e) => !e)}
      activeOpacity={canAct ? 0.85 : 1}
    >
      <View style={styles.taskCardTop}>
        <View style={styles.taskLeft}>
          <PriorityDot priority={task.priority} />
          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <TaskTypeLabel taskType={task.task_type} />
          </View>
        </View>
        <StatusBadge status={task.status} isOverdue={task.is_overdue} />
      </View>

      {task.due_date && (
        <View style={styles.dueDateRow}>
          <Clock size={11} color="#8A8178" />
          <Text style={styles.dueDateText}>Due: {task.due_date}</Text>
          {task.sla_hours > 0 && (
            <Text style={styles.slaText}>SLA: {task.sla_hours}h</Text>
          )}
        </View>
      )}

      {task.progress_percentage > 0 && (
        <View style={styles.progressRow}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${task.progress_percentage}%` as any }]} />
          </View>
          <Text style={styles.progressPct}>{task.progress_percentage}%</Text>
        </View>
      )}

      {task.staff_note ? (
        <Text style={styles.staffNoteText} numberOfLines={2}>{task.staff_note}</Text>
      ) : null}

      {expanded && canAct && (
        <View style={styles.expandedSection}>
          {task.description ? (
            <Text style={styles.descText}>{task.description}</Text>
          ) : null}
          <Text style={styles.inputLabel}>Progress %</Text>
          <TextInput
            style={styles.progressInput}
            value={progress}
            onChangeText={setProgress}
            keyboardType="numeric"
            placeholder="0-100"
            placeholderTextColor="#8A8178"
          />
          <Text style={styles.inputLabel}>Note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add update note..."
            placeholderTextColor="#8A8178"
            multiline
          />
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.updateBtn, submitting && { opacity: 0.6 }]}
              onPress={handleUpdate}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.updateBtnText}>Update Progress</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.completeBtn, submitting && { opacity: 0.6 }]}
              onPress={handleComplete}
              disabled={submitting}
            >
              <CheckCircle2 size={14} color="#FFFFFF" />
              <Text style={styles.completeBtnText}>Mark Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function StaffTasksScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<ManagerTask[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    try {
      setLoading(true);
      const { tasks: data } = await taskService.getMyTasks();
      setTasks(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  }

  async function handleUpdate(taskId: string, progress: number, note: string) {
    try {
      const result = await taskService.updateMyTask(taskId, { progress_percentage: progress, staff_note: note || undefined });
      setTasks((prev) => prev.map((t) => t.id === taskId ? result.task : t));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update task.');
    }
  }

  async function handleComplete(taskId: string, note: string) {
    try {
      const updated = await taskService.completeMyTask(taskId, { completion_note: note || undefined });
      setTasks((prev) => prev.map((t) => t.id === taskId ? updated : t));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to complete task.');
    }
  }

  const filtered = activeTab === 'all'
    ? tasks
    : tasks.filter((t) => t.status === activeTab);

  const overdue = tasks.filter((t) => t.is_overdue).length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <Text style={styles.headerSub}>
          {tasks.length} tasks{overdue > 0 ? ` • ${overdue} overdue` : ''}
        </Text>
      </View>

      <View style={styles.tabsRow}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'all' ? 'All' : tab.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {loading ? (
          <ActivityIndicator color="#C95F18" style={{ marginTop: 32 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Loader2 size={32} color="#8A8178" />
            <Text style={styles.emptyTitle}>No tasks here</Text>
            <Text style={styles.emptySub}>
              {activeTab === 'all' ? 'No tasks assigned yet' : `No ${activeTab.replace('_', ' ')} tasks`}
            </Text>
          </View>
        ) : (
          filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdate={handleUpdate}
              onComplete={handleComplete}
            />
          ))
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
  headerTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.72)', marginTop: 4, fontSize: 13, fontWeight: '700' },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: '#F6EBDC',
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: '#EAD7C2',
  },
  tabActive: { backgroundColor: '#102B45' },
  tabText: { fontSize: 11, fontWeight: '700', color: '#6B3F20' },
  tabTextActive: { color: '#FFFFFF' },
  scroll: { flex: 1 },
  content: { padding: 14, gap: 12, paddingBottom: 36 },
  emptyCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#EAD7C2',
  },
  emptyTitle: { color: '#102B45', fontSize: 15, fontWeight: '900' },
  emptySub: { color: '#8A8178', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  taskCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 8,
  },
  taskCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  taskLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flex: 1 },
  priorityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  taskTitle: { color: '#102B45', fontSize: 14, fontWeight: '900', flex: 1 },
  taskTypeText: { color: '#C95F18', fontSize: 11, fontWeight: '700', marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '900' },
  dueDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dueDateText: { color: '#8A8178', fontSize: 11, fontWeight: '700' },
  slaText: { color: '#6B3F20', fontSize: 11, fontWeight: '700', marginLeft: 6 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBg: { flex: 1, height: 6, backgroundColor: '#EAD7C2', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: '#C95F18', borderRadius: 3 },
  progressPct: { color: '#C95F18', fontSize: 11, fontWeight: '900', width: 34, textAlign: 'right' },
  staffNoteText: { color: '#6B3F20', fontSize: 12, fontWeight: '600', fontStyle: 'italic' },
  expandedSection: {
    borderTopWidth: 1,
    borderTopColor: '#EAD7C2',
    paddingTop: 10,
    gap: 8,
    marginTop: 4,
  },
  descText: { color: '#374151', fontSize: 13, fontWeight: '600' },
  inputLabel: { color: '#6B3F20', fontSize: 11, fontWeight: '900' },
  progressInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    padding: 10,
    color: '#102B45',
    fontSize: 15,
    fontWeight: '700',
    width: 80,
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
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actionRow: { flexDirection: 'row', gap: 8 },
  updateBtn: {
    flex: 1,
    backgroundColor: '#102B45',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  updateBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  completeBtn: {
    flex: 1,
    backgroundColor: '#166534',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  completeBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
});
