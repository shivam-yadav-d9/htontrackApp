import { router } from 'expo-router';
import { BarChart3, Download, UserRound } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { reportService } from '@/services/report.service';
import type { StaffPerformanceReport, StoreSummaryReport } from '@/types/report.types';

export default function ManagerReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [storeReport, setStoreReport] = useState<StoreSummaryReport | null>(null);
  const [staffReports, setStaffReports] = useState<StaffPerformanceReport[]>([]);

  useEffect(() => { loadReports(); }, []);

  async function loadReports() {
    try {
      setLoading(true);
      const [storeData, staffData] = await Promise.all([
        reportService.getStoreSummary(),
        reportService.getStaffSummary(),
      ]);
      setStoreReport(storeData as StoreSummaryReport);
      setStaffReports(staffData as StaffPerformanceReport[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    try { setRefreshing(true); await loadReports(); } finally { setRefreshing(false); }
  }

  async function exportReport() {
    try {
      setExporting(true);
      const data = await reportService.exportStoreReport() as any;
      Alert.alert(
        'Export Ready',
        `CSV-ready data generated with ${data.rows?.length ?? 0} row(s). Connect this to CSV/PDF generation later.`,
      );
    } catch (err) {
      Alert.alert('Export Error', err instanceof Error ? err.message : 'Unable to export report.');
    } finally {
      setExporting(false);
    }
  }

  const summary = (storeReport as any)?.summary;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
        <Text style={styles.headerSub}>Store analytics and staff performance overview</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {summary ? (
          <View style={styles.summaryGrid}>
            <SummaryCard label="Staff" value={summary.total_staff} />
            <SummaryCard label="Health" value={summary.average_health_score} suffix="%" />
            <SummaryCard label="High Risk" value={summary.high_risk_staff} />
            <SummaryCard label="Open Alerts" value={summary.open_performance_alerts} />
            <SummaryCard label="Training" value={summary.course_completion} suffix="%" />
            <SummaryCard label="Targets" value={summary.target_progress} suffix="%" />
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.exportButton, exporting && { opacity: 0.6 }]}
          onPress={exportReport}
          disabled={exporting}
        >
          {exporting ? <ActivityIndicator color="#FFFFFF" /> : (
            <>
              <Download size={18} color="#FFFFFF" />
              <Text style={styles.exportText}>Export CSV-ready Report</Text>
            </>
          )}
        </TouchableOpacity>

        {(storeReport as any)?.risk_staff?.length ? (
          <View style={styles.alertCard}>
            <BarChart3 size={22} color="#C95F18" />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Risk Attention Needed</Text>
              <Text style={styles.alertText}>
                {(storeReport as any).risk_staff.length} staff member(s) are marked high or critical risk.
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Staff Performance</Text>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#C95F18" />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        ) : staffReports.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No staff report data</Text>
          </View>
        ) : (
          staffReports.map((report) => (
            <TouchableOpacity
              key={report.staff.id}
              style={styles.staffCard}
              onPress={() =>
                router.push({
                  pathname: '/manager/staff-report' as any,
                  params: { staffId: report.staff.id },
                })
              }
              activeOpacity={0.8}
            >
              <View style={styles.staffTop}>
                <View style={styles.iconBox}>
                  <UserRound size={20} color="#C95F18" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.staffName}>{report.staff.full_name}</Text>
                  <Text style={styles.staffMeta}>
                    {report.staff.employee_code} · {report.overall.risk_level} risk
                  </Text>
                </View>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreText}>{report.overall.health_score}%</Text>
                  <Text style={styles.scoreLabel}>health</Text>
                </View>
              </View>

              <View style={styles.metricsRow}>
                <Metric label="Course" value={`${report.courses.completion_percentage}%`} />
                <Metric label="Quiz" value={`${report.quizzes.average_score}%`} />
                <Metric label="Target" value={`${report.targets.average_progress}%`} />
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}{suffix ?? ''}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6EBDC' },
  header: {
    backgroundColor: '#102B45',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.72)', marginTop: 4, fontSize: 13, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 36 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: {
    width: '31.5%',
    backgroundColor: '#FFFDF8',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAD7C2',
  },
  summaryValue: { color: '#102B45', fontSize: 22, fontWeight: '900' },
  summaryLabel: { color: '#8A8178', fontSize: 10, fontWeight: '800', marginTop: 3 },
  exportButton: {
    backgroundColor: '#C95F18',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  exportText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  alertCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertTitle: { color: '#102B45', fontSize: 14, fontWeight: '900' },
  alertText: { color: '#6B3F20', fontSize: 12, fontWeight: '700', marginTop: 3 },
  sectionTitle: { color: '#102B45', fontSize: 17, fontWeight: '900' },
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
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: { color: '#102B45', fontWeight: '900' },
  staffCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 12,
  },
  staffTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  iconBox: {
    width: 44, height: 44, borderRadius: 16,
    backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center',
  },
  staffName: { color: '#102B45', fontSize: 14, fontWeight: '900' },
  staffMeta: { color: '#8A8178', fontSize: 11, fontWeight: '800', marginTop: 2, textTransform: 'capitalize' },
  scoreBox: { alignItems: 'flex-end' },
  scoreText: { color: '#102B45', fontSize: 22, fontWeight: '900' },
  scoreLabel: { color: '#8A8178', fontSize: 10, fontWeight: '800' },
  metricsRow: { flexDirection: 'row', gap: 8 },
  metricBox: { flex: 1, backgroundColor: '#FFF3E8', borderRadius: 16, padding: 10 },
  metricValue: { color: '#102B45', fontSize: 14, fontWeight: '900' },
  metricLabel: { color: '#8A8178', fontSize: 10, fontWeight: '800', marginTop: 2 },
});
