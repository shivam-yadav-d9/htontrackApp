import { router } from 'expo-router';
import {
  Bell,
  BookOpen,
  CheckSquare,
  ClipboardList,
  Target,
} from 'lucide-react-native';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

interface CreateCardProps {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  onPress: () => void;
}

function CreateCard({ icon, label, subtitle, onPress }: CreateCardProps) {
  return (
    <TouchableOpacity style={[styles.card, Shadow.card]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardSub}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

export default function CreateHubScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create</Text>
        <Text style={styles.headerSub}>Manage your store operations</Text>
      </View>

      <View style={styles.grid}>
        <CreateCard
          icon={<ClipboardList size={28} color={COLORS.blue} />}
          label="Assignment"
          subtitle="Assign tasks to staff"
          onPress={() => router.push('/manager/create-assignment')}
        />
        <CreateCard
          icon={<Bell size={28} color={COLORS.orange} />}
          label="Announcement"
          subtitle="Notify all store staff"
          onPress={() => router.push('/manager/create-announcement')}
        />
        <CreateCard
          icon={<Target size={28} color={COLORS.success} />}
          label="Set Target"
          subtitle="Set performance goals"
          onPress={() => router.push('/manager/set-targets')}
        />
        <CreateCard
          icon={<CheckSquare size={28} color={COLORS.brown} />}
          label="Checklist"
          subtitle="Create store checklists"
          onPress={() => router.push('/manager/create-checklist')}
        />
        <CreateCard
          icon={<Bell size={28} color={COLORS.warning} />}
          label="Reminder"
          subtitle="Set a staff reminder"
          onPress={() => router.push('/manager/create-reminder')}
        />
        <CreateCard
          icon={<BookOpen size={28} color={COLORS.orange} />}
          label="Quiz"
          subtitle="Build a staff quiz"
          onPress={() => router.push('/manager/create-quiz')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  header: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.three,
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  card: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.medium,
    backgroundColor: COLORS.beigeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { fontSize: 14, fontWeight: '800', color: COLORS.grayDark, textAlign: 'center' },
  cardSub: { fontSize: 11, color: COLORS.gray, textAlign: 'center' },
});
