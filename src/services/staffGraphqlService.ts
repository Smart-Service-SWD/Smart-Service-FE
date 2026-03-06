import graphqlClient from './graphqlClient';

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
  capabilities: {
    id: string;
    categoryId: string;
    maxComplexity: { level: number };
  }[];
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

// Removed redundant requestGraphql helper, using standardized graphqlClient instead

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
    const { data: resData } = await graphqlClient.post('', {
      query: REQUESTS_BY_STATUS_QUERY,
      variables: { status: 'PENDING_REVIEW' }
    });
    return resData?.data?.getServiceRequestsByStatus ?? [];
  },

  /** Requests in AWAITING_ANALYSIS or CREATED status (need to trigger AI analysis) */
  getNewRequests: async (): Promise<ServiceRequestSummary[]> => {
    const [awaitingRes, createdRes] = await Promise.all([
      graphqlClient.post('', {
        query: REQUESTS_BY_STATUS_QUERY,
        variables: { status: 'AWAITING_ANALYSIS' }
      }).catch(() => ({ data: { data: { getServiceRequestsByStatus: [] } } })),
      graphqlClient.post('', {
        query: REQUESTS_BY_STATUS_QUERY,
        variables: { status: 'CREATED' }
      }).catch(() => ({ data: { data: { getServiceRequestsByStatus: [] } } })),
    ]);

    const awaiting = awaitingRes.data?.data?.getServiceRequestsByStatus ?? [];
    const created = createdRes.data?.data?.getServiceRequestsByStatus ?? [];

    return [...awaiting, ...created].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /** All service requests (Staff/Admin view) */
  getAllRequests: async (): Promise<ServiceRequestSummary[]> => {
    const { data: resData } = await graphqlClient.post('', {
      query: ALL_REQUESTS_QUERY
    });
    return resData?.data?.getServiceRequests ?? [];
  },

  /** Full request detail with attachments and matching results */
  getRequestDetail: async (id: string): Promise<ServiceRequestDetail | null> => {
    const { data: resData } = await graphqlClient.post('', {
      query: REQUEST_DETAIL_QUERY,
      variables: { id }
    });
    return resData?.data?.getServiceRequestById ?? null;
  },

  /** Matching results for a specific request */
  getMatchingResults: async (serviceRequestId: string): Promise<MatchingResult[]> => {
    const { data: resData } = await graphqlClient.post('', {
      query: MATCHING_BY_REQUEST_QUERY,
      variables: { serviceRequestId }
    });
    return resData?.data?.getMatchingResultsByServiceRequestId ?? [];
  },

  /** Recommended (top match) providers for a request */
  getRecommendedMatches: async (serviceRequestId: string): Promise<MatchingResult[]> => {
    const { data: resData } = await graphqlClient.post('', {
      query: RECOMMENDED_MATCHES_QUERY,
      variables: { serviceRequestId }
    });
    return resData?.data?.getRecommendedMatches ?? [];
  },

  /** All service agents */
  getServiceAgents: async (): Promise<ServiceAgent[]> => {
    const { data: resData } = await graphqlClient.post('', {
      query: SERVICE_AGENTS_QUERY
    });
    return resData?.data?.getServiceAgents ?? [];
  },

  /** Active service agents only */
  getActiveServiceAgents: async (): Promise<ServiceAgent[]> => {
    const { data: resData } = await graphqlClient.post('', {
      query: ACTIVE_SERVICE_AGENTS_QUERY
    });
    return resData?.data?.getActiveServiceAgents ?? [];
  },

  /** Dashboard statistics (Staff/Admin) */
  getDashboardSummary: async (): Promise<StaffDashboardSummary> => {
    const { data: resData } = await graphqlClient.post('', {
      query: DASHBOARD_SUMMARY_QUERY
    });
    return resData?.data?.getDashboardSummary;
  },
};
