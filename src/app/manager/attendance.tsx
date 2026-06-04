import { router } from 'expo-router';
import { ArrowLeft, Clock3, UserRound } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { attendanceService } from '@/services/attendance.service';
import type { AttendanceRecord } from '@/types/attendance.types';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryCard}>
      <Clock3 size={18} color={COLORS.orange} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

export default function ManagerAttendanceScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<{
    present_today: number;
    late_today: number;
    checked_out_today: number;
    early_checkout_today: number;
    average_working_minutes: number;
  } | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => { loadAttendance(); }, []);

  async function loadAttendance() {
    try {
      const res = await attendanceService.getManagerAttendance();
      setSummary(res.summary);
      setAttendance(res.attendance);
    } catch (err) {
      console.log('Manager attendance load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadAttendance();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Team Attendance</Text>
          <Text style={styles.headerSub}>{new Date().toDateString()}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.orange]} />}
        showsVerticalScrollIndicator={false}
      >
        {summary ? (
          <View style={styles.summaryGrid}>
            <SummaryCard label="Present Today" value={summary.present_today} />
            <SummaryCard label="Late" value={summary.late_today} />
            <SummaryCard label="Checked Out" value={summary.checked_out_today} />
            <SummaryCard label="Avg Minutes" value={summary.average_working_minutes} />
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color={COLORS.orange} style={{ marginTop: 20 }} />
        ) : attendance.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No attendance records found.</Text>
          </View>
        ) : (
          attendance.map((item) => (
            <View key={item.id} style={[styles.card, Shadow.card]}>
              <View style={styles.cardTop}>
                <View style={styles.avatarBox}>
                  <UserRound size={20} color={COLORS.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.staffName}>{item.staff_name ?? '—'}</Text>
                  <Text style={styles.staffMeta}>
                    {[item.employee_code, item.attendance_date].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                {item.attendance_status ? (
                  <View style={[
                    styles.statusChip,
                    { backgroundColor: item.attendance_status === 'late' ? '#FEE2E2' : '#DCFCE7' },
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: item.attendance_status === 'late' ? '#B91C1C' : '#166534' },
                    ]}>
                      {item.attendance_status === 'on_time' ? 'ON TIME' : 'LATE'}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.timeRow}>
                <View style={styles.timeBox}>
                  <Text style={styles.timeLabel}>Check In</Text>
                  <Text style={styles.timeValue}>
                    {item.check_in_time
                      ? new Date(item.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </Text>
                </View>
                <View style={styles.timeBox}>
                  <Text style={styles.timeLabel}>Check Out</Text>
                  <Text style={styles.timeValue}>
                    {item.check_out_time
                      ? new Date(item.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </Text>
                </View>
                <View style={styles.timeBox}>
                  <Text style={styles.timeLabel}>Work Mins</Text>
                  <Text style={styles.timeValue}>{item.working_minutes ?? '—'}</Text>
                </View>
              </View>

              {item.checkout_status === 'early' ? (
                <View style={styles.earlyBanner}>
                  <Text style={styles.earlyText}>
                    Early checkout{item.early_checkout_reason ? `: ${item.early_checkout_reason}` : ''}
                  </Text>
                </View>
              ) : null}
              {item.auto_checkout ? (
                <View style={[styles.earlyBanner, { backgroundColor: '#FEF9C3' }]}>
                  <Text style={[styles.earlyText, { color: '#92400E' }]}>
                    Auto checkout: staff moved outside 200m radius
                  </Text>
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
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
  headerSub: { fontSize: 12, color: COLORS.white + 'CC', marginTop: 1 },

  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
    ...Shadow.card,
  },
  summaryValue: { fontSize: 26, fontWeight: '900', color: COLORS.blue },
  summaryLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: COLORS.gray, fontSize: 14 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.medium,
    backgroundColor: COLORS.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffName: { fontSize: 14, fontWeight: '800', color: COLORS.blue },
  staffMeta: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  statusChip: {
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  timeRow: { flexDirection: 'row', gap: Spacing.two },
  timeBox: { flex: 1 },
  timeLabel: { fontSize: 10, color: COLORS.gray, fontWeight: '700', textTransform: 'uppercase' },
  timeValue: { fontSize: 13, fontWeight: '800', color: COLORS.grayDark, marginTop: 2 },
  earlyBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: BorderRadius.small,
    padding: Spacing.one,
  },
  earlyText: { fontSize: 12, color: '#92400E', fontWeight: '600' },
});
