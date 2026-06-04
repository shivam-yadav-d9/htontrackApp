export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type TargetPeriod = PeriodType;

export type TargetStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'achieved'
  | 'missed'
  | 'exceeded'
  | 'overdue';

export interface Target {
  id: string;

  // Staff info
  staff_id?: string;
  staff_name?: string;
  staff_email?: string;
  employee_code?: string;

  // Store info
  store_code?: string;
  store_id?: string;
  store_name?: string;

  // Creator info
  created_by?: string;
  created_by_name?: string;

  target_type: string;
  metric_type: string;
  category?: string | null;

  // period field from JSON backend; period_type kept for legacy DB backend
  period?: TargetPeriod;
  period_type?: PeriodType;
  period_start: string;
  period_end: string;

  target_value: number;
  achieved_value: number;
  achievement_percentage: number;
  unit: string;
  status: TargetStatus | string;

  latest_remarks?: string | null;
  proof_file_url?: string | null;
  proof_file_name?: string | null;
  remarks_history?: any[];

  created_at?: string;
  updated_at?: string;
}

export interface TargetSummary {
  period_type: PeriodType;
  period_label: string;
  overall_percentage: number;
  targets: Target[];
}

export type TargetCreatePayload = {
  staff_id: string;
  target_type: string;
  metric_type: string;
  category?: string;
  period: TargetPeriod;
  period_start: string;
  period_end: string;
  target_value: number;
  achieved_value?: number;
  unit: string;
};

export type TargetProgressPayload = {
  achieved_value: number;
  remarks?: string;
  proof_file_url?: string | null;
  proof_file_name?: string | null;
};

export type ManagerTargetProgressResponse = {
  summary: {
    total_targets: number;
    average_percentage: number;
    completed: number;
    in_progress: number;
    not_started: number;
    low_performers: number;
    top_performers: number;
  };
  targets: Target[];
};
