import axios from 'axios';
import { API_CONFIG, resolveGraphQLBaseUrl } from '../config/api.config';

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
  const baseUrl = await resolveGraphQLBaseUrl();
  const { data } = await axios.post(
    baseUrl,
    { query: GET_SERVICE_CATEGORIES },
    { timeout: API_CONFIG.TIMEOUT, headers: { 'Content-Type': 'application/json' } }
  );
  if (data?.errors) {
    throw new Error(data.errors[0]?.message || 'GraphQL error');
  }
  return data?.data?.getServiceCategories ?? [];
};

// --- User Profile (GraphQL) ---

export interface GraphQLUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
}

/**
 * Fetch current user info (including phoneNumber) from GraphQL.
 * Uses getUserById(id) query. Requires `author` header with the auth token.
 */
export const fetchCurrentUser = async (token: string, userId: string): Promise<GraphQLUser | null> => {
  const query = `
    {
      getUserById(id: "${userId}") {
        id
        fullName
        email
        phoneNumber
        role
      }
    }
  `;
  const baseUrl = await resolveGraphQLBaseUrl();
  const { data } = await axios.post(
    baseUrl,
    { query },
    {
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'author': token,
      },
    }
  );
  if (data?.errors) {
    throw new Error(data.errors[0]?.message || 'GraphQL error');
  }
  return data?.data?.getUserById ?? null;
};

// --- Service Requests (GraphQL) ---

export interface ServiceRequest {
  id: string;
  customerId: string;
  categoryId: string;
  description: string;
  complexity: { level: number } | null;
  status: string;
  assignedProviderId: string | null;
  estimatedCost: { amount: number; currency: string } | null;
  createdAt: string;
  addressText: string;
}

const GET_MY_SERVICE_REQUESTS = `
  {
    getMyServiceRequests {
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

/**
 * Fetch current user's service requests.
 * Requires `Authorization: Bearer <token>` header.
 */
export const fetchMyServiceRequests = async (token: string): Promise<ServiceRequest[]> => {
  const baseUrl = await resolveGraphQLBaseUrl();
  const { data } = await axios.post(
    baseUrl,
    { query: GET_MY_SERVICE_REQUESTS },
    {
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  if (data?.errors) {
    throw new Error(data.errors[0]?.message || 'GraphQL error');
  }
  return data?.data?.getMyServiceRequests ?? [];
};
