import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type { Certificate } from '@/types/certificate.types';
import { storage } from '@/utils/storage';

export interface GenerateCertificatePayload {
  course_id: string;
  score: number;
  quiz_attempt_id?: string;
}

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

export const certificateService = {
  async getMyCertificates(): Promise<Certificate[]> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const certs = await localDb.getCollection<Certificate & { staff_id?: string; user_id?: string }>('certificates');
      return certs.filter((c) => c.staff_id === uid || c.user_id === uid) as Certificate[];
    }
    return api.get<Certificate[]>('/certificates/my');
  },

  async getCertificate(id: string): Promise<Certificate> {
    if (APP_MODE === 'offline_apk') {
      const item = await localDb.findById<Certificate>('certificates', id);
      if (!item) throw new Error('Certificate not found');
      return item;
    }
    return api.get<Certificate>(`/certificates/${id}`);
  },

  async generate(payload: GenerateCertificatePayload): Promise<Certificate> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const users = await localDb.getCollection<{ id: string; full_name?: string; employee_code?: string; store_code?: string; store_name?: string }>('users');
      const user = users.find((u) => u.id === uid);
      const courses = await localDb.getCollection<{ id: string; title?: string }>('courses');
      const course = courses.find((c) => c.id === payload.course_id);
      const item: Certificate = {
        id: localDb.generateId('cert'),
        certificate_code: `HT-CERT-${Date.now()}`,
        user_id: uid,
        staff_id: uid,
        course_id: payload.course_id,
        course_title: course?.title ?? 'Course Completion',
        employee_name: user?.full_name ?? '',
        employee_id: user?.employee_code ?? '',
        store_name: user?.store_name ?? '',
        score: payload.score,
        issued_at: new Date().toISOString(),
        status: 'active',
        verification_url: `https://karmyogi.hometown.in/verify/HT-CERT-${Date.now()}`,
        certificate_url: '',
      } as unknown as Certificate;
      return localDb.addItem('certificates', item);
    }
    return api.post<Certificate>('/certificates/generate', payload);
  },

  async verify(code: string): Promise<{ valid: boolean; certificate?: Certificate }> {
    if (APP_MODE === 'offline_apk') {
      const certs = await localDb.getCollection<Certificate & { certificate_code?: string }>('certificates');
      const cert = certs.find((c) => c.certificate_code === code);
      return { valid: Boolean(cert), certificate: cert as Certificate | undefined };
    }
    return api.get<{ valid: boolean; certificate?: Certificate }>(`/certificates/verify/${code}`);
  },

  // ── JSON-store routes (Step 77) ────────────────────────────────────────────

  getMyJsonCertificates(): Promise<{ certificates: Certificate[]; count: number }> {
    return api.get('/staff/certificates/my');
  },

  verifyByNumber(certificateNumber: string): Promise<{ valid: boolean; revoked?: boolean; certificate?: Certificate }> {
    return api.get(`/staff/certificates/verify/${certificateNumber}`);
  },

  getManagerTeamCertificates(periodKey?: string): Promise<{ certificates: Certificate[]; count: number; store_code: string }> {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/manager/certificates/team${q}`);
  },

  getManagerEmployeeCertificates(employeeCode: string): Promise<{ certificates: Certificate[]; count: number }> {
    return api.get(`/manager/certificates/employee/${employeeCode}`);
  },

  getAdminCertificates(params?: { period_key?: string; store_code?: string; status?: string }): Promise<{ certificates: Certificate[]; count: number }> {
    const search = new URLSearchParams();
    if (params?.period_key) search.append('period_key', params.period_key);
    if (params?.store_code) search.append('store_code', params.store_code);
    if (params?.status) search.append('status', params.status);
    const q = search.toString() ? `?${search.toString()}` : '';
    return api.get(`/admin/certificates${q}`);
  },

  getAdminSummary(periodKey?: string): Promise<any> {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/certificates/summary${q}`);
  },

  adminIssue(payload: any): Promise<Certificate> {
    return api.post('/admin/certificates/issue', payload);
  },

  adminRevoke(certificateId: string, reason: string): Promise<Certificate> {
    return api.post(`/admin/certificates/${certificateId}/revoke`, { reason });
  },
};
