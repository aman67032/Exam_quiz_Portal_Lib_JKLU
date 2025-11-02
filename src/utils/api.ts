import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

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
  login: (username: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    return axios.post(`${API_BASE_URL}/login`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  },

  register: (email: string, name: string, password: string) => {
    return apiClient.post('/register', { email, name, password });
  },

  getCurrentUser: () => {
    return apiClient.get('/me');
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

  getPaper: (id: number) => {
    return apiClient.get(`/papers/${id}`);
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

  downloadPaper: (id: number) => {
    return apiClient.get(`/papers/${id}/download`);
  },

  // Admin
  getDashboardStats: () => {
    return apiClient.get('/admin/dashboard');
  },
};

export default apiClient;
