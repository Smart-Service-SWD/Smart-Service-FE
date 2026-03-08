import { Platform } from "react-native";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const API_PORT = 5268;
const DEFAULT_API_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

export const KNOWN_API_HOSTS_FROM_GIT_HISTORY = [
  "10.0.2.2",
  "10.0.2.16",
  "10.253.155.221",
  "10.60.23.255",
  "10.87.25.38",
  "172.20.10.4",
  "192.168.123.6",
  "192.168.1.14",
  "192.168.1.26",
  "192.168.1.100",
  "192.168.1.101",
  "192.168.1.102",
  "192.168.1.103",
  "192.168.123.188",
  "192.168.123.189",
] as const;

export const KNOWN_API_BASE_URLS = [
  `http://localhost:${API_PORT}`,
  ...KNOWN_API_HOSTS_FROM_GIT_HISTORY.map((host) => `http://${host}:${API_PORT}`),
];

const apiBaseUrlRaw =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  `http://${DEFAULT_API_HOST}:${API_PORT}`;

export const API_BASE_URL = trimTrailingSlash(apiBaseUrlRaw);
export const GRAPHQL_URL =
  process.env.EXPO_PUBLIC_GRAPHQL_URL ?? `${API_BASE_URL}/graphql`;
