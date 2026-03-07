import { httpRequest } from "../../../shared/api/httpClient";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
}

export interface AuthApiResult {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  userId: string;
  email: string;
  fullName: string;
  role: string | number;
}

interface RefreshTokenPayload {
  refreshToken: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

interface MessageResponse {
  message: string;
}

export const loginApi = (payload: LoginPayload): Promise<AuthApiResult> =>
  httpRequest<AuthApiResult>({
    path: "/api/auth/login",
    method: "POST",
    body: payload
  });

export const registerApi = (payload: RegisterPayload): Promise<AuthApiResult> =>
  httpRequest<AuthApiResult>({
    path: "/api/auth/register",
    method: "POST",
    body: payload
  });

export const refreshTokenApi = (
  payload: RefreshTokenPayload
): Promise<AuthApiResult> =>
  httpRequest<AuthApiResult>({
    path: "/api/auth/refresh-token",
    method: "POST",
    body: payload
  });

export const logoutApi = async (
  payload: RefreshTokenPayload
): Promise<void> => {
  await httpRequest<boolean>({
    path: "/api/auth/logout",
    method: "POST",
    body: payload
  });
};

export const forgotPasswordApi = (
  payload: ForgotPasswordPayload
): Promise<MessageResponse> =>
  httpRequest<MessageResponse>({
    path: "/api/auth/forgot-password",
    method: "POST",
    body: payload
  });

export const resetPasswordApi = (
  payload: ResetPasswordPayload
): Promise<MessageResponse> =>
  httpRequest<MessageResponse>({
    path: "/api/auth/reset-password",
    method: "POST",
    body: payload
  });
