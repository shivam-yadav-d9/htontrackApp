import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { managerService } from '@/services/manager.service';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

type AnnouncementType = 'new_offer' | 'policy_update' | 'training_reminder' | 'urgent' | 'general';
type Priority = 'urgent' | 'high' | 'medium' | 'low';

const TYPES: { value: AnnouncementType; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'new_offer', label: 'New Offer' },
  { value: 'policy_update', label: 'Policy Update' },
  { value: 'training_reminder', label: 'Training Reminder' },
  { value: 'urgent', label: 'Urgent' },
];

const PRIORITIES: Priority[] = ['urgent', 'high', 'medium', 'low'];

const PRIORITY_COLORS: Record<Priority, string> = {
  urgent: COLORS.error,
  high: COLORS.warning,
  medium: COLORS.blue,
  low: COLORS.gray,
};

export default function CreateAnnouncementScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AnnouncementType>('general');
  const [priority, setPriority] = useState<Priority>('medium');
  const [requireAck, setRequireAck] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('Validation', 'Please enter a title.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Validation', 'Please enter a description.');
      return;
    }

    setLoading(true);
    try {
      await managerService.createAnnouncement({
        title: title.trim(),
        description: description.trim(),
        type,
        priority,
        require_acknowledgement: requireAck,
        expiry_date: expiryDate.trim() || undefined,
      });
      Alert.alert('Success', 'Announcement sent to all store staff.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send announcement.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Announcement</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Announcement title..."
            placeholderTextColor={COLORS.gray}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Description *</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Enter announcement details..."
            placeholderTextColor={COLORS.gray}
            multiline
            numberOfLines={5}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Type */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Type</Text>
          <View style={styles.chipRow}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.chip, type === t.value && styles.chipActive]}
                onPress={() => setType(t.value)}>
                <Text style={[styles.chipText, type === t.value && styles.chipTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Priority</Text>
          <View style={styles.chipRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.chip,
                  priority === p && { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] },
                ]}
                onPress={() => setPriority(p)}>
                <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Require Acknowledgement */}
        <View style={styles.fieldBlock}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Require Acknowledgement</Text>
              <Text style={styles.switchSub}>Staff must confirm they've read this</Text>
            </View>
            <Switch
              value={requireAck}
              onValueChange={setRequireAck}
              trackColor={{ false: COLORS.border, true: COLORS.orange }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* Expiry Date */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Expiry Date (YYYY-MM-DD) — optional</Text>
          <TextInput
            style={styles.input}
            placeholder="2024-12-31"
            placeholderTextColor={COLORS.gray}
            value={expiryDate}
            onChangeText={setExpiryDate}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}>
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitBtnText}>Send Announcement</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: 60 },
  fieldBlock: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '800', color: COLORS.blue },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.medium,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 15,
    color: COLORS.grayDark,
    ...Shadow.card,
  },
  multiline: { minHeight: 120, textAlignVertical: 'top', paddingTop: Spacing.two + 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 7,
    borderRadius: BorderRadius.pill,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  chipActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  chipText: { fontSize: 12, fontWeight: '700', color: COLORS.gray },
  chipTextActive: { color: COLORS.white },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.three,
    ...Shadow.card,
  },
  switchSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  submitBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    ...Shadow.strong,
  },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  btnDisabled: { opacity: 0.6 },
});
