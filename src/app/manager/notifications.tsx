import { router } from 'expo-router';
import { Bell, BellPlus, CheckCheck } from 'lucide-react-native';
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
import type {
  NotificationAudience,
  NotificationCreatePayload,
  NotificationItem,
  NotificationPriority,
  NotificationType,
} from '@/types/notification.types';

const TYPES: NotificationType[] = [
  'announcement', 'assignment', 'course', 'quiz', 'checklist',
  'attendance', 'coaching', 'reward', 'certificate', 'reminder', 'general',
];
const PRIORITIES: NotificationPriority[] = ['low', 'medium', 'high', 'urgent'];
const AUDIENCES: NotificationAudience[] = ['staff', 'manager', 'store'];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#B91C1C',
  high: '#C95F18',
  medium: '#B7791F',
  low: '#6B7280',
};

export default function ManagerNotificationsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notifType, setNotifType] = useState<NotificationType>('announcement');
  const [priority, setPriority] = useState<NotificationPriority>('medium');
  const [audience, setAudience] = useState<NotificationAudience>('staff');
  const [actionLabel, setActionLabel] = useState('');
  const [actionRoute, setActionRoute] = useState('');

  useEffect(() => { loadNotifications(); }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      const data = await notificationService.getMyNotifications();
      setNotifications(data as NotificationItem[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    try { setRefreshing(true); await loadNotifications(); } finally { setRefreshing(false); }
  }

  async function sendNotification() {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Validation', 'Title and message are required.');
      return;
    }
    try {
      setSending(true);
      const payload: NotificationCreatePayload = {
        title: title.trim(),
        message: message.trim(),
        notification_type: notifType,
        priority,
        audience,
        recipient_ids: [],
        action_label: actionLabel.trim() || null,
        action_route: actionRoute.trim() || null,
        source_module: null,
        source_id: null,
      };
      const res = await notificationService.createNotification(payload) as any;
      Alert.alert('Sent', `${res.created_count} notification(s) sent.`);
      setTitle(''); setMessage(''); setActionLabel(''); setActionRoute('');
      setShowForm(false);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send notification.');
    } finally {
      setSending(false);
    }
  }

  async function markRead(item: NotificationItem) {
    try {
      await notificationService.markRead(item.id);
      await loadNotifications();
      if (item.action_route) router.push(item.action_route as any);
    } catch {
      // silent
    }
  }

  async function markAllRead() {
    try {
      const res = await notificationService.markAllRead() as any;
      await loadNotifications();
      Alert.alert('Updated', `${res.updated_count ?? 0} notification(s) marked read.`);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed.');
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSub}>{unreadCount} unread</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {/* Send Notification Form Toggle */}
        <TouchableOpacity style={styles.createButton} onPress={() => setShowForm(!showForm)}>
          <BellPlus size={18} color="#FFFFFF" />
          <Text style={styles.createButtonText}>
            {showForm ? 'Cancel' : 'Send Notification'}
          </Text>
        </TouchableOpacity>

        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>New Notification</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Notification title"
              placeholderTextColor="#8A8178"
            />

            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Full message"
              placeholderTextColor="#8A8178"
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {TYPES.map((t) => (
                <Chip key={t} label={t.replace('_', ' ')} active={notifType === t} onPress={() => setNotifType(t)} />
              ))}
            </ScrollView>

            <Text style={styles.label}>Priority</Text>
            <View style={styles.wrapRow}>
              {PRIORITIES.map((p) => (
                <Chip key={p} label={p} active={priority === p} onPress={() => setPriority(p)} />
              ))}
            </View>

            <Text style={styles.label}>Audience</Text>
            <View style={styles.wrapRow}>
              {AUDIENCES.map((a) => (
                <Chip key={a} label={a} active={audience === a} onPress={() => setAudience(a)} />
              ))}
            </View>

            <Text style={styles.label}>Action Label (optional)</Text>
            <TextInput
              style={styles.input}
              value={actionLabel}
              onChangeText={setActionLabel}
              placeholder="e.g. Open Training"
              placeholderTextColor="#8A8178"
            />

            <Text style={styles.label}>Action Route (optional)</Text>
            <TextInput
              style={styles.input}
              value={actionRoute}
              onChangeText={setActionRoute}
              placeholder="e.g. /staff/courses"
              placeholderTextColor="#8A8178"
            />

            <TouchableOpacity
              style={[styles.sendButton, sending && { opacity: 0.6 }]}
              onPress={sendNotification}
              disabled={sending}
            >
              {sending ? <ActivityIndicator color="#FFFFFF" /> : (
                <>
                  <Bell size={17} color="#FFFFFF" />
                  <Text style={styles.sendButtonText}>Send Notification</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {notifications.length > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllRead}>
            <CheckCheck size={18} color="#FFFFFF" />
            <Text style={styles.markAllText}>Mark All Read</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#C95F18" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Bell size={34} color="#8A8178" />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
          </View>
        ) : (
          notifications.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, !item.is_read && styles.unreadCard]}
              onPress={() => markRead(item)}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconBox}>
                  <Bell size={19} color="#C95F18" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardMeta}>
                    {item.notification_type.replace('_', ' ')}
                    {' · '}
                    <Text style={{ color: PRIORITY_COLORS[item.priority] ?? '#8A8178' }}>
                      {item.priority}
                    </Text>
                  </Text>
                </View>
                {!item.is_read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.cardMessage}>{item.message}</Text>
              {item.action_label ? (
                <View style={styles.actionPill}>
                  <Text style={styles.actionPillText}>{item.action_label}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
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
  createButton: {
    backgroundColor: '#102B45',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  createButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  formCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 12,
  },
  formTitle: { color: '#102B45', fontSize: 17, fontWeight: '900' },
  label: { color: '#6B3F20', fontSize: 12, fontWeight: '900' },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: '#102B45',
    fontWeight: '700',
  },
  textArea: { minHeight: 90 },
  chipRow: { gap: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#FFF3E8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EAD7C2',
  },
  chipActive: { backgroundColor: '#C95F18', borderColor: '#C95F18' },
  chipText: { color: '#6B3F20', fontSize: 12, fontWeight: '900' },
  chipTextActive: { color: '#FFFFFF' },
  sendButton: {
    backgroundColor: '#C95F18',
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  sendButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  markAllButton: {
    backgroundColor: '#C95F18',
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  markAllText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  loadingCard: { backgroundColor: '#FFFDF8', borderRadius: 24, padding: 24, alignItems: 'center', gap: 8 },
  loadingText: { color: '#8A8178', fontWeight: '700' },
  emptyCard: { backgroundColor: '#FFFDF8', borderRadius: 24, padding: 28, alignItems: 'center', gap: 8 },
  emptyTitle: { color: '#102B45', fontSize: 16, fontWeight: '900' },
  card: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 10,
  },
  unreadCard: { borderColor: '#C95F18', backgroundColor: '#FFF7ED' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  iconBox: {
    width: 42, height: 42, borderRadius: 15,
    backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { color: '#102B45', fontSize: 14, fontWeight: '900' },
  cardMeta: { color: '#8A8178', fontSize: 11, fontWeight: '800', marginTop: 2, textTransform: 'capitalize' },
  unreadDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: '#C95F18' },
  cardMessage: { color: '#6B3F20', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  actionPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#102B45',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  actionPillText: { color: '#FFEAC7', fontSize: 11, fontWeight: '900' },
});
