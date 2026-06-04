// Shared
export type CoursePriority = 'low' | 'medium' | 'high' | 'urgent';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseContentType = 'text' | 'video' | 'pdf' | 'image' | 'link' | 'quiz';
export type CourseAssignScope = 'store' | 'individual';

// DB legacy types
export type LessonType = 'video' | 'pdf' | 'text' | 'image' | 'quiz';

export interface Lesson {
  id: string;
  title: string;
  lesson_type?: LessonType;
  // DB-only
  module_id?: string;
  course_id?: string;
  sort_order?: number;
  is_mandatory?: boolean;
  is_completed?: boolean;
  completed?: boolean;
  video_url?: string;
  pdf_url?: string;
  // JSON fields
  content_type?: CourseContentType;
  content?: string;
  duration_minutes: number;
  description?: string | null;
}

export interface CourseModule {
  id: string;
  title: string;
  course_id?: string;
  description?: string | null;
  sort_order?: number;
  lessons: Lesson[];
  completed_lessons?: number;
  total_lessons?: number;
}

// JSON backend lesson type (flat)
export type CourseLesson = {
  id: string;
  title: string;
  description?: string | null;
  content_type: CourseContentType;
  content: string;
  duration_minutes: number;
  sort_order: number;
};

export type CourseProgress = {
  id: string;
  course_id: string;
  course_title?: string;
  staff_id: string;
  staff_name?: string;
  staff_email?: string;
  employee_code?: string;
  store_code?: string;
  store_id?: string;
  store_name?: string;
  completed_lessons: string[];
  last_completed_lesson_id?: string | null;
  progress_percentage: number;
  status: 'not_started' | 'in_progress' | 'completed';
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

// Superset of DB and JSON backend
export interface Course {
  id: string;
  title: string;
  description: string;
  category?: string | null;

  // DB fields
  thumbnail_url?: string | null;
  difficulty_level?: string;
  estimated_duration_minutes?: number;
  passing_score?: number;
  certificate_enabled?: boolean;
  progress_status?: string;
  modules?: CourseModule[];

  // JSON fields
  level?: CourseLevel;
  priority?: CoursePriority;
  due_date?: string | null;
  assign_scope?: CourseAssignScope;
  assigned_to?: string[];
  lessons?: CourseLesson[];
  total_lessons?: number;
  total_duration_minutes?: number;
  store_code?: string;
  store_id?: string;
  store_name?: string;
  created_by?: string;
  created_by_name?: string;

  // Progress — shared
  status?: string;
  progress_percentage?: number;
  staff_status?: 'not_started' | 'in_progress' | 'completed';
  progress?: CourseProgress | null;
  completed_lessons?: string[];

  // Manager enrichment
  enrolled_count?: number;
  completed_count?: number;
  average_progress?: number;

  created_at?: string;
  updated_at?: string;
}

export type CourseCreatePayload = {
  title: string;
  description: string;
  category?: string;
  level: CourseLevel;
  priority: CoursePriority;
  due_date?: string | null;
  assign_scope: CourseAssignScope;
  assigned_to: string[];
  lessons: CourseLesson[];
};
