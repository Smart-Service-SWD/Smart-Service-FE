// API Configuration
export const API_CONFIG = {
  // Thay đổi địa chỉ BE của bạn
  BASE_URL: 'http://192.168.1.100:5000/api', // Thay bằng IP/Port của BE
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
