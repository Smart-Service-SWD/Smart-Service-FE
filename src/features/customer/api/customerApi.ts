import { httpRequest } from "../../../shared/api/httpClient";

export interface AnalyzeResult {
  complexity: number;
  userMessage: {
    summary: string;
    riskExplanation: string;
    safetyAdvice: string;
  };
  dispatchRules: {
    requiredSkillLevel: number;
    minExperienceYears: number;
    requiresCertification: boolean;
    requiresSeniorTechnician: boolean;
    riskWeight: number;
  };
}

interface CreateRequestPayload {
  customerId: string;
  categoryId: string;
  description: string;
  addressText?: string | null;
  complexityLevel?: number | null;
}

interface CreateFeedbackPayload {
  serviceRequestId: string;
  createdByUserId: string;
  rating: number;
  comment?: string | null;
}

interface CreateAttachmentPayload {
  serviceRequestId: string;
  fileName: string;
  fileUrl: string;
  type: number;
}

export const analyzeServiceText = (description: string): Promise<AnalyzeResult> =>
  httpRequest<AnalyzeResult>({
    path: "/api/service-analysis",
    method: "POST",
    body: { description }
  });

export const createServiceRequest = (
  token: string,
  payload: CreateRequestPayload
): Promise<string> =>
  httpRequest<string>({
    path: "/api/service-requests",
    method: "POST",
    token,
    body: payload
  });

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

export const createServiceAttachment = (
  token: string,
  payload: CreateAttachmentPayload
): Promise<string> =>
  httpRequest<string>({
    path: "/api/service-attachments",
    method: "POST",
    token,
    body: payload
  });

