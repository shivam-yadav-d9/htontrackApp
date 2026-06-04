export type PerformanceAlertType =
  | 'low_attendance'
  | 'late_check_in'
  | 'pending_assignment'
  | 'pending_course'
  | 'failed_quiz'
  | 'low_target'
  | 'urgent_ticket'
  | 'checklist_issue'
  | 'skill_gap'
  | 'document_issue'
  | 'general';

export type PerformanceAlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type PerformanceAlertStatus = 'open' | 'resolved' | 'escalated';

export type PerformanceAlert = {
  id: string;
  alert_type: PerformanceAlertType;
  severity: PerformanceAlertSeverity;
  title: string;
  description: string;
  recommended_action: string;
  source_module: string;
  source_id?: string | null;
  staff_id: string;
  staff_name?: string;
  staff_email?: string;
  employee_code?: string;
  store_code?: string;
  store_id?: string;
  store_name?: string;
  manager_id?: string;
  manager_name?: string;
  status: PerformanceAlertStatus;
  resolution_note?: string | null;
  resolved_by?: string | null;
  resolved_by_name?: string | null;
  resolved_at?: string | null;
  escalation_note?: string | null;
  escalated_to?: string | null;
  escalated_by?: string | null;
  escalated_by_name?: string | null;
  escalated_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type PerformanceAlertSummary = {
  total: number;
  open: number;
  escalated: number;
  resolved: number;
  critical: number;
  high: number;
};

export type ResolveAlertPayload = {
  resolution_note: string;
};

export type EscalateAlertPayload = {
  escalation_note: string;
  escalated_to?: string;
};
