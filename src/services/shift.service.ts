import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import { storage } from '@/utils/storage';

export interface ShiftDuty {
  id: string;
  store_id?: string;
  assigned_by_id: string;
  assigned_by_name: string;
  assigned_to_id: string;
  assigned_to_name: string;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  description?: string | null;
  status: 'assigned' | 'acknowledged' | 'completed' | 'cancelled';
  created_at: string;
}

export interface AssignShiftPayload {
  assigned_to_id: string;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  description?: string;
}

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

export const shiftService = {
  async assignDuty(data: AssignShiftPayload): Promise<ShiftDuty> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const users = await localDb.getCollection<{ id: string; full_name?: string }>('users');
      const assignedTo = users.find((u) => u.id === data.assigned_to_id);
      const assignedBy = users.find((u) => u.id === uid);
      const item: ShiftDuty = {
        id: localDb.generateId('shift'),
        store_id: 'store_001',
        assigned_by_id: uid,
        assigned_by_name: assignedBy?.full_name ?? 'Manager',
        assigned_to_id: data.assigned_to_id,
        assigned_to_name: assignedTo?.full_name ?? '',
        shift_date: data.shift_date,
        shift_start: data.shift_start,
        shift_end: data.shift_end,
        description: data.description ?? null,
        status: 'assigned',
        created_at: new Date().toISOString(),
      };
      return localDb.addItem('shifts', item);
    }
    return api.post<ShiftDuty>('/manager/shifts/assign', data);
  },

  async getStoreDuties(): Promise<ShiftDuty[]> {
    if (APP_MODE === 'offline_apk') {
      return localDb.getCollection<ShiftDuty>('shifts');
    }
    return api.get<ShiftDuty[]>('/manager/shifts');
  },

  async getMyDuties(): Promise<ShiftDuty[]> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const shifts = await localDb.getCollection<ShiftDuty>('shifts');
      return shifts.filter((s) => s.assigned_to_id === uid);
    }
    return api.get<ShiftDuty[]>('/shifts/my');
  },

  async acknowledgeDuty(id: string): Promise<ShiftDuty> {
    if (APP_MODE === 'offline_apk') {
      const updated = await localDb.updateItem<ShiftDuty>('shifts', id, { status: 'acknowledged' });
      return updated ?? ({ id, status: 'acknowledged' } as ShiftDuty);
    }
    return api.post<ShiftDuty>(`/shifts/${id}/acknowledge`, {});
  },
};
