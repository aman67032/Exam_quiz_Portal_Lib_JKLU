export interface Stats {
  total_papers: number;
  pending_papers: number;
  approved_papers: number;
  rejected_papers: number;
  total_courses: number;
  total_users: number;
}

export interface Paper {
  id: number;
  title: string;
  description?: string;
  paper_type: string;
  year?: number;
  semester?: string;
  file_name: string;
  file_path?: string;
  course_code?: string;
  course_name?: string;
  uploader_name?: string;
  uploader_email?: string;
  status?: string;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  admin_role: string | null;
  is_sub_admin: boolean;
  created_at: string;
}

export interface VerificationRequest {
  id: number;
  name: string;
  email: string;
  photo_path?: string;
  id_card_path?: string;
  age?: number;
  year?: string;
  university?: string;
  department?: string;
  roll_no?: string;
  student_id?: string;
  id_verified: boolean;
}

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  tone: 'danger' | 'primary';
}
