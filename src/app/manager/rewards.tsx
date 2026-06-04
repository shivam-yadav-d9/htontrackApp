import { router } from 'expo-router';
import { Award, Medal, Save } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { managerTeamService } from '@/services/manager-team.service';
import { rewardService } from '@/services/reward.service';
import type { User } from '@/types/auth.types';
import type {
  BadgeLevel,
  Certificate,
  CertificateType,
  Reward,
  RewardCategory,
  RewardType,
} from '@/types/reward.types';

const REWARD_TYPES: RewardType[] = ['points', 'badge', 'appreciation', 'achievement', 'bonus', 'general'];
const CATEGORIES: RewardCategory[] = [
  'Attendance', 'Training', 'Quiz', 'Target', 'Checklist',
  'Skill', 'Coaching', 'Customer Service', 'Store Operations', 'General',
];
const BADGE_LEVELS: BadgeLevel[] = ['bronze', 'silver', 'gold', 'platinum'];
const CERTIFICATE_TYPES: CertificateType[] = [
  'Course Completion', 'Quiz Excellence', 'Skill Excellence', 'Target Champion',
  'Attendance Star', 'Customer Service Star', 'Store Operations Champion', 'General',
];

export default function ManagerRewardsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingReward, setSavingReward] = useState(false);
  const [savingCertificate, setSavingCertificate] = useState(false);

  const [staffList, setStaffList] = useState<User[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');
  const [rewardType, setRewardType] = useState<RewardType>('badge');
  const [category, setCategory] = useState<RewardCategory>('General');
  const [badgeLevel, setBadgeLevel] = useState<BadgeLevel>('gold');
  const [points, setPoints] = useState('100');

  const [certificateTitle, setCertificateTitle] = useState('');
  const [certificateDescription, setCertificateDescription] = useState('');
  const [certificateType, setCertificateType] = useState<CertificateType>('General');
  const [certificateScore, setCertificateScore] = useState('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [teamData, rewardsData, certificatesData] = await Promise.all([
        managerTeamService.getTeam(),
        rewardService.getManagerRewards(),
        rewardService.getManagerCertificates(),
      ]);
      const staff = (teamData as any).staff ?? [];
      setStaffList(staff);
      if (!selectedStaff && staff.length > 0) setSelectedStaff(staff[0]);
      setRewards((rewardsData as any).rewards ?? []);
      setCertificates((certificatesData as any).certificates ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    try { setRefreshing(true); await loadAll(); } finally { setRefreshing(false); }
  }

  async function createReward() {
    if (!selectedStaff) { Alert.alert('Validation', 'Please select a staff member.'); return; }
    if (!rewardTitle.trim() || !rewardDescription.trim()) {
      Alert.alert('Validation', 'Reward title and description are required.'); return;
    }
    const pointValue = Number(points);
    if (isNaN(pointValue) || pointValue < 0) {
      Alert.alert('Validation', 'Points must be a valid number.'); return;
    }
    try {
      setSavingReward(true);
      await rewardService.createReward({
        staff_id: selectedStaff.id,
        title: rewardTitle.trim(),
        description: rewardDescription.trim(),
        reward_type: rewardType,
        category,
        badge_level: rewardType === 'badge' ? badgeLevel : null,
        points: pointValue,
        linked_source_module: null,
        linked_source_id: null,
      });
      setRewardTitle('');
      setRewardDescription('');
      await loadAll();
      Alert.alert('Reward Added', 'Reward assigned successfully.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to create reward.');
    } finally {
      setSavingReward(false);
    }
  }

  async function createCertificate() {
    if (!selectedStaff) { Alert.alert('Validation', 'Please select a staff member.'); return; }
    if (!certificateTitle.trim() || !certificateDescription.trim()) {
      Alert.alert('Validation', 'Certificate title and description are required.'); return;
    }
    const score = certificateScore.trim() ? Number(certificateScore) : null;
    if (score != null && (isNaN(score) || score < 0 || score > 100)) {
      Alert.alert('Validation', 'Score must be between 0 and 100.'); return;
    }
    try {
      setSavingCertificate(true);
      await rewardService.createCertificate({
        staff_id: selectedStaff.id,
        title: certificateTitle.trim(),
        description: certificateDescription.trim(),
        certificate_type: certificateType,
        score_percentage: score,
        linked_source_module: null,
        linked_source_id: null,
      });
      setCertificateTitle('');
      setCertificateDescription('');
      setCertificateScore('');
      await loadAll();
      Alert.alert('Certificate Issued', 'Certificate issued successfully.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to issue certificate.');
    } finally {
      setSavingCertificate(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards</Text>
        <Text style={styles.headerSub}>Recognize staff performance and issue certificates</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {/* Staff Selection */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Select Staff</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {staffList.map((staff) => (
                <Chip
                  key={staff.id}
                  label={staff.full_name ?? staff.email ?? staff.id}
                  active={selectedStaff?.id === staff.id}
                  onPress={() => setSelectedStaff(staff)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Create Reward */}
        <View style={styles.formCard}>
          <View style={styles.cardTitleRow}>
            <Award size={18} color="#C95F18" />
            <Text style={styles.cardTitle}>Create Reward</Text>
          </View>

          <Field label="Reward Title" value={rewardTitle} onChangeText={setRewardTitle} placeholder="e.g. Sofa Sales Star" />
          <Field label="Description" value={rewardDescription} onChangeText={setRewardDescription} multiline placeholder="Recognized for..." />

          <Text style={styles.label}>Reward Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {REWARD_TYPES.map((item) => (
                <Chip key={item} label={item} active={rewardType === item} onPress={() => setRewardType(item)} />
              ))}
            </View>
          </ScrollView>

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CATEGORIES.map((item) => (
                <Chip key={item} label={item} active={category === item} onPress={() => setCategory(item)} />
              ))}
            </View>
          </ScrollView>

          <Text style={styles.label}>Badge Level</Text>
          <View style={styles.wrapRow}>
            {BADGE_LEVELS.map((item) => (
              <Chip key={item} label={item} active={badgeLevel === item} onPress={() => setBadgeLevel(item)} />
            ))}
          </View>

          <Field label="Points" value={points} onChangeText={setPoints} placeholder="100" />

          <TouchableOpacity
            style={[styles.saveButton, savingReward && { opacity: 0.6 }]}
            onPress={createReward}
            disabled={savingReward}
          >
            {savingReward ? <ActivityIndicator color="#FFFFFF" /> : (
              <>
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Award Reward</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Issue Certificate */}
        <View style={styles.formCard}>
          <View style={styles.cardTitleRow}>
            <Medal size={18} color="#C95F18" />
            <Text style={styles.cardTitle}>Issue Certificate</Text>
          </View>

          <Field label="Certificate Title" value={certificateTitle} onChangeText={setCertificateTitle} placeholder="e.g. Furniture Sales Excellence" />
          <Field label="Description" value={certificateDescription} onChangeText={setCertificateDescription} multiline placeholder="Awarded for..." />

          <Text style={styles.label}>Certificate Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CERTIFICATE_TYPES.map((item) => (
                <Chip key={item} label={item} active={certificateType === item} onPress={() => setCertificateType(item)} />
              ))}
            </View>
          </ScrollView>

          <Field label="Score % (optional)" value={certificateScore} onChangeText={setCertificateScore} placeholder="90" />

          <TouchableOpacity
            style={[styles.saveButton, savingCertificate && { opacity: 0.6 }]}
            onPress={createCertificate}
            disabled={savingCertificate}
          >
            {savingCertificate ? <ActivityIndicator color="#FFFFFF" /> : (
              <>
                <Medal size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Issue Certificate</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent Rewards */}
        <Text style={styles.sectionTitle}>Recent Rewards</Text>
        {loading ? <ActivityIndicator color="#C95F18" /> : rewards.length === 0 ? (
          <EmptyCard text="No rewards yet" />
        ) : rewards.slice(0, 8).map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMeta}>{item.staff_name} · {item.reward_type} · {item.points} pts</Text>
            <Text style={styles.itemDesc}>{item.description}</Text>
          </View>
        ))}

        {/* Recent Certificates */}
        <Text style={styles.sectionTitle}>Recent Certificates</Text>
        {certificates.length === 0 ? <EmptyCard text="No certificates yet" /> : certificates.slice(0, 8).map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMeta}>{item.staff_name} · {item.certificate_type}</Text>
            <Text style={styles.itemDesc}>Cert No: {item.certificate_number}</Text>
          </View>
        ))}

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, multiline, placeholder }: {
  label: string; value: string; onChangeText: (v: string) => void; multiline?: boolean; placeholder?: string;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor="#8A8178"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6EBDC' },
  header: {
    backgroundColor: '#102B45',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  backPillText: { color: '#FFEAC7', fontSize: 12, fontWeight: '900' },
  headerTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.72)', marginTop: 4, fontSize: 13, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 36 },
  formCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 12,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cardTitle: { color: '#102B45', fontSize: 17, fontWeight: '900' },
  label: { color: '#6B3F20', fontSize: 12, fontWeight: '900' },
  fieldBlock: { gap: 6 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: '#102B45',
    fontWeight: '700',
    fontSize: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', gap: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#FFF3E8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EAD7C2',
  },
  chipActive: { backgroundColor: '#C95F18', borderColor: '#C95F18' },
  chipText: { color: '#6B3F20', fontSize: 12, fontWeight: '900' },
  chipTextActive: { color: '#FFFFFF' },
  saveButton: {
    backgroundColor: '#C95F18',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  sectionTitle: { color: '#102B45', fontSize: 17, fontWeight: '900' },
  emptyCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAD7C2',
  },
  emptyTitle: { color: '#6B3F20', fontWeight: '900' },
  itemCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 5,
  },
  itemTitle: { color: '#102B45', fontSize: 14, fontWeight: '900' },
  itemMeta: { color: '#8A8178', fontSize: 11, fontWeight: '800' },
  itemDesc: { color: '#6B3F20', fontSize: 12, fontWeight: '700' },
});
