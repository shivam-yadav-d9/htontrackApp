import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type { DocumentCreatePayload, DocumentReviewPayload, StaffDocument } from '@/types/document.types';
import { storage } from '@/utils/storage';

export type FormStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESUBMITTED' | 'CANCELLED';

export interface UploadedDoc {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  upload_status: 'uploading' | 'uploaded' | 'error';
  approval_status: 'pending' | 'approved' | 'rejected';
  form_status: FormStatus;
  rejection_reason?: string | null;
  uploaded_at: string;
}

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

export const documentService = {
  async uploadDocumentMeta(payload: DocumentCreatePayload): Promise<StaffDocument> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const item: StaffDocument = {
        id: localDb.generateId('doc'),
        user_id: uid,
        upload_status: 'uploaded',
        approval_status: 'pending',
        form_status: 'SUBMITTED',
        uploaded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        ...payload,
      } as unknown as StaffDocument;
      return localDb.addItem('documents', item);
    }
    return api.post<StaffDocument>('/staff/documents', payload);
  },

  async getMyDocuments(): Promise<StaffDocument[]> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const rows = await localDb.getCollection<StaffDocument & { user_id?: string }>('documents');
      return rows.filter((d) => d.user_id === uid) as unknown as StaffDocument[];
    }
    return api.get<StaffDocument[]>('/staff/documents/my');
  },

  async getManagerDocumentApprovals(): Promise<StaffDocument[]> {
    if (APP_MODE === 'offline_apk') {
      return localDb.getCollection<StaffDocument>('documents');
    }
    return api.get<StaffDocument[]>('/manager/document-approvals');
  },

  async reviewDocument(id: string, payload: DocumentReviewPayload): Promise<StaffDocument> {
    if (APP_MODE === 'offline_apk') {
      const updated = await localDb.updateItem<StaffDocument>('documents', id, {
        approval_status: payload.status,
        form_status: payload.status === 'approved' ? 'APPROVED' : 'REJECTED',
        rejection_reason: payload.rejection_reason ?? null,
      } as Partial<StaffDocument>);
      return updated!;
    }
    return api.post<StaffDocument>(`/manager/documents/${id}/review`, payload);
  },

  async uploadDocument(formData: FormData): Promise<UploadedDoc> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      return {
        id: localDb.generateId('doc'),
        file_name: 'document.pdf',
        file_type: 'PDF',
        file_size: 0,
        file_url: '',
        upload_status: 'uploaded',
        approval_status: 'pending',
        form_status: 'SUBMITTED',
        uploaded_at: new Date().toISOString(),
      };
    }
    return api.post<UploadedDoc>('/documents/upload', formData);
  },

  async deleteDocument(id: string): Promise<void> {
    if (APP_MODE === 'offline_apk') {
      await localDb.deleteItem('documents', id);
      return;
    }
    return api.delete<void>(`/documents/${id}`);
  },
};
