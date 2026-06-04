import { router } from 'expo-router';
import { BellPlus, Save } from 'lucide-react-native';
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

import { managerTeamService } from '@/services/manager-team.service';
import { notificationService } from '@/services/notification.service';
import type { User } from '@/types/auth.types';
import type { NotificationPriority, ReminderCategory } from '@/types/notification.types';

const CATEGORIES: ReminderCategory[] = [
  'Training Reminder', 'Target Follow-up', 'Checklist Reminder',
  'Document Reminder', 'Attendance Reminder', 'Customer Follow-up',
  'Store Operations', 'Compliance', 'General',
];
const PRIORITIES: NotificationPriority[] = ['low', 'medium', 'high', 'urgent'];

export default function ManagerCreateReminderScreen() {
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  const [title, setTitle] = useState('Complete Sofa Training');
  const [description, setDescription] = useState('Complete sofa product training before end of day.');
  const [category, setCategory] = useState<ReminderCategory>('Training Reminder');
  const [priority, setPriority] = useState<NotificationPriority>('high');
  const [dueDate, setDueDate] = useState('2026-05-31');
  const [dueTime, setDueTime] = useState('18:00');
  const [actionRoute, setActionRoute] = useState('/staff/courses');

  useEffect(() => { loadTeam(); }, []);

  async function loadTeam() {
    try {
      setLoadingTeam(true);
      const data = await managerTeamService.getTeam();
      setStaffList((data as any).staff ?? []);
    } catch {
      // silent
    } finally {
      setLoadingTeam(false);
    }
  }

  function toggleStaff(staffId: string) {
    setSelectedStaffIds((prev) =>
      prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId],
    );
  }

  async function createReminder() {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Validation', 'Title and description are required.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim())) {
      Alert.alert('Validation', 'Due date must be YYYY-MM-DD.');
      return;
    }
    if (dueTime.trim() && !/^\d{2}:\d{2}$/.test(dueTime.trim())) {
      Alert.alert('Validation', 'Due time must be HH:MM.');
      return;
    }
    try {
      setSaving(true);
      const response = await notificationService.createReminder({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        due_date: dueDate.trim(),
        due_time: dueTime.trim() || null,
        assigned_to: selectedStaffIds,
        action_route: actionRoute.trim() || null,
      }) as any;
      Alert.alert('Reminder Created', `${response.created_count} reminder(s) created.`, [
        { text: 'View Reminders', onPress: () => router.replace('/manager/reminders' as any) },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to create reminder.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.replace('/manager/reminders' as any)}>
          <Text style={styles.backText}>← Reminders</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Reminder</Text>
        <Text style={styles.headerSub}>Send action reminders to staff</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.formCard}>
          <View style={styles.cardTitleRow}>
            <BellPlus size={18} color="#C95F18" />
            <Text style={styles.cardTitle}>Reminder Details</Text>
          </View>

          <Field label="Title" value={title} onChangeText={setTitle} />
          <Field label="Description" value={description} onChangeText={setDescription} multiline />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {CATEGORIES.map((item) => (
              <Chip key={item} label={item} active={category === item} onPress={() => setCategory(item)} />
            ))}
          </ScrollView>

          <Text style={styles.label}>Priority</Text>
          <View style={styles.wrapRow}>
            {PRIORITIES.map((item) => (
              <Chip key={item} label={item} active={priority === item} onPress={() => setPriority(item)} />
            ))}
          </View>

          <Field label="Due Date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} />
          <Field label="Due Time (HH:MM)" value={dueTime} onChangeText={setDueTime} />
          <Field label="Action Route (optional)" value={actionRoute} onChangeText={setActionRoute} />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Assign Staff</Text>
          <Text style={styles.helperText}>
            Select specific staff. If none selected, reminder goes to all store staff.
          </Text>
          {loadingTeam ? (
            <ActivityIndicator color="#C95F18" />
          ) : (
            <View style={styles.staffList}>
              {staffList.map((staff) => (
                <TouchableOpacity
                  key={staff.id}
                  style={[styles.staffChip, selectedStaffIds.includes(staff.id) && styles.staffChipActive]}
                  onPress={() => toggleStaff(staff.id)}
                >
                  <Text style={[styles.staffChipText, selectedStaffIds.includes(staff.id) && styles.staffChipTextActive]}>
                    {staff.full_name ?? staff.email}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={createReminder}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#FFFFFF" /> : (
            <>
              <Save size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Create Reminder</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, multiline }: {
  label: string; value: string; onChangeText: (v: string) => void; multiline?: boolean;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
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
  formCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 13,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cardTitle: { color: '#102B45', fontSize: 17, fontWeight: '900' },
  helperText: { color: '#8A8178', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  label: { color: '#6B3F20', fontSize: 12, fontWeight: '900' },
  fieldBlock: { gap: 7 },
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
  textArea: { minHeight: 95 },
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
  staffList: { gap: 8 },
  staffChip: {
    backgroundColor: '#FFF3E8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#EAD7C2',
  },
  staffChipActive: { backgroundColor: '#C95F18', borderColor: '#C95F18' },
  staffChipText: { color: '#6B3F20', fontSize: 12, fontWeight: '900' },
  staffChipTextActive: { color: '#FFFFFF' },
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
