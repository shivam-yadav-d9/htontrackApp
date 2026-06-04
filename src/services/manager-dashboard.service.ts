import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type { ManagerDashboardResponse } from '@/types/dashboard.types';

export type { ManagerDashboardResponse };

export const managerDashboardService = {
  async getDashboard(): Promise<ManagerDashboardResponse> {
    if (APP_MODE === 'offline_apk') {
      const [users, assignments, attendance, docs, tickets, checklists, reminders, notifications] = await Promise.all([
        localDb.getCollection<{ id: string; full_name: string; email: string; role?: string; employee_code?: string; designation?: string; department?: string; store_code?: string; store_id?: string; store_name?: string; city?: string; state?: string; region?: string }>('users'),
        localDb.getCollection<{ id: string; status?: string }>('assignments'),
        localDb.getCollection<{ id: string; user_id: string; date?: string; status?: string }>('attendance'),
        localDb.getCollection<{ id: string; approval_status?: string }>('documents'),
        localDb.getCollection<{ id: string; status?: string; priority?: string }>('tickets'),
        localDb.getCollection<{ id: string; status?: string }>('checklists'),
        localDb.getCollection<{ id: string; status?: string }>('reminders'),
        localDb.getCollection<{ id: string; is_read?: boolean }>('notifications'),
      ]);

      const manager = users.find((u) => u.role === 'MANAGER');
      const staff = users.filter((u) => u.role === 'STAFF');
      const today = new Date().toISOString().slice(0, 10);
      const todayAtt = attendance.filter((a) => a.date === today);
      const presentToday = todayAtt.filter((a) => ['present', 'late'].includes(a.status ?? '')).length;

      return {
        manager: { id: manager?.id ?? '', full_name: manager?.full_name ?? '', email: manager?.email ?? '', employee_code: manager?.employee_code, designation: manager?.designation, department: manager?.department, store_code: manager?.store_code, store_id: manager?.store_id, store_name: manager?.store_name, city: manager?.city, state: manager?.state, region: manager?.region },
        team: { team_size: staff.length, active_staff: staff.length },
        attendance: { present_today: presentToday, absent_today: staff.length - presentToday, late_today: todayAtt.filter((a) => a.status === 'late').length, attendance_percentage: staff.length > 0 ? Math.round((presentToday / staff.length) * 100) : 0 },
        approvals: { total_pending: docs.filter((d) => d.approval_status === 'pending').length + assignments.filter((a) => a.status === 'submitted').length, assignment_submissions: assignments.filter((a) => a.status === 'submitted').length, documents: docs.filter((d) => d.approval_status === 'pending').length, attendance_corrections: 0, leave_requests: 0 },
        targets: { average_percentage: 63, low_performers: 1, top_performers: 1 },
        assignments: { active: assignments.filter((a) => a.status === 'assigned').length, total: assignments.length, submitted_pending_review: assignments.filter((a) => a.status === 'submitted').length, approved_submissions: assignments.filter((a) => a.status === 'approved').length, rejected_submissions: assignments.filter((a) => a.status === 'rejected').length, overdue: assignments.filter((a) => a.status === 'overdue').length },
        quizzes: { active: 0, total: 0, attempts_today: 0, total_attempts: 0, average_score: 0 },
        tickets: { total: tickets.length, open: tickets.filter((t) => t.status === 'open').length, urgent: tickets.filter((t) => t.priority === 'high').length },
        checklists: { active: checklists.length, total: checklists.length, responses_today: 0, total_responses: 0 },
        announcements: { active: 0, total: 0, pending_acknowledgements: 0 },
        reminders: { active: reminders.filter((r) => r.status === 'pending').length, total: reminders.length },
        alerts: { unread: notifications.filter((n) => !n.is_read).length },
      };
    }
    return api.get<ManagerDashboardResponse>('/manager/dashboard');
  },

  async getAttendanceAlerts(): Promise<any[]> {
    if (APP_MODE === 'offline_apk') return [];
    return api.get<any[]>('/manager/attendance/alerts');
  },

  async replyToAlert(alertId: string, reply: string): Promise<any> {
    if (APP_MODE === 'offline_apk') return {};
    return api.post(`/attendance/alerts/${alertId}/manager-reply`, { reply });
  },

  async getTargetNotifications(): Promise<any[]> {
    if (APP_MODE === 'offline_apk') return [];
    return api.get<any[]>('/manager/target/notifications');
  },

  async markTargetNotificationRead(notifId: string): Promise<void> {
    if (APP_MODE === 'offline_apk') return;
    await api.post(`/target/notifications/${notifId}/read`, {});
  },
};
