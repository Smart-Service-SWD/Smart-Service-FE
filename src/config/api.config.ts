import axios from 'axios';
import { ToastService } from '../components/toast';

// API Configuration - 5 máy: app sẽ thử lần lượt và dùng IP đầu tiên kết nối được
// Sửa 5 IP dưới cho đúng mạng của bạn (Android Emulator: 10.0.2.2 = localhost)
const POSSIBLE_HOSTS = [
  
  '10.0.2.2',        // Android Emulator
  '172.20.10.4',     // Máy Window A_Duy
  '192.168.1.26',    // Máy Window T_Thịnh
  '192.168.1.100',   // Máy Linux T_Thinh
  '10.87.25.38',     // Máy Window Linh_Tran
  '192.168.123.188', // Máy IP 1111 Linh_Tran
  '192.168.1.103',
];

const GRAPHQL_PORT = 5268;
const REST_PORT = 5268;
const TIMEOUT_MS = 30000;
const CONNECT_CHECK_TIMEOUT = 3000;
const REST_PING_PATH = '/api/ServiceCategory/list';

let cachedGraphQLHost: string | null = null;
let cachedRestHost: string | null = null;

/** Reset cache khi BE không còn kết nối được (vd: đổi mạng, BE restart) */
export const resetHostCache = () => {
  cachedGraphQLHost = null;
  cachedRestHost = null;
};

const tryHost = async (host: string): Promise<boolean> => {
  try {
    const url = `http://${host}:${GRAPHQL_PORT}/graphql`;
    const res = await axios.post(
      url,
      { query: '{ querySmartService }' },
      {
        timeout: CONNECT_CHECK_TIMEOUT,
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      }
    );
    // Chấp nhận 200 và có data (GraphQL) hoặc chỉ cần không lỗi mạng
    return res.status === 200 && (res.data?.data != null || Array.isArray(res.data?.errors));
  } catch {
    return false;
  }
};

const tryRestHost = async (host: string): Promise<boolean> => {
  try {
    const url = `http://${host}:${REST_PORT}${REST_PING_PATH}`;
    const res = await axios.get(url, {
      timeout: CONNECT_CHECK_TIMEOUT,
      validateStatus: () => true,
    });
    return res.status >= 200 && res.status < 500;
  } catch {
    return false;
  }
};

const getTriedUrls = (): string[] =>
  POSSIBLE_HOSTS.map(h => `http://${h}:${GRAPHQL_PORT}/graphql`);

/** Thử lần lượt 5 IP, trả về base URL GraphQL của máy đầu tiên phản hồi (vd: http://192.168.1.101:5268/graphql) */
export const resolveGraphQLBaseUrl = async (): Promise<string> => {
  // Nếu đã có cache, dùng luôn (không cần ping lại)
  if (cachedGraphQLHost) {
    return `http://${cachedGraphQLHost}:${GRAPHQL_PORT}/graphql`;
  }

  // Thử song song, lấy IP đầu tiên phản hồi
  try {
    const host = await new Promise<string>((resolve, reject) => {
      let settled = false;
      let remaining = POSSIBLE_HOSTS.length;

      POSSIBLE_HOSTS.forEach(h => {
        tryHost(h).then(ok => {
          remaining--;
          if (ok && !settled) {
            settled = true;
            resolve(h);
          } else if (remaining === 0 && !settled) {
            reject(new Error('all_failed'));
          }
        });
      });
    });

    cachedGraphQLHost = host;
    cachedRestHost = host;
    return `http://${host}:${GRAPHQL_PORT}/graphql`;
  } catch {
    const urls = getTriedUrls().join(', ');
    const errorMessage = `Không kết nối được BE. Đã thử: ${urls}. Kiểm tra: (1) BE chạy cổng ${GRAPHQL_PORT} (dotnet run), (2) 5 IP trong api.config.ts đúng với mạng của bạn, (3) Expo Go dùng IP máy tính (không dùng localhost).`;
    ToastService.show({ type: 'error', title: 'Lỗi kết nối', message: errorMessage, duration: 5000 });
    throw new Error(errorMessage);
  }
};


/** Trả về base URL REST (dùng cùng host đã resolve cho GraphQL nếu có, không thì thử 5 IP) */
export const resolveRestBaseUrl = async (): Promise<string> => {
  // GraphQL và REST dùng cùng host/port → nếu GraphQL đã resolve, dùng luôn
  if (cachedGraphQLHost) {
    return `http://${cachedGraphQLHost}:${REST_PORT}/api`;
  }
  if (cachedRestHost) {
    return `http://${cachedRestHost}:${REST_PORT}/api`;
  }

  // Chưa có cache → thử song song 5 IP, lấy IP đầu tiên phản hồi
  try {
    const host = await new Promise<string>((resolve, reject) => {
      let settled = false;
      let remaining = POSSIBLE_HOSTS.length;

      POSSIBLE_HOSTS.forEach(h => {
        tryRestHost(h).then(ok => {
          remaining--;
          if (ok && !settled) {
            settled = true;
            resolve(h);
          } else if (remaining === 0 && !settled) {
            reject(new Error('all_failed'));
          }
        });
      });
    });

    cachedRestHost = host;
    cachedGraphQLHost = host;
    return `http://${host}:${REST_PORT}/api`;
  } catch {
    throw new Error('Không kết nối được BE. Kiểm tra 5 IP trong api.config.ts.');
  }
};

export const API_CONFIG = {
  POSSIBLE_HOSTS,
  GRAPHQL_PORT,
  REST_PORT,
  TIMEOUT: TIMEOUT_MS,
  // Fallback (dùng khi chưa resolve) - host đầu tiên trong danh sách
  BASE_URL: `http://${POSSIBLE_HOSTS[0]}:${REST_PORT}/api`,
  GRAPHQL_URL: `http://${POSSIBLE_HOSTS[0]}:${GRAPHQL_PORT}/graphql`,
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
