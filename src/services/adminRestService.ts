import apiClient from './apiClient';

// ─── Payload Types ─────────────────────────────────────────────────────────────

export interface CreateUserPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
}

export interface CreateServicePayload {
  categoryId: string;
  name: string;
  description?: string;
  basePrice: number;
  estimatedDuration: number;
}

export interface UpdateServicePayload {
  name: string;
  description?: string;
  basePrice: number;
  estimatedDuration: number;
  isActive: boolean;
}

// ─── Admin REST Service ────────────────────────────────────────────────────────

export const adminRestService = {
  // ── Users ──────────────────────────────────────────────────────────────────

  /** Tạo mới nhân viên (Staff) - POST /api/users/staff */
  createStaff: async (payload: CreateUserPayload): Promise<string> => {
    const response = await apiClient.post('/users/staff', payload);
    return response.data;
  },

  /** Tạo mới đại lý user (Agent) - POST /api/users/agents */
  createAgent: async (payload: CreateUserPayload): Promise<string> => {
    const response = await apiClient.post('/users/agents', payload);
    return response.data;
  },

  /** Tạo mới khách hàng (Customer) - POST /api/users/customers */
  createCustomer: async (payload: CreateUserPayload): Promise<string> => {
    const response = await apiClient.post('/users/customers', payload);
    return response.data;
  },

  /**
   * Cập nhật vai trò người dùng - PATCH /api/auth/users/{id}/role
   * role: 'Customer' | 'Staff' | 'Agent' | 'Admin' (hoặc số 0-3)
   */
  updateUserRole: async (userId: string, role: string): Promise<boolean> => {
    const response = await apiClient.patch(`/auth/users/${userId}/role`, { role });
    return response.data;
  },

  // ── Service Categories ────────────────────────────────────────────────────

  /** Tạo mới danh mục dịch vụ - POST /api/service-categories */
  createServiceCategory: async (name: string, description: string): Promise<string> => {
    const response = await apiClient.post('/service-categories', { name, description });
    return response.data;
  },

  // ── Services ──────────────────────────────────────────────────────────────

  /** Tạo mới dịch vụ - POST /api/services */
  createService: async (payload: CreateServicePayload): Promise<string> => {
    const response = await apiClient.post('/services', payload);
    return response.data;
  },

  /** Cập nhật dịch vụ - PUT /api/services/{id} */
  updateService: async (id: string, payload: UpdateServicePayload): Promise<void> => {
    await apiClient.put(`/services/${id}`, payload);
  },

  /** Xóa dịch vụ - DELETE /api/services/{id} */
  deleteService: async (id: string): Promise<void> => {
    await apiClient.delete(`/services/${id}`);
  },

  // ── Service Agents ─────────────────────────────────────────────────────────

  /** Tạo hồ sơ đại lý dịch vụ - POST /api/service-agents */
  createServiceAgent: async (fullName: string): Promise<string> => {
    const response = await apiClient.post('/service-agents', { fullName });
    return response.data;
  },

  /** Vô hiệu hóa đại lý dịch vụ - DELETE /api/service-agents/{agentId} */
  deactivateServiceAgent: async (agentId: string): Promise<void> => {
    await apiClient.delete(`/service-agents/${agentId}`);
  },

  // ── Profile ───────────────────────────────────────────────────────────────

  /** Cập nhật hồ sơ cá nhân - PUT /api/auth/profile */
  updateProfile: async (fullName: string, phoneNumber: string): Promise<boolean> => {
    const response = await apiClient.put('/auth/profile', { fullName, phoneNumber });
    return response.data;
  },
};
