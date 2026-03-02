import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, resolveGraphQLBaseUrl } from '../config/api.config';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ServiceStatusType =
  | 'AWAITING_ANALYSIS'
  | 'CREATED'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'URGENT_DISPATCH';

export interface MatchingResult {
  id: string;
  serviceRequestId: string;
  serviceAgentId: string;
  supportedComplexity: { level: number };
  matchingScore: number;
  isRecommended: boolean;
}

export interface ServiceAttachmentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  type: string;
  uploadedAt: string;
}

export interface ServiceRequestDetail {
  id: string;
  customerId: string;
  categoryId: string;
  description?: string | null;
  complexity: { level: number };
  status: string;
  assignedProviderId?: string | null;
  estimatedCost?: { amount: number; currency: string } | null;
  createdAt: string;
  addressText?: string | null;
  attachments: ServiceAttachmentItem[];
  matchingResults: MatchingResult[];
}

export interface ServiceRequestSummary {
  id: string;
  customerId: string;
  categoryId: string;
  description?: string | null;
  complexity: { level: number };
  status: string;
  assignedProviderId?: string | null;
  estimatedCost?: { amount: number; currency: string } | null;
  createdAt: string;
  addressText?: string | null;
}

export interface ServiceAgent {
  id: string;
  fullName: string;
  isActive: boolean;
  capabilities: Array<{
    id: string;
    categoryId: string;
    maxComplexity: { level: number };
  }>;
}

export interface StaffDashboardSummary {
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

// ─── GraphQL Helper ─────────────────────────────────────────────────────────────

const requestGraphql = async <T,>(
  query: string,
  variables?: Record<string, any>
): Promise<T> => {
  const baseUrl = await resolveGraphQLBaseUrl();
  const token = await AsyncStorage.getItem('authToken');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

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

// ─── Queries ────────────────────────────────────────────────────────────────────

const REQUESTS_BY_STATUS_QUERY = `
  query GetServiceRequestsByStatus($status: ServiceStatus!) {
    getServiceRequestsByStatus(status: $status) {
      id
      customerId
      categoryId
      description
      complexity { level }
      status
      assignedProviderId
      estimatedCost { amount currency }
      createdAt
      addressText
    }
  }
`;

const REQUEST_DETAIL_QUERY = `
  query GetServiceRequestById($id: UUID!) {
    getServiceRequestById(id: $id) {
      id
      customerId
      categoryId
      description
      complexity { level }
      status
      assignedProviderId
      estimatedCost { amount currency }
      createdAt
      addressText
      attachments {
        id
        fileName
        fileUrl
        type
        uploadedAt
      }
      matchingResults {
        id
        serviceRequestId
        serviceAgentId
        supportedComplexity { level }
        matchingScore
        isRecommended
      }
    }
  }
`;

const ALL_REQUESTS_QUERY = `
  query GetServiceRequests {
    getServiceRequests {
      id
      customerId
      categoryId
      description
      complexity { level }
      status
      assignedProviderId
      estimatedCost { amount currency }
      createdAt
      addressText
    }
  }
`;

const MATCHING_BY_REQUEST_QUERY = `
  query GetMatchingResultsByServiceRequestId($serviceRequestId: UUID!) {
    getMatchingResultsByServiceRequestId(serviceRequestId: $serviceRequestId) {
      id
      serviceRequestId
      serviceAgentId
      supportedComplexity { level }
      matchingScore
      isRecommended
    }
  }
`;

const RECOMMENDED_MATCHES_QUERY = `
  query GetRecommendedMatches($serviceRequestId: UUID!) {
    getRecommendedMatches(serviceRequestId: $serviceRequestId) {
      id
      serviceRequestId
      serviceAgentId
      supportedComplexity { level }
      matchingScore
      isRecommended
    }
  }
`;

const SERVICE_AGENTS_QUERY = `
  query GetServiceAgents {
    getServiceAgents {
      id
      fullName
      isActive
      capabilities {
        id
        categoryId
        maxComplexity { level }
      }
    }
  }
`;

const ACTIVE_SERVICE_AGENTS_QUERY = `
  query GetActiveServiceAgents {
    getActiveServiceAgents {
      id
      fullName
      isActive
      capabilities {
        id
        categoryId
        maxComplexity { level }
      }
    }
  }
`;

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

// ─── Service ────────────────────────────────────────────────────────────────────

export const staffGraphqlService = {
  /** Requests in PENDING_REVIEW status (AI analyzed, awaiting staff approval) */
  getPendingReviewRequests: async (): Promise<ServiceRequestSummary[]> => {
    const data = await requestGraphql<{
      getServiceRequestsByStatus: ServiceRequestSummary[];
    }>(REQUESTS_BY_STATUS_QUERY, { status: 'PENDING_REVIEW' });
    return data.getServiceRequestsByStatus ?? [];
  },

  /** Requests in AWAITING_ANALYSIS or CREATED status (need to trigger AI analysis) */
  getNewRequests: async (): Promise<ServiceRequestSummary[]> => {
    const [awaiting, created] = await Promise.all([
      requestGraphql<{ getServiceRequestsByStatus: ServiceRequestSummary[] }>(
        REQUESTS_BY_STATUS_QUERY,
        { status: 'AWAITING_ANALYSIS' }
      ).then(d => d.getServiceRequestsByStatus ?? [])
        .catch(() => []),
      requestGraphql<{ getServiceRequestsByStatus: ServiceRequestSummary[] }>(
        REQUESTS_BY_STATUS_QUERY,
        { status: 'CREATED' }
      ).then(d => d.getServiceRequestsByStatus ?? [])
        .catch(() => []),
    ]);
    return [...awaiting, ...created].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /** All service requests (Staff/Admin view) */
  getAllRequests: async (): Promise<ServiceRequestSummary[]> => {
    const data = await requestGraphql<{
      getServiceRequests: ServiceRequestSummary[];
    }>(ALL_REQUESTS_QUERY);
    return data.getServiceRequests ?? [];
  },

  /** Full request detail with attachments and matching results */
  getRequestDetail: async (id: string): Promise<ServiceRequestDetail | null> => {
    const data = await requestGraphql<{
      getServiceRequestById: ServiceRequestDetail | null;
    }>(REQUEST_DETAIL_QUERY, { id });
    return data.getServiceRequestById ?? null;
  },

  /** Matching results for a specific request */
  getMatchingResults: async (serviceRequestId: string): Promise<MatchingResult[]> => {
    const data = await requestGraphql<{
      getMatchingResultsByServiceRequestId: MatchingResult[];
    }>(MATCHING_BY_REQUEST_QUERY, { serviceRequestId });
    return data.getMatchingResultsByServiceRequestId ?? [];
  },

  /** Recommended (top match) providers for a request */
  getRecommendedMatches: async (serviceRequestId: string): Promise<MatchingResult[]> => {
    const data = await requestGraphql<{
      getRecommendedMatches: MatchingResult[];
    }>(RECOMMENDED_MATCHES_QUERY, { serviceRequestId });
    return data.getRecommendedMatches ?? [];
  },

  /** All service agents */
  getServiceAgents: async (): Promise<ServiceAgent[]> => {
    const data = await requestGraphql<{ getServiceAgents: ServiceAgent[] }>(
      SERVICE_AGENTS_QUERY
    );
    return data.getServiceAgents ?? [];
  },

  /** Active service agents only */
  getActiveServiceAgents: async (): Promise<ServiceAgent[]> => {
    const data = await requestGraphql<{ getActiveServiceAgents: ServiceAgent[] }>(
      ACTIVE_SERVICE_AGENTS_QUERY
    );
    return data.getActiveServiceAgents ?? [];
  },

  /** Dashboard statistics (Staff/Admin) */
  getDashboardSummary: async (): Promise<StaffDashboardSummary> => {
    const data = await requestGraphql<{
      getDashboardSummary: StaffDashboardSummary;
    }>(DASHBOARD_SUMMARY_QUERY);
    return data.getDashboardSummary;
  },
};
