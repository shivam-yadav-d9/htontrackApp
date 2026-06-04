import { router } from 'expo-router';
import { BadgeCheck, Megaphone } from 'lucide-react-native';
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

import { StaffPageHeader } from '@/components/StaffPageHeader';
import { communicationService } from '@/services/communication.service';
import type { Announcement } from '@/types/communication.types';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

const PRIORITY_STYLE: Record<string, { bg: string; text: string }> = {
  urgent: { bg: '#FEE2E2', text: '#B91C1C' },
  high:   { bg: '#FEF3C7', text: '#92400E' },
  medium: { bg: '#DBEAFE', text: '#1D4ED8' },
  low:    { bg: '#F3F4F6', text: '#6B7280' },
};

export default function StaffAnnouncementsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  useEffect(() => { loadAnnouncements(); }, []);

  async function loadAnnouncements() {
    try {
      const data = await communicationService.getMyAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.log('Announcements load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadAnnouncements();
  }

  async function handleAcknowledge(id: string) {
    setAcknowledging(id);
    try {
      const updated = await communicationService.acknowledgeAnnouncement(id);
      setAnnouncements((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to acknowledge.');
    } finally {
      setAcknowledging(null);
    }
  }

  const unread = announcements.filter((a) => !a.is_acknowledged).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StaffPageHeader title="Announcements" subtitle={unread > 0 ? `${unread} unread` : 'All caught up'} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.orange]} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.orange} style={{ marginTop: 30 }} />
        ) : announcements.length === 0 ? (
          <View style={styles.empty}>
            <Megaphone size={40} color={COLORS.border} />
            <Text style={styles.emptyText}>No announcements yet.</Text>
          </View>
        ) : (
          announcements.map((item) => {
            const ps = PRIORITY_STYLE[item.priority] ?? PRIORITY_STYLE.medium;
            return (
              <View key={item.id} style={[styles.card, Shadow.card, item.is_acknowledged && styles.cardDim]}>
                <View style={styles.cardTop}>
                  <View style={styles.iconBox}>
                    <Megaphone size={20} color={COLORS.orange} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardMeta}>
                      {item.announcement_type ?? item.type ?? 'General'}
                    </Text>
                  </View>
                  <View style={[styles.priorityChip, { backgroundColor: ps.bg }]}>
                    <Text style={[styles.priorityText, { color: ps.text }]}>{item.priority}</Text>
                  </View>
                  {item.is_acknowledged && (
                    <View style={styles.readChip}>
                      <Text style={styles.readChipText}>Read</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.cardBody}>{item.description}</Text>

                {item.attachment_name ? (
                  <View style={styles.attachmentRow}>
                    <Text style={styles.attachmentText}>📎 {item.attachment_name}</Text>
                  </View>
                ) : null}

                {item.created_by_name ? (
                  <Text style={styles.cardFooter}>From: {item.created_by_name}</Text>
                ) : null}

                {item.requires_acknowledgement && !item.is_acknowledged && (
                  <TouchableOpacity
                    style={[styles.ackBtn, acknowledging === item.id && styles.btnDisabled]}
                    onPress={() => handleAcknowledge(item.id)}
                    disabled={acknowledging === item.id}
                  >
                    {acknowledging === item.id
                      ? <ActivityIndicator size="small" color={COLORS.white} />
                      : <>
                          <BadgeCheck size={16} color={COLORS.white} />
                          <Text style={styles.ackBtnText}>Acknowledge</Text>
                        </>}
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingVertical: 50, gap: 12 },
  emptyText: { color: COLORS.gray, fontSize: 14 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardDim: { opacity: 0.75 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.medium,
    backgroundColor: COLORS.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: COLORS.blue },
  cardMeta: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  priorityChip: { borderRadius: BorderRadius.pill, paddingHorizontal: 8, paddingVertical: 4 },
  priorityText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  readChip: { backgroundColor: '#DCFCE7', borderRadius: BorderRadius.pill, paddingHorizontal: 8, paddingVertical: 4 },
  readChipText: { fontSize: 9, fontWeight: '800', color: '#166534', textTransform: 'uppercase' },

  cardBody: { fontSize: 13, color: COLORS.grayDark, lineHeight: 19 },
  attachmentRow: { flexDirection: 'row', alignItems: 'center' },
  attachmentText: { fontSize: 12, color: COLORS.brown, fontWeight: '600' },
  cardFooter: { fontSize: 11, color: COLORS.gray },

  ackBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: BorderRadius.medium,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  ackBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 13 },
});
