import { api } from './api';

export type GeofenceEvent = {
  id: string;
  event_type: string;
  staff_id: string;
  employee_code?: string;
  staff_name?: string;
  store_id?: string;
  store_code?: string;
  store_name?: string;
  manager_id?: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  distance_meters: number;
  geofence_radius_meters: number;
  geofence_status: string;
  active_session_id?: string | null;
  decision: string;
  risk_level: string;
  flags: string[];
  created_at: string;
};

export type GeofenceException = {
  id: string;
  exception_type: string;
  severity: string;
  staff_id: string;
  employee_code?: string;
  staff_name?: string;
  store_code?: string;
  store_name?: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  distance_meters: number;
  geofence_status: string;
  message: string;
  status: 'open' | 'reviewed' | 'dismissed';
  reviewed_by?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  manager_remarks?: string | null;
  created_at: string;
  updated_at: string;
};

export type LocationAnomaly = {
  id: string;
  staff_id: string;
  employee_code?: string;
  staff_name?: string;
  store_code?: string;
  store_name?: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  anomaly_type: string;
  distance_from_last_ping?: number | null;
  seconds_from_last_ping?: number | null;
  message?: string | null;
  status: 'open' | 'reviewed' | 'dismissed';
  reviewed_by?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  manager_remarks?: string | null;
  created_at: string;
  updated_at: string;
};

export type GeofenceSummary = {
  total_events: number;
  total_exceptions: number;
  open_exceptions: number;
  reviewed_exceptions: number;
  high_severity_exceptions: number;
  total_anomalies: number;
  open_anomalies: number;
  reviewed_anomalies: number;
};

export type ReviewPayload = {
  status?: string;
  manager_remarks?: string;
};

export const geofenceService = {
  // ── Manager ────────────────────────────────────────────────────────────────

  async getManagerEvents(params?: { date_from?: string; date_to?: string }): Promise<GeofenceEvent[]> {
    const query = new URLSearchParams();
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    const qs = query.toString();
    const res = await api.get(`/manager/geofence/events${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  async getManagerExceptions(status?: string): Promise<GeofenceException[]> {
    const qs = status ? `?status=${status}` : '';
    const res = await api.get(`/manager/geofence/exceptions${qs}`);
    return res.data;
  },

  async getManagerAnomalies(status?: string): Promise<LocationAnomaly[]> {
    const qs = status ? `?status=${status}` : '';
    const res = await api.get(`/manager/geofence/anomalies${qs}`);
    return res.data;
  },

  async reviewException(exceptionId: string, payload: ReviewPayload): Promise<GeofenceException> {
    const res = await api.post(`/manager/geofence/exceptions/${exceptionId}/review`, payload);
    return res.data;
  },

  async reviewAnomaly(anomalyId: string, payload: ReviewPayload): Promise<LocationAnomaly> {
    const res = await api.post(`/manager/geofence/anomalies/${anomalyId}/review`, payload);
    return res.data;
  },

  // ── Admin ──────────────────────────────────────────────────────────────────

  async getAdminSummary(): Promise<GeofenceSummary> {
    const res = await api.get('/admin/geofence/summary');
    return res.data;
  },

  async getAdminEvents(params?: { store_code?: string; date_from?: string; date_to?: string }): Promise<GeofenceEvent[]> {
    const query = new URLSearchParams();
    if (params?.store_code) query.append('store_code', params.store_code);
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    const qs = query.toString();
    const res = await api.get(`/admin/geofence/events${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  async getAdminExceptions(params?: { store_code?: string; status?: string }): Promise<GeofenceException[]> {
    const query = new URLSearchParams();
    if (params?.store_code) query.append('store_code', params.store_code);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString();
    const res = await api.get(`/admin/geofence/exceptions${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  async getAdminAnomalies(params?: { store_code?: string; status?: string }): Promise<LocationAnomaly[]> {
    const query = new URLSearchParams();
    if (params?.store_code) query.append('store_code', params.store_code);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString();
    const res = await api.get(`/admin/geofence/anomalies${qs ? `?${qs}` : ''}`);
    return res.data;
  },
};
