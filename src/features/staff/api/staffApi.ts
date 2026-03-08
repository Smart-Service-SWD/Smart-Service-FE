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

export const evaluateComplexity = async (
  token: string,
  serviceRequestId: string,
  level: number
): Promise<void> => {
  await httpRequest<unknown>({
    path: `/api/service-requests/${serviceRequestId}/evaluate-complexity`,
    method: "PATCH",
    token,
    body: {
      complexity: {
        level
      }
    } satisfies EvaluateComplexityPayload
  });
};

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
