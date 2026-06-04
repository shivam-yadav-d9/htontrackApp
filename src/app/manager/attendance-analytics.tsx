import { router } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { attendanceAnalyticsService } from '@/services/attendance.service';
import type { ManagerAttendanceResponse } from '@/services/attendance.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string | null }) {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    present:    { bg: '#DCFCE7', text: '#15803D', label: 'Present' },
    absent:     { bg: '#FEE2E2', text: '#DC2626', label: 'Absent' },
    weekly_off: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Weekly Off' },
    leave:      { bg: '#EDE9FE', text: '#7C3AED', label: 'Leave' },
    upcoming:   { bg: '#F3F4F6', text: '#6B7280', label: 'Upcoming' },
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

export default function ManagerAttendanceAnalyticsScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [graph, setGraph] = useState<ManagerAttendanceResponse | null>(null);

  useEffect(() => { loadGraph(); }, [year, month]);

  async function loadGraph() {
    setLoading(true);
    try {
      const data = await attendanceAnalyticsService.getManagerMonthWise(year, month);
      setGraph(data);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not load attendance data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadGraph();
  }

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    if (isCurrentMonth) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);

  // Compute department aggregates from employee list
  const deptMap: Record<string, { present: number; absent: number; totalHours: number; count: number }> = {};
  (graph?.employees ?? []).forEach(emp => {
    const dept = emp.department || 'UNKNOWN';
    if (!deptMap[dept]) deptMap[dept] = { present: 0, absent: 0, totalHours: 0, count: 0 };
    deptMap[dept].present += emp.summary.present_days;
    deptMap[dept].absent += emp.summary.absent_days;
    deptMap[dept].totalHours += emp.summary.total_hours;
    deptMap[dept].count += 1;
  });
  const deptRows = Object.entries(deptMap).map(([dept, d]) => ({ dept, ...d }));

  const totalDays = graph?.daily?.length ?? 0;
  const storeSummary = graph?.store_summary;
  const presentToday = graph?.daily?.find(d => d.date === new Date().toISOString().slice(0, 10))?.sessions ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F1E7' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#10233F', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>Team Attendance</Text>
          {graph?.manager && (
            <Text style={{ fontSize: 12, color: '#C8A24A', marginTop: 1 }}>
              {graph.manager.store_name} · {graph.manager.store_code}
            </Text>
          )}
        </View>
      </View>

      {/* Month Navigator */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0EDE8' }}>
        <TouchableOpacity onPress={prevMonth} style={{ padding: 6 }}>
          <ChevronLeft size={20} color="#10233F" />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#10233F' }}>
          {MONTH_NAMES[month - 1]} {year}
        </Text>
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
          contentContainerStyle={{ padding: 16, gap: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#C8A24A']} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Store Summary KPIs */}
          {storeSummary && (
            <>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B5E4F', textTransform: 'uppercase', letterSpacing: 0.5 }}>Store Summary</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -4 }}>
                <KpiCard label="Present Days" value={storeSummary.present_days} color="#15803D" />
                <KpiCard label="Absent Days" value={storeSummary.absent_days} color="#DC2626" />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -4 }}>
                <KpiCard label="Weekly Offs" value={storeSummary.weekly_off_days} color="#1D4ED8" />
                <KpiCard label="Leave Days" value={storeSummary.leave_days} color="#7C3AED" />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -4 }}>
                <KpiCard label="Total Hours" value={`${storeSummary.total_hours.toFixed(1)}h`} />
                <KpiCard label="Avg Hrs/Day" value={`${storeSummary.average_hours_per_present_day.toFixed(1)}h`} />
              </View>

              {/* Warning cards */}
              {storeSummary.auto_checkout_count > 0 && (
                <View style={{ backgroundColor: '#FEF9C3', borderRadius: 14, padding: 14, borderLeftWidth: 4, borderLeftColor: '#F59E0B' }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400E' }}>
                    {storeSummary.auto_checkout_count} Auto-Checkout{storeSummary.auto_checkout_count !== 1 ? 's' : ''} this month
                  </Text>
                  <Text style={{ fontSize: 12, color: '#78350F', marginTop: 2 }}>Staff left the store geofence unexpectedly.</Text>
                </View>
              )}
              {storeSummary.outside_geofence_count > 0 && (
                <View style={{ backgroundColor: '#FEE2E2', borderRadius: 14, padding: 14, borderLeftWidth: 4, borderLeftColor: '#DC2626' }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#991B1B' }}>
                    {storeSummary.outside_geofence_count} Outside-Geofence Check{storeSummary.outside_geofence_count !== 1 ? 's' : ''}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#7F1D1D', marginTop: 2 }}>Sessions logged outside the 200m radius.</Text>
                </View>
              )}
            </>
          )}

          {/* Monthly Overview Bar */}
          {storeSummary && totalDays > 0 && (
            <>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B5E4F', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>Monthly Overview</Text>
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1, gap: 10 }}>
                {[
                  { label: 'Present', value: storeSummary.present_days, color: '#22C55E' },
                  { label: 'Absent', value: storeSummary.absent_days, color: '#EF4444' },
                  { label: 'Weekly Off', value: storeSummary.weekly_off_days, color: '#3B82F6' },
                  { label: 'Leave', value: storeSummary.leave_days, color: '#8B5CF6' },
                ].map(row => (
                  <View key={row.label}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: '#6B5E4F' }}>{row.label}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#10233F' }}>{row.value} / {totalDays}</Text>
                    </View>
                    <MiniBar value={row.value} max={totalDays} color={row.color} />
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Department Summary */}
          {deptRows.length > 0 && (
            <>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B5E4F', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>Department Breakdown</Text>
              <View style={{ gap: 8 }}>
                {deptRows.map(row => (
                  <View key={row.dept} style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#10233F' }}>{row.dept}</Text>
                      <Text style={{ fontSize: 11, color: '#6B5E4F', marginTop: 1 }}>{row.count} staff · {row.totalHours.toFixed(1)}h total</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: '#15803D' }}>{row.present}</Text>
                        <Text style={{ fontSize: 10, color: '#6B5E4F' }}>Present</Text>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: '#DC2626' }}>{row.absent}</Text>
                        <Text style={{ fontSize: 10, color: '#6B5E4F' }}>Absent</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Employee Attendance Cards */}
          {(graph?.employees ?? []).length > 0 && (
            <>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B5E4F', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>
                Team ({graph!.employees.length})
              </Text>
              <View style={{ gap: 10 }}>
                {graph!.employees.map(emp => (
                  <View
                    key={emp.staff_id}
                    style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#10233F' }}>{emp.full_name}</Text>
                        <Text style={{ fontSize: 12, color: '#6B5E4F', marginTop: 1 }}>
                          {emp.department || '—'} · {emp.designation || '—'}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#9B8E82', marginTop: 2 }}>{emp.employee_code}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#C8A24A' }}>
                          {emp.summary.total_hours.toFixed(1)}h
                        </Text>
                        <Text style={{ fontSize: 10, color: '#6B5E4F' }}>total hours</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', marginTop: 12, gap: 0 }}>
                      {[
                        { label: 'Present', value: emp.summary.present_days, color: '#15803D', bg: '#DCFCE7' },
                        { label: 'Absent',  value: emp.summary.absent_days,  color: '#DC2626', bg: '#FEE2E2' },
                        { label: 'W.Off',   value: emp.summary.weekly_off_days, color: '#1D4ED8', bg: '#DBEAFE' },
                        { label: 'Leave',   value: emp.summary.leave_days,   color: '#7C3AED', bg: '#EDE9FE' },
                      ].map(stat => (
                        <View key={stat.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, backgroundColor: stat.bg, marginHorizontal: 2 }}>
                          <Text style={{ fontSize: 16, fontWeight: '900', color: stat.color }}>{stat.value}</Text>
                          <Text style={{ fontSize: 10, color: stat.color, fontWeight: '600' }}>{stat.label}</Text>
                        </View>
                      ))}
                    </View>

                    {(emp.summary.auto_checkout_count > 0 || emp.summary.outside_geofence_count > 0) && (
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                        {emp.summary.auto_checkout_count > 0 && (
                          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: '#FEF9C3' }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#92400E' }}>
                              {emp.summary.auto_checkout_count} auto-checkout{emp.summary.auto_checkout_count !== 1 ? 's' : ''}
                            </Text>
                          </View>
                        )}
                        {emp.summary.outside_geofence_count > 0 && (
                          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: '#FEE2E2' }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#991B1B' }}>
                              {emp.summary.outside_geofence_count} outside geofence
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    <View style={{ marginTop: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 11, color: '#6B5E4F' }}>Attendance Rate</Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#10233F' }}>
                          {totalDays > 0
                            ? `${Math.round((emp.summary.present_days / Math.max(totalDays - emp.summary.weekly_off_days - emp.summary.leave_days, 1)) * 100)}%`
                            : '—'}
                        </Text>
                      </View>
                      <MiniBar
                        value={emp.summary.present_days}
                        max={Math.max(totalDays - emp.summary.weekly_off_days - emp.summary.leave_days, 1)}
                        color="#22C55E"
                      />
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Daily List */}
          {(graph?.daily ?? []).length > 0 && (
            <>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B5E4F', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>Daily Breakdown</Text>
              <View style={{ gap: 8 }}>
                {graph!.daily.map(day => (
                  <View
                    key={day.date}
                    style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
                  >
                    <View style={{ width: 44, alignItems: 'center', marginRight: 12 }}>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: '#10233F' }}>
                        {parseInt(day.date.slice(8, 10), 10)}
                      </Text>
                      <Text style={{ fontSize: 10, color: '#6B5E4F' }}>
                        {MONTH_NAMES[parseInt(day.date.slice(5, 7), 10) - 1]}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <StatusBadge status={day.status} />
                      {day.sessions > 0 && (
                        <Text style={{ fontSize: 11, color: '#6B5E4F', marginTop: 4 }}>
                          {day.sessions} session{day.sessions !== 1 ? 's' : ''} · {day.total_hours.toFixed(2)}h
                        </Text>
                      )}
                      {day.first_check_in && (
                        <Text style={{ fontSize: 10, color: '#9B8E82', marginTop: 2 }}>
                          In {formatTime(day.first_check_in)}
                          {day.last_check_out ? ` · Out ${formatTime(day.last_check_out)}` : ''}
                        </Text>
                      )}
                    </View>
                    {day.auto_checkout_count > 0 && (
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: '#FEF9C3' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#92400E' }}>Auto</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </>
          )}

          {!loading && !graph && (
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
