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
