import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { managerService, type TeamAttendanceReport } from '@/services/manager.service';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

const STATUS_COLORS: Record<string, string> = {
  present: COLORS.success,
  absent: COLORS.error,
  late: COLORS.warning,
};

export default function AttendanceTeamScreen() {
  const [report, setReport] = useState<TeamAttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAttendance();
  }, []);

  async function loadAttendance() {
    try {
      const data = await managerService.getTeamAttendance();
      setReport(data);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadAttendance();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Team Attendance</Text>
        </View>
        <ActivityIndicator color={COLORS.orange} size="large" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team Attendance</Text>
        <Text style={styles.headerSub}>
          {report?.date
            ? new Date(report.date).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })
            : new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.orange]} />
        }>

        {/* Summary Stats */}
        {report ? (
          <>
            <View style={styles.summaryRow}>
              <View style={[styles.statCard, Shadow.card]}>
                <Text style={[styles.statNum, { color: COLORS.success }]}>{report.present}</Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>
              <View style={[styles.statCard, Shadow.card]}>
                <Text style={[styles.statNum, { color: COLORS.error }]}>{report.absent}</Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
              <View style={[styles.statCard, Shadow.card]}>
                <Text style={[styles.statNum, { color: COLORS.warning }]}>{report.late}</Text>
                <Text style={styles.statLabel}>Late</Text>
              </View>
              <View style={[styles.statCard, Shadow.card]}>
                <Text style={[styles.statNum, { color: COLORS.blue }]}>{report.total_staff}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>

            {/* Staff List */}
            <Text style={styles.sectionHeader}>Staff Details</Text>
            {(report.staff_attendance ?? []).length === 0 ? (
              <Text style={styles.noDataText}>No attendance data available.</Text>
            ) : (
              report.staff_attendance.map((s) => (
                <View key={s.staff_id} style={[styles.staffCard, Shadow.card]}>
                  <View style={styles.staffLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {s.staff_name
                          .split(' ')
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join('')
                          .toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.staffName}>{s.staff_name}</Text>
                      {s.check_in_time ? (
                        <Text style={styles.staffTime}>
                          In: {s.check_in_time}
                          {s.check_out_time ? `  Out: ${s.check_out_time}` : ''}
                        </Text>
                      ) : (
                        <Text style={styles.staffTime}>Not checked in</Text>
                      )}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: (STATUS_COLORS[s.status] ?? COLORS.gray) + '18' },
                    ]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[s.status] ?? COLORS.gray }]}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <View style={styles.noDataBox}>
            <Text style={styles.noDataText}>Attendance data unavailable.</Text>
          </View>
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
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: Spacing.two },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.two,
    alignItems: 'center',
    gap: 4,
  },
  statNum: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 10, color: COLORS.gray, textAlign: 'center' },
  sectionHeader: { fontSize: 15, fontWeight: '800', color: COLORS.blue, marginTop: Spacing.one },
  staffCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  staffLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontWeight: '800', fontSize: 13 },
  staffName: { fontSize: 14, fontWeight: '700', color: COLORS.grayDark },
  staffTime: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.pill },
  statusText: { fontSize: 11, fontWeight: '700' },
  noDataBox: { alignItems: 'center', paddingVertical: 40 },
  noDataText: { fontSize: 13, color: COLORS.gray, textAlign: 'center' },
});
