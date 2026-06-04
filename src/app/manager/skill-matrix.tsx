import { router } from 'expo-router';
import { AlertCircle, BarChart3, Brain, PlusCircle, TrendingUp, Users } from 'lucide-react-native';
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

import { skillService } from '@/services/skill.service';
import type { CompetencyLevel, SkillMatrix } from '@/types/skill.types';

function CompetencyChip({ level }: { level?: CompetencyLevel | null }) {
  if (!level) return null;
  const map: Record<CompetencyLevel, { bg: string; text: string; label: string }> = {
    excellent: { bg: '#DCFCE7', text: '#166534', label: 'Excellent' },
    good: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Good' },
    needs_improvement: { bg: '#FEF3C7', text: '#92400E', label: 'Needs Work' },
    critical: { bg: '#FEE2E2', text: '#B91C1C', label: 'Critical' },
  };
  const style = map[level];
  return (
    <View style={[styles.chip, { backgroundColor: style.bg }]}>
      <Text style={[styles.chipText, { color: style.text }]}>{style.label}</Text>
    </View>
  );
}

export default function SkillMatrixScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matrices, setMatrices] = useState<SkillMatrix[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await skillService.getManagerSkillMatrices();
      setMatrices(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Skill Matrices</Text>
        <Text style={styles.headerSub}>Track staff competencies by role</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/manager/create-skill-matrix')}
          >
            <PlusCircle size={15} color="#FFFFFF" />
            <Text style={styles.createBtnText}>Create Matrix</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.progressBtn}
            onPress={() => router.push('/manager/skill-progress')}
          >
            <BarChart3 size={15} color="#102B45" />
            <Text style={styles.progressBtnText}>Skill Progress</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#C95F18" style={{ marginTop: 24 }} />
        ) : matrices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Brain size={32} color="#8A8178" />
            <Text style={styles.emptyTitle}>No skill matrices yet</Text>
            <Text style={styles.emptySub}>Create a matrix to track staff competencies</Text>
          </View>
        ) : (
          matrices.map((m) => (
            <View key={m.id} style={styles.matrixCard}>
              <View style={styles.matrixTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.matrixTitle}>{m.title}</Text>
                  {m.role_name && <Text style={styles.matrixRole}>{m.role_name}</Text>}
                </View>
                <View style={[styles.statusChip, m.status === 'active' && styles.statusActive]}>
                  <Text style={[styles.statusText, m.status === 'active' && styles.statusActiveText]}>
                    {m.status}
                  </Text>
                </View>
              </View>

              {m.description && <Text style={styles.matrixDesc}>{m.description}</Text>}

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Brain size={13} color="#C95F18" />
                  <Text style={styles.statText}>{m.total_skills} skills</Text>
                </View>
                <View style={styles.statItem}>
                  <Users size={13} color="#1D4ED8" />
                  <Text style={styles.statText}>{m.rated_staff_count ?? 0} rated</Text>
                </View>
                {typeof m.average_score === 'number' && (
                  <View style={styles.statItem}>
                    <TrendingUp size={13} color="#166534" />
                    <Text style={styles.statText}>{m.average_score}% avg</Text>
                  </View>
                )}
                {typeof m.low_skill_staff_count === 'number' && m.low_skill_staff_count > 0 && (
                  <View style={styles.statItem}>
                    <AlertCircle size={13} color="#B91C1C" />
                    <Text style={styles.statText}>{m.low_skill_staff_count} need help</Text>
                  </View>
                )}
              </View>

              {m.due_date && (
                <Text style={styles.dueDate}>Due: {m.due_date}</Text>
              )}
            </View>
          ))
        )}

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
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
  headerTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.72)', marginTop: 4, fontSize: 13, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 36 },
  actionRow: { flexDirection: 'row', gap: 10 },
  createBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#102B45',
    borderRadius: 16,
    paddingVertical: 13,
  },
  createBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
  progressBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#FFFDF8',
    borderRadius: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#EAD7C2',
  },
  progressBtnText: { color: '#102B45', fontWeight: '900', fontSize: 13 },
  emptyCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#EAD7C2',
  },
  emptyTitle: { color: '#102B45', fontSize: 15, fontWeight: '900' },
  emptySub: { color: '#8A8178', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  matrixCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 10,
  },
  matrixTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  matrixTitle: { color: '#102B45', fontSize: 15, fontWeight: '900' },
  matrixRole: { color: '#C95F18', fontSize: 12, fontWeight: '700', marginTop: 2 },
  matrixDesc: { color: '#6B3F20', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: '#6B3F20', fontSize: 12, fontWeight: '700' },
  dueDate: { color: '#8A8178', fontSize: 11, fontWeight: '700' },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  statusChip: { backgroundColor: '#DBEAFE', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { color: '#1D4ED8', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusActiveText: { color: '#166534' },
});
