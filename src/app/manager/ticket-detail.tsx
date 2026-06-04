import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ticketService } from '@/services/ticket.service';
import type { Ticket, TicketComment } from '@/types/ticket.types';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

const PRIORITY_COLORS: Record<string, string> = {
  urgent: COLORS.error,
  high: COLORS.warning,
  medium: COLORS.blue,
  low: COLORS.gray,
};

const STATUS_COLORS: Record<string, string> = {
  open: COLORS.orange,
  in_progress: COLORS.blue,
  resolved: COLORS.success,
  escalated: COLORS.error,
};

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (id) loadTicket();
  }, [id]);

  async function loadTicket() {
    try {
      const data = await ticketService.getManagerTickets();
      const found = data.find((t) => t.id === id) ?? null;
      setTicket(found);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }

  async function handleSendComment() {
    if (!comment.trim()) return;
    if (!id) return;
    setSending(true);
    try {
      await ticketService.addComment(id, { comment: comment.trim() });
      const newComment: TicketComment = {
        comment: comment.trim(),
        commented_by_name: 'You (Manager)',
        commented_by_role: 'MANAGER',
        created_at: new Date().toISOString(),
      };
      setTicket((prev) =>
        prev
          ? { ...prev, comments: [...(prev.comments ?? []), newComment] }
          : prev
      );
      setComment('');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send comment.');
    } finally {
      setSending(false);
    }
  }

  async function handleStatusUpdate(status: string) {
    if (!id) return;
    setStatusUpdating(true);
    try {
      await ticketService.updateTicketStatus(id, { status: status as Ticket['status'] });
      setTicket((prev) => (prev ? { ...prev, status: status as Ticket['status'] } : prev));
      Alert.alert('Updated', `Ticket status updated to "${status.replace(/_/g, ' ')}".`);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setStatusUpdating(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ticket Detail</Text>
        </View>
        <ActivityIndicator color={COLORS.orange} size="large" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ticket Detail</Text>
        </View>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Ticket not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket #{ticket.id.slice(0, 8)}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Ticket Info */}
          <View style={[styles.card, Shadow.card]}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: (PRIORITY_COLORS[ticket.priority] ?? COLORS.gray) + '18' }]}>
                <Text style={[styles.badgeText, { color: PRIORITY_COLORS[ticket.priority] ?? COLORS.gray }]}>
                  {ticket.priority}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[ticket.status] ?? COLORS.gray) + '18' }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLORS[ticket.status] ?? COLORS.gray }]}>
                  {ticket.status.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
            <Text style={styles.ticketType}>{ticket.ticket_type}</Text>
            <Text style={styles.ticketStaff}>Raised by: {ticket.staff_name}</Text>
            <Text style={styles.ticketDesc}>{ticket.description}</Text>
            <Text style={styles.ticketDate}>
              Created: {new Date(ticket.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </Text>
          </View>

          {/* Status Actions */}
          {ticket.status !== 'resolved' && (
            <View style={styles.actionSection}>
              <Text style={styles.actionTitle}>Update Status</Text>
              <View style={styles.actionRow}>
                {ticket.status === 'open' && (
                  <TouchableOpacity
                    style={[styles.statusBtn, { backgroundColor: COLORS.blue }, statusUpdating && styles.btnDisabled]}
                    onPress={() => handleStatusUpdate('in_progress')}
                    disabled={statusUpdating}>
                    <Text style={styles.statusBtnText}>In Progress</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.statusBtn, { backgroundColor: COLORS.success }, statusUpdating && styles.btnDisabled]}
                  onPress={() => handleStatusUpdate('resolved')}
                  disabled={statusUpdating}>
                  <Text style={styles.statusBtnText}>Resolved</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusBtn, { backgroundColor: COLORS.error }, statusUpdating && styles.btnDisabled]}
                  onPress={() => handleStatusUpdate('escalated')}
                  disabled={statusUpdating}>
                  <Text style={styles.statusBtnText}>Escalate</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Comments */}
          <Text style={styles.sectionHeader}>Comments</Text>
          {(ticket.comments ?? []).length === 0 ? (
            <Text style={styles.noCommentsText}>No comments yet. Add the first one.</Text>
          ) : (
            (ticket.comments ?? []).map((c, idx) => (
              <View key={c.id ?? idx} style={[styles.commentCard, Shadow.card]}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>
                    {c.commented_by_name ?? c.author_name ?? c.user_name ?? 'User'}
                  </Text>
                  <Text style={styles.commentDate}>
                    {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : ''}
                  </Text>
                </View>
                <Text style={styles.commentText}>{c.comment ?? c.message}</Text>
              </View>
            ))
          )}
        </ScrollView>

        {/* Comment input */}
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor={COLORS.gray}
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (sending || !comment.trim()) && styles.btnDisabled]}
            onPress={handleSendComment}
            disabled={sending || !comment.trim()}>
            {sending ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Send size={18} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  header: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 20 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: 6,
  },
  badgeRow: { flexDirection: 'row', gap: Spacing.one },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.pill },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  ticketType: { fontSize: 17, fontWeight: '800', color: COLORS.grayDark },
  ticketStaff: { fontSize: 13, color: COLORS.blue, fontWeight: '600' },
  ticketDesc: { fontSize: 14, color: COLORS.gray, lineHeight: 20 },
  ticketDate: { fontSize: 11, color: COLORS.gray },
  actionSection: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.two,
    ...Shadow.card,
  },
  actionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.blue },
  actionRow: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  statusBtn: {
    flex: 1,
    borderRadius: BorderRadius.small,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 90,
  },
  statusBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  btnDisabled: { opacity: 0.6 },
  sectionHeader: { fontSize: 14, fontWeight: '800', color: COLORS.blue, marginTop: Spacing.one },
  noCommentsText: { fontSize: 13, color: COLORS.gray, textAlign: 'center', paddingVertical: 16 },
  commentCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.two,
    gap: 4,
  },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commentAuthor: { fontSize: 12, fontWeight: '700', color: COLORS.blue },
  commentDate: { fontSize: 11, color: COLORS.gray },
  commentText: { fontSize: 13, color: COLORS.grayDark, lineHeight: 18 },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: Spacing.two,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.grayLight,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    fontSize: 14,
    color: COLORS.grayDark,
    maxHeight: 80,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: COLORS.gray },
});
