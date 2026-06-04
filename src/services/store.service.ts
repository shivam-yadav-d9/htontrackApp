import { api } from './api';

export type Store = {
  id: string;
  store_code: string;
  site_code?: string | null;
  store_name: string;
  display_name?: string | null;
  brand_name?: string | null;
  store_type?: string | null;

  zone?: string | null;
  region?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  pincode?: string | null;

  latitude?: number | null;
  longitude?: number | null;
  geofence_radius_meters: number;
  geofence_status?: string | null;
  geofence_ready?: boolean;

  manager_id?: string | null;
  manager_name?: string | null;
  manager_email?: string | null;
  manager_mobile?: string | null;
  manager?: Record<string, unknown> | null;

  staff_count?: number;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type StoreDetail = {
  store: Store;
  manager: Record<string, unknown> | null;
  staff_count: number;
  staff: Record<string, unknown>[];
  geofence_ready: boolean;
  summary?: {
    monthly_target_records: number;
    daily_target_records: number;
    weekly_off_records: number;
    attendance_session_records: number;
  };
};

export type StoreCreatePayload = {
  store_code: string;
  site_code?: string | null;
  store_name: string;
  display_name?: string | null;
  brand_name?: string;
  store_type?: string;
  zone?: string | null;
  region?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  manager_id?: string | null;
  status?: string;
};

export type StoreUpdatePayload = Partial<Omit<StoreCreatePayload, 'store_code'>> & {
  geofence_status?: string;
};

export const storeService = {
  getStores() {
    return api.get<Store[]>('/admin/stores');
  },

  getStore(storeId: string) {
    return api.get<StoreDetail>(`/admin/stores/${storeId}`);
  },

  createStore(payload: StoreCreatePayload) {
    return api.post<Store>('/admin/stores', payload);
  },

  updateStore(storeId: string, payload: StoreUpdatePayload) {
    return api.put<Store>(`/admin/stores/${storeId}`, payload);
  },

  deactivateStore(storeId: string) {
    return api.delete<Store>(`/admin/stores/${storeId}`);
  },

  verifyGeofence(
    storeId: string,
    payload: { latitude: number; longitude: number; verification_note?: string },
  ) {
    return api.post<Store>(`/admin/stores/${storeId}/verify-geofence`, payload);
  },

  assignManager(storeId: string, managerId: string) {
    return api.post<Store>(`/admin/stores/${storeId}/assign-manager`, {
      manager_id: managerId,
    });
  },

  getStoreSummary(storeId: string) {
    return api.get<StoreDetail>(`/admin/stores/${storeId}/summary`);
  },

  getStoreEmployees(storeId: string) {
    return api.get<Record<string, unknown>[]>(`/admin/stores/${storeId}/employees`);
  },

  getStoreManagers(storeId: string) {
    return api.get<Record<string, unknown>[]>(`/admin/stores/${storeId}/managers`);
  },
};
