import { router } from 'expo-router';
import {
  AlertCircle, CheckSquare, ChevronRight, ClipboardList,
  ListTodo, PenLine, Ticket, Wrench,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StaffPageHeader } from '@/components/StaffPageHeader';
import { COLORS, BorderRadius, Spacing, Shadow } from '@/constants/theme';
import { taskService } from '@/services/task.service';
import { checklistService } from '@/services/checklist.service';

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

export default function WorkScreen() {
  const [pendingTasks, setPendingTasks] = useState(0);
  const [pendingChecklists, setPendingChecklists] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const taskResult: any = await taskService.getMyTasks().catch(() => ({ tasks: [] }));
      const tasks = taskResult?.tasks ?? taskResult ?? [];
      setPendingTasks(
        Array.isArray(tasks)
          ? tasks.filter((t: any) => t.status === 'pending' || t.status === 'in_progress').length
          : 0
      );
    } catch {}
    try {
      const lists: any[] = await checklistService.getMyChecklists().catch(() => []);
      setPendingChecklists(
        Array.isArray(lists)
          ? lists.filter((c: any) => c.status === 'assigned' || c.status === 'in_progress').length
          : 0
      );
    } catch {}
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const items: HubItem[] = [
    {
      icon: <PenLine size={22} color={COLORS.orange} />,
      title: 'My Tasks',
      subtitle: pendingTasks > 0 ? `${pendingTasks} task${pendingTasks > 1 ? 's' : ''} pending` : 'No pending tasks',
      route: '/staff/tasks',
      badge: pendingTasks || undefined,
      color: COLORS.orange,
    },
    {
      icon: <CheckSquare size={22} color={COLORS.success} />,
      title: 'Checklists',
      subtitle: pendingChecklists > 0 ? `${pendingChecklists} checklist${pendingChecklists > 1 ? 's' : ''} to complete` : 'Daily compliance checklists',
      route: '/staff/checklists',
      badge: pendingChecklists || undefined,
      color: COLORS.success,
    },
    {
      icon: <Ticket size={22} color='#7C3AED' />,
      title: 'Tickets',
      subtitle: 'Raise and track support requests',
      route: '/staff/tickets',
      color: '#7C3AED',
    },
    {
      icon: <ListTodo size={22} color={COLORS.blue} />,
      title: 'To-Do List',
      subtitle: 'Personal reminders and quick tasks',
      route: '/staff/todos',
      color: COLORS.blue,
    },
    {
      icon: <Wrench size={22} color='#0891B2' />,
      title: 'Duties',
      subtitle: 'View your assigned shift duties',
      route: '/staff/duties',
      color: '#0891B2',
    },
    {
      icon: <ClipboardList size={22} color={COLORS.brown} />,
      title: 'Assignments',
      subtitle: 'Store tasks assigned by manager',
      route: '/staff/assignments',
      color: COLORS.brown,
    },
    {
      icon: <AlertCircle size={22} color={COLORS.error} />,
      title: 'Performance Alerts',
      subtitle: 'Flags and action items from manager',
      route: '/staff/performance-alerts',
      color: COLORS.error,
    },
    {
      icon: <CheckSquare size={22} color={COLORS.gray} />,
      title: 'Skill Matrix',
      subtitle: 'Your competency assessment',
      route: '/staff/skill-matrix',
      color: COLORS.gray,
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StaffPageHeader
        title="Daily Work"
        subtitle={
          (pendingTasks + pendingChecklists) > 0
            ? `${pendingTasks + pendingChecklists} items need attention`
            : 'All caught up'
        }
      />

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
