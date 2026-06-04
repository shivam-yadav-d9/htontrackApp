import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, BookOpen, ClipboardList, FileText, Target } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { managerService, type StaffMemberDetail } from '@/services/manager.service';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

function StatCard({ label, value, color = COLORS.blue }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={[styles.statCard, Shadow.card]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InitialsAvatar({ name, size = 72 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.33 }]}>{initials}</Text>
    </View>
  );
}

export default function StaffDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [staff, setStaff] = useState<StaffMemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) loadStaff();
  }, [id]);

  async function loadStaff() {
    try {
      const data = await managerService.getStaffDetail(id);
      setStaff(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff details');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Staff Detail</Text>
        </View>
        <ActivityIndicator color={COLORS.orange} size="large" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (error || !staff) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Staff Detail</Text>
        </View>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error || 'Staff not found'}</Text>
          <TouchableOpacity onPress={loadStaff} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, Shadow.card]}>
          <InitialsAvatar name={staff.full_name} />
          <Text style={styles.staffName}>{staff.full_name}</Text>
          <Text style={styles.staffCode}>{staff.employee_code}</Text>
          <Text style={styles.staffDesignation}>{staff.designation}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>{staff.store_name}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaItem}>
              Joined {new Date(staff.date_of_joining).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <Text style={styles.sectionHeader}>Performance Stats</Text>
        <View style={styles.statsGrid}>
          <StatCard
            label="Attendance %"
            value={`${staff.stats?.attendance_percentage ?? 0}%`}
            color={COLORS.success}
          />
          <StatCard
            label="Target %"
            value={`${staff.stats?.target_percentage ?? 0}%`}
            color={COLORS.orange}
          />
          <StatCard
            label="Courses Done"
            value={staff.stats?.courses_completed ?? 0}
            color={COLORS.blue}
          />
          <StatCard
            label="Pending Tasks"
            value={staff.stats?.assignments_pending ?? 0}
            color={staff.stats?.assignments_pending > 0 ? COLORS.error : COLORS.success}
          />
        </View>

        {/* Actions */}
        <Text style={styles.sectionHeader}>Actions</Text>
        <View style={styles.actionsCol}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push({ pathname: '/manager/set-targets', params: { prefill_id: staff.id } })}
            activeOpacity={0.85}>
            <Target size={18} color={COLORS.orange} />
            <Text style={styles.actionBtnText}>Set Target</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/manager/create-assignment')}
            activeOpacity={0.85}>
            <ClipboardList size={18} color={COLORS.blue} />
            <Text style={styles.actionBtnText}>Assign Task</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/manager/approvals')}
            activeOpacity={0.85}>
            <FileText size={18} color={COLORS.brown} />
            <Text style={styles.actionBtnText}>View Documents</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/manager/approvals')}
            activeOpacity={0.85}>
            <BookOpen size={18} color={COLORS.success} />
            <Text style={styles.actionBtnText}>View Assignments</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.four,
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: { color: COLORS.white, fontWeight: '800' },
  staffName: { fontSize: 20, fontWeight: '900', color: COLORS.grayDark },
  staffCode: { fontSize: 13, color: COLORS.gray },
  staffDesignation: { fontSize: 14, fontWeight: '600', color: COLORS.blue },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaItem: { fontSize: 12, color: COLORS.gray },
  metaDot: { color: COLORS.gray, fontSize: 12 },
  sectionHeader: { fontSize: 15, fontWeight: '800', color: COLORS.blue, marginTop: Spacing.one },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    alignItems: 'center',
    width: '47%',
  },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 11, color: COLORS.gray, marginTop: 4, textAlign: 'center' },
  actionsCol: { gap: Spacing.two },
  actionBtn: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    ...Shadow.card,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.grayDark },
  errorBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  errorText: { color: COLORS.error, fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: COLORS.orange, borderRadius: BorderRadius.small, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: COLORS.white, fontWeight: '700' },
});
