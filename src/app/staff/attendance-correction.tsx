import { router } from 'expo-router';
import { ArrowLeft, ClockAlert, Lock } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/theme';
import { attendanceService, type CorrectionRequestOut } from '@/services/attendance.service';
import {
  RequiredLabel, FormErrorText, CharacterCounter,
  FormSubmitButton, ConfirmationModal, FormSelect, FormProgress,
} from '@/components/forms';
import { useDraft } from '@/hooks/useDraft';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { validators } from '@/utils/validators';

const REASON_MIN = 10;
const REASON_MAX = 500;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const CORRECTION_TYPE_OPTIONS = [
  { value: 'forgot_check_in', label: 'Forgot Check-In' },
  { value: 'forgot_check_out', label: 'Forgot Check-Out' },
  { value: 'wrong_location', label: 'Wrong Location' },
  { value: 'network_issue', label: 'Network Issue' },
  { value: 'manager_exception', label: 'Manager Exception' },
];

interface Errors {
  correction_type?: string;
  attendance_date?: string;
  reason?: string;
  requested_check_in?: string;
  requested_check_out?: string;
}

interface DraftData {
  correction_type: string;
  date: string;
  reason: string;
  check_in: string;
  check_out: string;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const LOCKED_STATUSES = new Set(['SUBMITTED', 'UNDER_REVIEW']);

function correctionStatusLabel(fs: string): string {
  const map: Record<string, string> = {
    SUBMITTED: 'Waiting for manager review',
    UNDER_REVIEW: 'Under review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected — you can submit a new request',
    RESUBMITTED: 'Resubmitted — waiting for review',
  };
  return map[fs] ?? fs;
}

export default function AttendanceCorrectionScreen() {
  const [correctionType, setCorrectionType] = useState('');
  const [date, setDate] = useState(todayISO);
  const [reason, setReason] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<CorrectionRequestOut | null>(null);
  const [checkingLock, setCheckingLock] = useState(true);

  const needsCheckIn = correctionType === 'forgot_check_in';
  const needsCheckOut = correctionType === 'forgot_check_out';

  const total = correctionType && (needsCheckIn || needsCheckOut) ? 4 : 3;
  let completed = 0;
  if (correctionType) completed++;
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) completed++;
  if (reason.trim().length >= REASON_MIN) completed++;
  if (needsCheckIn && checkIn.trim() && TIME_REGEX.test(checkIn.trim())) completed++;
  if (needsCheckOut && checkOut.trim() && TIME_REGEX.test(checkOut.trim())) completed++;

  const currentData = useCallback<() => DraftData>(
    () => ({ correction_type: correctionType, date, reason, check_in: checkIn, check_out: checkOut }),
    [correctionType, date, reason, checkIn, checkOut],
  );

  const draft = useDraft<DraftData>(
    { formType: 'attendance_correction' },
    currentData,
    (data) => {
      if (data.correction_type) setCorrectionType(data.correction_type);
      if (data.date) setDate(data.date);
      if (data.reason) setReason(data.reason);
      if (data.check_in) setCheckIn(data.check_in);
      if (data.check_out) setCheckOut(data.check_out);
    },
  );

  const { markDirty, markClean, confirmDiscard } = useUnsavedChanges();

  useEffect(() => {
    async function checkPendingRequest() {
      try {
        const requests = await attendanceService.getCorrectionRequests();
        const pending = requests.find((r) => LOCKED_STATUSES.has(r.form_status));
        if (pending) setPendingRequest(pending);
      } catch {
        // Don't lock on error
      } finally {
        setCheckingLock(false);
      }
    }
    checkPendingRequest();
  }, []);

  const isLocked = pendingRequest !== null;

  function touch(errKey: keyof Errors) {
    setErrors((e) => ({ ...e, [errKey]: undefined }));
    markDirty();
    draft.startAutoSave();
  }

  function validate(): boolean {
    const errs: Errors = {};

    if (!correctionType) {
      errs.correction_type = 'Please select a correction type.';
    }

    if (!date.trim()) {
      errs.attendance_date = 'Date is required.';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      errs.attendance_date = 'Date must be in YYYY-MM-DD format.';
    }

    const reqReason = validators.required(reason);
    if (reqReason) {
      errs.reason = reqReason;
    } else {
      const minErr = validators.minLength(reason.trim(), REASON_MIN);
      if (minErr) errs.reason = minErr;
      else {
        const maxErr = validators.maxLength(reason.trim(), REASON_MAX);
        if (maxErr) errs.reason = maxErr;
      }
    }

    if (needsCheckIn) {
      if (!checkIn.trim()) errs.requested_check_in = 'Check-in time is required for this correction type.';
      else if (!TIME_REGEX.test(checkIn.trim())) errs.requested_check_in = 'Time must be in HH:MM 24-hour format.';
    } else if (checkIn.trim() && !TIME_REGEX.test(checkIn.trim())) {
      errs.requested_check_in = 'Time must be in HH:MM 24-hour format.';
    }

    if (needsCheckOut) {
      if (!checkOut.trim()) errs.requested_check_out = 'Check-out time is required for this correction type.';
      else if (!TIME_REGEX.test(checkOut.trim())) errs.requested_check_out = 'Time must be in HH:MM 24-hour format.';
    } else if (checkOut.trim() && !TIME_REGEX.test(checkOut.trim())) {
      errs.requested_check_out = 'Time must be in HH:MM 24-hour format.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handlePress() {
    if (validate()) setShowConfirm(true);
  }

  async function handleConfirmed() {
    setShowConfirm(false);
    setSubmitting(true);
    draft.stopAutoSave();
    try {
      await attendanceService.submitCorrectionRequest({
        correction_type: correctionType,
        attendance_date: date.trim(),
        reason: reason.trim(),
        requested_check_in: checkIn.trim() || undefined,
        requested_check_out: checkOut.trim() || undefined,
      });
      await draft.discardDraft();
      markClean();
      setSuccess(true);
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      setErrors({ reason: err instanceof Error ? err.message : 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  const correctionLabel = CORRECTION_TYPE_OPTIONS.find((o) => o.value === correctionType)?.label ?? 'Correction';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => confirmDiscard(() => router.back())} style={{ padding: 4 }}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Correction</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {success ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>Request submitted! Your manager will review it shortly.</Text>
            </View>
          ) : checkingLock ? (
            <ActivityIndicator color={COLORS.orange} style={{ marginTop: 40 }} />
          ) : isLocked ? (
            <View style={styles.lockedBanner}>
              <Lock size={22} color="#6B7280" />
              <View style={{ flex: 1 }}>
                <Text style={styles.lockedTitle}>Request Pending</Text>
                <Text style={styles.lockedMsg}>
                  You already have a correction request for {pendingRequest!.attendance_date}.{' '}
                  {correctionStatusLabel(pendingRequest!.form_status)}.
                  {' '}You can submit a new request once the current one is resolved.
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

              <FormProgress completed={completed} total={total} />

              <View style={styles.infoBanner}>
                <ClockAlert size={18} color="#123C69" />
                <Text style={styles.infoText}>
                  Use this form if your attendance was not recorded correctly. Your manager will approve or reject the request.
                </Text>
              </View>

              <View style={styles.card}>
                <FormSelect
                  label="Correction Type"
                  value={correctionType}
                  options={CORRECTION_TYPE_OPTIONS}
                  onSelect={(v) => { setCorrectionType(v); touch('correction_type'); }}
                  placeholder="Select correction type..."
                  error={errors.correction_type}
                  required
                />

                <View style={styles.fieldWrap}>
                  <RequiredLabel label="Attendance Date" required />
                  <TextInput
                    style={[styles.input, errors.attendance_date ? styles.inputError : null]}
                    value={date}
                    onChangeText={(v) => { setDate(v); touch('attendance_date'); }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9CA3AF"
                    maxLength={10}
                  />
                  <FormErrorText error={errors.attendance_date} />
                </View>

                <View style={styles.fieldWrap}>
                  <RequiredLabel label="Reason for Correction" required />
                  <TextInput
                    style={[styles.input, styles.inputMulti, errors.reason ? styles.inputError : null]}
                    value={reason}
                    onChangeText={(v) => { setReason(v); touch('reason'); }}
                    placeholder="Explain why your attendance needs correction (min 10 chars)..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                    maxLength={REASON_MAX}
                  />
                  <View style={styles.fieldFooter}>
                    <FormErrorText error={errors.reason} />
                    <CharacterCounter current={reason.length} max={REASON_MAX} />
                  </View>
                </View>

                <View style={styles.fieldWrap}>
                  <RequiredLabel label="Requested Check-in Time" required={needsCheckIn} />
                  <TextInput
                    style={[styles.input, errors.requested_check_in ? styles.inputError : null]}
                    value={checkIn}
                    onChangeText={(v) => { setCheckIn(v); touch('requested_check_in'); }}
                    placeholder={needsCheckIn ? 'Required — HH:MM (e.g. 09:30)' : 'HH:MM optional (e.g. 09:30)'}
                    placeholderTextColor="#9CA3AF"
                    maxLength={5}
                  />
                  <FormErrorText error={errors.requested_check_in} />
                </View>

                <View style={styles.fieldWrap}>
                  <RequiredLabel label="Requested Check-out Time" required={needsCheckOut} />
                  <TextInput
                    style={[styles.input, errors.requested_check_out ? styles.inputError : null]}
                    value={checkOut}
                    onChangeText={(v) => { setCheckOut(v); touch('requested_check_out'); }}
                    placeholder={needsCheckOut ? 'Required — HH:MM (e.g. 18:00)' : 'HH:MM optional (e.g. 18:00)'}
                    placeholderTextColor="#9CA3AF"
                    maxLength={5}
                  />
                  <FormErrorText error={errors.requested_check_out} />
                </View>
              </View>

              <FormSubmitButton
                label="Submit Correction Request"
                onPress={handlePress}
                loading={submitting}
                disabled={submitting}
              />

              <Text style={styles.footerNote}>
                Your manager will be notified and must approve this request.
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmationModal
        visible={showConfirm}
        title="Submit Correction Request?"
        message={`${correctionLabel} for ${date} will be sent to your manager for approval.`}
        confirmLabel="Submit"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleConfirmed}
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
  headerTitle: { flex: 1, color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  successBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  successText: { color: '#065F46', fontWeight: '700', fontSize: 14, textAlign: 'center' },
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
  infoBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#123C69',
    borderRadius: 10,
    padding: 12,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 13, color: '#1E3A5F', lineHeight: 19 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  fieldWrap: {},
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
  inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  inputMulti: { minHeight: 100, textAlignVertical: 'top' },
  fieldFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  footerNote: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
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
