import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type {
  Quiz,
  QuizAttempt,
  QuizAttemptPayload,
  QuizCreatePayload,
  LegacyQuizAttemptPayload,
} from '@/types/quiz.types';
import { storage } from '@/utils/storage';

export interface QuizResult {
  attempt_id: string;
  quiz_id: string;
  score: number;
  total_marks: number;
  percentage: number;
  passed: boolean;
  attempt_number: number;
  submitted_at: string;
}

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

function gradeAttempt(quiz: Quiz, answers: Record<string, string>): { score: number; total: number; percentage: number; passed: boolean } {
  let score = 0;
  let total = 0;
  for (const q of quiz.questions ?? []) {
    total += q.marks ?? 10;
    const selected = answers[q.id];
    const correct = q.options?.find((o) => o.is_correct)?.id;
    if (selected && selected === correct) score += q.marks ?? 10;
  }
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  return { score, total, percentage, passed: percentage >= (quiz.passing_score ?? 70) };
}

export const quizService = {
  async getMyQuizzes(): Promise<Quiz[]> {
    if (APP_MODE === 'offline_apk') return quizService.getStaffQuizzes();
    return api.get<Quiz[]>('/quizzes/my');
  },

  async getQuiz(id: string): Promise<Quiz> {
    if (APP_MODE === 'offline_apk') return quizService.getStaffQuiz(id);
    return api.get<Quiz>(`/quizzes/${id}`);
  },

  async submitQuiz(quizId: string, payload: LegacyQuizAttemptPayload): Promise<QuizResult> {
    if (APP_MODE === 'offline_apk') {
      const quiz = await localDb.findById<Quiz>('quizzes', quizId);
      if (!quiz) throw new Error('Quiz not found');
      const answers: Record<string, string> = {};
      if (payload.answers) {
        for (const a of payload.answers) answers[a.question_id] = a.selected_option_id ?? '';
      }
      const { score, total, percentage, passed } = gradeAttempt(quiz, answers);
      await localDb.updateItem('quizzes', quizId, { attempts_used: (quiz.attempts_used ?? 0) + 1 });
      const result: QuizResult = {
        attempt_id: localDb.generateId('attempt'),
        quiz_id: quizId,
        score,
        total_marks: total,
        percentage,
        passed,
        attempt_number: (quiz.attempts_used ?? 0) + 1,
        submitted_at: new Date().toISOString(),
      };
      return result;
    }
    return api.post<QuizResult>(`/quizzes/${quizId}/submit`, payload);
  },

  async getResult(quizId: string): Promise<QuizResult> {
    if (APP_MODE === 'offline_apk') {
      const quiz = await localDb.findById<Quiz>('quizzes', quizId);
      if (!quiz) throw new Error('Quiz not found');
      return { attempt_id: '', quiz_id: quizId, score: 0, total_marks: 0, percentage: 0, passed: false, attempt_number: quiz.attempts_used ?? 0, submitted_at: '' };
    }
    return api.get<QuizResult>(`/quizzes/${quizId}/result`);
  },

  async getStaffQuizzes(): Promise<Quiz[]> {
    if (APP_MODE === 'offline_apk') {
      return localDb.getCollection<Quiz>('quizzes');
    }
    return api.get<Quiz[]>('/staff/quizzes/my');
  },

  async getStaffQuiz(id: string): Promise<Quiz> {
    if (APP_MODE === 'offline_apk') {
      const item = await localDb.findById<Quiz>('quizzes', id);
      if (!item) throw new Error('Quiz not found');
      return item;
    }
    return api.get<Quiz>(`/staff/quizzes/${id}`);
  },

  async submitAttempt(quizId: string, payload: QuizAttemptPayload): Promise<QuizAttempt> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const quiz = await localDb.findById<Quiz>('quizzes', quizId);
      if (!quiz) throw new Error('Quiz not found');
      const answers: Record<string, string> = {};
      if (payload.answers) {
        for (const a of payload.answers as { question_id: string; selected_option_id?: string }[]) {
          answers[a.question_id] = a.selected_option_id ?? '';
        }
      }
      const { score, total, percentage, passed } = gradeAttempt(quiz, answers);
      await localDb.updateItem('quizzes', quizId, { attempts_used: (quiz.attempts_used ?? 0) + 1 });
      const attempt: QuizAttempt = {
        id: localDb.generateId('attempt'),
        quiz_id: quizId,
        user_id: uid,
        score,
        total_marks: total,
        percentage,
        passed,
        attempt_number: (quiz.attempts_used ?? 0) + 1,
        submitted_at: new Date().toISOString(),
      } as unknown as QuizAttempt;
      return attempt;
    }
    return api.post<QuizAttempt>(`/staff/quizzes/${quizId}/attempt`, payload);
  },

  async createQuiz(payload: QuizCreatePayload): Promise<Quiz> {
    if (APP_MODE === 'offline_apk') {
      const item: Quiz = { id: localDb.generateId('quiz'), ...payload, attempts_used: 0, status: 'active', created_at: new Date().toISOString() } as unknown as Quiz;
      return localDb.addItem('quizzes', item);
    }
    return api.post<Quiz>('/manager/quizzes', payload);
  },

  async getManagerQuizzes(): Promise<Quiz[]> {
    if (APP_MODE === 'offline_apk') return localDb.getCollection<Quiz>('quizzes');
    return api.get<Quiz[]>('/manager/quizzes');
  },

  async getManagerAttempts(): Promise<QuizAttempt[]> {
    if (APP_MODE === 'offline_apk') return [];
    return api.get<QuizAttempt[]>('/manager/quiz-attempts');
  },
};
