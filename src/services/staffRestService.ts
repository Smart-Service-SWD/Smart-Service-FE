import apiClient from './apiClient';

// ─── Payload Types ──────────────────────────────────────────────────────────────

export interface MoneyPayload {
  amount: number;
  currency: string;
}

export interface AssignProviderPayload {
  /** ID of the ServiceAgent to assign */
  providerId: string;
  estimatedCost: MoneyPayload;
}

export interface EvaluateComplexityPayload {
  complexity: {
    /** 1 = Very Simple … 5 = Highly Complex */
    level: number;
  };
}

export interface TriggerAnalysisPayload {
  /** Natural-language description of the service request */
  description: string;
}

export interface AnalysisResult {
  contextDescription?: string | null;
  dispatchPolicy?: string | null;
  [key: string]: any;
}

// ─── Staff REST Service ─────────────────────────────────────────────────────────

export const staffRestService = {
  /**
   * Gán nhà cung cấp cho yêu cầu dịch vụ → trạng thái chuyển sang ASSIGNED
   * PATCH /api/service-requests/{serviceRequestId}/assign-provider
   */
  assignProvider: async (
    serviceRequestId: string,
    payload: AssignProviderPayload
  ): Promise<void> => {
    await apiClient.patch(
      `/service-requests/${serviceRequestId}/assign-provider`,
      payload
    );
  },

  /**
   * Đánh giá / cập nhật độ phức tạp của yêu cầu dịch vụ
   * PATCH /api/service-requests/{serviceRequestId}/evaluate-complexity
   */
  evaluateComplexity: async (
    serviceRequestId: string,
    payload: EvaluateComplexityPayload
  ): Promise<void> => {
    await apiClient.patch(
      `/service-requests/${serviceRequestId}/evaluate-complexity`,
      payload
    );
  },

  /**
   * Kích hoạt AI phân tích một mô tả (tạo ServiceAnalysis)
   * POST /api/service-analysis
   */
  triggerAnalysis: async (
    payload: TriggerAnalysisPayload
  ): Promise<AnalysisResult> => {
    const response = await apiClient.post('/service-analysis', payload);
    return response.data;
  },

  /**
   * Cập nhật hồ sơ cá nhân - PUT /api/auth/profile
   */
  updateProfile: async (fullName: string, phoneNumber: string): Promise<boolean> => {
    const response = await apiClient.put('/auth/profile', { fullName, phoneNumber });
    return response.data;
  },
};
