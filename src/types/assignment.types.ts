export type AssignmentType =
  | 'text'
  | 'pdf_upload'
  | 'image_upload'
  | 'checklist'
  | 'store_audit'
  | 'product_knowledge'
  | 'file'
  | 'training'
  | 'general'
  | 'pdf'
  | 'image';

export type AssignmentStatus =
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'resubmission_required'
  | 'overdue';

export type StaffAssignmentStatus =
  | 'pending'
  | 'overdue'
  | 'submitted'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'revision_required';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type AssignmentPriority = Priority;

export type AssignmentSubmissionStatus =
  | 'submitted'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'revision_required';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string | null;
  assignment_type: string;
  priority: Priority;
  due_date: string;
  assigned_by_name?: string;
  status: AssignmentStatus | string;
  attachments?: string[];
  submission_text?: string;
  submission_files?: string[];
  manager_remarks?: string;
  created_at: string;
  updated_at: string;

  // JSON-backend fields
  assign_scope?: 'store' | 'individual';
  assigned_to?: string[];
  store_code?: string;
  store_name?: string;
  created_by?: string;
  created_by_name?: string;

  // Staff-side computed fields from GET /assignments/my and /assignments/{id}
  submission?: AssignmentSubmission | null;
  staff_status?: StaffAssignmentStatus | string;
  submitted_at?: string | null;
  manager_feedback?: string | null;
}

export type AssignmentCreatePayload = {
  title: string;
  description: string;
  instructions?: string;
  priority: Priority;
  due_date?: string;
  assignment_type: AssignmentType;
  assign_scope?: 'store' | 'individual';
  assigned_to?: string[];
};

export type AssignmentSubmitPayload = {
  submission_text?: string;
  remarks?: string;
  proof_file_url?: string | null;
  proof_file_name?: string | null;
  // legacy fields used by existing assignment-submit.tsx
  comment?: string;
  file_url?: string;
  idempotency_key?: string;
};

export type AssignmentReviewPayload = {
  status: 'approved' | 'rejected' | 'revision_required';
  manager_feedback?: string;
};

export type AssignmentSubmission = {
  id: string;
  assignment_id: string;
  assignment_title?: string;

  // staff fields
  user_id?: string;
  staff_id?: string;
  staff_name?: string;
  staff_email?: string;
  employee_code?: string;

  // store fields
  store_code?: string;
  store_id?: string;
  store_name?: string;

  // submission content
  comment?: string | null;
  submission_text?: string;
  remarks?: string | null;
  file_url?: string | null;
  proof_file_url?: string | null;
  proof_file_name?: string | null;

  status: AssignmentStatus | string;
  form_status?: string;

  // review fields
  review_remarks?: string | null;
  manager_feedback?: string | null;
  reviewed_by?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;

  // enrichment fields from GET /manager/assignment-submissions
  assignment_priority?: Priority | null;
  assignment_due_date?: string | null;
  created_by_name?: string | null;

  submitted_at?: string;
  created_at?: string;
  updated_at?: string;
};
