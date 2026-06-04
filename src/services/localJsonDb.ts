/**
 * localJsonDb.ts
 *
 * Offline/Demo APK local data layer.
 * Seeds AsyncStorage from bundled JSON on first launch.
 * All reads/writes go through AsyncStorage so data persists across restarts.
 *
 * IMPORTANT — OFFLINE APK LIMITATION:
 *   - Data is local per device. Manager and staff on different phones will NOT sync.
 *   - For real production, switch APP_MODE to "backend" and configure EXPO_PUBLIC_API_URL.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Seed imports ──────────────────────────────────────────────────────────────
import seedUsers from '@/data/users.json';
import seedStores from '@/data/stores.json';
import seedAssignments from '@/data/assignments.json';
import seedCourses from '@/data/courses.json';
import seedQuizzes from '@/data/quizzes.json';
import seedAttendance from '@/data/attendance.json';
import seedTargets from '@/data/targets.json';
import seedTickets from '@/data/tickets.json';
import seedDocuments from '@/data/documents.json';
import seedChecklists from '@/data/checklists.json';
import seedApprovals from '@/data/approvals.json';
import seedSkills from '@/data/skills.json';
import seedAlerts from '@/data/performance_alerts.json';
import seedCoachingPlans from '@/data/coaching_plans.json';
import seedRewards from '@/data/rewards.json';
import seedCertificates from '@/data/certificates.json';
import seedNotifications from '@/data/notifications.json';
import seedReminders from '@/data/reminders.json';
import seedAuditLogs from '@/data/audit_logs.json';
import seedTodos from '@/data/todos.json';
import seedShifts from '@/data/shifts.json';

// ── Constants ─────────────────────────────────────────────────────────────────
const DB_SEEDED_KEY = 'local_db_seeded_v2';
const PREFIX = 'local_db_';

type CollectionName =
  | 'users'
  | 'stores'
  | 'assignments'
  | 'courses'
  | 'quizzes'
  | 'attendance'
  | 'targets'
  | 'tickets'
  | 'documents'
  | 'checklists'
  | 'approvals'
  | 'skills'
  | 'performance_alerts'
  | 'coaching_plans'
  | 'rewards'
  | 'certificates'
  | 'notifications'
  | 'reminders'
  | 'audit_logs'
  | 'todos'
  | 'shifts';

const SEED_MAP: Record<CollectionName, unknown> = {
  users: seedUsers,
  stores: seedStores,
  assignments: seedAssignments,
  courses: seedCourses,
  quizzes: seedQuizzes,
  attendance: seedAttendance,
  targets: seedTargets,
  tickets: seedTickets,
  documents: seedDocuments,
  checklists: seedChecklists,
  approvals: seedApprovals,
  skills: seedSkills,
  performance_alerts: seedAlerts,
  coaching_plans: seedCoachingPlans,
  rewards: seedRewards,
  certificates: seedCertificates,
  notifications: seedNotifications,
  reminders: seedReminders,
  audit_logs: seedAuditLogs,
  todos: seedTodos,
  shifts: seedShifts,
};

// ── Seed on first launch ──────────────────────────────────────────────────────
export async function seedLocalDb(): Promise<void> {
  const alreadySeeded = await AsyncStorage.getItem(DB_SEEDED_KEY);
  if (alreadySeeded) return;

  const pairs: [string, string][] = Object.entries(SEED_MAP).map(([key, value]) => [
    `${PREFIX}${key}`,
    JSON.stringify(value),
  ]);
  await AsyncStorage.multiSet(pairs);
  await AsyncStorage.setItem(DB_SEEDED_KEY, '1');
}

// ── Core CRUD ─────────────────────────────────────────────────────────────────
export async function getCollection<T = unknown>(name: CollectionName): Promise<T[]> {
  const raw = await AsyncStorage.getItem(`${PREFIX}${name}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export async function setCollection<T = unknown>(name: CollectionName, data: T[]): Promise<void> {
  await AsyncStorage.setItem(`${PREFIX}${name}`, JSON.stringify(data));
}

export async function findById<T extends { id: string }>(
  name: CollectionName,
  id: string,
): Promise<T | null> {
  const rows = await getCollection<T>(name);
  return rows.find((r) => r.id === id) ?? null;
}

export async function addItem<T extends { id: string }>(
  name: CollectionName,
  item: T,
): Promise<T> {
  const rows = await getCollection<T>(name);
  rows.push(item);
  await setCollection(name, rows);
  return item;
}

export async function updateItem<T extends { id: string }>(
  name: CollectionName,
  id: string,
  patch: Partial<T>,
): Promise<T | null> {
  const rows = await getCollection<T>(name);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...patch, id };
  await setCollection(name, rows);
  return rows[idx];
}

export async function deleteItem(name: CollectionName, id: string): Promise<void> {
  const rows = await getCollection<{ id: string }>(name);
  await setCollection(name, rows.filter((r) => r.id !== id));
}

export async function resetLocalDb(): Promise<void> {
  await AsyncStorage.removeItem(DB_SEEDED_KEY);
  const keys = Object.keys(SEED_MAP).map((k) => `${PREFIX}${k}`);
  await AsyncStorage.multiRemove(keys);
  await seedLocalDb();
}

// ── ID generator ──────────────────────────────────────────────────────────────
export function generateId(prefix = 'item'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Convenience re-export ─────────────────────────────────────────────────────
export const localDb = {
  seed: seedLocalDb,
  getCollection,
  setCollection,
  findById,
  addItem,
  updateItem,
  deleteItem,
  reset: resetLocalDb,
  generateId,
};
