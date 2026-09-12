import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isStudent: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  broadcastProfileUpdate: () => void;
  updateLocalProfile: (profile: any) => void;
  loginAsDemoStudent: () => Promise<{ success: boolean; message?: string }>;
  loginAsDemoAdmin: () => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('edumentor_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      if (!localStorage.getItem('edumentor_token')) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const res = await authApi.getMe();
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('edumentor_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.warn('[AuthContext] Session expired or invalid.');
      setUser(null);
      setToken(null);
      localStorage.removeItem('edumentor_token');
      localStorage.removeItem('edumentor_user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleLogoutEvent = () => {
      setUser(null);
      setToken(null);
    };

    const handleDataUpdateEvent = () => {
      fetchCurrentUser();
    };

    window.addEventListener('edumentor_auth_logout', handleLogoutEvent);
    window.addEventListener('edumentor_student_data_updated', handleDataUpdateEvent);

    return () => {
      window.removeEventListener('edumentor_auth_logout', handleLogoutEvent);
      window.removeEventListener('edumentor_student_data_updated', handleDataUpdateEvent);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await authApi.login({ email, password });
      if (res.data.success && res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('edumentor_token', res.data.token);
        localStorage.setItem('edumentor_user', JSON.stringify(res.data.user));
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || 'Login failed.' };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid email or password.';
      return { success: false, message: msg };
    }
  };

  const register = async (data: any) => {
    try {
      const res = await authApi.register(data);
      if (res.data.success && res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('edumentor_token', res.data.token);
        localStorage.setItem('edumentor_user', JSON.stringify(res.data.user));
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || 'Registration failed.' };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please check form data.';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('edumentor_token');
    localStorage.removeItem('edumentor_user');
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const broadcastProfileUpdate = () => {
    window.dispatchEvent(new Event('edumentor_student_data_updated'));
    fetchCurrentUser();
  };

  const updateLocalProfile = (newProfile: any) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        profile: {
          ...(prev.profile || {}),
          ...newProfile,
        },
      };
      localStorage.setItem('edumentor_user', JSON.stringify(updated));
      return updated;
    });
    window.dispatchEvent(new Event('edumentor_student_data_updated'));
  };

  const loginAsDemoStudent = async () => {
    return login('saifullah@student.edu', 'Student123!');
  };

  const loginAsDemoAdmin = async () => {
    return login('admin@saifullah.ai', 'saifullah@123');
  };

  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isStudent,
        isAdmin,
        login,
        register,
        logout,
        refreshUser,
        broadcastProfileUpdate,
        updateLocalProfile,
        loginAsDemoStudent,
        loginAsDemoAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
