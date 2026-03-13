import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthSession } from "../types/auth";

const AUTH_SESSION_KEY = "smart_service_auth_session";

export const saveAuthSession = async (session: AuthSession): Promise<void> => {
  await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
};

export const readAuthSession = async (): Promise<AuthSession | null> => {
  const raw = await AsyncStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

export const clearAuthSession = async (): Promise<void> => {
  await AsyncStorage.removeItem(AUTH_SESSION_KEY);
};

