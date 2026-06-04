import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type {
  CoachingPlan,
  CoachingPlanCreatePayload,
  CoachingReviewPayload,
  CoachingSummary,
  CompleteCoachingActionPayload,
} from '@/types/coaching.types';
import { storage } from '@/utils/storage';

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

export const coachingService = {
  async createCoachingPlan(payload: CoachingPlanCreatePayload): Promise<CoachingPlan> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const item: CoachingPlan = {
        id: localDb.generateId('coach'),
        created_by: uid,
        status: 'active',
        actions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...payload,
      } as unknown as CoachingPlan;
      return localDb.addItem('coaching_plans', item);
    }
    return api.post<CoachingPlan>('/manager/coaching-plans', payload);
  },

  async getManagerCoachingPlans(): Promise<{ summary: CoachingSummary; plans: CoachingPlan[] }> {
    if (APP_MODE === 'offline_apk') {
      const plans = await localDb.getCollection<CoachingPlan>('coaching_plans');
      const active = plans.filter((p) => p.status === 'active').length;
      const summary: CoachingSummary = {
        total: plans.length,
        active,
        completed: plans.filter((p) => p.status === 'completed').length,
        overdue: 0,
      } as unknown as CoachingSummary;
      return { summary, plans };
    }
    return api.get<{ summary: CoachingSummary; plans: CoachingPlan[] }>('/manager/coaching-plans');
  },

  async getMyCoachingPlans(): Promise<CoachingPlan[]> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const rows = await localDb.getCollection<CoachingPlan & { staff_id?: string }>('coaching_plans');
      return rows.filter((p) => p.staff_id === uid);
    }
    return api.get<CoachingPlan[]>('/staff/coaching-plans/my');
  },

  async completeAction(planId: string, actionId: string, payload: CompleteCoachingActionPayload): Promise<CoachingPlan> {
    if (APP_MODE === 'offline_apk') {
      const plan = await localDb.findById<CoachingPlan & { actions?: { id: string; status: string; completion_note?: string }[] }>('coaching_plans', planId);
      if (!plan) throw new Error('Plan not found');
      const actions = (plan.actions ?? []).map((a) =>
        a.id === actionId ? { ...a, status: 'completed', completion_note: payload.completion_note ?? '' } : a
      );
      const allDone = actions.every((a) => a.status === 'completed');
      const updated = await localDb.updateItem<CoachingPlan>('coaching_plans', planId, {
        actions,
        status: allDone ? 'completed' : 'active',
      } as Partial<CoachingPlan>);
      return updated!;
    }
    return api.post<CoachingPlan>(`/staff/coaching-plans/${planId}/actions/${actionId}/complete`, payload);
  },

  async reviewCoachingPlan(planId: string, payload: CoachingReviewPayload): Promise<CoachingPlan> {
    if (APP_MODE === 'offline_apk') {
      const updated = await localDb.updateItem<CoachingPlan>('coaching_plans', planId, {
        review_notes: payload.review_notes,
        status: payload.status ?? 'active',
        reviewed_at: new Date().toISOString(),
      } as Partial<CoachingPlan>);
      return updated!;
    }
    return api.post<CoachingPlan>(`/manager/coaching-plans/${planId}/review`, payload);
  },

  // ── Role-based coaching (Step 73) ────────────────────────────────────────
  async getMyRoleCoachingPlans(): Promise<{ count: number; plans: any[] }> {
    const data = await api.get<any>('/staff/coaching/my');
    if (Array.isArray(data)) return { plans: data, count: data.length };
    return { plans: data.plans ?? [], count: data.count ?? 0 };
  },

  async getManagerRoleCoachingPlans(): Promise<{ count: number; plans: any[] }> {
    const data = await api.get<any>('/manager/coaching/plans');
    if (Array.isArray(data)) return { plans: data, count: data.length };
    return { plans: data.plans ?? [], count: data.count ?? 0 };
  },

  async createRoleCoachingPlan(payload: any): Promise<any> {
    return api.post('/manager/coaching/plans', payload);
  },

  async addCoachingSession(planId: string, payload: any): Promise<any> {
    return api.post(`/manager/coaching/plans/${planId}/session`, payload);
  },

  async closeCoachingPlan(planId: string, payload?: any): Promise<any> {
    return api.put(`/manager/coaching/plans/${planId}/close`, payload ?? {});
  },
};
