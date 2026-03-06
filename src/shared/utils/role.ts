import type { AppRole } from "../types/auth";

const numberRoleMap: Record<number, AppRole> = {
  0: "CUSTOMER",
  1: "STAFF",
  2: "AGENT",
  3: "ADMIN"
};

const stringRoleMap: Record<string, AppRole> = {
  CUSTOMER: "CUSTOMER",
  STAFF: "STAFF",
  AGENT: "AGENT",
  ADMIN: "ADMIN",
  CUSTOMERS: "CUSTOMER"
};

export const normalizeRole = (input: unknown): AppRole => {
  if (typeof input === "number" && numberRoleMap[input] !== undefined) {
    return numberRoleMap[input];
  }

  if (typeof input === "string") {
    const normalized = input.replace(/[\s-]+/g, "_").toUpperCase();
    if (stringRoleMap[normalized] !== undefined) {
      return stringRoleMap[normalized];
    }
  }

  return "CUSTOMER";
};

