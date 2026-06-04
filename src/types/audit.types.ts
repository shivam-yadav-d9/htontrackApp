export type AuditSeverity = 'info' | 'warning' | 'critical';

export type AuditModule =
  | 'auth' | 'assignments' | 'courses' | 'quizzes' | 'attendance'
  | 'targets' | 'documents' | 'tickets' | 'communications' | 'checklists'
  | 'approvals' | 'skills' | 'performance_alerts' | 'coaching' | 'rewards'
  | 'reports' | 'notifications' | 'reminders' | 'audit' | 'system' | 'general';

export type AuditLog = {
  id: string;
  actor_id?: string;
  actor_name?: string;
  actor_email?: string;
  actor_role?: 'STAFF' | 'MANAGER' | string;
  store_code?: string;
  store_id?: string;
  store_name?: string;
  action: string;
  module: AuditModule;
  description: string;
  entity_id?: string | null;
  entity_type?: string | null;
  target_user_id?: string | null;
  target_user_name?: string | null;
  severity: AuditSeverity;
  metadata?: Record<string, any>;
  event_time?: string;
  created_at?: string;
  updated_at?: string;
};

export type AuditLogPayload = {
  action: string;
  module: AuditModule;
  description: string;
  entity_id?: string | null;
  entity_type?: string | null;
  target_user_id?: string | null;
  target_user_name?: string | null;
  severity: AuditSeverity;
  metadata?: Record<string, any>;
};

export type AuditSummary = {
  total_logs: number;
  critical: number;
  warning: number;
  info: number;
  manager_actions: number;
  staff_actions: number;
  modules: Record<string, number>;
};
