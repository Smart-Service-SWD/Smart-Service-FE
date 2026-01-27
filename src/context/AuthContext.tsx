import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import type { AuthContextType, User, RegisterData } from '../types';

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
      
      // Mock accounts for testing
      const mockAccounts = [
        {
          email: 'user@test.com',
          password: '123456',
          user: {
            id: '1',
            email: 'user@test.com',
            fullName: 'Nguyễn Văn A',
            phoneNumber: '0901234567',
            role: 'USER',
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
            role: 'STAFF',
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
            role: 'ADMIN',
          },
          token: 'mock-admin-token-789',
        },
      ];

      // Check mock accounts first
      const mockAccount = mockAccounts.find(
        acc => acc.email === email && acc.password === password
      );

      if (mockAccount) {
        await AsyncStorage.setItem('authToken', mockAccount.token);
        await AsyncStorage.setItem('user', JSON.stringify(mockAccount.user));
        
        setToken(mockAccount.token);
        setUser(mockAccount.user);
        return { success: true };
      }

      // If not mock account, try real API
      const response = await authService.login(email, password);
      
      const { token: authToken, user: userData } = response;
      
      await AsyncStorage.setItem('authToken', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      setToken(authToken);
      setUser(userData);
      return { success: true };
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
      const response = await authService.register(userData);
      
      const { token: authToken, user: newUser } = response;
      
      await AsyncStorage.setItem('authToken', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      
      setToken(authToken);
      setUser(newUser);
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
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
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

  // Role constants
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
