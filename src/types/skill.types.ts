export type SkillCategory =
  | 'Product Knowledge'
  | 'Sales'
  | 'Customer Service'
  | 'Store Operations'
  | 'POS'
  | 'Visual Merchandising'
  | 'Compliance'
  | 'Leadership'
  | 'General';

export type SkillPriority = 'low' | 'medium' | 'high' | 'urgent';
export type CompetencyLevel = 'critical' | 'needs_improvement' | 'good' | 'excellent';
export type SkillAssignScope = 'store' | 'individual';

export interface SkillItem {
  id: string;
  title: string;
  description?: string;
  category: SkillCategory | string;
  expected_level: number;
  priority: SkillPriority;
  sort_order: number;
}

export interface SkillRatingDetail {
  skill_id: string;
  rating: number;
  remarks?: string;
}

export interface SkillRating {
  id: string;
  matrix_id: string;
  staff_id: string;
  store_code: string;
  rated_by_id: string;
  rated_by_name: string;
  ratings: SkillRatingDetail[];
  score_percentage: number;
  competency_level: CompetencyLevel;
  low_skill_count: number;
  high_skill_count: number;
  overall_remarks?: string;
  rated_at: string;
}

export interface SkillMatrix {
  id: string;
  title: string;
  description?: string;
  role_name?: string;
  due_date?: string;
  assign_scope: SkillAssignScope;
  assigned_to: string[];
  skills: SkillItem[];
  total_skills: number;
  store_code: string;
  created_by_id: string;
  created_by_name: string;
  status: string;
  // aggregated (manager list)
  rated_staff_count?: number;
  average_score?: number;
  low_skill_staff_count?: number;
  // per-staff enrichment
  rating?: SkillRating | null;
  staff_status?: 'rated' | 'pending';
  score_percentage?: number;
  competency_level?: CompetencyLevel | null;
}

export interface SkillRatingPayload {
  staff_id: string;
  ratings: { skill_id: string; rating: number; remarks?: string }[];
  overall_remarks?: string;
}

export interface SkillProgressResponse {
  summary: {
    total_rated_staff: number;
    average_score: number;
    low_skill_staff: number;
    excellent_staff: number;
  };
  ratings: SkillRating[];
}

export interface SkillMatrixCreatePayload {
  title: string;
  description?: string;
  role_name?: string;
  due_date?: string;
  assign_scope: SkillAssignScope;
  assigned_to: string[];
  skills: {
    title: string;
    description?: string;
    category: string;
    expected_level: number;
    priority: SkillPriority;
    sort_order: number;
  }[];
}
