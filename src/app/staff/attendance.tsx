import { Tabs, router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ScreenLayout from "@/components/ScreenLayout";

import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
import { getCurrentLocation } from '@/utils/location'; // watchLocation no longer needed here

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function formatDuration(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return "0 min";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs} hr ${mins} min`;
  if (hrs > 0) return `${hrs} hr`;
  return `${mins} min`;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string | null }) {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    checked_in: { bg: '#DCFCE7', text: '#15803D', label: 'Checked In' },
    checked_out: { bg: '#FEF9C3', text: '#92400E', label: 'Checked Out' },
    present: { bg: '#DCFCE7', text: '#15803D', label: 'Present' },
    absent: { bg: '#FEE2E2', text: '#DC2626', label: 'Absent' },
    weekly_off: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Weekly Off' },
    leave: { bg: '#EDE9FE', text: '#7C3AED', label: 'Leave' },
    upcoming: { bg: '#F3F4F6', text: '#6B7280', label: 'Upcoming' },
    OPEN: { bg: '#DCFCE7', text: '#15803D', label: 'Checked In' },
    CLOSED: { bg: '#FEF9C3', text: '#92400E', label: 'Checked Out' },
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
    <View style={{ flex: 1, padding: 14, borderRadius: 16, backgroundColor: '#FFFFFF', margin: 4, elevation: 1 }}>
      <Text style={{ fontSize: 11, color: '#6B5E4F', marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 22, fontWeight: '900', color: color ?? '#10233F' }}>{value}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

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


  // Correction form
  const [correctionType, setCorrectionType] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [reqCheckIn, setReqCheckIn] = useState('');
  const [reqCheckOut, setReqCheckOut] = useState('');
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false);
  const [myCorrections, setMyCorrections] = useState<AttendanceCorrectionRecord[]>([]);

  // Leave form
  const [leaveType, setLeaveType] = useState('');
  const [leaveFromDate, setLeaveFromDate] = useState('');
  const [leaveToDate, setLeaveToDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [myLeaves, setMyLeaves] = useState<LeaveRequestRecord[]>([]);

  // Weekly-off
  const [weeklyOffToday, setWeeklyOffToday] = useState<WeeklyOffTodayResponse | null>(null);
  const [monthlyWeeklyOffs, setMonthlyWeeklyOffs] = useState<WeeklyOffMonthlyResponse | null>(null);
  const [woffChangeFrom, setWoffChangeFrom] = useState('');
  const [woffChangeTo, setWoffChangeTo] = useState('');
  const [woffChangeReason, setWoffChangeReason] = useState('');
  const [woffSubmitting, setWoffSubmitting] = useState(false);

  // ── Load on mount ──────────────────────────────────────────────────────────
  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadAttendance();
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'ATTENDANCE_UPDATED',
      () => {
        console.log('[AttendanceScreen] ATTENDANCE_UPDATED');
        loadAttendance();
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (tab === 'monthwise') loadGraph();
    if (tab === 'requests') loadRequests();
  }, [tab, year, month]);

  useEffect(() => {
    if (tab === 'monthwise') loadGraph();
    if (tab === 'requests') loadRequests();
  }, [tab, year, month]);

  // ── Data loaders ────────────────────────────────────────────────────────────

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

  async function loadAttendance() {
    try {
      const data = await attendanceService.getMyAttendance();

      console.log(
        "ATTENDANCE FULL RESPONSE =",
        JSON.stringify(data, null, 2)
      );

      console.log(
        "TODAY SESSIONS =",
        JSON.stringify(data?.sessions, null, 2)
      );

      setAttendance(data);

      try {
        const summary = await attendanceService.getMyDaySummary(getTodayDate());

        console.log(
          "DAY SUMMARY =",
          JSON.stringify(summary, null, 2)
        );

        setDaySummary(summary);
      } catch (err) {
        console.log("DAY SUMMARY ERROR =", err);
      }
    } catch (err) {
      console.log("ATTENDANCE ERROR =", err);

      Alert.alert(
        "Error",
        err instanceof Error
          ? err.message
          : "Could not load attendance."
      );
    }
  }

  async function loadGraph() {
    setGraphLoading(true);
    try {
      const data = await attendanceAnalyticsService.getStaffMonthWise(year, month);
      setGraph(data);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not load graph data.');
    } finally { setGraphLoading(false); }
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  function getTodayDate(): string { return new Date().toISOString().slice(0, 10); }

  async function handleCheckIn() {
    try {
      setLoading(true);
      const loc = await getCurrentLocation();
      await attendanceService.checkIn({
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
      Alert.alert('Success', 'Checked In Successfully');
      setRemarks('');
      setTimeout(() => { loadAttendance(); }, 1500);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      Alert.alert('Check-in Failed', typeof detail === 'object' && detail?.message ? detail.message : err instanceof Error ? err.message : 'Unable to check in.');
    } finally { setLoading(false); }
  }

  async function handleCheckOut() {
    try {
      setLoading(true);
      const loc = await getCurrentLocation();
      await attendanceService.checkOut({
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
      Alert.alert('Success', 'Checked Out Successfully');
      setRemarks('');
      setTimeout(() => { loadAttendance(); }, 1500);
    } catch (err) {
      Alert.alert('Check-out Failed', err instanceof Error ? err.message : 'Unable to check out.');
    } finally { setLoading(false); }
  }

  async function handleSubmitCorrection() {
    if (!correctionType.trim() || !correctionReason.trim()) {
      Alert.alert('Validation', 'Please enter correction type and reason.'); return;
    }
    setCorrectionSubmitting(true);
    try {
      await attendanceControlService.submitCorrectionRequest({
        correction_type: correctionType.trim(), reason: correctionReason.trim(),
        requested_check_in_time: reqCheckIn.trim() || undefined,
        requested_check_out_time: reqCheckOut.trim() || undefined,
      });
      Alert.alert('Submitted', 'Correction request submitted successfully.');
      setCorrectionType(''); setCorrectionReason(''); setReqCheckIn(''); setReqCheckOut('');
      await loadRequests();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not submit correction.');
    } finally { setCorrectionSubmitting(false); }
  }

  async function handleSubmitLeave() {
    if (!leaveType.trim() || !leaveFromDate.trim() || !leaveToDate.trim() || !leaveReason.trim()) {
      Alert.alert('Validation', 'Please fill all required leave fields.'); return;
    }
    setLeaveSubmitting(true);
    try {
      await attendanceControlService.submitLeaveRequest({
        leave_type: leaveType.trim(), from_date: leaveFromDate.trim(),
        to_date: leaveToDate.trim(), reason: leaveReason.trim(),
      });
      Alert.alert('Submitted', 'Leave request submitted successfully.');
      setLeaveType(''); setLeaveFromDate(''); setLeaveToDate(''); setLeaveReason('');
      await loadRequests();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not submit leave request.');
    } finally { setLeaveSubmitting(false); }
  }

  async function handleSubmitWoffChange() {
    if (!woffChangeFrom.trim() || !woffChangeTo.trim() || !woffChangeReason.trim()) {
      Alert.alert('Validation', 'Please fill all fields.'); return;
    }
    setWoffSubmitting(true);
    try {
      await weeklyOffService.createChangeRequest({
        current_off_date: woffChangeFrom.trim(),
        requested_off_date: woffChangeTo.trim(),
        reason: woffChangeReason.trim(),
      });
      Alert.alert('Submitted', 'Weekly-off change request submitted.');
      setWoffChangeFrom(''); setWoffChangeTo(''); setWoffChangeReason('');
      await loadRequests();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not submit request.');
    } finally { setWoffSubmitting(false); }
  }

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1);
  }
  function nextMonth() {
    const today = new Date();
    if (year > today.getFullYear() || (year === today.getFullYear() && month >= today.getMonth() + 1)) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1);
  }

  const activeSession = attendance?.active_session ?? null;
  const today = new Date().toISOString().split("T")[0];
  const sessions: AttendanceSession[] =
    (attendance?.sessions ?? []).filter(
      (item) => item.attendanceDate === today
    );
  const isCheckedIn =
    !!activeSession?.latestCheckIn &&
    !activeSession?.latestCheckOut;
  const summary = graph?.summary;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <ScreenLayout title="Attendance">
      <View style={styles.root}>

        {/* ── HEADER ───────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTag}>ATTENDANCE HUB</Text>
          <Text style={styles.headerTitle}>My Dashboard</Text>
          <Text style={styles.headerSubtitle}>Track attendance and office status.</Text>
        </View>

        {/* ── STATUS CARDS ─────────────────────────────────────────────────── */}
        <View style={styles.floatingRow}>
          <View style={[styles.floatCard, { flex: 1.2 }]}>
            <Text style={styles.floatLabel}>Status</Text>
            <Text style={[styles.floatValue, { color: isCheckedIn ? '#10B981' : '#EF4444', fontSize: 18 }]}>
              {isCheckedIn ? '● Active' : '● Not In'}
            </Text>
          </View>

          <View style={[styles.floatCard, { flex: 1 }]}>
            <Text style={styles.floatLabel}>Today</Text>
            <Text style={[styles.floatValue, { fontSize: 14, color: '#0B2D52' }]}>
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </Text>
          </View>

          <TouchableOpacity style={styles.leaveButton} onPress={() => setTab('requests')}>
            <Text style={styles.leaveText}>Apply{'\n'}Leave</Text>
          </TouchableOpacity>
        </View>

        {/* ── TAB BAR ──────────────────────────────────────────────────────── */}
        <View style={styles.tabBar}>
          {([
            { key: 'checkin', label: 'Check-In/Out' },
            { key: 'monthwise', label: 'Month-Wise' },
            { key: 'requests', label: 'Requests' },
          ] as { key: Tab; label: string }[]).map(t => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tabItem, tab === t.key && styles.tabItemActive]}
            >
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── TAB CONTENT ──────────────────────────────────────────────────── */}

        {tab === 'checkin' ? (
          <FlatList
            data={sessions}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.tabContent}
            ListHeaderComponent={
              <>
                {/* Manual Check-In / Check-Out Buttons */}

                <Text style={styles.sectionTitle}>Today's Sessions</Text>
              </>
            }
            renderItem={({ item }) => (
              <View style={styles.attendanceCard}>
                <View>
                  <Text style={styles.attendanceDate}>{item.attendanceDate}</Text>
                  <Text style={styles.attendanceTime}>Check In: {formatDateTime(item.checkIn)}</Text>
                  <Text style={styles.attendanceTime}>Check Out: {formatDateTime(item.checkOut)}</Text>
                  <Text style={styles.attendanceTime}>Duration: {formatDuration(item.durationMinutes)}</Text>

                  <Text style={styles.attendanceTime}>
                    Total Sessions: {item.totalSessions}
                  </Text>

                  <Text style={styles.attendanceTime}>
                    Total Duration Minutes: {item.totalDurationMinutes}
                  </Text>

                  <Text style={styles.attendanceTime}>
                    Total Duration: {item.totalDurationFormatted}
                  </Text>

                  <Text style={styles.attendanceTime}>
                    Status: {item.status}
                  </Text>

                  {item.auto_checkin && <Text style={styles.autoTag}>● Auto check-in</Text>}
                  {item.auto_checkout && <Text style={[styles.autoTag, { color: '#B45309' }]}>● Auto checkout</Text>}
                </View>
                <StatusBadge status={item.status} />
              </View>
            )}
            ListEmptyComponent={
              <Text style={{ color: '#6B7280', marginTop: 8 }}>No attendance sessions today.</Text>
            }
          />

        ) : tab === 'requests' ? (
          <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>

            {/* ── Correction Request ── */}
            <Text style={styles.sectionTitle}>Attendance Correction</Text>
            <View style={styles.card}>
              <TextInput value={correctionType} onChangeText={setCorrectionType}
                placeholder="Correction type (e.g. missed check-in)" placeholderTextColor="#9CA3AF" style={styles.input} />
              <TextInput value={reqCheckIn} onChangeText={setReqCheckIn}
                placeholder="Requested check-in (e.g. 2026-05-24T09:00:00)" placeholderTextColor="#9CA3AF" style={styles.input} />
              <TextInput value={reqCheckOut} onChangeText={setReqCheckOut}
                placeholder="Requested check-out (optional)" placeholderTextColor="#9CA3AF" style={styles.input} />
              <TextInput value={correctionReason} onChangeText={setCorrectionReason}
                placeholder="Reason (required)" placeholderTextColor="#9CA3AF" multiline
                style={[styles.input, { minHeight: 60 }]} />
              <TouchableOpacity onPress={handleSubmitCorrection} disabled={correctionSubmitting}
                style={[styles.submitButton, { backgroundColor: '#0B2D52' }]}>
                {correctionSubmitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitButtonText}>Submit Correction Request</Text>}
              </TouchableOpacity>
            </View>

            {myCorrections.length > 0 && (
              <>
                <Text style={styles.subSectionTitle}>My Correction Requests</Text>
                {myCorrections.map(r => {
                  const sc = r.status === 'approved' ? { bg: '#DCFCE7', color: '#15803D' }
                    : r.status === 'rejected' ? { bg: '#FEE2E2', color: '#DC2626' }
                      : { bg: '#FEF9C3', color: '#92400E' };
                  return (
                    <View key={r.id} style={styles.requestCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={styles.requestCardTitle}>{r.correction_type}</Text>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: sc.bg }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: sc.color, textTransform: 'capitalize' }}>{r.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.requestCardBody}>{r.reason}</Text>
                      {r.manager_remarks && <Text style={[styles.requestCardBody, { fontStyle: 'italic' }]}>Manager: {r.manager_remarks}</Text>}
                      <Text style={styles.requestCardMeta}>{new Date(r.created_at).toLocaleDateString('en-IN')}</Text>
                    </View>
                  );
                })}
              </>
            )}

            {/* ── Leave Request ── */}
            <Text style={styles.sectionTitle}>Leave Request</Text>
            <View style={styles.card}>
              <TextInput value={leaveType} onChangeText={setLeaveType}
                placeholder="Leave type (e.g. Sick, Casual, Personal)" placeholderTextColor="#9CA3AF" style={styles.input} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput value={leaveFromDate} onChangeText={setLeaveFromDate}
                  placeholder="From (YYYY-MM-DD)" placeholderTextColor="#9CA3AF"
                  style={[styles.input, { flex: 1 }]} />
                <TextInput value={leaveToDate} onChangeText={setLeaveToDate}
                  placeholder="To (YYYY-MM-DD)" placeholderTextColor="#9CA3AF"
                  style={[styles.input, { flex: 1 }]} />
              </View>
              <TextInput value={leaveReason} onChangeText={setLeaveReason}
                placeholder="Reason (required)" placeholderTextColor="#9CA3AF" multiline
                style={[styles.input, { minHeight: 60 }]} />
              <TouchableOpacity onPress={handleSubmitLeave} disabled={leaveSubmitting}
                style={[styles.submitButton, { backgroundColor: '#7C3AED' }]}>
                {leaveSubmitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitButtonText}>Submit Leave Request</Text>}
              </TouchableOpacity>
            </View>

            {myLeaves.length > 0 && (
              <>
                <Text style={styles.subSectionTitle}>My Leave Requests</Text>
                {myLeaves.map(r => {
                  const sc = r.status === 'approved' ? { bg: '#DCFCE7', color: '#15803D' }
                    : r.status === 'rejected' ? { bg: '#FEE2E2', color: '#DC2626' }
                      : { bg: '#FEF9C3', color: '#92400E' };
                  return (
                    <View key={r.id} style={styles.requestCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={styles.requestCardTitle}>{r.leave_type}</Text>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: sc.bg }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: sc.color, textTransform: 'capitalize' }}>{r.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.requestCardBody}>{r.from_date} → {r.to_date}</Text>
                      <Text style={styles.requestCardBody}>{r.reason}</Text>
                      {r.manager_remarks && <Text style={[styles.requestCardBody, { fontStyle: 'italic' }]}>Manager: {r.manager_remarks}</Text>}
                      <Text style={styles.requestCardMeta}>{new Date(r.created_at).toLocaleDateString('en-IN')}</Text>
                    </View>
                  );
                })}
              </>
            )}

            {/* ── Weekly Offs ── */}
            <Text style={styles.sectionTitle}>My Weekly Offs</Text>
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#6B7280' }}>Today</Text>
                <View style={{
                  paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
                  backgroundColor: weeklyOffToday?.is_weekly_off_today ? '#DBEAFE' : '#DCFCE7'
                }}>
                  <Text style={{
                    fontSize: 12, fontWeight: '700',
                    color: weeklyOffToday?.is_weekly_off_today ? '#1D4ED8' : '#15803D'
                  }}>
                    {weeklyOffToday?.is_weekly_off_today ? 'Weekly Off' : 'Working Day'}
                  </Text>
                </View>
              </View>
              {(monthlyWeeklyOffs?.weekly_offs ?? []).length > 0 ? (
                <>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 6 }}>
                    This Month: {monthlyWeeklyOffs!.total_weekly_offs} weekly offs
                  </Text>
                  {monthlyWeeklyOffs!.weekly_offs.map((item: WeeklyOffRecord) => (
                    <View key={item.id ?? item.off_date}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#F0EDE8' }}>
                      <Text style={{ fontSize: 13, color: '#111827', fontWeight: '600' }}>{item.off_date}</Text>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>{item.off_type}</Text>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={{ fontSize: 13, color: '#9CA3AF' }}>No weekly offs found this month.</Text>
              )}
            </View>

            <Text style={[styles.subSectionTitle, { marginTop: 4 }]}>Request Weekly-off Change</Text>
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput value={woffChangeFrom} onChangeText={setWoffChangeFrom}
                  placeholder="Current off date (YYYY-MM-DD)" placeholderTextColor="#9CA3AF"
                  style={[styles.input, { flex: 1 }]} />
                <TextInput value={woffChangeTo} onChangeText={setWoffChangeTo}
                  placeholder="Requested date (YYYY-MM-DD)" placeholderTextColor="#9CA3AF"
                  style={[styles.input, { flex: 1 }]} />
              </View>
              <TextInput value={woffChangeReason} onChangeText={setWoffChangeReason}
                placeholder="Reason (required)" placeholderTextColor="#9CA3AF" multiline
                style={[styles.input, { minHeight: 50 }]} />
              <TouchableOpacity onPress={handleSubmitWoffChange} disabled={woffSubmitting}
                style={[styles.submitButton, { backgroundColor: '#1D4ED8' }]}>
                {woffSubmitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitButtonText}>Submit Change Request</Text>}
              </TouchableOpacity>
            </View>

          </ScrollView>

        ) : (
          /* ── Month-wise tab ─────────────────────────────────────────────── */
          <ScrollView contentContainerStyle={styles.tabContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn}>
                <Text style={styles.monthNavText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthNavLabel}>{MONTH_NAMES[month - 1]} {year}</Text>
              <TouchableOpacity onPress={nextMonth} style={styles.monthNavBtn}>
                <Text style={styles.monthNavText}>›</Text>
              </TouchableOpacity>
            </View>

            {graphLoading ? (
              <ActivityIndicator color="#F59E0B" size="large" style={{ marginTop: 40 }} />
            ) : (
              <>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                  <KpiCard label="Present Days" value={summary?.present_days ?? 0} color="#15803D" />
                  <KpiCard label="Absent Days" value={summary?.absent_days ?? 0} color="#DC2626" />
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                  <KpiCard label="Weekly Offs" value={summary?.weekly_off_days ?? 0} color="#1D4ED8" />
                  <KpiCard label="Leave Days" value={summary?.leave_days ?? 0} color="#7C3AED" />
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                  <KpiCard label="Total Hours" value={summary?.total_hours ?? 0} color="#0B2D52" />
                  <KpiCard label="Avg Hrs/Day" value={summary?.average_hours_per_present_day ?? 0} color="#F59E0B" />
                </View>
                <AttendanceMonthChart records={graph?.records ?? []} summary={summary ?? {}} />
                <Text style={styles.sectionTitle}>Daily Attendance</Text>
                <AttendanceMonthList records={graph?.records ?? []} />
              </>
            )}
          </ScrollView>
        )}
      </View>
    </ScreenLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    backgroundColor: '#0B2D52',
    paddingTop: 60,
    paddingHorizontal: 25,
    paddingBottom: 70,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTag: { color: '#F59E0B', fontWeight: '700', letterSpacing: 1, fontSize: 12 },
  headerTitle: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginTop: 8 },
  headerSubtitle: { color: '#D1D5DB', fontSize: 15, marginTop: 8 },

  floatingRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: -40,
    gap: 10,
    alignItems: 'stretch',
  },
  floatCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    elevation: 4,
    justifyContent: 'center',
  },
  floatLabel: { color: '#6B7280', fontSize: 12 },
  floatValue: { fontSize: 22, fontWeight: 'bold', marginTop: 4 },

  leaveButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveText: { color: '#fff', fontWeight: 'bold', fontSize: 13, textAlign: 'center' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 4,
    elevation: 2,
  },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabItemActive: { backgroundColor: '#0B2D52' },
  tabLabel: { fontWeight: '800', color: '#9CA3AF', fontSize: 11 },
  tabLabelActive: { color: '#fff' },

  tabContent: { padding: 20, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
  },

  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 12, backgroundColor: '#FAFAF8', color: '#1C1C1E',
    fontSize: 13, marginBottom: 10,
  },

  actionButton: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center' },
  actionButtonText: { color: '#fff', fontWeight: '900', fontSize: 15 },

  attendanceCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  attendanceDate: { fontSize: 16, fontWeight: '700', color: '#111827' },
  attendanceTime: { color: '#6B7280', marginTop: 2, fontSize: 13 },
  autoTag: { color: '#15803D', fontWeight: '700', fontSize: 12, marginTop: 4 },

  sectionTitle: {
    fontSize: 22, fontWeight: 'bold', color: '#111827',
    marginBottom: 14, marginTop: 4,
  },
  subSectionTitle: {
    fontSize: 14, fontWeight: '700', color: '#6B7280',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },

  submitButton: { borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 2 },
  submitButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  requestCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, elevation: 1,
  },
  requestCardTitle: { fontWeight: '700', color: '#111827', fontSize: 13 },
  requestCardBody: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  requestCardMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 3 },

  monthNavBtn: { padding: 10, borderRadius: 10, backgroundColor: '#fff' },
  monthNavText: { fontSize: 18, color: '#0B2D52', fontWeight: '900' },
  monthNavLabel: { fontSize: 18, fontWeight: '900', color: '#0B2D52' },
});