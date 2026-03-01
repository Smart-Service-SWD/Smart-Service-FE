import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  // Login
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password
    });
    return response.data;
  },

  // Register
  register: async (userData: { email: string; password?: string; fullName: string; phoneNumber: string }) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.get('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Update profile
  updateProfile: async (userData) => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.put('/auth/profile', userData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  }
};
