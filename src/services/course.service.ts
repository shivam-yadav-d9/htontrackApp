import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type { Course, CourseCreatePayload, CourseProgress } from '@/types/course.types';
import { storage } from '@/utils/storage';

export interface Lesson {
  id: string;
  module_id?: string;
  course_id?: string;
  title: string;
  lesson_type?: string;
  content?: string | null;
  video_url?: string | null;
  pdf_url?: string | null;
  duration_minutes: number;
  sort_order?: number;
  is_mandatory?: boolean;
  is_completed?: boolean;
}

export interface CourseModule {
  id: string;
  course_id?: string;
  title: string;
  description?: string | null;
  sort_order?: number;
  lessons: Lesson[];
}

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

export const courseService = {
  async getMyCourses(): Promise<Course[]> {
    if (APP_MODE === 'offline_apk') return courseService.getStaffCourses();
    return api.get<Course[]>('/courses/my');
  },

  async getCourse(id: string): Promise<Course> {
    if (APP_MODE === 'offline_apk') return courseService.getStaffCourse(id);
    return api.get<Course>(`/courses/${id}`);
  },

  async startCourse(id: string): Promise<Course> {
    if (APP_MODE === 'offline_apk') {
      const updated = await localDb.updateItem<Course>('courses', id, { status: 'in_progress', progress_percentage: 1 });
      if (!updated) throw new Error('Course not found');
      return updated;
    }
    return api.post<Course>(`/courses/${id}/start`, {});
  },

  async completeLesson(courseId: string, lessonId: string) {
    if (APP_MODE === 'offline_apk') {
      const course = await localDb.findById<Course & { modules?: CourseModule[] }>('courses', courseId);
      if (!course) throw new Error('Course not found');
      const modules = course.modules ?? [];
      let totalLessons = 0;
      let completedLessons = 0;
      for (const mod of modules) {
        for (const les of mod.lessons) {
          totalLessons++;
          if (les.id === lessonId) les.is_completed = true;
          if (les.is_completed) completedLessons++;
        }
      }
      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      const status = progress === 100 ? 'completed' : 'in_progress';
      await localDb.updateItem('courses', courseId, { modules, progress_percentage: progress, status });
      return { lesson_id: lessonId, progress_percentage: progress, course_status: status };
    }
    return api.post<{ lesson_id: string; progress_percentage: number; course_status: string }>(
      `/courses/${courseId}/lessons/${lessonId}/complete`,
      {}
    );
  },

  async updateProgress(courseId: string, progressPercentage: number, status?: string): Promise<void> {
    if (APP_MODE === 'offline_apk') {
      await localDb.updateItem('courses', courseId, { progress_percentage: progressPercentage, ...(status ? { status } : {}) });
      return;
    }
    await api.post(`/courses/${courseId}/progress`, { progress_percentage: progressPercentage, status });
  },

  async getStaffCourses(): Promise<Course[]> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const rows = await localDb.getCollection<Course & { assigned_to?: string }>('courses');
      return rows.filter((c) => !c.assigned_to || c.assigned_to === uid);
    }
    return api.get<Course[]>('/staff/courses/my');
  },

  async getStaffCourse(id: string): Promise<Course> {
    if (APP_MODE === 'offline_apk') {
      const item = await localDb.findById<Course>('courses', id);
      if (!item) throw new Error('Course not found');
      return item;
    }
    return api.get<Course>(`/staff/courses/${id}`);
  },

  async completeLessonJSON(courseId: string, lessonId: string): Promise<CourseProgress> {
    if (APP_MODE === 'offline_apk') {
      const result = await courseService.completeLesson(courseId, lessonId);
      return { course_id: courseId, progress_percentage: result.progress_percentage, status: result.course_status } as unknown as CourseProgress;
    }
    return api.post<CourseProgress>(`/staff/courses/${courseId}/lessons/${lessonId}/complete`, {});
  },

  async createCourse(payload: CourseCreatePayload): Promise<Course> {
    if (APP_MODE === 'offline_apk') {
      const item: Course = {
        id: localDb.generateId('course'),
        ...payload,
        progress_percentage: 0,
        status: 'not_started',
        created_at: new Date().toISOString(),
      } as unknown as Course;
      return localDb.addItem('courses', item);
    }
    return api.post<Course>('/manager/courses', payload);
  },

  async getManagerCourses(): Promise<Course[]> {
    if (APP_MODE === 'offline_apk') {
      return localDb.getCollection<Course>('courses');
    }
    return api.get<Course[]>('/manager/courses');
  },

  async getManagerCourseProgress() {
    if (APP_MODE === 'offline_apk') {
      const courses = await localDb.getCollection<Course>('courses');
      const completed = courses.filter((c) => c.status === 'completed').length;
      const inProgress = courses.filter((c) => c.status === 'in_progress').length;
      const avg = courses.length > 0 ? Math.round(courses.reduce((s, c) => s + (c.progress_percentage ?? 0), 0) / courses.length) : 0;
      return {
        summary: { total_progress_records: courses.length, completed, in_progress: inProgress, average_progress: avg },
        progress: [] as CourseProgress[],
      };
    }
    return api.get<{
      summary: { total_progress_records: number; completed: number; in_progress: number; average_progress: number };
      progress: CourseProgress[];
    }>('/manager/course-progress');
  },

  // ── LMS Admin ──────────────────────────────────────────────────────────────

  createLMSCourse(payload: Record<string, unknown>) {
    return api.post('/admin/courses', payload);
  },

  getAdminCourses() {
    return api.get('/admin/courses');
  },

  updateLMSCourse(courseId: string, payload: Record<string, unknown>) {
    return api.put(`/admin/courses/${courseId}`, payload);
  },

  deleteLMSCourse(courseId: string) {
    return api.delete(`/admin/courses/${courseId}`);
  },

  getAdminCourse(courseId: string) {
    return api.get(`/admin/courses/${courseId}`);
  },

  createLesson(courseId: string, payload: Record<string, unknown>) {
    return api.post(`/admin/courses/${courseId}/lessons`, payload);
  },

  createQuestion(courseId: string, payload: Record<string, unknown>) {
    return api.post(`/admin/courses/${courseId}/questions`, payload);
  },

  createMockQuestions(courseId: string, count = 5) {
    return api.post(`/admin/courses/${courseId}/mock-questions`, { count });
  },

  assignCourseRole(courseId: string, payload: Record<string, unknown>) {
    return api.post(`/admin/courses/${courseId}/assign`, payload);
  },

  publishCourse(courseId: string) {
    return api.post(`/admin/courses/${courseId}/publish`, {});
  },

  getAdminCourseLeaderboard(courseId: string) {
    return api.get(`/admin/courses/${courseId}/leaderboard`);
  },

  // ── LMS Manager ────────────────────────────────────────────────────────────

  getManagerCourseStatus() {
    return api.get('/manager/courses/status');
  },

  getManagerTeamProgress() {
    return api.get('/manager/courses/team-progress');
  },

  getManagerCourse(courseId: string) {
    return api.get(`/manager/courses/${courseId}`);
  },

  // ── LMS Staff ──────────────────────────────────────────────────────────────

  async getStaffCoursesLMS(): Promise<Course[]> {
    const data = await api.get<{ courses: Course[] } | Course[]>('/staff/courses/my');
    if (Array.isArray(data)) return data;
    return (data as { courses: Course[] }).courses ?? [];
  },

  getLeaderboard() {
    return api.get('/staff/courses/leaderboard');
  },

  getStaffCourseLMS(courseId: string) {
    return api.get(`/staff/courses/${courseId}`);
  },

  startCourseLMS(courseId: string) {
    return api.post(`/staff/courses/${courseId}/start`, {});
  },

  completeLessonLMS(courseId: string, lessonId: string) {
    return api.post(`/staff/courses/${courseId}/lesson/${lessonId}/complete`, {});
  },

  submitAssessment(courseId: string, answers: { question_id: string; selected_answer: string }[]) {
    return api.post(`/staff/courses/${courseId}/submit-assessment`, { answers });
  },

  getCourseResult(courseId: string) {
    return api.get(`/staff/courses/${courseId}/result`);
  },

  getCourseCertificate(courseId: string) {
    return api.get(`/staff/courses/${courseId}/certificate`);
  },

  // ── Role-based courses (Step 72) ──────────────────────────────────────────

  async getMyRoleCourses(): Promise<any> {
    return api.get('/staff/role-courses/my');
  },

  async getManagerTeamRoleCourses(): Promise<any> {
    return api.get('/manager/role-courses/team');
  },

  async getAdminRoleCoverage(): Promise<any> {
    return api.get('/admin/role-courses/coverage');
  },

  async getAdminRoleGaps(): Promise<any> {
    return api.get('/admin/role-courses/gaps');
  },

  async adminAutoAssignRoleCourses(): Promise<any> {
    return api.post('/admin/role-courses/auto-assign', {});
  },
};

export type CourseGenerateFromTextPayload = {
  title: string;
  description: string;
  source_text: string;
  role_keys?: string[];
  departments?: string[];
  skill_levels?: string[];
  course_path?: string;
  checklist_group?: string;
  difficulty?: string;
  duration_minutes?: number;
  pass_percentage?: number;
  max_attempts?: number;
  question_count?: number;
  status?: string;
};

export const courseGeneratorService = {
  generateFromText(payload: CourseGenerateFromTextPayload) {
    return api.post('/admin/courses/generate-from-text', payload);
  },

  uploadSourceText(courseId: string, sourceText: string) {
    return api.post(`/admin/courses/${courseId}/upload-source-text`, { source_text: sourceText });
  },

  generateSummary(courseId: string) {
    return api.post(`/admin/courses/${courseId}/generate-summary`, {});
  },

  generateLessons(courseId: string) {
    return api.post(`/admin/courses/${courseId}/generate-lessons`, {});
  },

  generateMcqs(courseId: string, count = 10) {
    return api.post(`/admin/courses/${courseId}/generate-mcqs`, { count });
  },

  generateFullLearningPack(courseId: string, count = 10) {
    return api.post(`/admin/courses/${courseId}/generate-full-learning-pack`, { count });
  },
};

export const courseAnalyticsService = {
  // ── Staff ──────────────────────────────────────────────────────────────────

  getStaffLeaderboard(courseId?: string) {
    const query = courseId ? `?course_id=${courseId}` : '';
    return api.get(`/staff/course-analytics/leaderboard${query}`);
  },

  getMyRanking(courseId?: string) {
    const query = courseId ? `?course_id=${courseId}` : '';
    return api.get(`/staff/course-analytics/my-ranking${query}`);
  },

  getMyPerformanceSummary() {
    return api.get('/staff/course-analytics/my-performance-summary');
  },

  // ── Manager ────────────────────────────────────────────────────────────────

  getManagerLeaderboard(courseId?: string) {
    const query = courseId ? `?course_id=${courseId}` : '';
    return api.get(`/manager/course-analytics/leaderboard${query}`);
  },

  getManagerPassFailRate(courseId?: string) {
    const query = courseId ? `?course_id=${courseId}` : '';
    return api.get(`/manager/course-analytics/pass-fail-rate${query}`);
  },

  getManagerRankingSummary() {
    return api.get('/manager/course-analytics/ranking-summary');
  },

  getManagerCourseAnalytics(courseId: string) {
    return api.get(`/manager/course-analytics/course/${courseId}`);
  },

  // ── Admin ──────────────────────────────────────────────────────────────────

  getAdminLeaderboard(params?: {
    course_id?: string;
    store_code?: string;
    role_key?: string;
    department?: string;
  }) {
    const search = new URLSearchParams(
      Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v != null)) as Record<string, string>
    );
    const qs = search.toString();
    return api.get(`/admin/course-analytics/leaderboard${qs ? `?${qs}` : ''}`);
  },

  getAdminPassFailRate(params?: {
    course_id?: string;
    store_code?: string;
    role_key?: string;
    department?: string;
  }) {
    const search = new URLSearchParams(
      Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v != null)) as Record<string, string>
    );
    const qs = search.toString();
    return api.get(`/admin/course-analytics/pass-fail-rate${qs ? `?${qs}` : ''}`);
  },

  getAdminRankingSummary() {
    return api.get('/admin/course-analytics/ranking-summary');
  },

  getAdminCourseAnalytics(courseId: string, storeCode?: string) {
    const query = storeCode ? `?store_code=${storeCode}` : '';
    return api.get(`/admin/course-analytics/course/${courseId}${query}`);
  },

  getAdminStoreWisePerformance(courseId?: string) {
    const query = courseId ? `?course_id=${courseId}` : '';
    return api.get(`/admin/course-analytics/store-wise-performance${query}`);
  },

  getAdminRoleWisePerformance(courseId?: string) {
    const query = courseId ? `?course_id=${courseId}` : '';
    return api.get(`/admin/course-analytics/role-wise-performance${query}`);
  },
};
