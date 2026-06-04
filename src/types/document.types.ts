export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'resubmitted';

export type DocumentType =
  | 'Identity Document'
  | 'Training Proof'
  | 'Assignment Proof'
  | 'Store Audit Proof'
  | 'Compliance Document'
  | 'Profile Verification';

export type StaffDocument = {
  id: string;

  staff_id: string;
  staff_name?: string;
  store_code?: string;

  document_type: DocumentType;

  file_name: string;
  file_url?: string | null;
  file_type?: string;
  file_size_mb?: number;

  remarks?: string | null;
  expiry_date?: string | null;

  status: DocumentStatus;

  manager_remarks?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;

  created_at?: string;
  updated_at?: string;
};

export type DocumentCreatePayload = {
  document_type: DocumentType;
  file_name: string;
  file_url?: string | null;
  file_type?: string;
  file_size_mb?: number;
  remarks?: string;
  expiry_date?: string | null;
};

export type DocumentReviewPayload = {
  status: 'approved' | 'rejected';
  manager_remarks?: string;
};
