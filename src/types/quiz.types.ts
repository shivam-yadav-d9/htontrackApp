export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'image_based'
  | 'video_based'
  | 'match_following'
  | 'fill_blank';

export type QuizPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AssignScope = 'store' | 'individual';

// Option — DB uses option_text, JSON uses text
export interface QuizOption {
  id: string;
  text?: string;
  option_text?: string;
  is_correct?: boolean;
}

// Question — DB uses question_text/marks, JSON uses question/points
export interface QuizQuestion {
  id: string;
  question?: string;
  question_text?: string;
  question_type: QuestionType;
  points?: number;
  marks?: number;
  options: QuizOption[];
  correct_answer_ids?: string[];
  explanation?: string;
  image_url?: string;
  media_url?: string;
}

// Full Quiz — superset of both DB and JSON backends
export interface Quiz {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  category?: string;
  priority?: QuizPriority;
  // DB fields
  course_id?: string;
  time_limit_minutes?: number;
  passing_score?: number;
  max_attempts?: number;
  attempts_used?: number;
  // JSON fields
  duration_minutes?: number;
  pass_percentage?: number;
  due_date?: string;
  assign_scope?: AssignScope;
  assigned_to?: string[];
  total_questions?: number;
  total_points?: number;
  store_code?: string;
  store_name?: string;
  created_by?: string;
  created_by_name?: string;
  status?: string;
  created_at?: string;
  // Staff-facing enrichment
  staff_status?: 'pending' | 'completed';
  score_percentage?: number | null;
  passed?: boolean | null;
  attempt?: QuizAttempt | null;
  questions: QuizQuestion[];
}

export interface QuizAttemptBreakdown {
  question_id: string;
  question?: string;
  submitted_answer_ids: string[];
  correct_answer_ids: string[];
  is_correct: boolean;
  points: number;
  earned_points: number;
  explanation?: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  quiz_title?: string;
  staff_id?: string;
  staff_name?: string;
  staff_email?: string;
  employee_code?: string;
  store_code?: string;
  store_name?: string;
  // DB fields
  attempt_number?: number;
  score?: number;
  time_taken_seconds?: number;
  answers?: Record<string, string[]> | Record<string, string>;
  // JSON fields
  total_points?: number;
  earned_points?: number;
  breakdown?: QuizAttemptBreakdown[];
  percentage: number;
  passed: boolean;
  submitted_at: string;
  created_at?: string;
  status?: string;
}

// Create payload for JSON backend
export interface QuizOptionPayload {
  id: string;
  text: string;
}

export interface QuizQuestionPayload {
  id: string;
  question: string;
  question_type: QuestionType;
  options: QuizOptionPayload[];
  correct_answer_ids: string[];
  points?: number;
  explanation?: string;
  media_url?: string;
}

export interface QuizCreatePayload {
  title: string;
  description: string;
  instructions?: string;
  category?: string;
  priority?: QuizPriority;
  duration_minutes?: number;
  pass_percentage?: number;
  due_date?: string;
  assign_scope?: AssignScope;
  assigned_to?: string[];
  questions: QuizQuestionPayload[];
}

// Attempt submission payload for JSON backend
export interface QuizAttemptPayload {
  answers: Record<string, string[]>;
}

// Legacy payload for old DB-based screens
export interface LegacyQuizAttemptPayload {
  answers: Record<string, string>;
  time_taken_seconds?: number;
}
