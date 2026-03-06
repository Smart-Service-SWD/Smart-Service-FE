import graphqlClient from './graphqlClient';

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
  isLocked?: boolean;
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

// Removed redundant requestGraphql helper, using standardized graphqlClient instead

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
      isLocked
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
      isLocked
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

const SERVICE_DEFINITIONS_BY_CATEGORY_QUERY = `
  query GetServiceDefinitionsByCategory($categoryId: UUID!) {
    getServiceDefinitionsByCategory(categoryId: $categoryId) {
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
    const { data: resData } = await graphqlClient.post('', {
      query: DASHBOARD_SUMMARY_QUERY
    });
    return resData?.data?.getDashboardSummary;
  },
  getUsers: async (): Promise<GraphqlUser[]> => {
    const { data: resData } = await graphqlClient.post('', {
      query: USERS_QUERY
    });
    return resData?.data?.getUsers ?? [];
  },
  getUsersByRole: async (role: UserRole): Promise<GraphqlUser[]> => {
    const { data: resData } = await graphqlClient.post('', {
      query: USERS_BY_ROLE_QUERY,
      variables: { role }
    });
    return resData?.data?.getUsersByRole ?? [];
  },
  getServiceDefinitions: async (): Promise<ServiceListItem[]> => {
    const { data: resData } = await graphqlClient.post('', {
      query: SERVICE_DEFINITIONS_QUERY
    });
    return resData?.data?.getServiceDefinitions ?? [];
  },
  getServiceDefinitionsByCategory: async (categoryId: string): Promise<ServiceListItem[]> => {
    const { data: resData } = await graphqlClient.post('', {
      query: SERVICE_DEFINITIONS_BY_CATEGORY_QUERY,
      variables: { categoryId }
    });
    return resData?.data?.getServiceDefinitionsByCategory ?? [];
  },
  getActivityLogs: async (): Promise<ActivityLog[]> => {
    const { data: resData } = await graphqlClient.post('', {
      query: ACTIVITY_LOGS_QUERY
    });
    return resData?.data?.getActivityLogs ?? [];
  },
  getCurrentUser: async (): Promise<GraphqlUser | null> => {
    const { data: resData } = await graphqlClient.post('', {
      query: CURRENT_USER_QUERY
    });
    return resData?.data?.me ?? null;
  },
  getServiceCategories: async (): Promise<ServiceCategory[]> => {
    const { data: resData } = await graphqlClient.post('', {
      query: SERVICE_CATEGORIES_QUERY
    });
    return resData?.data?.getServiceCategories ?? [];
  },
  getServiceRequests: async (): Promise<ServiceRequest[]> => {
    const { data: resData } = await graphqlClient.post('', {
      query: SERVICE_REQUESTS_QUERY
    });
    return resData?.data?.getServiceRequests ?? [];
  },
  getServiceRequestsByStatus: async (status: string): Promise<ServiceRequest[]> => {
    const { data: resData } = await graphqlClient.post('', {
      query: SERVICE_REQUESTS_BY_STATUS_QUERY,
      variables: { status }
    });
    return resData?.data?.getServiceRequestsByStatus ?? [];
  },
};
