import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, BorderRadius, Spacing } from '@/constants/theme';
import { todoService } from '@/services/todo.service';
import {
  RequiredLabel, FormErrorText, CharacterCounter,
  StatusChip, FormSubmitButton, ConfirmationModal,
} from '@/components/forms';
import { validators } from '@/utils/validators';

const PRIORITIES = [
  { value: 'low', label: 'Low', variant: 'success' },
  { value: 'medium', label: 'Medium', variant: 'warning' },
  { value: 'high', label: 'High', variant: 'danger' },
  { value: 'urgent', label: 'Urgent', variant: 'danger' },
] as const;

const TITLE_MAX = 300;
const DESC_MAX = 500;

interface Errors {
  title?: string;
  description?: string;
  due_date?: string;
}

export default function TodoCreateScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function validate(): boolean {
    const errs: Errors = {};
    const req = validators.required(title);
    if (req) { errs.title = req; }
    else {
      const min = validators.minLength(title.trim(), 3);
      if (min) errs.title = min;
      else {
        const max = validators.maxLength(title.trim(), TITLE_MAX);
        if (max) errs.title = max;
      }
    }
    if (description.trim() && description.trim().length > DESC_MAX) {
      errs.description = `Description must not exceed ${DESC_MAX} characters.`;
    }
    if (dueDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim())) {
      errs.due_date = 'Date must be in YYYY-MM-DD format.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handlePressCreate() {
    if (validate()) setShowConfirm(true);
  }

  async function handleConfirmedCreate() {
    setShowConfirm(false);
    setSaving(true);
    try {
      await todoService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate.trim() || undefined,
        todo_type: 'personal',
      });
      router.back();
    } catch (err) {
      setErrors({ title: err instanceof Error ? err.message : 'Failed to create. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New To-Do</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            {/* Title */}
            <View style={styles.fieldWrap}>
              <RequiredLabel label="Title" required />
              <TextInput
                style={[styles.input, errors.title ? styles.inputError : null]}
                value={title}
                onChangeText={(v) => { setTitle(v); setErrors((e) => ({ ...e, title: undefined })); }}
                placeholder="What do you need to do?"
                placeholderTextColor="#9CA3AF"
                maxLength={TITLE_MAX}
              />
              <View style={styles.fieldFooter}>
                <FormErrorText error={errors.title} />
                <CharacterCounter current={title.length} max={TITLE_MAX} />
              </View>
            </View>

            {/* Description */}
            <View style={styles.fieldWrap}>
              <RequiredLabel label="Description" />
              <TextInput
                style={[styles.input, styles.inputMulti, errors.description ? styles.inputError : null]}
                value={description}
                onChangeText={(v) => { setDescription(v); setErrors((e) => ({ ...e, description: undefined })); }}
                placeholder="Add more details (optional)..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                maxLength={DESC_MAX}
              />
              <View style={styles.fieldFooter}>
                <FormErrorText error={errors.description} />
                <CharacterCounter current={description.length} max={DESC_MAX} />
              </View>
            </View>

            {/* Priority */}
            <View style={styles.fieldWrap}>
              <RequiredLabel label="Priority" required />
              <View style={styles.chipRow}>
                {PRIORITIES.map((p) => (
                  <StatusChip
                    key={p.value}
                    label={p.label}
                    variant={p.variant as any}
                    selected={priority === p.value}
                    onPress={() => setPriority(p.value)}
                  />
                ))}
              </View>
            </View>

            {/* Due Date */}
            <View style={styles.fieldWrap}>
              <RequiredLabel label="Due Date" />
              <TextInput
                style={[styles.input, errors.due_date ? styles.inputError : null]}
                value={dueDate}
                onChangeText={(v) => { setDueDate(v); setErrors((e) => ({ ...e, due_date: undefined })); }}
                placeholder="YYYY-MM-DD (optional)"
                placeholderTextColor="#9CA3AF"
                maxLength={10}
              />
              <FormErrorText error={errors.due_date} />
            </View>
          </View>

          <FormSubmitButton
            label="Create To-Do"
            onPress={handlePressCreate}
            loading={saving}
            disabled={saving}
          />

          <View style={{ height: 16 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmationModal
        visible={showConfirm}
        title="Create To-Do?"
        message={`"${title.trim()}" will be added to your to-do list with ${priority} priority.`}
        confirmLabel="Create"
        cancelLabel="Cancel"
        variant="confirm"
        onConfirm={handleConfirmedCreate}
        onCancel={() => setShowConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7EFE5' },
  header: {
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  headerTitle: { flex: 1, color: COLORS.white, fontSize: 18, fontWeight: '800' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  fieldWrap: {},
  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  inputMulti: { minHeight: 88, textAlignVertical: 'top' },
  fieldFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
});
