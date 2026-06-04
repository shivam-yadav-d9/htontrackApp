import { router } from 'expo-router';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight, ClipboardList } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ManagerPageHeader } from '@/components/ManagerPageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { checklistService } from '@/services/checklist.service';
import type { ChecklistSubmission } from '@/types/checklist.types';
import { BorderRadius, COLORS, Shadow, Spacing } from '@/constants/theme';

function fmt(iso: string | undefined | null) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function ChecklistResponsesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [submissions, setSubmissions] = useState<ChecklistSubmission[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const data = await checklistService.getManagerChecklistSubmissions();
      setSubmissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Group by checklist title
  const grouped = submissions.reduce<Record<string, ChecklistSubmission[]>>((acc, s) => {
    const key = s.checklist_title ?? s.checklist_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});
  const keys = Object.keys(grouped);

  const totalSubmissions = submissions.length;
  const withIssues = submissions.filter((s) => s.status === 'submitted_with_issues').length;
  const avgCompletion = totalSubmissions > 0
    ? Math.round(submissions.reduce((sum, s) => sum + (s.completion_percentage ?? 0), 0) / totalSubmissions)
    : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ManagerPageHeader title="Checklist Responses" showBack onBack={() => router.back()} />
        <LoadingState message="Loading responses..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ManagerPageHeader title="Checklist Responses" showBack onBack={() => router.back()} />
        <ErrorState message={error} onRetry={() => load()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ManagerPageHeader title="Checklist Responses" showBack onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}>

        {/* Summary */}
        {totalSubmissions > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryVal}>{totalSubmissions}</Text>
                <Text style={styles.summaryLbl}>Total</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={[styles.summaryVal, { color: COLORS.success }]}>
                  {totalSubmissions - withIssues}
                </Text>
                <Text style={styles.summaryLbl}>Passed</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={[styles.summaryVal, { color: COLORS.error }]}>{withIssues}</Text>
                <Text style={styles.summaryLbl}>Issues</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={[styles.summaryVal, { color: COLORS.orange }]}>{avgCompletion}%</Text>
                <Text style={styles.summaryLbl}>Avg</Text>
              </View>
            </View>
            <ProgressBar value={avgCompletion} height={6} color={COLORS.orange} />
          </View>
        )}

        {keys.length === 0 && (
          <View style={styles.emptyState}>
            <ClipboardList size={40} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No Submissions Yet</Text>
            <Text style={styles.emptySubtitle}>
              Staff checklist submissions will appear here once they complete assigned checklists.
            </Text>
          </View>
        )}

        {keys.map((checklistTitle) => {
          const list = grouped[checklistTitle];
          const issueCount = list.filter((s) => s.status === 'submitted_with_issues').length;
          const avgPct = Math.round(list.reduce((s, sub) => s + (sub.completion_percentage ?? 0), 0) / list.length);
          const isOpen = expanded === checklistTitle;

          return (
            <View key={checklistTitle} style={styles.group}>
              <TouchableOpacity
                style={styles.groupHeader}
                onPress={() => setExpanded(isOpen ? null : checklistTitle)}
                activeOpacity={0.8}>
                <View style={styles.groupLeft}>
                  <Text style={styles.groupTitle} numberOfLines={1}>{checklistTitle}</Text>
                  <View style={styles.groupMeta}>
                    <Text style={styles.metaText}>{list.length} submitted</Text>
                    {issueCount > 0 && (
                      <>
                        <Text style={styles.dot}>•</Text>
                        <Text style={[styles.metaText, { color: COLORS.error }]}>
                          {issueCount} issues
                        </Text>
                      </>
                    )}
                    <Text style={styles.dot}>•</Text>
                    <Text style={[styles.metaText, { color: COLORS.orange }]}>{avgPct}% avg</Text>
                  </View>
                  <ProgressBar value={avgPct} height={4} color={avgPct >= 80 ? COLORS.success : COLORS.orange} />
                </View>
                {isOpen ? (
                  <ChevronDown size={18} color={COLORS.gray} />
                ) : (
                  <ChevronRight size={18} color={COLORS.gray} />
                )}
              </TouchableOpacity>

              {isOpen && list.map((sub) => (
                <View key={sub.id} style={styles.subRow}>
                  <View style={styles.subLeft}>
                    {sub.status === 'submitted_with_issues'
                      ? <AlertCircle size={18} color={COLORS.error} />
                      : <CheckCircle2 size={18} color={COLORS.success} />
                    }
                    <View style={styles.subInfo}>
                      <Text style={styles.subName}>{sub.staff_name ?? 'Unknown'}</Text>
                      <Text style={styles.subMeta}>
                        {sub.yes_count}✓ {sub.no_count}✗ {sub.na_count}–
                        {sub.created_at ? ` · ${fmt(sub.created_at)}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.subRight}>
                    <Text style={[
                      styles.subPct,
                      { color: sub.status === 'submitted_with_issues' ? COLORS.error : COLORS.success },
                    ]}>
                      {sub.completion_percentage}%
                    </Text>
                    <View style={[
                      styles.statusChip,
                      sub.status === 'submitted_with_issues' ? styles.chipIssue : styles.chipOk,
                    ]}>
                      <Text style={[
                        styles.statusText,
                        sub.status === 'submitted_with_issues' ? styles.issueText : styles.okText,
                      ]}>
                        {sub.status === 'submitted_with_issues' ? 'ISSUES' : 'OK'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { padding: Spacing.three, gap: Spacing.two },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.two,
    ...Shadow.card,
  },
  summaryRow: { flexDirection: 'row' },
  summaryBox: { flex: 1, alignItems: 'center', gap: 2 },
  summaryVal: { fontSize: 22, fontWeight: '900', color: COLORS.grayDark },
  summaryLbl: { fontSize: 11, color: COLORS.gray },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.two },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.grayDark },
  emptySubtitle: { fontSize: 13, color: COLORS.gray, textAlign: 'center' },
  group: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    ...Shadow.card,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    backgroundColor: COLORS.beigeLight,
    gap: Spacing.two,
  },
  groupLeft: { flex: 1, gap: 4 },
  groupTitle: { fontSize: 14, fontWeight: '800', color: COLORS.grayDark },
  groupMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: COLORS.gray },
  dot: { fontSize: 12, color: COLORS.gray },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  subLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  subInfo: { gap: 1 },
  subName: { fontSize: 13, fontWeight: '700', color: COLORS.grayDark },
  subMeta: { fontSize: 11, color: COLORS.gray },
  subRight: { alignItems: 'flex-end', gap: 4 },
  subPct: { fontSize: 14, fontWeight: '800' },
  statusChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  chipOk: { backgroundColor: '#DCFCE7' },
  chipIssue: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  okText: { color: '#166534' },
  issueText: { color: '#B91C1C' },
});
