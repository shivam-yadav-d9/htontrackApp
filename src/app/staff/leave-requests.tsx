import { router } from 'expo-router';
import { CalendarDays, Save } from 'lucide-react-native';
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

import { approvalService } from '@/services/approval.service';
import type { LeaveRequest, LeaveType } from '@/types/approval.types';

const LEAVE_TYPES: LeaveType[] = [
  'casual_leave',
  'sick_leave',
  'emergency_leave',
  'half_day',
  'weekly_off',
  'other',
];

export default function StaffLeaveRequestsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveType, setLeaveType] = useState<LeaveType>('casual_leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => { loadRequests(); }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      const data = await approvalService.getMyLeaveRequests();
      setRequests(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  }

  async function submitLeave() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate))
      return Alert.alert('Validation', 'Start date must be YYYY-MM-DD.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate))
      return Alert.alert('Validation', 'End date must be YYYY-MM-DD.');
    if (reason.trim().length < 5)
      return Alert.alert('Validation', 'Reason must be at least 5 characters.');

    setSaving(true);
    try {
      await approvalService.createLeaveRequest({
        leave_type: leaveType,
        start_date: startDate.trim(),
        end_date: endDate.trim(),
        reason: reason.trim(),
        half_day_session: leaveType === 'half_day' ? 'first_half' : null,
        attachment_name: null,
        attachment_url: null,
      });
      setReason('');
      setStartDate('');
      setEndDate('');
      await loadRequests();
      Alert.alert('Submitted', 'Leave request sent to manager.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to submit leave request.');
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
        <Text style={styles.headerTitle}>Leave Requests</Text>
        <Text style={styles.headerSub}>Apply leave and track manager approval</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>

        <View style={styles.formCard}>
          <View style={styles.cardTitleRow}>
            <CalendarDays size={18} color="#C95F18" />
            <Text style={styles.cardTitle}>Apply Leave</Text>
          </View>

          <Text style={styles.label}>Leave Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {LEAVE_TYPES.map((item) => (
              <Chip
                key={item}
                label={item.replace(/_/g, ' ')}
                active={leaveType === item}
                onPress={() => setLeaveType(item)}
              />
            ))}
          </ScrollView>

          <Field label="Start Date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} />
          <Field label="End Date (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} />

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Reason</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Write leave reason..."
              placeholderTextColor="#8A8178"
              multiline
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.6 }]}
            onPress={submitLeave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Submit Leave Request</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>My Leave Requests</Text>

        {loading ? (
          <ActivityIndicator color="#C95F18" />
        ) : requests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No leave requests yet</Text>
          </View>
        ) : (
          requests.map((item) => (
            <View key={item.id} style={styles.requestCard}>
              <View style={styles.requestTop}>
                <Text style={styles.requestTitle}>
                  {item.leave_type.replace(/_/g, ' ')}
                </Text>
                <StatusChip status={item.status} />
              </View>
              <Text style={styles.requestMeta}>
                {item.start_date} → {item.end_date} · {item.total_days} day(s)
              </Text>
              <Text style={styles.requestReason}>{item.reason}</Text>
              {item.manager_remarks ? (
                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackLabel}>Manager Remarks</Text>
                  <Text style={styles.feedbackText}>{item.manager_remarks}</Text>
                </View>
              ) : null}
            </View>
          ))
        )}

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#8A8178"
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

function StatusChip({ status }: { status: string }) {
  return (
    <View style={[styles.statusChip, status === 'approved' && styles.statusApproved, status === 'rejected' && styles.statusRejected]}>
      <Text style={[styles.statusText, status === 'approved' && styles.statusApprovedText, status === 'rejected' && styles.statusRejectedText]}>
        {status}
      </Text>
    </View>
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
  headerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.72)', marginTop: 4, fontSize: 13, fontWeight: '700' },
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
  label: { color: '#6B3F20', fontSize: 12, fontWeight: '900' },
  chipRow: { gap: 8 },
  chip: {
    backgroundColor: '#FFF3E8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EAD7C2',
  },
  chipActive: { backgroundColor: '#C95F18', borderColor: '#C95F18' },
  chipText: { color: '#6B3F20', fontSize: 12, fontWeight: '900', textTransform: 'capitalize' },
  chipTextActive: { color: '#FFFFFF' },
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
  textArea: { minHeight: 95, textAlignVertical: 'top' },
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
  sectionTitle: { color: '#102B45', fontSize: 17, fontWeight: '900' },
  emptyCard: { backgroundColor: '#FFFDF8', borderRadius: 24, padding: 24, alignItems: 'center' },
  emptyTitle: { color: '#102B45', fontWeight: '900' },
  requestCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 9,
  },
  requestTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  requestTitle: { flex: 1, color: '#102B45', fontSize: 15, fontWeight: '900', textTransform: 'capitalize' },
  requestMeta: { color: '#8A8178', fontSize: 12, fontWeight: '800' },
  requestReason: { color: '#6B3F20', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  feedbackBox: { backgroundColor: '#FFF3E8', borderRadius: 16, padding: 11 },
  feedbackLabel: { color: '#C95F18', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  feedbackText: { color: '#102B45', fontSize: 12, fontWeight: '700', marginTop: 4 },
  statusChip: {
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: { color: '#1D4ED8', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  statusApproved: { backgroundColor: '#DCFCE7' },
  statusApprovedText: { color: '#166534' },
  statusRejected: { backgroundColor: '#FEE2E2' },
  statusRejectedText: { color: '#B91C1C' },
});
