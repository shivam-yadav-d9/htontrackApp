import React, { useEffect, useState } from 'react';
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
import { CheckCircle, FileText, XCircle } from 'lucide-react-native';

import { managerService, type AssignmentSubmission, type PendingDocument, type CorrectionRequest } from '@/services/manager.service';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';
import { FormErrorText, CharacterCounter, ConfirmationModal } from '@/components/forms';
import { validators } from '@/utils/validators';
import { timeAgo } from '@/utils/timeAgo';

type TabKey = 'assignments' | 'documents' | 'corrections';

function slaColor(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const days = ms / 86_400_000;
  if (days > 3) return '#DC2626';
  if (days > 1) return '#D97706';
  return '#059669';
}

const REASON_MAX = 500;

export default function ApprovalsScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('assignments');
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectType, setRejectType] = useState<'submission' | 'document' | 'correction'>('submission');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approveType, setApproveType] = useState<'submission' | 'document' | 'correction'>('submission');

  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [subs, docs, corrs] = await Promise.allSettled([
        managerService.getSubmissions(),
        managerService.getPendingDocuments(),
        managerService.getCorrectionRequests(),
      ]);
      if (subs.status === 'fulfilled') setSubmissions(subs.value.filter((s) => s.status === 'submitted'));
      if (docs.status === 'fulfilled') setDocuments(docs.value);
      if (corrs.status === 'fulfilled') setCorrections(corrs.value);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() { setRefreshing(true); await loadData(); }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  }

  function startApprove(id: string, type: 'submission' | 'document') {
    setApprovingId(id);
    setApproveType(type);
  }

  async function handleConfirmedApprove() {
    if (!approvingId) return;
    setApprovingId(null);
    setActionLoading(true);
    try {
      if (approveType === 'submission') {
        await managerService.approveSubmission(approvingId);
        setSubmissions((prev) => prev.filter((s) => s.id !== approvingId));
        showToast('Assignment submission approved.');
      } else if (approveType === 'document') {
        await managerService.approveDocument(approvingId);
        setDocuments((prev) => prev.filter((d) => d.id !== approvingId));
        showToast('Document approved.');
      } else {
        await managerService.approveCorrectionRequest(approvingId);
        setCorrections((prev) => prev.filter((c) => c.id !== approvingId));
        showToast('Correction request approved.');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to approve.');
    } finally {
      setActionLoading(false);
    }
  }

  function startReject(id: string, type: 'submission' | 'document') {
    setRejectingId(id);
    setRejectType(type);
    setRejectReason('');
    setRejectError('');
  }

  async function handleConfirmReject() {
    const err = validators.required(rejectReason) ||
      validators.minLength(rejectReason.trim(), 5) ||
      validators.maxLength(rejectReason.trim(), REASON_MAX);
    if (err) { setRejectError(err); return; }
    if (!rejectingId) return;

    setActionLoading(true);
    try {
      if (rejectType === 'submission') {
        await managerService.rejectSubmission(rejectingId, rejectReason.trim());
        setSubmissions((prev) => prev.filter((s) => s.id !== rejectingId));
      } else if (rejectType === 'document') {
        await managerService.rejectDocument(rejectingId, rejectReason.trim());
        setDocuments((prev) => prev.filter((d) => d.id !== rejectingId));
      } else {
        await managerService.rejectCorrectionRequest(rejectingId, rejectReason.trim());
        setCorrections((prev) => prev.filter((c) => c.id !== rejectingId));
      }
      setRejectingId(null);
      setRejectReason('');
      showToast('Item rejected with reason.');
    } catch (err) {
      setRejectError(err instanceof Error ? err.message : 'Failed to reject.');
    } finally {
      setActionLoading(false);
    }
  }

  const approvingItem = approvingId
    ? approveType === 'submission'
      ? submissions.find((s) => s.id === approvingId)
      : approveType === 'document'
        ? documents.find((d) => d.id === approvingId)
        : corrections.find((c) => c.id === approvingId)
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Approvals</Text>
      </View>

      {/* Toast */}
      {toastMsg ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      ) : null}

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'assignments' && styles.tabActive]}
          onPress={() => setActiveTab('assignments')}
        >
          <Text style={[styles.tabText, activeTab === 'assignments' && styles.tabTextActive]}>
            Assign ({submissions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'documents' && styles.tabActive]}
          onPress={() => setActiveTab('documents')}
        >
          <Text style={[styles.tabText, activeTab === 'documents' && styles.tabTextActive]}>
            Docs ({documents.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'corrections' && styles.tabActive]}
          onPress={() => setActiveTab('corrections')}
        >
          <Text style={[styles.tabText, activeTab === 'corrections' && styles.tabTextActive]}>
            Corrections ({corrections.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reject inline panel */}
      {rejectingId ? (
        <View style={styles.rejectPanel}>
          <Text style={styles.rejectTitle}>Reason for Rejection</Text>
          <TextInput
            style={[styles.rejectInput, rejectError ? styles.rejectInputError : null]}
            placeholder="Explain why this is being rejected (min 5 chars)..."
            placeholderTextColor="#9CA3AF"
            multiline
            value={rejectReason}
            onChangeText={(v) => { setRejectReason(v); setRejectError(''); }}
            maxLength={REASON_MAX}
            textAlignVertical="top"
          />
          <View style={styles.rejectFooter}>
            <FormErrorText error={rejectError} />
            <CharacterCounter current={rejectReason.length} max={REASON_MAX} />
          </View>
          <View style={styles.rejectActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => { setRejectingId(null); setRejectReason(''); setRejectError(''); }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmRejectBtn, actionLoading && styles.btnDisabled]}
              onPress={handleConfirmReject}
              disabled={actionLoading}
            >
              {actionLoading
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.confirmRejectBtnText}>Confirm Reject</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={COLORS.orange} size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.orange]} />}
        >
          {activeTab === 'assignments' ? (
            submissions.length === 0 ? (
              <View style={styles.emptyBox}>
                <CheckCircle size={48} color={COLORS.success} />
                <Text style={styles.emptyTitle}>All Clear!</Text>
                <Text style={styles.emptySub}>No pending assignment submissions.</Text>
              </View>
            ) : (
              submissions.map((sub) => (
                <View key={sub.id} style={[styles.card, Shadow.card]}>
                  <Text style={styles.cardTitle}>{sub.assignment_title}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.cardStaff}>By: {sub.staff_name}</Text>
                    <View style={[styles.slaBadge, { backgroundColor: slaColor(sub.submitted_at) + '18', borderColor: slaColor(sub.submitted_at) }]}>
                      <Text style={[styles.slaText, { color: slaColor(sub.submitted_at) }]}>
                        {timeAgo(sub.submitted_at)}
                      </Text>
                    </View>
                  </View>
                  {sub.comment ? (
                    <View style={styles.commentBox}>
                      <Text style={styles.cardComment} numberOfLines={3}>"{sub.comment}"</Text>
                    </View>
                  ) : null}
                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={[styles.approveBtn, actionLoading && styles.btnDisabled]}
                      onPress={() => startApprove(sub.id, 'submission')}
                      disabled={actionLoading}
                    >
                      <CheckCircle size={15} color="#FFFFFF" />
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => startReject(sub.id, 'submission')}
                    >
                      <XCircle size={15} color="#FFFFFF" />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )
          ) : activeTab === 'documents' ? (
            documents.length === 0 ? (
              <View style={styles.emptyBox}>
                <FileText size={48} color={COLORS.success} />
                <Text style={styles.emptyTitle}>All Clear!</Text>
                <Text style={styles.emptySub}>No pending documents.</Text>
              </View>
            ) : (
              documents.map((doc) => (
                <View key={doc.id} style={[styles.card, Shadow.card]}>
                  <Text style={styles.cardTitle}>{doc.file_name}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.cardStaff}>By: {doc.staff_name}</Text>
                    <View style={[styles.slaBadge, { backgroundColor: slaColor(doc.uploaded_at) + '18', borderColor: slaColor(doc.uploaded_at) }]}>
                      <Text style={[styles.slaText, { color: slaColor(doc.uploaded_at) }]}>
                        {timeAgo(doc.uploaded_at)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.fileTypeBadge}>
                    <Text style={styles.fileTypeText}>{doc.file_type.toUpperCase()}</Text>
                  </View>
                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={[styles.approveBtn, actionLoading && styles.btnDisabled]}
                      onPress={() => startApprove(doc.id, 'document')}
                      disabled={actionLoading}
                    >
                      <CheckCircle size={15} color="#FFFFFF" />
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => startReject(doc.id, 'document')}
                    >
                      <XCircle size={15} color="#FFFFFF" />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )
          ) : (
            corrections.length === 0 ? (
              <View style={styles.emptyBox}>
                <CheckCircle size={48} color={COLORS.success} />
                <Text style={styles.emptyTitle}>All Clear!</Text>
                <Text style={styles.emptySub}>No pending attendance corrections.</Text>
              </View>
            ) : (
              corrections.map((corr) => (
                <View key={corr.id} style={[styles.card, Shadow.card]}>
                  <Text style={styles.cardTitle}>
                    {corr.correction_type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? 'Correction Request'}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.cardStaff}>By: {corr.staff_name ?? corr.user_id}</Text>
                    <View style={[styles.slaBadge, { backgroundColor: slaColor(corr.created_at) + '18', borderColor: slaColor(corr.created_at) }]}>
                      <Text style={[styles.slaText, { color: slaColor(corr.created_at) }]}>
                        {timeAgo(corr.created_at)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.corrDateRow}>
                    <Text style={styles.corrDateLabel}>Date: </Text>
                    <Text style={styles.corrDateVal}>{corr.attendance_date}</Text>
                    {corr.requested_check_in ? <Text style={styles.corrTime}>In: {corr.requested_check_in}</Text> : null}
                    {corr.requested_check_out ? <Text style={styles.corrTime}>Out: {corr.requested_check_out}</Text> : null}
                  </View>
                  <View style={styles.commentBox}>
                    <Text style={styles.cardComment} numberOfLines={3}>"{corr.reason}"</Text>
                  </View>
                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={[styles.approveBtn, actionLoading && styles.btnDisabled]}
                      onPress={() => startApprove(corr.id, 'correction')}
                      disabled={actionLoading}
                    >
                      <CheckCircle size={15} color="#FFFFFF" />
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => startReject(corr.id, 'correction')}
                    >
                      <XCircle size={15} color="#FFFFFF" />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )
          )}
        </ScrollView>
      )}

      <ConfirmationModal
        visible={!!approvingId}
        title={`Approve ${approveType === 'submission' ? 'Submission' : 'Document'}?`}
        message={
          approveType === 'submission'
            ? `"${(approvingItem as AssignmentSubmission)?.assignment_title ?? ''}" by ${(approvingItem as AssignmentSubmission)?.staff_name ?? ''} will be marked as approved.`
            : approveType === 'document'
              ? `"${(approvingItem as PendingDocument)?.file_name ?? ''}" by ${(approvingItem as PendingDocument)?.staff_name ?? ''} will be approved.`
              : `Correction request for ${(approvingItem as CorrectionRequest)?.attendance_date ?? ''} will be approved.`
        }
        confirmLabel="Approve"
        cancelLabel="Cancel"
        variant="success"
        onConfirm={handleConfirmedApprove}
        onCancel={() => setApprovingId(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  header: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  toast: {
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: COLORS.orange },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: COLORS.orange, fontWeight: '800' },
  rejectPanel: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  rejectTitle: { fontSize: 13, fontWeight: '800', color: '#DC2626' },
  rejectInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#111827',
    minHeight: 72,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    textAlignVertical: 'top',
  },
  rejectInputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  rejectFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rejectActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  confirmRejectBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmRejectBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.large,
    padding: 16,
    gap: 6,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardStaff: { fontSize: 13, color: COLORS.blue, fontWeight: '600' },
  slaBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  slaText: { fontSize: 10, fontWeight: '700' },
  commentBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#D1D5DB',
  },
  cardComment: { fontSize: 12, color: '#6B7280', fontStyle: 'italic', lineHeight: 18 },
  fileTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  fileTypeText: { fontSize: 10, fontWeight: '700', color: COLORS.blue },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  approveBtn: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  approveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rejectBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  btnDisabled: { opacity: 0.5 },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  corrDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  corrDateLabel: { fontSize: 12, color: '#6B7280' },
  corrDateVal: { fontSize: 12, fontWeight: '700', color: '#1F2937' },
  corrTime: { fontSize: 11, color: '#374151', backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
});
