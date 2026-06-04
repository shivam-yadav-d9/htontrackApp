import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { ArrowLeft, FileUp, Lock } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/theme';
import { assignmentService, type AssignmentSubmission } from '@/services/assignment.service';
import { documentService } from '@/services/document.service';
import { generateIdempotencyKey } from '@/services/api';
import {
  FormErrorText, RequiredLabel, CharacterCounter,
  FilePreviewCard, FormSubmitButton, ConfirmationModal, FormProgress,
} from '@/components/forms';
import { useDraft } from '@/hooks/useDraft';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { validators } from '@/utils/validators';

const COMMENT_MAX = 1000;
const COMMENT_MIN = 10;

interface FileAsset {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

interface DraftData {
  comment: string;
}

const LOCKED_STATUSES = new Set(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED']);

function formStatusLabel(fs: string): string {
  const map: Record<string, string> = {
    SUBMITTED: 'Waiting for manager review',
    UNDER_REVIEW: 'Under review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected — you can resubmit',
    RESUBMITTED: 'Resubmitted — waiting for review',
    CANCELLED: 'Cancelled',
  };
  return map[fs] ?? fs;
}

export default function AssignmentSubmitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [fileAsset, setFileAsset] = useState<FileAsset | null>(null);
  const [fileError, setFileError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<AssignmentSubmission | null>(null);
  const [checkingLock, setCheckingLock] = useState(true);

  const completed = comment.trim().length >= COMMENT_MIN ? 1 : 0;

  const currentData = useCallback<() => DraftData>(
    () => ({ comment }),
    [comment],
  );

  const draft = useDraft<DraftData>(
    { formType: 'assignment_submit', entityId: id },
    currentData,
    (data) => {
      if (data.comment) setComment(data.comment);
    },
  );

  const { markDirty, markClean, confirmDiscard } = useUnsavedChanges();

  useEffect(() => {
    async function checkExistingSubmission() {
      if (!id || id === 'undefined') { setCheckingLock(false); return; }
      try {
        const assignment = await assignmentService.getAssignment(id);
        const lockedStatuses = ['submitted', 'approved', 'under_review'];
        if (lockedStatuses.includes(assignment.status)) {
          const fsMap: Record<string, string> = {
            submitted: 'SUBMITTED',
            under_review: 'UNDER_REVIEW',
            approved: 'APPROVED',
          };
          setExistingSubmission({
            id: 'existing',
            assignment_id: id,
            user_id: '',
            status: assignment.status,
            form_status: fsMap[assignment.status] ?? 'SUBMITTED',
            submitted_at: (assignment as any).updated_at ?? assignment.created_at,
          });
        }
      } catch {
        // Ignore — don't lock on error
      } finally {
        setCheckingLock(false);
      }
    }
    checkExistingSubmission();
  }, [id]);

  async function handlePickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];

      const typeErr = validators.fileType(asset.mimeType);
      if (typeErr) { setFileError(typeErr); return; }
      const sizeErr = validators.fileSize(asset.size);
      if (sizeErr) { setFileError(sizeErr); return; }

      setFileError('');
      setFileAsset({ uri: asset.uri, name: asset.name ?? 'file', size: asset.size, mimeType: asset.mimeType });
      markDirty();
    } catch {
      setFileError('Failed to pick file. Please try again.');
    }
  }

  function handlePressSubmit() {
    const commentTrimmed = comment.trim();
    if (!commentTrimmed) {
      setCommentError('Response is required.');
      return;
    }
    const minErr = validators.minLength(commentTrimmed, COMMENT_MIN);
    if (minErr) { setCommentError(minErr); return; }
    const maxErr = validators.maxLength(commentTrimmed, COMMENT_MAX);
    if (maxErr) { setCommentError(maxErr); return; }

    setCommentError('');
    setShowConfirm(true);
  }

  async function handleConfirmedSubmit() {
    setShowConfirm(false);
    setSubmitting(true);
    draft.stopAutoSave();
    const idempotencyKey = generateIdempotencyKey();
    try {
      let fileUrl: string | undefined;

      if (fileAsset) {
        setUploading(true);
        try {
          const formData = new FormData();
          formData.append('file', {
            uri: fileAsset.uri,
            name: fileAsset.name,
            type: fileAsset.mimeType ?? 'application/octet-stream',
          } as unknown as Blob);
          formData.append('related_entity_type', 'assignment');
          formData.append('related_entity_id', id);
          const doc = await documentService.uploadDocument(formData);
          fileUrl = doc.file_url;
        } finally {
          setUploading(false);
        }
      }

      await assignmentService.submitAssignment(id, {
        comment: comment.trim(),
        file_url: fileUrl,
        idempotency_key: idempotencyKey,
      });

      await draft.discardDraft();
      markClean();
      setSuccess(true);
      setTimeout(() => router.back(), 1400);
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const isBusy = submitting || uploading;
  const isLocked = existingSubmission !== null && LOCKED_STATUSES.has(existingSubmission.form_status);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => confirmDiscard(() => router.back())} style={{ padding: 4 }}>
          <ArrowLeft size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Assignment</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {success ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>Assignment submitted successfully!</Text>
            </View>
          ) : checkingLock ? (
            <ActivityIndicator color={COLORS.orange} style={{ marginTop: 40 }} />
          ) : isLocked ? (
            <View style={styles.lockedBanner}>
              <Lock size={22} color="#6B7280" />
              <View style={{ flex: 1 }}>
                <Text style={styles.lockedTitle}>Form Locked</Text>
                <Text style={styles.lockedMsg}>
                  This assignment has already been submitted.{' '}
                  {formStatusLabel(existingSubmission!.form_status)}.
                  {existingSubmission?.form_status === 'REJECTED'
                    ? ' You can resubmit a new response.'
                    : ' You cannot edit it now.'}
                </Text>
              </View>
            </View>
          ) : (
            <>
              {draft.savedAt ? (
                <View style={styles.draftBanner}>
                  <Text style={styles.draftText}>{draft.savedAt}</Text>
                  <TouchableOpacity onPress={() => { draft.discardDraft(); markClean(); }}>
                    <Text style={styles.draftDiscard}>Discard Draft</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <FormProgress completed={completed} total={1} />

              <View style={styles.card}>
                <RequiredLabel label="Your Response" required />
                <TextInput
                  style={[styles.input, styles.inputMulti, commentError ? styles.inputError : null]}
                  value={comment}
                  onChangeText={(v) => {
                    setComment(v);
                    setCommentError('');
                    markDirty();
                    draft.startAutoSave();
                  }}
                  placeholder="Describe what you did, your findings, or observations..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  maxLength={COMMENT_MAX}
                />
                <View style={styles.fieldFooter}>
                  <FormErrorText error={commentError} />
                  <CharacterCounter current={comment.length} max={COMMENT_MAX} />
                </View>

                <View style={{ marginTop: 16 }}>
                  <Text style={styles.uploadLabel}>Attach Proof File <Text style={styles.optionalTag}>(optional)</Text></Text>
                  <TouchableOpacity
                    style={[styles.uploadBox, fileError ? styles.uploadBoxError : null]}
                    onPress={handlePickFile}
                    activeOpacity={0.75}
                  >
                    <FileUp size={22} color={fileAsset ? COLORS.blue : '#9CA3AF'} />
                    <Text style={[styles.uploadHint, fileAsset ? styles.uploadHintActive : null]}>
                      {fileAsset ? 'Tap to change file' : 'Tap to select PDF or image (max 5 MB)'}
                    </Text>
                  </TouchableOpacity>
                  <FormErrorText error={fileError} />
                </View>

                {fileAsset ? (
                  <FilePreviewCard
                    name={fileAsset.name}
                    size={fileAsset.size}
                    mimeType={fileAsset.mimeType}
                    onRemove={() => { setFileAsset(null); setFileError(''); }}
                  />
                ) : null}

                {uploading ? (
                  <View style={styles.progressRow}>
                    <ActivityIndicator color={COLORS.orange} size="small" />
                    <Text style={styles.progressText}>Uploading file...</Text>
                  </View>
                ) : null}
              </View>

              <FormSubmitButton
                label="Submit Assignment"
                onPress={handlePressSubmit}
                loading={isBusy}
                disabled={isBusy}
              />

              <Text style={styles.hint}>
                Once submitted, your manager will review and provide feedback.
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmationModal
        visible={showConfirm}
        title="Submit Assignment?"
        message="Your response will be sent to your manager for review. You cannot edit it after submission."
        confirmLabel="Submit"
        cancelLabel="Go Back"
        variant="confirm"
        onConfirm={handleConfirmedSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7EFE5' },
  header: {
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  headerTitle: { flex: 1, color: COLORS.white, fontSize: 18, fontWeight: '800' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  successBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  successText: { color: '#065F46', fontWeight: '700', fontSize: 14 },
  draftBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF8EF',
    borderWidth: 1,
    borderColor: '#E87525',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  draftText: { fontSize: 12, color: '#92400E', fontWeight: '500' },
  draftDiscard: { fontSize: 12, color: '#DC2626', fontWeight: '700' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  inputMulti: { minHeight: 120, textAlignVertical: 'top' },
  inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  fieldFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  uploadLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  optionalTag: { fontSize: 12, fontWeight: '400', color: '#9CA3AF' },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFF',
    borderWidth: 1.5,
    borderColor: '#C7D7F5',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 14,
  },
  uploadBoxError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  uploadHint: { fontSize: 13, color: '#9CA3AF', flex: 1 },
  uploadHintActive: { color: '#123C69', fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  progressText: { fontSize: 13, color: COLORS.orange, fontWeight: '600' },
  hint: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
  },
  lockedTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 4 },
  lockedMsg: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
});
