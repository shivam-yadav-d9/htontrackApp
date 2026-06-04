import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, BorderRadius, Spacing, Shadow } from '@/constants/theme';
import { profileService, type UpdateProfilePayload } from '@/services/profile.service';
import {
  FormSection, FormField, FormErrorText, RequiredLabel,
  FormSubmitButton, ConfirmationModal,
} from '@/components/forms';
import { validators } from '@/utils/validators';

interface Errors {
  full_name?: string;
  email?: string;
  alternate_mobile?: string;
  emergency_contact_mobile?: string;
  date_of_birth?: string;
  bio?: string;
}

function validate(fields: {
  fullName: string; email: string; alternateMobile: string;
  emergencyMobile: string; dob: string; bio: string;
}): Errors {
  const errs: Errors = {};
  const req = validators.required(fields.fullName);
  if (req) { errs.full_name = req; }
  if (fields.fullName.trim().length > 0 && fields.fullName.trim().length < 2) {
    errs.full_name = 'Full name must be at least 2 characters.';
  }
  if (fields.email.trim()) {
    const e = validators.email(fields.email.trim());
    if (e) errs.email = e;
  }
  if (fields.alternateMobile.trim()) {
    const m = validators.mobile(fields.alternateMobile.trim());
    if (m) errs.alternate_mobile = m;
  }
  if (fields.emergencyMobile.trim()) {
    const m = validators.mobile(fields.emergencyMobile.trim());
    if (m) errs.emergency_contact_mobile = m;
  }
  if (fields.dob.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(fields.dob.trim())) {
    errs.date_of_birth = 'Date must be in YYYY-MM-DD format.';
  }
  if (fields.bio.trim().length > 500) {
    errs.bio = 'Bio must not exceed 500 characters.';
  }
  return errs;
}

export default function EditProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyMobile, setEmergencyMobile] = useState('');
  const [dob, setDob] = useState('');
  const [bio, setBio] = useState('');
  const [language, setLanguage] = useState('en');

  const [employeeCode, setEmployeeCode] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');

  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    profileService.getProfile().then((p) => {
      setFullName(p.full_name ?? '');
      setEmail(p.email ?? '');
      setAlternateMobile(p.alternate_mobile ?? '');
      setAddress(p.address ?? '');
      setEmergencyName(p.emergency_contact_name ?? '');
      setEmergencyMobile(p.emergency_contact_mobile ?? '');
      setDob(p.date_of_birth ?? '');
      setBio(p.bio ?? '');
      setLanguage(p.preferred_language ?? 'en');
      setEmployeeCode(p.employee_code);
      setDesignation(p.designation ?? '');
      setDepartment(p.department ?? '');
      setRole(p.role);
    }).catch(() => {
      setSuccessMsg('');
    }).finally(() => setLoading(false));
  }, []);

  function handlePressSave() {
    const errs = validate({ fullName, email, alternateMobile, emergencyMobile, dob, bio });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setShowConfirm(true);
  }

  async function handleConfirmedSave() {
    setShowConfirm(false);
    setSaving(true);
    try {
      const payload: UpdateProfilePayload = {
        full_name: fullName.trim(),
        email: email.trim() || undefined,
        alternate_mobile: alternateMobile.trim() || undefined,
        address: address.trim() || undefined,
        emergency_contact_name: emergencyName.trim() || undefined,
        emergency_contact_mobile: emergencyMobile.trim() || undefined,
        date_of_birth: dob.trim() || undefined,
        bio: bio.trim() || undefined,
        preferred_language: language.trim() || undefined,
      };
      await profileService.updateProfile(payload);
      setSuccessMsg('Profile updated successfully.');
      setTimeout(() => router.back(), 1200);
    } catch (err) {
      setErrors({ full_name: err instanceof Error ? err.message : 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={COLORS.orange} size="large" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {successMsg ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Info</Text>

            <View style={styles.fieldWrap}>
              <RequiredLabel label="Full Name" required />
              <TextInput
                style={[styles.input, errors.full_name ? styles.inputError : null]}
                value={fullName}
                onChangeText={(v) => { setFullName(v); setErrors((e) => ({ ...e, full_name: undefined })); }}
                placeholder="Your full name"
                placeholderTextColor="#9CA3AF"
              />
              <FormErrorText error={errors.full_name} />
            </View>

            <View style={styles.fieldWrap}>
              <RequiredLabel label="Email" />
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                value={email}
                onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: undefined })); }}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <FormErrorText error={errors.email} />
            </View>

            <View style={styles.fieldWrap}>
              <RequiredLabel label="Alternate Mobile" />
              <TextInput
                style={[styles.input, errors.alternate_mobile ? styles.inputError : null]}
                value={alternateMobile}
                onChangeText={(v) => { setAlternateMobile(v); setErrors((e) => ({ ...e, alternate_mobile: undefined })); }}
                placeholder="10-digit mobile"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
              />
              <FormErrorText error={errors.alternate_mobile} />
            </View>

            <View style={styles.fieldWrap}>
              <RequiredLabel label="Date of Birth" />
              <TextInput
                style={[styles.input, errors.date_of_birth ? styles.inputError : null]}
                value={dob}
                onChangeText={(v) => { setDob(v); setErrors((e) => ({ ...e, date_of_birth: undefined })); }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
              />
              <FormErrorText error={errors.date_of_birth} />
            </View>

            <View style={styles.fieldWrap}>
              <RequiredLabel label="Bio" />
              <TextInput
                style={[styles.input, styles.inputMulti, errors.bio ? styles.inputError : null]}
                value={bio}
                onChangeText={(v) => { setBio(v); setErrors((e) => ({ ...e, bio: undefined })); }}
                placeholder="Tell us about yourself (max 500 chars)"
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <View style={styles.fieldFooter}>
                <FormErrorText error={errors.bio} />
                <Text style={[styles.counter, bio.length > 480 ? styles.counterWarn : null]}>{bio.length}/500</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Address & Emergency</Text>

            <View style={styles.fieldWrap}>
              <RequiredLabel label="Address" />
              <TextInput
                style={[styles.input, styles.inputMulti]}
                value={address}
                onChangeText={setAddress}
                placeholder="Your full address"
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.fieldWrap}>
              <RequiredLabel label="Emergency Contact Name" />
              <TextInput
                style={styles.input}
                value={emergencyName}
                onChangeText={setEmergencyName}
                placeholder="Contact person name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.fieldWrap}>
              <RequiredLabel label="Emergency Contact Mobile" />
              <TextInput
                style={[styles.input, errors.emergency_contact_mobile ? styles.inputError : null]}
                value={emergencyMobile}
                onChangeText={(v) => { setEmergencyMobile(v); setErrors((e) => ({ ...e, emergency_contact_mobile: undefined })); }}
                placeholder="10-digit mobile"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
              />
              <FormErrorText error={errors.emergency_contact_mobile} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Work Details</Text>
            {([
              { label: 'Employee Code', value: employeeCode, hint: 'Assigned by HR at onboarding — cannot be changed.' },
              { label: 'Role', value: role, hint: 'Assigned by your Regional Manager. Contact HR to request a role change.' },
              { label: 'Designation', value: designation, hint: 'Set by HR based on your current position.' },
              { label: 'Department', value: department, hint: 'Set by HR based on your store assignment.' },
            ] as const).map(({ label, value, hint }) => (
              <View key={label} style={styles.fieldWrap}>
                <Text style={styles.readonlyLabel}>{label}</Text>
                <View style={styles.readonlyInput}>
                  <Text style={styles.readonlyValue}>{value || '—'}</Text>
                </View>
                <Text style={styles.readonlyNote}>{hint}</Text>
              </View>
            ))}
          </View>

          <FormSubmitButton
            label="Save Changes"
            onPress={handlePressSave}
            loading={saving}
            disabled={saving}
          />

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmationModal
        visible={showConfirm}
        title="Save Profile Changes?"
        message="Your profile information will be updated. Please confirm."
        confirmLabel="Save"
        cancelLabel="Cancel"
        variant="confirm"
        onConfirm={handleConfirmedSave}
        onCancel={() => setShowConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7EFE5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, color: COLORS.white, fontSize: 18, fontWeight: '800' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  successBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  successText: { color: '#065F46', fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.blue, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  fieldWrap: { gap: 0 },
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
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  inputMulti: { minHeight: 88, textAlignVertical: 'top' },
  fieldFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  counter: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  counterWarn: { color: '#DC2626' },
  readonlyLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  readonlyInput: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  readonlyValue: { fontSize: 15, color: '#6B7280' },
  readonlyNote: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
});
