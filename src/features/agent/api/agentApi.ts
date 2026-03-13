import { httpRequest } from "../../../shared/api/httpClient";
export { createActivityLog } from "../../../shared/api/activityApi";

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
