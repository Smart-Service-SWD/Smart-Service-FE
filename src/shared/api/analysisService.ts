import apiClient from './apiClient';
import { API_CONFIG } from '../config/api.config';

export const analysisService = {
  // Gửi ảnh để phân tích
  analyzeImage: async (imageData: any, metadata: Record<string, any> = {}) => {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.ANALYZE_SERVICE, {
        description: metadata?.description || '',
      });
      
      return response.data;
    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  },

  // Lấy lịch sử phân tích
  getAnalysisHistory: async (pageNumber = 1, pageSize = 10) => {
    throw new Error('API lịch sử phân tích chưa được backend hỗ trợ.');
  },

  // Lấy chi tiết phân tích
  getAnalysisDetail: async (analysisId) => {
    throw new Error('API chi tiết phân tích chưa được backend hỗ trợ.');
  },

  // Tạo service request mới
  createServiceRequest: async (requestData) => {
    try {
      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.CREATE_REQUEST,
        requestData
      );
      return response.data;
    } catch (error) {
      console.error('Create request error:', error);
      throw error;
    }
  },

  // Lấy danh sách service requests
  getServiceRequests: async (pageNumber = 1, pageSize = 10) => {
    throw new Error('Vui lòng dùng GraphQL query getServiceRequests.');
  },
};

