import { api } from './api';

export type SalesOrderCreatePayload = {
  sales_date: string;
  employee_code: string;
  order_id: string;
  order_amount: number;
  product_category?: string;
  product_name?: string;
  customer_name?: string;
  customer_mobile?: string;
  quantity?: number;
  payment_status?: string;
  order_status?: string;
  remarks?: string;
};

export type SalesOrderUpdatePayload = Partial<Omit<SalesOrderCreatePayload, 'sales_date' | 'employee_code' | 'order_id'>>;

export type SalesCorrectionRequestPayload = {
  order_id: string;
  correction_type: string;
  requested_order_amount?: number;
  requested_order_status?: string;
  reason: string;
};

export type SalesCorrectionReviewPayload = {
  status: 'approved' | 'rejected';
  manager_remarks?: string;
};

export const salesService = {
  // ── Staff ────────────────────────────────────────────────────────────────

  getMySales(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/staff/sales/my${query}`);
  },

  createCorrectionRequest(payload: SalesCorrectionRequestPayload) {
    return api.post('/staff/sales/correction-requests', payload);
  },

  // ── Manager ───────────────────────────────────────────────────────────────

  createOrder(payload: SalesOrderCreatePayload) {
    return api.post('/manager/sales/orders', payload);
  },

  getManagerOrders(params?: {
    period_key?: string;
    employee_code?: string;
    product_category?: string;
    order_status?: string;
  }) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v != null)) as Record<string, string>
    );
    const qs = query.toString();
    return api.get(`/manager/sales/orders${qs ? `?${qs}` : ''}`);
  },

  updateOrder(orderId: string, payload: SalesOrderUpdatePayload) {
    return api.put(`/manager/sales/orders/${orderId}`, payload);
  },

  cancelOrder(orderId: string, remarks?: string) {
    const query = remarks ? `?remarks=${encodeURIComponent(remarks)}` : '';
    return api.post(`/manager/sales/orders/${orderId}/cancel${query}`);
  },

  getManagerCategorySummary(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/manager/sales/category-summary${query}`);
  },

  getManagerCorrections(status?: string) {
    const query = status ? `?status=${status}` : '';
    return api.get(`/manager/sales/correction-requests${query}`);
  },

  reviewCorrection(correctionId: string, payload: SalesCorrectionReviewPayload) {
    return api.post(`/manager/sales/correction-requests/${correctionId}/review`, payload);
  },

  // ── Admin ─────────────────────────────────────────────────────────────────

  getAdminOrders(params?: {
    period_key?: string;
    store_code?: string;
    employee_code?: string;
    product_category?: string;
    order_status?: string;
  }) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v != null)) as Record<string, string>
    );
    const qs = query.toString();
    return api.get(`/admin/sales/orders${qs ? `?${qs}` : ''}`);
  },

  getAdminCategorySummary(params?: { period_key?: string; store_code?: string }) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v != null)) as Record<string, string>
    );
    const qs = query.toString();
    return api.get(`/admin/sales/category-summary${qs ? `?${qs}` : ''}`);
  },

  getAdminCorrections(status?: string) {
    const query = status ? `?status=${status}` : '';
    return api.get(`/admin/sales/correction-requests${query}`);
  },
};
