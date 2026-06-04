import { router } from 'expo-router';
import { ArrowLeft, Check, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type {
  AttendanceCorrectionRecord,
  LeaveRequestRecord,
} from '@/services/attendance.service';
import { attendanceControlService } from '@/services/attendance.service';

type Tab = 'corrections' | 'leaves';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:  { bg: '#FEF9C3', color: '#92400E' },
  approved: { bg: '#DCFCE7', color: '#15803D' },
  rejected: { bg: '#FEE2E2', color: '#DC2626' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_COLORS[status] ?? { bg: '#F3F4F6', color: '#6B7280' };
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: cfg.bg }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: cfg.color, textTransform: 'capitalize' }}>{status}</Text>
    </View>
  );
}

function RemarksInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder ?? 'Add remarks (optional)'}
      placeholderTextColor="#9CA3AF"
      multiline
      style={{
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        padding: 10,
        fontSize: 13,
        color: '#10233F',
        minHeight: 50,
        marginTop: 8,
        backgroundColor: '#FAFAFA',
      }}
    />
  );
}

function CorrectionCard({
  record,
  onApprove,
  onReject,
}: {
  record: AttendanceCorrectionRecord;
  onApprove: (id: string, remarks: string) => void;
  onReject: (id: string, remarks: string) => void;
}) {
  const [remarks, setRemarks] = useState('');
  const isPending = record.status === 'pending';

  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 10, elevation: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#10233F' }}>{record.staff_name ?? '—'}</Text>
          <Text style={{ fontSize: 12, color: '#6B5E4F', marginTop: 1 }}>{record.employee_code}</Text>
        </View>
        <StatusBadge status={record.status} />
      </View>

      <Text style={{ fontSize: 13, color: '#6B5E4F', marginBottom: 2 }}>
        Type: <Text style={{ fontWeight: '700', color: '#10233F' }}>{record.correction_type}</Text>
      </Text>
      <Text style={{ fontSize: 12, color: '#6B5E4F' }}>Reason: {record.reason}</Text>

      {record.requested_check_in_time && (
        <Text style={{ fontSize: 12, color: '#6B5E4F', marginTop: 2 }}>
          Req. Check-in: {new Date(record.requested_check_in_time).toLocaleString('en-IN', { hour12: true })}
        </Text>
      )}
      {record.requested_check_out_time && (
        <Text style={{ fontSize: 12, color: '#6B5E4F', marginTop: 2 }}>
          Req. Check-out: {new Date(record.requested_check_out_time).toLocaleString('en-IN', { hour12: true })}
        </Text>
      )}

      <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
        {new Date(record.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </Text>

      {record.manager_remarks && (
        <Text style={{ fontSize: 12, color: '#6B5E4F', marginTop: 4, fontStyle: 'italic' }}>
          Remarks: {record.manager_remarks}
        </Text>
      )}

      {isPending && (
        <>
          <RemarksInput value={remarks} onChange={setRemarks} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => onApprove(record.id, remarks)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#DCFCE7' }}
            >
              <Check size={16} color="#15803D" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#15803D' }}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onReject(record.id, remarks)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#FEE2E2' }}
            >
              <X size={16} color="#DC2626" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#DC2626' }}>Reject</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

function LeaveCard({
  record,
  onApprove,
  onReject,
}: {
  record: LeaveRequestRecord;
  onApprove: (id: string, remarks: string) => void;
  onReject: (id: string, remarks: string) => void;
}) {
  const [remarks, setRemarks] = useState('');
  const isPending = record.status === 'pending';

  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 10, elevation: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#10233F' }}>{record.staff_name ?? '—'}</Text>
          <Text style={{ fontSize: 12, color: '#6B5E4F', marginTop: 1 }}>{record.employee_code}</Text>
        </View>
        <StatusBadge status={record.status} />
      </View>

      <Text style={{ fontSize: 13, color: '#6B5E4F', marginBottom: 2 }}>
        Type: <Text style={{ fontWeight: '700', color: '#10233F' }}>{record.leave_type}</Text>
      </Text>
      <Text style={{ fontSize: 12, color: '#6B5E4F', marginBottom: 2 }}>
        {record.from_date} → {record.to_date}
      </Text>
      <Text style={{ fontSize: 12, color: '#6B5E4F' }}>Reason: {record.reason}</Text>

      <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
        {new Date(record.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </Text>

      {record.manager_remarks && (
        <Text style={{ fontSize: 12, color: '#6B5E4F', marginTop: 4, fontStyle: 'italic' }}>
          Remarks: {record.manager_remarks}
        </Text>
      )}

      {isPending && (
        <>
          <RemarksInput value={remarks} onChange={setRemarks} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => onApprove(record.id, remarks)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#DCFCE7' }}
            >
              <Check size={16} color="#15803D" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#15803D' }}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onReject(record.id, remarks)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#FEE2E2' }}
            >
              <X size={16} color="#DC2626" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#DC2626' }}>Reject</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

export default function ManagerAttendanceControlScreen() {
  const [tab, setTab] = useState<Tab>('corrections');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [corrections, setCorrections] = useState<AttendanceCorrectionRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequestRecord[]>([]);

  const load = useCallback(async () => {
    try {
      const [c, l] = await Promise.all([
        attendanceControlService.getManagerCorrectionRequests(),
        attendanceControlService.getManagerLeaveRequests(),
      ]);
      setCorrections(c);
      setLeaves(l);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not load data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApproveCorrection(id: string, remarks: string) {
    try {
      await attendanceControlService.approveCorrection(id, { manager_remarks: remarks });
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Action failed.');
    }
  }

  async function handleRejectCorrection(id: string, remarks: string) {
    try {
      await attendanceControlService.rejectCorrection(id, { manager_remarks: remarks });
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Action failed.');
    }
  }

  async function handleApproveLeave(id: string, remarks: string) {
    try {
      await attendanceControlService.approveLeave(id, { manager_remarks: remarks });
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Action failed.');
    }
  }

  async function handleRejectLeave(id: string, remarks: string) {
    try {
      await attendanceControlService.rejectLeave(id, { manager_remarks: remarks });
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Action failed.');
    }
  }

  const pendingCorrections = corrections.filter(c => c.status === 'pending').length;
  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F1E7' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#10233F', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>Attendance Control</Text>
          <Text style={{ fontSize: 12, color: '#C8A24A', marginTop: 1 }}>Corrections & Leave Approvals</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0EDE8' }}>
        {(['corrections', 'leaves'] as Tab[]).map(t => {
          const label = t === 'corrections' ? 'Corrections' : 'Leaves';
          const count = t === 'corrections' ? pendingCorrections : pendingLeaves;
          const active = tab === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: active ? '#C8A24A' : 'transparent' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: active ? '800' : '500', color: active ? '#10233F' : '#9CA3AF' }}>{label}</Text>
                {count > 0 && (
                  <View style={{ backgroundColor: '#DC2626', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>{count}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#C8A24A" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#C8A24A']} />}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'corrections' && (
            <>
              {corrections.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ fontSize: 14, color: '#6B5E4F' }}>No correction requests found.</Text>
                </View>
              ) : (
                corrections.map(record => (
                  <CorrectionCard
                    key={record.id}
                    record={record}
                    onApprove={handleApproveCorrection}
                    onReject={handleRejectCorrection}
                  />
                ))
              )}
            </>
          )}

          {tab === 'leaves' && (
            <>
              {leaves.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ fontSize: 14, color: '#6B5E4F' }}>No leave requests found.</Text>
                </View>
              ) : (
                leaves.map(record => (
                  <LeaveCard
                    key={record.id}
                    record={record}
                    onApprove={handleApproveLeave}
                    onReject={handleRejectLeave}
                  />
                ))
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
