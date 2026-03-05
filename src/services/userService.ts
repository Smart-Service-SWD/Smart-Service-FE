import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveGraphQLBaseUrl } from '../config/api.config';
import apiClient from './apiClient';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

export interface CreateServiceRequestDto {
  categoryId: string;
  description: string;
  addressText: string;
  phoneNumber?: string;
}

export interface ServiceAnalysisResult {
  id: string;
  serviceRequestId: string;
  complexity?: { level: number };
  estimatedCost?: { amount: number; currency: string };
  suggestions?: string;
  aiNotes?: string;
  contextDescription?: string;
  dispatchPolicy?: string;
  createdAt?: string;
}

export interface ServiceRequestDetail {
  id: string;
  customerId: string;
  categoryId: string;
  description: string;
  complexity?: { level: number };
  status: string;
  assignedProviderId?: string;
  estimatedCost?: { amount: number; currency: string };
  createdAt: string;
  addressText?: string;
  attachments: any[];
  matchingResults: any[];
}

export interface SubmitFeedbackDto {
  serviceRequestId: string;
  rating: number;
  comment?: string;
}

// ─── GraphQL helper ───────────────────────────────────────────────────────────

const gql = async (query: string, variables?: Record<string, any>) => {
  const url = await resolveGraphQLBaseUrl();
  const token = await AsyncStorage.getItem('authToken');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e: any) => e.message).join(', '));
  return json.data;
};

// ─── Service Categories ───────────────────────────────────────────────────────

export const getServiceCategories = async (): Promise<ServiceCategory[]> => {
  const data = await gql(`query { getServiceCategories { id name description } }`);
  return data.getServiceCategories ?? [];
};

// ─── Service Requests ────────────────────────────────────────────────────────

/**
 * Tạo yêu cầu dịch vụ mới → POST /api/service-requests
 */
export const createServiceRequest = async (dto: CreateServiceRequestDto) => {
  const res = await apiClient.post('/service-requests', dto);
  return res.data as ServiceRequestDetail;
};

/**
 * Gửi yêu cầu phân tích AI → POST /api/service-analysis
 */
export const analyzeServiceRequest = async (serviceRequestId: string): Promise<ServiceAnalysisResult> => {
  const res = await apiClient.post('/service-analysis', { serviceRequestId });
  return res.data as ServiceAnalysisResult;
};

/**
 * Yêu cầu đánh giá lại (AI phân tích lại) → POST /api/service-analysis với requestId
 */
export const reAnalyzeServiceRequest = async (serviceRequestId: string): Promise<ServiceAnalysisResult> => {
  return analyzeServiceRequest(serviceRequestId);
};

/**
 * Gửi yêu cầu cho staff đánh giá lại độ phức tạp
 * PATCH /api/service-requests/{id}/evaluate-complexity
 */
export const requestStaffEvaluation = async (serviceRequestId: string, note?: string) => {
  const res = await apiClient.patch(`/service-requests/${serviceRequestId}/evaluate-complexity`, {
    note: note ?? 'Khách hàng yêu cầu staff đánh giá lại',
  });
  return res.data;
};

/**
 * Lấy danh sách yêu cầu của chính user (GraphQL)
 * getMyServiceRequests(status?: ServiceStatus): [ServiceRequest!]!
 */
export const getMyServiceRequests = async (status?: string): Promise<ServiceRequestDetail[]> => {
  const query = `
    query getMyServiceRequests($status: ServiceStatus) {
      getMyServiceRequests(status: $status) {
        id customerId categoryId description
        complexity { level }
        status
        assignedProviderId
        estimatedCost { amount currency }
        createdAt addressText
        attachments { id fileName fileUrl type uploadedAt }
        matchingResults { id matchingScore isRecommended }
      }
    }
  `;
  const data = await gql(query, status ? { status } : {});
  return data.getMyServiceRequests ?? [];
};

/**
 * Lấy chi tiết một yêu cầu dịch vụ (GraphQL)
 */
export const getServiceRequestById = async (id: string): Promise<ServiceRequestDetail | null> => {
  const query = `
    query getServiceRequestById($id: UUID!) {
      getServiceRequestById(id: $id) {
        id customerId categoryId description
        complexity { level }
        status
        assignedProviderId
        estimatedCost { amount currency }
        createdAt addressText
        attachments { id fileName fileUrl type uploadedAt }
        matchingResults { id serviceAgentId matchingScore isRecommended supportedComplexity { level } }
      }
    }
  `;
  const data = await gql(query, { id });
  return data.getServiceRequestById ?? null;
};

// ─── Attachments ─────────────────────────────────────────────────────────────

/**
 * Upload tệp đính kèm → POST /api/service-attachments
 */
export const uploadAttachment = async (serviceRequestId: string, file: any) => {
  const formData = new FormData();
  formData.append('serviceRequestId', serviceRequestId);
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? 'application/octet-stream',
  } as any);
  const res = await apiClient.post('/service-attachments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// ─── Feedback ─────────────────────────────────────────────────────────────────

/**
 * Gửi đánh giá dịch vụ → POST /api/service-feedbacks
 */
export const submitFeedback = async (dto: SubmitFeedbackDto) => {
  const res = await apiClient.post('/service-feedbacks', dto);
  return res.data;
};

/**
 * Lấy danh sách feedback của chính user (GraphQL)
 */
export const getMyFeedbacks = async () => {
  const data = await gql(`
    query { getMyServiceFeedbacks { id serviceRequestId rating comment createdAt } }
  `);
  return data.getMyServiceFeedbacks ?? [];
};

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * Cập nhật hồ sơ cá nhân → PUT /api/auth/profile
 */
export const updateProfile = async (dto: { fullName?: string; phoneNumber?: string }) => {
  const res = await apiClient.put('/auth/profile', dto);
  return res.data;
};

// ─── Utility ──────────────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<string, string> = {
  AWAITING_ANALYSIS: 'Chờ phân tích AI',
  CREATED: 'Đã tạo',
  PENDING_REVIEW: 'Chờ staff duyệt',
  APPROVED: 'Đã duyệt',
  ASSIGNED: 'Đã giao thợ',
  IN_PROGRESS: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  URGENT_DISPATCH: 'Cấp bách',
};

export const STATUS_COLOR: Record<string, string> = {
  AWAITING_ANALYSIS: '#F59E0B',
  CREATED: '#6B7280',
  PENDING_REVIEW: '#3B82F6',
  APPROVED: '#10B981',
  ASSIGNED: '#8B5CF6',
  IN_PROGRESS: '#F97316',
  COMPLETED: '#059669',
  CANCELLED: '#EF4444',
  URGENT_DISPATCH: '#DC2626',
};

export const COMPLEXITY_LABEL: Record<number, string> = {
  1: 'Đơn giản',
  2: 'Trung bình',
  3: 'Phức tạp',
  4: 'Rất phức tạp',
  5: 'Cực kỳ phức tạp',
};
