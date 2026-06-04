export type NotificationAudience = 'staff' | 'manager' | 'store' | 'individual';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationType =
  | 'assignment' | 'course' | 'quiz' | 'checklist'
  | 'attendance' | 'approval' | 'ticket' | 'announcement'
  | 'performance_alert' | 'coaching' | 'reward' | 'certificate'
  | 'report' | 'reminder' | 'system' | 'general';

export type NotificationItem = {
  id: string;
  recipient_id: string;
  recipient_name?: string;
  recipient_role?: string;
  recipient_email?: string;
  store_code?: string;
  store_id?: string;
  store_name?: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  priority: NotificationPriority;
  action_label?: string | null;
  action_route?: string | null;
  source_module?: string | null;
  source_id?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
};

export type NotificationCreatePayload = {
  title: string;
  message: string;
  notification_type: NotificationType;
  priority: NotificationPriority;
  audience: NotificationAudience;
  recipient_ids: string[];
  action_label?: string | null;
  action_route?: string | null;
  source_module?: string | null;
  source_id?: string | null;
};

export type ReminderCategory =
  | 'Training Reminder' | 'Target Follow-up' | 'Checklist Reminder'
  | 'Document Reminder' | 'Attendance Reminder' | 'Customer Follow-up'
  | 'Store Operations' | 'Compliance' | 'General';

export type ReminderStatus = 'pending' | 'completed' | 'overdue';

export type Reminder = {
  id: string;
  title: string;
  description: string;
  category: ReminderCategory;
  priority: NotificationPriority;
  due_date: string;
  due_time?: string | null;
  assigned_to: string;
  assigned_to_name?: string;
  assigned_to_email?: string;
  employee_code?: string;
  store_code?: string;
  store_id?: string;
  store_name?: string;
  action_route?: string | null;
  status: ReminderStatus;
  completed_at?: string | null;
  completion_note?: string | null;
  created_by?: string;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
};

export type ReminderCreatePayload = {
  title: string;
  description: string;
  category: ReminderCategory;
  priority: NotificationPriority;
  due_date: string;
  due_time?: string | null;
  assigned_to: string[];
  action_route?: string | null;
};

export type ReminderSummary = {
  total: number;
  pending: number;
  completed: number;
  urgent: number;
};
