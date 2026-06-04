import { router } from 'expo-router';
import { ClipboardPenLine, Save } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { coachingService } from '@/services/coaching.service';
import { managerTeamService } from '@/services/manager-team.service';
import type { CoachingActionItem, CoachingCategory, CoachingPriority } from '@/types/coaching.types';
import type { User } from '@/types/auth.types';

const CATEGORIES: CoachingCategory[] = [
  'Attendance', 'Sales Target', 'Product Knowledge', 'Customer Handling',
  'POS Billing', 'Store Operations', 'Checklist Issue', 'Skill Gap', 'Quiz Failure', 'General',
];

const PRIORITIES: CoachingPriority[] = ['low', 'medium', 'high', 'urgent'];

export default function ManagerCreateCoachingPlanScreen() {
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CoachingCategory>('General');
  const [priority, setPriority] = useState<CoachingPriority>('medium');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');
  const [action1, setAction1] = useState('');
  const [action2, setAction2] = useState('');
  const [action3, setAction3] = useState('');

  useEffect(() => { loadTeam(); }, []);

  async function loadTeam() {
    try {
      setLoadingTeam(true);
      const data = await managerTeamService.getTeam();
      const staff = (data as any).staff ?? [];
      setStaffList(staff);
      if (staff.length > 0) setSelectedStaff(staff[0]);
    } catch {
      // silent
    } finally {
      setLoadingTeam(false);
    }
  }

  async function createPlan() {
    if (!selectedStaff) {
      Alert.alert('Validation', 'Please select a staff member.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Validation', 'Title is required.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Validation', 'Description is required.');
      return;
    }
    if (!successCriteria.trim()) {
      Alert.alert('Validation', 'Success criteria is required.');
      return;
    }
    if (!action1.trim()) {
      Alert.alert('Validation', 'At least one action item is required.');
      return;
    }
    if (startDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
      Alert.alert('Validation', 'Start date must be YYYY-MM-DD.');
      return;
    }
    if (dueDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim())) {
      Alert.alert('Validation', 'Due date must be YYYY-MM-DD.');
      return;
    }

    const actionItems: CoachingActionItem[] = [
      { id: 'action-1', title: action1.trim(), sort_order: 1 },
      ...(action2.trim() ? [{ id: 'action-2', title: action2.trim(), sort_order: 2 }] : []),
      ...(action3.trim() ? [{ id: 'action-3', title: action3.trim(), sort_order: 3 }] : []),
    ];

    try {
      setSaving(true);
      await coachingService.createCoachingPlan({
        staff_id: selectedStaff.id,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        start_date: startDate.trim() || null,
        due_date: dueDate.trim() || null,
        linked_alert_id: null,
        linked_source_module: null,
        linked_source_id: null,
        success_criteria: successCriteria.trim(),
        action_items: actionItems,
      });
      Alert.alert('Created', 'Coaching plan assigned to staff.', [
        { text: 'View Plans', onPress: () => router.replace('/manager/coaching-plans') },
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to create coaching plan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Coaching Plan</Text>
        <Text style={styles.headerSub}>Assign improvement actions to staff</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Staff Selection */}
        <View style={styles.formCard}>
          <View style={styles.cardTitleRow}>
            <ClipboardPenLine size={18} color="#C95F18" />
            <Text style={styles.cardTitle}>Select Staff</Text>
          </View>
          {loadingTeam ? (
            <ActivityIndicator color="#C95F18" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {staffList.map((staff) => (
                  <Chip
                    key={staff.id}
                    label={staff.full_name ?? staff.email ?? staff.id}
                    active={selectedStaff?.id === staff.id}
                    onPress={() => setSelectedStaff(staff)}
                  />
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Plan Details */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Plan Details</Text>

          <Field label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. Sofa Sales Improvement Plan" />
          <Field label="Description *" value={description} onChangeText={setDescription} multiline placeholder="Focused improvement plan..." />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CATEGORIES.map((item) => (
                <Chip key={item} label={item} active={category === item} onPress={() => setCategory(item)} />
              ))}
            </View>
          </ScrollView>

          <Text style={styles.label}>Priority</Text>
          <View style={styles.wrapRow}>
            {PRIORITIES.map((item) => (
              <Chip key={item} label={item} active={priority === item} onPress={() => setPriority(item)} />
            ))}
          </View>

          <Field label="Start Date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} placeholder="2026-05-22" />
          <Field label="Due Date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} placeholder="2026-05-29" />
          <Field label="Success Criteria *" value={successCriteria} onChangeText={setSuccessCriteria} multiline placeholder="What does success look like?" />
        </View>

        {/* Action Items */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Action Items</Text>
          <Field label="Action 1 *" value={action1} onChangeText={setAction1} placeholder="e.g. Complete product refresher" />
          <Field label="Action 2" value={action2} onChangeText={setAction2} placeholder="e.g. Practice objection handling" />
          <Field label="Action 3" value={action3} onChangeText={setAction3} placeholder="e.g. Manager role-play evaluation" />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={createPlan}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Create Coaching Plan</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label, value, onChangeText, multiline, placeholder,
}: {
  label: string; value: string; onChangeText: (v: string) => void; multiline?: boolean; placeholder?: string;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor="#8A8178"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
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
  },
  backPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  backPillText: { color: '#FFEAC7', fontSize: 12, fontWeight: '900' },
  headerTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.72)', marginTop: 4, fontSize: 13, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 36 },
  formCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 12,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cardTitle: { color: '#102B45', fontSize: 17, fontWeight: '900' },
  label: { color: '#6B3F20', fontSize: 12, fontWeight: '900' },
  fieldBlock: { gap: 6 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: '#102B45',
    fontWeight: '700',
    fontSize: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', gap: 8 },
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
  saveButton: {
    backgroundColor: '#C95F18',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
});
