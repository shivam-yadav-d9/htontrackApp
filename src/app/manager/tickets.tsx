import { router } from 'expo-router';
import { ChevronRight, Ticket } from 'lucide-react-native';
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

import { ticketService } from '@/services/ticket.service';
import type { Ticket as TicketType } from '@/types/ticket.types';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

type FilterTab = 'open' | 'in_progress' | 'resolved';

const PRIORITY_COLORS: Record<string, string> = {
  urgent: COLORS.error,
  high: COLORS.warning,
  medium: COLORS.blue,
  low: COLORS.gray,
};

const STATUS_COLORS: Record<string, string> = {
  open: COLORS.orange,
  in_progress: COLORS.blue,
  resolved: COLORS.success,
  escalated: COLORS.error,
};

export default function TicketsScreen() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('open');

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    try {
      const data = await ticketService.getManagerTickets();
      setTickets(data);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadTickets();
  }

  const filtered = tickets.filter((t) => {
    if (activeFilter === 'open') return t.status === 'open';
    if (activeFilter === 'in_progress') return t.status === 'in_progress';
    if (activeFilter === 'resolved') return t.status === 'resolved' || t.status === 'escalated';
    return true;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tickets</Text>
        </View>
        <ActivityIndicator color={COLORS.orange} size="large" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Staff Tickets</Text>
        <Text style={styles.headerSub}>{tickets.length} total</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['open', 'in_progress', 'resolved'] as FilterTab[]).map((tab) => {
          const count = tickets.filter((t) => {
            if (tab === 'open') return t.status === 'open';
            if (tab === 'in_progress') return t.status === 'in_progress';
            return t.status === 'resolved' || t.status === 'escalated';
          }).length;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab)}>
              <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>
                {tab.replace(/_/g, ' ')} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.orange]} />
        }>
        {filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ticket size={48} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No Tickets</Text>
            <Text style={styles.emptySub}>No {activeFilter.replace(/_/g, ' ')} tickets.</Text>
          </View>
        ) : (
          filtered.map((ticket) => (
            <TouchableOpacity
              key={ticket.id}
              style={[styles.card, Shadow.card]}
              onPress={() =>
                router.push({ pathname: '/manager/ticket-detail', params: { id: ticket.id } })
              }
              activeOpacity={0.85}>
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: (PRIORITY_COLORS[ticket.priority] ?? COLORS.gray) + '18' },
                  ]}>
                  <Text style={[styles.priorityText, { color: PRIORITY_COLORS[ticket.priority] ?? COLORS.gray }]}>
                    {ticket.priority}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: (STATUS_COLORS[ticket.status] ?? COLORS.gray) + '18' },
                  ]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[ticket.status] ?? COLORS.gray }]}>
                    {ticket.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardType}>{ticket.ticket_type}</Text>
              <Text style={styles.cardStaff}>Raised by: {ticket.staff_name}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{ticket.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>
                  {new Date(ticket.created_at).toLocaleDateString('en-IN')}
                </Text>
                <ChevronRight size={16} color={COLORS.gray} />
              </View>
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
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterTab: { flex: 1, paddingVertical: Spacing.two + 4, alignItems: 'center' },
  filterTabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.orange },
  filterTabText: { fontSize: 12, fontWeight: '600', color: COLORS.gray, textTransform: 'capitalize' },
  filterTabTextActive: { color: COLORS.orange, fontWeight: '800' },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: 6,
  },
  cardTop: { flexDirection: 'row', gap: Spacing.one },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.pill },
  priorityText: { fontSize: 10, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.pill },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  cardType: { fontSize: 15, fontWeight: '700', color: COLORS.grayDark },
  cardStaff: { fontSize: 12, color: COLORS.blue, fontWeight: '600' },
  cardDesc: { fontSize: 13, color: COLORS.gray, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  cardDate: { fontSize: 11, color: COLORS.gray },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.grayDark },
  emptySub: { fontSize: 13, color: COLORS.gray, textAlign: 'center', textTransform: 'capitalize' },
});
