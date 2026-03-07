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

export interface RequestImageAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export interface CreateRequestPayload {
  customerId: string;
  categoryId: string;
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

interface CreateAttachmentPayload {
  serviceRequestId: string;
  fileName: string;
  fileUrl: string;
  type: number;
}

export interface CreateServiceRequestResult {
  serviceRequestId: string;
  aiComplexityLevel?: number | null;
  aiSummary?: string | null;
  aiRiskExplanation?: string | null;
  ocrExtractedText?: string | null;
  wasAnalyzedByAI: boolean;
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

export const analyzeServiceText = (
  description: string,
  image?: RequestImageAsset | null
): Promise<AnalyzeResult> => {
  if (!image) {
    return httpRequest<AnalyzeResult>({
      path: "/api/service-analysis",
      method: "POST",
      body: { description }
    });
  }

  const formData = new FormData();
  formData.append("description", description);
  appendImage(formData, image);

  return httpRequest<AnalyzeResult>({
    path: "/api/service-analysis/analyze-with-image",
    method: "POST",
    body: formData
  });
};

export const createServiceRequest = (
  token: string,
  payload: CreateRequestPayload
): Promise<CreateServiceRequestResult> => {
  const formData = new FormData();
  formData.append("customerId", payload.customerId);
  formData.append("categoryId", payload.categoryId);
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
