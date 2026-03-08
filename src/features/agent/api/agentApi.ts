import { httpRequest } from "../../../shared/api/httpClient";
export { createActivityLog } from "../../../shared/api/activityApi";

interface ServiceRequestStatusResponse {
  serviceRequestId: string;
  status: string;
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
