import { router } from 'expo-router';
import { ClipboardList, Plus, Save, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
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

import { ManagerPageHeader } from '@/components/ManagerPageHeader';
import { AppButton } from '@/components/ui/AppButton';
import { checklistService } from '@/services/checklist.service';
import type {
  ChecklistAssignScope,
  ChecklistFrequency,
  ChecklistPriority,
  ChecklistType,
} from '@/types/checklist.types';
import { BorderRadius, COLORS, Shadow, Spacing } from '@/constants/theme';

const TYPES: { value: ChecklistType; label: string }[] = [
  { value: 'opening', label: 'Opening' },
  { value: 'closing', label: 'Closing' },
  { value: 'audit', label: 'Audit' },
  { value: 'cleanliness', label: 'Cleanliness' },
  { value: 'safety', label: 'Safety' },
  { value: 'festive_setup', label: 'Festive' },
  { value: 'customer_followup', label: 'Customer' },
  { value: 'lighting_decor', label: 'Lighting' },
  { value: 'general', label: 'General' },
];

const PRIORITIES: { value: ChecklistPriority; bg: string; text: string }[] = [
  { value: 'low', bg: '#F3F4F6', text: '#6B7280' },
  { value: 'medium', bg: '#DBEAFE', text: '#1D4ED8' },
  { value: 'high', bg: '#FEF3C7', text: '#92400E' },
  { value: 'urgent', bg: '#FEE2E2', text: '#B91C1C' },
];

const FREQUENCIES: { value: ChecklistFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'one_time', label: 'One-Time' },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

type ItemRow = { id: string; title: string; is_required: boolean };

export default function CreateChecklistScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [checklistType, setChecklistType] = useState<ChecklistType>('general');
  const [priority, setPriority] = useState<ChecklistPriority>('medium');
  const [frequency, setFrequency] = useState<ChecklistFrequency>('daily');
  const [dueDate, setDueDate] = useState('');
  const [assignScope, setAssignScope] = useState<ChecklistAssignScope>('store');
  const [items, setItems] = useState<ItemRow[]>([
    { id: uid(), title: '', is_required: true },
  ]);
  const [submitting, setSubmitting] = useState(false);

  function addItem() {
    setItems((prev) => [...prev, { id: uid(), title: '', is_required: false }]);
  }

  function removeItem(id: string) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function updateItem(id: string, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function handleSubmit() {
    if (!title.trim()) return Alert.alert('Error', 'Checklist title is required');
    const validItems = items.filter((it) => it.title.trim());
    if (validItems.length === 0) return Alert.alert('Error', 'Add at least one item');
    if (dueDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim()))
      return Alert.alert('Error', 'Due date must be YYYY-MM-DD');

    setSubmitting(true);
    try {
      await checklistService.createChecklist({
        title: title.trim(),
        description: description.trim() || undefined,
        checklist_type: checklistType,
        priority,
        frequency,
        due_date: dueDate.trim() || null,
        assign_scope: assignScope,
        assigned_to: [],
        items: validItems.map((it, i) => ({
          id: it.id,
          title: it.title.trim(),
          is_required: it.is_required,
          sort_order: i + 1,
        })),
      });
      Alert.alert('Checklist Created', 'Staff can now complete this checklist.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create checklist');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ManagerPageHeader title="Create Checklist" showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Details */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <ClipboardList size={16} color={COLORS.orange} />
            <Text style={styles.sectionTitle}>Checklist Details</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Checklist title *"
            placeholderTextColor={COLORS.gray}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Description (optional)"
            placeholderTextColor={COLORS.gray}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
          />
          <TextInput
            style={styles.input}
            placeholder="Due date YYYY-MM-DD (optional)"
            placeholderTextColor={COLORS.gray}
            value={dueDate}
            onChangeText={setDueDate}
          />
        </View>

        {/* Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type</Text>
          <View style={styles.chipRow}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.chip, checklistType === t.value && styles.chipActive]}
                onPress={() => setChecklistType(t.value)}
                activeOpacity={0.8}>
                <Text style={[styles.chipText, checklistType === t.value && styles.chipTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.chipRow}>
            {PRIORITIES.map((p) => {
              const sel = priority === p.value;
              return (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.chip, { backgroundColor: sel ? p.bg : COLORS.grayLight, borderColor: sel ? p.text : COLORS.border }]}
                  onPress={() => setPriority(p.value)}
                  activeOpacity={0.8}>
                  <Text style={[styles.chipText, { color: sel ? p.text : COLORS.gray }]}>
                    {p.value.charAt(0).toUpperCase() + p.value.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Frequency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequency</Text>
          <View style={styles.chipRow}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity
                key={f.value}
                style={[styles.chip, frequency === f.value && styles.chipBlueActive]}
                onPress={() => setFrequency(f.value)}
                activeOpacity={0.8}>
                <Text style={[styles.chipText, frequency === f.value && styles.chipBlueText]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Assign To */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assign To</Text>
          <View style={styles.chipRow}>
            {(['store', 'individual'] as ChecklistAssignScope[]).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, assignScope === s && styles.chipBlueActive]}
                onPress={() => setAssignScope(s)}
                activeOpacity={0.8}>
                <Text style={[styles.chipText, assignScope === s && styles.chipBlueText]}>
                  {s === 'store' ? 'All Store Staff' : 'Specific Staff'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Checklist Items ({items.length})</Text>

          {items.map((item, idx) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemNumRow}>
                <View style={styles.itemNum}>
                  <Text style={styles.itemNumText}>{idx + 1}</Text>
                </View>
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
                    <Trash2 size={14} color={COLORS.error} />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={styles.input}
                placeholder="Item description *"
                placeholderTextColor={COLORS.gray}
                value={item.title}
                onChangeText={(t) => updateItem(item.id, { title: t })}
              />
              <View style={styles.requiredRow}>
                <Text style={styles.reqLabel}>Required</Text>
                <Switch
                  value={item.is_required}
                  onValueChange={(v) => updateItem(item.id, { is_required: v })}
                  trackColor={{ false: COLORS.border, true: COLORS.orange }}
                  thumbColor={COLORS.white}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
            <Plus size={16} color={COLORS.orange} />
            <Text style={styles.addItemText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        <AppButton
          label="Create Checklist"
          onPress={handleSubmit}
          loading={submitting}
          icon={<Save size={16} color={COLORS.white} />}
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { padding: Spacing.three, gap: Spacing.three },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.two,
    ...Shadow.card,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.grayDark },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BorderRadius.medium,
    padding: Spacing.two,
    fontSize: 14,
    color: COLORS.grayDark,
    backgroundColor: COLORS.white,
  },
  textarea: { minHeight: 60, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.grayLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.orangeLight, borderColor: COLORS.orange },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  chipTextActive: { color: COLORS.orange },
  chipBlueActive: { backgroundColor: COLORS.blueLight, borderColor: COLORS.blue },
  chipBlueText: { color: COLORS.blue },
  itemCard: {
    backgroundColor: COLORS.beigeLight,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  itemNumRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemNumText: { fontSize: 10, fontWeight: '800', color: COLORS.white },
  deleteBtn: { padding: 4 },
  requiredRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reqLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    padding: Spacing.two,
    borderRadius: BorderRadius.medium,
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    borderStyle: 'dashed',
  },
  addItemText: { fontSize: 14, fontWeight: '700', color: COLORS.orange },
});
