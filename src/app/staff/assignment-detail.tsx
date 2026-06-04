import { router, useLocalSearchParams } from 'expo-router';
import {
  AlertCircle, Calendar, CheckCircle2, Clock, ExternalLink,
  FileText, Image, Link, MessageSquare, RotateCcw, Send, Star,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ManagerPageHeader } from '@/components/ManagerPageHeader';
import { assignmentService } from '@/services/assignment.service';
import { BorderRadius, COLORS, Shadow, Spacing } from '@/constants/theme';

type Template = {
  title: string;
  description?: string;
  assignment_type?: string;
  priority?: string;
  difficulty?: string;
  estimated_minutes?: number;
  max_marks?: number;
  pass_marks?: number;
  requires_text_response: boolean;
  requires_file: boolean;
  requires_photo: boolean;
  requires_link: boolean;
};

type AssignmentInstance = {
  id: string;
  template_title: string;
  due_date: string;
  assigned_date?: string;
  status: string;
  submission_status?: string;
  review_status?: string | null;
  marks_awarded?: number | null;
  result?: string | null;
  manager_remarks?: string | null;
  manager_name?: string;
};

type Submission = {
  text_response?: string | null;
  file_url?: string | null;
  photo_url?: string | null;
  link_url?: string | null;
  submitted_at?: string;
};

type Review = {
  review_status?: string;
  marks_awarded?: number | null;
  max_marks?: number;
  pass_marks?: number;
  result?: string | null;
  manager_remarks?: string | null;
  manager_name?: string;
  reviewed_at?: string;
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: '#B91C1C', high: '#D97706', medium: '#2563EB', low: '#6B7280',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  assigned:         { label: 'Pending',    color: '#1D4ED8', bg: '#DBEAFE' },
  submitted:        { label: 'Submitted',  color: '#92400E', bg: '#FEF3C7' },
  reviewed:         { label: 'Reviewed',   color: '#166534', bg: '#DCFCE7' },
  rejected:         { label: 'Rejected',   color: '#B91C1C', bg: '#FEE2E2' },
  needs_correction: { label: 'Needs Fix',  color: '#92400E', bg: '#FEF3C7' },
};

export default function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [assignment, setAssignment] = useState<AssignmentInstance | null>(null);
  const [template, setTemplate]     = useState<Template | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [review, setReview]         = useState<Review | null>(null);

  const [textResponse, setTextResponse] = useState('');
  const [fileUrl, setFileUrl]           = useState('');
  const [photoUrl, setPhotoUrl]         = useState('');
  const [linkUrl, setLinkUrl]           = useState('');

  const load = useCallback(async () => {
    if (!id || id === 'undefined') return;
    setLoading(true);
    setError('');
    try {
      const detail = await assignmentService.getRoleAssignmentDetail(id);
      setAssignment(detail.assignment);
      setTemplate(detail.template);
      if (detail.submission) {
        setSubmission(detail.submission);
        setTextResponse(detail.submission.text_response ?? '');
        setFileUrl(detail.submission.file_url ?? '');
        setPhotoUrl(detail.submission.photo_url ?? '');
        setLinkUrl(detail.submission.link_url ?? '');
      }
      if (detail.review) setReview(detail.review);
    } catch {
      // fall back to legacy
      try {
        const legacy = await assignmentService.getAssignment(id);
        setAssignment(legacy as unknown as AssignmentInstance);
        setTemplate({ title: (legacy as any).title, description: (legacy as any).description, requires_text_response: true, requires_file: false, requires_photo: false, requires_link: false });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assignment');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit() {
    if (!template) return;
    if (template.requires_text_response && !textResponse.trim()) {
      Alert.alert('Required', 'Please enter a text response.');
      return;
    }
    if (template.requires_file && !fileUrl.trim()) {
      Alert.alert('Required', 'Please provide a file URL.');
      return;
    }
    if (template.requires_photo && !photoUrl.trim()) {
      Alert.alert('Required', 'Please provide a photo URL.');
      return;
    }
    if (template.requires_link && !linkUrl.trim()) {
      Alert.alert('Required', 'Please provide a link.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await assignmentService.submitRoleAssignment(id, {
        text_response: textResponse.trim() || undefined,
        file_url: fileUrl.trim() || undefined,
        photo_url: photoUrl.trim() || undefined,
        link_url: linkUrl.trim() || undefined,
      });
      setAssignment(result.assignment);
      setSubmission(result.submission);
      Alert.alert('Submitted!', 'Your assignment has been submitted for review.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ManagerPageHeader title="Assignment" showBack onBack={() => router.back()} />
        <LoadingState message="Loading assignment..." />
      </SafeAreaView>
    );
  }

  if (error || !assignment) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ManagerPageHeader title="Assignment" showBack onBack={() => router.back()} />
        <ErrorState message={error || 'Assignment not found'} onRetry={load} />
      </SafeAreaView>
    );
  }

  const statusCfg = STATUS_CONFIG[assignment.status] ?? STATUS_CONFIG.assigned;
  const canSubmit = ['assigned', 'needs_correction'].includes(assignment.status);
  const isSubmitted = ['submitted', 'reviewed', 'rejected'].includes(assignment.status);
  const priorityColor = PRIORITY_COLOR[template?.priority ?? 'medium'] ?? PRIORITY_COLOR.medium;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ManagerPageHeader
        title="Assignment Detail"
        showBack
        onBack={() => router.back()}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Status banner */}
          <View style={[styles.statusBanner, { backgroundColor: statusCfg.bg, borderColor: statusCfg.color + '40' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label.toUpperCase()}</Text>
            {assignment.review_status === 'needs_correction' && (
              <View style={styles.correctionNote}>
                <RotateCcw size={12} color={COLORS.warning} />
                <Text style={styles.correctionText}>Manager requested corrections</Text>
              </View>
            )}
          </View>

          {/* Main info card */}
          <View style={[styles.card, Shadow.card]}>
            <View style={styles.titleRow}>
              <Text style={styles.assignmentTitle}>{assignment.template_title}</Text>
              <View style={[styles.priorityBubble, { backgroundColor: priorityColor + '20' }]}>
                <Text style={[styles.priorityText, { color: priorityColor }]}>
                  {(template?.priority ?? 'medium').toUpperCase()}
                </Text>
              </View>
            </View>

            {template?.description ? (
              <Text style={styles.desc}>{template.description}</Text>
            ) : null}

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Calendar size={13} color={COLORS.gray} />
                <Text style={styles.metaText}>Due: {assignment.due_date}</Text>
              </View>
              {template?.assignment_type && (
                <View style={styles.metaItem}>
                  <FileText size={13} color={COLORS.gray} />
                  <Text style={styles.metaText}>Type: {template.assignment_type.replace(/_/g, ' ')}</Text>
                </View>
              )}
              {template?.estimated_minutes && (
                <View style={styles.metaItem}>
                  <Clock size={13} color={COLORS.gray} />
                  <Text style={styles.metaText}>Est. {template.estimated_minutes} min</Text>
                </View>
              )}
              {template?.max_marks && (
                <View style={styles.metaItem}>
                  <Star size={13} color={COLORS.gray} />
                  <Text style={styles.metaText}>Max: {template.max_marks} marks · Pass: {template.pass_marks}</Text>
                </View>
              )}
            </View>

            {/* Requirements badges */}
            <View style={styles.reqRow}>
              {template?.requires_text_response && <ReqBadge icon={MessageSquare} label="Text" />}
              {template?.requires_file && <ReqBadge icon={FileText} label="File" />}
              {template?.requires_photo && <ReqBadge icon={Image} label="Photo" />}
              {template?.requires_link && <ReqBadge icon={Link} label="Link" />}
            </View>
          </View>

          {/* Manager remarks from review */}
          {assignment.manager_remarks && (
            <View style={styles.remarkCard}>
              <View style={styles.remarkHeader}>
                <MessageSquare size={14} color={COLORS.blue} />
                <Text style={styles.remarkLabel}>Manager Feedback</Text>
              </View>
              <Text style={styles.remarkText}>{assignment.manager_remarks}</Text>
            </View>
          )}

          {/* Review result */}
          {review && (
            <View style={[styles.card, Shadow.card]}>
              <Text style={styles.sectionTitle}>Review Result</Text>
              <View style={styles.reviewRow}>
                {review.result === 'pass' ? (
                  <View style={styles.resultPass}>
                    <CheckCircle2 size={20} color={COLORS.success} />
                    <Text style={styles.resultPassText}>PASSED</Text>
                  </View>
                ) : review.result === 'fail' ? (
                  <View style={styles.resultFail}>
                    <AlertCircle size={20} color={COLORS.error} />
                    <Text style={styles.resultFailText}>FAILED</Text>
                  </View>
                ) : null}
                {review.marks_awarded != null && (
                  <Text style={styles.marksText}>
                    {review.marks_awarded}/{review.max_marks} marks
                  </Text>
                )}
              </View>
              {review.manager_remarks && (
                <Text style={styles.reviewRemarks}>{review.manager_remarks}</Text>
              )}
            </View>
          )}

          {/* Previous submission view */}
          {submission && (
            <View style={[styles.card, Shadow.card]}>
              <Text style={styles.sectionTitle}>Your Submission</Text>
              {submission.text_response && (
                <View style={styles.submissionField}>
                  <Text style={styles.fieldLabel}>Response</Text>
                  <Text style={styles.fieldValue}>{submission.text_response}</Text>
                </View>
              )}
              {submission.file_url && (
                <View style={styles.submissionField}>
                  <FileText size={13} color={COLORS.blue} />
                  <Text style={[styles.fieldValue, { color: COLORS.blue }]} numberOfLines={1}>{submission.file_url}</Text>
                </View>
              )}
              {submission.photo_url && (
                <View style={styles.submissionField}>
                  <Image size={13} color={COLORS.blue} />
                  <Text style={[styles.fieldValue, { color: COLORS.blue }]} numberOfLines={1}>{submission.photo_url}</Text>
                </View>
              )}
              {submission.link_url && (
                <View style={styles.submissionField}>
                  <ExternalLink size={13} color={COLORS.blue} />
                  <Text style={[styles.fieldValue, { color: COLORS.blue }]} numberOfLines={1}>{submission.link_url}</Text>
                </View>
              )}
              {submission.submitted_at && (
                <Text style={styles.submittedAt}>
                  Submitted {new Date(submission.submitted_at).toLocaleString()}
                </Text>
              )}
            </View>
          )}

          {/* Submission form */}
          {canSubmit && template && (
            <View style={[styles.card, Shadow.card]}>
              <Text style={styles.sectionTitle}>
                {assignment.status === 'needs_correction' ? 'Resubmit Assignment' : 'Submit Assignment'}
              </Text>

              {template.requires_text_response && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Response <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Enter your response here..."
                    placeholderTextColor={COLORS.gray}
                    value={textResponse}
                    onChangeText={setTextResponse}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                  />
                </View>
              )}

              {template.requires_file && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    File URL <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://..."
                    placeholderTextColor={COLORS.gray}
                    value={fileUrl}
                    onChangeText={setFileUrl}
                    autoCapitalize="none"
                  />
                </View>
              )}

              {template.requires_photo && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Photo URL <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://..."
                    placeholderTextColor={COLORS.gray}
                    value={photoUrl}
                    onChangeText={setPhotoUrl}
                    autoCapitalize="none"
                  />
                </View>
              )}

              {template.requires_link && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Link <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://..."
                    placeholderTextColor={COLORS.gray}
                    value={linkUrl}
                    onChangeText={setLinkUrl}
                    autoCapitalize="none"
                  />
                </View>
              )}

              <AppButton
                label={submitting ? 'Submitting...' : 'Submit Assignment'}
                onPress={handleSubmit}
                loading={submitting}
              />
            </View>
          )}

          {isSubmitted && !canSubmit && (
            <View style={styles.submittedBanner}>
              <Send size={16} color={COLORS.success} />
              <Text style={styles.submittedBannerText}>
                Assignment submitted. Awaiting manager review.
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ReqBadge({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.reqBadge}>
      <Icon size={11} color={COLORS.blue} />
      <Text style={styles.reqBadgeText}>{label} required</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },

  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: Spacing.two, borderRadius: BorderRadius.medium, borderWidth: 1,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '800' },
  correctionNote: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 4 },
  correctionText: { fontSize: 11, color: COLORS.warning, fontWeight: '600' },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  assignmentTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: COLORS.grayDark, lineHeight: 24 },
  priorityBubble: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexShrink: 0 },
  priorityText: { fontSize: 10, fontWeight: '800' },
  desc: { fontSize: 14, color: COLORS.gray, lineHeight: 20 },
  metaGrid: { gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: COLORS.gray },
  reqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reqBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.blueLight,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  reqBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.blue },

  remarkCard: {
    backgroundColor: COLORS.blueLight,
    borderRadius: BorderRadius.medium,
    padding: Spacing.two,
    gap: 6,
  },
  remarkHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  remarkLabel: { fontSize: 12, fontWeight: '700', color: COLORS.blue },
  remarkText: { fontSize: 13, color: COLORS.blue, lineHeight: 18 },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.grayDark },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultPass: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resultPassText: { fontSize: 14, fontWeight: '800', color: COLORS.success },
  resultFail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resultFailText: { fontSize: 14, fontWeight: '800', color: COLORS.error },
  marksText: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  reviewRemarks: { fontSize: 13, color: COLORS.grayDark, lineHeight: 18 },

  submissionField: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray },
  fieldValue: { fontSize: 13, color: COLORS.grayDark, flex: 1, lineHeight: 18 },
  submittedAt: { fontSize: 11, color: COLORS.gray, fontStyle: 'italic' },

  fieldGroup: { gap: 6 },
  required: { color: COLORS.error },
  textArea: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: BorderRadius.medium,
    padding: Spacing.two, fontSize: 14, color: COLORS.grayDark,
    minHeight: 100, textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: BorderRadius.medium,
    padding: Spacing.two, fontSize: 14, color: COLORS.grayDark, height: 44,
  },

  submittedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#DCFCE7', borderRadius: BorderRadius.medium,
    padding: Spacing.two, borderWidth: 1, borderColor: COLORS.success + '40',
  },
  submittedBannerText: { flex: 1, fontSize: 13, color: COLORS.success, fontWeight: '600' },
});
