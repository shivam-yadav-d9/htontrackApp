import { router, useLocalSearchParams } from 'expo-router';
import { BarChart3, ChevronLeft, UserRound } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { reportService } from '@/services/report.service';
import type { StaffPerformanceReport } from '@/types/report.types';

const RISK_COLORS: Record<string, string> = {
  low: '#166534',
  medium: '#B7791F',
  high: '#C95F18',
  critical: '#B91C1C',
};

const RISK_BG: Record<string, string> = {
  low: '#DCFCE7',
  medium: '#FFF4D8',
  high: '#FFF1E5',
  critical: '#FEE2E2',
};

export default function StaffReportScreen() {
  const { staffId } = useLocalSearchParams<{ staffId: string }>();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<StaffPerformanceReport | null>(null);

  useEffect(() => {
    if (staffId) loadReport();
  }, [staffId]);

  async function loadReport() {
    try {
      setLoading(true);
      const data = await reportService.getSingleStaffReport(staffId);
      setReport(data as StaffPerformanceReport);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  const riskLevel = report?.overall?.risk_level ?? 'low';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.push('/manager/reports' as any)}>
          <ChevronLeft size={16} color="#102B45" />
          <Text style={styles.backText}>Reports</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Report</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#C95F18" />
          <Text style={styles.loadingText}>Loading report...</Text>
        </View>
      ) : !report ? (
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>No data available.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {/* Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <UserRound size={28} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{report.staff.full_name}</Text>
              <Text style={styles.heroMeta}>
                {report.staff.employee_code} · {report.staff.store_name ?? report.staff.store_code}
              </Text>
              <View style={[styles.riskChip, { backgroundColor: RISK_BG[riskLevel] }]}>
                <Text style={[styles.riskText, { color: RISK_COLORS[riskLevel] }]}>
                  {riskLevel.toUpperCase()} RISK
                </Text>
              </View>
            </View>
            <View style={styles.scoreBlock}>
              <Text style={styles.scoreValue}>{report.overall.health_score}%</Text>
              <Text style={styles.scoreLabel}>health</Text>
            </View>
          </View>

          {/* Summary Grid */}
          <View style={styles.summaryGrid}>
            <SummaryCard label="Present" value={report.attendance.present_days} suffix=" days" />
            <SummaryCard label="Late" value={report.attendance.late_days} suffix=" days" />
            <SummaryCard label="Assignments" value={report.assignments.completion_percentage} suffix="%" />
            <SummaryCard label="Courses" value={report.courses.completion_percentage} suffix="%" />
            <SummaryCard label="Quiz Avg" value={report.quizzes.average_score} suffix="%" />
            <SummaryCard label="Targets" value={report.targets.average_progress} suffix="%" />
          </View>

          {/* Learning & Training */}
          <Section title="Learning & Training">
            <Row label="Courses Assigned" value={report.courses.assigned} />
            <Row label="Courses Completed" value={report.courses.completed} />
            <Row label="Course Completion" value={`${report.courses.completion_percentage}%`} />
            <Row label="Quizzes Assigned" value={report.quizzes.assigned} />
            <Row label="Quizzes Attempted" value={report.quizzes.attempted} />
            <Row label="Quizzes Passed" value={report.quizzes.passed} />
            <Row label="Quiz Pass Rate" value={`${report.quizzes.pass_rate}%`} />
            <Row label="Quiz Avg Score" value={`${report.quizzes.average_score}%`} last />
          </Section>

          {/* Operations */}
          <Section title="Operations">
            <Row label="Assignments Assigned" value={report.assignments.assigned} />
            <Row label="Assignments Submitted" value={report.assignments.submitted} />
            <Row label="Assignment Completion" value={`${report.assignments.completion_percentage}%`} />
            <Row label="Checklists Submitted" value={report.checklists.submitted} />
            <Row label="Checklist Issues" value={report.checklists.issue_count} />
            <Row label="Tickets Total" value={report.tickets.total} />
            <Row label="Open Tickets" value={report.tickets.open} />
            <Row label="Documents Submitted" value={report.documents.submitted} />
            <Row label="Documents Rejected" value={report.documents.rejected} last />
          </Section>

          {/* Skills + Performance */}
          <Section title="Skills + Performance">
            <Row label="Skill Ratings" value={report.skills.ratings} />
            <Row label="Avg Skill Score" value={`${report.skills.average_score}%`} />
            <Row label="Low Skill Areas" value={report.skills.low_skill_count} />
            <Row label="Targets Assigned" value={report.targets.assigned} />
            <Row label="Avg Target Progress" value={`${report.targets.average_progress}%`} />
            <Row label="Open Alerts" value={report.performance_alerts.open} />
            <Row label="Total Alerts" value={report.performance_alerts.total} />
            <Row label="Open Coaching Plans" value={report.coaching.open} />
            <Row label="Total Coaching Plans" value={report.coaching.total} last />
          </Section>

          {/* Rewards */}
          <Section title="Rewards">
            <Row label="Reward Points" value={report.rewards.points} />
            <Row label="Rewards Received" value={report.rewards.total} />
            <Row label="Certificates Earned" value={report.rewards.certificates} last />
          </Section>

          <View style={{ height: 36 }} />
        </ScrollView>
      )}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionBox}>
      <View style={styles.sectionHeader}>
        <BarChart3 size={16} color="#C95F18" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({ label, value, last }: { label: string; value: string | number; last?: boolean }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6EBDC' },
  header: {
    backgroundColor: '#102B45',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 10,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  backText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: { color: '#8A8178', fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14 },

  heroCard: {
    backgroundColor: '#102B45',
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  heroMeta: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '700', marginTop: 2 },
  riskChip: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  riskText: { fontSize: 10, fontWeight: '900' },
  scoreBlock: { alignItems: 'flex-end' },
  scoreValue: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  scoreLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '800' },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: {
    width: '31.5%',
    backgroundColor: '#FFFDF8',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAD7C2',
  },
  summaryValue: { color: '#102B45', fontSize: 20, fontWeight: '900' },
  summaryLabel: { color: '#8A8178', fontSize: 10, fontWeight: '800', marginTop: 3 },

  sectionBox: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: '#FFF3E8',
    borderBottomWidth: 1,
    borderBottomColor: '#EAD7C2',
  },
  sectionTitle: { color: '#102B45', fontSize: 14, fontWeight: '900' },
  sectionBody: { padding: 12, gap: 6 },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF3E8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  rowLast: { marginBottom: 0 },
  rowLabel: { color: '#6B3F20', fontSize: 12, fontWeight: '700' },
  rowValue: { color: '#102B45', fontSize: 13, fontWeight: '900' },
});
