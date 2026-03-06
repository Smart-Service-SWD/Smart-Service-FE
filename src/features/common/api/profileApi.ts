import { httpRequest } from "../../../shared/api/httpClient";

interface UpdateProfilePayload {
  fullName: string;
  phoneNumber: string;
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const updateProfile = async (
  token: string,
  payload: UpdateProfilePayload
): Promise<void> => {
  await httpRequest<boolean>({
    path: "/api/auth/profile",
    method: "PUT",
    token,
    body: payload
  });
};

export const changePassword = async (
  token: string,
  payload: ChangePasswordPayload
): Promise<void> => {
  await httpRequest<boolean>({
    path: "/api/auth/change-password",
    method: "POST",
    token,
    body: payload
  });
};

