import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import type { AuthContextType, User, RegisterData } from '../types';

/** Decode JWT payload (no verification, just parse claims) */
const decodeJwtPayload = (token: string): Record<string, any> | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const PHONE_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone';

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
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      const err = error as Error;
      console.error('Update profile error:', err);
      throw err;
    }
  };

  /** Decode JWT token to extract phoneNumber claim and update user state */
  const fetchAndUpdatePhoneNumber = async (): Promise<void> => {
    try {
      if (!token || !user) return;
      const payload = decodeJwtPayload(token);
      if (!payload) return;
      const phoneNumber = payload[PHONE_CLAIM] || '';
      if (phoneNumber) {
        const updatedUser: User = { ...user, phoneNumber };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error decoding phone from JWT:', error);
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
    fetchAndUpdatePhoneNumber,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
