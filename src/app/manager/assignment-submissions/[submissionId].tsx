import { router, useLocalSearchParams } from 'expo-router';
import {
  AlertCircle,
  CheckCircle,
  FileText,
  MessageSquare,
  RefreshCw,
  User,
  XCircle,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

function getStatusStyle(status?: string) {
  switch (status) {
    case 'approved': return { bg: '#DCFCE7', text: '#166534' };
    case 'rejected': return { bg: '#FEE2E2', text: '#B91C1C' };
    case 'revision_required': return { bg: '#FEF3C7', text: '#92400E' };
    default: return { bg: COLORS.blueLight, text: COLORS.blue };
  }
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

type ReviewAction = 'approve' | 'reject' | 'revision';

export default function SubmissionReviewScreen() {
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<ReviewAction | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (submissionId) loadSubmission();
  }, [submissionId]);

  async function loadSubmission() {
    try {
      setLoading(true);
      const data = await assignmentService.getManagerSubmissions();
      const found = data.find((s) => s.id === submissionId) ?? null;
      setSubmission(found);
    } catch (err) {
      Alert.alert('Error', 'Failed to load submission.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReview() {
    if (!action || !submission) return;

    const statusMap: Record<ReviewAction, 'approved' | 'rejected' | 'revision_required'> = {
      approve: 'approved',
      reject: 'rejected',
      revision: 'revision_required',
    };

    const status = statusMap[action];

    if ((status === 'rejected' || status === 'revision_required') && !feedback.trim()) {
      Alert.alert('Required', 'Please provide feedback for this decision.');
      return;
    }

    setSubmitting(true);
    try {
      await assignmentService.reviewSubmission(submission.id, {
        status,
        manager_feedback: feedback.trim() || undefined,
      });
      Alert.alert(
        'Done',
        status === 'approved'
          ? 'Submission approved successfully.'
          : status === 'rejected'
          ? 'Submission rejected.'
          : 'Revision requested.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Review failed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Submission</Text>
        </View>
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.orange} />
      </SafeAreaView>
    );
  }

  if (!submission) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Submission</Text>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Submission not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPending = submission.status === 'submitted' || submission.status === 'pending_review';
  const statusStyle = getStatusStyle(submission.status);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Submission</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusBannerText, { color: statusStyle.text }]}>
            {statusLabel(submission.status)}
          </Text>
        </View>

        {/* Assignment Info */}
        <View style={[styles.card, Shadow.card]}>
          <View style={styles.cardTitleRow}>
            <FileText size={16} color={COLORS.blue} />
            <Text style={styles.cardTitle}>Assignment</Text>
          </View>
          <Text style={styles.assignmentTitle}>{submission.assignment_title ?? '—'}</Text>
          <InfoRow label="Priority" value={submission.assignment_priority?.toUpperCase()} />
          <InfoRow
            label="Due Date"
            value={
              submission.assignment_due_date
                ? new Date(submission.assignment_due_date).toDateString()
                : null
            }
          />
          <InfoRow label="Assigned By" value={submission.created_by_name} />
        </View>

        {/* Staff Info */}
        <View style={[styles.card, Shadow.card]}>
          <View style={styles.cardTitleRow}>
            <User size={16} color={COLORS.blue} />
            <Text style={styles.cardTitle}>Staff Details</Text>
          </View>
          <InfoRow label="Name" value={submission.staff_name} />
          <InfoRow label="Email" value={submission.staff_email} />
          <InfoRow label="Employee Code" value={submission.employee_code} />
          <InfoRow label="Store" value={submission.store_name} />
          <InfoRow
            label="Submitted"
            value={
              submission.submitted_at
                ? new Date(submission.submitted_at).toDateString()
                : submission.created_at
                ? new Date(submission.created_at).toDateString()
                : null
            }
          />
        </View>

        {/* Submission Content */}
        <View style={[styles.card, Shadow.card]}>
          <View style={styles.cardTitleRow}>
            <MessageSquare size={16} color={COLORS.blue} />
            <Text style={styles.cardTitle}>Submission</Text>
          </View>
          {submission.submission_text || submission.comment ? (
            <Text style={styles.submissionText}>
              {submission.submission_text ?? submission.comment}
            </Text>
          ) : (
            <Text style={styles.noContent}>No submission text</Text>
          )}
          {submission.remarks ? (
            <View style={styles.remarksBox}>
              <Text style={styles.remarksLabel}>Remarks</Text>
              <Text style={styles.remarksText}>{submission.remarks}</Text>
            </View>
          ) : null}
          {(submission.proof_file_url ?? submission.file_url) ? (
            <View style={styles.fileRow}>
              <FileText size={14} color={COLORS.blue} />
              <Text style={styles.fileName}>
                {submission.proof_file_name ?? 'Attached file'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Existing Feedback (if already reviewed) */}
        {submission.manager_feedback && !isPending ? (
          <View style={[styles.card, Shadow.card]}>
            <View style={styles.cardTitleRow}>
              <MessageSquare size={16} color={COLORS.orange} />
              <Text style={styles.cardTitle}>Manager Feedback</Text>
            </View>
            <Text style={styles.feedbackText}>{submission.manager_feedback}</Text>
            {submission.reviewed_by_name ? (
              <Text style={styles.reviewedBy}>Reviewed by {submission.reviewed_by_name}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Review Actions (only for pending) */}
        {isPending ? (
          <View style={[styles.card, Shadow.card]}>
            <View style={styles.cardTitleRow}>
              <AlertCircle size={16} color={COLORS.blue} />
              <Text style={styles.cardTitle}>Review Decision</Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn, action === 'approve' && styles.actionBtnActive]}
                onPress={() => setAction(action === 'approve' ? null : 'approve')}
              >
                <CheckCircle size={16} color={action === 'approve' ? COLORS.white : COLORS.success} />
                <Text style={[styles.actionBtnText, action === 'approve' && { color: COLORS.white }]}>
                  Approve
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.revisionBtn, action === 'revision' && styles.revisionBtnActive]}
                onPress={() => setAction(action === 'revision' ? null : 'revision')}
              >
                <RefreshCw size={16} color={action === 'revision' ? COLORS.white : '#92400E'} />
                <Text style={[styles.actionBtnText, action === 'revision' && { color: COLORS.white }, { color: action === 'revision' ? COLORS.white : '#92400E' }]}>
                  Revision
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn, action === 'reject' && styles.rejectBtnActive]}
                onPress={() => setAction(action === 'reject' ? null : 'reject')}
              >
                <XCircle size={16} color={action === 'reject' ? COLORS.white : COLORS.error} />
                <Text style={[styles.actionBtnText, action === 'reject' && { color: COLORS.white }, { color: action === 'reject' ? COLORS.white : COLORS.error }]}>
                  Reject
                </Text>
              </TouchableOpacity>
            </View>

            {action && action !== 'approve' ? (
              <View style={styles.feedbackInputWrap}>
                <Text style={styles.feedbackInputLabel}>
                  {action === 'reject' ? 'Rejection reason *' : 'Revision instructions *'}
                </Text>
                <TextInput
                  style={styles.feedbackInput}
                  placeholder={action === 'reject' ? 'Enter reason for rejection…' : 'Describe what needs to be revised…'}
                  placeholderTextColor={COLORS.gray}
                  value={feedback}
                  onChangeText={setFeedback}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            ) : null}

            {action ? (
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleReview}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {action === 'approve' ? 'Confirm Approval' : action === 'reject' ? 'Confirm Rejection' : 'Request Revision'}
                  </Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
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

  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },

  statusBanner: {
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  statusBannerText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  cardTitle: { fontSize: 14, fontWeight: '800', color: COLORS.blue },

  assignmentTitle: { fontSize: 16, fontWeight: '800', color: COLORS.grayDark },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  infoLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
  infoValue: { fontSize: 13, color: COLORS.grayDark, fontWeight: '700', flexShrink: 1, textAlign: 'right' },

  submissionText: {
    fontSize: 14,
    color: COLORS.grayDark,
    lineHeight: 20,
    backgroundColor: COLORS.beigeLight,
    padding: Spacing.two,
    borderRadius: BorderRadius.small,
  },
  noContent: { fontSize: 13, color: COLORS.gray, fontStyle: 'italic' },

  remarksBox: { gap: 2 },
  remarksLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '700', textTransform: 'uppercase' },
  remarksText: { fontSize: 13, color: COLORS.grayDark },

  fileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  fileName: { fontSize: 13, color: COLORS.blue, fontWeight: '600', textDecorationLine: 'underline' },

  feedbackText: { fontSize: 14, color: COLORS.grayDark, lineHeight: 20 },
  reviewedBy: { fontSize: 11, color: COLORS.gray, fontStyle: 'italic' },

  actionButtons: { flexDirection: 'row', gap: Spacing.two },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: Spacing.two,
    borderRadius: BorderRadius.medium,
    borderWidth: 1.5,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
  approveBtn: { borderColor: COLORS.success, backgroundColor: '#F0FDF4' },
  actionBtnActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  revisionBtn: { borderColor: '#D97706', backgroundColor: '#FFFBEB' },
  revisionBtnActive: { backgroundColor: '#D97706', borderColor: '#D97706' },
  rejectBtn: { borderColor: COLORS.error, backgroundColor: '#FFF5F5' },
  rejectBtnActive: { backgroundColor: COLORS.error, borderColor: COLORS.error },

  feedbackInputWrap: { gap: 6 },
  feedbackInputLabel: { fontSize: 12, fontWeight: '700', color: COLORS.grayDark },
  feedbackInput: {
    backgroundColor: COLORS.beigeLight,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: Spacing.two,
    fontSize: 13,
    color: COLORS.black,
    minHeight: 80,
  },

  submitBtn: {
    backgroundColor: COLORS.blue,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },

  notFound: { alignItems: 'center', marginTop: 60 },
  notFoundText: { color: COLORS.gray, fontSize: 15 },
});
