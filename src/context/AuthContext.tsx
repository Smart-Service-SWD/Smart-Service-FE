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

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // 2. ĐỌC TỪ MOCK DB TRƯỚC (Thay vì danh sách cứng)
      const storedDb = await AsyncStorage.getItem('mock_users_db');
      // Nếu không có DB (lỗi gì đó), dùng danh sách mặc định
      const allAccounts = storedDb ? JSON.parse(storedDb) : DEFAULT_MOCK_ACCOUNTS;

      // Tìm kiếm user trong danh sách tổng hợp
      const mockAccount = allAccounts.find(
        (acc: any) => acc.email.toLowerCase() === email.toLowerCase() && acc.password === password
      );

      if (mockAccount) {
        await AsyncStorage.setItem('authToken', mockAccount.token);
        await AsyncStorage.setItem('user', JSON.stringify(mockAccount.user));
        
        setToken(mockAccount.token);
        setUser(mockAccount.user);
        return { success: true };
      }

      // Nếu không tìm thấy trong Mock DB, thử gọi API thật (nếu có backend)
      // Chú ý: Nếu bạn chỉ đang test frontend thì phần này thường sẽ trả về lỗi luôn
      // const response = await authService.login(email, password);
      // ...
      
      return { success: false, error: 'Email hoặc mật khẩu không đúng' };

    } catch (error) {
      const err = error as Error;
      console.error('Login error:', err);
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      // 3. LOGIC ĐĂNG KÝ GIẢ (MOCK REGISTER)
      
      // Lấy danh sách hiện tại
      const storedDb = await AsyncStorage.getItem('mock_users_db');
      const currentAccounts = storedDb ? JSON.parse(storedDb) : DEFAULT_MOCK_ACCOUNTS;

      // Kiểm tra trùng email
      const isExist = currentAccounts.some((acc: any) => acc.email.toLowerCase() === userData.email.toLowerCase());
      if (isExist) {
        return { success: false, error: 'Email đã tồn tại!' };
      }

      // Tạo user mới
      const newUserId = Date.now().toString();
      const newUserToken = `mock-token-${newUserId}`;
      
      const newUserEntry = {
        email: userData.email,
        password: userData.password,
        user: {
          id: newUserId,
          email: userData.email,
          fullName: userData.fullName,
          phoneNumber: userData.phoneNumber,
          role: 'USER' as const, // Mặc định là USER
        },
        token: newUserToken,
      };

      // Thêm vào danh sách và lưu lại
      const newAccountsList = [...currentAccounts, newUserEntry];
      await AsyncStorage.setItem('mock_users_db', JSON.stringify(newAccountsList));

      // Tự động login luôn
      await AsyncStorage.setItem('authToken', newUserToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUserEntry.user));
      
      setToken(newUserToken);
      setUser(newUserEntry.user);
      
      return { success: true };

    } catch (error) {
      const err = error as Error;
      console.error('Registration error:', err);
      return { success: false, error: err.message || 'Registration failed' };
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
