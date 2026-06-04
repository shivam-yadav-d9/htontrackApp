export type ChecklistType =
  | 'opening'
  | 'closing'
  | 'audit'
  | 'cleanliness'
  | 'safety'
  | 'festive_setup'
  | 'customer_followup'
  | 'lighting_decor'
  | 'general';

export type ChecklistPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ChecklistFrequency = 'daily' | 'weekly' | 'monthly' | 'one_time';
export type ChecklistAssignScope = 'store' | 'individual';
export type ChecklistAnswer = 'yes' | 'no' | 'na';
export type ChecklistStatus = 'active' | 'inactive' | 'completed';

// Legacy item shape (DB backend)
export type ChecklistItemLegacy = {
  id: string;
  label: string;
  required: boolean;
};

// JSON backend item shape
export type ChecklistItem = {
  id: string;
  title: string;
  description?: string;
  is_required: boolean;
  sort_order: number;
  // legacy compat
  label?: string;
  required?: boolean;
};

export type ChecklistItemResponse = {
  item_id: string;
  answer: ChecklistAnswer;
  remarks?: string;
};

export type ChecklistSubmission = {
  id: string;
  checklist_id: string;
  checklist_title?: string;
  staff_id: string;
  staff_name?: string;
  store_code?: string;
  responses: ChecklistItemResponse[];
  overall_remarks?: string;
  proof_file_name?: string;
  proof_file_url?: string;
  yes_count: number;
  no_count: number;
  na_count: number;
  issue_count: number;
  completion_percentage: number;
  status: 'submitted' | 'submitted_with_issues';
  created_at?: string;
};

export type Checklist = {
  id: string;
  title: string;
  description?: string;
  checklist_type: ChecklistType;
  priority?: ChecklistPriority;
  frequency?: ChecklistFrequency;
  due_date?: string | null;
  assign_scope?: ChecklistAssignScope;
  assigned_to?: string[];
  // legacy items shape (DB)
  items: ChecklistItem[];
  store_code?: string;
  created_by?: string;
  created_by_name?: string;
  status: ChecklistStatus | 'submitted' | 'submitted_with_issues';
  // staff enrichment
  staff_status?: 'pending' | 'submitted';
  submission?: ChecklistSubmission | null;
  created_at?: string;
  updated_at?: string;
};

export type ChecklistCreatePayload = {
  title: string;
  description?: string;
  checklist_type: ChecklistType;
  priority: ChecklistPriority;
  frequency: ChecklistFrequency;
  due_date?: string | null;
  assign_scope: ChecklistAssignScope;
  assigned_to: string[];
  items: Array<{
    id?: string;
    title: string;
    description?: string;
    is_required: boolean;
    sort_order: number;
  }>;
};

export type ChecklistSubmitPayload = {
  responses: ChecklistItemResponse[];
  overall_remarks?: string;
  proof_file_name?: string;
  proof_file_url?: string;
};

// Legacy response shape (old DB backend)
export type ChecklistResponseAnswer = {
  item_id: string;
  label: string;
  answer: ChecklistAnswer;
  remarks?: string;
};

export type ChecklistResponse = {
  id: string;
  checklist_id: string;
  staff_id: string;
  staff_name?: string;
  store_code?: string;
  responses: ChecklistResponseAnswer[];
  status: 'submitted' | 'reviewed';
  created_at?: string;
  updated_at?: string;
};

// ── New role-wise checklist types (Step 70) ──────────────────────────────────

export type ChecklistItemType = 'yes_no' | 'done_not_done' | 'rating' | 'text' | 'number' | 'photo_required';
export type ChecklistAssignmentStatus = 'assigned' | 'in_progress' | 'submitted' | 'reviewed' | 'rejected' | 'needs_correction' | 'cancelled';
export type ChecklistReviewStatus = 'approved' | 'rejected' | 'needs_correction';

export type ChecklistTemplate = {
  id: string;
  title: string;
  description?: string | null;
  checklist_type: string;
  frequency: string;
  role_keys: string[];
  departments: string[];
  store_codes: string[];
  zones: string[];
  requires_manager_review: boolean;
  requires_photo: boolean;
  allow_remarks: boolean;
  priority: string;
  estimated_minutes: number;
  status: 'draft' | 'published' | 'archived';
  items_count?: number;
  created_by?: string;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
};

export type ChecklistTemplateItem = {
  id: string;
  template_id: string;
  item_text: string;
  item_type: ChecklistItemType;
  item_order: number;
  is_required: boolean;
  requires_photo: boolean;
  allow_remarks: boolean;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
};

export type ChecklistAssignment = {
  id: string;
  template_id: string;
  template_title: string;
  checklist_type?: string;
  staff_id: string;
  employee_code?: string;
  staff_name: string;
  store_code?: string;
  store_name?: string;
  manager_id?: string;
  manager_name?: string;
  assigned_date: string;
  due_date: string;
  status: ChecklistAssignmentStatus;
  completion_percentage: number;
  submitted_at?: string | null;
  review_status?: ChecklistReviewStatus | null;
  reviewed_at?: string | null;
  manager_remarks?: string | null;
  final_remarks?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ChecklistItemSubmission = {
  id: string;
  assignment_id: string;
  template_id?: string;
  item_id: string;
  item_text?: string;
  item_type?: ChecklistItemType;
  staff_id?: string;
  response_value: any;
  remarks?: string | null;
  photo_url?: string | null;
  submitted_at?: string;
  updated_at?: string;
};

export type ChecklistAssignmentDetail = {
  assignment: ChecklistAssignment;
  template: ChecklistTemplate;
  items: ChecklistTemplateItem[];
  submissions: ChecklistItemSubmission[];
};

export type ChecklistItemSubmitPayload = {
  response_value: any;
  remarks?: string;
  photo_url?: string;
};

export type ChecklistFullSubmitPayload = {
  items: Array<{ item_id: string; response_value: any; remarks?: string; photo_url?: string }>;
  final_remarks?: string;
};
