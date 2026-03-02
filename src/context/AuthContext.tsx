import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthContextType, RegisterData, User } from '../types';

// 1. Dữ liệu Mock khởi tạo (Default Mock Data)
const DEFAULT_MOCK_ACCOUNTS = [
  {
    email: 'user@test.com',
    password: '123456',
    user: {
      id: '1',
      email: 'user@test.com',
      fullName: 'Nguyễn Văn A',
      phoneNumber: '0901234567',
      role: 'USER' as const,
    },
    token: 'mock-user-token-123',
  },
  {
    email: 'staff@test.com',
    password: '123456',
    user: {
      id: '2',
      email: 'staff@test.com',
      fullName: 'Trần Thị B',
      phoneNumber: '0912345678',
      role: 'STAFF' as const,
    },
    token: 'mock-staff-token-456',
  },
  {
    email: 'admin@test.com',
    password: '123456',
    user: {
      id: '3',
      email: 'admin@test.com',
      fullName: 'Lê Văn C',
      phoneNumber: '0923456789',
      role: 'ADMIN' as const,
    },
    token: 'mock-admin-token-789',
  },
  {
    email: 'agent@test.com', // Sửa lại chữ thường cho đồng bộ
    password: '123456',
    user: {
      id: '4',
      email: 'agent@test.com',
      fullName: 'Nguyễn Văn D',
      phoneNumber: '0934567892',
      role: 'AGENT' as const,
    },
    token: 'mock-agent-token-101112',
  }
];

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

  // Khởi tạo Mock DB khi app chạy lần đầu
  useEffect(() => {
    initMockDatabase();
    loadStoredAuth();
  }, []);

  const initMockDatabase = async () => {
    try {
      const existingDb = await AsyncStorage.getItem('mock_users_db');
      if (!existingDb) {
        // Nếu chưa có DB giả, lưu danh sách mặc định vào
        await AsyncStorage.setItem('mock_users_db', JSON.stringify(DEFAULT_MOCK_ACCOUNTS));
      }
    } catch (e) {
      console.error('Failed to init mock db', e);
    }
  };

  const loadStoredAuth = async (): Promise<void> => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');

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
    // BE serializes UserRole enum as numbers: Customer=0, Staff=1, Agent=2, Admin=3
    if (typeof role === 'number') {
      if (role === 0) return 'USER';   // Customer
      if (role === 1) return 'STAFF';  // Staff
      if (role === 2) return 'AGENT';  // Agent
      if (role === 3) return 'ADMIN';  // Admin
    }
    return 'USER';
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      const response = await authService.login(email, password);
      const { accessToken, userId, email: userEmail, fullName, role, phoneNumber, phone } = response || {};

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

      await AsyncStorage.setItem('authToken', accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

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

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const response = await authService.register(userData);

      const { accessToken, userId, email: userEmail, fullName, role, phoneNumber, phone } = response;

      const newUser: User = {
        id: userId,
        email: userEmail,
        fullName,
        phoneNumber: phoneNumber || phone,
        role: normalizeRole(role),
      };

      await AsyncStorage.setItem('authToken', accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      setToken(accessToken);
      setUser(newUser);
      return { success: true };

    } catch (error) {
      const err = error as Error;
      console.error('Registration error:', err);
      const apiError = (error as any).response?.data?.message || err.message || 'Registration failed';
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
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateProfile = async (updatedData: Partial<User>): Promise<void> => {
    try {
      const updatedUser = { ...user, ...updatedData } as User;
      
      // Cập nhật state
      setUser(updatedUser);
      // Cập nhật session hiện tại
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      // Cập nhật trong Mock DB (để lần sau login vẫn thấy thông tin mới)
      if (user?.email) {
         const storedDb = await AsyncStorage.getItem('mock_users_db');
         if (storedDb) {
            const accounts = JSON.parse(storedDb);
            const updatedAccounts = accounts.map((acc: any) => {
                if (acc.email === user.email) {
                    return { ...acc, user: { ...acc.user, ...updatedData } };
                }
                return acc;
            });
            await AsyncStorage.setItem('mock_users_db', JSON.stringify(updatedAccounts));
         }
      }

    } catch (error) {
      const err = error as Error;
      console.error('Update profile error:', err);
      throw err;
    }
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const ROLES = {
    USER: 'USER' as const,
    CUSTOMER: 'USER' as const,
    STAFF: 'STAFF' as const,
    AGENT: 'AGENT' as const,
    ADMIN: 'ADMIN' as const,
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    hasRole,
    ROLES,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
