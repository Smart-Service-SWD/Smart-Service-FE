
import axios from 'axios';
import { API_CONFIG, resolveGraphQLBaseUrl } from '../config/api.config';

// Helper: Chuẩn hóa role đúng chuẩn BE (enum chuỗi GraphQL)
// FE: 'ADMIN'|'STAFF'|'AGENT'|'USER' <-> BE: 'ADMIN'|'STAFF'|'AGENT'|'CUSTOMER'
export function normalizeRoleForBE(role: string | number): 'ADMIN' | 'STAFF' | 'AGENT' | 'CUSTOMER' {
  if (typeof role === 'string') {
    const r = role.toUpperCase();
    if (r === 'ADMIN' || r === '3') return 'ADMIN';
    if (r === 'STAFF' || r === '1') return 'STAFF';
    if (r === 'AGENT' || r === '2') return 'AGENT';
    return 'CUSTOMER';
  }
  if (typeof role === 'number') {
    switch (role) {
      case 3: return 'ADMIN';
      case 1: return 'STAFF';
      case 2: return 'AGENT';
      default: return 'CUSTOMER';
    }
  }
  return 'CUSTOMER';
}

// ==== INTERFACES & TYPES ====
export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  // BE trả về role là số, FE có thể map lại nếu cần
  role: number;
}

interface GraphQLError {
  message: string;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

export interface DashboardSummary {
  totalUsers: number;
  totalStaff: number;
  totalAgents: number;
  totalServices: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  todayRevenue: number;
  monthlyRevenue: number;
}

export interface ActivityLog {
  id: string;
  serviceRequestId: string;
  action: string;
  createdAt: string;
}

// ==== CORE GRAPHQL EXECUTOR ====
const executeGraphQL = async <T>(
  query: string,
  options?: {
    variables?: Record<string, unknown>;
    token?: string | null;
  }
): Promise<T> => {
  const baseUrl = await resolveGraphQLBaseUrl();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const { data } = await axios.post<GraphQLResponse<T>>(
    baseUrl,
    { query, variables: options?.variables },
    { timeout: API_CONFIG.TIMEOUT, headers }
  );

  if (data?.errors?.length) {
    throw new Error(data.errors[0]?.message || 'GraphQL error');
  }

  if (!data?.data) {
    throw new Error('Empty GraphQL response');
  }

  return data.data;
};
// ==== USER QUERIES ====
const GET_USERS = `
  query GetUsers {
    getUsers {
      id
      fullName
      email
      phoneNumber
      role
    }
  }
`;

export const getUsers = async (token?: string | null): Promise<User[]> => {
  const response = await executeGraphQL<{ getUsers: User[] }>(GET_USERS, { token });
  return response.getUsers ?? [];
};

const GET_USERS_BY_ROLE = `
  query GetUsersByRole($role: UserRole!) {
    getUsersByRole(role: $role) {
      id
      fullName
      email
      phoneNumber
      role
    }
  }
`;

export const getUsersByRole = async (role: string | number, token?: string | null): Promise<User[]> => {
  // Đảm bảo role truyền lên đúng chuẩn BE (enum chuỗi GraphQL)
  const beRole = normalizeRoleForBE(role);
  const response = await executeGraphQL<{ getUsersByRole: User[] }>(GET_USERS_BY_ROLE, { variables: { role: beRole }, token });
  return response.getUsersByRole ?? [];
};

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

// ==== SERVICE CATEGORY QUERIES ====
const GET_SERVICE_CATEGORIES = `
  query GetServiceCategories {
    getServiceCategories {
      id
      name
      description
    }
  }
`;

export const getServiceCategories = async (): Promise<ServiceCategory[]> => {
  const response = await executeGraphQL<{ getServiceCategories: ServiceCategory[] }>(GET_SERVICE_CATEGORIES);
  return response.getServiceCategories ?? [];
};

// ==== DASHBOARD SUMMARY QUERIES ====
const GET_DASHBOARD_SUMMARY = `
  query GetDashboardSummary {
    getDashboardSummary {
      totalUsers
      totalStaff
      totalAgents
      totalServices
      totalRequests
      pendingRequests
      completedRequests
      todayRevenue
      monthlyRevenue
    }
  }
`;

export const getDashboardSummary = async (token?: string | null): Promise<DashboardSummary> => {
  const response = await executeGraphQL<{ getDashboardSummary: DashboardSummary }>(GET_DASHBOARD_SUMMARY, { token });
  return response.getDashboardSummary;
};

// ==== ACTIVITY LOG QUERIES ====
const GET_ACTIVITY_LOGS = `
  query GetActivityLogs {
    getActivityLogs {
      id
      serviceRequestId
      action
      createdAt
    }
  }
`;

export const getRecentActivityLogs = async (
  token?: string | null,
  limit = 5
): Promise<ActivityLog[]> => {
  const response = await executeGraphQL<{ getActivityLogs: ActivityLog[] }>(GET_ACTIVITY_LOGS, { token });
  const logs = response.getActivityLogs ?? [];
  return logs
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
};
