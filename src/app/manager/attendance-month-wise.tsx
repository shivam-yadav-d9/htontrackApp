import { router } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { attendanceService } from '@/services/attendance.service';
import type { ManagerAttendanceResponse } from '@/services/attendance.service';
import { AttendanceMonthChart } from '@/components/attendance/AttendanceMonthChart';
import { AttendanceMonthList } from '@/components/attendance/AttendanceMonthList';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function KpiCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={{ flex: 1, padding: 14, borderRadius: 16, backgroundColor: '#FFFFFF', margin: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
      <Text style={{ fontSize: 11, color: '#6B5E4F', marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 20, fontWeight: '900', color: color ?? '#10233F' }}>{value}</Text>
    </View>
  );
}

export default function ManagerAttendanceMonthWiseScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ManagerAttendanceResponse | null>(null);

  useEffect(() => { load(); }, [year, month]);

  async function load() {
    setLoading(true);
    try {
      const res = await attendanceService.getManagerMonthWise(year, month);
      setData(res);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not load attendance data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
    if (isCurrent) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
  const summary = data?.store_summary;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F1E7' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#10233F', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>Monthly Attendance</Text>
          {data?.manager && (
            <Text style={{ fontSize: 12, color: '#C8A24A', marginTop: 1 }}>
              {data.manager.store_name} · {data.manager.store_code}
            </Text>
          )}
        </View>
      </View>

      {/* Month navigator */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0EDE8' }}>
        <TouchableOpacity onPress={prevMonth} style={{ padding: 6 }}>
          <ChevronLeft size={20} color="#10233F" />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#10233F' }}>{MONTH_NAMES[month - 1]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={{ padding: 6, opacity: isFuture ? 0.3 : 1 }} disabled={isFuture}>
          <ChevronRight size={20} color="#10233F" />
        </TouchableOpacity>
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
          {/* Store summary KPIs */}
          {summary && (
            <>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B5E4F', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Store Summary</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -4, marginBottom: 4 }}>
                <KpiCard label="Present Days" value={summary.present_days} color="#15803D" />
                <KpiCard label="Absent Days" value={summary.absent_days} color="#DC2626" />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -4, marginBottom: 4 }}>
                <KpiCard label="Weekly Offs" value={summary.weekly_off_days} color="#1D4ED8" />
                <KpiCard label="Leave Days" value={summary.leave_days} color="#7C3AED" />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -4, marginBottom: 16 }}>
                <KpiCard label="Total Hours" value={`${summary.total_hours.toFixed(1)}h`} />
                <KpiCard label="Avg Hrs/Day" value={`${summary.average_hours_per_present_day.toFixed(1)}h`} color="#C8A24A" />
              </View>
            </>
          )}

          {/* Store daily chart */}
          {data?.daily && data.daily.length > 0 && (
            <>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B5E4F', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Store Graph</Text>
              <AttendanceMonthChart records={data.daily} summary={summary ?? {}} />
            </>
          )}

          {/* Store daily list */}
          {data?.daily && data.daily.length > 0 && (
            <>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#10233F', marginBottom: 10, marginTop: 4 }}>Store Daily Breakdown</Text>
              <AttendanceMonthList records={data.daily} />
            </>
          )}

          {/* Employee cards */}
          {(data?.employees ?? []).length > 0 && (
            <>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#10233F', marginBottom: 10, marginTop: 8 }}>
                Team ({data!.employees.length})
              </Text>
              {data!.employees.map(emp => (
                <View key={emp.staff_id} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 10, elevation: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#10233F' }}>{emp.full_name}</Text>
                      <Text style={{ fontSize: 12, color: '#6B5E4F', marginTop: 1 }}>{emp.department} · {emp.designation}</Text>
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#C8A24A' }}>{emp.summary.total_hours.toFixed(1)}h</Text>
                  </View>

                  <View style={{ flexDirection: 'row', marginTop: 12, gap: 0 }}>
                    {[
                      { label: 'Present', value: emp.summary.present_days, color: '#15803D', bg: '#DCFCE7' },
                      { label: 'Absent',  value: emp.summary.absent_days,  color: '#DC2626', bg: '#FEE2E2' },
                      { label: 'W.Off',   value: emp.summary.weekly_off_days, color: '#1D4ED8', bg: '#DBEAFE' },
                    ].map(stat => (
                      <View key={stat.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, backgroundColor: stat.bg, marginHorizontal: 2 }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: stat.color }}>{stat.value}</Text>
                        <Text style={{ fontSize: 10, color: stat.color, fontWeight: '600' }}>{stat.label}</Text>
                      </View>
                    ))}
                    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, backgroundColor: '#F0FDF4', marginHorizontal: 2 }}>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: '#15803D' }}>{emp.summary.total_sessions}</Text>
                      <Text style={{ fontSize: 10, color: '#15803D', fontWeight: '600' }}>Sessions</Text>
                    </View>
                  </View>

                  {(emp.summary.auto_checkout_count > 0 || emp.summary.outside_geofence_count > 0) && (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {emp.summary.auto_checkout_count > 0 && (
                        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: '#FEF9C3' }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#92400E' }}>{emp.summary.auto_checkout_count} auto-checkout</Text>
                        </View>
                      )}
                      {emp.summary.outside_geofence_count > 0 && (
                        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: '#FEE2E2' }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#991B1B' }}>{emp.summary.outside_geofence_count} outside geofence</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </>
          )}

          {!loading && !data && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 14, color: '#6B5E4F' }}>No attendance data found.</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
