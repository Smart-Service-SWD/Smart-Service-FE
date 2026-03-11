import { Platform } from "react-native";

/**
 * Remove trailing slash from URL
 */
const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

/**
 * Backend port
 */
const API_PORT = 5268;

/**
 * Default API host
 * Android emulator: 10.0.2.2
 * Physical device / iOS / web: use LAN IP
 */
const DEFAULT_API_HOST =
  Platform.OS === "android" ? "10.0.2.2" : "192.168.1.14";

/**
 * Known API hosts from project history
 */
export const KNOWN_API_HOSTS_FROM_GIT_HISTORY = [
  "localhost",
  "127.0.0.1",
  "10.0.2.2",
  "192.168.1.14",
  "192.168.1.26",
  "192.168.1.100",
  "192.168.1.101",
  "192.168.1.102",
  "192.168.1.103",
  "192.168.123.6",
  "192.168.123.188",
  "192.168.123.189",
  "172.20.10.4",
] as const;

/**
 * Generate base URLs
 */
export const KNOWN_API_BASE_URLS = [
  `http://localhost:${API_PORT}`,
  ...KNOWN_API_HOSTS_FROM_GIT_HISTORY.map(
    (host) => `http://${host}:${API_PORT}`
  ),
];

/**
 * API base URL
 */
const apiBaseUrlRaw =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  `http://${DEFAULT_API_HOST}:${API_PORT}`;

export const API_BASE_URL = trimTrailingSlash(apiBaseUrlRaw);

/**
 * GraphQL endpoint
 */
export const GRAPHQL_URL =
  process.env.EXPO_PUBLIC_GRAPHQL_URL ??
  `${API_BASE_URL}/graphql`;

/**
 * Debug info
 */
export const ENV_INFO = {
  API_BASE_URL,
  GRAPHQL_URL,
  PLATFORM: Platform.OS,
};

console.log("ENV_INFO:", ENV_INFO);