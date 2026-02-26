import axios from 'axios';
import { API_CONFIG, resolveGraphQLBaseUrl } from '../config/api.config';

interface GraphQLError {
  message: string;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

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

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

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

export interface ActivityLog {
  id: string;
  serviceRequestId: string;
  action: string;
  createdAt: string;
}

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
