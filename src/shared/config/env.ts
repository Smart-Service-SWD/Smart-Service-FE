const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const apiBaseUrlRaw =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:5268";

export const API_BASE_URL = trimTrailingSlash(apiBaseUrlRaw);
export const GRAPHQL_URL =
  process.env.EXPO_PUBLIC_GRAPHQL_URL ?? `${API_BASE_URL}/graphql`;

