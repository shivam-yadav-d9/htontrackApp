export type RewardType =
  | 'points'
  | 'badge'
  | 'appreciation'
  | 'achievement'
  | 'bonus'
  | 'general';

export type RewardCategory =
  | 'Attendance'
  | 'Training'
  | 'Quiz'
  | 'Target'
  | 'Checklist'
  | 'Skill'
  | 'Coaching'
  | 'Customer Service'
  | 'Store Operations'
  | 'General';

export type CertificateType =
  | 'Course Completion'
  | 'Quiz Excellence'
  | 'Skill Excellence'
  | 'Target Champion'
  | 'Attendance Star'
  | 'Customer Service Star'
  | 'Store Operations Champion'
  | 'General';

export type BadgeLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export type Reward = {
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
  reward_type: RewardType;
  category: RewardCategory;
  badge_level?: BadgeLevel | null;
  points: number;
  linked_source_module?: string | null;
  linked_source_id?: string | null;
  awarded_by?: string;
  awarded_by_name?: string;
  awarded_at?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
};

export type RewardCreatePayload = {
  staff_id: string;
  title: string;
  description: string;
  reward_type: RewardType;
  category: RewardCategory;
  badge_level?: BadgeLevel | null;
  points: number;
  linked_source_module?: string | null;
  linked_source_id?: string | null;
};

export type RewardSummary = {
  total_rewards: number;
  total_points: number;
  badges: number;
  appreciations: number;
};

export type Certificate = {
  id: string;
  certificate_number: string;
  staff_id: string;
  staff_name?: string;
  staff_email?: string;
  employee_code?: string;
  store_code?: string;
  store_id?: string;
  store_name?: string;
  title: string;
  description: string;
  certificate_type: CertificateType;
  score_percentage?: number | null;
  linked_source_module?: string | null;
  linked_source_id?: string | null;
  issued_by?: string;
  issued_by_name?: string;
  issued_at?: string;
  verification_status: 'valid' | 'revoked';
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
};

export type CertificateCreatePayload = {
  staff_id: string;
  title: string;
  description: string;
  certificate_type: CertificateType;
  score_percentage?: number | null;
  linked_source_module?: string | null;
  linked_source_id?: string | null;
};

export type LeaderboardRow = {
  staff_id: string;
  staff_name?: string;
  staff_email?: string;
  employee_code?: string;
  store_code?: string;
  store_id?: string;
  store_name?: string;
  reward_points: number;
  quiz_points: number;
  course_points: number;
  skill_points: number;
  checklist_points: number;
  coaching_points: number;
  attendance_points: number;
  target_points: number;
  certificate_points: number;
  total_score: number;
  reward_count: number;
  certificate_count: number;
  rank: number;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  is_me?: boolean;
};
