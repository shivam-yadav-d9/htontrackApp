import { api } from "./api";

export const lmsService = {
  async getCourses() {
    return api.get<any[]>("/ontrack/lms/course");
  },

  async getCourseById(courseId: string) {
    return api.get<any>(
      `/ontrack/lms/course/${courseId}`
    );
  },

  async getCourseQuestions(courseId: string) {
    return api.get<any[]>(
      `/ontrack/lms/course/${courseId}/question`
    );
  },

  async startAttempt(
    courseId: string,
    employeeId: string
  ) {
    return api.post<any>(
      "/ontrack/lms/course/attempt/start",
      {
        courseId,
        employeeId,
      }
    );
  },

  async saveAnswer(
    attemptId: string,
    questionId: string,
    selectedAnswer: number
  ) {
    return api.post<any>(
      "/ontrack/lms/course/attempt/answer",
      {
        attemptId,
        questionId,
        selectedAnswer,
      }
    );
  },

  async submitAttempt(
    attemptId: string
  ) {
    return api.post<any>(
      "/ontrack/lms/course/attempt/submit",
      {
        attemptId,
      }
    );
  },
};