import { router } from 'expo-router';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
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
  ManpowerRiskRow,
  ManagerTodayWeeklyOffsResponse,
  ManagerUpcomingWeeklyOffsResponse,
  ManpowerRiskResponse,
  WeeklyOffChangeRequest,
} from '@/services/weeklyOff.service';
import { weeklyOffService } from '@/services/weeklyOff.service';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

type Tab = 'today' | 'upcoming' | 'risk' | 'requests';

const RISK_COLORS = {
  high:   { bg: '#FEE2E2', color: '#DC2626', label: 'High Risk' },
  medium: { bg: '#FEF9C3', color: '#92400E', label: 'Med Risk' },
  low:    { bg: '#DCFCE7', color: '#15803D', label: 'Low Risk' },
};

function EmployeeChip({ name, dept }: { name?: string; dept?: string }) {
  return (
    <View style={{ backgroundColor: '#F8F1E7', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#10233F' }}>{name ?? '—'}</Text>
      {dept ? <Text style={{ fontSize: 11, color: '#6B5E4F' }}>{dept}</Text> : null}
    </View>
  );
}

function RiskBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const cfg = RISK_COLORS[level];
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: cfg.bg }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: cfg.color }}>{cfg.label}</Text>
    </View>
  );
}

function RiskRow({ row }: { row: ManpowerRiskRow }) {
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 8, elevation: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: '#10233F' }}>{row.date}</Text>
        <RiskBadge level={row.risk_level} />
      </View>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Text style={{ fontSize: 12, color: '#6B5E4F' }}>Team: <Text style={{ fontWeight: '700', color: '#10233F' }}>{row.team_count}</Text></Text>
        <Text style={{ fontSize: 12, color: '#6B5E4F' }}>On Leave: <Text style={{ fontWeight: '700', color: '#DC2626' }}>{row.weekly_off_count}</Text></Text>
        <Text style={{ fontSize: 12, color: '#6B5E4F' }}>Available: <Text style={{ fontWeight: '700', color: '#15803D' }}>{row.available_count}</Text></Text>
      </View>
      <Text style={{ fontSize: 12, color: '#6B5E4F', marginTop: 2 }}>
        {row.off_percentage}% of team on weekly off
      </Text>
      {row.employees_on_weekly_off.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
          {row.employees_on_weekly_off.map(e => (
            <EmployeeChip key={e.id ?? e.employee_code} name={e.staff_name} dept={e.department} />
          ))}
        </View>
      )}
    </View>
  );
}

function ChangeRequestCard({
  record,
  onApprove,
  onReject,
}: {
  record: WeeklyOffChangeRequest;
  onApprove: (id: string, remarks: string) => void;
  onReject: (id: string, remarks: string) => void;
}) {
  const [remarks, setRemarks] = useState('');
  const isPending = record.status === 'pending';
  const sc =
    record.status === 'approved' ? { bg: '#DCFCE7', color: '#15803D' }
    : record.status === 'rejected' ? { bg: '#FEE2E2', color: '#DC2626' }
    : { bg: '#FEF9C3', color: '#92400E' };

  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 10, elevation: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#10233F' }}>{record.staff_name ?? '—'}</Text>
          <Text style={{ fontSize: 12, color: '#6B5E4F' }}>{record.employee_code}</Text>
        </View>
        <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: sc.bg }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: sc.color, textTransform: 'capitalize' }}>{record.status}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 13, color: '#6B5E4F', marginBottom: 2 }}>
        Current: <Text style={{ fontWeight: '700', color: '#DC2626' }}>{record.current_off_date}</Text>
        {'  →  '}
        Requested: <Text style={{ fontWeight: '700', color: '#15803D' }}>{record.requested_off_date}</Text>
      </Text>
      <Text style={{ fontSize: 12, color: '#6B5E4F' }}>Reason: {record.reason}</Text>
      {record.manager_remarks && (
        <Text style={{ fontSize: 12, color: '#6B5E4F', marginTop: 3, fontStyle: 'italic' }}>Remarks: {record.manager_remarks}</Text>
      )}
      <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
        {new Date(record.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </Text>
      {isPending && (
        <>
          <TextInput
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Add remarks (optional)"
            placeholderTextColor="#9CA3AF"
            multiline
            style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, fontSize: 13, color: '#10233F', minHeight: 44, marginTop: 8, backgroundColor: '#FAFAFA' }}
          />
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

export default function ManagerWeeklyOffsScreen() {
  const now = new Date();
  const [tab, setTab] = useState<Tab>('today');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [todayData, setTodayData] = useState<ManagerTodayWeeklyOffsResponse | null>(null);
  const [upcomingData, setUpcomingData] = useState<ManagerUpcomingWeeklyOffsResponse | null>(null);
  const [riskData, setRiskData] = useState<ManpowerRiskResponse | null>(null);
  const [changeRequests, setChangeRequests] = useState<WeeklyOffChangeRequest[]>([]);

  const load = useCallback(async () => {
    try {
      const [today, upcoming, risk, reqs] = await Promise.all([
        weeklyOffService.getManagerTodayWeeklyOffs(),
        weeklyOffService.getManagerUpcomingWeeklyOffs(7),
        weeklyOffService.getManagerManpowerRisk(year, month),
        weeklyOffService.getManagerChangeRequests(),
      ]);
      setTodayData(today);
      setUpcomingData(upcoming);
      setRiskData(risk);
      setChangeRequests(reqs);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not load weekly-off data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }
  const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);

  async function handleApprove(id: string, remarks: string) {
    try {
      await weeklyOffService.approveChangeRequest(id, remarks || undefined);
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Approval failed.');
    }
  }

  async function handleReject(id: string, remarks: string) {
    try {
      await weeklyOffService.rejectChangeRequest(id, remarks || undefined);
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Rejection failed.');
    }
  }

  const pendingRequests = changeRequests.filter(r => r.status === 'pending').length;

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: 'today', label: 'Today' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'risk', label: 'Risk' },
    { key: 'requests', label: 'Requests', badge: pendingRequests },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F1E7' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#10233F', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>Weekly-off Intelligence</Text>
          {todayData?.manager && (
            <Text style={{ fontSize: 12, color: '#C8A24A', marginTop: 1 }}>
              {todayData.manager.store_name} · {todayData.manager.store_code}
            </Text>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0EDE8' }}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: active ? '#C8A24A' : 'transparent' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: active ? '800' : '500', color: active ? '#10233F' : '#9CA3AF' }}>{t.label}</Text>
                {t.badge != null && t.badge > 0 && (
                  <View style={{ backgroundColor: '#DC2626', borderRadius: 9, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>{t.badge}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Month navigator — shown for risk tab */}
      {tab === 'risk' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0EDE8' }}>
          <TouchableOpacity onPress={prevMonth} style={{ padding: 6 }}>
            <ChevronLeft size={20} color="#10233F" />
          </TouchableOpacity>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#10233F' }}>{MONTH_NAMES[month - 1]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={{ padding: 6, opacity: isFuture ? 0.3 : 1 }} disabled={isFuture}>
            <ChevronRight size={20} color="#10233F" />
          </TouchableOpacity>
        </View>
      )}

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
          {/* ── Today tab ── */}
          {tab === 'today' && (
            <>
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 14, elevation: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B5E4F', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  Weekly Off Today · {todayData?.date}
                </Text>
                <Text style={{ fontSize: 32, fontWeight: '900', color: '#C8A24A' }}>{todayData?.count ?? 0}</Text>
                <Text style={{ fontSize: 13, color: '#6B5E4F', marginTop: 2 }}>employees on weekly off</Text>
              </View>

              {(todayData?.employees_on_weekly_off ?? []).length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                  <Text style={{ fontSize: 14, color: '#6B5E4F' }}>No employees on weekly off today.</Text>
                </View>
              ) : (
                todayData!.employees_on_weekly_off.map(emp => (
                  <View key={emp.id ?? emp.employee_code} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 8, elevation: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#10233F' }}>{emp.staff_name ?? '—'}</Text>
                    <Text style={{ fontSize: 12, color: '#6B5E4F', marginTop: 2 }}>
                      {[emp.department, emp.designation].filter(Boolean).join(' · ')}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6B5E4F', marginTop: 2 }}>{emp.off_type} · {emp.off_date}</Text>
                  </View>
                ))
              )}
            </>
          )}

          {/* ── Upcoming tab ── */}
          {tab === 'upcoming' && (
            <>
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, marginBottom: 14, elevation: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B5E4F', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Next 7 Days · {upcomingData?.from_date} to {upcomingData?.to_date}
                </Text>
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#10233F', marginTop: 4 }}>{upcomingData?.total ?? 0} upcoming offs</Text>
              </View>

              {(upcomingData?.date_wise ?? []).length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                  <Text style={{ fontSize: 14, color: '#6B5E4F' }}>No weekly offs in the next 7 days.</Text>
                </View>
              ) : (
                upcomingData!.date_wise.map(day => (
                  <View key={day.date} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 10, elevation: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#10233F' }}>{day.date}</Text>
                      <View style={{ backgroundColor: '#F8F1E7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#C8A24A' }}>{day.count} off</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      {day.employees.map(e => (
                        <EmployeeChip key={e.id ?? e.employee_code} name={e.staff_name} dept={e.department} />
                      ))}
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {/* ── Risk tab ── */}
          {tab === 'risk' && (
            <>
              {riskData && (
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 14, elevation: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B5E4F', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                    Manpower Risk · {MONTH_NAMES[month - 1]} {year}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: '#FEE2E2' }}>
                      <Text style={{ fontSize: 22, fontWeight: '900', color: '#DC2626' }}>{riskData.high_risk_days}</Text>
                      <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '600' }}>High Risk</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: '#FEF9C3' }}>
                      <Text style={{ fontSize: 22, fontWeight: '900', color: '#92400E' }}>{riskData.medium_risk_days}</Text>
                      <Text style={{ fontSize: 11, color: '#92400E', fontWeight: '600' }}>Med Risk</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: '#DCFCE7' }}>
                      <Text style={{ fontSize: 22, fontWeight: '900', color: '#15803D' }}>{riskData.low_risk_days}</Text>
                      <Text style={{ fontSize: 11, color: '#15803D', fontWeight: '600' }}>Low Risk</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: '#6B5E4F', marginTop: 8 }}>Team size: {riskData.team_count} employees</Text>
                </View>
              )}

              {(riskData?.risk_rows ?? []).filter(r => r.risk_level !== 'low').length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                  <Text style={{ fontSize: 14, color: '#15803D', fontWeight: '700' }}>No high or medium risk days this month.</Text>
                </View>
              ) : (
                <>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B5E4F', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Risk Days</Text>
                  {(riskData?.risk_rows ?? [])
                    .filter(r => r.risk_level !== 'low')
                    .map(row => <RiskRow key={row.date} row={row} />)}
                </>
              )}
            </>
          )}

          {/* ── Requests tab ── */}
          {tab === 'requests' && (
            <>
              {changeRequests.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ fontSize: 14, color: '#6B5E4F' }}>No weekly-off change requests.</Text>
                </View>
              ) : (
                changeRequests.map(record => (
                  <ChangeRequestCard
                    key={record.id}
                    record={record}
                    onApprove={handleApprove}
                    onReject={handleReject}
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
