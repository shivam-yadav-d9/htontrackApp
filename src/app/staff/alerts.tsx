import { AlertTriangle, CheckCheck, ShieldAlert } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StaffPageHeader } from '@/components/StaffPageHeader';

import { COLORS, BorderRadius, Spacing, Shadow } from '@/constants/theme';
import { alertService, type Alert } from '@/services/alert.service';

const SEVERITY_COLOR: Record<string, string> = {
  critical: COLORS.error,
  high: '#E85D04',
  medium: COLORS.warning,
  low: COLORS.success,
};

const TYPE_ICON: Record<string, string> = {
  assignment_overdue: '📋',
  course_deadline: '📚',
  low_target: '🎯',
  attendance_missing: '🗓️',
  document_rejected: '📄',
  certificate_expiring: '🏆',
  manager_escalation: '🔔',
  general: '⚠️',
};

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      setAlerts(await alertService.getMyAlerts());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAcknowledge(id: string) {
    try {
      const updated = await alertService.acknowledge(id);
      setAlerts(prev => prev.map(a => a.id === id ? updated : a));
    } catch {}
  }

  async function handleAcknowledgeAll() {
    try {
      await alertService.acknowledgeAll();
      setAlerts(prev => prev.map(a => ({ ...a, is_acknowledged: true })));
    } catch {}
  }

  const unread = alerts.filter(a => !a.is_acknowledged);

  return (
    <SafeAreaView style={styles.safe}>
      <StaffPageHeader
        title="Alerts"
        subtitle={unread.length > 0 ? `${unread.length} unread` : undefined}
        rightAction={
          unread.length > 0 ? (
            <TouchableOpacity style={styles.ackAllBtn} onPress={handleAcknowledgeAll}>
              <CheckCheck size={16} color={COLORS.white} />
              <Text style={styles.ackAllText}>Clear All</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />
      {unread.length > 0 && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{unread.length} unacknowledged alert{unread.length > 1 ? 's' : ''} — action required</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.orange} size="large" /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} colors={[COLORS.orange]} />}
        >
          {alerts.length === 0 ? (
            <View style={styles.emptyBox}>
              <ShieldAlert size={40} color={COLORS.gray} />
              <Text style={styles.emptyTitle}>No alerts</Text>
              <Text style={styles.emptySub}>You're all clear. Stay on top of your tasks!</Text>
            </View>
          ) : (
            alerts.map(alert => {
              const color = SEVERITY_COLOR[alert.severity] ?? COLORS.warning;
              return (
                <View key={alert.id} style={[styles.card, Shadow.card, !alert.is_acknowledged && { borderLeftWidth: 4, borderLeftColor: color }]}>
                  <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                    <Text style={{ fontSize: 20 }}>{TYPE_ICON[alert.alert_type] ?? '⚠️'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.alertTitle, alert.is_acknowledged && { color: COLORS.gray }]}>
                        {alert.title}
                      </Text>
                      <View style={[styles.severityBadge, { backgroundColor: color + '20' }]}>
                        <Text style={[styles.severityText, { color }]}>{alert.severity}</Text>
                      </View>
                    </View>
                    <Text style={styles.alertMsg}>{alert.message}</Text>
                    <Text style={styles.alertTime}>
                      {new Date(alert.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {!alert.is_acknowledged && (
                    <TouchableOpacity style={styles.ackBtn} onPress={() => handleAcknowledge(alert.id)}>
                      <CheckCheck size={18} color={COLORS.blue} />
                    </TouchableOpacity>
                  )}
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
  safe: { flex: 1, backgroundColor: COLORS.beige },
  header: {
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '900', color: COLORS.white },
  ackAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  ackAllText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  banner: { backgroundColor: COLORS.error + '15', padding: Spacing.two, borderBottomWidth: 1, borderBottomColor: COLORS.error + '30' },
  bannerText: { color: COLORS.error, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 14, color: COLORS.error, textAlign: 'center' },
  retryBtn: { backgroundColor: COLORS.orange, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: COLORS.white, fontWeight: '700' },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.grayDark },
  emptySub: { fontSize: 14, color: COLORS.gray, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  alertTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.black, lineHeight: 20 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  severityText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  alertMsg: { fontSize: 13, color: COLORS.grayDark, marginTop: 4, lineHeight: 18 },
  alertTime: { fontSize: 11, color: COLORS.gray, marginTop: 6 },
  ackBtn: { padding: 6 },
});
