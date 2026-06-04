import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import { storage } from '@/utils/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Manager = {
  id: string;
  employee_code?: string | null;
  full_name: string;
  email: string;
  mobile?: string | null;
  role: 'MANAGER';
  status: string;
  department?: string | null;
  designation?: string | null;
  store_id?: string | null;
  store_code?: string | null;
  site_code?: string | null;
  store_name?: string | null;
  city?: string | null;
  state?: string | null;
  zone?: string | null;
  created_at?: string;
  updated_at?: string;
};

export interface StaffMember {
  id: string;
  employee_code: string;
  full_name: string;
  designation: string;
  role: string;
  store_id: string;
  store_name: string;
  department: string;
  profile_photo_url?: string;
  date_of_joining: string;
  status: 'active' | 'inactive';
}

export interface StaffMemberDetail extends StaffMember {
  mobile: string;
  email?: string;
  stats: {
    attendance_percentage: number;
    target_percentage: number;
    courses_completed: number;
    assignments_pending: number;
  };
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  due_date: string;
  assignment_type: 'text' | 'pdf' | 'image' | 'checklist';
  assign_to: 'entire_store' | string[];
  status: string;
  created_at: string;
}

export interface CreateAssignmentPayload {
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  due_date: string;
  assignment_type: 'text' | 'pdf' | 'image' | 'checklist';
  assigned_to_user_id?: string;
  assigned_to_store_id?: string;
  assigned_to_role?: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  assignment_title: string;
  staff_id: string;
  staff_name: string;
  status: 'submitted' | 'approved' | 'rejected';
  submitted_at: string;
  comment?: string;
  file_url?: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  type: 'new_offer' | 'policy_update' | 'training_reminder' | 'urgent' | 'general';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  require_acknowledgement: boolean;
  expiry_date?: string;
  acknowledgement_count: number;
  created_at: string;
}

export interface CreateAnnouncementPayload {
  title: string;
  description: string;
  type: 'new_offer' | 'policy_update' | 'training_reminder' | 'urgent' | 'general';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  require_acknowledgement: boolean;
  expiry_date?: string;
}

export interface PendingDocument {
  id: string;
  file_name: string;
  file_type: string;
  file_url?: string;
  staff_id: string;
  staff_name: string;
  uploaded_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Target {
  id: string;
  user_id: string;
  staff_name?: string;
  target_type: string;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  target_value: number;
  achieved_value: number;
  achievement_percentage: number;
  start_date: string;
  end_date: string;
  remarks?: string;
  status: string;
}

export interface TargetProgress {
  staff_id: string;
  staff_name: string;
  target_type: string;
  target_value: number;
  achieved_value: number;
  achievement_percentage: number;
  period: string;
}

export interface SetTargetPayload {
  user_id: string;
  target_type: string;
  metric_type: string;
  category: string;
  period_type: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  period_start: string;
  period_end: string;
  target_value: number;
  unit?: string;
}

export interface TargetOut {
  id: string;
  user_id: string;
  target_type: string;
  metric_type: string;
  category: string;
  period_type: string;
  period_start: string;
  period_end: string;
  target_value: number;
  achieved_value: number;
  achievement_percentage: number;
  unit: string;
  status: string;
}

export interface Ticket {
  id: string;
  ticket_type: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  description: string;
  staff_id: string;
  staff_name: string;
  status: 'open' | 'in_progress' | 'resolved' | 'escalated';
  created_at: string;
  comments?: TicketComment[];
}

export interface TicketComment {
  id: string;
  comment: string;
  author_name: string;
  created_at: string;
}

export interface TeamAttendanceReport {
  date: string;
  total_staff: number;
  present: number;
  absent: number;
  late: number;
  staff_attendance: {
    staff_id: string;
    staff_name: string;
    check_in_time?: string;
    check_out_time?: string;
    status: 'present' | 'absent' | 'late';
  }[];
}

export interface LowPerformer {
  staff_id: string;
  staff_name: string;
  designation: string;
  target_percentage: number;
}

export interface PendingApprovalsReport {
  pending_documents: number;
  pending_submissions: number;
  total: number;
}

export interface Checklist {
  id: string;
  title: string;
  description?: string;
  items: { id: string; label: string; required: boolean }[];
  created_at: string;
  status: 'active' | 'inactive';
}

export interface CorrectionRequest {
  id: string;
  user_id: string;
  staff_name?: string;
  attendance_date: string;
  reason: string;
  correction_type?: string;
  requested_check_in: string | null;
  requested_check_out: string | null;
  status: string;
  form_status: string;
  manager_remarks: string | null;
  created_at: string;
}

export interface ManagerDashboard {
  manager: {
    id: string;
    full_name: string;
    email: string;
    store_code: string;
    store_name: string;
    region: string;
  };
  team: {
    team_size: number;
    staff: StaffMember[];
  };
  attendance: {
    present_today: number;
    absent_today: number;
    attendance_percentage: number;
  };
  approvals: {
    total_pending: number;
    pending_documents: number;
    pending_submissions: number;
  };
  targets: {
    average_percentage: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getManagerId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return 'user_002';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return 'user_002'; }
}

async function getStaffUsers() {
  return localDb.getCollection<{
    id: string; role?: string; full_name?: string; employee_code?: string;
    designation?: string; department?: string; store_id?: string;
    store_name?: string; date_of_joining?: string; status?: string;
    mobile?: string; email?: string; attendance_percentage?: number;
    target_percentage?: number; courses_completed?: number; assignments_pending?: number;
    password?: string;
  }>('users');
}

const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_001',
    title: 'Festive Season Sales Target',
    description: 'All staff must aim for 120% of regular monthly target during June festive season. Incentive bonuses apply.',
    type: 'general',
    priority: 'high',
    require_acknowledgement: false,
    acknowledgement_count: 0,
    created_at: '2026-05-20T09:00:00',
  },
  {
    id: 'ann_002',
    title: 'New VM Guidelines Released',
    description: 'Updated visual merchandising standards are now available. All associates must read and acknowledge.',
    type: 'policy_update',
    priority: 'medium',
    require_acknowledgement: true,
    acknowledgement_count: 2,
    created_at: '2026-05-18T10:00:00',
  },
];

// ─── Service ──────────────────────────────────────────────────────────────────

export const managerService = {
  async getDashboard(): Promise<ManagerDashboard> {
    if (APP_MODE === 'offline_apk') {
      const users = await getStaffUsers();
      const manager = users.find((u) => u.role === 'MANAGER');
      const staff = users.filter((u) => u.role === 'STAFF');
      const today = new Date().toISOString().slice(0, 10);
      const attendance = await localDb.getCollection<{ id: string; user_id: string; date: string; check_in_time?: string }>('attendance');
      const todayAtt = attendance.filter((a) => a.date === today);
      const present = todayAtt.filter((a) => a.check_in_time).length;
      const docs = await localDb.getCollection<{ id: string; approval_status?: string }>('documents');
      const pendingDocs = docs.filter((d) => d.approval_status === 'pending').length;
      const assignments = await localDb.getCollection<{ id: string; status?: string }>('assignments');
      const pendingSubs = assignments.filter((a) => a.status === 'submitted').length;
      const targets = await localDb.getCollection<{ id: string; user_id?: string; achievement_percentage?: number }>('targets');
      const staffIds = new Set(staff.map((s) => s.id));
      const staffTargets = targets.filter((t) => staffIds.has(t.user_id ?? ''));
      const avgTarget = staffTargets.length > 0
        ? Math.round(staffTargets.reduce((s, t) => s + (t.achievement_percentage ?? 0), 0) / staffTargets.length)
        : 0;
      return {
        manager: {
          id: manager?.id ?? '',
          full_name: manager?.full_name ?? 'Store Manager',
          email: (manager as any)?.email ?? '',
          store_code: (manager as any)?.store_code ?? 'HT-MUM-001',
          store_name: manager?.store_name ?? 'HomeTown Mumbai Thane',
          region: (manager as any)?.region ?? 'West',
        },
        team: {
          team_size: staff.length,
          staff: staff.map(({ password: _pw, ...s }) => s as unknown as StaffMember),
        },
        attendance: {
          present_today: present,
          absent_today: staff.length - present,
          attendance_percentage: staff.length > 0 ? Math.round((present / staff.length) * 100) : 0,
        },
        approvals: {
          total_pending: pendingDocs + pendingSubs,
          pending_documents: pendingDocs,
          pending_submissions: pendingSubs,
        },
        targets: { average_percentage: avgTarget },
      };
    }
    return api.get<ManagerDashboard>('/manager/dashboard');
  },

  async getTeam(): Promise<StaffMember[]> {
    if (APP_MODE === 'offline_apk') {
      const users = await getStaffUsers();
      return users
        .filter((u) => u.role === 'STAFF')
        .map(({ password: _pw, ...u }) => u as unknown as StaffMember);
    }
    const res = await api.get<{ staff: StaffMember[]; total: number } | StaffMember[]>('/manager/team');
    return Array.isArray(res) ? res : (res as any).staff ?? [];
  },

  async getStaffDetail(id: string): Promise<StaffMemberDetail> {
    if (APP_MODE === 'offline_apk') {
      const users = await getStaffUsers();
      const s = users.find((u) => u.id === id);
      if (!s) return {} as StaffMemberDetail;
      return {
        ...s,
        mobile: (s as any).mobile ?? '',
        email: (s as any).email ?? '',
        stats: {
          attendance_percentage: s.attendance_percentage ?? 0,
          target_percentage: s.target_percentage ?? 0,
          courses_completed: s.courses_completed ?? 0,
          assignments_pending: s.assignments_pending ?? 0,
        },
      } as unknown as StaffMemberDetail;
    }
    return api.get<StaffMemberDetail>(`/manager/team/${id}`);
  },

  async getPendingApprovals(): Promise<PendingApprovalsReport> {
    if (APP_MODE === 'offline_apk') {
      const docs = await localDb.getCollection<{ id: string; approval_status?: string }>('documents');
      const assignments = await localDb.getCollection<{ id: string; status?: string }>('assignments');
      const pendingDocs = docs.filter((d) => d.approval_status === 'pending').length;
      const pendingSubs = assignments.filter((a) => a.status === 'submitted').length;
      return { total: pendingDocs + pendingSubs, pending_documents: pendingDocs, pending_submissions: pendingSubs };
    }
    const data = await api.get<ManagerDashboard>('/manager/dashboard');
    return {
      total: data.approvals?.total_pending ?? 0,
      pending_documents: data.approvals?.pending_documents ?? 0,
      pending_submissions: data.approvals?.pending_submissions ?? 0,
    };
  },

  async getTeamAttendance(): Promise<{ present: number; absent: number; percentage: number }> {
    if (APP_MODE === 'offline_apk') {
      const users = await getStaffUsers();
      const staff = users.filter((u) => u.role === 'STAFF');
      const today = new Date().toISOString().slice(0, 10);
      const attendance = await localDb.getCollection<{ id: string; user_id: string; date: string; check_in_time?: string }>('attendance');
      const present = attendance.filter((a) => a.date === today && a.check_in_time).length;
      return {
        present,
        absent: staff.length - present,
        percentage: staff.length > 0 ? Math.round((present / staff.length) * 100) : 0,
      };
    }
    const data = await api.get<ManagerDashboard>('/manager/dashboard');
    return {
      present: data.attendance?.present_today ?? 0,
      absent: data.attendance?.absent_today ?? 0,
      percentage: data.attendance?.attendance_percentage ?? 0,
    };
  },

  async getTargetProgress(): Promise<TargetProgress[]> {
    if (APP_MODE === 'offline_apk') {
      const users = await getStaffUsers();
      const staff = users.filter((u) => u.role === 'STAFF');
      const targets = await localDb.getCollection<{ id: string; user_id?: string; achievement_percentage?: number }>('targets');
      return staff.map((s) => {
        const st = targets.filter((t) => t.user_id === s.id);
        const avg = st.length > 0 ? Math.round(st.reduce((acc, t) => acc + (t.achievement_percentage ?? 0), 0) / st.length) : 0;
        return { staff_id: s.id, staff_name: s.full_name ?? '', target_type: 'sales', target_value: 100, achieved_value: avg, achievement_percentage: avg, period: 'monthly' };
      });
    }
    const team = await api.get<StaffMember[]>('/manager/team');
    return team.map((s: any) => ({
      staff_id: s.id, staff_name: s.full_name, achievement_percentage: s.target_percentage ?? 0,
      target_value: 0, achieved_value: 0, period: 'monthly', target_type: 'sales',
    }));
  },

  // Assignments
  async createAssignment(data: CreateAssignmentPayload): Promise<Assignment> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getManagerId();
      const item = {
        id: localDb.generateId('asn'),
        assign_to: data.assigned_to_user_id ?? 'entire_store',
        assigned_to_user_id: data.assigned_to_user_id,
        assigned_by_id: uid,
        status: 'assigned',
        created_at: new Date().toISOString(),
        ...data,
      };
      return localDb.addItem('assignments', item as never) as Promise<Assignment>;
    }
    return api.post<Assignment>('/manager/assignments', data);
  },

  async getAssignments(): Promise<Assignment[]> {
    if (APP_MODE === 'offline_apk') {
      return localDb.getCollection<Assignment>('assignments');
    }
    return api.get<Assignment[]>('/manager/assignments');
  },

  async getSubmissions(): Promise<AssignmentSubmission[]> {
    if (APP_MODE === 'offline_apk') {
      const assignments = await localDb.getCollection<any>('assignments');
      const users = await getStaffUsers();
      return assignments
        .filter((a: any) => a.status === 'submitted')
        .map((a: any) => ({
          id: a.id,
          assignment_id: a.id,
          assignment_title: a.title ?? '',
          staff_id: a.assigned_to_user_id ?? '',
          staff_name: users.find((u) => u.id === a.assigned_to_user_id)?.full_name ?? '',
          status: 'submitted' as const,
          submitted_at: a.updated_at ?? a.created_at ?? new Date().toISOString(),
          comment: a.submission_text,
          file_url: a.file_url,
        }));
    }
    return api.get<AssignmentSubmission[]>('/manager/assignment-submissions');
  },

  async approveSubmission(id: string): Promise<void> {
    if (APP_MODE === 'offline_apk') {
      await localDb.updateItem('assignments', id, { status: 'approved' } as never);
      return;
    }
    await api.post(`/manager/assignment-submissions/${id}/approve`, {});
  },

  async rejectSubmission(id: string, remarks: string): Promise<void> {
    if (APP_MODE === 'offline_apk') {
      await localDb.updateItem('assignments', id, { status: 'rejected', manager_remarks: remarks } as never);
      return;
    }
    await api.post(`/manager/assignment-submissions/${id}/reject`, { remarks });
  },

  // Announcements
  async createAnnouncement(data: CreateAnnouncementPayload): Promise<Announcement> {
    if (APP_MODE === 'offline_apk') {
      return {
        id: localDb.generateId('ann'),
        acknowledgement_count: 0,
        created_at: new Date().toISOString(),
        ...data,
      };
    }
    return api.post<Announcement>('/manager/announcements', data);
  },

  async getAnnouncements(): Promise<Announcement[]> {
    if (APP_MODE === 'offline_apk') return SEED_ANNOUNCEMENTS;
    return api.get<Announcement[]>('/manager/announcements');
  },

  // Documents
  async getPendingDocuments(): Promise<PendingDocument[]> {
    if (APP_MODE === 'offline_apk') {
      const docs = await localDb.getCollection<any>('documents');
      const users = await getStaffUsers();
      return docs
        .filter((d: any) => d.approval_status === 'pending')
        .map((d: any) => ({
          id: d.id,
          file_name: d.file_name ?? 'document.pdf',
          file_type: d.file_type ?? 'pdf',
          file_url: d.file_url,
          staff_id: d.user_id ?? '',
          staff_name: users.find((u) => u.id === d.user_id)?.full_name ?? '',
          uploaded_at: d.created_at ?? new Date().toISOString(),
          status: 'pending' as const,
        }));
    }
    return api.get<PendingDocument[]>('/manager/documents/pending');
  },

  async approveDocument(id: string): Promise<void> {
    if (APP_MODE === 'offline_apk') {
      await localDb.updateItem('documents', id, { approval_status: 'approved' } as never);
      return;
    }
    await api.post(`/manager/documents/${id}/approve`, {});
  },

  async rejectDocument(id: string, reason: string): Promise<void> {
    if (APP_MODE === 'offline_apk') {
      await localDb.updateItem('documents', id, { approval_status: 'rejected', rejection_reason: reason } as never);
      return;
    }
    await api.post(`/manager/documents/${id}/reject`, { reason });
  },

  // Targets
  async setTarget(data: SetTargetPayload): Promise<TargetOut> {
    if (APP_MODE === 'offline_apk') {
      const item: TargetOut = {
        id: localDb.generateId('tgt'),
        achieved_value: 0,
        achievement_percentage: 0,
        unit: data.unit ?? '%',
        status: 'in_progress',
        ...data,
      };
      return localDb.addItem('targets', item as never) as Promise<TargetOut>;
    }
    return api.post<TargetOut>('/manager/targets', data);
  },

  async getTargets(): Promise<Target[]> {
    if (APP_MODE === 'offline_apk') {
      return localDb.getCollection<Target>('targets');
    }
    return api.get<Target[]>('/manager/targets');
  },

  async getRawTargetProgress(): Promise<TargetProgress[]> {
    return managerService.getTargetProgress();
  },

  async updateTargetAchieved(targetId: string, achieved_value: number): Promise<Target> {
    if (APP_MODE === 'offline_apk') {
      const existing = await localDb.findById<any>('targets', targetId);
      const targetVal = existing?.target_value ?? 100;
      const pct = Math.round((achieved_value / targetVal) * 100);
      const updated = await localDb.updateItem<any>('targets', targetId, { achieved_value, achievement_percentage: pct });
      return updated as Target;
    }
    return api.put<Target>(`/admin/targets/${targetId}`, { achieved_value });
  },

  // Tickets
  async getTickets(): Promise<Ticket[]> {
    if (APP_MODE === 'offline_apk') {
      const tickets = await localDb.getCollection<any>('tickets');
      const users = await getStaffUsers();
      return tickets.map((t: any) => ({
        ...t,
        staff_id: t.raised_by ?? t.staff_id ?? '',
        staff_name: users.find((u) => u.id === (t.raised_by ?? t.staff_id))?.full_name ?? '',
      })) as Ticket[];
    }
    return api.get<Ticket[]>('/manager/tickets');
  },

  async updateTicketStatus(id: string, status: string): Promise<void> {
    if (APP_MODE === 'offline_apk') {
      await localDb.updateItem('tickets', id, { status } as never);
      return;
    }
    await api.put(`/manager/tickets/${id}/status`, { status });
  },

  async addTicketComment(id: string, comment: string): Promise<void> {
    if (APP_MODE === 'offline_apk') {
      const ticket = await localDb.findById<any>('tickets', id);
      const comments = ticket?.comments ?? [];
      comments.push({ id: localDb.generateId('cmt'), comment, author_name: 'Manager', created_at: new Date().toISOString() });
      await localDb.updateItem('tickets', id, { comments } as never);
      return;
    }
    await api.post(`/manager/tickets/${id}/comments`, { comment });
  },

  // Reports
  async getTeamAttendanceReport(): Promise<TeamAttendanceReport> {
    if (APP_MODE === 'offline_apk') {
      const today = new Date().toISOString().slice(0, 10);
      const users = await getStaffUsers();
      const staff = users.filter((u) => u.role === 'STAFF');
      const attendance = await localDb.getCollection<{ id: string; user_id: string; date: string; check_in_time?: string; check_out_time?: string }>('attendance');
      const todayAtt = attendance.filter((a) => a.date === today);
      return {
        date: today,
        total_staff: staff.length,
        present: todayAtt.filter((a) => a.check_in_time).length,
        absent: staff.filter((s) => !todayAtt.find((a) => a.user_id === s.id && a.check_in_time)).length,
        late: 0,
        staff_attendance: staff.map((s) => {
          const att = todayAtt.find((a) => a.user_id === s.id);
          return {
            staff_id: s.id,
            staff_name: s.full_name ?? '',
            check_in_time: att?.check_in_time,
            check_out_time: att?.check_out_time,
            status: att?.check_in_time ? ('present' as const) : ('absent' as const),
          };
        }),
      };
    }
    return api.get<TeamAttendanceReport>('/manager/reports/team-attendance');
  },

  async getLowPerformers(): Promise<LowPerformer[]> {
    if (APP_MODE === 'offline_apk') {
      const users = await getStaffUsers();
      return users
        .filter((u) => u.role === 'STAFF' && (u.target_percentage ?? 100) < 60)
        .map((u) => ({
          staff_id: u.id,
          staff_name: u.full_name ?? '',
          designation: u.designation ?? '',
          target_percentage: u.target_percentage ?? 0,
        }));
    }
    return api.get<LowPerformer[]>('/manager/reports/low-performers');
  },

  // Checklists
  async getChecklists(): Promise<Checklist[]> {
    if (APP_MODE === 'offline_apk') {
      return localDb.getCollection<Checklist>('checklists');
    }
    return api.get<Checklist[]>('/manager/checklists');
  },

  // Attendance corrections
  async getCorrectionRequests(): Promise<CorrectionRequest[]> {
    if (APP_MODE === 'offline_apk') {
      const data = await localDb.getCollection<{ leave_requests?: unknown[]; attendance_corrections?: CorrectionRequest[] }>('approvals');
      return (data[0]?.attendance_corrections ?? []) as CorrectionRequest[];
    }
    return api.get<CorrectionRequest[]>('/attendance/manager/correction-requests');
  },

  async approveCorrectionRequest(id: string): Promise<void> {
    if (APP_MODE === 'offline_apk') {
      const data = await localDb.getCollection<any>('approvals');
      const d = data[0] ?? {};
      const corrections = (d.attendance_corrections ?? []).map((c: any) =>
        c.id === id ? { ...c, status: 'approved', form_status: 'approved', manager_remarks: 'Approved' } : c,
      );
      await localDb.setCollection('approvals', [{ ...d, attendance_corrections: corrections }]);
      return;
    }
    await api.post(`/attendance/manager/correction-requests/${id}/approve`, {});
  },

  async rejectCorrectionRequest(id: string, remarks: string): Promise<void> {
    if (APP_MODE === 'offline_apk') {
      const data = await localDb.getCollection<any>('approvals');
      const d = data[0] ?? {};
      const corrections = (d.attendance_corrections ?? []).map((c: any) =>
        c.id === id ? { ...c, status: 'rejected', form_status: 'rejected', manager_remarks: remarks } : c,
      );
      await localDb.setCollection('approvals', [{ ...d, attendance_corrections: corrections }]);
      return;
    }
    await api.post(`/attendance/manager/correction-requests/${id}/reject`, { remarks });
  },

  // ─── Admin Manager Management (admin dashboard use only) ──────────────────

  getAdminManagers() {
    return api.get<(Manager & { store: Record<string, unknown> | null; team_count: number; mapping_status: string })[]>('/admin/managers');
  },

  getAdminManager(managerId: string) {
    return api.get<{ manager: Manager; store: Record<string, unknown> | null; team_count: number; team: Record<string, unknown>[] }>(`/admin/managers/${managerId}`);
  },

  createAdminManager(payload: {
    full_name: string; email: string; mobile?: string | null; password?: string;
    employee_code?: string | null; department?: string; designation?: string;
    store_id?: string | null; store_code?: string | null; status?: string;
  }) {
    return api.post<Manager>('/admin/managers', payload);
  },

  updateAdminManager(managerId: string, payload: Partial<Manager>) {
    return api.put<Manager>(`/admin/managers/${managerId}`, payload);
  },

  deactivateAdminManager(managerId: string) {
    return api.delete<Manager>(`/admin/managers/${managerId}`);
  },

  assignAdminManagerStore(managerId: string, storeId: string) {
    return api.post<Manager>(`/admin/managers/${managerId}/assign-store`, { store_id: storeId });
  },

  resetAdminManagerPassword(managerId: string, newPassword: string) {
    return api.post<{ message: string; manager_id: string }>(`/admin/managers/${managerId}/reset-password`, { new_password: newPassword });
  },

  getAdminManagerSummary(managerId: string) {
    return api.get<{
      manager: Manager; store: Record<string, unknown> | null;
      team_count: number; department_counts: Record<string, number>;
      summary: Record<string, number>; team: Record<string, unknown>[];
    }>(`/admin/managers/${managerId}/summary`);
  },

  getAdminManagerTeam(managerId: string) {
    return api.get<Record<string, unknown>[]>(`/admin/managers/${managerId}/team`);
  },

  getAdminManagerStore(managerId: string) {
    return api.get<Record<string, unknown> | null>(`/admin/managers/${managerId}/store`);
  },

  getAdminManagerActions(managerId: string) {
    return api.get<Record<string, unknown>[]>(`/admin/managers/${managerId}/actions`);
  },

  // Reminders
  async createReminder(data: { title: string; message?: string; remind_at: string; reminder_type?: string }): Promise<void> {
    if (APP_MODE === 'offline_apk') {
      const item = {
        id: localDb.generateId('rem'),
        title: data.title,
        message: data.message ?? null,
        reminder_type: data.reminder_type ?? 'general',
        remind_at: data.remind_at,
        created_at: new Date().toISOString(),
      };
      await localDb.addItem('reminders', item as never);
      return;
    }
    await api.post('/reminders', data);
  },
};
