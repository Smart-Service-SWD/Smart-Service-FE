import { httpRequest } from "../../../shared/api/httpClient";

export interface RequestImageAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export interface CreateRequestPayload {
  customerId: string;
  categoryId: string;
  serviceDefinitionId: string;
  description: string;
  addressText?: string | null;
  image?: RequestImageAsset | null;
}

interface CreateFeedbackPayload {
  serviceRequestId: string;
  createdByUserId: string;
  rating: number;
  comment?: string | null;
}

export interface CreateServiceRequestResult {
  serviceRequestId: string;
  aiComplexityLevel?: number | null;
  aiUrgencyLevel?: number | null;
  aiSummary?: string | null;
  aiProblemDiagnosis?: string | null;
  aiRiskExplanation?: string | null;
  aiSafetyAdvice?: string | null;
  estimatedPrice?: string | null;
  estimatedDuration?: string | null;
  ocrExtractedText?: string | null;
  wasAnalyzedByAI: boolean;
  isDangerFlagged: boolean;
}

export interface ServiceRequestStatusResult {
  serviceRequestId: string;
  status: string;
}

const appendImage = (formData: FormData, image: RequestImageAsset) => {
  const normalizedFileName = image.fileName?.trim() || "request-image.jpg";
  const normalizedMimeType = image.mimeType?.trim() || "image/jpeg";

  formData.append(
    "image",
    {
      uri: image.uri,
      name: normalizedFileName,
      type: normalizedMimeType
    } as unknown as Blob
  );
};

export const createServiceRequest = (
  token: string,
  payload: CreateRequestPayload
): Promise<CreateServiceRequestResult> => {
  const formData = new FormData();
  formData.append("customerId", payload.customerId);
  formData.append("categoryId", payload.categoryId);
  formData.append("serviceDefinitionId", payload.serviceDefinitionId);
  formData.append("description", payload.description);
  if (payload.addressText?.trim()) {
    formData.append("addressText", payload.addressText.trim());
  }
  if (payload.image) {
    appendImage(formData, payload.image);
  }

  return httpRequest<CreateServiceRequestResult>({
    path: "/api/service-requests",
    method: "POST",
    token,
    body: formData
  });
};

export const createServiceFeedback = (
  token: string,
  payload: CreateFeedbackPayload
): Promise<string> =>
  httpRequest<string>({
    path: "/api/service-feedbacks",
    method: "POST",
    token,
    body: payload
  });

export const cancelServiceRequest = (
  token: string,
  serviceRequestId: string
): Promise<ServiceRequestStatusResult> =>
  httpRequest<ServiceRequestStatusResult>({
    path: `/api/service-requests/${serviceRequestId}/cancel`,
    method: "PATCH",
  });

export interface PaymentLinkResult {
  orderCode: number;
  checkoutUrl: string;
  status: string;
  qrCode: string;
}

export const createDepositLink = (
  token: string,
  serviceRequestId: string,
  returnUrl: string,
  cancelUrl: string
): Promise<PaymentLinkResult> =>
  httpRequest<PaymentLinkResult>({
    path: `/api/payments/${serviceRequestId}/create-deposit-link`,
    method: "POST",
    token,
    body: { returnUrl, cancelUrl }
  });

export const createFinalLink = (
  token: string,
  serviceRequestId: string,
  returnUrl: string,
  cancelUrl: string
): Promise<PaymentLinkResult> =>
  httpRequest<PaymentLinkResult>({
    path: `/api/payments/${serviceRequestId}/create-final-link`,
    method: "POST",
    token,
    body: { returnUrl, cancelUrl }
  });

