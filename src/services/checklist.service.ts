import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type {
  Checklist,
  ChecklistCreatePayload,
  ChecklistResponse,
  ChecklistSubmission,
  ChecklistSubmitPayload,
  ChecklistAssignment,
  ChecklistAssignmentDetail,
  ChecklistItemSubmitPayload,
  ChecklistFullSubmitPayload,
  ChecklistTemplate,
} from '@/types/checklist.types';
import { storage } from '@/utils/storage';

export type { Checklist, ChecklistResponse, ChecklistSubmission };

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

export const checklistService = {
  // ── Staff: new role-wise assignment API ────────────────────────────────────

  async getMyAssignments(params?: { status?: string; assigned_date?: string }): Promise<{ assignments: ChecklistAssignment[]; count: number }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.assigned_date) query.set('assigned_date', params.assigned_date);
    const qs = query.toString();
    const data = await api.get<any>(`/staff/checklists/my${qs ? `?${qs}` : ''}`);
    if (Array.isArray(data)) return { assignments: data, count: data.length };
    return { assignments: data.assignments ?? [], count: data.count ?? 0 };
  },

  async getAssignmentDetail(assignmentId: string): Promise<ChecklistAssignmentDetail> {
    return api.get<ChecklistAssignmentDetail>(`/staff/checklists/${assignmentId}`);
  },

  async submitItem(
    assignmentId: string,
    itemId: string,
    payload: ChecklistItemSubmitPayload,
  ): Promise<{ submission: any; assignment: ChecklistAssignment }> {
    return api.post(`/staff/checklists/${assignmentId}/items/${itemId}/submit`, payload);
  },

  async submitFullAssignment(
    assignmentId: string,
    payload: ChecklistFullSubmitPayload,
  ): Promise<{ assignment: ChecklistAssignment; submitted_items: any[] }> {
    return api.post(`/staff/checklists/${assignmentId}/submit`, payload);
  },

  // ── Manager: templates & assignments ──────────────────────────────────────

  async getManagerTemplates(): Promise<{ templates: ChecklistTemplate[]; count: number }> {
    const data = await api.get<any>('/manager/checklists/templates');
    if (Array.isArray(data)) return { templates: data, count: data.length };
    return { templates: data.templates ?? [], count: data.count ?? 0 };
  },

  async assignChecklist(payload: {
    template_id: string;
    staff_ids: string[];
    due_date?: string;
    assigned_date?: string;
  }): Promise<any> {
    return api.post('/manager/checklists/assign', payload);
  },

  async getManagerAssignments(params?: { status?: string; assigned_date?: string }): Promise<{ assignments: ChecklistAssignment[]; count: number }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.assigned_date) query.set('assigned_date', params.assigned_date);
    const qs = query.toString();
    const data = await api.get<any>(`/manager/checklists/assignments${qs ? `?${qs}` : ''}`);
    if (Array.isArray(data)) return { assignments: data, count: data.length };
    return { assignments: data.assignments ?? [], count: data.count ?? 0 };
  },

  async getManagerAssignmentDetail(assignmentId: string): Promise<ChecklistAssignmentDetail> {
    return api.get<ChecklistAssignmentDetail>(`/manager/checklists/assignments/${assignmentId}`);
  },

  async reviewAssignment(
    assignmentId: string,
    payload: { review_status: 'approved' | 'rejected' | 'needs_correction'; manager_remarks?: string },
  ): Promise<any> {
    return api.post(`/manager/checklists/assignments/${assignmentId}/review`, payload);
  },

  async getManagerCompliance(): Promise<any> {
    return api.get('/manager/checklists/compliance');
  },

  // ── Legacy methods (preserved for backward compat) ────────────────────────

  async createChecklist(payload: ChecklistCreatePayload): Promise<Checklist> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const item: Checklist = {
        id: localDb.generateId('chk'),
        created_by: uid,
        status: 'active',
        created_at: new Date().toISOString(),
        ...payload,
      } as unknown as Checklist;
      return localDb.addItem('checklists', item);
    }
    return api.post<Checklist>('/manager/checklists', payload);
  },

  async getManagerChecklists(): Promise<Checklist[]> {
    if (APP_MODE === 'offline_apk') {
      return localDb.getCollection<Checklist>('checklists');
    }
    return api.get<Checklist[]>('/manager/checklists');
  },

  async getManagerChecklistSubmissions(): Promise<ChecklistSubmission[]> {
    if (APP_MODE === 'offline_apk') return [];
    return api.get<ChecklistSubmission[]>('/manager/checklist-submissions');
  },

  async getMyChecklists(): Promise<Checklist[]> {
    if (APP_MODE === 'offline_apk') {
      return localDb.getCollection<Checklist>('checklists');
    }
    try {
      const data = await checklistService.getMyAssignments();
      return data.assignments as unknown as Checklist[];
    } catch {
      return api.get<Checklist[]>('/staff/checklists/my');
    }
  },

  async getChecklist(id: string): Promise<Checklist> {
    if (APP_MODE === 'offline_apk') {
      const item = await localDb.findById<Checklist>('checklists', id);
      if (!item) throw new Error('Checklist not found');
      return item;
    }
    return api.get<Checklist>(`/staff/checklists/${id}`);
  },

  async submitChecklist(id: string, payload: ChecklistSubmitPayload): Promise<ChecklistSubmission> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const submission: ChecklistSubmission = {
        id: localDb.generateId('cksub'),
        checklist_id: id,
        submitted_by: uid,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        responses: payload.responses ?? [],
      } as unknown as ChecklistSubmission;
      return submission;
    }
    return api.post<ChecklistSubmission>(`/staff/checklists/${id}/submit`, payload);
  },

  getMyChecklistsLegacy() {
    return checklistService.getMyChecklists();
  },

  getChecklistLegacy(id: string) {
    return checklistService.getChecklist(id);
  },

  async submitChecklistResponseLegacy(id: string, payload: { responses: ChecklistResponse[] }): Promise<ChecklistResponse> {
    if (APP_MODE === 'offline_apk') {
      return { id: localDb.generateId('ckres'), checklist_id: id, ...payload } as unknown as ChecklistResponse;
    }
    return api.post<ChecklistResponse>(`/checklists/${id}/response`, payload);
  },

  async getManagerChecklistResponsesLegacy(): Promise<ChecklistResponse[]> {
    if (APP_MODE === 'offline_apk') return [];
    return api.get<ChecklistResponse[]>('/manager/checklist-responses');
  },
};
