import { router } from 'expo-router';
import { CheckCircle, Circle, Plus, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StaffPageHeader } from '@/components/StaffPageHeader';

import { COLORS, BorderRadius, Spacing, Shadow } from '@/constants/theme';
import { todoService, type Todo } from '@/services/todo.service';

const PRIORITY_COLOR: Record<string, string> = {
  urgent: COLORS.error,
  high: '#E85D04',
  medium: COLORS.warning,
  low: COLORS.success,
};

const STATUS_FILTER = ['all', 'pending', 'in_progress', 'completed'] as const;

export default function TodosScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<typeof STATUS_FILTER[number]>('all');

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await todoService.getMyTodos();
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load todos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleComplete(id: string) {
    try {
      const updated = await todoService.complete(id);
      setTodos(prev => prev.map(t => t.id === id ? updated : t));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete', 'Delete this todo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await todoService.delete(id);
            setTodos(prev => prev.filter(t => t.id !== id));
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
          }
        },
      },
    ]);
  }

  const filtered = todos.filter(t => filter === 'all' || t.status === filter);
  const pending = todos.filter(t => t.status !== 'completed').length;

  return (
    <SafeAreaView style={styles.safe}>
      <StaffPageHeader
        title="My To-Dos"
        subtitle={`${pending} pending`}
        rightAction={
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/staff/todo-create')}>
            <Plus size={20} color={COLORS.white} />
          </TouchableOpacity>
        }
      />

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: Spacing.three, gap: 8, paddingVertical: 8 }}>
        {STATUS_FILTER.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.orange} size="large" /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} colors={[COLORS.orange]} />}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <CheckCircle size={40} color={COLORS.gray} />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySub}>No {filter !== 'all' ? filter.replace('_', ' ') : ''} todos</Text>
            </View>
          ) : (
            filtered.map(todo => (
              <View key={todo.id} style={[styles.card, Shadow.card, todo.status === 'completed' && styles.cardDone]}>
                <TouchableOpacity
                  style={styles.checkBtn}
                  onPress={() => todo.status !== 'completed' && handleComplete(todo.id)}
                  disabled={todo.status === 'completed'}
                >
                  {todo.status === 'completed'
                    ? <CheckCircle size={24} color={COLORS.success} />
                    : <Circle size={24} color={COLORS.gray} />}
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.todoTitle, todo.status === 'completed' && styles.todoTitleDone]}>
                    {todo.title}
                  </Text>
                  {todo.description ? <Text style={styles.todoDesc} numberOfLines={2}>{todo.description}</Text> : null}
                  <View style={styles.todoMeta}>
                    <View style={[styles.priorityBadge, { backgroundColor: (PRIORITY_COLOR[todo.priority] ?? COLORS.gray) + '20' }]}>
                      <Text style={[styles.priorityText, { color: PRIORITY_COLOR[todo.priority] ?? COLORS.gray }]}>
                        {todo.priority}
                      </Text>
                    </View>
                    {todo.due_date && (
                      <Text style={styles.dueDate}>Due {todo.due_date}</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(todo.id)}>
                  <Trash2 size={16} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  header: {
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  addBtn: { backgroundColor: COLORS.orange, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  filterRow: { backgroundColor: COLORS.white, maxHeight: 52, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.beigeLight },
  filterTabActive: { backgroundColor: COLORS.orange },
  filterTabText: { fontSize: 12, fontWeight: '700', color: COLORS.grayDark },
  filterTabTextActive: { color: COLORS.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 14, color: COLORS.error, textAlign: 'center' },
  retryBtn: { backgroundColor: COLORS.orange, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: COLORS.white, fontWeight: '700' },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.grayDark },
  emptySub: { fontSize: 14, color: COLORS.gray, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  cardDone: { opacity: 0.65 },
  checkBtn: { paddingTop: 2 },
  todoTitle: { fontSize: 14, fontWeight: '700', color: COLORS.black, lineHeight: 20 },
  todoTitleDone: { textDecorationLine: 'line-through', color: COLORS.gray },
  todoDesc: { fontSize: 12, color: COLORS.gray, marginTop: 2, lineHeight: 16 },
  todoMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  priorityText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  dueDate: { fontSize: 11, color: COLORS.gray },
  deleteBtn: { padding: 4 },
});
