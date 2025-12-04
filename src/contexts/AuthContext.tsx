import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { buildUploadUrl } from '../utils/uploads';
import { wakeUpBackend } from '../utils/keepAlive';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'https://web-production-6beea.up.railway.app';

interface User {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  id_verified?: boolean;
  photo_path?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // First, wake up backend if it's sleeping
      await wakeUpBackend();
      
      const token = localStorage.getItem('token');
      if (token) {
        // Verify token and get user info
        try {
          const response = await axios.get(`${API_BASE_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 30000 // 30 second timeout for cold start
          });
          setUser(response.data);
          const photoUrl = buildUploadUrl(response.data.photo_path);
          if (photoUrl) {
            localStorage.setItem('profile.photo', photoUrl);
          } else {
            localStorage.removeItem('profile.photo');
          }
        } catch (error: any) {
          // If backend is still waking up, wait a bit and retry once
          if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !error.response) {
            console.log('⏳ Backend is waking up, waiting...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            try {
              const retryResponse = await axios.get(`${API_BASE_URL}/me`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 30000
              });
              setUser(retryResponse.data);
              const photoUrl = buildUploadUrl(retryResponse.data.photo_path);
              if (photoUrl) {
                localStorage.setItem('profile.photo', photoUrl);
              } else {
                localStorage.removeItem('profile.photo');
              }
            } catch (retryError) {
              localStorage.removeItem('token');
            }
          } else {
            localStorage.removeItem('token');
          }
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password
      });

      const token = response.data.access_token;
      localStorage.setItem('token', token);

      // Get user info
      const userResponse = await axios.get(`${API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(userResponse.data);
      const photoUrl = buildUploadUrl(userResponse.data.photo_path);
      if (photoUrl) {
        localStorage.setItem('profile.photo', photoUrl);
      } else {
        localStorage.removeItem('profile.photo');
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Login failed';
      throw new Error(message);
    }
  };

  const register = async (email: string, name: string, password: string, confirmPassword: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, {
        email,
        name,
        password,
        confirm_password: confirmPassword
      });

      const token = response.data.access_token;
      localStorage.setItem('token', token);

      // Get user info
      const userResponse = await axios.get(`${API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(userResponse.data);
      const photoUrl = buildUploadUrl(userResponse.data.photo_path);
      if (photoUrl) {
        localStorage.setItem('profile.photo', photoUrl);
      } else {
        localStorage.removeItem('profile.photo');
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Registration failed';
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    localStorage.removeItem('profile.photo');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
