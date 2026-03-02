import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, resolveRestBaseUrl, resetHostCache } from '../config/api.config';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Dynamically resolve base URL + Add JWT token
apiClient.interceptors.request.use(
  async config => {
    try {
      // Dynamically resolve the correct REST base URL (finds the reachable host)
      const resolvedBaseUrl = await resolveRestBaseUrl();
      config.baseURL = resolvedBaseUrl;
    } catch (err) {
      console.warn('Could not resolve REST base URL, using fallback:', err);
    }
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  response => response,
  async error => {
    // Network error (no response) → reset host cache để lần sau tìm lại IP
    if (!error.response) {
      resetHostCache();
    }
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth data
      try {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('user');
        // Navigation to login will be handled by AuthContext
      } catch (err) {
        console.error('Error clearing auth:', err);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
