import { BadgeCheck, ChevronDown, ChevronUp, Megaphone, Plus, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ManagerPageHeader } from '@/components/ManagerPageHeader';
import { communicationService } from '@/services/communication.service';
import type { Announcement, AnnouncementCreatePayload, AnnouncementType, Priority } from '@/types/communication.types';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

const ANNOUNCEMENT_TYPES: AnnouncementType[] = [
  'General', 'New offer launched', 'Festive campaign', 'Price update',
  'Policy update', 'Training reminder', 'Store audit notice',
  'New product arrival', 'Urgent compliance update',
];

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];

const PRIORITY_STYLE: Record<string, { bg: string; text: string }> = {
  urgent: { bg: '#FEE2E2', text: '#B91C1C' },
  high:   { bg: '#FEF3C7', text: '#92400E' },
  medium: { bg: '#DBEAFE', text: '#1D4ED8' },
  low:    { bg: '#F3F4F6', text: '#6B7280' },
};

export default function ManagerAnnouncementsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AnnouncementType>('General');
  const [priority, setPriority] = useState<Priority>('medium');
  const [requiresAck, setRequiresAck] = useState(true);
  const [attachmentName, setAttachmentName] = useState('');

  useEffect(() => { loadAnnouncements(); }, []);

  async function loadAnnouncements() {
    try {
      const data = await communicationService.getManagerAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.log('Announcements load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadAnnouncements();
  }

  function resetForm() {
    setTitle('');
    setDescription('');
    setType('General');
    setPriority('medium');
    setRequiresAck(true);
    setAttachmentName('');
  }

  async function handleCreate() {
    if (title.trim().length < 3) {
      Alert.alert('Validation', 'Title must be at least 3 characters.');
      return;
    }
    if (description.trim().length < 5) {
      Alert.alert('Validation', 'Description must be at least 5 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: AnnouncementCreatePayload = {
        title: title.trim(),
        description: description.trim(),
        announcement_type: type,
        priority,
        requires_acknowledgement: requiresAck,
        attachment_name: attachmentName.trim() || null,
      };
      const created = await communicationService.createAnnouncement(payload);
      setAnnouncements((prev) => [{ ...created, acknowledged_count: 0, pending_acknowledgement_count: 0 }, ...prev]);
      resetForm();
      setShowForm(false);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create announcement.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ManagerPageHeader
        title="Announcements"
        subtitle={`${announcements.length} posted`}
        rightAction={
          <TouchableOpacity
            style={[styles.toggleBtn, showForm && styles.toggleBtnActive]}
            onPress={() => setShowForm((v) => !v)}
          >
            {showForm ? <ChevronUp size={18} color={COLORS.white} /> : <Plus size={18} color={COLORS.white} />}
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.orange]} />}
        showsVerticalScrollIndicator={false}
      >
        {showForm && (
          <View style={[styles.formCard, Shadow.card]}>
            <Text style={styles.formTitle}>New Announcement</Text>

            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Festive Sale Starting Tomorrow"
              placeholderTextColor={COLORS.gray}
              maxLength={150}
            />

            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Write the full announcement text here..."
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={4}
              maxLength={2000}
            />

            <Text style={styles.fieldLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {ANNOUNCEMENT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, type === t && styles.chipActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Priority</Text>
            <View style={styles.chipRow}>
              {PRIORITIES.map((p) => {
                const ps = PRIORITY_STYLE[p];
                const active = priority === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chip, active && { backgroundColor: ps.bg, borderColor: ps.text }]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.chipText, active && { color: ps.text, fontWeight: '800' }]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Requires Acknowledgement</Text>
                <Text style={styles.fieldHint}>Staff must tap "Acknowledge" to confirm they read it</Text>
              </View>
              <Switch
                value={requiresAck}
                onValueChange={setRequiresAck}
                trackColor={{ false: COLORS.border, true: COLORS.orange }}
                thumbColor={COLORS.white}
              />
            </View>

            <Text style={styles.fieldLabel}>Attachment Name (optional)</Text>
            <TextInput
              style={styles.input}
              value={attachmentName}
              onChangeText={setAttachmentName}
              placeholder="e.g. policy-doc.pdf"
              placeholderTextColor={COLORS.gray}
              maxLength={255}
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { resetForm(); setShowForm(false); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.btnDisabled]}
                onPress={handleCreate}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : <Text style={styles.submitBtnText}>Post Announcement</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={COLORS.orange} style={{ marginTop: 30 }} />
        ) : announcements.length === 0 ? (
          <View style={styles.empty}>
            <Megaphone size={40} color={COLORS.border} />
            <Text style={styles.emptyText}>No announcements yet. Tap + to create one.</Text>
          </View>
        ) : (
          announcements.map((item) => {
            const ps = PRIORITY_STYLE[item.priority] ?? PRIORITY_STYLE.medium;
            const ackCount = item.acknowledged_count ?? 0;
            const pendingCount = item.pending_acknowledgement_count ?? 0;
            return (
              <View key={item.id} style={[styles.card, Shadow.card]}>
                <View style={styles.cardTop}>
                  <View style={styles.iconBox}>
                    <Megaphone size={20} color={COLORS.orange} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardMeta}>
                      {item.announcement_type ?? item.type ?? 'General'}
                    </Text>
                  </View>
                  <View style={[styles.priorityChip, { backgroundColor: ps.bg }]}>
                    <Text style={[styles.priorityText, { color: ps.text }]}>{item.priority}</Text>
                  </View>
                </View>

                <Text style={styles.cardBody} numberOfLines={3}>{item.description}</Text>

                {item.requires_acknowledgement && (
                  <View style={styles.ackStatsRow}>
                    <View style={styles.ackStat}>
                      <BadgeCheck size={14} color="#166534" />
                      <Text style={styles.ackStatText}>{ackCount} acknowledged</Text>
                    </View>
                    {pendingCount > 0 && (
                      <View style={[styles.ackStat, { backgroundColor: '#FEF3C7' }]}>
                        <Users size={14} color="#92400E" />
                        <Text style={[styles.ackStatText, { color: '#92400E' }]}>
                          {pendingCount} pending
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {item.created_at ? (
                  <Text style={styles.cardFooter}>
                    {new Date(item.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </Text>
                ) : null}
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
  toggleBtn: {
    width: 38, height: 38,
    borderRadius: BorderRadius.medium,
    backgroundColor: COLORS.orange,
    alignItems: 'center', justifyContent: 'center',
  },
  toggleBtnActive: { backgroundColor: COLORS.brown },

  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  formTitle: { fontSize: 16, fontWeight: '900', color: COLORS.blue },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: COLORS.grayDark, marginBottom: -6 },
  fieldHint: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.black,
    backgroundColor: COLORS.beigeLight,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  chipScroll: { marginVertical: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.beigeLight,
    marginRight: 6,
    marginBottom: 4,
  },
  chipActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  chipText: { fontSize: 12, color: COLORS.grayDark, fontWeight: '600' },
  chipTextActive: { color: COLORS.white, fontWeight: '800' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: BorderRadius.medium, paddingVertical: 11,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.gray },
  submitBtn: {
    flex: 2, backgroundColor: COLORS.orange,
    borderRadius: BorderRadius.medium, paddingVertical: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  submitBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 13 },

  empty: { alignItems: 'center', paddingVertical: 50, gap: 12 },
  emptyText: { color: COLORS.gray, fontSize: 14, textAlign: 'center' },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  iconBox: {
    width: 44, height: 44,
    borderRadius: BorderRadius.medium,
    backgroundColor: COLORS.orangeLight,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: COLORS.blue },
  cardMeta: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  priorityChip: { borderRadius: BorderRadius.pill, paddingHorizontal: 8, paddingVertical: 4 },
  priorityText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  cardBody: { fontSize: 13, color: COLORS.grayDark, lineHeight: 19 },
  ackStatsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  ackStat: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#DCFCE7',
    borderRadius: BorderRadius.pill, paddingHorizontal: 10, paddingVertical: 4,
  },
  ackStatText: { fontSize: 11, fontWeight: '700', color: '#166534' },
  cardFooter: { fontSize: 11, color: COLORS.gray },
});
