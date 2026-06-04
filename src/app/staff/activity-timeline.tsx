import { router } from 'expo-router';
import { Activity, ShieldCheck } from 'lucide-react-native';
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

import { auditService } from '@/services/audit.service';
import type { AuditLog } from '@/types/audit.types';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#B91C1C',
  warning: '#C2410C',
  info: '#1D4ED8',
};

const MODULES = [
  'all', 'assignments', 'courses', 'quizzes', 'attendance',
  'checklists', 'approvals', 'skills', 'coaching', 'rewards', 'reminders',
];

export default function StaffActivityTimelineScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [moduleFilter, setModuleFilter] = useState('all');

  useEffect(() => { loadLogs(); }, [moduleFilter]);

  async function loadLogs() {
    try {
      setLoading(true);
      const params: any = {};
      if (moduleFilter !== 'all') params.module = moduleFilter;
      const data = await auditService.getMyLogs(params);
      setLogs(data as AuditLog[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    try { setRefreshing(true); await loadLogs(); } finally { setRefreshing(false); }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Timeline</Text>
        <Text style={styles.headerSub}>Your work history and updates</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {MODULES.map((item) => (
            <Chip
              key={item}
              label={item.replace('_', ' ')}
              active={moduleFilter === item}
              onPress={() => setModuleFilter(item)}
            />
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#C95F18" />
            <Text style={styles.loadingText}>Loading activity...</Text>
          </View>
        ) : logs.length === 0 ? (
          <View style={styles.emptyCard}>
            <ShieldCheck size={34} color="#8A8178" />
            <Text style={styles.emptyTitle}>No activity found</Text>
          </View>
        ) : (
          logs.map((item, index) => (
            <View key={item.id} style={styles.timelineCard}>
              {index < logs.length - 1 && <View style={styles.timelineLine} />}
              <View style={styles.timelineDot}>
                <Activity size={16} color="#C95F18" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.logTitle}>{item.action.replaceAll('_', ' ')}</Text>
                <Text style={styles.logMeta}>
                  {item.module}
                  {' · '}
                  <Text style={{ color: SEVERITY_COLORS[item.severity] ?? '#1D4ED8' }}>
                    {item.severity}
                  </Text>
                </Text>
                <Text style={styles.logDesc}>{item.description}</Text>
                <View style={styles.timeBox}>
                  <Text style={styles.timeText}>{item.event_time ?? item.created_at ?? '—'}</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
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
    gap: 6,
  },
  backPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 4,
  },
  backText: { color: '#FFEAC7', fontSize: 12, fontWeight: '900' },
  headerTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 36 },
  chipRow: { gap: 8 },
  chip: {
    backgroundColor: '#FFF3E8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EAD7C2',
  },
  chipActive: { backgroundColor: '#C95F18', borderColor: '#C95F18' },
  chipText: { color: '#6B3F20', fontSize: 12, fontWeight: '900', textTransform: 'capitalize' },
  chipTextActive: { color: '#FFFFFF' },
  loadingCard: { backgroundColor: '#FFFDF8', borderRadius: 24, padding: 24, alignItems: 'center', gap: 8 },
  loadingText: { color: '#8A8178', fontWeight: '700' },
  emptyCard: { backgroundColor: '#FFFDF8', borderRadius: 24, padding: 28, alignItems: 'center', gap: 8 },
  emptyTitle: { color: '#102B45', fontSize: 16, fontWeight: '900' },
  timelineCard: {
    flexDirection: 'row',
    gap: 12,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 20,
    top: 44,
    bottom: -14,
    width: 2,
    backgroundColor: '#EAD7C2',
  },
  timelineDot: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logTitle: { color: '#102B45', fontSize: 14, fontWeight: '900', textTransform: 'capitalize' },
  logMeta: { color: '#8A8178', fontSize: 11, fontWeight: '800', marginTop: 2, textTransform: 'capitalize' },
  logDesc: { color: '#6B3F20', fontSize: 12, fontWeight: '700', lineHeight: 17, marginTop: 8 },
  timeBox: {
    backgroundColor: '#FFF3E8',
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  timeText: { color: '#102B45', fontSize: 10, fontWeight: '800' },
});
