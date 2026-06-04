import { router } from 'expo-router';
import { ArrowLeft, CalendarDays, Clock, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/theme';
import { shiftService } from '@/services/shift.service';
import { managerService, type StaffMember } from '@/services/manager.service';
import {
  FormErrorText, RequiredLabel, FormSubmitButton, ConfirmationModal,
} from '@/components/forms';
import { validators } from '@/utils/validators';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

interface Errors {
  assigned_to_id?: string;
  shift_date?: string;
  shift_start?: string;
  shift_end?: string;
  description?: string;
}

export default function AssignDutyScreen() {
  const [team, setTeam] = useState<StaffMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [shiftDate, setShiftDate] = useState('');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    managerService.getTeam()
      .then((data) => setTeam(data.filter((m) => m.status === 'active')))
      .catch(() => {})
      .finally(() => setTeamLoading(false));
  }, []);

  function validate(): boolean {
    const errs: Errors = {};
    if (!selectedStaff) errs.assigned_to_id = 'Please select a staff member.';
    if (!shiftDate.trim()) {
      errs.shift_date = 'Date is required.';
    } else if (!DATE_REGEX.test(shiftDate.trim())) {
      errs.shift_date = 'Date must be in YYYY-MM-DD format.';
    }
    if (!shiftStart.trim()) {
      errs.shift_start = 'Start time is required.';
    } else if (!TIME_REGEX.test(shiftStart.trim())) {
      errs.shift_start = 'Time must be in HH:MM format (24h).';
    }
    if (!shiftEnd.trim()) {
      errs.shift_end = 'End time is required.';
    } else if (!TIME_REGEX.test(shiftEnd.trim())) {
      errs.shift_end = 'Time must be in HH:MM format (24h).';
    }
    const descErr = description.trim()
      ? validators.maxLength(description.trim(), 500)
      : null;
    if (descErr) errs.description = descErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handlePress() {
    setApiError('');
    if (validate()) setShowConfirm(true);
  }

  async function handleConfirmed() {
    if (!selectedStaff) return;
    setShowConfirm(false);
    setSubmitting(true);
    try {
      await shiftService.assignDuty({
        assigned_to_id: selectedStaff.id,
        shift_date: shiftDate.trim(),
        shift_start: shiftStart.trim(),
        shift_end: shiftEnd.trim(),
        description: description.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => router.back(), 1400);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to assign duty. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Shift Duty</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {success ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>Shift duty assigned! Staff has been notified.</Text>
            </View>
          ) : null}

          {apiError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{apiError}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            {/* Staff picker */}
            <View>
              <RequiredLabel label="Assign To" required />
              <TouchableOpacity
                style={[styles.pickerBtn, errors.assigned_to_id ? styles.inputError : null]}
                onPress={() => setShowPicker((v) => !v)}
                activeOpacity={0.8}
              >
                <User size={16} color={selectedStaff ? COLORS.blue : '#9CA3AF'} />
                <Text style={[styles.pickerText, selectedStaff ? styles.pickerTextActive : null]}>
                  {selectedStaff ? `${selectedStaff.full_name} — ${selectedStaff.designation}` : 'Select staff member...'}
                </Text>
              </TouchableOpacity>
              <FormErrorText error={errors.assigned_to_id} />
            </View>

            {showPicker ? (
              <View style={styles.pickerList}>
                {teamLoading ? (
                  <ActivityIndicator color={COLORS.orange} style={{ padding: 16 }} />
                ) : team.length === 0 ? (
                  <Text style={styles.pickerEmpty}>No active staff found.</Text>
                ) : (
                  team.map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      style={[styles.pickerItem, selectedStaff?.id === member.id && styles.pickerItemActive]}
                      onPress={() => { setSelectedStaff(member); setShowPicker(false); setErrors((e) => ({ ...e, assigned_to_id: undefined })); }}
                    >
                      <View style={styles.pickerAvatar}>
                        <Text style={styles.pickerAvatarText}>
                          {member.full_name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.pickerName}>{member.full_name}</Text>
                        <Text style={styles.pickerRole}>{member.designation}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            ) : null}

            {/* Date */}
            <View>
              <RequiredLabel label="Shift Date" required />
              <View style={styles.inputRow}>
                <CalendarDays size={16} color="#9CA3AF" style={{ marginTop: 14 }} />
                <TextInput
                  style={[styles.input, styles.inputFlex, errors.shift_date ? styles.inputError : null]}
                  value={shiftDate}
                  onChangeText={(v) => { setShiftDate(v); setErrors((e) => ({ ...e, shift_date: undefined })); }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  maxLength={10}
                />
              </View>
              <FormErrorText error={errors.shift_date} />
            </View>

            {/* Times */}
            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <RequiredLabel label="Start Time" required />
                <View style={styles.inputRow}>
                  <Clock size={16} color="#9CA3AF" style={{ marginTop: 14 }} />
                  <TextInput
                    style={[styles.input, styles.inputFlex, errors.shift_start ? styles.inputError : null]}
                    value={shiftStart}
                    onChangeText={(v) => { setShiftStart(v); setErrors((e) => ({ ...e, shift_start: undefined })); }}
                    placeholder="09:00"
                    placeholderTextColor="#9CA3AF"
                    maxLength={5}
                  />
                </View>
                <FormErrorText error={errors.shift_start} />
              </View>
              <View style={{ flex: 1 }}>
                <RequiredLabel label="End Time" required />
                <View style={styles.inputRow}>
                  <Clock size={16} color="#9CA3AF" style={{ marginTop: 14 }} />
                  <TextInput
                    style={[styles.input, styles.inputFlex, errors.shift_end ? styles.inputError : null]}
                    value={shiftEnd}
                    onChangeText={(v) => { setShiftEnd(v); setErrors((e) => ({ ...e, shift_end: undefined })); }}
                    placeholder="18:00"
                    placeholderTextColor="#9CA3AF"
                    maxLength={5}
                  />
                </View>
                <FormErrorText error={errors.shift_end} />
              </View>
            </View>

            {/* Description */}
            <View>
              <Text style={styles.optLabel}>Description <Text style={styles.optTag}>(optional)</Text></Text>
              <TextInput
                style={[styles.input, styles.inputMulti, errors.description ? styles.inputError : null]}
                value={description}
                onChangeText={(v) => { setDescription(v); setErrors((e) => ({ ...e, description: undefined })); }}
                placeholder="Add shift instructions, location, or notes..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                maxLength={500}
              />
              <FormErrorText error={errors.description} />
            </View>
          </View>

          <FormSubmitButton
            label="Assign Duty"
            onPress={handlePress}
            loading={submitting}
            disabled={submitting || success}
          />

          <Text style={styles.hint}>
            Staff will receive a notification with the shift details.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmationModal
        visible={showConfirm}
        title="Assign Shift Duty?"
        message={`${selectedStaff?.full_name ?? ''} will be assigned a shift on ${shiftDate} from ${shiftStart} to ${shiftEnd}.`}
        confirmLabel="Assign"
        cancelLabel="Cancel"
        variant="confirm"
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
  successText: { color: '#065F46', fontWeight: '700', fontSize: 14 },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: 10,
    padding: 14,
  },
  errorBannerText: { color: '#7F1D1D', fontSize: 13, fontWeight: '600' },
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
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  pickerText: { fontSize: 14, color: '#9CA3AF', flex: 1 },
  pickerTextActive: { color: '#111827', fontWeight: '600' },
  pickerList: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    maxHeight: 240,
    overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemActive: { backgroundColor: '#EFF6FF' },
  pickerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.blue + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerAvatarText: { fontSize: 13, fontWeight: '800', color: COLORS.blue },
  pickerName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  pickerRole: { fontSize: 11, color: '#6B7280' },
  pickerEmpty: { padding: 16, textAlign: 'center', color: '#9CA3AF', fontSize: 13 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  inputFlex: { flex: 1 },
  inputMulti: { minHeight: 90, textAlignVertical: 'top' },
  inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  timeRow: { flexDirection: 'row', gap: 12 },
  optLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  optTag: { fontSize: 12, fontWeight: '400', color: '#9CA3AF' },
  hint: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
});
