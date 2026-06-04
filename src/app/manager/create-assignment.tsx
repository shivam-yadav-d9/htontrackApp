import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { managerService, type StaffMember } from '@/services/manager.service';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';
import {
  FormField,
  FormTextArea,
  FormDatePicker,
  FormErrorText,
  FormSubmitButton,
  ConfirmationModal,
  StatusChip,
} from '@/components/forms';
import { validators } from '@/utils/validators';

type Priority = 'urgent' | 'high' | 'medium' | 'low';
type AssignmentType = 'text' | 'pdf' | 'image' | 'checklist';

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const ASSIGNMENT_TYPES: { value: AssignmentType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'pdf', label: 'PDF' },
  { value: 'image', label: 'Image' },
  { value: 'checklist', label: 'Checklist' },
];

const PRIORITY_VARIANT: Record<Priority, 'danger' | 'warning' | 'primary' | 'default'> = {
  urgent: 'danger',
  high: 'warning',
  medium: 'primary',
  low: 'default',
};

interface Errors {
  title?: string;
  description?: string;
  due_date?: string;
  assignTo?: string;
}

export default function CreateAssignmentScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('text');
  const [assignToAll, setAssignToAll] = useState(true);
  const [team, setTeam] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);

  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => { loadTeam(); }, []);

  async function loadTeam() {
    try {
      const data = await managerService.getTeam();
      setTeam(data);
    } catch {
      // ignore
    } finally {
      setTeamLoading(false);
    }
  }

  function toggleStaff(id: string) {
    setSelectedStaff((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function validate(): boolean {
    const e: Errors = {};
    e.title = validators.required(title) || validators.minLength(title, 3) || validators.maxLength(title, 200);
    e.description = validators.required(description) || validators.minLength(description, 10) || validators.maxLength(description, 2000);
    e.due_date = validators.required(dueDate) || (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? 'Due date must be YYYY-MM-DD format.' : '');
    if (!assignToAll && selectedStaff.length === 0) {
      e.assignTo = 'Please select at least one staff member.';
    }
    const cleaned: Errors = Object.fromEntries(
      Object.entries(e).filter(([, v]) => !!v)
    ) as Errors;
    setErrors(cleaned);
    return Object.keys(cleaned).length === 0;
  }

  function handlePressSubmit() {
    setSubmitError('');
    if (!validate()) return;
    setShowConfirm(true);
  }

  async function handleConfirmedSubmit() {
    setShowConfirm(false);
    setLoading(true);
    setSubmitError('');
    try {
      if (assignToAll) {
        await managerService.createAssignment({
          title: title.trim(),
          description: description.trim(),
          priority,
          due_date: dueDate.trim(),
          assignment_type: assignmentType,
        });
      } else {
        await Promise.all(
          selectedStaff.map((staffId) =>
            managerService.createAssignment({
              title: title.trim(),
              description: description.trim(),
              priority,
              due_date: dueDate.trim(),
              assignment_type: assignmentType,
              assigned_to_user_id: staffId,
            })
          )
        );
      }
      showToast(`Assignment${selectedStaff.length > 1 ? 's' : ''} created successfully.`);
      setTimeout(() => router.back(), 1400);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create assignment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  }

  const assigneeLabel = assignToAll
    ? 'Entire Store'
    : selectedStaff.length === 0
    ? 'No staff selected'
    : `${selectedStaff.length} staff member${selectedStaff.length > 1 ? 's' : ''}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Assignment</Text>
      </View>

      {toastMsg ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <FormField
            label="Assignment Title"
            value={title}
            onChangeText={(v) => { setTitle(v); setErrors((e) => ({ ...e, title: '' })); }}
            placeholder="e.g. Submit visual merchandising report"
            error={errors.title}
            required
            maxLength={200}
          />

          {/* Description */}
          <FormTextArea
            label="Description"
            value={description}
            onChangeText={(v) => { setDescription(v); setErrors((e) => ({ ...e, description: '' })); }}
            placeholder="Describe the assignment in detail..."
            error={errors.description}
            required
            maxLength={2000}
          />

          {/* Priority chips */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Priority</Text>
            <View style={styles.chipRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity key={p.value} onPress={() => setPriority(p.value)} activeOpacity={0.8}>
                  <StatusChip
                    label={p.label}
                    variant={PRIORITY_VARIANT[p.value]}
                    selected={priority === p.value}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Due Date */}
          <FormDatePicker
            label="Due Date"
            value={dueDate}
            onChangeText={(v) => { setDueDate(v); setErrors((e) => ({ ...e, due_date: '' })); }}
            error={errors.due_date}
            required
          />

          {/* Assignment Type chips */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Submission Type</Text>
            <Text style={styles.fieldHint}>What will staff need to submit?</Text>
            <View style={styles.chipRow}>
              {ASSIGNMENT_TYPES.map((t) => (
                <TouchableOpacity key={t.value} onPress={() => setAssignmentType(t.value)} activeOpacity={0.8}>
                  <StatusChip
                    label={t.label}
                    variant="primary"
                    selected={assignmentType === t.value}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Assign To */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Assign To *</Text>
            <View style={styles.radioRow}>
              <TouchableOpacity style={styles.radioOption} onPress={() => setAssignToAll(true)} activeOpacity={0.8}>
                <View style={[styles.radioCircle, assignToAll && styles.radioCircleActive]} />
                <Text style={styles.radioLabel}>Entire Store</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.radioOption} onPress={() => setAssignToAll(false)} activeOpacity={0.8}>
                <View style={[styles.radioCircle, !assignToAll && styles.radioCircleActive]} />
                <Text style={styles.radioLabel}>Specific Staff</Text>
              </TouchableOpacity>
            </View>

            {!assignToAll && (
              <View style={styles.staffList}>
                {teamLoading ? (
                  <ActivityIndicator color={COLORS.orange} style={{ padding: 16 }} />
                ) : team.length === 0 ? (
                  <Text style={styles.noTeamText}>No team members found.</Text>
                ) : (
                  team.map((member) => {
                    const selected = selectedStaff.includes(member.id);
                    return (
                      <TouchableOpacity
                        key={member.id}
                        style={[styles.staffRow, selected && styles.staffRowSelected]}
                        onPress={() => {
                          toggleStaff(member.id);
                          setErrors((e) => ({ ...e, assignTo: '' }));
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
                          {selected && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.staffName}>{member.full_name}</Text>
                          <Text style={styles.staffDesig}>{member.designation}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}
            <FormErrorText error={errors.assignTo} />
          </View>

          {/* Submit error */}
          {submitError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{submitError}</Text>
            </View>
          ) : null}

          <FormSubmitButton
            label="Create Assignment"
            onPress={handlePressSubmit}
            loading={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmationModal
        visible={showConfirm}
        title="Create Assignment?"
        message={`Create "${title.trim()}" assignment for ${assigneeLabel} with ${priority} priority. Due: ${dueDate}`}
        confirmLabel="Create"
        cancelLabel="Cancel"
        variant="confirm"
        onConfirm={handleConfirmedSubmit}
        onCancel={() => setShowConfirm(false)}
      />
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
  toast: {
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: 60 },
  fieldBlock: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '800', color: COLORS.blue },
  fieldHint: { fontSize: 11, color: '#6B7280', marginTop: -4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  radioRow: { flexDirection: 'row', gap: Spacing.four },
  radioOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  radioCircle: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.gray,
  },
  radioCircleActive: { borderColor: COLORS.orange, backgroundColor: COLORS.orange },
  radioLabel: { fontSize: 14, fontWeight: '600', color: COLORS.grayDark },
  staffList: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginTop: 6,
  },
  staffRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.two, gap: Spacing.two,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  staffRowSelected: { backgroundColor: COLORS.beigeLight },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: COLORS.gray,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  checkmark: { color: COLORS.white, fontSize: 12, fontWeight: '900' },
  staffName: { fontSize: 14, fontWeight: '700', color: COLORS.grayDark },
  staffDesig: { fontSize: 11, color: COLORS.gray },
  noTeamText: { padding: Spacing.three, color: COLORS.gray, fontSize: 13, textAlign: 'center' },
  errorBox: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 10, padding: 12,
  },
  errorBoxText: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
});
