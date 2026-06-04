import { router } from 'expo-router';
import { Plus, UserRound } from 'lucide-react-native';
import React, { useState } from 'react';
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

import { ManagerPageHeader } from '@/components/ManagerPageHeader';
import { managerTeamService } from '@/services/manager-team.service';

export default function AddTeamMemberScreen() {
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [department, setDepartment] = useState('Furniture Sales');
  const [designation, setDesignation] = useState('Sales Associate');
  const [password, setPassword] = useState('staff@123');

  async function handleCreate() {
    if (!fullName.trim()) return Alert.alert('Validation', 'Full name is required.');
    if (!email.trim() || !email.includes('@')) return Alert.alert('Validation', 'Valid email is required.');
    if (!department.trim()) return Alert.alert('Validation', 'Department is required.');
    if (!designation.trim()) return Alert.alert('Validation', 'Designation is required.');

    try {
      setSaving(true);
      const result = await managerTeamService.addTeamMember({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        department: department.trim(),
        designation: designation.trim(),
        password: password.trim() || 'staff@123',
      });

      Alert.alert(
        'Staff Added',
        `Login created:\n\nEmail: ${result.login.email}\nPassword: ${result.login.password}`,
        [{ text: 'View Team', onPress: () => router.replace('/manager/team' as any) }],
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message ?? 'Unable to add staff member.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ManagerPageHeader title="Add Team Member" subtitle="Create staff under your store" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <UserRound size={28} color="#C95F18" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>New Staff Profile</Text>
            <Text style={styles.heroText}>
              Member will be assigned to your store with you as reporting manager.
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <InputField label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Example: Aarav Sharma" />
          <InputField label="Email" value={email} onChangeText={setEmail} placeholder="staff@hometown.in" keyboardType="email-address" autoCapitalize="none" />
          <InputField label="Mobile" value={mobile} onChangeText={setMobile} placeholder="10-digit mobile" keyboardType="phone-pad" />
          <InputField label="Department" value={department} onChangeText={setDepartment} placeholder="Furniture Sales" />
          <InputField label="Designation" value={designation} onChangeText={setDesignation} placeholder="Sales Associate" />
          <InputField label="Initial Password" value={password} onChangeText={setPassword} placeholder="staff@123" />
        </View>

        <TouchableOpacity
          style={[styles.createBtn, saving && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={saving}
          activeOpacity={0.88}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.createBtnText}>Create Staff Member</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InputField({
  label, value, onChangeText, placeholder, keyboardType, autoCapitalize,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences';
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
        autoCapitalize={autoCapitalize ?? (keyboardType === 'email-address' ? 'none' : 'words')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6EBDC' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 34 },

  heroCard: {
    backgroundColor: '#102B45', borderRadius: 28, padding: 17,
    flexDirection: 'row', alignItems: 'center', gap: 13,
  },
  heroIcon: {
    width: 58, height: 58, borderRadius: 21,
    backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  heroText: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '700', marginTop: 4, lineHeight: 17 },

  formCard: {
    backgroundColor: '#FFFDF8', borderRadius: 26, padding: 16,
    gap: 13, borderWidth: 1, borderColor: '#EAD7C2',
  },
  fieldBlock: { gap: 7 },
  label: { color: '#6B3F20', fontSize: 12, fontWeight: '900' },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 17, borderWidth: 1,
    borderColor: '#EAD7C2', paddingHorizontal: 13, paddingVertical: 12,
    color: '#102B45', fontSize: 14, fontWeight: '700',
  },

  createBtn: {
    backgroundColor: '#C95F18', borderRadius: 22, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9,
  },
  createBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
