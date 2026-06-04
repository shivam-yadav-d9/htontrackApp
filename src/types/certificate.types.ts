export interface Certificate {
  id: string;
  certificate_code: string;
  course_title: string;
  employee_name: string;
  employee_id: string;
  store_name: string;
  score: number;
  certificate_url: string;
  issued_at: string;
  verification_url: string;
  status: 'active' | 'revoked';
}
