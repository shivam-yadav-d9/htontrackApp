import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { LocationSubscription } from 'expo-location';

import { attendanceService, attendanceAnalyticsService, attendanceControlService } from '@/services/attendance.service';
import { weeklyOffService } from '@/services/weeklyOff.service';
import type { WeeklyOffRecord, WeeklyOffTodayResponse, WeeklyOffMonthlyResponse } from '@/services/weeklyOff.service';
import { AttendanceMonthChart } from '@/components/attendance/AttendanceMonthChart';
import { AttendanceMonthList } from '@/components/attendance/AttendanceMonthList';
import type {
  AttendanceSession,
  AttendanceCorrectionRecord,
  LeaveRequestRecord,
  MyAttendanceResponse,
  StaffMonthWiseResponse,
} from '@/services/attendance.service';
import { getCurrentLocation, watchLocation } from '@/utils/location';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatHours(value?: number | null): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(2)} hrs`;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string | null }) {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    checked_in:  { bg: '#DCFCE7', text: '#15803D', label: 'Checked In' },
    checked_out: { bg: '#FEF9C3', text: '#92400E', label: 'Checked Out' },
    present:     { bg: '#DCFCE7', text: '#15803D', label: 'Present' },
    absent:      { bg: '#FEE2E2', text: '#DC2626', label: 'Absent' },
    weekly_off:  { bg: '#DBEAFE', text: '#1D4ED8', label: 'Weekly Off' },
    leave:       { bg: '#EDE9FE', text: '#7C3AED', label: 'Leave' },
    upcoming:    { bg: '#F3F4F6', text: '#6B7280', label: 'Upcoming' },
  };
  const cfg = configs[status ?? ''] ?? { bg: '#F3F4F6', text: '#6B7280', label: status ?? '—' };
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: cfg.bg, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: cfg.text }}>{cfg.label}</Text>
    </View>
  );
}

function KpiCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={{ flex: 1, padding: 14, borderRadius: 16, backgroundColor: '#FFFFFF', margin: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
      <Text style={{ fontSize: 11, color: '#6B5E4F', marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 22, fontWeight: '900', color: color ?? '#10233F' }}>{value}</Text>
    </View>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <View style={{ height: 6, backgroundColor: '#F0EDE8', borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type Tab = 'checkin' | 'monthwise' | 'requests';

export default function StaffAttendanceScreen() {
  const now = new Date();
  const [tab, setTab] = useState<Tab>('checkin');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [loading, setLoading] = useState(false);
  const [graphLoading, setGraphLoading] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [attendance, setAttendance] = useState<MyAttendanceResponse | null>(null);
  const [daySummary, setDaySummary] = useState<any>(null);
  const [graph, setGraph] = useState<StaffMonthWiseResponse | null>(null);
  const [lastGeofence, setLastGeofence] = useState<{
    geofence_status: string;
    distance_meters: number;
    is_inside_geofence: boolean;
  } | null>(null);

  const locationSub = useRef<LocationSubscription | null>(null);
  const lastAutoActionRef = useRef<string | null>(null);

  // Correction request form state
  const [correctionType, setCorrectionType] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [reqCheckIn, setReqCheckIn] = useState('');
  const [reqCheckOut, setReqCheckOut] = useState('');
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false);
  const [myCorrections, setMyCorrections] = useState<AttendanceCorrectionRecord[]>([]);

  // Leave request form state
  const [leaveType, setLeaveType] = useState('');
  const [leaveFromDate, setLeaveFromDate] = useState('');
  const [leaveToDate, setLeaveToDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [myLeaves, setMyLeaves] = useState<LeaveRequestRecord[]>([]);

  // Weekly-off state
  const [weeklyOffToday, setWeeklyOffToday] = useState<WeeklyOffTodayResponse | null>(null);
  const [monthlyWeeklyOffs, setMonthlyWeeklyOffs] = useState<WeeklyOffMonthlyResponse | null>(null);
  const [woffChangeFrom, setWoffChangeFrom] = useState('');
  const [woffChangeTo, setWoffChangeTo] = useState('');
  const [woffChangeReason, setWoffChangeReason] = useState('');
  const [woffSubmitting, setWoffSubmitting] = useState(false);

  useEffect(() => {
    loadAttendance();
    startLocationWatch();
    return () => { locationSub.current?.remove(); };
  }, []);

  useEffect(() => {
    if (tab === 'monthwise') loadGraph();
    if (tab === 'requests') loadRequests();
  }, [tab, year, month]);

  async function loadRequests() {
    try {
      const [c, l, woffToday, woffMonthly] = await Promise.all([
        attendanceControlService.getMyCorrectionRequests(),
        attendanceControlService.getMyLeaveRequests(),
        weeklyOffService.getMyWeeklyOffToday(),
        weeklyOffService.getMyMonthlyWeeklyOffs(now.getFullYear(), now.getMonth() + 1),
      ]);
      setMyCorrections(c);
      setMyLeaves(l);
      setWeeklyOffToday(woffToday);
      setMonthlyWeeklyOffs(woffMonthly);
    } catch { /* silent */ }
  }

  async function handleSubmitWoffChange() {
    if (!woffChangeFrom.trim() || !woffChangeTo.trim() || !woffChangeReason.trim()) {
      Alert.alert('Validation', 'Please fill all fields.');
      return;
    }
    setWoffSubmitting(true);
    try {
      await weeklyOffService.createChangeRequest({
        current_off_date: woffChangeFrom.trim(),
        requested_off_date: woffChangeTo.trim(),
        reason: woffChangeReason.trim(),
      });
      Alert.alert('Submitted', 'Weekly-off change request submitted.');
      setWoffChangeFrom('');
      setWoffChangeTo('');
      setWoffChangeReason('');
      await loadRequests();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not submit request.');
    } finally {
      setWoffSubmitting(false);
    }
  }

  async function handleSubmitCorrection() {
    if (!correctionType.trim() || !correctionReason.trim()) {
      Alert.alert('Validation', 'Please enter correction type and reason.');
      return;
    }
    setCorrectionSubmitting(true);
    try {
      await attendanceControlService.submitCorrectionRequest({
        correction_type: correctionType.trim(),
        reason: correctionReason.trim(),
        requested_check_in_time: reqCheckIn.trim() || undefined,
        requested_check_out_time: reqCheckOut.trim() || undefined,
      });
      Alert.alert('Submitted', 'Correction request submitted successfully.');
      setCorrectionType('');
      setCorrectionReason('');
      setReqCheckIn('');
      setReqCheckOut('');
      await loadRequests();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not submit correction.');
    } finally {
      setCorrectionSubmitting(false);
    }
  }

  async function handleSubmitLeave() {
    if (!leaveType.trim() || !leaveFromDate.trim() || !leaveToDate.trim() || !leaveReason.trim()) {
      Alert.alert('Validation', 'Please fill all required leave fields.');
      return;
    }
    setLeaveSubmitting(true);
    try {
      await attendanceControlService.submitLeaveRequest({
        leave_type: leaveType.trim(),
        from_date: leaveFromDate.trim(),
        to_date: leaveToDate.trim(),
        reason: leaveReason.trim(),
      });
      Alert.alert('Submitted', 'Leave request submitted successfully.');
      setLeaveType('');
      setLeaveFromDate('');
      setLeaveToDate('');
      setLeaveReason('');
      await loadRequests();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not submit leave request.');
    } finally {
      setLeaveSubmitting(false);
    }
  }

  function getTodayDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  async function loadAttendance() {
    try {
      const data = await attendanceService.getMyAttendance();
      setAttendance(data);
      try {
        const summary = await attendanceService.getMyDaySummary(getTodayDate());
        setDaySummary(summary);
      } catch { /* silent */ }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not load attendance.');
    }
  }

  async function loadGraph() {
    setGraphLoading(true);
    try {
      const data = await attendanceAnalyticsService.getStaffMonthWise(year, month);
      setGraph(data);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not load graph data.');
    } finally {
      setGraphLoading(false);
    }
  }

  async function startLocationWatch() {
    try {
      locationSub.current = await watchLocation(async (loc) => {
        try {
          const ping = await attendanceService.locationPing({
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
          });
          setLastGeofence({
            geofence_status: ping.geofence_status,
            distance_meters: ping.distance_meters,
            is_inside_geofence: ping.is_inside_geofence,
          });
          if (
            ping.action_taken === 'auto_checked_in' &&
            lastAutoActionRef.current !== 'auto_checked_in'
          ) {
            lastAutoActionRef.current = 'auto_checked_in';
            Alert.alert('Auto Check-in', 'You are inside the 200m store geofence. Attendance has been checked in automatically.');
            await loadAttendance();
          }
          if (
            ping.action_taken === 'auto_checked_out' &&
            lastAutoActionRef.current !== 'auto_checked_out'
          ) {
            lastAutoActionRef.current = 'auto_checked_out';
            Alert.alert('Auto Checkout', 'You moved outside the 200m store geofence. Attendance has been checked out automatically.');
            await loadAttendance();
          }
        } catch { /* silent */ }
      });
    } catch (err) {
      Alert.alert('Location', err instanceof Error ? err.message : 'Location permission required.');
    }
  }

  async function handleCheckIn() {
    try {
      setLoading(true);
      lastAutoActionRef.current = null;
      const loc = await getCurrentLocation();
      const res = await attendanceService.checkIn({ latitude: loc.latitude, longitude: loc.longitude, accuracy: loc.accuracy, remarks: remarks || undefined });
      Alert.alert('Checked In', res.message);
      setRemarks('');
      await loadAttendance();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      Alert.alert('Check-in Failed', typeof detail === 'object' && detail?.message ? detail.message : err instanceof Error ? err.message : 'Unable to check in.');
    } finally { setLoading(false); }
  }

  async function handleCheckOut() {
    try {
      setLoading(true);
      lastAutoActionRef.current = null;
      const loc = await getCurrentLocation();
      const res = await attendanceService.checkOut({ latitude: loc.latitude, longitude: loc.longitude, accuracy: loc.accuracy, remarks: remarks || undefined });
      Alert.alert('Checked Out', res.message);
      setRemarks('');
      await loadAttendance();
    } catch (err) {
      Alert.alert('Check-out Failed', err instanceof Error ? err.message : 'Unable to check out.');
    } finally { setLoading(false); }
  }

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    const today = new Date();
    if (year > today.getFullYear() || (year === today.getFullYear() && month >= today.getMonth() + 1)) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const activeSession = attendance?.active_session ?? null;
  const sessions: AttendanceSession[] = attendance?.sessions ?? [];
  const isCheckedIn = !!activeSession;
  const summary = graph?.summary;
  const totalDays = graph?.records?.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F1E7' }}>
      {/* Tab bar */}
      <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 4, paddingTop: 12, paddingBottom: 0 }}>
        {([
          { key: 'checkin', label: 'Check-In/Out' },
          { key: 'monthwise', label: 'Month-Wise' },
          { key: 'requests', label: 'Requests' },
        ] as { key: Tab; label: string }[]).map(t => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: tab === t.key ? '#C95F18' : 'transparent' }}
          >
            <Text style={{ fontWeight: '800', color: tab === t.key ? '#C95F18' : '#9CA3AF', fontSize: 12 }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'checkin' ? (
        /* ── Check-in tab ──────────────────────────────────────── */
        <FlatList
          data={sessions}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListHeaderComponent={
            <>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#10233F', marginBottom: 4 }}>Attendance</Text>
              <Text style={{ color: '#6B5E4F', marginBottom: 14 }}>Auto check-in/out · 200m store geofence</Text>

              {lastGeofence && (
                <View style={{ padding: 12, borderRadius: 14, backgroundColor: lastGeofence.is_inside_geofence ? '#DCFCE7' : '#FEF2F2', marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 18 }}>{lastGeofence.is_inside_geofence ? '✅' : '📍'}</Text>
                  <View>
                    <Text style={{ fontWeight: '800', color: lastGeofence.is_inside_geofence ? '#15803D' : '#DC2626' }}>
                      {lastGeofence.is_inside_geofence ? 'Inside geofence' : 'Outside geofence'}
                    </Text>
                    <Text style={{ color: '#6B5E4F', fontSize: 12 }}>{lastGeofence.distance_meters.toFixed(0)} m from store · 200m radius</Text>
                  </View>
                </View>
              )}

              <View style={{ padding: 18, borderRadius: 20, backgroundColor: '#FFFFFF', marginBottom: 16, elevation: 2 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#10233F', marginBottom: 10 }}>Today's Status</Text>
                {activeSession ? (
                  <>
                    <StatusBadge status={activeSession.status} />
                    <Text style={{ color: '#374151', marginTop: 8 }}>
                      {activeSession.session_label ?? 'Active session'} · Check-in: {formatDateTime(activeSession.check_in_time)}
                    </Text>
                    <Text style={{ color: '#374151' }}>Distance: {activeSession.check_in_distance_meters?.toFixed(0) ?? '—'} m</Text>
                    <Text style={{ color: '#374151' }}>Store: {activeSession.store_name ?? '—'}</Text>
                  </>
                ) : (
                  <Text style={{ color: '#9A3412', fontWeight: '700', marginBottom: 4 }}>Not checked in</Text>
                )}

                {daySummary && daySummary.total_sessions > 0 && (
                  <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0EDE8', gap: 3 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B5E4F', marginBottom: 2 }}>Today's Summary</Text>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                      <Text style={{ fontSize: 12, color: '#374151' }}>Sessions: <Text style={{ fontWeight: '700' }}>{daySummary.total_sessions}</Text></Text>
                      <Text style={{ fontSize: 12, color: '#374151' }}>Completed: <Text style={{ fontWeight: '700' }}>{daySummary.completed_sessions}</Text></Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#374151' }}>Total Hours: <Text style={{ fontWeight: '700' }}>{(daySummary.total_hours ?? 0).toFixed(2)} hrs</Text></Text>
                    {daySummary.first_check_in && (
                      <Text style={{ fontSize: 12, color: '#374151' }}>First In: <Text style={{ fontWeight: '700' }}>{formatDateTime(daySummary.first_check_in)}</Text></Text>
                    )}
                    {daySummary.last_check_out && (
                      <Text style={{ fontSize: 12, color: '#374151' }}>Last Out: <Text style={{ fontWeight: '700' }}>{formatDateTime(daySummary.last_check_out)}</Text></Text>
                    )}
                  </View>
                )}

                <TextInput
                  value={remarks}
                  onChangeText={setRemarks}
                  placeholder="Remarks (optional)"
                  style={{ marginTop: 14, borderWidth: 1, borderColor: '#E3D5C3', borderRadius: 12, padding: 12, backgroundColor: '#FAFAF8', color: '#1C1C1E' }}
                />

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
                  <TouchableOpacity onPress={handleCheckIn} disabled={loading || isCheckedIn}
                    style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: isCheckedIn ? '#D6D3D1' : '#C95F18', alignItems: 'center' }}>
                    {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 15 }}>Manual Check In</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleCheckOut} disabled={loading || !isCheckedIn}
                    style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: !isCheckedIn ? '#D6D3D1' : '#10233F', alignItems: 'center' }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 15 }}>Manual Check Out</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={{ fontSize: 17, fontWeight: '900', color: '#10233F', marginBottom: 10 }}>Session History</Text>
            </>
          }
          renderItem={({ item }) => (
            <View style={{ padding: 14, borderRadius: 16, backgroundColor: '#FFFFFF', marginBottom: 10, elevation: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <View>
                  <Text style={{ fontWeight: '800', color: '#10233F', fontSize: 14 }}>{item.attendance_date ?? '—'}</Text>
                  {item.session_label && (
                    <Text style={{ fontSize: 11, color: '#9B8E82', marginTop: 1 }}>{item.session_label}</Text>
                  )}
                </View>
                <StatusBadge status={item.status} />
              </View>
              <Text style={{ color: '#374151', fontSize: 13 }}>In: {formatDateTime(item.check_in_time)}</Text>
              <Text style={{ color: '#374151', fontSize: 13 }}>Out: {formatDateTime(item.check_out_time)}</Text>
              <Text style={{ color: '#6B5E4F', fontSize: 13, marginTop: 2 }}>Duration: {formatHours(item.total_hours)}</Text>
              {item.check_out_distance_meters != null && (
                <Text style={{ color: '#6B5E4F', fontSize: 12, marginTop: 2 }}>
                  Checkout Distance: {item.check_out_distance_meters.toFixed(0)} m · Geofence: {item.check_out_geofence_status ?? '—'}
                </Text>
              )}
              {item.auto_checkin && <Text style={{ color: '#15803D', fontWeight: '700', fontSize: 12, marginTop: 4 }}>Auto check-in by geofence</Text>}
              {item.auto_checkout && <Text style={{ color: '#B45309', fontWeight: '700', fontSize: 12, marginTop: 2 }}>Auto checkout by geofence</Text>}
              {item.checkout_remarks && !item.auto_checkout && (
                <Text style={{ color: '#6B5E4F', fontSize: 12, marginTop: 2 }}>{item.checkout_remarks}</Text>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: '#6B5E4F', marginTop: 8 }}>No attendance sessions yet.</Text>}
        />
      ) : tab === 'requests' ? (
        /* ── Requests tab ──────────────────────────────────────── */
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* Correction request form */}
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#10233F', marginBottom: 10 }}>Attendance Correction Request</Text>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1 }}>
            <TextInput
              value={correctionType}
              onChangeText={setCorrectionType}
              placeholder="Correction type (e.g. missed check-in)"
              placeholderTextColor="#9CA3AF"
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, fontSize: 13, color: '#10233F', marginBottom: 10 }}
            />
            <TextInput
              value={reqCheckIn}
              onChangeText={setReqCheckIn}
              placeholder="Requested check-in time (e.g. 2026-05-24T09:00:00)"
              placeholderTextColor="#9CA3AF"
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, fontSize: 13, color: '#10233F', marginBottom: 10 }}
            />
            <TextInput
              value={reqCheckOut}
              onChangeText={setReqCheckOut}
              placeholder="Requested check-out time (optional)"
              placeholderTextColor="#9CA3AF"
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, fontSize: 13, color: '#10233F', marginBottom: 10 }}
            />
            <TextInput
              value={correctionReason}
              onChangeText={setCorrectionReason}
              placeholder="Reason (required)"
              placeholderTextColor="#9CA3AF"
              multiline
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, fontSize: 13, color: '#10233F', minHeight: 60, marginBottom: 12 }}
            />
            <TouchableOpacity
              onPress={handleSubmitCorrection}
              disabled={correctionSubmitting}
              style={{ backgroundColor: '#10233F', borderRadius: 12, padding: 13, alignItems: 'center' }}
            >
              {correctionSubmitting
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>Submit Correction Request</Text>}
            </TouchableOpacity>
          </View>

          {/* My corrections list */}
          {myCorrections.length > 0 && (
            <>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#6B5E4F', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>My Correction Requests</Text>
              {myCorrections.map(r => {
                const sc = r.status === 'approved' ? { bg: '#DCFCE7', color: '#15803D' } : r.status === 'rejected' ? { bg: '#FEE2E2', color: '#DC2626' } : { bg: '#FEF9C3', color: '#92400E' };
                return (
                  <View key={r.id} style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 8, elevation: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontWeight: '700', color: '#10233F', fontSize: 13 }}>{r.correction_type}</Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: sc.bg }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: sc.color, textTransform: 'capitalize' }}>{r.status}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: '#6B5E4F' }}>{r.reason}</Text>
                    {r.manager_remarks && <Text style={{ fontSize: 12, color: '#6B5E4F', marginTop: 3, fontStyle: 'italic' }}>Manager: {r.manager_remarks}</Text>}
                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{new Date(r.created_at).toLocaleDateString('en-IN')}</Text>
                  </View>
                );
              })}
            </>
          )}

          {/* Leave request form */}
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#10233F', marginBottom: 10, marginTop: 8 }}>Leave Request</Text>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1 }}>
            <TextInput
              value={leaveType}
              onChangeText={setLeaveType}
              placeholder="Leave type (e.g. Sick, Casual, Personal)"
              placeholderTextColor="#9CA3AF"
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, fontSize: 13, color: '#10233F', marginBottom: 10 }}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <TextInput
                value={leaveFromDate}
                onChangeText={setLeaveFromDate}
                placeholder="From (YYYY-MM-DD)"
                placeholderTextColor="#9CA3AF"
                style={{ flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, fontSize: 13, color: '#10233F' }}
              />
              <TextInput
                value={leaveToDate}
                onChangeText={setLeaveToDate}
                placeholder="To (YYYY-MM-DD)"
                placeholderTextColor="#9CA3AF"
                style={{ flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, fontSize: 13, color: '#10233F' }}
              />
            </View>
            <TextInput
              value={leaveReason}
              onChangeText={setLeaveReason}
              placeholder="Reason (required)"
              placeholderTextColor="#9CA3AF"
              multiline
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, fontSize: 13, color: '#10233F', minHeight: 60, marginBottom: 12 }}
            />
            <TouchableOpacity
              onPress={handleSubmitLeave}
              disabled={leaveSubmitting}
              style={{ backgroundColor: '#7C3AED', borderRadius: 12, padding: 13, alignItems: 'center' }}
            >
              {leaveSubmitting
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>Submit Leave Request</Text>}
            </TouchableOpacity>
          </View>

          {/* My leaves list */}
          {myLeaves.length > 0 && (
            <>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#6B5E4F', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>My Leave Requests</Text>
              {myLeaves.map(r => {
                const sc = r.status === 'approved' ? { bg: '#DCFCE7', color: '#15803D' } : r.status === 'rejected' ? { bg: '#FEE2E2', color: '#DC2626' } : { bg: '#FEF9C3', color: '#92400E' };
                return (
                  <View key={r.id} style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 8, elevation: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontWeight: '700', color: '#10233F', fontSize: 13 }}>{r.leave_type}</Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: sc.bg }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: sc.color, textTransform: 'capitalize' }}>{r.status}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: '#6B5E4F' }}>{r.from_date} → {r.to_date}</Text>
                    <Text style={{ fontSize: 12, color: '#6B5E4F' }}>{r.reason}</Text>
                    {r.manager_remarks && <Text style={{ fontSize: 12, color: '#6B5E4F', marginTop: 3, fontStyle: 'italic' }}>Manager: {r.manager_remarks}</Text>}
                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{new Date(r.created_at).toLocaleDateString('en-IN')}</Text>
                  </View>
                );
              })}
            </>
          )}

          {/* My Weekly Offs */}
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#10233F', marginBottom: 10, marginTop: 8 }}>My Weekly Offs</Text>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 14, elevation: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#6B5E4F' }}>Today</Text>
              <View style={{
                paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
                backgroundColor: weeklyOffToday?.is_weekly_off_today ? '#DBEAFE' : '#DCFCE7',
              }}>
                <Text style={{
                  fontSize: 12, fontWeight: '700',
                  color: weeklyOffToday?.is_weekly_off_today ? '#1D4ED8' : '#15803D',
                }}>
                  {weeklyOffToday?.is_weekly_off_today ? 'Weekly Off' : 'Working Day'}
                </Text>
              </View>
            </View>

            {(monthlyWeeklyOffs?.weekly_offs ?? []).length > 0 ? (
              <>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B5E4F', marginBottom: 6 }}>
                  This Month: {monthlyWeeklyOffs!.total_weekly_offs} weekly offs
                </Text>
                {monthlyWeeklyOffs!.weekly_offs.map((item: WeeklyOffRecord) => (
                  <View key={item.id ?? item.off_date} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#F0EDE8' }}>
                    <Text style={{ fontSize: 13, color: '#10233F', fontWeight: '600' }}>{item.off_date}</Text>
                    <Text style={{ fontSize: 12, color: '#6B5E4F' }}>{item.off_type}</Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={{ fontSize: 13, color: '#9CA3AF' }}>No weekly offs found this month.</Text>
            )}
          </View>

          {/* Weekly-off change request form */}
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#10233F', marginBottom: 8 }}>Request Weekly-off Change</Text>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1 }}>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <TextInput
                value={woffChangeFrom}
                onChangeText={setWoffChangeFrom}
                placeholder="Current off date (YYYY-MM-DD)"
                placeholderTextColor="#9CA3AF"
                style={{ flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, fontSize: 12, color: '#10233F' }}
              />
              <TextInput
                value={woffChangeTo}
                onChangeText={setWoffChangeTo}
                placeholder="Requested date (YYYY-MM-DD)"
                placeholderTextColor="#9CA3AF"
                style={{ flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, fontSize: 12, color: '#10233F' }}
              />
            </View>
            <TextInput
              value={woffChangeReason}
              onChangeText={setWoffChangeReason}
              placeholder="Reason (required)"
              placeholderTextColor="#9CA3AF"
              multiline
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, fontSize: 13, color: '#10233F', minHeight: 50, marginBottom: 12 }}
            />
            <TouchableOpacity
              onPress={handleSubmitWoffChange}
              disabled={woffSubmitting}
              style={{ backgroundColor: '#1D4ED8', borderRadius: 12, padding: 13, alignItems: 'center' }}
            >
              {woffSubmitting
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>Submit Change Request</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* ── Month-wise tab ────────────────────────────────────── */
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* Month navigator */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <TouchableOpacity onPress={prevMonth} style={{ padding: 10, borderRadius: 10, backgroundColor: '#FFFFFF' }}>
              <Text style={{ fontSize: 18, color: '#10233F', fontWeight: '900' }}>‹</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#10233F' }}>
              {MONTH_NAMES[month - 1]} {year}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={{ padding: 10, borderRadius: 10, backgroundColor: '#FFFFFF' }}>
              <Text style={{ fontSize: 18, color: '#10233F', fontWeight: '900' }}>›</Text>
            </TouchableOpacity>
          </View>

          {graphLoading ? (
            <ActivityIndicator color="#C95F18" size="large" style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* KPI cards */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                <KpiCard label="Present Days" value={summary?.present_days ?? 0} color="#15803D" />
                <KpiCard label="Absent Days" value={summary?.absent_days ?? 0} color="#DC2626" />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                <KpiCard label="Weekly Offs" value={summary?.weekly_off_days ?? 0} color="#1D4ED8" />
                <KpiCard label="Leave Days" value={summary?.leave_days ?? 0} color="#7C3AED" />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                <KpiCard label="Total Hours" value={summary?.total_hours ?? 0} color="#10233F" />
                <KpiCard label="Avg Hrs/Day" value={summary?.average_hours_per_present_day ?? 0} color="#C95F18" />
              </View>

              {/* Charts */}
              <AttendanceMonthChart records={graph?.records ?? []} summary={summary ?? {}} />

              {/* Daily list */}
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#10233F', marginBottom: 10 }}>Daily Attendance</Text>
              <AttendanceMonthList records={graph?.records ?? []} />
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
