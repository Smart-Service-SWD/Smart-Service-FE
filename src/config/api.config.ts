import axios from 'axios';

// API Configuration - 5 máy: app sẽ thử lần lượt và dùng IP đầu tiên kết nối được
// Sửa 5 IP dưới cho đúng mạng của bạn (Android Emulator: 10.0.2.2 = localhost)
const POSSIBLE_HOSTS = [
  '10.0.2.2',        // Android Emulator
  '192.168.1.26', // Máy Window T_Thịnh
  '192.168.1.101',
  '192.168.1.102',
  '192.168.1.103',
];

const GRAPHQL_PORT = 5268;
const REST_PORT = 5000;
const TIMEOUT_MS = 30000;
const CONNECT_CHECK_TIMEOUT = 5000;

let cachedGraphQLHost: string | null = null;
let cachedRestHost: string | null = null;

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

const getTriedUrls = (): string[] =>
  POSSIBLE_HOSTS.map(h => `http://${h}:${GRAPHQL_PORT}/graphql`);

/** Thử lần lượt 5 IP, trả về base URL GraphQL của máy đầu tiên phản hồi (vd: http://192.168.1.101:5268/graphql) */
export const resolveGraphQLBaseUrl = async (): Promise<string> => {
  const toTry = cachedGraphQLHost
    ? [cachedGraphQLHost, ...POSSIBLE_HOSTS.filter(h => h !== cachedGraphQLHost)]
    : POSSIBLE_HOSTS;
  for (const host of toTry) {
    const ok = await tryHost(host);
    if (ok) {
      cachedGraphQLHost = host;
      return `http://${host}:${GRAPHQL_PORT}/graphql`;
    }
  }
  const urls = getTriedUrls().join(', ');
  throw new Error(
    `Không kết nối được BE. Đã thử: ${urls}. Kiểm tra: (1) BE chạy cổng ${GRAPHQL_PORT} (dotnet run), (2) 5 IP trong api.config.ts đúng với mạng của bạn, (3) Expo Go dùng IP máy tính (không dùng localhost).`
  );
};

/** Trả về base URL REST (dùng cùng host đã resolve cho GraphQL nếu có, không thì thử 5 IP) */
export const resolveRestBaseUrl = async (): Promise<string> => {
  const host = cachedGraphQLHost ?? cachedRestHost;
  const toTry = host
    ? [host, ...POSSIBLE_HOSTS.filter(h => h !== host)]
    : POSSIBLE_HOSTS;
  for (const h of toTry) {
    const ok = await tryHost(h);
    if (ok) {
      cachedRestHost = h;
      cachedGraphQLHost = h;
      return `http://${h}:${REST_PORT}/api`;
    }
  }
  throw new Error('Không kết nối được BE. Kiểm tra 5 IP trong api.config.ts.');
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
