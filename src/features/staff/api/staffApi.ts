import { httpRequest } from "../../../shared/api/httpClient";
export { createActivityLog } from "../../../shared/api/activityApi";
import type { Money } from "../../../shared/types/domain";

interface EvaluateComplexityPayload {
  complexity: {
    level: number;
  };
}

interface AssignProviderPayload {
  providerId: string;
  estimatedCost: Money;
}

interface CreateAssignmentPayload {
  serviceRequestId: string;
  agentId: string;
  estimatedCost: Money;
}

interface CreateMatchingResultPayload {
  serviceRequestId: string;
  serviceAgentId: string;
  supportedComplexity: {
    level: number;
  };
  matchingScore: number;
  isRecommended: boolean;
}

export interface SearchServiceAgentsResult {
  items: ServiceAgentSearchItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface ServiceAgentSearchItem {
  id: string;
  fullName: string;
  isActive: boolean;
  isBusy: boolean;
  matchingScore: number;
  busyReason?: string;
}

export const searchServiceAgents = (
  token: string,
  params: {
    categoryId?: string;
    serviceId?: string;
    minComplexity?: number;
    page?: number;
    pageSize?: number;
  }
): Promise<SearchServiceAgentsResult> => {
  const queryParams = new URLSearchParams();
  if (params.categoryId) queryParams.append("categoryId", params.categoryId);
  if (params.serviceId) queryParams.append("serviceId", params.serviceId);
  if (params.minComplexity) queryParams.append("minComplexity", String(params.minComplexity));
  if (params.page) queryParams.append("page", String(params.page));
  if (params.pageSize) queryParams.append("pageSize", String(params.pageSize));

  return httpRequest<SearchServiceAgentsResult>({
    path: `/api/service-agents/search?${queryParams.toString()}`,
    method: "GET",
    token
  });
};

export const evaluateComplexity = (
  token: string,
  serviceRequestId: string,
  complexityLevel: number,
  serviceId?: string,
  estimatedCost?: Money
): Promise<void> =>
  httpRequest<void>({
    path: `/api/service-requests/${serviceRequestId}/evaluate-complexity`,
    method: "PATCH",
    body: {
      complexity: { level: complexityLevel },
      serviceDefinitionId: serviceId,
      estimatedCost
    },
    token
  });

export const assignProvider = async (
  token: string,
  serviceRequestId: string,
  payload: AssignProviderPayload
): Promise<void> => {
  await httpRequest<unknown>({
    path: `/api/service-requests/${serviceRequestId}/assign-provider`,
    method: "PATCH",
    token,
    body: payload
  });
};

export const requestDeposit = async (
  token: string,
  serviceRequestId: string,
  depositAmount: Money,
  commissionRate: number
): Promise<void> => {
  await httpRequest<unknown>({
    path: `/api/service-requests/${serviceRequestId}/request-deposit`,
    method: "PATCH",
    token,
    body: {
      amount: depositAmount.amount,
      currency: depositAmount.currency,
      commissionRate
    }
  });
};

export const approveCompletion = async (
  token: string,
  serviceRequestId: string
): Promise<void> => {
  await httpRequest<unknown>({
    path: `/api/service-requests/${serviceRequestId}/approve-completion`,
    method: "PATCH",
    token
  });
};

export const rejectCompletion = async (
  token: string,
  serviceRequestId: string
): Promise<void> => {
  await httpRequest<unknown>({
    path: `/api/service-requests/${serviceRequestId}/reject-completion`,
    method: "PATCH",
    token
  });
};

export const startService = async (
  token: string,
  serviceRequestId: string
): Promise<void> => {
  await httpRequest<unknown>({
    path: `/api/service-requests/${serviceRequestId}/start`,
    method: "PATCH",
    token
  });
};

export const createAssignment = (
  token: string,
  payload: CreateAssignmentPayload
): Promise<string> =>
  httpRequest<string>({
    path: "/api/assignments",
    method: "POST",
    token,
    body: payload
  });

export const createMatchingResult = (
  token: string,
  payload: CreateMatchingResultPayload
): Promise<string> =>
  httpRequest<string>({
    path: "/api/matching-results",
    method: "POST",
    token,
    body: payload
  });

export const approvePriceAdjustment = (
  token: string,
  adjustmentId: string
): Promise<void> =>
  httpRequest<void>({
    path: `/api/price-adjustments/${adjustmentId}/approve`,
    method: "POST",
    token
  });

export const rejectPriceAdjustment = (
  token: string,
  adjustmentId: string
): Promise<void> =>
  httpRequest<void>({
    path: `/api/price-adjustments/${adjustmentId}/reject`,
    method: "POST",
    token
  });

export interface PriceAdjustmentItem {
  id: string;
  serviceRequestId: string;
  oldPriceAmount: number;
  oldPriceCurrency: string;
  newPriceAmount: number;
  newPriceCurrency: string;
  reason: string;
  evidenceImageUrl: string;
  status: string;
  createdAt: string;
  createdBy: string;
}

export const getPendingPriceAdjustments = (
  token: string
): Promise<PriceAdjustmentItem[]> =>
  httpRequest<PriceAdjustmentItem[]>({
    path: "/api/price-adjustments/pending",
    method: "GET",
    token
  });

export const getPriceAdjustmentByServiceRequest = (
  token: string,
  serviceRequestId: string
): Promise<PriceAdjustmentItem | null> =>
  httpRequest<PriceAdjustmentItem | null>({
    path: `/api/price-adjustments/service-request/${serviceRequestId}`,
    method: "GET",
    token
  });

export const markAsAwaitingPayment = (
  token: string,
  serviceRequestId: string
): Promise<void> =>
  httpRequest<void>({
    path: `/api/service-requests/${serviceRequestId}/awaiting-payment`,
    method: "PATCH",
    token
  });

export const markAsPaid = (
  token: string,
  serviceRequestId: string
): Promise<void> =>
  httpRequest<void>({
    path: `/api/service-requests/${serviceRequestId}/paid`,
    method: "PATCH",
    token
  });

export const payoutServiceRequest = (
  token: string,
  serviceRequestId: string
): Promise<void> =>
  httpRequest<void>({
    path: `/api/payouts/process`,
    method: "POST",
    token,
    body: {
      serviceRequestId,
      commissionPercent: 20
    }
  });
