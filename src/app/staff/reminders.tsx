import { router } from 'expo-router';
import { Bell, CheckCircle2 } from 'lucide-react-native';
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

import { notificationService } from '@/services/notification.service';
import type { Reminder } from '@/types/notification.types';

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  urgent: { bg: '#FEE2E2', text: '#B91C1C' },
  high: { bg: '#FEF3C7', text: '#92400E' },
  medium: { bg: '#DBEAFE', text: '#1D4ED8' },
  low: { bg: '#F3F4F6', text: '#6B7280' },
};

export default function StaffRemindersScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState<Record<string, string>>({});

  useEffect(() => { loadReminders(); }, []);

  async function loadReminders() {
    try {
      setLoading(true);
      const data = await notificationService.getMyReminders();
      setReminders(data as Reminder[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    try { setRefreshing(true); await loadReminders(); } finally { setRefreshing(false); }
  }

  async function completeReminder(reminderId: string) {
    try {
      setCompletingId(reminderId);
      const note = completionNotes[reminderId]?.trim() || undefined;
      await notificationService.completeReminder(reminderId, note);
      await loadReminders();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to complete reminder.');
    } finally {
      setCompletingId(null);
    }
  }

  const pending = reminders.filter((r) => r.status === 'pending');
  const completed = reminders.filter((r) => r.status === 'completed');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reminders</Text>
        <Text style={styles.headerSub}>{pending.length} pending · {completed.length} completed</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#C95F18" />
            <Text style={styles.loadingText}>Loading reminders...</Text>
          </View>
        ) : reminders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Bell size={34} color="#8A8178" />
            <Text style={styles.emptyTitle}>No reminders assigned</Text>
          </View>
        ) : (
          reminders.map((item) => {
            const pStyle = PRIORITY_COLORS[item.priority] ?? PRIORITY_COLORS.low;
            const isCompleted = item.status === 'completed';
            const isCompleting = completingId === item.id;

            return (
              <View key={item.id} style={[styles.reminderCard, isCompleted && styles.completedCard]}>
                <View style={styles.reminderTop}>
                  <View style={[styles.iconBox, isCompleted && styles.iconBoxDone]}>
                    {isCompleted
                      ? <CheckCircle2 size={19} color="#166534" />
                      : <Bell size={19} color="#C95F18" />
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderTitle}>{item.title}</Text>
                    <Text style={styles.reminderMeta}>{item.category}</Text>
                  </View>
                  <View style={[styles.priorityChip, { backgroundColor: pStyle.bg }]}>
                    <Text style={[styles.priorityText, { color: pStyle.text }]}>{item.priority}</Text>
                  </View>
                </View>

                <Text style={styles.reminderDesc}>{item.description}</Text>

                <View style={styles.dueRow}>
                  <View style={styles.dueBox}>
                    <Text style={styles.dueLabel}>Due</Text>
                    <Text style={styles.dueText}>{item.due_date}{item.due_time ? ` ${item.due_time}` : ''}</Text>
                  </View>
                  {item.created_by_name ? (
                    <Text style={styles.fromText}>From: {item.created_by_name}</Text>
                  ) : null}
                </View>

                {isCompleted && item.completion_note ? (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteLabel}>Your note</Text>
                    <Text style={styles.noteText}>{item.completion_note}</Text>
                  </View>
                ) : null}

                {!isCompleted && (
                  <View style={styles.completeSection}>
                    <TextInput
                      style={styles.noteInput}
                      value={completionNotes[item.id] ?? ''}
                      onChangeText={(text) =>
                        setCompletionNotes((prev) => ({ ...prev, [item.id]: text }))
                      }
                      placeholder="Add a completion note (optional)"
                      placeholderTextColor="#8A8178"
                    />
                    <TouchableOpacity
                      style={[styles.completeButton, isCompleting && { opacity: 0.6 }]}
                      onPress={() => completeReminder(item.id)}
                      disabled={isCompleting}
                    >
                      {isCompleting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <CheckCircle2 size={16} color="#FFFFFF" />
                          <Text style={styles.completeButtonText}>Mark Complete</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
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
  completedCard: { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
  reminderTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  iconBox: {
    width: 42, height: 42, borderRadius: 15,
    backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center',
  },
  iconBoxDone: { backgroundColor: '#DCFCE7' },
  reminderTitle: { color: '#102B45', fontSize: 14, fontWeight: '900' },
  reminderMeta: { color: '#8A8178', fontSize: 11, fontWeight: '800', marginTop: 2 },
  priorityChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  priorityText: { fontSize: 11, fontWeight: '900', textTransform: 'capitalize' },
  reminderDesc: { color: '#6B3F20', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  dueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dueBox: { gap: 2 },
  dueLabel: { color: '#8A8178', fontSize: 10, fontWeight: '800' },
  dueText: { color: '#102B45', fontSize: 12, fontWeight: '900' },
  fromText: { color: '#8A8178', fontSize: 11, fontWeight: '700' },
  noteBox: { backgroundColor: '#DCFCE7', borderRadius: 14, padding: 11, gap: 3 },
  noteLabel: { color: '#166534', fontSize: 10, fontWeight: '900' },
  noteText: { color: '#14532D', fontSize: 12, fontWeight: '700' },
  completeSection: { gap: 9 },
  noteInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#102B45',
    fontWeight: '700',
    fontSize: 12,
  },
  completeButton: {
    backgroundColor: '#166534',
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  completeButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
});
