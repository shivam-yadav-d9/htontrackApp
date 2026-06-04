import { router, useLocalSearchParams } from 'expo-router';
import {
  BadgeCheck,
  BriefcaseBusiness,
  Mail,
  Phone,
  Save,
  Store,
  Target,
  UserRound,
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

import { managerTeamService, type TeamMember } from '@/services/manager-team.service';
import { ManagerPageHeader } from '@/components/ManagerPageHeader';

export default function TeamMemberProfileScreen() {
  const { staffId } = useLocalSearchParams<{ staffId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState<TeamMember | null>(null);
  const [profileSummary, setProfileSummary] = useState<any>(null);

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  useEffect(() => {
    if (staffId) loadProfile();
  }, [staffId]);

  async function loadProfile() {
    try {
      setLoading(true);
      const response = await managerTeamService.getTeamMember(String(staffId));
      const m = response.staff;
      setStaff(m);
      setProfileSummary(response.summary ?? null);
      setFullName(m.full_name ?? '');
      setMobile(m.mobile ?? '');
      setDepartment(m.department ?? '');
      setDesignation(m.designation ?? '');
      setStatus((m.status as 'active' | 'inactive') ?? 'active');
    } catch {
      Alert.alert('Error', 'Unable to load staff profile.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!staff) return;
    if (!fullName.trim()) return Alert.alert('Validation', 'Full name is required.');
    if (!department.trim()) return Alert.alert('Validation', 'Department is required.');
    if (!designation.trim()) return Alert.alert('Validation', 'Designation is required.');

    try {
      setSaving(true);
      const response = await managerTeamService.updateTeamMember(staff.id, {
        full_name: fullName.trim(),
        mobile: mobile.trim(),
        department: department.trim(),
        designation: designation.trim(),
        status,
      });
      setStaff(response.staff);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch {
      Alert.alert('Error', 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ManagerPageHeader title="Team Profile" />
        <View style={styles.center}>
          <ActivityIndicator color="#C95F18" size="large" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!staff) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ManagerPageHeader title="Team Profile" />
        <View style={styles.center}>
          <UserRound size={34} color="#8A8178" />
          <Text style={styles.emptyTitle}>Staff member not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/manager/team' as any)}>
            <Text style={styles.backBtnText}>Back to Team</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ManagerPageHeader title="Team Profile" subtitle="View and update staff member" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>
              {staff.full_name?.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase() ?? 'ST'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>{staff.full_name}</Text>
            <Text style={styles.heroRole}>{staff.designation} · {staff.department}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusChip, status === 'inactive' && styles.inactiveChip]}>
                <Text style={[styles.statusText, status === 'inactive' && styles.inactiveText]}>
                  {status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Metrics */}
        <View style={styles.metricsRow}>
          <MetricCard
            icon={<Target size={18} color="#C95F18" />}
            value={`${profileSummary?.target_percentage ?? staff.target_percentage ?? 0}%`}
            label="Target"
          />
          <MetricCard
            icon={<BadgeCheck size={18} color="#166534" />}
            value={`${staff.courses_completed ?? 0}/${staff.courses_total ?? 0}`}
            label="Courses"
          />
          <MetricCard
            icon={<BriefcaseBusiness size={18} color="#102B45" />}
            value={String(profileSummary?.assignments_total ?? staff.assignments_pending ?? 0)}
            label="Assignments"
          />
        </View>

        <View style={styles.metricsRow}>
          <MetricCard
            icon={<BadgeCheck size={18} color="#C95F18" />}
            value={String(profileSummary?.quiz_attempts ?? 0)}
            label="Quiz Attempts"
          />
          <MetricCard
            icon={<Target size={18} color="#166534" />}
            value={`${profileSummary?.average_quiz_score ?? 0}%`}
            label="Quiz Score"
          />
          <MetricCard
            icon={<BriefcaseBusiness size={18} color="#B91C1C" />}
            value={String(profileSummary?.tickets_open ?? 0)}
            label="Open Tickets"
          />
        </View>

        {/* Read-only info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Details</Text>
          <ReadRow icon={<Mail size={16} color="#C95F18" />} label="Email" value={staff.email} />
          <ReadRow icon={<Store size={16} color="#C95F18" />} label="Store" value={staff.store_name ?? '—'} />
          <ReadRow label="Employee Code" value={staff.employee_code ?? '—'} />
          <ReadRow label="Region" value={staff.region ?? '—'} />
          <ReadRow label="Reporting Manager" value={staff.reporting_manager ?? '—'} />
          <ReadRow label="Manager Email" value={staff.reporting_manager_email ?? '—'} />
        </View>

        {/* Editable fields */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Edit Profile</Text>

          <InputField label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Enter full name" />
          <InputField label="Mobile" value={mobile} onChangeText={setMobile} placeholder="Mobile number" keyboardType="phone-pad" />
          <InputField label="Department" value={department} onChangeText={setDepartment} placeholder="Department" />
          <InputField label="Designation" value={designation} onChangeText={setDesignation} placeholder="Designation" />

          <Text style={styles.label}>Status</Text>
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, status === 'active' && styles.toggleActive]}
              onPress={() => setStatus('active')}
            >
              <Text style={[styles.toggleText, status === 'active' && styles.toggleTextOn]}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, status === 'inactive' && styles.toggleDanger]}
              onPress={() => setStatus('inactive')}
            >
              <Text style={[styles.toggleText, status === 'inactive' && styles.toggleTextOn]}>Inactive</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.88}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save size={19} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Profile Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={styles.metricCard}>
      {icon}
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ReadRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.readRow}>
      <View style={styles.readIcon}>{icon ?? <UserRound size={16} color="#C95F18" />}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.readLabel}>{label}</Text>
        <Text style={styles.readValue}>{value}</Text>
      </View>
    </View>
  );
}

function InputField({
  label, value, onChangeText, placeholder, keyboardType,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; keyboardType?: 'default' | 'phone-pad' | 'email-address';
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A8178"
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6EBDC' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 34 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  loadingText: { color: '#8A8178', fontWeight: '700' },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#102B45' },
  backBtn: { backgroundColor: '#C95F18', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  backBtnText: { color: '#FFFFFF', fontWeight: '900' },

  hero: {
    backgroundColor: '#102B45', borderRadius: 28, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  heroAvatar: {
    width: 72, height: 72, borderRadius: 26,
    backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center',
  },
  heroAvatarText: { color: '#C95F18', fontSize: 22, fontWeight: '900' },
  heroName: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  heroRole: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '700', marginTop: 4 },
  statusRow: { flexDirection: 'row', marginTop: 8 },
  statusChip: { backgroundColor: '#DCFCE7', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  statusText: { color: '#166534', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  inactiveChip: { backgroundColor: '#FEE2E2' },
  inactiveText: { color: '#B91C1C' },

  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: {
    flex: 1, backgroundColor: '#FFFDF8', borderRadius: 22,
    padding: 13, borderWidth: 1, borderColor: '#EAD7C2',
  },
  metricValue: { color: '#102B45', fontSize: 20, fontWeight: '900', marginTop: 7 },
  metricLabel: { color: '#8A8178', fontSize: 11, fontWeight: '800' },

  card: {
    backgroundColor: '#FFFDF8', borderRadius: 26, padding: 16,
    borderWidth: 1, borderColor: '#EAD7C2', gap: 12,
  },
  cardTitle: { color: '#102B45', fontSize: 16, fontWeight: '900' },

  readRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 4 },
  readIcon: {
    width: 34, height: 34, borderRadius: 13,
    backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center',
  },
  readLabel: { color: '#8A8178', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  readValue: { color: '#102B45', fontSize: 13, fontWeight: '800', marginTop: 2 },

  fieldBlock: { gap: 7 },
  label: { color: '#6B3F20', fontSize: 12, fontWeight: '900' },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 17, borderWidth: 1,
    borderColor: '#EAD7C2', paddingHorizontal: 13, paddingVertical: 12,
    color: '#102B45', fontSize: 14, fontWeight: '700',
  },

  toggle: {
    flexDirection: 'row', backgroundColor: '#FFF3E8',
    borderRadius: 18, padding: 5, gap: 6,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  toggleActive: { backgroundColor: '#166534' },
  toggleDanger: { backgroundColor: '#B91C1C' },
  toggleText: { color: '#6B3F20', fontWeight: '900' },
  toggleTextOn: { color: '#FFFFFF' },

  saveBtn: {
    backgroundColor: '#C95F18', borderRadius: 22, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
