import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type {
  AttendanceCorrection,
  AttendanceCorrectionPayload,
  LeaveRequest,
  LeaveRequestPayload,
  ReviewPayload,
} from '@/types/approval.types';
import { storage } from '@/utils/storage';

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

async function getApprovals() {
  const data = await localDb.getCollection<{ leave_requests: LeaveRequest[]; attendance_corrections: AttendanceCorrection[] }>('approvals');
  const d = (data as unknown as { leave_requests: LeaveRequest[]; attendance_corrections: AttendanceCorrection[] }[])[0];
  return { leaves: d?.leave_requests ?? [], corrections: d?.attendance_corrections ?? [] };
}

async function saveApprovals(leaves: LeaveRequest[], corrections: AttendanceCorrection[]) {
  await localDb.setCollection('approvals', [{ leave_requests: leaves, attendance_corrections: corrections }] as never[]);
}

export const approvalService = {
  async createLeaveRequest(payload: LeaveRequestPayload): Promise<LeaveRequest> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const { leaves, corrections } = await getApprovals();
      const item: LeaveRequest = {
        id: localDb.generateId('leave'),
        user_id: uid,
        status: 'pending',
        form_status: 'SUBMITTED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...payload,
      } as unknown as LeaveRequest;
      await saveApprovals([...leaves, item], corrections);
      return item;
    }
    return api.post<LeaveRequest>('/staff/leave-requests', payload);
  },

  async getMyLeaveRequests(): Promise<LeaveRequest[]> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const { leaves } = await getApprovals();
      return leaves.filter((l) => (l as unknown as { user_id: string }).user_id === uid);
    }
    return api.get<LeaveRequest[]>('/staff/leave-requests/my');
  },

  async getManagerLeaveRequests(): Promise<LeaveRequest[]> {
    if (APP_MODE === 'offline_apk') {
      const { leaves } = await getApprovals();
      return leaves;
    }
    return api.get<LeaveRequest[]>('/manager/leave-requests');
  },

  async reviewLeaveRequest(id: string, payload: ReviewPayload): Promise<LeaveRequest> {
    if (APP_MODE === 'offline_apk') {
      const { leaves, corrections } = await getApprovals();
      const idx = leaves.findIndex((l) => l.id === id);
      if (idx !== -1) {
        leaves[idx] = { ...leaves[idx], status: payload.status, manager_remarks: payload.remarks, form_status: payload.status === 'approved' ? 'APPROVED' : 'REJECTED' } as LeaveRequest;
        await saveApprovals(leaves, corrections);
        return leaves[idx];
      }
      throw new Error('Leave request not found');
    }
    return api.post<LeaveRequest>(`/manager/leave-requests/${id}/review`, payload);
  },

  async createAttendanceCorrection(payload: AttendanceCorrectionPayload): Promise<AttendanceCorrection> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const { leaves, corrections } = await getApprovals();
      const item: AttendanceCorrection = {
        id: localDb.generateId('corr'),
        user_id: uid,
        status: 'pending',
        form_status: 'SUBMITTED',
        created_at: new Date().toISOString(),
        ...payload,
      } as unknown as AttendanceCorrection;
      await saveApprovals(leaves, [...corrections, item]);
      return item;
    }
    return api.post<AttendanceCorrection>('/staff/attendance-corrections', payload);
  },

  async getMyAttendanceCorrections(): Promise<AttendanceCorrection[]> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const { corrections } = await getApprovals();
      return corrections.filter((c) => (c as unknown as { user_id: string }).user_id === uid);
    }
    return api.get<AttendanceCorrection[]>('/staff/attendance-corrections/my');
  },

  async getManagerAttendanceCorrections(): Promise<AttendanceCorrection[]> {
    if (APP_MODE === 'offline_apk') {
      const { corrections } = await getApprovals();
      return corrections;
    }
    return api.get<AttendanceCorrection[]>('/manager/attendance-corrections');
  },

  async reviewAttendanceCorrection(id: string, payload: ReviewPayload): Promise<AttendanceCorrection> {
    if (APP_MODE === 'offline_apk') {
      const { leaves, corrections } = await getApprovals();
      const idx = corrections.findIndex((c) => c.id === id);
      if (idx !== -1) {
        corrections[idx] = { ...corrections[idx], status: payload.status, manager_remarks: payload.remarks } as AttendanceCorrection;
        await saveApprovals(leaves, corrections);
        return corrections[idx];
      }
      throw new Error('Correction not found');
    }
    return api.post<AttendanceCorrection>(`/manager/attendance-corrections/${id}/review`, payload);
  },
};
