import { router } from 'expo-router';
import {
  Award,
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronRight,
  HelpCircle,
  IdCard,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ScrollText,
  Shield,
  Store,
  Target,
  UserRound,
} from 'lucide-react-native';
import { StaffPageHeader } from '@/components/StaffPageHeader';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/auth.store';
import { staffDashboardService } from '@/services/staff-dashboard.service';
import { employeeProfileService } from '@/services/employeeProfile.service';
import type { EmployeeProfileResponse } from '@/services/employeeProfile.service';
import type { StaffDashboardResponse } from '@/types/dashboard.types';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

function SnapCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={snapStyles.card}>
      <Text style={snapStyles.value}>{value}</Text>
      <Text style={snapStyles.label}>{label}</Text>
    </View>
  );
}

const snapStyles = StyleSheet.create({
  card: {
    width: '23%',
    backgroundColor: '#FFF3E8',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  value: { fontSize: 18, fontWeight: '900', color: '#102B45' },
  label: { fontSize: 9, fontWeight: '800', color: '#8A8178', textAlign: 'center', marginTop: 3 },
});

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <View style={styles.infoRow}>
      {icon ? <View style={styles.infoIcon}>{icon}</View> : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconWrap, { backgroundColor: danger ? COLORS.error + '15' : COLORS.blueLight }]}>
        {icon}
      </View>
      <Text style={[styles.menuLabel, danger && { color: COLORS.error }]}>{label}</Text>
      <ChevronRight size={16} color={COLORS.gray} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const [dashboard, setDashboard] = useState<StaffDashboardResponse | null>(null);
  const [profileData, setProfileData] = useState<EmployeeProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const [dash, prof] = await Promise.allSettled([
        staffDashboardService.getDashboard(),
        employeeProfileService.getMyProfile(),
      ]);
      if (dash.status === 'fulfilled') setDashboard(dash.value);
      if (prof.status === 'fulfilled') setProfileData(prof.value);
    } catch (error) {
      console.log('Staff profile load error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await loadProfile();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  }

  const profile = profileData?.profile ?? null;
  const summary = profileData?.summary ?? null;
  const profileUser = dashboard?.user ?? user;

  const initials =
    (profile?.full_name ?? profileUser?.full_name)
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? 'PS';

  const attendancePct = dashboard?.attendance.monthly_percentage ?? 0;
  const targetPct = dashboard?.targets.average_percentage ?? 0;
  const coursesText = dashboard
    ? `${dashboard.courses.completed}/${dashboard.courses.total}`
    : `${user?.courses_completed ?? 0}/${user?.courses_total ?? 0}`;
  const certCount = summary?.certificate_count ?? user?.certificates_count ?? 0;
  const completionPct = profile?.profile_completion_percentage ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StaffPageHeader title="My Profile" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#C95F18']} tintColor="#C95F18" />
        }
      >
        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{profileUser?.full_name ?? '—'}</Text>
          <Text style={styles.designation}>
            {profileUser?.designation ?? dashboard?.user.designation ?? 'Store Staff'}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {(profileUser?.role ?? 'STORE_STAFF').replace(/_/g, ' ')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => router.push('/staff/edit-profile')}
            activeOpacity={0.8}
          >
            <Pencil size={14} color={COLORS.white} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Live Stats Row */}
        {loading ? (
          <View style={[styles.statsCard, Shadow.card, { justifyContent: 'center', padding: 18 }]}>
            <ActivityIndicator color="#C95F18" />
          </View>
        ) : (
          <View style={[styles.statsCard, Shadow.card]}>
            {[
              { label: 'Attendance', value: `${attendancePct}%` },
              { label: 'Target', value: `${targetPct}%` },
              { label: 'Courses', value: coursesText },
              { label: 'Certificates', value: String(certCount) },
            ].map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Profile Completion */}
        {profile ? (
          <View style={[styles.card, Shadow.card]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>Profile Completion</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: completionPct >= 90 ? COLORS.success : COLORS.orange }}>
                {completionPct}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completionPct}%` as any, backgroundColor: completionPct >= 90 ? COLORS.success : completionPct >= 76 ? COLORS.orange : COLORS.error }]} />
            </View>
            <Text style={styles.completionLabel}>
              {completionPct >= 90 ? 'Complete' : completionPct >= 76 ? 'Good — add emergency contact' : completionPct >= 51 ? 'Basic complete' : 'Incomplete — please update profile'}
            </Text>
          </View>
        ) : null}

        {/* Store & Manager */}
        <View style={[styles.card, Shadow.card]}>
          <Text style={styles.cardTitle}>Store & Manager</Text>

          <InfoRow
            icon={<Store size={16} color="#C95F18" />}
            label="Store"
            value={
              [dashboard?.user.store_name, profileUser?.store_name]
                .find(Boolean) ?? '—'
            }
          />
          <InfoRow
            icon={<MapPin size={16} color="#C95F18" />}
            label="Store Code · Region"
            value={
              [
                dashboard?.user.store_code,
                dashboard?.user.region ?? profileUser?.region,
              ]
                .filter(Boolean)
                .join(' · ') || '—'
            }
          />
          <InfoRow
            icon={<MapPin size={16} color="#C95F18" />}
            label="City · State"
            value={
              [dashboard?.user.city, dashboard?.user.state]
                .filter(Boolean)
                .join(' · ') || '—'
            }
          />
          {(profile?.manager_name ?? dashboard?.user.reporting_manager ?? profileUser?.reporting_manager) ? (
            <>
              <InfoRow
                icon={<UserRound size={16} color="#C95F18" />}
                label="Reporting Manager"
                value={profile?.manager_name ?? dashboard?.user.reporting_manager ?? profileUser?.reporting_manager ?? '—'}
              />
              <InfoRow
                icon={<Mail size={16} color="#C95F18" />}
                label="Manager Email"
                value={profile?.manager_email ?? dashboard?.user.reporting_manager_email ?? profileUser?.reporting_manager_email ?? '—'}
              />
            </>
          ) : null}
        </View>

        {/* Employee Details */}
        <View style={[styles.card, Shadow.card]}>
          <Text style={styles.cardTitle}>Employee Details</Text>
          <InfoRow
            icon={<IdCard size={16} color="#C95F18" />}
            label="Employee Code"
            value={dashboard?.user.employee_code ?? profileUser?.employee_code ?? '—'}
          />
          <InfoRow
            icon={<Phone size={16} color="#C95F18" />}
            label="Mobile"
            value={profileUser?.mobile ?? '—'}
          />
          <InfoRow
            icon={<Mail size={16} color="#C95F18" />}
            label="Email"
            value={dashboard?.user.email ?? profileUser?.email ?? '—'}
          />
          <InfoRow
            icon={<Building2 size={16} color="#C95F18" />}
            label="Department"
            value={dashboard?.user.department ?? profileUser?.department ?? '—'}
          />
          <InfoRow
            icon={<BadgeCheck size={16} color="#C95F18" />}
            label="Designation"
            value={dashboard?.user.designation ?? profileUser?.designation ?? '—'}
          />
          <InfoRow
            icon={<CalendarDays size={16} color="#C95F18" />}
            label="Joining Date"
            value={
              profileUser?.date_of_joining
                ? new Date(profileUser.date_of_joining).toDateString()
                : '—'
            }
          />
          <InfoRow
            icon={<BadgeCheck size={16} color="#C95F18" />}
            label="Status"
            value={(profileUser?.status ?? 'active').toUpperCase()}
          />
        </View>

        {/* Personal Details */}
        {profile ? (
          <View style={[styles.card, Shadow.card]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.one }}>
              <Text style={styles.cardTitle}>Personal Details</Text>
              <TouchableOpacity onPress={() => router.push('/staff/edit-profile')} activeOpacity={0.7}>
                <Text style={{ color: COLORS.orange, fontWeight: '700', fontSize: 13 }}>Edit</Text>
              </TouchableOpacity>
            </View>
            <InfoRow icon={<Phone size={16} color="#C95F18" />} label="Alt. Mobile" value={profile.alternate_mobile ?? '—'} />
            <InfoRow icon={<MapPin size={16} color="#C95F18" />} label="Address" value={profile.address ?? '—'} />
            <InfoRow icon={<UserRound size={16} color="#C95F18" />} label="Emergency Contact" value={profile.emergency_contact_name ? `${profile.emergency_contact_name} · ${profile.emergency_contact_mobile ?? ''}` : '—'} />
            <InfoRow icon={<BadgeCheck size={16} color="#C95F18" />} label="Preferred Language" value={profile.preferred_language ?? 'English'} />
            {profile.bio ? <InfoRow icon={<ScrollText size={16} color="#C95F18" />} label="Bio" value={profile.bio} /> : null}
          </View>
        ) : null}

        {/* Performance Snapshot */}
        {summary ? (
          <View style={[styles.card, Shadow.card]}>
            <Text style={styles.cardTitle}>Performance Snapshot</Text>
            <View style={styles.snapGrid}>
              <SnapCard label="Monthly Targets" value={String(summary.monthly_target_count)} />
              <SnapCard label="Daily Targets" value={String(summary.daily_target_count)} />
              <SnapCard label="Weekly Offs" value={String(summary.weekly_off_count)} />
              <SnapCard label="Attendance" value={String(summary.attendance_session_count)} />
              <SnapCard label="Courses" value={String(summary.course_attempt_count)} />
              <SnapCard label="Certificates" value={String(summary.certificate_count)} />
              <SnapCard label="Awards" value={String(summary.award_count)} />
              <SnapCard label="Incentives" value={String(summary.incentive_record_count)} />
            </View>
          </View>
        ) : null}

        {/* Quick Nav */}
        <View style={[styles.card, Shadow.card]}>
          <Text style={styles.cardTitle}>Quick Access</Text>
          <MenuItem icon={<BookOpen size={16} color={COLORS.blue} />} label="My Courses" onPress={() => router.push('/staff/courses')} />
          <MenuItem icon={<Award size={16} color={COLORS.warning} />} label="My Certificates" onPress={() => router.push('/staff/certificates')} />
          <MenuItem icon={<Target size={16} color={COLORS.orange} />} label="My Targets" onPress={() => router.push('/staff/targets')} />
          <MenuItem icon={<ScrollText size={16} color={COLORS.success} />} label="My Documents" onPress={() => router.push('/staff/documents')} />
        </View>

        {/* Settings */}
        <View style={[styles.card, Shadow.card]}>
          <Text style={styles.cardTitle}>Settings</Text>
          <MenuItem icon={<Shield size={16} color={COLORS.blue} />} label="Security & Privacy" onPress={() => {}} />
          <MenuItem icon={<HelpCircle size={16} color={COLORS.blue} />} label="Help & Support" onPress={() => {}} />
          <MenuItem icon={<LogOut size={16} color={COLORS.error} />} label="Logout" onPress={handleLogout} danger />
        </View>

        <Text style={styles.version}>Karmyogi Staff App v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { paddingBottom: 40 },

  headerBanner: {
    alignItems: 'center',
    paddingTop: Spacing.four,
    paddingBottom: 48,
    backgroundColor: COLORS.blue,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  avatarText: { fontSize: 30, fontWeight: '900', color: COLORS.white },
  userName: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  designation: { fontSize: 13, color: COLORS.white + 'CC', marginTop: 2 },
  roleBadge: {
    backgroundColor: COLORS.orange,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    marginTop: Spacing.two,
  },
  roleBadgeText: { color: COLORS.white, fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    marginTop: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editProfileText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },

  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    marginHorizontal: Spacing.three,
    marginTop: -24,
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '900', color: COLORS.blue },
  statLabel: { fontSize: 11, color: COLORS.gray },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    margin: Spacing.three,
    marginTop: Spacing.two,
    marginBottom: 0,
    gap: Spacing.one,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.blue, marginBottom: Spacing.one },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '700', textTransform: 'uppercase' },
  infoValue: { fontSize: 13, fontWeight: '700', color: COLORS.grayDark, marginTop: 2 },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, color: COLORS.grayDark },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.gray,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#EAD7C2',
    borderRadius: 999,
    overflow: 'hidden',
    marginVertical: 8,
  },
  progressFill: { height: 8, borderRadius: 999 },
  completionLabel: { fontSize: 12, color: '#8A8178', fontWeight: '700' },
  snapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
