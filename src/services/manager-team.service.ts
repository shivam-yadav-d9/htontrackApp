import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type { User } from '@/types/auth.types';
import type { ManagerTeamResponse } from '@/types/dashboard.types';

export type { ManagerTeamResponse };
export type TeamMember = User;

export type TeamMemberProfileResponse = {
  staff: User;
  manager: User;
  summary?: {
    assignments_total: number;
    assignment_submissions: number;
    assignment_approved: number;
    quizzes_total: number;
    quiz_attempts: number;
    average_quiz_score: number;
    targets_total: number;
    target_percentage: number;
    attendance_records: number;
    documents_total: number;
    documents_pending: number;
    tickets_total: number;
    tickets_open: number;
  };
  recent?: {
    assignments: unknown[];
    submissions: unknown[];
    quiz_attempts: unknown[];
    targets: unknown[];
    attendance: unknown[];
    documents: unknown[];
    tickets: unknown[];
  };
};

export type DepartmentGroup = {
  department: string;
  staff: User[];
};

export type StoreTeamGroup = {
  store_code: string;
  store_name: string;
  city: string;
  state: string;
  zone: string;
  managers: User[];
  departments: DepartmentGroup[];
  staff_count: number;
};

export type GroupedTeamResponse = {
  stores: StoreTeamGroup[];
  total_stores: number;
  total_staff: number;
  total_managers: number;
};

export type ManagerTeamSummary = {
  manager_id: string;
  manager_name: string;
  store_id: string;
  store_code: string;
  store_name: string;
  staff_count: number;
  department_counts: Record<string, number>;
  role_counts: Record<string, number>;
  staff: User[];
};

export type AddTeamMemberPayload = {
  full_name: string;
  email: string;
  mobile?: string;
  department: string;
  designation: string;
  password?: string;
};

export type UpdateTeamMemberPayload = {
  full_name?: string;
  mobile?: string;
  department?: string;
  designation?: string;
  status?: 'active' | 'inactive';
  attendance_percentage?: number;
  target_percentage?: number;
  courses_completed?: number;
  courses_total?: number;
};

export const managerTeamService = {
  async getTeam(): Promise<ManagerTeamResponse> {
    if (APP_MODE === 'offline_apk') {
      const users = await localDb.getCollection<User & { role?: string; password?: string }>('users');
      const manager = users.find((u) => u.role === 'MANAGER') as User;
      const staff = users.filter((u) => u.role === 'STAFF').map(({ password: _pw, ...u }) => u as User);
      return {
        manager: manager ?? ({} as User),
        store: { store_code: 'HT-MUM-001', store_name: 'HomeTown Mumbai Thane' } as never,
        summary: { total: staff.length, active: staff.length, inactive: 0 },
        total: staff.length,
        staff,
      };
    }
    return api.get<ManagerTeamResponse>('/manager/team');
  },

  async getTeamMember(staffId: string): Promise<TeamMemberProfileResponse> {
    if (APP_MODE === 'offline_apk') {
      const users = await localDb.getCollection<User & { role?: string; password?: string }>('users');
      const staff = users.find((u) => u.id === staffId) as User;
      const manager = users.find((u) => u.role === 'MANAGER') as User;
      const [assignments, quizzes, targets, attendance, docs, tickets] = await Promise.all([
        localDb.getCollection<{ id: string; assigned_to_user_id?: string; status?: string }>('assignments'),
        localDb.getCollection<{ id: string; attempts_used?: number }>('quizzes'),
        localDb.getCollection<{ id: string; user_id?: string; achievement_percentage?: number }>('targets'),
        localDb.getCollection<{ id: string; user_id: string }>('attendance'),
        localDb.getCollection<{ id: string; user_id?: string; approval_status?: string }>('documents'),
        localDb.getCollection<{ id: string; raised_by?: string; status?: string }>('tickets'),
      ]);
      const myA = assignments.filter((a) => a.assigned_to_user_id === staffId);
      const myT = targets.filter((t) => t.user_id === staffId);
      return {
        staff: staff ?? ({} as User),
        manager: manager ?? ({} as User),
        summary: {
          assignments_total: myA.length,
          assignment_submissions: myA.filter((a) => a.status === 'submitted').length,
          assignment_approved: myA.filter((a) => a.status === 'approved').length,
          quizzes_total: quizzes.length,
          quiz_attempts: quizzes.filter((q) => (q.attempts_used ?? 0) > 0).length,
          average_quiz_score: 0,
          targets_total: myT.length,
          target_percentage: myT.length > 0 ? Math.round(myT.reduce((s, t) => s + (t.achievement_percentage ?? 0), 0) / myT.length) : 0,
          attendance_records: attendance.filter((a) => a.user_id === staffId).length,
          documents_total: docs.filter((d) => d.user_id === staffId).length,
          documents_pending: docs.filter((d) => d.user_id === staffId && d.approval_status === 'pending').length,
          tickets_total: tickets.filter((t) => t.raised_by === staffId).length,
          tickets_open: tickets.filter((t) => t.raised_by === staffId && t.status === 'open').length,
        },
        recent: { assignments: [], submissions: [], quiz_attempts: [], targets: [], attendance: [], documents: [], tickets: [] },
      };
    }
    return api.get<TeamMemberProfileResponse>(`/manager/team/${staffId}`);
  },

  async updateTeamMember(staffId: string, payload: UpdateTeamMemberPayload) {
    if (APP_MODE === 'offline_apk') {
      const updated = await localDb.updateItem<User>('users', staffId, payload as Partial<User>);
      return { message: 'Updated', staff: updated! };
    }
    return api.put<{ message: string; staff: User }>(`/manager/team/${staffId}`, payload);
  },

  async getTeamGrouped(): Promise<GroupedTeamResponse> {
    if (APP_MODE === 'offline_apk') {
      const users = await localDb.getCollection<User & { role?: string; password?: string }>('users');
      const managers = users.filter((u) => u.role === 'MANAGER') as User[];
      const staff = users.filter((u) => u.role === 'STAFF') as User[];
      const deptMap: Record<string, User[]> = {};
      staff.forEach((u) => {
        const dept = (u as any).department || 'Other';
        deptMap[dept] = deptMap[dept] ?? [];
        deptMap[dept].push(u);
      });
      const store: StoreTeamGroup = {
        store_code: (managers[0] as any)?.store_code ?? 'HT-MUM-001',
        store_name: (managers[0] as any)?.store_name ?? 'HomeTown Store',
        city: (managers[0] as any)?.city ?? '',
        state: (managers[0] as any)?.state ?? '',
        zone: (managers[0] as any)?.zone ?? '',
        managers,
        departments: Object.entries(deptMap).map(([department, s]) => ({ department, staff: s })),
        staff_count: staff.length,
      };
      return { stores: [store], total_stores: 1, total_staff: staff.length, total_managers: managers.length };
    }
    return api.get<GroupedTeamResponse>('/manager/team/grouped');
  },

  async getTeamSummary(): Promise<ManagerTeamSummary> {
    if (APP_MODE === 'offline_apk') {
      const users = await localDb.getCollection<User & { role?: string }>('users');
      const manager = users.find((u) => u.role === 'MANAGER') as User;
      const staff = users.filter((u) => u.role === 'STAFF') as User[];
      return {
        manager_id: manager?.id ?? '',
        manager_name: manager?.full_name ?? '',
        store_id: manager?.store_id ?? '',
        store_code: manager?.store_code ?? '',
        store_name: manager?.store_name ?? '',
        staff_count: staff.length,
        department_counts: {},
        role_counts: {},
        staff,
      };
    }
    return api.get<ManagerTeamSummary>('/manager/team/summary');
  },

  async addTeamMember(payload: AddTeamMemberPayload) {
    if (APP_MODE === 'offline_apk') {
      const item = {
        id: localDb.generateId('user'),
        role: 'STAFF',
        status: 'active',
        is_active: true,
        store_code: 'HT-MUM-001',
        store_name: 'HomeTown Mumbai Thane',
        password: payload.password ?? 'staff123',
        ...payload,
      } as User;
      const added = await localDb.addItem('users', item);
      return { message: 'Staff added', staff: added, login: { email: payload.email, password: payload.password ?? 'staff123' } };
    }
    return api.post<{ message: string; staff: User; login: { email: string; password: string } }>('/manager/team', payload);
  },
};
