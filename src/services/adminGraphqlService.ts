import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, resolveGraphQLBaseUrl } from '../config/api.config';

export interface DashboardSummary {
  totalUsers: number;
  totalStaff: number;
  totalAgents: number;
  totalServices: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  todayRevenue: number | string;
  monthlyRevenue: number | string;
}

export interface ServiceListItem {
  id: string;
  name: string;
  description?: string | null;
  categoryName: string;
  basePrice: number | string;
  estimatedDuration: number;
  isActive: boolean;
  bookingCount: number;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'CUSTOMER' | 'STAFF' | 'AGENT' | 'ADMIN';

export interface GraphqlUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  role: UserRole;
}

export interface ActivityLog {
  id: string;
  serviceRequestId: string;
  action: string;
  createdAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  categoryId: string;
  description?: string | null;
  status: string;
  createdAt: string;
  addressText?: string | null;
  assignedProviderId?: string | null;
  estimatedCost?: { amount: number; currency: string } | null;
}

const requestGraphql = async <T,>(query: string, variables?: Record<string, any>): Promise<T> => {
  const baseUrl = await resolveGraphQLBaseUrl();
  const token = await AsyncStorage.getItem('authToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const { data } = await axios.post(
    baseUrl,
    { query, variables },
    { timeout: API_CONFIG.TIMEOUT, headers }
  );
  if (data?.errors?.length) {
    throw new Error(data.errors[0]?.message || 'GraphQL error');
  }
  return data?.data as T;
};

const DASHBOARD_SUMMARY_QUERY = `
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

const USERS_QUERY = `
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

const USERS_BY_ROLE_QUERY = `
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

const SERVICE_DEFINITIONS_QUERY = `
  query GetServiceDefinitions {
    getServiceDefinitions {
      id
      name
      description
      categoryName
      basePrice
      estimatedDuration
      isActive
      bookingCount
      createdAt
      updatedAt
    }
  }
`;

const ACTIVITY_LOGS_QUERY = `
  query GetActivityLogs {
    getActivityLogs {
      id
      serviceRequestId
      action
      createdAt
    }
  }
`;

const CURRENT_USER_QUERY = `
  query GetCurrentUser {
    me {
      id
      fullName
      email
      phoneNumber
      role
    }
  }
`;

const SERVICE_CATEGORIES_QUERY = `
  query GetServiceCategories {
    getServiceCategories {
      id
      name
      description
    }
  }
`;

const SERVICE_REQUESTS_QUERY = `
  query GetServiceRequests {
    getServiceRequests {
      id
      customerId
      categoryId
      description
      status
      createdAt
      addressText
      assignedProviderId
      estimatedCost {
        amount
        currency
      }
    }
  }
`;

const SERVICE_REQUESTS_BY_STATUS_QUERY = `
  query GetServiceRequestsByStatus($status: ServiceStatus!) {
    getServiceRequestsByStatus(status: $status) {
      id
      customerId
      categoryId
      description
      status
      createdAt
      addressText
      assignedProviderId
      estimatedCost {
        amount
        currency
      }
    }
  }
`;

export const adminGraphqlService = {
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const data = await requestGraphql<{ getDashboardSummary: DashboardSummary }>(
      DASHBOARD_SUMMARY_QUERY
    );
    return data.getDashboardSummary;
  },
  getUsers: async (): Promise<GraphqlUser[]> => {
    const data = await requestGraphql<{ getUsers: GraphqlUser[] }>(USERS_QUERY);
    return data.getUsers ?? [];
  },
  getUsersByRole: async (role: UserRole): Promise<GraphqlUser[]> => {
    const data = await requestGraphql<{ getUsersByRole: GraphqlUser[] }>(
      USERS_BY_ROLE_QUERY,
      { role }
    );
    return data.getUsersByRole ?? [];
  },
  getServiceDefinitions: async (): Promise<ServiceListItem[]> => {
    const data = await requestGraphql<{ getServiceDefinitions: ServiceListItem[] }>(
      SERVICE_DEFINITIONS_QUERY
    );
    return data.getServiceDefinitions ?? [];
  },
  getActivityLogs: async (): Promise<ActivityLog[]> => {
    const data = await requestGraphql<{ getActivityLogs: ActivityLog[] }>(
      ACTIVITY_LOGS_QUERY
    );
    return data.getActivityLogs ?? [];
  },
  getCurrentUser: async (): Promise<GraphqlUser | null> => {
    const data = await requestGraphql<{ me: GraphqlUser | null }>(CURRENT_USER_QUERY);
    return data.me ?? null;
  },
  getServiceCategories: async (): Promise<ServiceCategory[]> => {
    const data = await requestGraphql<{ getServiceCategories: ServiceCategory[] }>(
      SERVICE_CATEGORIES_QUERY
    );
    return data.getServiceCategories ?? [];
  },
  getServiceRequests: async (): Promise<ServiceRequest[]> => {
    const data = await requestGraphql<{ getServiceRequests: ServiceRequest[] }>(
      SERVICE_REQUESTS_QUERY
    );
    return data.getServiceRequests ?? [];
  },
  getServiceRequestsByStatus: async (status: string): Promise<ServiceRequest[]> => {
    const data = await requestGraphql<{ getServiceRequestsByStatus: ServiceRequest[] }>(
      SERVICE_REQUESTS_BY_STATUS_QUERY,
      { status }
    );
    return data.getServiceRequestsByStatus ?? [];
  },
};
