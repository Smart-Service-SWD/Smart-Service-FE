import graphqlClient from './graphqlClient';
import { staffGraphqlService } from './staffGraphqlService';

export interface AgentStats {
  pendingAssignments: number;
  activeJobs: number;
  completedToday: number;
  earnings: number;
}

export interface Assignment {
  id: string;
  serviceRequestId: string;
  agentId: string;
  estimatedCost?: {
    amount: number;
    currency: string;
  };
  assignedAt: string;
}

export interface AssignmentWithRequest extends Assignment {
  requestDetail?: {
    id: string;
    description?: string | null;
    addressText?: string | null;
    status: string;
    complexity?: { level: number };
    estimatedCost?: {
      amount: number;
      currency: string;
    } | null;
    createdAt: string;
  } | null;
}

const ASSIGNMENTS_QUERY = `
  query GetAssignmentsByAgentId($agentId: UUID!) {
    getAssignmentsByAgentId(agentId: $agentId) {
      id
      serviceRequestId
      agentId
      estimatedCost {
        amount
        currency
      }
      assignedAt
    }
  }
`;

const ensureGraphQLError = (payload: any) => {
  if (payload?.errors?.length) {
    throw new Error(payload.errors[0]?.message || 'GraphQL Error');
  }
};

const isActiveRequestStatus = (status?: string) =>
  status === 'ASSIGNED' || status === 'IN_PROGRESS' || status === 'APPROVED';

export const agentGraphqlService = {
  getAssignments: async (agentId: string): Promise<Assignment[]> => {
    const { data } = await graphqlClient.post('', {
      query: ASSIGNMENTS_QUERY,
      variables: { agentId },
    });
    ensureGraphQLError(data);
    return data?.data?.getAssignmentsByAgentId ?? [];
  },

  getAssignmentsWithRequestDetail: async (agentId: string): Promise<AssignmentWithRequest[]> => {
    const assignments = await agentGraphqlService.getAssignments(agentId);
    const requestDetails = await Promise.all(
      assignments.map(async assignment => {
        try {
          return await staffGraphqlService.getRequestDetail(assignment.serviceRequestId);
        } catch {
          return null;
        }
      })
    );

    return assignments.map((assignment, index) => ({
      ...assignment,
      requestDetail: requestDetails[index],
    }));
  },

  getAgentStats: async (agentId: string): Promise<AgentStats> => {
    const assignments = await agentGraphqlService.getAssignmentsWithRequestDetail(agentId);

    const pendingAssignments = assignments.filter(a => {
      const status = a.requestDetail?.status;
      return status === 'ASSIGNED' || status === 'PENDING_REVIEW' || status === 'CREATED';
    }).length;

    const activeJobs = assignments.filter(a => isActiveRequestStatus(a.requestDetail?.status)).length;

    const today = new Date();
    const completedToday = assignments.filter(a => {
      const created = a.requestDetail?.createdAt ? new Date(a.requestDetail.createdAt) : null;
      return (
        a.requestDetail?.status === 'COMPLETED' &&
        created &&
        created.getFullYear() === today.getFullYear() &&
        created.getMonth() === today.getMonth() &&
        created.getDate() === today.getDate()
      );
    }).length;

    const earnings = assignments
      .filter(a => a.requestDetail?.status === 'COMPLETED')
      .reduce((sum, a) => sum + Number(a.estimatedCost?.amount ?? 0), 0);

    return {
      pendingAssignments,
      activeJobs,
      completedToday,
      earnings,
    };
  },
};
