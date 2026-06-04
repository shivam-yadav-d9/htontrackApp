export type TicketType =
  | 'Attendance issue'
  | 'Training issue'
  | 'Target issue'
  | 'Customer complaint'
  | 'Store maintenance'
  | 'IT support'
  | 'POS issue'
  | 'Product availability issue'
  | 'Other';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';

export type TicketComment = {
  // JSON backend fields
  comment?: string;
  commented_by?: string;
  commented_by_name?: string;
  commented_by_role?: string;

  // DB backend legacy fields
  id?: string;
  user_id?: string;
  user_name?: string;
  message?: string;
  author_name?: string;

  created_at?: string;
};

export type Ticket = {
  id: string;

  ticket_type: TicketType;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;

  attachment_name?: string | null;
  attachment_url?: string | null;

  staff_id: string;
  staff_name?: string;
  staff_email?: string;
  employee_code?: string;

  store_code?: string;
  store_id?: string;
  store_name?: string;

  manager_note?: string | null;
  assigned_manager_id?: string | null;
  assigned_manager_name?: string | null;

  comments?: TicketComment[];

  last_updated_by?: string | null;
  last_updated_by_name?: string | null;

  created_at?: string;
  updated_at?: string;
};

export type TicketCreatePayload = {
  ticket_type: TicketType;
  title: string;
  description: string;
  priority: TicketPriority;
  attachment_name?: string | null;
  attachment_url?: string | null;
};

export type TicketStatusUpdatePayload = {
  status: TicketStatus;
  manager_note?: string;
  // legacy alias kept for DB-based routes
  comment?: string;
};

export type TicketCommentPayload = {
  comment: string;
};
