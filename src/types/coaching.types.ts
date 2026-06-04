export type CoachingCategory =
  | 'Attendance'
  | 'Sales Target'
  | 'Product Knowledge'
  | 'Customer Handling'
  | 'POS Billing'
  | 'Store Operations'
  | 'Checklist Issue'
  | 'Skill Gap'
  | 'Quiz Failure'
  | 'General';

export type CoachingPriority = 'low' | 'medium' | 'high' | 'urgent';

export type CoachingStatus =
  | 'assigned'
  | 'in_progress'
  | 'staff_completed'
  | 'manager_reviewed'
  | 'closed';

export type CoachingActionItem = {
  id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  sort_order: number;
};

export type CoachingActionCompletionNote = {
  action_id: string;
  completion_note?: string | null;
  completed_at: string;
  completed_by: string;
  completed_by_name?: string;
};

export type CoachingPlan = {
  id: string;
  staff_id: string;
  staff_name?: string;
  staff_email?: string;
  employee_code?: string;
  store_code?: string;
  store_id?: string;
  store_name?: string;
  title: string;
  description: string;
  category: CoachingCategory;
  priority: CoachingPriority;
  start_date?: string | null;
  due_date?: string | null;
  linked_alert_id?: string | null;
  linked_source_module?: string | null;
  linked_source_id?: string | null;
  success_criteria: string;
  action_items: CoachingActionItem[];
  completed_action_ids: string[];
  action_completion_notes: CoachingActionCompletionNote[];
  total_actions: number;
  completed_actions: number;
  progress_percentage: number;
  status: CoachingStatus;
  created_by?: string;
  created_by_name?: string;
  manager_remarks?: string | null;
  final_score?: number | null;
  reviewed_by?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  closed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CoachingPlanCreatePayload = {
  staff_id: string;
  title: string;
  description: string;
  category: CoachingCategory;
  priority: CoachingPriority;
  start_date?: string | null;
  due_date?: string | null;
  linked_alert_id?: string | null;
  linked_source_module?: string | null;
  linked_source_id?: string | null;
  success_criteria: string;
  action_items: CoachingActionItem[];
};

export type CompleteCoachingActionPayload = {
  completion_note?: string;
};

export type CoachingReviewPayload = {
  status: 'manager_reviewed' | 'closed';
  manager_remarks: string;
  final_score?: number | null;
};

export type CoachingSummary = {
  total: number;
  assigned: number;
  in_progress: number;
  staff_completed: number;
  closed: number;
};
