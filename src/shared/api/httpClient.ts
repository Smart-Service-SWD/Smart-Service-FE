import { API_BASE_URL } from "../config/env";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiError extends Error {
  readonly status: number;
  readonly errorCode?: string;
  readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    errorCode?: string,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

interface RequestOptions {
  path: string;
  method?: HttpMethod;
  token?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

const buildUrl = (path: string): string => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const parseBody = async (response: Response): Promise<unknown> => {
  const raw = await response.text();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

const extractErrorMessage = (payload: unknown, fallback: string): string => {
  if (!payload) {
    return fallback;
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload === "object") {
    const candidate = payload as Record<string, unknown>;
    if (
      Array.isArray(candidate.details) &&
      candidate.details.length > 0 &&
      typeof candidate.message === "string" &&
      candidate.message === "Validation failed."
    ) {
      const firstDetail = candidate.details[0];
      if (
        typeof firstDetail === "object" &&
        firstDetail !== null &&
        typeof (firstDetail as Record<string, unknown>).errorMessage === "string"
      ) {
        return (firstDetail as Record<string, string>).errorMessage;
      }
    }
    if (typeof candidate.message === "string") {
      return candidate.message;
    }
    if (typeof candidate.title === "string") {
      return candidate.title;
    }
  }

  return fallback;
};

export const httpRequest = async <T>({
  path,
  method = "GET",
  token,
  body,
  headers
}: RequestOptions): Promise<T> => {
  const isFormDataBody =
    typeof FormData !== "undefined" && body instanceof FormData;
  const requestHeaders: Record<string, string> = {
    ...headers
  };

  if (!isFormDataBody && !requestHeaders["Content-Type"]) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers: requestHeaders,
    body:
      body === undefined
        ? undefined
        : isFormDataBody
          ? body
          : JSON.stringify(body)
  });

  const payload = await parseBody(response);

  if (!response.ok) {
    const message = extractErrorMessage(
      payload,
      `Request failed (${response.status})`
    );
    const errorPayload =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : undefined;

    throw new ApiError(
      message,
      response.status,
      typeof errorPayload?.errorCode === "string" ? errorPayload.errorCode : undefined,
      errorPayload?.details
    );
  }

  return payload as T;
};
