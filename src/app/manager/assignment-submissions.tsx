import { router } from 'expo-router';
import {
  CheckCircle,
  ChevronRight,
  ClipboardList,
  Clock,
  Filter,
  Search,
  XCircle,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { assignmentService } from '@/services/assignment.service';
import type { AssignmentSubmission } from '@/types/assignment.types';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

type FilterStatus = 'all' | 'submitted' | 'approved' | 'rejected' | 'revision_required';

const FILTER_TABS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'revision_required', label: 'Revision' },
];

function getStatusStyle(status?: string) {
  switch (status) {
    case 'approved':
      return { bg: '#DCFCE7', text: '#166534' };
    case 'rejected':
      return { bg: '#FEE2E2', text: '#B91C1C' };
    case 'revision_required':
      return { bg: '#FEF3C7', text: '#92400E' };
    case 'submitted':
    case 'pending_review':
    default:
      return { bg: COLORS.blueLight, text: COLORS.blue };
  }
}

function statusLabel(status?: string) {
  switch (status) {
    case 'submitted': return 'Pending Review';
    case 'pending_review': return 'Pending Review';
    case 'approved': return 'Approved';
    case 'rejected': return 'Rejected';
    case 'revision_required': return 'Revision Needed';
    default: return status ?? '—';
  }
}

function priorityColor(priority?: string | null) {
  switch (priority) {
    case 'urgent': return COLORS.error;
    case 'high': return '#D97706';
    case 'medium': return COLORS.blue;
    default: return COLORS.gray;
  }
}

export default function AssignmentSubmissionsScreen() {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const data = await assignmentService.getManagerSubmissions();
      setSubmissions(data);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
  }

  const filtered = useMemo(() => {
    let list = submissions;
    if (activeFilter !== 'all') {
      list = list.filter((s) => {
        if (activeFilter === 'submitted') {
          return s.status === 'submitted' || s.status === 'pending_review';
        }
        return s.status === activeFilter;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.assignment_title?.toLowerCase().includes(q) ||
          s.staff_name?.toLowerCase().includes(q) ||
          s.employee_code?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [submissions, activeFilter, search]);

  const pendingCount = submissions.filter(
    (s) => s.status === 'submitted' || s.status === 'pending_review'
  ).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Assignment Reviews</Text>
          {pendingCount > 0 ? (
            <Text style={styles.headerSub}>{pendingCount} pending review{pendingCount > 1 ? 's' : ''}</Text>
          ) : null}
        </View>
        <Filter size={18} color={COLORS.white} />
      </View>

      <View style={styles.searchBar}>
        <Search size={16} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by assignment or staff name…"
          placeholderTextColor={COLORS.gray}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <XCircle size={16} color={COLORS.gray} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterChip, activeFilter === tab.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Text
              style={[styles.filterChipText, activeFilter === tab.key && styles.filterChipTextActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.orange} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.orange]} />}
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <ClipboardList size={40} color={COLORS.gray} />
              <Text style={styles.emptyText}>No submissions found</Text>
            </View>
          ) : (
            filtered.map((sub) => {
              const statusStyle = getStatusStyle(sub.status);
              const isPending = sub.status === 'submitted' || sub.status === 'pending_review';
              return (
                <TouchableOpacity
                  key={sub.id}
                  style={[styles.card, Shadow.card]}
                  onPress={() =>
                    router.push({
                      pathname: '/manager/assignment-submissions/[submissionId]' as any,
                      params: { submissionId: sub.id },
                    })
                  }
                  activeOpacity={0.78}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.cardLeft}>
                      <Text style={styles.assignmentTitle} numberOfLines={1}>
                        {sub.assignment_title ?? '—'}
                      </Text>
                      <Text style={styles.staffName}>{sub.staff_name ?? '—'}</Text>
                      {sub.employee_code ? (
                        <Text style={styles.employeeCode}>{sub.employee_code}</Text>
                      ) : null}
                    </View>
                    <View style={styles.cardRight}>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        {isPending
                          ? <Clock size={11} color={statusStyle.text} />
                          : sub.status === 'approved'
                          ? <CheckCircle size={11} color={statusStyle.text} />
                          : <XCircle size={11} color={statusStyle.text} />}
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                          {statusLabel(sub.status)}
                        </Text>
                      </View>
                      {sub.assignment_priority ? (
                        <Text style={[styles.priority, { color: priorityColor(sub.assignment_priority) }]}>
                          {sub.assignment_priority.toUpperCase()}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.cardMeta}>
                    <Text style={styles.metaText}>
                      Submitted: {sub.submitted_at
                        ? new Date(sub.submitted_at).toLocaleDateString('en-IN')
                        : sub.created_at
                        ? new Date(sub.created_at).toLocaleDateString('en-IN')
                        : '—'}
                    </Text>
                    {sub.assignment_due_date ? (
                      <Text style={styles.metaText}>
                        Due: {new Date(sub.assignment_due_date).toLocaleDateString('en-IN')}
                      </Text>
                    ) : null}
                  </View>

                  {sub.submission_text || sub.comment ? (
                    <Text style={styles.preview} numberOfLines={2}>
                      "{sub.submission_text ?? sub.comment}"
                    </Text>
                  ) : null}

                  <View style={styles.cardFooter}>
                    <Text style={styles.tapHint}>Tap to review</Text>
                    <ChevronRight size={15} color={COLORS.gray} />
                  </View>
                </TouchableOpacity>
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  backBtn: { paddingVertical: 4 },
  backText: { color: COLORS.white, fontSize: 14 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.white },
  headerSub: { fontSize: 12, color: COLORS.white + 'CC', marginTop: 1 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: Spacing.two,
    gap: Spacing.one,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.black, paddingVertical: 10 },

  filterRow: { flexGrow: 0, marginBottom: Spacing.one },
  filterContent: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  filterChip: {
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: 5,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  filterChipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  filterChipTextActive: { color: COLORS.white },

  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 60, gap: Spacing.two },
  emptyText: { color: COLORS.gray, fontSize: 15 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardTop: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  cardLeft: { flex: 1, gap: 2 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  assignmentTitle: { fontSize: 14, fontWeight: '800', color: COLORS.blue },
  staffName: { fontSize: 13, color: COLORS.brown, fontWeight: '600' },
  employeeCode: { fontSize: 11, color: COLORS.gray },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  priority: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  cardMeta: { flexDirection: 'row', gap: Spacing.three },
  metaText: { fontSize: 11, color: COLORS.gray },

  preview: {
    fontSize: 12,
    color: COLORS.grayDark,
    fontStyle: 'italic',
    backgroundColor: COLORS.beigeLight,
    padding: Spacing.two,
    borderRadius: BorderRadius.small,
  },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  tapHint: { fontSize: 11, color: COLORS.gray, marginRight: 2 },
});
