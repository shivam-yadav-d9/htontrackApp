import { router } from 'expo-router';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { performanceAlertService } from '@/services/performance-alert.service';
import type { PerformanceAlert, PerformanceAlertSummary } from '@/types/performance-alert.types';

export default function ManagerPerformanceAlertsScreen() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<PerformanceAlertSummary | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  useEffect(() => { loadAlerts(); }, []);

  async function loadAlerts() {
    try {
      setLoading(true);
      const data = await performanceAlertService.getManagerAlerts();
      setSummary(data.summary);
      setAlerts(data.alerts);
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

  async function generateAlerts() {
    try {
      setGenerating(true);
      const response = await performanceAlertService.generateAlerts();
      await loadAlerts();
      Alert.alert('Alerts Generated', `${response.generated_count} new alert(s) created.`);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to generate alerts.');
    } finally {
      setGenerating(false);
    }
  }

  async function resolveAlert(item: PerformanceAlert) {
    const note = notesById[item.id] ?? '';
    if (note.trim().length < 3) {
      Alert.alert('Resolution Note Required', 'Please enter a resolution note.');
      return;
    }
    try {
      await performanceAlertService.resolveAlert(item.id, { resolution_note: note.trim() });
      await loadAlerts();
      Alert.alert('Resolved', 'Performance alert resolved.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to resolve alert.');
    }
  }

  async function escalateAlert(item: PerformanceAlert) {
    const note = notesById[item.id] ?? '';
    if (note.trim().length < 3) {
      Alert.alert('Escalation Note Required', 'Please enter an escalation note.');
      return;
    }
    try {
      await performanceAlertService.escalateAlert(item.id, {
        escalation_note: note.trim(),
        escalated_to: 'Regional Manager',
      });
      await loadAlerts();
      Alert.alert('Escalated', 'Performance alert escalated.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to escalate alert.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Performance Alerts</Text>
        <Text style={styles.headerSub}>Detect and act on low performance risks</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {summary ? (
          <View style={styles.summaryGrid}>
            <SummaryCard label="Total" value={summary.total} />
            <SummaryCard label="Open" value={summary.open} />
            <SummaryCard label="Critical" value={summary.critical} />
            <SummaryCard label="Escalated" value={summary.escalated} />
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.generateButton, generating && { opacity: 0.6 }]}
          onPress={generateAlerts}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <RefreshCw size={18} color="#FFFFFF" />
              <Text style={styles.generateText}>Generate Performance Alerts</Text>
            </>
          )}
        </TouchableOpacity>

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
          alerts.map((item) => {
            const finalStatus = item.status === 'resolved';
            return (
              <View key={item.id} style={styles.alertCard}>
                <View style={styles.alertTop}>
                  <View style={styles.iconBox}>
                    <AlertTriangle size={20} color="#C95F18" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertTitle}>{item.title}</Text>
                    <Text style={styles.alertMeta}>
                      {item.staff_name} · {item.alert_type.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <SeverityChip severity={item.severity} />
                </View>

                <Text style={styles.alertDesc}>{item.description}</Text>

                <View style={styles.actionBox}>
                  <Text style={styles.actionLabel}>Recommended Action</Text>
                  <Text style={styles.actionText}>{item.recommended_action}</Text>
                </View>

                <StatusBox item={item} />

                {!finalStatus ? (
                  <>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={notesById[item.id] ?? ''}
                      onChangeText={(value) =>
                        setNotesById((prev) => ({ ...prev, [item.id]: value }))
                      }
                      placeholder="Resolution / escalation note..."
                      placeholderTextColor="#8A8178"
                      multiline
                      textAlignVertical="top"
                    />
                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={styles.resolveButton}
                        onPress={() => resolveAlert(item)}
                      >
                        <Text style={styles.buttonText}>Resolve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.escalateButton}
                        onPress={() => escalateAlert(item)}
                      >
                        <Text style={styles.buttonText}>Escalate</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : null}
              </View>
            );
          })
        )}

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function SeverityChip({ severity }: { severity: string }) {
  const critical = severity === 'critical';
  const high = severity === 'high';
  return (
    <View style={[styles.severityChip, critical && styles.criticalChip, high && styles.highChip]}>
      <Text
        style={[
          styles.severityText,
          critical && styles.criticalText,
          high && styles.highText,
        ]}
      >
        {severity}
      </Text>
    </View>
  );
}

function StatusBox({ item }: { item: PerformanceAlert }) {
  if (item.status === 'resolved') {
    return (
      <View style={styles.resolvedBox}>
        <Text style={styles.resolvedLabel}>Resolved</Text>
        <Text style={styles.resolvedText}>{item.resolution_note}</Text>
      </View>
    );
  }
  if (item.status === 'escalated') {
    return (
      <View style={styles.escalatedBox}>
        <Text style={styles.escalatedLabel}>Escalated to {item.escalated_to}</Text>
        <Text style={styles.escalatedText}>{item.escalation_note}</Text>
      </View>
    );
  }
  return null;
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
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: {
    width: '48%',
    backgroundColor: '#FFFDF8',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAD7C2',
  },
  summaryValue: { color: '#102B45', fontSize: 26, fontWeight: '900' },
  summaryLabel: { color: '#8A8178', fontSize: 11, fontWeight: '800', marginTop: 3 },
  generateButton: {
    backgroundColor: '#C95F18',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  generateText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
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
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: '#102B45',
    fontWeight: '700',
  },
  textArea: { minHeight: 82 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  resolveButton: {
    flex: 1,
    backgroundColor: '#166534',
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: 'center',
  },
  escalateButton: {
    flex: 1,
    backgroundColor: '#B91C1C',
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  severityChip: {
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  severityText: { color: '#1D4ED8', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  highChip: { backgroundColor: '#FFEDD5' },
  highText: { color: '#C2410C' },
  criticalChip: { backgroundColor: '#FEE2E2' },
  criticalText: { color: '#B91C1C' },
  resolvedBox: { backgroundColor: '#DCFCE7', borderRadius: 16, padding: 11 },
  resolvedLabel: { color: '#166534', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  resolvedText: { color: '#166534', fontSize: 12, fontWeight: '700', marginTop: 4 },
  escalatedBox: { backgroundColor: '#FEE2E2', borderRadius: 16, padding: 11 },
  escalatedLabel: { color: '#B91C1C', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  escalatedText: { color: '#7F1D1D', fontSize: 12, fontWeight: '700', marginTop: 4 },
});
