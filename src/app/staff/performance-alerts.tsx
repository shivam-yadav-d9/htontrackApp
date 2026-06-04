import { router } from 'expo-router';
import { AlertTriangle, ShieldAlert } from 'lucide-react-native';
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

import { performanceAlertService } from '@/services/performance-alert.service';
import type { PerformanceAlert } from '@/types/performance-alert.types';

export default function StaffPerformanceAlertsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);

  useEffect(() => { loadAlerts(); }, []);

  async function loadAlerts() {
    try {
      setLoading(true);
      const data = await performanceAlertService.getMyAlerts();
      setAlerts(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  }

  const openCount = alerts.filter((item) => item.status !== 'resolved').length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Performance Alerts</Text>
        <Text style={styles.headerSub}>View manager feedback and improvement actions</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <View style={styles.summaryCard}>
          <ShieldAlert size={24} color="#C95F18" />
          <View>
            <Text style={styles.summaryValue}>{openCount}</Text>
            <Text style={styles.summaryLabel}>Open improvement alert(s)</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#C95F18" />
            <Text style={styles.loadingText}>Loading alerts...</Text>
          </View>
        ) : alerts.length === 0 ? (
          <View style={styles.emptyCard}>
            <ShieldAlert size={34} color="#8A8178" />
            <Text style={styles.emptyTitle}>No performance alerts</Text>
          </View>
        ) : (
          alerts.map((item) => (
            <View key={item.id} style={styles.alertCard}>
              <View style={styles.alertTop}>
                <View style={styles.iconBox}>
                  <AlertTriangle size={20} color="#C95F18" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{item.title}</Text>
                  <Text style={styles.alertMeta}>
                    {item.alert_type.replace(/_/g, ' ')} · {item.severity}
                  </Text>
                </View>
                <StatusChip status={item.status} />
              </View>

              <Text style={styles.alertDesc}>{item.description}</Text>

              <View style={styles.actionBox}>
                <Text style={styles.actionLabel}>Recommended Action</Text>
                <Text style={styles.actionText}>{item.recommended_action}</Text>
              </View>

              {item.resolution_note ? (
                <View style={styles.resolvedBox}>
                  <Text style={styles.resolvedLabel}>Resolution</Text>
                  <Text style={styles.resolvedText}>{item.resolution_note}</Text>
                </View>
              ) : null}

              {item.escalation_note ? (
                <View style={styles.escalatedBox}>
                  <Text style={styles.escalatedLabel}>Escalated to {item.escalated_to}</Text>
                  <Text style={styles.escalatedText}>{item.escalation_note}</Text>
                </View>
              ) : null}
            </View>
          ))
        )}

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusChip({ status }: { status: string }) {
  const resolved = status === 'resolved';
  const escalated = status === 'escalated';
  return (
    <View
      style={[
        styles.statusChip,
        resolved && styles.resolvedChip,
        escalated && styles.escalatedChip,
      ]}
    >
      <Text
        style={[
          styles.statusText,
          resolved && styles.resolvedTextChip,
          escalated && styles.escalatedTextChip,
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6EBDC' },
  header: {
    backgroundColor: '#102B45',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  backPillText: { color: '#FFEAC7', fontSize: 12, fontWeight: '900' },
  headerTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.72)', marginTop: 4, fontSize: 13, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 36 },
  summaryCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  summaryValue: { color: '#102B45', fontSize: 28, fontWeight: '900' },
  summaryLabel: { color: '#8A8178', fontSize: 12, fontWeight: '800' },
  loadingCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: { color: '#8A8178', fontWeight: '700' },
  emptyCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { color: '#102B45', fontSize: 16, fontWeight: '900' },
  alertCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 10,
  },
  alertTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: { color: '#102B45', fontSize: 14, fontWeight: '900' },
  alertMeta: {
    color: '#8A8178',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  alertDesc: { color: '#6B3F20', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  actionBox: { backgroundColor: '#FFF3E8', borderRadius: 16, padding: 11 },
  actionLabel: { color: '#C95F18', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  actionText: { color: '#102B45', fontSize: 12, fontWeight: '700', marginTop: 4, lineHeight: 17 },
  statusChip: {
    backgroundColor: '#FEE2E2',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: { color: '#B91C1C', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  resolvedChip: { backgroundColor: '#DCFCE7' },
  resolvedTextChip: { color: '#166534' },
  escalatedChip: { backgroundColor: '#FFEDD5' },
  escalatedTextChip: { color: '#C2410C' },
  resolvedBox: { backgroundColor: '#DCFCE7', borderRadius: 16, padding: 11 },
  resolvedLabel: { color: '#166534', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  resolvedText: { color: '#166534', fontSize: 12, fontWeight: '700', marginTop: 4 },
  escalatedBox: { backgroundColor: '#FEE2E2', borderRadius: 16, padding: 11 },
  escalatedLabel: { color: '#B91C1C', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  escalatedText: { color: '#7F1D1D', fontSize: 12, fontWeight: '700', marginTop: 4 },
});
