import { router } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
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
import type { LeaveRequest } from '@/types/approval.types';

export default function ManagerLeaveRequestsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [remarksById, setRemarksById] = useState<Record<string, string>>({});

  useEffect(() => { loadRequests(); }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      const data = await approvalService.getManagerLeaveRequests();
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

  async function review(item: LeaveRequest, status: 'approved' | 'rejected') {
    const remarks = remarksById[item.id] ?? '';
    if (status === 'rejected' && !remarks.trim()) {
      Alert.alert('Remarks Required', 'Please enter remarks before rejecting.');
      return;
    }
    try {
      await approvalService.reviewLeaveRequest(item.id, {
        status,
        manager_remarks: remarks.trim() || undefined,
      });
      await loadRequests();
      Alert.alert('Updated', `Leave request ${status}.`);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to review leave request.');
    }
  }

  const pendingCount = requests.filter((x) => x.status === 'pending').length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Approvals</Text>
        <Text style={styles.headerSub}>Approve or reject staff leave requests</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>

        <View style={styles.summaryCard}>
          <CalendarDays size={22} color="#C95F18" />
          <Text style={styles.summaryText}>{pendingCount} pending leave approval{pendingCount !== 1 ? 's' : ''}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#C95F18" />
        ) : requests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No leave requests</Text>
          </View>
        ) : (
          requests.map((item) => {
            const finalStatus = item.status !== 'pending';
            return (
              <View key={item.id} style={styles.requestCard}>
                <View style={styles.requestTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.requestTitle}>
                      {item.staff_name} · {item.leave_type.replace(/_/g, ' ')}
                    </Text>
                    <Text style={styles.requestMeta}>
                      {item.start_date} → {item.end_date} · {item.total_days} day(s)
                    </Text>
                    {item.employee_code && (
                      <Text style={styles.empCode}>{item.employee_code}</Text>
                    )}
                  </View>
                  <StatusChip status={item.status} />
                </View>

                <Text style={styles.requestReason}>{item.reason}</Text>

                {finalStatus ? (
                  <View style={styles.feedbackBox}>
                    <Text style={styles.feedbackLabel}>Manager Remarks</Text>
                    <Text style={styles.feedbackText}>{item.manager_remarks || 'No remarks'}</Text>
                  </View>
                ) : (
                  <>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={remarksById[item.id] ?? ''}
                      onChangeText={(v) => setRemarksById((prev) => ({ ...prev, [item.id]: v }))}
                      placeholder="Manager remarks..."
                      placeholderTextColor="#8A8178"
                      multiline
                    />
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.approveBtn} onPress={() => review(item, 'approved')}>
                        <Text style={styles.actionText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => review(item, 'rejected')}>
                        <Text style={styles.actionText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
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
  summaryCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#EAD7C2',
  },
  summaryText: { color: '#102B45', fontSize: 15, fontWeight: '900', flex: 1 },
  emptyCard: { backgroundColor: '#FFFDF8', borderRadius: 24, padding: 24, alignItems: 'center' },
  emptyTitle: { color: '#102B45', fontWeight: '900' },
  requestCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 10,
  },
  requestTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  requestTitle: { color: '#102B45', fontSize: 14, fontWeight: '900', textTransform: 'capitalize' },
  requestMeta: { color: '#8A8178', fontSize: 12, fontWeight: '800', marginTop: 2 },
  empCode: { color: '#C95F18', fontSize: 11, fontWeight: '700', marginTop: 2 },
  requestReason: { color: '#6B3F20', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  feedbackBox: { backgroundColor: '#FFF3E8', borderRadius: 16, padding: 11 },
  feedbackLabel: { color: '#C95F18', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  feedbackText: { color: '#102B45', fontSize: 12, fontWeight: '700', marginTop: 4 },
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
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  actionRow: { flexDirection: 'row', gap: 10 },
  approveBtn: {
    flex: 1,
    backgroundColor: '#166534',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#B91C1C',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  statusChip: { backgroundColor: '#DBEAFE', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { color: '#1D4ED8', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  statusApproved: { backgroundColor: '#DCFCE7' },
  statusApprovedText: { color: '#166534' },
  statusRejected: { backgroundColor: '#FEE2E2' },
  statusRejectedText: { color: '#B91C1C' },
});
