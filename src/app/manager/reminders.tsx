import { router } from 'expo-router';
import { Bell, BellPlus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
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

import { notificationService } from '@/services/notification.service';
import type { Reminder, ReminderSummary } from '@/types/notification.types';

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  urgent: { bg: '#FEE2E2', text: '#B91C1C' },
  high: { bg: '#FEF3C7', text: '#92400E' },
  medium: { bg: '#DBEAFE', text: '#1D4ED8' },
  low: { bg: '#F3F4F6', text: '#6B7280' },
};

export default function ManagerRemindersScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<ReminderSummary | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => { loadReminders(); }, []);

  async function loadReminders() {
    try {
      setLoading(true);
      const data = await notificationService.getManagerReminders() as any;
      setSummary(data.summary);
      setReminders(data.reminders ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    try { setRefreshing(true); await loadReminders(); } finally { setRefreshing(false); }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reminders</Text>
        <Text style={styles.headerSub}>Track reminders assigned to staff</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {summary ? (
          <View style={styles.summaryGrid}>
            <SummaryCard label="Total" value={summary.total} />
            <SummaryCard label="Pending" value={summary.pending} />
            <SummaryCard label="Urgent" value={summary.urgent} />
            <SummaryCard label="Completed" value={summary.completed} />
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/manager/create-reminder' as any)}
        >
          <BellPlus size={18} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create Reminder</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#C95F18" />
            <Text style={styles.loadingText}>Loading reminders...</Text>
          </View>
        ) : reminders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Bell size={34} color="#8A8178" />
            <Text style={styles.emptyTitle}>No reminders yet</Text>
          </View>
        ) : (
          reminders.map((item) => {
            const pStyle = PRIORITY_COLORS[item.priority] ?? PRIORITY_COLORS.low;
            const completed = item.status === 'completed';
            return (
              <View key={item.id} style={styles.reminderCard}>
                <View style={styles.reminderTop}>
                  <View style={styles.iconBox}>
                    <Bell size={19} color="#C95F18" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderTitle}>{item.title}</Text>
                    <Text style={styles.reminderMeta}>
                      {item.assigned_to_name} · {item.category}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, completed && styles.statusDone]}>
                    <Text style={[styles.statusText, completed && styles.statusDoneText]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.reminderDesc}>{item.description}</Text>

                <View style={styles.dueRow}>
                  <View style={styles.dueBox}>
                    <Text style={styles.dueLabel}>Due</Text>
                    <Text style={styles.dueText}>{item.due_date}{item.due_time ? ` ${item.due_time}` : ''}</Text>
                  </View>
                  <View style={[styles.priorityChip, { backgroundColor: pStyle.bg }]}>
                    <Text style={[styles.priorityText, { color: pStyle.text }]}>{item.priority}</Text>
                  </View>
                </View>

                {item.completion_note ? (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteLabel}>Completion Note</Text>
                    <Text style={styles.noteText}>{item.completion_note}</Text>
                  </View>
                ) : null}
              </View>
            );
          })
        )}

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
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
    gap: 6,
  },
  backPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 4,
  },
  backText: { color: '#FFEAC7', fontSize: 12, fontWeight: '900' },
  headerTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 36 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: {
    width: '48%',
    backgroundColor: '#FFFDF8',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAD7C2',
  },
  summaryValue: { color: '#102B45', fontSize: 26, fontWeight: '900' },
  summaryLabel: { color: '#8A8178', fontSize: 11, fontWeight: '800', marginTop: 3 },
  createButton: {
    backgroundColor: '#C95F18',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  createButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  loadingCard: { backgroundColor: '#FFFDF8', borderRadius: 24, padding: 24, alignItems: 'center', gap: 8 },
  loadingText: { color: '#8A8178', fontWeight: '700' },
  emptyCard: { backgroundColor: '#FFFDF8', borderRadius: 24, padding: 28, alignItems: 'center', gap: 8 },
  emptyTitle: { color: '#102B45', fontSize: 16, fontWeight: '900' },
  reminderCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 10,
  },
  reminderTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  iconBox: {
    width: 42, height: 42, borderRadius: 15,
    backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center',
  },
  reminderTitle: { color: '#102B45', fontSize: 14, fontWeight: '900' },
  reminderMeta: { color: '#8A8178', fontSize: 11, fontWeight: '800', marginTop: 2 },
  statusChip: {
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusDone: { backgroundColor: '#DCFCE7' },
  statusText: { color: '#92400E', fontSize: 10, fontWeight: '900', textTransform: 'capitalize' },
  statusDoneText: { color: '#166534' },
  reminderDesc: { color: '#6B3F20', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  dueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dueBox: { gap: 2 },
  dueLabel: { color: '#8A8178', fontSize: 10, fontWeight: '800' },
  dueText: { color: '#102B45', fontSize: 12, fontWeight: '900' },
  priorityChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priorityText: { fontSize: 11, fontWeight: '900', textTransform: 'capitalize' },
  noteBox: { backgroundColor: '#DCFCE7', borderRadius: 14, padding: 11, gap: 3 },
  noteLabel: { color: '#166534', fontSize: 10, fontWeight: '900' },
  noteText: { color: '#14532D', fontSize: 12, fontWeight: '700' },
});
