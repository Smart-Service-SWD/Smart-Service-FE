import { Platform } from "react-native";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const API_PORT = 5268;

// Keep the export name stable because other local tooling may already use it.
export const KNOWN_API_HOSTS_FROM_GIT_HISTORY = [
  "localhost",
  "127.0.0.1",
  "10.0.2.2"
] as const;

export const KNOWN_API_BASE_URLS = KNOWN_API_HOSTS_FROM_GIT_HISTORY.map(
  (host) => `http://${host}:${API_PORT}`
);

// Shared fallback for the whole team:
// - Android emulator reaches the host machine through 10.0.2.2
// - iOS simulator / web / desktop use localhost
// Real devices should set EXPO_PUBLIC_API_BASE_URL in .env.local
const DEFAULT_API_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

const apiBaseUrlRaw =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  `http://${DEFAULT_API_HOST}:${API_PORT}`;

const graphqlUrlRaw =
  process.env.EXPO_PUBLIC_GRAPHQL_URL ??
  `${trimTrailingSlash(apiBaseUrlRaw)}/graphql`;

export const API_BASE_URL = trimTrailingSlash(apiBaseUrlRaw);
export const GRAPHQL_URL = trimTrailingSlash(graphqlUrlRaw);

export const ENV_INFO = {
  API_BASE_URL,
  GRAPHQL_URL,
  PLATFORM: Platform.OS
};

if (__DEV__) {
  console.log("ENV_INFO:", ENV_INFO);
}
