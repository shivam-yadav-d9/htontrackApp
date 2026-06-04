import React from 'react';
import { Text, View } from 'react-native';

type Props = {
  records: any[];
};

function formatTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  present:    { bg: '#DCFCE7', color: '#15803D', label: 'Present' },
  absent:     { bg: '#FEE2E2', color: '#DC2626', label: 'Absent' },
  weekly_off: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Weekly Off' },
  leave:      { bg: '#FEF9C3', color: '#B45309', label: 'Leave' },
  upcoming:   { bg: '#F3F4F6', color: '#6B7280', label: 'Upcoming' },
};

export function AttendanceMonthList({ records }: Props) {
  if (!records?.length) {
    return (
      <View style={{ borderRadius: 18, backgroundColor: '#FFFFFF', padding: 16, elevation: 1 }}>
        <Text style={{ color: '#6B5E4F' }}>No attendance records found for this month.</Text>
      </View>
    );
  }

  return (
    <>
      {records.map((item: any) => {
        const cfg = STATUS_CONFIG[item.status ?? ''] ?? { bg: '#F3F4F6', color: '#6B7280', label: item.status ?? '—' };
        return (
          <View
            key={item.date}
            style={{ borderRadius: 16, backgroundColor: '#FFFFFF', padding: 14, marginBottom: 8, elevation: 1 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#10233F' }}>{item.date}</Text>
              <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: cfg.bg }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: cfg.color }}>{cfg.label}</Text>
              </View>
            </View>

            {item.status === 'present' && (
              <>
                <Text style={{ color: '#6B5E4F', fontSize: 13 }}>
                  Sessions: {item.sessions ?? 0} · Hours: {Number(item.total_hours ?? 0).toFixed(2)}
                </Text>
                {item.first_check_in && (
                  <Text style={{ color: '#6B5E4F', fontSize: 12, marginTop: 2 }}>
                    In: {formatTime(item.first_check_in)} · Out: {formatTime(item.last_check_out)}
                  </Text>
                )}
                {(item.auto_checkout_count ?? 0) > 0 && (
                  <Text style={{ color: '#B45309', fontWeight: '700', fontSize: 12, marginTop: 3 }}>
                    Auto-checkout: {item.auto_checkout_count}
                  </Text>
                )}
                {(item.outside_geofence_count ?? 0) > 0 && (
                  <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 12, marginTop: 2 }}>
                    Outside geofence: {item.outside_geofence_count}
                  </Text>
                )}
              </>
            )}
          </View>
        );
      })}
    </>
  );
}
