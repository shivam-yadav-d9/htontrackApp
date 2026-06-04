import { router } from 'expo-router';
import { CheckSquare, PlusCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { checklistService, type Checklist } from '@/services/checklist.service';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

export default function ChecklistsScreen() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChecklists();
  }, []);

  async function loadChecklists() {
    try {
      const data = await checklistService.getManagerChecklists();
      setChecklists(data);
    } catch {
      // fail silently — show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadChecklists();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Checklists</Text>
        </View>
        <ActivityIndicator color={COLORS.orange} size="large" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Checklists</Text>
          <Text style={styles.headerSub}>{checklists.length} checklists</Text>
        </View>
        <TouchableOpacity
          style={styles.fabSmall}
          onPress={() => router.push('/manager/create-checklist')}>
          <PlusCircle size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.orange]} />
        }>
        {checklists.length === 0 ? (
          <View style={styles.emptyBox}>
            <CheckSquare size={48} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No Checklists Yet</Text>
            <Text style={styles.emptySub}>
              Create checklists to help your team track daily tasks and store operations.
            </Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push('/manager/create-checklist')}>
              <Text style={styles.createBtnText}>Create First Checklist</Text>
            </TouchableOpacity>
          </View>
        ) : (
          checklists.map((cl) => (
            <TouchableOpacity
              key={cl.id}
              style={[styles.card, Shadow.card]}
              onPress={() => router.push('/manager/checklist-responses')}
              activeOpacity={0.85}>
              <View style={styles.cardTop}>
                <CheckSquare size={20} color={COLORS.orange} />
                <View style={[styles.statusBadge, {
                  backgroundColor: cl.status === 'active' ? COLORS.success + '18' : COLORS.gray + '18',
                }]}>
                  <Text style={[styles.statusText, {
                    color: cl.status === 'active' ? COLORS.success : COLORS.gray,
                  }]}>
                    {cl.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>{cl.title}</Text>
              {cl.description ? (
                <Text style={styles.cardDesc} numberOfLines={2}>{cl.description}</Text>
              ) : null}
              <Text style={styles.cardMeta}>{cl.items.length} items</Text>
              {cl.created_at && (
                <Text style={styles.cardDate}>
                  Created {new Date(cl.created_at).toLocaleDateString('en-IN')}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
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
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  fabSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: 6,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.pill },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.grayDark },
  cardDesc: { fontSize: 13, color: COLORS.gray, lineHeight: 18 },
  cardMeta: { fontSize: 12, color: COLORS.blue, fontWeight: '600' },
  cardDate: { fontSize: 11, color: COLORS.gray },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 12, paddingHorizontal: Spacing.four },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.grayDark },
  emptySub: { fontSize: 13, color: COLORS.gray, textAlign: 'center', lineHeight: 20 },
  createBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  createBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
