import type { User } from './auth.types';
import type { Store } from './store.types';

export type StaffDashboardResponse = {
  user: {
    id: string;
    full_name: string;
    email: string;
    designation?: string;
    department?: string;
    employee_code?: string;
    store_code?: string;
    store_name?: string;
    city?: string;
    region?: string;
    reporting_manager_id?: string;
    reporting_manager?: string;
    reporting_manager_email?: string;
  };

  attendance: {
    today_status: string;
    check_in: string | null;
    check_out: string | null;
    monthly_percentage: number;
  };

  assignments: {
    pending: number;
    submitted: number;
    approved: number;
    overdue: number;
  };

  targets: {
    active: number;
    average_percentage: number;
    target_value?: number;
    achieved_value?: number;
  };

  courses: {
    completed: number;
    total: number;
    percentage: number;
  };

  quizzes: {
    pending: number;
    completed: number;
    average_score: number;
  };

  documents: {
    pending: number;
    approved: number;
    rejected: number;
  };

  todos: {
    pending: number;
  };

  tickets?: {
    open: number;
  };

  alerts?: {
    unread: number;
  };

  announcements: Array<{
    id: string;
    title: string;
    description?: string;
    priority?: string;
    type?: string;
  }>;

  reminders: Array<{
    id: string;
    title: string;
    message?: string;
    scheduled_at?: string;
  }>;
};

export type ManagerDashboardResponse = {
  manager: {
    id: string;
    full_name: string;
    email: string;
    employee_code?: string;
    designation?: string;
    department?: string;
    store_code?: string;
    store_id?: string;
    store_name?: string;
    city?: string;
    state?: string;
    region?: string;
  };

  team: {
    team_size: number;
    active_staff: number;
    staff_preview?: any[];
  };

  attendance: {
    present_today: number;
    absent_today: number;
    late_today: number;
    attendance_percentage: number;
    latest?: any[];
  };

  approvals: {
    total_pending: number;
    assignment_submissions: number;
    documents: number;
    attendance_corrections: number;
    leave_requests: number;
    latest_assignment_submissions?: any[];
    latest_documents?: any[];
    latest_attendance_corrections?: any[];
  };

  targets: {
    average_percentage: number;
    low_performers: number;
    top_performers: number;
    latest?: any[];
  };

  assignments: {
    active: number;
    total: number;
    submitted_pending_review: number;
    approved_submissions: number;
    rejected_submissions: number;
    overdue: number;
    latest?: any[];
  };

  quizzes: {
    active: number;
    total: number;
    attempts_today: number;
    total_attempts: number;
    average_score: number;
    latest?: any[];
    latest_attempts?: any[];
  };

  tickets: {
    total: number;
    open: number;
    urgent: number;
    latest?: any[];
  };

  checklists: {
    active: number;
    total: number;
    responses_today: number;
    total_responses: number;
    latest?: any[];
    latest_responses?: any[];
  };

  announcements: {
    active: number;
    total: number;
    pending_acknowledgements: number;
    latest?: any[];
  };

  reminders: {
    active: number;
    total: number;
    latest?: any[];
  };

  alerts: {
    unread: number;
    latest?: any[];
  };
};

export type ManagerTeamResponse = {
  manager: User;
  store: Partial<Store>;
  summary?: {
    total: number;
    active: number;
    inactive: number;
  };
  total: number;
  staff: User[];
};
