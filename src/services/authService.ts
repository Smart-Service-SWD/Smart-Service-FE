import apiClient from './apiClient';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  userId: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  phone?: string;
  role: string | number;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  phoneNumber: string;
}

export const authService = {
  // Login
  login: async (email: string, password: string): Promise<AuthResult> => {
    const response = await apiClient.post('/auth/login', {
      email,
      password
    });
    return response.data;
  },

  // Register
  register: async (userData: RegisterPayload): Promise<AuthResult> => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (userData: UpdateProfilePayload): Promise<boolean> => {
    const response = await apiClient.put('/auth/profile', userData);
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<AuthResult> => {
    const response = await apiClient.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  // Logout
  logout: async (refreshToken: string): Promise<boolean> => {
    const response = await apiClient.post('/auth/logout', { refreshToken });
    return response.data;
  },

  // Change password (requires authentication)
  changePassword: async (currentPassword: string, newPassword: string): Promise<boolean> => {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // BE hiện chưa public endpoint này; giữ để màn cũ không crash.
  forgotPassword: async (email: string) => {
    throw new Error('Chức năng quên mật khẩu chưa được backend hỗ trợ.');
  },
};
