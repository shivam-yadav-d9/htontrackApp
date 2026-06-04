import { api } from './api';

export type Notice = {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent' | string;
  target_audience: string;
  target_zones?: string[];
  target_site_codes?: string[];
  is_pinned?: boolean;
  published_at?: string | null;
  expires_at?: string | null;
  status: 'draft' | 'published' | 'archived' | string;
  created_by?: string;
  created_at: string;
};

export type NoticeCreatePayload = {
  title: string;
  body: string;
  category: string;
  priority?: string;
  target_audience?: string;
  target_zones?: string[];
  target_site_codes?: string[];
  is_pinned?: boolean;
  expires_at?: string;
};

export const noticeService = {
  getAdminNotices(params?: { status?: string; category?: string }) {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.category) q.set('category', params.category);
    const qs = q.toString();
    return api.get<Notice[]>(`/admin/notices${qs ? `?${qs}` : ''}`);
  },

  createNotice(payload: NoticeCreatePayload) {
    return api.post<Notice>('/admin/notices', payload);
  },

  updateNotice(noticeId: string, payload: Partial<NoticeCreatePayload>) {
    return api.put<Notice>(`/admin/notices/${noticeId}`, payload);
  },

  publishNotice(noticeId: string) {
    return api.post<Notice>(`/admin/notices/${noticeId}/publish`, {});
  },

  archiveNotice(noticeId: string) {
    return api.post<Notice>(`/admin/notices/${noticeId}/archive`, {});
  },

  deleteNotice(noticeId: string) {
    return api.delete<{ message: string }>(`/admin/notices/${noticeId}`);
  },

  getMyNotices() {
    return api.get<Notice[]>('/staff/notices');
  },

  markNoticeRead(noticeId: string) {
    return api.post<{ message: string }>(`/staff/notices/${noticeId}/read`, {});
  },
};
