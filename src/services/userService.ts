import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';
import graphqlClient from './graphqlClient';

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

export interface CreateServiceRequestDto {
  categoryId: string;
  description: string;
  addressText: string;
  complexityLevel?: number;
}

export interface ServiceAnalysisResult {
  complexity?: { level: number };
  estimatedCost?: { amount: number; currency: string };
  userMessage?: {
    summary?: string;
    riskExplanation?: string;
    safetyAdvice?: string;
  };
  dispatchRules?: {
    requiredSkillLevel?: number;
    minExperienceYears?: number;
    requiresCertification?: boolean;
    requiresSeniorTechnician?: boolean;
    riskWeight?: number;
  };
  suggestions?: string;
  contextDescription?: string;
  dispatchPolicy?: string;
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
  attachments: {
    id: string;
    fileName: string;
    fileUrl: string;
    type: string;
    uploadedAt: string;
  }[];
  matchingResults: {
    id: string;
    serviceAgentId: string;
    matchingScore: number;
    isRecommended: boolean;
    supportedComplexity?: { level: number };
  }[];
}

export interface SubmitFeedbackDto {
  serviceRequestId: string;
  rating: number;
  comment?: string;
}

const ensureGraphQLError = (payload: any) => {
  if (payload?.errors?.length) {
    throw new Error(payload.errors[0]?.message || 'GraphQL error');
  }
};

const getStoredUser = async (): Promise<{ id: string } | null> => {
  const raw = await AsyncStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const mapAnalysisResult = (raw: any): ServiceAnalysisResult => {
  const complexityLevel =
    typeof raw?.complexity === 'number'
      ? raw.complexity
      : typeof raw?.complexity?.level === 'number'
        ? raw.complexity.level
        : typeof raw?.complexityLevel === 'number'
          ? raw.complexityLevel
          : undefined;

  const userMessage = raw?.userMessage;
  const summary =
    typeof userMessage === 'string'
      ? userMessage
      : userMessage?.summary ?? '';
  const risk = userMessage?.riskExplanation ?? '';
  const safety = userMessage?.safetyAdvice ?? '';
  const contextDescription = [risk, safety].filter(Boolean).join('\n');

  const dispatch = raw?.dispatchRules;

  return {
    complexity: complexityLevel ? { level: complexityLevel } : undefined,
    userMessage:
      typeof userMessage === 'object'
        ? userMessage
        : { summary },
    dispatchRules: dispatch,
    suggestions: summary || undefined,
    contextDescription: contextDescription || undefined,
    dispatchPolicy: dispatch ? JSON.stringify(dispatch) : undefined,
  };
};

export const getServiceCategories = async (): Promise<ServiceCategory[]> => {
  const { data } = await graphqlClient.post('', {
    query: `query { getServiceCategories { id name description } }`,
  });
  ensureGraphQLError(data);
  return data?.data?.getServiceCategories ?? [];
};

export const createServiceRequest = async (
  dto: CreateServiceRequestDto
): Promise<ServiceRequestDetail> => {
  const user = await getStoredUser();
  if (!user?.id) {
    throw new Error('Bạn cần đăng nhập để tạo yêu cầu dịch vụ.');
  }

  const payload = {
    customerId: user.id,
    categoryId: dto.categoryId,
    description: dto.description,
    addressText: dto.addressText,
    complexityLevel: dto.complexityLevel,
  };
  const res = await apiClient.post('/service-requests', payload);

  const createdId = res.data?.id || res.data;
  if (!createdId) {
    throw new Error('Không nhận được ID yêu cầu dịch vụ từ backend.');
  }

  return {
    id: String(createdId),
    customerId: user.id,
    categoryId: dto.categoryId,
    description: dto.description,
    complexity: dto.complexityLevel ? { level: dto.complexityLevel } : undefined,
    status: 'AWAITING_ANALYSIS',
    createdAt: new Date().toISOString(),
    addressText: dto.addressText,
    attachments: [],
    matchingResults: [],
  };
};

export const analyzeServiceRequest = async (
  description: string
): Promise<ServiceAnalysisResult> => {
  const res = await apiClient.post('/service-analysis', { description });
  return mapAnalysisResult(res.data);
};

export const reAnalyzeServiceRequest = async (
  description: string
): Promise<ServiceAnalysisResult> => analyzeServiceRequest(description);

export const requestStaffEvaluation = async (
  serviceRequestId: string,
  complexityLevel: number
) => {
  const level = Math.max(1, Math.min(5, complexityLevel || 3));
  const res = await apiClient.patch(
    `/service-requests/${serviceRequestId}/evaluate-complexity`,
    { complexity: { level } }
  );
  return res.data;
};

export const createActivityLog = async (
  serviceRequestId: string,
  action: string
) => {
  const res = await apiClient.post('/activity-logs', { serviceRequestId, action });
  return res.data;
};

export const getMyServiceRequests = async (
  status?: string
): Promise<ServiceRequestDetail[]> => {
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
        matchingResults { id serviceAgentId matchingScore isRecommended supportedComplexity { level } }
      }
    }
  `;
  const { data } = await graphqlClient.post('', {
    query,
    variables: status ? { status } : {},
  });
  ensureGraphQLError(data);
  return data?.data?.getMyServiceRequests ?? [];
};

export const getServiceRequestById = async (
  id: string
): Promise<ServiceRequestDetail | null> => {
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
  const { data } = await graphqlClient.post('', {
    query,
    variables: { id },
  });
  ensureGraphQLError(data);
  return data?.data?.getServiceRequestById ?? null;
};

const detectAttachmentType = (file: any): 'Image' | 'Video' | 'Document' | 'Other' => {
  const mime = (file?.mimeType || file?.type || '').toLowerCase();
  if (mime.startsWith('image/')) return 'Image';
  if (mime.startsWith('video/')) return 'Video';
  if (
    mime.includes('pdf') ||
    mime.includes('msword') ||
    mime.includes('officedocument') ||
    mime.includes('text/')
  ) {
    return 'Document';
  }
  return 'Other';
};

export const uploadAttachment = async (serviceRequestId: string, file: any) => {
  const payload = {
    serviceRequestId,
    fileName: file?.name || `attachment-${Date.now()}`,
    fileUrl: file?.uri || '',
    type: detectAttachmentType(file),
  };
  const res = await apiClient.post('/service-attachments', payload);
  return res.data;
};

export const submitFeedback = async (dto: SubmitFeedbackDto) => {
  const user = await getStoredUser();
  if (!user?.id) {
    throw new Error('Bạn cần đăng nhập để gửi đánh giá.');
  }
  const payload = {
    serviceRequestId: dto.serviceRequestId,
    createdByUserId: user.id,
    rating: dto.rating,
    comment: dto.comment,
  };
  const res = await apiClient.post('/service-feedbacks', payload);
  return res.data;
};

export const getMyFeedbacks = async () => {
  const { data } = await graphqlClient.post('', {
    query: `
      query {
        getMyServiceFeedbacks {
          id serviceRequestId rating comment createdAt
        }
      }
    `,
  });
  ensureGraphQLError(data);
  return data?.data?.getMyServiceFeedbacks ?? [];
};

export const getFeedbackByServiceRequestId = async (serviceRequestId: string) => {
  const { data } = await graphqlClient.post('', {
    query: `
      query getFeedbackByServiceRequestId($serviceRequestId: UUID!) {
        getFeedbackByServiceRequestId(serviceRequestId: $serviceRequestId) {
          id serviceRequestId createdByUserId rating comment createdAt
        }
      }
    `,
    variables: { serviceRequestId },
  });
  ensureGraphQLError(data);
  return data?.data?.getFeedbackByServiceRequestId ?? [];
};

export const getAverageRatingByServiceRequestId = async (
  serviceRequestId: string
): Promise<number> => {
  const { data } = await graphqlClient.post('', {
    query: `
      query getAverageRatingByServiceRequestId($serviceRequestId: UUID!) {
        getAverageRatingByServiceRequestId(serviceRequestId: $serviceRequestId)
      }
    `,
    variables: { serviceRequestId },
  });
  ensureGraphQLError(data);
  return Number(data?.data?.getAverageRatingByServiceRequestId ?? 0);
};

export const updateProfile = async (dto: { fullName?: string; phoneNumber?: string }) => {
  const res = await apiClient.put('/auth/profile', {
    fullName: dto.fullName ?? '',
    phoneNumber: dto.phoneNumber ?? '',
  });
  return res.data;
};

export const STATUS_LABEL: Record<string, string> = {
  AWAITING_ANALYSIS: 'Chờ phân tích AI',
  CREATED: 'Đã tạo',
  PENDING_REVIEW: 'Chờ staff duyệt',
  APPROVED: 'Đã duyệt',
  ASSIGNED: 'Đã giao thợ',
  IN_PROGRESS: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  URGENT_DISPATCH: 'Khẩn cấp',
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
