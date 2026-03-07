import type { AppRole } from "./auth";

export interface Money {
  amount: number;
  currency: string;
}

export interface ServiceComplexity {
  level: number;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: AppRole | string;
  isLocked: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string | null;
}

export interface ServiceDefinition {
  id: string;
  name: string;
  description?: string | null;
  categoryName: string;
  basePrice: number;
  estimatedDuration: number;
  isActive: boolean;
  bookingCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceRequestItem {
  id: string;
  customerId: string;
  categoryId?: string;
  description: string;
  addressText?: string | null;
  status: string;
  createdAt: string;
  complexity?: ServiceComplexity | null;
  assignedProviderId?: string | null;
  estimatedCost?: Money | null;
}

export interface AssignmentItem {
  id: string;
  serviceRequestId: string;
  agentId?: string;
  assignedAt: string;
  estimatedCost: Money;
}

export interface MatchingResultItem {
  id: string;
  serviceRequestId: string;
  serviceAgentId: string;
  supportedComplexity?: ServiceComplexity | null;
  matchingScore: number;
  isRecommended: boolean;
}

export interface ServiceAgentItem {
  id: string;
  userId?: string | null;
  fullName: string;
  isActive: boolean;
}

export interface ServiceFeedbackItem {
  id: string;
  serviceRequestId: string;
  createdByUserId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface ActivityLogItem {
  id: string;
  serviceRequestId: string;
  action: string;
  createdAt: string;
}
