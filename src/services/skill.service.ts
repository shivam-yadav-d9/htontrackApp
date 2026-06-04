import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type {
  SkillMatrix,
  SkillMatrixCreatePayload,
  SkillProgressResponse,
  SkillRating,
  SkillRatingPayload,
} from '@/types/skill.types';
import { storage } from '@/utils/storage';

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

export const skillService = {
  async createSkillMatrix(payload: SkillMatrixCreatePayload): Promise<SkillMatrix> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const item: SkillMatrix = {
        id: localDb.generateId('skill'),
        created_by: uid,
        ratings: [],
        created_at: new Date().toISOString(),
        ...payload,
      } as unknown as SkillMatrix;
      return localDb.addItem('skills', item);
    }
    return api.post<SkillMatrix>('/manager/skill-matrices', payload);
  },

  async getManagerSkillMatrices(): Promise<SkillMatrix[]> {
    if (APP_MODE === 'offline_apk') {
      return localDb.getCollection<SkillMatrix>('skills');
    }
    return api.get<SkillMatrix[]>('/manager/skill-matrices');
  },

  async getMySkillMatrices(): Promise<SkillMatrix[]> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const matrices = await localDb.getCollection<SkillMatrix & { ratings?: SkillRating[] }>('skills');
      return matrices.map((m) => ({
        ...m,
        ratings: (m.ratings ?? []).filter((r) => (r as unknown as { staff_id: string }).staff_id === uid),
      }));
    }
    return api.get<SkillMatrix[]>('/staff/skill-matrix/my');
  },

  async rateStaffSkills(matrixId: string, payload: SkillRatingPayload): Promise<SkillRating> {
    if (APP_MODE === 'offline_apk') {
      const matrices = await localDb.getCollection<SkillMatrix & { ratings?: SkillRating[] }>('skills');
      const matrix = matrices.find((m) => m.id === matrixId);
      if (!matrix) throw new Error('Skill matrix not found');
      const uid = await getMyUserId();
      const rating: SkillRating = {
        id: localDb.generateId('rat'),
        skill_matrix_id: matrixId,
        rated_by: uid,
        created_at: new Date().toISOString(),
        ...payload,
      } as unknown as SkillRating;
      const ratings = [...(matrix.ratings ?? []), rating];
      await localDb.updateItem('skills', matrixId, { ratings } as Partial<SkillMatrix>);
      return rating;
    }
    return api.post<SkillRating>(`/manager/skill-matrix/${matrixId}/ratings`, payload);
  },

  async getManagerSkillProgress(): Promise<SkillProgressResponse> {
    if (APP_MODE === 'offline_apk') {
      const matrices = await localDb.getCollection<SkillMatrix & { ratings?: SkillRating[] }>('skills');
      const allRatings = matrices.flatMap((m) => m.ratings ?? []);
      const avg = allRatings.length > 0
        ? allRatings.reduce((s, r) => s + ((r as unknown as { average_score?: number }).average_score ?? 0), 0) / allRatings.length
        : 0;
      return { summary: { total_staff_rated: allRatings.length, average_score: Math.round(avg * 10) / 10, low_skill_staff: 0 }, ratings: allRatings } as unknown as SkillProgressResponse;
    }
    return api.get<SkillProgressResponse>('/manager/skill-progress');
  },

  // ── Role-based skill matrix (Step 73) ────────────────────────────────────
  async getMyRoleSkills(periodKey?: string): Promise<any> {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get<any>(`/staff/skills/my${q}`);
  },

  async getMySkillHistory(): Promise<any> {
    return api.get<any>('/staff/skills/my/history');
  },

  async getManagerTeamSkills(periodKey?: string): Promise<any> {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get<any>(`/manager/skills/team${q}`);
  },

  async getManagerSkillGaps(periodKey?: string): Promise<any> {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get<any>(`/manager/skills/gaps${q}`);
  },

  async getManagerEmployeeSkills(staffId: string, periodKey?: string): Promise<any> {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get<any>(`/manager/skills/employee/${staffId}${q}`);
  },

  async rateEmployeeSkills(staffId: string, payload: { period_key?: string; ratings: any[]; remarks?: string }): Promise<any> {
    return api.post<any>(`/manager/skills/employee/${staffId}/rating`, payload);
  },

  async getAdminSkillMatrix(periodKey?: string): Promise<any> {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get<any>(`/admin/skills/matrix${q}`);
  },

  async recalculateSkillMatrix(payload: { period_key?: string; staff_ids?: string[] }): Promise<any> {
    return api.post<any>('/admin/skills/recalculate', payload);
  },
};
