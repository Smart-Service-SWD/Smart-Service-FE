import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import type { AuthContextType, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async (): Promise<void> => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');

      console.log('LOAD AUTH - TOKEN:', storedToken);
      console.log('LOAD AUTH - USER:', storedUser);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeRole = (role: any): User['role'] => {
    if (typeof role === 'string') {
      const upper = role.toUpperCase();
      if (upper === 'CUSTOMER') return 'USER';
      if (upper === 'STAFF') return 'STAFF';
      if (upper === 'AGENT') return 'AGENT';
      if (upper === 'ADMIN') return 'ADMIN';
      if (upper === 'USER') return 'USER';
    }

    if (typeof role === 'number') {
      if (role === 0) return 'USER';
      if (role === 1) return 'STAFF';
      if (role === 2) return 'AGENT';
      if (role === 3) return 'ADMIN';
    }

    return 'USER';
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      const response = await authService.login(email, password);

      console.log('LOGIN RAW RESPONSE:', response);

      const {
        accessToken,
        userId,
        email: userEmail,
        fullName,
        role,
        phoneNumber,
        phone,
      } = response || {};

      console.log('EXTRACTED TOKEN:', accessToken);

      if (!accessToken || !userId) {
        return { success: false, error: 'Sai email hoặc mật khẩu' };
      }

      const userData: User = {
        id: userId,
        email: userEmail,
        fullName,
        phoneNumber: phoneNumber || phone,
        role: normalizeRole(role),
      };

      // ✅ Lưu đúng key
      await AsyncStorage.setItem('authToken', accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      // ✅ Verify lại sau khi lưu
      const checkToken = await AsyncStorage.getItem('authToken');
      console.log('TOKEN SAVED TO STORAGE:', checkToken);

      setToken(accessToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      const err = error as Error;
      console.error('Login error:', err);

      const status = (error as any).response?.status;
      const apiError =
        (error as any).response?.data?.message ||
        (status === 401 ? 'Sai email hoặc mật khẩu' : undefined) ||
        err.message ||
        'Login failed';

      return { success: false, error: apiError };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');

      setToken(null);
      setUser(null);

      console.log('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register: async () => ({ success: false }), // giữ nguyên nếu chưa sửa
    logout,
    updateProfile: async () => {},
    hasRole: (role: string) => user?.role === role,
    ROLES: {
      USER: 'USER',
      STAFF: 'STAFF',
      AGENT: 'AGENT',
      ADMIN: 'ADMIN',
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};