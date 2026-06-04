// ── Priority ──────────────────────────────────────────────────────────────────
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type AnnouncementPriority = Priority; // backward compat alias

// ── Announcement ─────────────────────────────────────────────────────────────
export type AnnouncementType =
  // JSON backend values (human-readable)
  | 'New offer launched'
  | 'Festive campaign'
  | 'Price update'
  | 'Policy update'
  | 'Training reminder'
  | 'Store audit notice'
  | 'New product arrival'
  | 'Urgent compliance update'
  | 'General'
  // DB backend legacy values (underscored)
  | 'new_offer'
  | 'festive_campaign'
  | 'price_update'
  | 'policy_update'
  | 'training_reminder'
  | 'store_audit_notice'
  | 'new_product_arrival'
  | 'urgent_compliance_update'
  | 'general';

export type Announcement = {
  id: string;
  title: string;
  description: string;

  // JSON backend field
  announcement_type?: AnnouncementType;
  // DB backend legacy field
  type?: AnnouncementType;

  priority: Priority;
  requires_acknowledgement: boolean;

  attachment_name?: string | null;
  attachment_url?: string | null;

  store_code?: string;
  store_id?: string;
  store_name?: string;

  created_by?: string;
  created_by_name?: string;

  status: 'active' | 'inactive' | 'expired';

  acknowledged_by?: string[];
  acknowledgements?: any[];

  // JSON backend enrichment
  acknowledged_count?: number;
  pending_acknowledgement_count?: number;
  is_acknowledged?: boolean;

  // DB backend legacy
  acknowledgement_count?: number;
  require_acknowledgement?: boolean;

  expiry_date?: string | null;

  created_at?: string;
  updated_at?: string;
};

export type AnnouncementCreatePayload = {
  title: string;
  description: string;
  announcement_type: AnnouncementType;
  priority: Priority;
  requires_acknowledgement: boolean;
  attachment_name?: string | null;
  attachment_url?: string | null;
  // DB legacy
  expiry_date?: string | null;
};

// ── Reminder ─────────────────────────────────────────────────────────────────
export type ReminderType =
  | 'Assignment'
  | 'Training'
  | 'Quiz'
  | 'Target'
  | 'Document'
  | 'Attendance'
  | 'Store Operations'
  | 'General';

export type ReminderStatus = 'scheduled' | 'read' | 'completed' | 'cancelled' | 'active';

export type Reminder = {
  id: string;
  title: string;
  message: string;
  reminder_type?: string;
  priority?: Priority;

  // JSON backend fields
  scheduled_date?: string | null;
  assigned_to?: string[];
  store_code?: string;
  store_id?: string;
  store_name?: string;
  created_by?: string;
  created_by_name?: string;
  status?: ReminderStatus | string;
  read_by?: string[];
  read_receipts?: any[];
  read_count?: number;
  unread_count?: number;
  is_read?: boolean;

  // DB backend legacy fields
  staff_id?: string | null;
  scheduled_at?: string;
  remind_at?: string;
  is_dismissed?: boolean;

  created_at?: string;
  updated_at?: string;
};

export type ReminderCreatePayload = {
  title: string;
  message: string;
  reminder_type?: ReminderType | string;
  priority?: Priority;
  scheduled_date?: string | null;
  assigned_to?: string[];
  // DB legacy
  staff_id?: string | null;
  scheduled_at?: string;
};

// ── Notification ─────────────────────────────────────────────────────────────
export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  reference_id?: string;
  is_read: boolean;
  created_at?: string;
};
