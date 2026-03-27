import { API_BASE_URL } from "../config/env";

const LOCAL_SCHEME_PREFIX = "local://";

export const resolveImageUrl = (value?: string | null): string | null => {
  if (!value) return null;

  const normalized = value.trim();
  if (!normalized) return null;

  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("file://") ||
    normalized.startsWith("content://") ||
    normalized.startsWith("data:")
  ) {
    return normalized;
  }

  if (normalized.startsWith(LOCAL_SCHEME_PREFIX)) {
    return null;
  }

  const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `${API_BASE_URL}${path}`;
};
