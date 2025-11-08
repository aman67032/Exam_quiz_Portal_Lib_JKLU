import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const message = (error.response?.data as any)?.detail || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export const API = {
  baseURL: API_BASE_URL,
  client: apiClient,
  
  // Auth endpoints
  login: (email: string, password: string, otp: string) => {
    return apiClient.post('/login', { email, password, otp });
  },

  sendOTP: (email: string) => {
    return apiClient.post('/send-otp', { email });
  },

  verifyOTP: (email: string, otp: string) => {
    return apiClient.post('/verify-otp', { email, otp });
  },

  register: (email: string, name: string, password: string, confirmPassword: string) => {
    return apiClient.post('/register', { 
      email, 
      name, 
      password, 
      confirm_password: confirmPassword 
    });
  },

  verifyRegistrationOTP: (email: string, otp: string) => {
    return apiClient.post('/register/verify-otp', { email, otp });
  },

  adminLogin: (email: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    return axios.post(`${API_BASE_URL}/admin-login`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  },

  createAdmin: (email: string, name: string, password: string) => {
    return apiClient.post('/create-admin', { email, name, password });
  },

  getCurrentUser: () => {
    return apiClient.get('/me');
  },

  // Forgot Password
  forgotPassword: (email: string) => {
    return apiClient.post('/forgot-password', { email });
  },

  resetPassword: (email: string, otp: string, newPassword: string, confirmPassword: string) => {
    return apiClient.post('/reset-password', {
      email,
      otp,
      new_password: newPassword,
      confirm_password: confirmPassword
    });
  },

  // Profile endpoints
  updateProfile: (data: {
    age?: number;
    year?: string;
    university?: string;
    department?: string;
    roll_no?: string;
    student_id?: string;
  }) => {
    return apiClient.put('/profile', data);
  },

  uploadProfilePhoto: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  uploadIdCard: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/profile/id-card', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Courses
  getCourses: () => {
    return apiClient.get('/courses');
  },

  getCourse: (id: number) => {
    return apiClient.get(`/courses/${id}`);
  },

  createCourse: (code: string, name: string, description?: string) => {
    return apiClient.post('/courses', { code, name, description });
  },

  updateCourse: (id: number, code?: string, name?: string, description?: string) => {
    return apiClient.put(`/courses/${id}`, { code, name, description });
  },

  deleteCourse: (id: number) => {
    return apiClient.delete(`/courses/${id}`);
  },

  checkOrCreateCourse: (code: string, name: string) => {
    return apiClient.post(`/courses/check-or-create?code=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}`);
  },

  createCourseForPaper: (code: string, name: string) => {
    return apiClient.post(`/courses/admin/create-with-paper?code=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}`);
  },

  // Papers
  uploadPaper: (formData: FormData) => {
    return apiClient.post('/papers/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getPapers: (filters?: {
    course_id?: number;
    paper_type?: string;
    year?: number;
    semester?: string;
    status?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    return apiClient.get(`/papers?${params}`);
  },

  getPendingPapers: () => {
    return apiClient.get('/papers/pending');
  },

  getPublicPapers: (filters?: {
    course_id?: number;
    paper_type?: string;
    year?: number;
    semester?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    return apiClient.get(`/papers/public/all?${params}`);
  },

  getPaper: (id: number) => {
    return apiClient.get(`/papers/${id}`);
  },

  downloadPaper: (id: number, config?: { responseType?: 'blob' }) => {
    return apiClient.get(`/papers/${id}/download`, {
      responseType: 'blob',
      ...config
    });
  },

  reviewPaper: (id: number, status: string, rejection_reason?: string) => {
    return apiClient.patch(`/papers/${id}/review`, {
      status,
      rejection_reason
    });
  },

  deletePaper: (id: number) => {
    return apiClient.delete(`/papers/${id}`);
  },

  previewPaper: (id: number) => {
    return apiClient.get(`/papers/${id}/preview`);
  },

  editPaper: (id: number, data: {
    course_id?: string;
    paper_type?: string;
    year?: string;
    semester?: string;
  }) => {
    const formData = new FormData();
    if (data.course_id) formData.append('course_id', data.course_id);
    if (data.paper_type) formData.append('paper_type', data.paper_type);
    if (data.year) formData.append('year', data.year);
    if (data.semester) formData.append('semester', data.semester);
    return apiClient.put(`/papers/${id}/edit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Admin
  getDashboardStats: () => {
    return apiClient.get('/admin/dashboard');
  },

  getVerificationRequests: () => {
    return apiClient.get('/admin/verification-requests');
  },

  verifyUser: (userId: number, approve: boolean, reason?: string) => {
    return apiClient.post(`/admin/verify-user/${userId}`, {
      approve,
      reason
    });
  },
};

export default apiClient;
