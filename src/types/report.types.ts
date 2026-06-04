export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ReportStaffInfo = {
  id: string;
  full_name?: string;
  email?: string;
  employee_code?: string;
  role?: string;
  store_code?: string;
  store_name?: string;
};

export type StaffPerformanceReport = {
  staff: ReportStaffInfo;
  period: { start_date?: string | null; end_date?: string | null };
  attendance: { records: number; present_days: number; late_days: number; approved_leave_days: number };
  assignments: { assigned: number; submitted: number; completion_percentage: number };
  courses: { assigned: number; completed: number; completion_percentage: number };
  quizzes: { assigned: number; attempted: number; passed: number; pass_rate: number; average_score: number };
  checklists: { submitted: number; issue_count: number };
  tickets: { total: number; open: number };
  skills: { ratings: number; average_score: number; low_skill_count: number };
  targets: { assigned: number; average_progress: number };
  documents: { submitted: number; rejected: number };
  approvals: { leave_requests: number; attendance_corrections: number; pending: number };
  performance_alerts: { total: number; open: number };
  coaching: { total: number; open: number };
  rewards: { total: number; points: number; certificates: number };
  overall: { health_score: number; risk_level: RiskLevel };
};

export type StoreReportSummary = {
  total_staff: number;
  average_health_score: number;
  high_risk_staff: number;
  open_performance_alerts: number;
  total_reward_points: number;
  assignment_completion: number;
  course_completion: number;
  average_quiz_score: number;
  target_progress: number;
};

export type StoreSummaryReport = {
  store: { store_code?: string; store_id?: string; store_name?: string; manager_name?: string };
  period: { start_date?: string | null; end_date?: string | null };
  summary: StoreReportSummary;
  risk_staff: StaffPerformanceReport[];
  staff_reports: StaffPerformanceReport[];
};

export type ExportReportResponse = {
  file_type: 'csv_ready_json';
  store_code?: string;
  generated_at: string;
  rows: Array<Record<string, string | number | null | undefined>>;
};
