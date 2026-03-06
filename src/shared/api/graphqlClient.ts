import { GRAPHQL_URL } from "../config/env";
import { ApiError } from "./httpClient";

interface GraphQLErrorItem {
  message: string;
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLErrorItem[];
}

export const graphqlRequest = async <TData, TVariables = undefined>(
  query: string,
  variables?: TVariables,
  token?: string
): Promise<TData> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      variables
    })
  });

  const payload = (await response.json()) as GraphQLResponse<TData>;

  if (!response.ok) {
    throw new ApiError(`GraphQL request failed (${response.status})`, response.status);
  }

  if (payload.errors && payload.errors.length > 0) {
    throw new Error(payload.errors[0].message);
  }

  if (!payload.data) {
    throw new Error("GraphQL response does not contain data");
  }

  return payload.data;
};

