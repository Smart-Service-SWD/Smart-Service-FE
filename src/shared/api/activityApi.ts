import { httpRequest } from "./httpClient";

export interface CreateActivityLogPayload {
  serviceRequestId: string;
  action: string;
}

export const createActivityLog = (
  token: string,
  payload: CreateActivityLogPayload
): Promise<string> =>
  httpRequest<string>({
    path: "/api/activity-logs",
    method: "POST",
    token,
    body: payload
  });
