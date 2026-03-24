import { httpRequest } from "../../../shared/api/httpClient";
export { createActivityLog } from "../../../shared/api/activityApi";
import type { Money } from "../../../shared/types/domain";

interface ServiceRequestStatusResponse {
  serviceRequestId: string;
  status: string;
}

interface ServiceAgentActiveStatusResponse {
  agentId: string;
  isActive: boolean;
}

export const startAssignedRequest = (
  token: string,
  serviceRequestId: string
): Promise<ServiceRequestStatusResponse> =>
  httpRequest<ServiceRequestStatusResponse>({
    path: `/api/service-requests/${serviceRequestId}/start`,
    method: "PATCH",
    token
  });

export const completeInProgressRequest = (
  token: string,
  serviceRequestId: string
): Promise<ServiceRequestStatusResponse> =>
  httpRequest<ServiceRequestStatusResponse>({
    path: `/api/service-requests/${serviceRequestId}/complete`,
    method: "PATCH",
    token
  });

interface RequestCompletionPayload {
  notes?: string;
  image?: { uri: string; name: string; type: string };
}

export const requestCompletion = async (
  token: string,
  serviceRequestId: string,
  data: RequestCompletionPayload
): Promise<void> => {
  const formData = new FormData();
  if (data.notes) formData.append("notes", data.notes);
  if (data.image) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData.append("image", data.image as any);
  }

  await httpRequest<void>({
    path: `/api/service-requests/${serviceRequestId}/request-completion`,
    method: "PATCH",
    token,
    body: formData
  });
};

export const setServiceAgentActiveStatus = (
  token: string,
  agentId: string,
  isActive: boolean
): Promise<ServiceAgentActiveStatusResponse> =>
  httpRequest<ServiceAgentActiveStatusResponse>({
    path: `/api/service-agents/${agentId}/active-status`,
    method: "PATCH",
    token,
    body: { isActive }
  });

export const createPriceAdjustmentRequest = (
  token: string,
  payload: {
    serviceRequestId: string;
    newPrice: { amount: number; currency: string };
    reason: string;
    createdBy: string;
  },
  evidenceImage: { uri: string; name: string; type: string }
): Promise<string> => {
  const formData = new FormData();
  formData.append("serviceRequestId", payload.serviceRequestId);
  formData.append("newPriceAmount", payload.newPrice.amount.toString());
  formData.append("newPriceCurrency", payload.newPrice.currency);
  formData.append("reason", payload.reason);
  formData.append("createdBy", payload.createdBy);
  
  formData.append("evidenceImage", {
    uri: evidenceImage.uri,
    name: evidenceImage.name || "evidence.jpg",
    type: evidenceImage.type || "image/jpeg"
  } as any);

  return httpRequest<string>({
    path: "/api/price-adjustments",
    method: "POST",
    token,
    body: formData
  });
};

export interface PayoutItem {
  id: string;
  serviceRequestId: string;
  agentId: string;
  amount: { amount: number; currency: string };
  commissionRate: number;
  netAmount: { amount: number; currency: string };
  payoutDate: string;
}

export const getPayoutsByAgent = (token: string, agentId: string): Promise<PayoutItem[]> =>
  httpRequest<PayoutItem[]>({
    path: `/api/payouts/agent/${agentId}`,
    method: "GET",
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

export const getPriceAdjustmentByServiceRequest = (
  token: string,
  serviceRequestId: string
): Promise<PriceAdjustmentItem | null> =>
  httpRequest<PriceAdjustmentItem | null>({
    path: `/api/price-adjustments/service-request/${serviceRequestId}`,
    method: "GET",
    token
  });
