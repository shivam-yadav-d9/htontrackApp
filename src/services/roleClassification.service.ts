import api from './api';

export interface RoleClassificationRule {
  id: string;
  role_key: string;
  role_name: string;
  department_keywords: string[];
  designation_keywords: string[];
  course_path: string;
  checklist_group: string;
  target_type: string;
  skill_matrix_group: string;
  coaching_group: string;
  priority: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface EmployeeRoleClassification {
  id: string;
  staff_id: string;
  employee_code: string;
  employee_name: string;
  employee_role: string;
  store_id: string;
  store_code: string;
  store_name: string;
  manager_id: string;
  manager_name: string;
  department: string;
  designation: string;
  role_key: string;
  role_name: string;
  course_path: string;
  checklist_group: string;
  target_type: string;
  skill_matrix_group: string;
  coaching_group: string;
  skill_level: string;
  classification_source: 'auto_rule_engine' | 'manual_admin_override';
  classification_reason: string;
  confidence_score: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RoleClassificationSummary {
  total_classifications: number;
  role_counts: Record<string, number>;
  store_counts: Record<string, number>;
  skill_counts: Record<string, number>;
}

export interface BulkClassificationResult {
  total_checked: number;
  classified_count: number;
  error_count: number;
  classifications: EmployeeRoleClassification[];
  errors: Array<{ staff_id: string; employee_code: string; error: string }>;
}

export interface RoleClassificationRuleCreatePayload {
  role_key: string;
  role_name: string;
  department_keywords?: string[];
  designation_keywords?: string[];
  course_path: string;
  checklist_group: string;
  target_type: string;
  skill_matrix_group: string;
  coaching_group: string;
  priority?: number;
  status?: string;
}

export interface RoleClassificationRuleUpdatePayload {
  role_name?: string;
  department_keywords?: string[];
  designation_keywords?: string[];
  course_path?: string;
  checklist_group?: string;
  target_type?: string;
  skill_matrix_group?: string;
  coaching_group?: string;
  priority?: number;
  status?: string;
}

export interface ManualClassificationPayload {
  role_key: string;
  skill_level?: string;
  reason?: string;
}

export const roleClassificationService = {
  // Admin — rules
  adminListRules: (): Promise<RoleClassificationRule[]> =>
    api.get('/admin/role-classification/rules').then(r => r.data),

  adminCreateRule: (payload: RoleClassificationRuleCreatePayload): Promise<RoleClassificationRule> =>
    api.post('/admin/role-classification/rules', payload).then(r => r.data),

  adminUpdateRule: (roleKey: string, payload: RoleClassificationRuleUpdatePayload): Promise<RoleClassificationRule> =>
    api.put(`/admin/role-classification/rules/${roleKey}`, payload).then(r => r.data),

  // Admin — run & view
  adminRunClassification: (): Promise<BulkClassificationResult> =>
    api.post('/admin/role-classification/run').then(r => r.data),

  adminGetAllClassifications: (): Promise<EmployeeRoleClassification[]> =>
    api.get('/admin/role-classification/classifications').then(r => r.data),

  adminGetSummary: (): Promise<RoleClassificationSummary> =>
    api.get('/admin/role-classification/summary').then(r => r.data),

  adminGetEmployeeClassification: (staffId: string): Promise<EmployeeRoleClassification> =>
    api.get(`/admin/employees/${staffId}/role-classification`).then(r => r.data),

  adminManualClassify: (staffId: string, payload: ManualClassificationPayload): Promise<EmployeeRoleClassification> =>
    api.post(`/admin/employees/${staffId}/role-classification`, payload).then(r => r.data),

  // Staff
  getMyClassification: (): Promise<EmployeeRoleClassification> =>
    api.get('/staff/role-classification/my').then(r => r.data),

  // Manager
  getTeamMemberClassification: (staffId: string): Promise<EmployeeRoleClassification> =>
    api.get(`/manager/team/${staffId}/role-classification`).then(r => r.data),
};
