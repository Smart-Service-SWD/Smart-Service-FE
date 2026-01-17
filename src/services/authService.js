import apiClient from './apiClient';

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
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (userData) => {
    const response = await apiClient.put('/auth/profile', userData);
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
