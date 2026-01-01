import axios from 'axios';
import type { AxiosInstance, AxiosError, AxiosResponse } from 'axios';

// API Base URL Configuration
// Priority: 1. VITE_API_URL env var, 2. VITE_BACKEND_URL env var, 3. Production backend (default)
// For localhost development, this will use the production backend on Railway
// To override, create a .env file with: VITE_API_URL=your-backend-url
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'https://exampaperportal-production.up.railway.app';

// Log backend URL in development mode for debugging
if (import.meta.env.DEV) {
  console.log('🔗 Backend API URL:', API_BASE_URL);
}

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});



// Simple in-memory cache for selected GET requests
type CacheEntry<T = any> = {
  timestamp: number;
  data: AxiosResponse<T>;
  ttl: number;
};

const responseCache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

const buildCacheKey = (path: string, params?: URLSearchParams): string => {
  if (params && params.toString()) {
    return `${path}?${params.toString()}`;
  }
  return path;
};

const getWithCache = async <T = any>(
  path: string,
  options?: {
    params?: URLSearchParams;
    ttlMs?: number;
    config?: Parameters<AxiosInstance['get']>[1];
  }
): Promise<AxiosResponse<T>> => {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL;
  const key = buildCacheKey(path, options?.params);
  const now = Date.now();

  const cached = responseCache.get(key) as CacheEntry<T> | undefined;
  if (cached && now - cached.timestamp < cached.ttl) {
    return cached.data;
  }

  const url =
    options?.params && options.params.toString()
      ? `${path}?${options.params.toString()}`
      : path;

  const response = await apiClient.get<T>(url, options?.config);
  responseCache.set(key, {
    timestamp: now,
    data: response,
    ttl: ttlMs,
  });

  return response;
};

const clearCache = () => {
  responseCache.clear();
};

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

// Add response interceptor to handle errors and backend wake-up
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // If backend is sleeping (connection error), try to wake it up
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ERR_NETWORK' ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('NetworkError') ||
      (!error.response && error.request)
    ) {
      console.log('⏳ Backend appears to be sleeping, attempting to wake up...');

      // Try to wake up the backend
      try {
        const wakeResponse = await fetch(`${API_BASE_URL}/wake`, {
          method: 'GET',
          signal: AbortSignal.timeout(30000), // 30 second timeout for cold start
        });

        if (wakeResponse.ok) {
          console.log('✓ Backend woke up, retrying original request...');
          // Retry the original request after a short delay
          await new Promise((resolve) => setTimeout(resolve, 2000));
          // Note: We can't automatically retry here, but the wake-up helps
        }
      } catch (wakeError) {
        console.warn('⚠️ Backend wake-up attempt failed:', wakeError);
      }
    }

    const message =
      (error.response?.data as any)?.detail ||
      error.message ||
      'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export const API = {
  baseURL: API_BASE_URL,
  client: apiClient,
  clearCache,

  // Auth endpoints
  login: (email: string, password: string) => {
    return apiClient.post('/login', { email, password });
  },

  register: (
    email: string,
    name: string,
    password: string,
    confirmPassword: string
  ) => {
    return apiClient.post('/register', {
      email,
      name,
      password,
      confirm_password: confirmPassword,
    });
  },

  adminLogin: (email: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    return apiClient.post('/admin-login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

  resetPassword: (
    email: string,
    otp: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    return apiClient.post('/reset-password', {
      email,
      otp,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
  },

  // Profile endpoints
  updateProfile: (data: { roll_no?: string; student_id?: string }) => {
    return apiClient.put('/profile', data);
  },

  uploadIdCard: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/profile/id-card', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Courses
  getCourses: () => {
    return getWithCache('/courses');
  },

  getCourse: (id: number) => {
    return getWithCache(`/courses/${id}`);
  },

  createCourse: (code: string, name: string, description?: string) => {
    return apiClient.post('/courses', { code, name, description }).then((res) => {
      clearCache();
      return res;
    });
  },

  updateCourse: (
    id: number,
    code?: string,
    name?: string,
    description?: string
  ) => {
    return apiClient
      .put(`/courses/${id}`, { code, name, description })
      .then((res) => {
        clearCache();
        return res;
      });
  },

  deleteCourse: (id: number) => {
    return apiClient.delete(`/courses/${id}`).then((res) => {
      clearCache();
      return res;
    });
  },

  checkOrCreateCourse: (code: string, name: string) => {
    return apiClient.post(
      `/courses/check-or-create?code=${encodeURIComponent(
        code
      )}&name=${encodeURIComponent(name)}`
    );
  },

  createCourseForPaper: (code: string, name: string) => {
    return apiClient.post(
      `/courses/admin/create-with-paper?code=${encodeURIComponent(
        code
      )}&name=${encodeURIComponent(name)}`
    );
  },

  // Papers
  uploadPaper: (formData: FormData) => {
    return apiClient
      .post('/papers/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => {
        clearCache();
        return res;
      });
  },

  getPapers: (filters?: {
    course_id?: number;
    paper_type?: string;
    year?: number;
    semester?: string;
    status?: string;
    department?: string;
    my_papers_only?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    // Shorter TTL for admin / filtered lists
    return getWithCache('/papers', { params, ttlMs: 60 * 1000 });
  },

  getPendingPapers: () => {
    return getWithCache('/papers/pending', { ttlMs: 60 * 1000 });
  },

  getPublicPapers: (filters?: {
    course_id?: number;
    paper_type?: string;
    year?: number;
    semester?: string;
    department?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    return getWithCache('/papers/public/all', { params });
  },

  getPaper: (id: number) => {
    return getWithCache(`/papers/${id}`, { ttlMs: 60 * 1000 });
  },

  downloadPaper: (id: number, config?: { responseType?: 'blob' }) => {
    return apiClient.get(`/papers/${id}/download`, {
      responseType: 'blob',
      ...config,
    });
  },

  reviewPaper: (
    id: number,
    status: string,
    rejection_reason?: string,
    admin_feedback?: { message: string }
  ) => {
    const payload: any = { status };
    if (status === 'rejected') {
      if (admin_feedback) {
        payload.admin_feedback = admin_feedback;
      }
      if (rejection_reason) {
        payload.rejection_reason = rejection_reason;
      }
    }
    return apiClient.patch(`/papers/${id}/review`, payload).then((res) => {
      clearCache();
      return res;
    });
  },

  deletePaper: (id: number) => {
    return apiClient.delete(`/papers/${id}`).then((res) => {
      clearCache();
      return res;
    });
  },

  previewPaper: (id: number) => {
    return apiClient.get(`/papers/${id}/preview`);
  },

  editPaper: (
    id: number,
    data: {
      course_id?: string;
      paper_type?: string;
      year?: string;
      semester?: string;
    }
  ) => {
    const formData = new FormData();
    if (data.course_id) formData.append('course_id', data.course_id);
    if (data.paper_type) formData.append('paper_type', data.paper_type);
    if (data.year) formData.append('year', data.year);
    if (data.semester) formData.append('semester', data.semester);
    return apiClient
      .put(`/papers/${id}/edit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => {
        clearCache();
        return res;
      });
  },

  // Admin
  getDashboardStats: () => {
    return getWithCache('/admin/dashboard', { ttlMs: 60 * 1000 });
  },

  getVerificationRequests: () => {
    return apiClient.get('/admin/verification-requests');
  },

  verifyUser: (
    userId: number,
    approve: boolean,
    reason?: string,
    admin_feedback?: { message: string }
  ) => {
    const payload: any = { approve };
    if (!approve) {
      if (admin_feedback) {
        payload.admin_feedback = admin_feedback;
      }
      if (reason) {
        payload.reason = reason;
      }
    }
    return apiClient.post(`/admin/verify-user/${userId}`, payload).then((res) => {
      clearCache();
      return res;
    });
  },

  approveAllPendingPapers: () => {
    return apiClient.post('/admin/papers/approve-all').then((res) => {
      clearCache();
      return res;
    });
  },
};

export default apiClient;


