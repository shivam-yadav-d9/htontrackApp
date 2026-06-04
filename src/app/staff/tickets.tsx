import { router } from 'expo-router';
import { AlertTriangle, MessageSquare, Plus, Send } from 'lucide-react-native';
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

import { StaffPageHeader } from '@/components/StaffPageHeader';
import { ticketService } from '@/services/ticket.service';
import type { Ticket, TicketPriority, TicketType } from '@/types/ticket.types';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

const TICKET_TYPES: TicketType[] = [
  'Attendance issue',
  'Training issue',
  'Target issue',
  'Customer complaint',
  'Store maintenance',
  'IT support',
  'POS issue',
  'Product availability issue',
  'Other',
];

const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: COLORS.gray,
  medium: COLORS.blue,
  high: COLORS.warning,
  urgent: COLORS.error,
};

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  open:        { bg: '#FEE2E2', text: '#B91C1C' },
  escalated:   { bg: '#FEE2E2', text: '#B91C1C' },
  in_progress: { bg: '#DBEAFE', text: '#1D4ED8' },
  resolved:    { bg: '#DCFCE7', text: '#166534' },
  closed:      { bg: '#F3F4F6', text: '#6B7280' },
};

export default function StaffTicketsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const [ticketType, setTicketType] = useState<TicketType>('POS issue');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [sendingComment, setSendingComment] = useState<string | null>(null);

  useEffect(() => { loadTickets(); }, []);

  async function loadTickets() {
    try {
      const data = await ticketService.getMyTickets();
      setTickets(data);
    } catch (err) {
      console.log('Tickets load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadTickets();
  }

  async function handleSubmit() {
    if (!title.trim() || title.trim().length < 3) {
      Alert.alert('Validation', 'Title must be at least 3 characters.');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      Alert.alert('Validation', 'Description must be at least 5 characters.');
      return;
    }
    setSaving(true);
    try {
      await ticketService.createTicket({
        ticket_type: ticketType,
        title: title.trim(),
        description: description.trim(),
        priority,
        attachment_name: attachmentName.trim() || null,
        attachment_url: null,
      });
      setTitle('');
      setDescription('');
      setAttachmentName('');
      setPriority('medium');
      setTicketType('POS issue');
      setShowForm(false);
      await loadTickets();
      Alert.alert('Ticket Raised', 'Your issue has been sent to the manager.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to raise ticket.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSendComment(ticketId: string) {
    const text = commentInputs[ticketId]?.trim();
    if (!text) return;
    setSendingComment(ticketId);
    try {
      const updated = await ticketService.addComment(ticketId, { comment: text });
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      setCommentInputs((prev) => ({ ...prev, [ticketId]: '' }));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send comment.');
    } finally {
      setSendingComment(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StaffPageHeader title="My Tickets" subtitle="Raise issues and track responses" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.orange]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* New Ticket Button */}
        <TouchableOpacity
          style={[styles.newTicketBtn, Shadow.card]}
          onPress={() => setShowForm((v) => !v)}
          activeOpacity={0.8}
        >
          <Plus size={18} color={COLORS.white} />
          <Text style={styles.newTicketBtnText}>{showForm ? 'Cancel' : 'Raise New Ticket'}</Text>
        </TouchableOpacity>

        {/* Create Form */}
        {showForm && (
          <View style={[styles.card, Shadow.card]}>
            <Text style={styles.cardTitle}>New Ticket</Text>

            <Text style={styles.fieldLabel}>Issue Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {TICKET_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, ticketType === t && styles.chipActive]}
                    onPress={() => setTicketType(t)}
                  >
                    <Text style={[styles.chipText, ticketType === t && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.fieldLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityChip,
                    priority === p && { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] },
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Title (e.g. POS billing not working)…"
              placeholderTextColor={COLORS.gray}
              maxLength={150}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the issue clearly…"
              placeholderTextColor={COLORS.gray}
              multiline
              textAlignVertical="top"
              maxLength={2000}
            />
            <TextInput
              style={styles.input}
              value={attachmentName}
              onChangeText={setAttachmentName}
              placeholder="Attachment filename (optional)…"
              placeholderTextColor={COLORS.gray}
            />

            <TouchableOpacity
              style={[styles.submitBtn, saving && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Text style={styles.submitBtnText}>Raise Ticket</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Ticket History */}
        <Text style={styles.sectionTitle}>My Tickets ({tickets.length})</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.orange} style={{ marginTop: 20 }} />
        ) : tickets.length === 0 ? (
          <View style={styles.empty}>
            <AlertTriangle size={36} color={COLORS.border} />
            <Text style={styles.emptyText}>No tickets raised yet.</Text>
          </View>
        ) : (
          tickets.map((ticket) => {
            const s = STATUS_STYLE[ticket.status] ?? STATUS_STYLE.open;
            return (
              <View key={ticket.id} style={[styles.ticketCard, Shadow.card]}>
                <View style={styles.ticketTop}>
                  <View style={styles.ticketIcon}>
                    <AlertTriangle size={18} color={PRIORITY_COLORS[ticket.priority]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ticketTitle}>{ticket.title}</Text>
                    <Text style={styles.ticketMeta}>{ticket.ticket_type} · {ticket.priority}</Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusText, { color: s.text }]}>
                      {ticket.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.ticketDesc}>{ticket.description}</Text>

                {ticket.manager_note ? (
                  <View style={styles.managerNote}>
                    <Text style={styles.managerNoteLabel}>Manager Note</Text>
                    <Text style={styles.managerNoteText}>{ticket.manager_note}</Text>
                  </View>
                ) : null}

                {(ticket.comments ?? []).length > 1 && (
                  <View style={styles.commentsBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <MessageSquare size={13} color={COLORS.orange} />
                      <Text style={styles.commentsLabel}>Comments</Text>
                    </View>
                    {ticket.comments!.slice(-3).map((c, i) => (
                      <Text key={i} style={styles.commentLine}>
                        <Text style={{ fontWeight: '800' }}>
                          {c.commented_by_name ?? c.user_name ?? 'User'}:{' '}
                        </Text>
                        {c.comment ?? c.message}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Add comment */}
                {ticket.status !== 'closed' && (
                  <View style={styles.commentInputRow}>
                    <TextInput
                      style={styles.commentInput}
                      value={commentInputs[ticket.id] ?? ''}
                      onChangeText={(v) => setCommentInputs((prev) => ({ ...prev, [ticket.id]: v }))}
                      placeholder="Add a comment…"
                      placeholderTextColor={COLORS.gray}
                    />
                    <TouchableOpacity
                      style={[styles.sendBtn, (!commentInputs[ticket.id]?.trim() || sendingComment === ticket.id) && styles.btnDisabled]}
                      onPress={() => handleSendComment(ticket.id)}
                      disabled={!commentInputs[ticket.id]?.trim() || sendingComment === ticket.id}
                    >
                      {sendingComment === ticket.id
                        ? <ActivityIndicator size="small" color={COLORS.white} />
                        : <Send size={14} color={COLORS.white} />}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },

  newTicketBtn: {
    backgroundColor: COLORS.blue,
    borderRadius: BorderRadius.medium,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  newTicketBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.blue },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', gap: 8 },
  priorityRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.beigeLight,
  },
  chipActive: { borderColor: COLORS.blue, backgroundColor: COLORS.blue },
  priorityChip: {
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.beigeLight,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  chipTextActive: { color: COLORS.white },

  input: {
    backgroundColor: COLORS.beigeLight,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.black,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },

  submitBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: BorderRadius.medium,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  submitBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.blue },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { color: COLORS.gray, fontSize: 14 },

  ticketCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  ticketTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  ticketIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.medium,
    backgroundColor: COLORS.beigeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketTitle: { fontSize: 14, fontWeight: '800', color: COLORS.blue },
  ticketMeta: { fontSize: 11, color: COLORS.gray, marginTop: 1, textTransform: 'capitalize' },
  statusChip: { borderRadius: BorderRadius.pill, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },

  ticketDesc: { fontSize: 12, color: COLORS.grayDark, lineHeight: 17 },

  managerNote: {
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.small,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.blue,
    padding: 10,
    gap: 2,
    marginTop: 4,
  },
  managerNoteLabel: { fontSize: 10, fontWeight: '800', color: COLORS.blue, textTransform: 'uppercase' },
  managerNoteText: { fontSize: 12, color: COLORS.grayDark, lineHeight: 17 },

  commentsBox: {
    backgroundColor: COLORS.beigeLight,
    borderRadius: BorderRadius.small,
    padding: 10,
    gap: 4,
  },
  commentsLabel: { fontSize: 11, fontWeight: '700', color: COLORS.orange },
  commentLine: { fontSize: 12, color: COLORS.grayDark, lineHeight: 17 },

  commentInputRow: { flexDirection: 'row', gap: Spacing.one, marginTop: 4 },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.beigeLight,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.black,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.medium,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
