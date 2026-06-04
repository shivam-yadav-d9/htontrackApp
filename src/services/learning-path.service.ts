import { APP_MODE } from '@/config/appMode';
import { api } from './api';

export interface LearningPathCourse {
  id: string;
  course_id: string;
  course_title: string;
  course_category: string;
  difficulty_level: string;
  estimated_duration_minutes: number;
  sort_order: number;
  is_required: boolean;
  is_completed: boolean;
  is_locked: boolean;
  progress_percentage: number;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string | null;
  category: string;
  thumbnail_url: string | null;
  status: string;
  enrollment_status: string;
  progress_percentage: number;
  total_courses: number;
  completed_courses: number;
  courses: LearningPathCourse[];
  enrolled_at: string | null;
  completed_at: string | null;
}

const SEED_PATHS: LearningPath[] = [
  {
    id: 'lp_001',
    title: 'New Staff Induction Path',
    description: 'Complete induction training for all new HomeTown staff.',
    category: 'induction',
    thumbnail_url: null,
    status: 'published',
    enrollment_status: 'enrolled',
    progress_percentage: 50,
    total_courses: 4,
    completed_courses: 2,
    enrolled_at: '2026-04-01T09:00:00.000Z',
    completed_at: null,
    courses: [
      {
        id: 'lpc_001',
        course_id: 'course_001',
        course_title: 'HomeTown Brand Induction',
        course_category: 'induction',
        difficulty_level: 'beginner',
        estimated_duration_minutes: 60,
        sort_order: 1,
        is_required: true,
        is_completed: true,
        is_locked: false,
        progress_percentage: 100,
      },
      {
        id: 'lpc_002',
        course_id: 'course_002',
        course_title: 'Furniture Product Knowledge',
        course_category: 'product',
        difficulty_level: 'beginner',
        estimated_duration_minutes: 90,
        sort_order: 2,
        is_required: true,
        is_completed: true,
        is_locked: false,
        progress_percentage: 100,
      },
      {
        id: 'lpc_003',
        course_id: 'course_003',
        course_title: 'Customer Service Excellence',
        course_category: 'soft_skills',
        difficulty_level: 'intermediate',
        estimated_duration_minutes: 75,
        sort_order: 3,
        is_required: true,
        is_completed: false,
        is_locked: false,
        progress_percentage: 40,
      },
      {
        id: 'lpc_004',
        course_id: 'course_004',
        course_title: 'Store Safety and Compliance',
        course_category: 'compliance',
        difficulty_level: 'beginner',
        estimated_duration_minutes: 45,
        sort_order: 4,
        is_required: true,
        is_completed: false,
        is_locked: true,
        progress_percentage: 0,
      },
    ],
  },
  {
    id: 'lp_002',
    title: 'Sofa Sales Expert Path',
    description: 'Master sofa selling from product knowledge to closing the deal.',
    category: 'sales',
    thumbnail_url: null,
    status: 'published',
    enrollment_status: 'not_enrolled',
    progress_percentage: 0,
    total_courses: 3,
    completed_courses: 0,
    enrolled_at: null,
    completed_at: null,
    courses: [
      {
        id: 'lpc_005',
        course_id: 'course_001',
        course_title: 'Sofa Selling Masterclass',
        course_category: 'sales',
        difficulty_level: 'intermediate',
        estimated_duration_minutes: 120,
        sort_order: 1,
        is_required: true,
        is_completed: false,
        is_locked: false,
        progress_percentage: 0,
      },
      {
        id: 'lpc_006',
        course_id: 'course_002',
        course_title: 'Upselling and Cross-Selling',
        course_category: 'sales',
        difficulty_level: 'advanced',
        estimated_duration_minutes: 90,
        sort_order: 2,
        is_required: true,
        is_completed: false,
        is_locked: true,
        progress_percentage: 0,
      },
      {
        id: 'lpc_007',
        course_id: 'course_003',
        course_title: 'Customer Handling Quiz Prep',
        course_category: 'assessment',
        difficulty_level: 'intermediate',
        estimated_duration_minutes: 30,
        sort_order: 3,
        is_required: true,
        is_completed: false,
        is_locked: true,
        progress_percentage: 0,
      },
    ],
  },
];

const enrolledIds = new Set<string>(['lp_001']);

export const learningPathService = {
  async getMyPaths(): Promise<LearningPath[]> {
    if (APP_MODE === 'offline_apk') {
      return SEED_PATHS.map((p) => ({
        ...p,
        enrollment_status: enrolledIds.has(p.id) ? 'enrolled' : 'not_enrolled',
      }));
    }
    return api.get<LearningPath[]>('/learning-paths/my');
  },

  async getPath(id: string): Promise<LearningPath> {
    if (APP_MODE === 'offline_apk') {
      const path = SEED_PATHS.find((p) => p.id === id);
      if (!path) throw new Error('Learning path not found');
      return { ...path, enrollment_status: enrolledIds.has(id) ? 'enrolled' : 'not_enrolled' };
    }
    return api.get<LearningPath>(`/learning-paths/${id}`);
  },

  async enroll(id: string): Promise<LearningPath> {
    if (APP_MODE === 'offline_apk') {
      enrolledIds.add(id);
      return learningPathService.getPath(id);
    }
    return api.post<LearningPath>(`/learning-paths/${id}/enroll`, {});
  },
};
