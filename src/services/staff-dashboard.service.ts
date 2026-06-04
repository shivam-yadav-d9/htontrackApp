import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type { StaffDashboardResponse } from '@/types/dashboard.types';
import { storage } from '@/utils/storage';

export type { StaffDashboardResponse };
export type StaffDashboard = StaffDashboardResponse;
export type StaffDashboardUser = StaffDashboardResponse['user'];

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

export const staffDashboardService = {
  async getDashboard(): Promise<StaffDashboardResponse> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const [users, assignments, courses, quizzes, attendance, docs, reminders, notifications] = await Promise.all([
        localDb.getCollection<{ id: string; full_name: string; email: string; designation?: string; department?: string; employee_code?: string; store_code?: string; store_name?: string; city?: string; region?: string; reporting_manager?: string }>('users'),
        localDb.getCollection<{ id: string; assigned_to_user_id?: string; status?: string }>('assignments'),
        localDb.getCollection<{ id: string; assigned_to?: string; status?: string; progress_percentage?: number }>('courses'),
        localDb.getCollection<{ id: string; attempts_used?: number }>('quizzes'),
        localDb.getCollection<{ id: string; user_id: string; date?: string; status?: string; check_in_time?: string | null; check_out_time?: string | null }>('attendance'),
        localDb.getCollection<{ id: string; user_id?: string; approval_status?: string; form_status?: string }>('documents'),
        localDb.getCollection<{ id: string; status?: string; title?: string; due_date?: string }>('reminders'),
        localDb.getCollection<{ id: string; recipient_id?: string; is_read?: boolean; title?: string; notification_type?: string; priority?: string }>('notifications'),
      ]);

      const user = users.find((u) => u.id === uid);
      const myAssignments = assignments.filter((a) => a.assigned_to_user_id === uid);
      const myAttendance = attendance.filter((a) => a.user_id === uid);
      const today = new Date().toISOString().slice(0, 10);
      const todayAtt = myAttendance.find((a) => a.date === today);
      const presentDays = myAttendance.filter((a) => ['present', 'late'].includes(a.status ?? '')).length;
      const totalDays = myAttendance.length;
      const myCourses = courses.filter((c) => !c.assigned_to || c.assigned_to === uid);
      const myDocs = docs.filter((d) => !d.user_id || d.user_id === uid);

      return {
        user: {
          id: uid,
          full_name: user?.full_name ?? '',
          email: user?.email ?? '',
          designation: user?.designation,
          department: user?.department,
          employee_code: user?.employee_code,
          store_code: user?.store_code,
          store_name: user?.store_name,
          city: user?.city,
          reporting_manager: user?.reporting_manager,
        },
        attendance: {
          today_status: todayAtt?.status ?? 'absent',
          check_in: todayAtt?.check_in_time ?? null,
          check_out: todayAtt?.check_out_time ?? null,
          monthly_percentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
        },
        assignments: {
          pending: myAssignments.filter((a) => a.status === 'assigned').length,
          submitted: myAssignments.filter((a) => a.status === 'submitted').length,
          approved: myAssignments.filter((a) => a.status === 'approved').length,
          overdue: myAssignments.filter((a) => a.status === 'overdue').length,
        },
        targets: { active: 5, average_percentage: 68 },
        courses: {
          completed: myCourses.filter((c) => c.status === 'completed').length,
          total: myCourses.length,
          percentage: myCourses.length > 0 ? Math.round(myCourses.reduce((s, c) => s + (c.progress_percentage ?? 0), 0) / myCourses.length) : 0,
        },
        quizzes: { pending: quizzes.filter((q) => (q.attempts_used ?? 0) === 0).length, completed: quizzes.filter((q) => (q.attempts_used ?? 0) > 0).length, average_score: 0 },
        documents: { pending: myDocs.filter((d) => d.approval_status === 'pending').length, approved: myDocs.filter((d) => d.approval_status === 'approved').length, rejected: myDocs.filter((d) => d.approval_status === 'rejected').length },
        todos: { pending: 0 },
        tickets: { open: 0 },
        alerts: { unread: notifications.filter((n) => !n.is_read && (!n.recipient_id || n.recipient_id === uid)).length },
        announcements: [],
        reminders: reminders.filter((r) => r.status === 'pending').slice(0, 3).map((r) => ({ id: r.id, title: r.title ?? '', scheduled_at: r.due_date })),
      };
    }
    return api.get<StaffDashboardResponse>('/staff/dashboard');
  },

  async getAttendanceAlerts(): Promise<any[]> {
    if (APP_MODE === 'offline_apk') return [];
    return api.get<any[]>('/staff/attendance/alerts');
  },

  async replyToAlert(alertId: string, reply: string): Promise<any> {
    if (APP_MODE === 'offline_apk') return {};
    return api.post(`/attendance/alerts/${alertId}/reply`, { reply });
  },

  async getTargetNotifications(): Promise<any[]> {
    if (APP_MODE === 'offline_apk') return [];
    return api.get<any[]>('/staff/target/notifications');
  },

  async markTargetNotificationRead(notifId: string): Promise<void> {
    if (APP_MODE === 'offline_apk') return;
    await api.post(`/target/notifications/${notifId}/read`, {});
  },
};
