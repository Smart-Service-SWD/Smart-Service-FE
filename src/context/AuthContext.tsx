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
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async (): Promise<void> => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser && storedRefreshToken) {
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
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
      if (upper === 'CUSTOMER') return 'CUSTOMER';
      if (upper === 'STAFF') return 'STAFF';
      if (upper === 'AGENT') return 'AGENT';
      if (upper === 'ADMIN') return 'ADMIN';
      if (upper === 'USER') return 'CUSTOMER';
    }

    if (typeof role === 'number') {
      if (role === 0) return 'CUSTOMER';
      if (role === 1) return 'STAFF';
      if (role === 2) return 'AGENT';
      if (role === 3) return 'ADMIN';
    }

    return 'CUSTOMER';
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      const response = await authService.login(email, password);
      const {
        accessToken,
        refreshToken: newRefreshToken,
        userId,
        email: userEmail,
        fullName,
        role,
        phoneNumber,
        phone,
      } = response || {};

      if (!accessToken || !newRefreshToken || !userId) {
        return { success: false, error: 'Sai email hoặc mật khẩu' };
      }

      const userData: User = {
        id: userId,
        email: userEmail,
        fullName,
        phoneNumber: phoneNumber || phone,
        role: normalizeRole(role),
      };

      await AsyncStorage.setItem('authToken', accessToken);
      await AsyncStorage.setItem('refreshToken', newRefreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setToken(accessToken);
      setRefreshToken(newRefreshToken);
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

  const register = async (
    userData: { fullName: string; email: string; password: string; phoneNumber: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      const response = await authService.register(userData);
      const {
        accessToken,
        refreshToken: newRefreshToken,
        userId,
        email,
        fullName,
        role,
        phoneNumber,
      } = response || {};

      if (!accessToken || !newRefreshToken || !userId) {
        return { success: false, error: 'Đăng ký thất bại' };
      }

      const registeredUser: User = {
        id: userId,
        email,
        fullName,
        phoneNumber,
        role: normalizeRole(role),
      };

      await AsyncStorage.setItem('authToken', accessToken);
      await AsyncStorage.setItem('refreshToken', newRefreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(registeredUser));

      setToken(accessToken);
      setRefreshToken(newRefreshToken);
      setUser(registeredUser);
      return { success: true };
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        'Đăng ký thất bại';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updatedData: Partial<User>): Promise<void> => {
    if (!user) return;
    const merged: User = {
      ...user,
      ...updatedData,
    };
    setUser(merged);
    await AsyncStorage.setItem('user', JSON.stringify(merged));
  };

  const logout = async (): Promise<void> => {
    try {
      const currentRefreshToken = refreshToken ?? (await AsyncStorage.getItem('refreshToken'));
      if (currentRefreshToken) {
        try {
          await authService.logout(currentRefreshToken);
        } catch {
          // Không block luồng logout local nếu BE trả lỗi
        }
      }

      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');

      setToken(null);
      setRefreshToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    hasRole: (role: string) => user?.role === role,
    ROLES: {
      CUSTOMER: 'CUSTOMER',
      STAFF: 'STAFF',
      AGENT: 'AGENT',
      ADMIN: 'ADMIN',
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
