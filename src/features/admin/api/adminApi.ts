import { httpRequest } from "../../../shared/api/httpClient";

interface CreateCategoryPayload {
  name: string;
  description: string;
}

interface CreateServicePayload {
  categoryId: string;
  name: string;
  description?: string | null;
  basePrice: number;
  estimatedDuration: number;
  complexityRange: number[];
  isDangerous: boolean;
}

interface UpdateServicePayload {
  name: string;
  description?: string | null;
  basePrice: number;
  estimatedDuration: number;
  isActive: boolean;
  complexityRange?: number[];
  isDangerous?: boolean;
}

interface UpdateRolePayload {
  role: string;
}

interface LockPayload {
  isLocked: boolean;
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
}

export interface CreateAgentCapabilityPayload {
  categoryId: string;
  maxComplexityLevel: number;
  serviceIds: string[];
}

export interface CreateAgentUserPayload extends CreateUserPayload {
  capabilities: CreateAgentCapabilityPayload[];
}

export interface UpdateAgentCapabilitiesPayload {
  capabilities: CreateAgentCapabilityPayload[];
}

export const createCategory = (
  token: string,
  payload: CreateCategoryPayload
): Promise<string> =>
  httpRequest<string>({
    path: "/api/service-categories",
    method: "POST",
    token,
    body: payload
  });

export const createServiceDefinition = (
  token: string,
  payload: CreateServicePayload
): Promise<string> =>
  httpRequest<string>({
    path: "/api/services",
    method: "POST",
    token,
    body: payload
  });

export const updateServiceDefinition = async (
  token: string,
  id: string,
  payload: UpdateServicePayload
): Promise<void> => {
  await httpRequest<unknown>({
    path: `/api/services/${id}`,
    method: "PUT",
    token,
    body: payload
  });
};

export const deleteServiceDefinition = async (
  token: string,
  id: string
): Promise<void> => {
  await httpRequest<unknown>({
    path: `/api/services/${id}`,
    method: "DELETE",
    token
  });
};

export const updateUserRole = async (
  token: string,
  userId: string,
  payload: UpdateRolePayload
): Promise<void> => {
  await httpRequest<boolean>({
    path: `/api/auth/users/${userId}/role`,
    method: "PATCH",
    token,
    body: payload
  });
};

export const setUserLockState = async (
  token: string,
  userId: string,
  payload: LockPayload
): Promise<void> => {
  await httpRequest<boolean>({
    path: `/api/auth/users/${userId}/lock`,
    method: "PATCH",
    token,
    body: payload
  });
};

export const createCustomerUser = (
  token: string,
  payload: CreateUserPayload
): Promise<string> =>
  httpRequest<string>({
    path: "/api/users/customers",
    method: "POST",
    token,
    body: payload
  });

export const createAgentUser = (
  token: string,
  payload: CreateAgentUserPayload
): Promise<string> =>
  httpRequest<string>({
    path: "/api/users/agents",
    method: "POST",
    token,
    body: payload
  });

export const updateAgentCapabilities = async (
  token: string,
  agentId: string,
  payload: UpdateAgentCapabilitiesPayload
): Promise<void> => {
  await httpRequest<unknown>({
    path: `/api/service-agents/${agentId}/capabilities`,
    method: "PUT",
    token,
    body: payload
  });
};

export const createStaffUser = (
  token: string,
  payload: CreateUserPayload
): Promise<string> =>
  httpRequest<string>({
    path: "/api/users/staff",
    method: "POST",
    token,
    body: payload
  });
