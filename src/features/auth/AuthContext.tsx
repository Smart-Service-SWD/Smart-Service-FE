import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import type { PropsWithChildren } from "react";
import {
  loginApi,
  logoutApi,
  refreshTokenApi,
  registerApi,
  type AuthApiResult,
  type LoginPayload,
  type RegisterPayload
} from "./api/authApi";
import type { AuthSession } from "../../shared/types/auth";
import { normalizeRole } from "../../shared/utils/role";
import {
  clearAuthSession,
  readAuthSession,
  saveAuthSession
} from "../../shared/storage/sessionStorage";

interface AuthContextValue {
  session: AuthSession | null;
  initializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const toAuthSession = (result: AuthApiResult): AuthSession => ({
  accessToken: result.accessToken,
  refreshToken: result.refreshToken,
  accessTokenExpiresAt: result.accessTokenExpiresAt,
  refreshTokenExpiresAt: result.refreshTokenExpiresAt,
  userId: result.userId,
  email: result.email,
  fullName: result.fullName,
  role: normalizeRole(result.role)
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const cached = await readAuthSession();
      if (cached) {
        setSession(cached);
      }
      setInitializing(false);
    };
    void bootstrap();
  }, []);

  const persistSession = useCallback(async (nextSession: AuthSession) => {
    setSession(nextSession);
    await saveAuthSession(nextSession);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const result = await loginApi(payload);
      await persistSession(toAuthSession(result));
    },
    [persistSession]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const result = await registerApi(payload);
      await persistSession(toAuthSession(result));
    },
    [persistSession]
  );

  const refreshSession = useCallback(async () => {
    if (!session) {
      return;
    }

    const result = await refreshTokenApi({
      refreshToken: session.refreshToken
    });
    await persistSession(toAuthSession(result));
  }, [persistSession, session]);

  const logout = useCallback(async () => {
    try {
      if (session?.refreshToken) {
        await logoutApi({
          refreshToken: session.refreshToken
        });
      }
    } finally {
      setSession(null);
      await clearAuthSession();
    }
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      initializing,
      login,
      register,
      logout,
      refreshSession
    }),
    [session, initializing, login, register, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};

