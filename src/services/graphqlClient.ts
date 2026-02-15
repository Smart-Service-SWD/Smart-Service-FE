import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

const graphqlClient = axios.create({
  baseURL: API_CONFIG.GRAPHQL_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default graphqlClient;
