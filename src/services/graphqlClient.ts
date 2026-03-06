import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, resolveGraphQLBaseUrl } from '../config/api.config';

const graphqlClient = axios.create({
  baseURL: API_CONFIG.GRAPHQL_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for GraphQL
graphqlClient.interceptors.request.use(
  async (config) => {
    try {
      const resolvedBaseUrl = await resolveGraphQLBaseUrl();
      config.baseURL = resolvedBaseUrl;

      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Error in GraphQL request interceptor:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default graphqlClient;
