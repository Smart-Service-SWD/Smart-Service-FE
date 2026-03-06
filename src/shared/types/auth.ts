export type AppRole = "CUSTOMER" | "STAFF" | "AGENT" | "ADMIN";

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  userId: string;
  email: string;
  fullName: string;
  role: AppRole;
}

