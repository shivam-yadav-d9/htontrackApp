import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type {
  Assignment,
  AssignmentCreatePayload,
  AssignmentReviewPayload,
  AssignmentSubmission,
  AssignmentSubmitPayload,
} from '@/types/assignment.types';
import { storage } from '@/utils/storage';

export type { AssignmentSubmission };

export interface SubmitAssignmentPayload {
  comment: string;
  file_url?: string;
  idempotency_key?: string;
}

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

export const assignmentService = {
  // ── New role-based assignment API (Step 71) ──────────────────────────────

  async getRoleAssignments(status?: string): Promise<{ assignments: any[]; count: number }> {
    const query = status ? `?status=${status}` : '';
    const data = await api.get<any>(`/staff/assignments/my${query}`);
    if (Array.isArray(data)) return { assignments: data, count: data.length };
    return { assignments: data.assignments ?? [], count: data.count ?? 0 };
  },

  async getRoleAssignmentDetail(assignmentId: string): Promise<{
    assignment: any;
    template: any;
    submission: any | null;
    review: any | null;
  }> {
    return api.get(`/staff/assignments/my/${assignmentId}`);
  },

  async submitRoleAssignment(
    assignmentId: string,
    payload: { text_response?: string; file_url?: string; photo_url?: string; link_url?: string },
  ): Promise<{ assignment: any; submission: any }> {
    return api.post(`/staff/assignments/my/${assignmentId}/submit`, payload);
  },

  // Manager: role-based
  async getManagerRoleTemplates(): Promise<{ templates: any[]; count: number }> {
    const data = await api.get<any>('/manager/assignments/templates');
    if (Array.isArray(data)) return { templates: data, count: data.length };
    return { templates: data.templates ?? [], count: data.count ?? 0 };
  },

  async assignRoleTemplate(payload: {
    template_id: string;
    staff_ids: string[];
    assigned_date?: string;
    due_date?: string;
  }): Promise<any> {
    return api.post('/manager/assignments/assign', payload);
  },

  async getManagerRoleAssigned(params?: { status?: string; assigned_date?: string }): Promise<{ assignments: any[]; count: number }> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.assigned_date) q.set('assigned_date', params.assigned_date);
    const qs = q.toString();
    const data = await api.get<any>(`/manager/assignments/assigned${qs ? `?${qs}` : ''}`);
    if (Array.isArray(data)) return { assignments: data, count: data.length };
    return { assignments: data.assignments ?? [], count: data.count ?? 0 };
  },

  async getManagerRoleAssignmentDetail(assignmentId: string): Promise<any> {
    return api.get(`/manager/assignments/assigned/${assignmentId}`);
  },

  async reviewRoleAssignment(
    assignmentId: string,
    payload: { review_status: 'approved' | 'rejected' | 'needs_correction'; marks_awarded?: number; manager_remarks?: string },
  ): Promise<any> {
    return api.post(`/manager/assignments/assigned/${assignmentId}/review`, payload);
  },

  async getManagerRoleAnalytics(): Promise<any> {
    return api.get('/manager/assignments/analytics');
  },

  // Admin: role-based
  async createRoleTemplate(payload: any): Promise<any> {
    return api.post('/admin/assignments/templates', payload);
  },

  async getAdminRoleTemplates(): Promise<{ templates: any[]; count: number }> {
    const data = await api.get<any>('/admin/assignments/templates');
    if (Array.isArray(data)) return { templates: data, count: data.length };
    return { templates: data.templates ?? [], count: data.count ?? 0 };
  },

  async getRoleTemplateDetail(templateId: string): Promise<any> {
    return api.get(`/admin/assignments/templates/${templateId}`);
  },

  async updateRoleTemplate(templateId: string, payload: any): Promise<any> {
    return api.put(`/admin/assignments/templates/${templateId}`, payload);
  },

  async publishRoleTemplate(templateId: string): Promise<any> {
    return api.post(`/admin/assignments/templates/${templateId}/publish`, {});
  },

  async deleteRoleTemplate(templateId: string): Promise<any> {
    return api.delete(`/admin/assignments/templates/${templateId}`);
  },

  async getAdminRoleAnalytics(): Promise<any> {
    return api.get('/admin/assignments/analytics');
  },

  async getAdminRoleSubmissions(): Promise<any> {
    return api.get('/admin/assignments/submissions');
  },

  // ── Legacy assignment API (preserved) ────────────────────────────────────

  async getMyAssignments(): Promise<Assignment[]> {
    // Try new role-based API first, fall back to legacy
    try {
      const { assignments } = await assignmentService.getRoleAssignments();
      if (assignments.length > 0) return assignments as unknown as Assignment[];
    } catch {
      // fall through to legacy
    }
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const rows = await localDb.getCollection<Assignment & { assigned_to_user_id?: string }>('assignments');
      return rows.filter((a) => !a.assigned_to_user_id || a.assigned_to_user_id === uid);
    }
    return api.get<Assignment[]>('/assignments/my');
  },

  async getAssignment(id: string): Promise<Assignment> {
    if (APP_MODE === 'offline_apk') {
      const item = await localDb.findById<Assignment>('assignments', id);
      if (!item) throw new Error('Assignment not found');
      return item;
    }
    return api.get<Assignment>(`/assignments/${id}`);
  },

  async submitAssignment(id: string, payload: SubmitAssignmentPayload | AssignmentSubmitPayload): Promise<AssignmentSubmission> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      await localDb.updateItem('assignments', id, { status: 'submitted', submission_comment: (payload as SubmitAssignmentPayload).comment } as any);
      const submission: AssignmentSubmission = {
        id: localDb.generateId('sub'),
        assignment_id: id,
        submitted_by: uid,
        status: 'submitted',
        comment: (payload as SubmitAssignmentPayload).comment ?? '',
        submitted_at: new Date().toISOString(),
      } as AssignmentSubmission;
      return submission;
    }
    return api.post<AssignmentSubmission>(`/assignments/${id}/submit`, payload);
  },

  async createAssignment(payload: AssignmentCreatePayload): Promise<Assignment> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const item: Assignment = {
        id: localDb.generateId('asgn'),
        ...payload,
        assigned_by: uid,
        status: 'assigned',
        attachments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as Assignment;
      return localDb.addItem('assignments', item);
    }
    return api.post<Assignment>('/manager/assignments', payload);
  },

  async getManagerSubmissions(): Promise<AssignmentSubmission[]> {
    if (APP_MODE === 'offline_apk') {
      const rows = await localDb.getCollection<Assignment & { submission_comment?: string; assigned_to_user_id?: string }>('assignments');
      const submitted = rows.filter((a) => ['submitted', 'under_review'].includes(a.status ?? ''));
      return submitted.map((a) => ({
        id: localDb.generateId('sub'),
        assignment_id: a.id,
        assignment_title: a.title,
        submitted_by: a.assigned_to_user_id ?? '',
        status: a.status ?? 'submitted',
        comment: a.submission_comment ?? '',
        submitted_at: a.updated_at ?? '',
      })) as unknown as AssignmentSubmission[];
    }
    return api.get<AssignmentSubmission[]>('/manager/assignment-submissions');
  },

  async reviewSubmission(id: string, payload: AssignmentReviewPayload): Promise<AssignmentSubmission> {
    if (APP_MODE === 'offline_apk') {
      const updated = await localDb.updateItem('assignments', id, { status: payload.status } as any);
      return updated as unknown as AssignmentSubmission;
    }
    return api.post<AssignmentSubmission>(`/manager/assignment-submissions/${id}/review`, payload);
  },
};
