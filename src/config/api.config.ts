// API Configuration
export const API_CONFIG = {
  // Thay đổi địa chỉ BE của bạn
  BASE_URL: 'http://10.0.2.2:5000/api', // Android Emulator: 10.0.2.2 = localhost của máy host
  TIMEOUT: 30000,
  ENDPOINTS: {
    // Service Analysis
    ANALYZE_SERVICE: '/ServiceAnalysis/analyze',
    GET_ANALYSIS_HISTORY: '/ServiceAnalysis/history',
    GET_ANALYSIS_DETAIL: '/ServiceAnalysis/:id',
    
    // Service Requests
    CREATE_REQUEST: '/ServiceRequest/create',
    GET_REQUESTS: '/ServiceRequest/list',
    
    // Service Categories
    GET_CATEGORIES: '/ServiceCategory/list',
  },
};
