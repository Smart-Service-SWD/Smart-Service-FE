import apiClient from './apiClient';
import { API_CONFIG } from '../config/api.config';

export const analysisService = {
  // Gửi ảnh để phân tích
  analyzeImage: async (imageData, metadata = {}) => {
    try {
      const formData = new FormData();
      
      // Thêm file ảnh
      formData.append('image', {
        uri: imageData.uri,
        type: 'image/jpeg',
        name: `analysis_${Date.now()}.jpg`,
      });
      
      // Thêm metadata nếu có
      if (metadata.description) {
        formData.append('description', metadata.description);
      }
      if (metadata.category) {
        formData.append('category', metadata.category);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.ANALYZE_SERVICE,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  },

  // Lấy lịch sử phân tích
  getAnalysisHistory: async (pageNumber = 1, pageSize = 10) => {
    try {
      const response = await apiClient.get(
        API_CONFIG.ENDPOINTS.GET_ANALYSIS_HISTORY,
        {
          params: {
            pageNumber,
            pageSize,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Get history error:', error);
      throw error;
    }
  },

  // Lấy chi tiết phân tích
  getAnalysisDetail: async (analysisId) => {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.GET_ANALYSIS_DETAIL.replace(':id', analysisId);
      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Get detail error:', error);
      throw error;
    }
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
    try {
      const response = await apiClient.get(
        API_CONFIG.ENDPOINTS.GET_REQUESTS,
        {
          params: {
            pageNumber,
            pageSize,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Get requests error:', error);
      throw error;
    }
  },
};
