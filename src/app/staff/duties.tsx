import { router } from 'expo-router';
import { ArrowLeft, CalendarDays, CheckCircle, Clock } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/theme';
import { shiftService, type ShiftDuty } from '@/services/shift.service';

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  assigned:     { bg: '#EFF6FF', color: COLORS.blue,   label: 'Assigned' },
  acknowledged: { bg: '#ECFDF5', color: '#059669',     label: 'Acknowledged' },
  completed:    { bg: '#F0FDF4', color: '#16A34A',     label: 'Completed' },
  cancelled:    { bg: '#F3F4F6', color: '#6B7280',     label: 'Cancelled' },
};

export default function DutiesScreen() {
  const [duties, setDuties] = useState<ShiftDuty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [ackLoading, setAckLoading] = useState<string | null>(null);

  useEffect(() => { loadDuties(); }, []);

  async function loadDuties() {
    try {
      const data = await shiftService.getMyDuties();
      setDuties(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load duties');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadDuties();
  }

  async function handleAcknowledge(id: string) {
    setAckLoading(id);
    try {
      const updated = await shiftService.acknowledgeDuty(id);
      setDuties((prev) => prev.map((d) => (d.id === id ? updated : d)));
    } catch {
      // Silently ignore — duty stays as-is
    } finally {
      setAckLoading(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Shift Duties</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.orange} size="large" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadDuties(); }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.orange]} />}
        >
          {duties.length === 0 ? (
            <View style={styles.emptyState}>
              <CalendarDays size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Duties Assigned</Text>
              <Text style={styles.emptySub}>Your manager hasn't assigned any shift duties yet.</Text>
            </View>
          ) : (
            duties.map((duty) => {
              const st = STATUS_STYLE[duty.status] ?? STATUS_STYLE.assigned;
              const isPending = duty.status === 'assigned';
              return (
                <View key={duty.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.dateChip}>
                      <CalendarDays size={13} color={COLORS.blue} />
                      <Text style={styles.dateChipText}>{duty.shift_date}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>

                  <View style={styles.timeBlock}>
                    <Clock size={14} color="#6B7280" />
                    <Text style={styles.timeText}>{duty.shift_start} – {duty.shift_end}</Text>
                  </View>

                  <Text style={styles.assignedBy}>Assigned by {duty.assigned_by_name}</Text>

                  {duty.description ? (
                    <View style={styles.descBox}>
                      <Text style={styles.descText}>{duty.description}</Text>
                    </View>
                  ) : null}

                  {isPending ? (
                    <TouchableOpacity
                      style={[styles.ackBtn, ackLoading === duty.id && styles.ackBtnDisabled]}
                      onPress={() => handleAcknowledge(duty.id)}
                      disabled={ackLoading === duty.id}
                      activeOpacity={0.8}
                    >
                      {ackLoading === duty.id ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <CheckCircle size={15} color="#FFFFFF" />
                          <Text style={styles.ackBtnText}>Acknowledge</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7EFE5' },
  header: {
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  headerTitle: { flex: 1, color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dateChipText: { fontSize: 12, fontWeight: '700', color: COLORS.blue },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  timeBlock: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  assignedBy: { fontSize: 12, color: '#6B7280' },
  descBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#D1D5DB',
  },
  descText: { fontSize: 13, color: '#374151', lineHeight: 19 },
  ackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 11,
  },
  ackBtnDisabled: { opacity: 0.5 },
  ackBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  errorBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  errorText: { fontSize: 14, color: '#DC2626', textAlign: 'center' },
  retryBtn: { backgroundColor: COLORS.orange, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
});
