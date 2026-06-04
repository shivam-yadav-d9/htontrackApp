import { router } from 'expo-router';
import { ArrowLeft, FileText, UserRound } from 'lucide-react-native';
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

import { documentService } from '@/services/document.service';
import type { StaffDocument } from '@/types/document.types';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  pending:     { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
  resubmitted: { bg: '#DBEAFE', text: '#1E40AF', label: 'Resubmitted' },
  approved:    { bg: '#DCFCE7', text: '#166534', label: 'Approved' },
  rejected:    { bg: '#FEE2E2', text: '#B91C1C', label: 'Rejected' },
};

function ReviewPanel({
  doc,
  onDone,
}: {
  doc: StaffDocument;
  onDone: (updated: StaffDocument) => void;
}) {
  const [status, setStatus] = useState<'approved' | 'rejected'>('approved');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleReview() {
    if (status === 'rejected' && !remarks.trim()) {
      Alert.alert('Required', 'Please provide manager remarks when rejecting.');
      return;
    }
    setSubmitting(true);
    try {
      const updated = await documentService.reviewDocument(doc.id, {
        status,
        manager_remarks: remarks.trim() || undefined,
      });
      onDone(updated);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Review failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={reviewStyles.panel}>
      <Text style={reviewStyles.panelTitle}>Review Document</Text>
      <View style={reviewStyles.toggleRow}>
        <TouchableOpacity
          style={[reviewStyles.toggle, status === 'approved' && reviewStyles.toggleApprove]}
          onPress={() => setStatus('approved')}
        >
          <Text style={[reviewStyles.toggleText, status === 'approved' && reviewStyles.toggleTextActive]}>
            Approve
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[reviewStyles.toggle, status === 'rejected' && reviewStyles.toggleReject]}
          onPress={() => setStatus('rejected')}
        >
          <Text style={[reviewStyles.toggleText, status === 'rejected' && reviewStyles.toggleTextActive]}>
            Reject
          </Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={reviewStyles.input}
        value={remarks}
        onChangeText={setRemarks}
        placeholder={status === 'rejected' ? 'Rejection reason (required)…' : 'Remarks (optional)…'}
        placeholderTextColor={COLORS.gray}
        multiline
        numberOfLines={3}
      />
      <TouchableOpacity
        style={[reviewStyles.submitBtn, submitting && reviewStyles.btnDisabled]}
        onPress={handleReview}
        disabled={submitting}
      >
        {submitting
          ? <ActivityIndicator size="small" color={COLORS.white} />
          : <Text style={reviewStyles.submitBtnText}>
              {status === 'approved' ? 'Approve Document' : 'Reject Document'}
            </Text>}
      </TouchableOpacity>
    </View>
  );
}

export default function ManagerDocumentApprovalsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [docs, setDocs] = useState<StaffDocument[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { loadDocs(); }, []);

  async function loadDocs() {
    try {
      const data = await documentService.getManagerDocumentApprovals();
      setDocs(data);
    } catch (err) {
      console.log('Document approvals load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadDocs();
  }

  function handleReviewDone(updated: StaffDocument) {
    setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setExpanded(null);
    Alert.alert('Done', `Document ${updated.status === 'approved' ? 'approved' : 'rejected'}.`);
  }

  const pending = docs.filter((d) => d.status === 'pending' || d.status === 'resubmitted');
  const reviewed = docs.filter((d) => d.status === 'approved' || d.status === 'rejected');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Document Approvals</Text>
          <Text style={styles.headerSub}>{pending.length} pending review</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.orange]} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.orange} style={{ marginTop: 20 }} />
        ) : docs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No documents to review.</Text>
          </View>
        ) : (
          <>
            {pending.length > 0 && (
              <Text style={styles.sectionTitle}>Pending Review ({pending.length})</Text>
            )}
            {pending.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                expanded={expanded === doc.id}
                onToggle={() => setExpanded(expanded === doc.id ? null : doc.id)}
                onReviewDone={handleReviewDone}
              />
            ))}

            {reviewed.length > 0 && (
              <Text style={[styles.sectionTitle, { marginTop: Spacing.two }]}>
                Reviewed ({reviewed.length})
              </Text>
            )}
            {reviewed.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                expanded={false}
                onToggle={() => {}}
                onReviewDone={handleReviewDone}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DocCard({
  doc,
  expanded,
  onToggle,
  onReviewDone,
}: {
  doc: StaffDocument;
  expanded: boolean;
  onToggle: () => void;
  onReviewDone: (updated: StaffDocument) => void;
}) {
  const s = STATUS_STYLE[doc.status] ?? STATUS_STYLE.pending;
  const canReview = doc.status === 'pending' || doc.status === 'resubmitted';

  return (
    <View style={[styles.card, Shadow.card]}>
      <TouchableOpacity
        style={styles.cardTop}
        onPress={canReview ? onToggle : undefined}
        activeOpacity={canReview ? 0.7 : 1}
      >
        <View style={styles.avatarBox}>
          <UserRound size={20} color={COLORS.orange} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.staffName}>{doc.staff_name ?? '—'}</Text>
          <Text style={styles.staffMeta}>
            {[doc.employee_code, doc.document_type].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: s.bg }]}>
          <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.fileRow}>
        <FileText size={14} color={COLORS.orange} />
        <Text style={styles.fileName} numberOfLines={1}>{doc.file_name}</Text>
        {doc.file_type ? (
          <Text style={styles.fileType}>{doc.file_type.toUpperCase()}</Text>
        ) : null}
        {doc.file_size_mb ? (
          <Text style={styles.fileMeta}>{doc.file_size_mb} MB</Text>
        ) : null}
      </View>

      {doc.remarks ? (
        <Text style={styles.remarks}>Staff note: {doc.remarks}</Text>
      ) : null}

      {doc.expiry_date ? (
        <Text style={styles.remarks}>Expires: {doc.expiry_date}</Text>
      ) : null}

      {doc.manager_remarks ? (
        <View style={styles.managerNote}>
          <Text style={styles.managerNoteLabel}>Your Remarks</Text>
          <Text style={styles.managerNoteText}>{doc.manager_remarks}</Text>
        </View>
      ) : null}

      {doc.created_at ? (
        <Text style={styles.dateText}>
          Submitted {new Date(doc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
      ) : null}

      {canReview && expanded && (
        <ReviewPanel doc={doc} onDone={onReviewDone} />
      )}

      {canReview && !expanded && (
        <TouchableOpacity style={styles.reviewBtn} onPress={onToggle}>
          <Text style={styles.reviewBtnText}>Review</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  header: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 12, color: COLORS.white + 'CC', marginTop: 1 },

  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.blue },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: COLORS.gray, fontSize: 14 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.medium,
    backgroundColor: COLORS.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffName: { fontSize: 14, fontWeight: '800', color: COLORS.blue },
  staffMeta: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  statusChip: { borderRadius: BorderRadius.pill, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  fileName: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.grayDark },
  fileType: {
    backgroundColor: COLORS.beigeLight,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.brown,
  },
  fileMeta: { fontSize: 11, color: COLORS.gray },

  remarks: { fontSize: 12, color: COLORS.grayDark },
  dateText: { fontSize: 11, color: COLORS.gray, marginTop: 2 },

  managerNote: {
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.small,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
    padding: 10,
    gap: 2,
    marginTop: 4,
  },
  managerNoteLabel: { fontSize: 10, fontWeight: '800', color: COLORS.success, textTransform: 'uppercase' },
  managerNoteText: { fontSize: 12, color: '#14532D', lineHeight: 18 },

  reviewBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.blue,
    borderRadius: BorderRadius.medium,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  reviewBtnText: { color: COLORS.blue, fontWeight: '800', fontSize: 13 },
});

const reviewStyles = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.beigeLight,
    borderRadius: BorderRadius.medium,
    padding: Spacing.two,
    gap: Spacing.one,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  panelTitle: { fontSize: 13, fontWeight: '800', color: COLORS.blue },
  toggleRow: { flexDirection: 'row', gap: Spacing.one },
  toggle: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  toggleApprove: { borderColor: COLORS.success, backgroundColor: '#DCFCE7' },
  toggleReject: { borderColor: '#DC2626', backgroundColor: '#FEE2E2' },
  toggleText: { fontSize: 13, fontWeight: '700', color: COLORS.gray },
  toggleTextActive: { color: COLORS.blue },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.black,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  submitBtn: {
    borderRadius: BorderRadius.medium,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: COLORS.blue,
    minHeight: 44,
  },
  btnDisabled: { opacity: 0.5 },
  submitBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
});
