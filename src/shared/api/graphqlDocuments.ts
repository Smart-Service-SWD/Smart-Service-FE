export const HOME_BOOTSTRAP_QUERY = `
  query HomeBootstrap {
    getServiceCategories {
      id
      name
      description
    }
    getServiceDefinitions {
      id
      name
      description
      categoryName
      basePrice
      estimatedDuration
      isActive
      bookingCount
      complexityRange
      isDangerous
      createdAt
      updatedAt
    }
  }
`;

export const SERVICE_CATEGORIES_QUERY = `
  query ServiceCategories {
    getServiceCategories {
      id
      name
      description
    }
  }
`;

export const SERVICE_DEFINITIONS_QUERY = `
  query ServiceDefinitions {
    getServiceDefinitions {
      id
      name
      description
      categoryName
      basePrice
      estimatedDuration
      isActive
      bookingCount
      complexityRange
      isDangerous
      createdAt
      updatedAt
    }
  }
`;

export const SERVICE_DEFINITIONS_BY_CATEGORY_QUERY = `
  query ServiceDefinitionsByCategory($categoryId: UUID!) {
    getServiceDefinitionsByCategory(categoryId: $categoryId) {
      id
      name
      description
      categoryName
      basePrice
      estimatedDuration
      isActive
      bookingCount
      complexityRange
      isDangerous
      createdAt
      updatedAt
    }
  }
`;

export const ME_QUERY = `
  query Me {
    me {
      id
      email
      fullName
      phoneNumber
      role
      isLocked
    }
  }
`;

export const USER_BY_ID_QUERY = `
  query UserById($id: UUID!) {
    getUserById(id: $id) {
      id
      email
      fullName
      phoneNumber
      role
      isLocked
    }
  }
`;

export const MY_REQUESTS_QUERY = `
  query MyRequests($status: ServiceStatus) {
    getMyServiceRequests(status: $status) {
      id
      serviceDefinitionId
      description
      addressText
      status
      createdAt
      complexity {
        level
      }
      assignedProviderId
      estimatedCost {
        amount
        currency
      }
      estimatedPrice
      estimatedDuration
      ocrExtractedText
      wasAnalyzedByAI
    }
  }
`;

export const REQUEST_BY_ID_QUERY = `
  query RequestById($id: UUID!) {
    getServiceRequestById(id: $id) {
      id
      customerId
      categoryId
      serviceDefinitionId
      description
      addressText
      status
      createdAt
      complexity {
        level
      }
      assignedProviderId
      estimatedCost {
        amount
        currency
      }
      estimatedPrice
      estimatedDuration
      ocrExtractedText
      wasAnalyzedByAI
    }
  }
`;

export const REQUESTS_BY_STATUS_QUERY = `
  query RequestsByStatus($status: ServiceStatus!) {
    getServiceRequestsByStatus(status: $status) {
      id
      customerId
      categoryId
      serviceDefinitionId
      description
      addressText
      status
      createdAt
      complexity {
        level
      }
      assignedProviderId
      estimatedCost {
        amount
        currency
      }
      estimatedPrice
      estimatedDuration
      ocrExtractedText
      wasAnalyzedByAI
    }
  }
`;

export const ALL_REQUESTS_QUERY = `
  query AllRequests {
    getServiceRequests {
      id
      customerId
      categoryId
      serviceDefinitionId
      description
      addressText
      status
      createdAt
      complexity {
        level
      }
      assignedProviderId
      estimatedCost {
        amount
        currency
      }
      estimatedPrice
      estimatedDuration
      ocrExtractedText
      wasAnalyzedByAI
    }
  }
`;

export const AGENT_ASSIGNMENTS_QUERY = `
  query AgentAssignments($agentId: UUID!) {
    getAssignmentsByAgentId(agentId: $agentId) {
      id
      serviceRequestId
      agentId
      assignedAt
      estimatedCost {
        amount
        currency
      }
    }
  }
`;

export const ASSIGNMENTS_BY_REQUEST_QUERY = `
  query AssignmentsByRequest($serviceRequestId: UUID!) {
    getAssignmentsByServiceRequestId(serviceRequestId: $serviceRequestId) {
      id
      serviceRequestId
      agentId
      assignedAt
      estimatedCost {
        amount
        currency
      }
    }
  }
`;

export const SERVICE_AGENTS_QUERY = `
  query ServiceAgents {
    getServiceAgents {
      id
      userId
      fullName
      isActive
      capabilities {
        id
        categoryId
        maxComplexity {
          level
        }
        serviceIds
      }
    }
  }
`;

export const ACTIVE_SERVICE_AGENTS_QUERY = `
  query ActiveServiceAgents {
    getActiveServiceAgents {
      id
      fullName
      isActive
    }
  }
`;

export const MATCHING_RESULTS_BY_REQUEST_QUERY = `
  query MatchingByRequest($serviceRequestId: UUID!) {
    getMatchingResultsByServiceRequestId(serviceRequestId: $serviceRequestId) {
      id
      serviceRequestId
      serviceAgentId
      matchingScore
      isRecommended
      supportedComplexity {
        level
      }
    }
  }
`;

export const RECOMMENDED_MATCHES_QUERY = `
  query RecommendedMatches($serviceRequestId: UUID!) {
    getRecommendedMatches(serviceRequestId: $serviceRequestId) {
      id
      serviceRequestId
      serviceAgentId
      matchingScore
      isRecommended
      supportedComplexity {
        level
      }
    }
  }
`;

export const ADMIN_DASHBOARD_QUERY = `
  query AdminDashboard {
    getDashboardSummary {
      totalUsers
      totalStaff
      totalAgents
      totalServices
      totalRequests
      pendingRequests
      completedRequests
      todayRevenue
      monthlyRevenue
    }
  }
`;

export const USERS_QUERY = `
  query Users {
    getUsers {
      id
      email
      fullName
      phoneNumber
      role
      isLocked
    }
  }
`;

export const USERS_BY_ROLE_QUERY = `
  query UsersByRole($role: UserRole!) {
    getUsersByRole(role: $role) {
      id
      email
      fullName
      phoneNumber
      role
      isLocked
    }
  }
`;

export const MY_FEEDBACKS_QUERY = `
  query MyFeedbacks {
    getMyServiceFeedbacks {
      id
      serviceRequestId
      createdByUserId
      rating
      comment
      createdAt
    }
  }
`;

export const FEEDBACK_BY_REQUEST_QUERY = `
  query FeedbackByRequest($serviceRequestId: UUID!) {
    getFeedbackByServiceRequestId(serviceRequestId: $serviceRequestId) {
      id
      serviceRequestId
      createdByUserId
      rating
      comment
      createdAt
    }
    getAverageRatingByServiceRequestId(serviceRequestId: $serviceRequestId)
  }
`;

export const ACTIVITY_LOGS_QUERY = `
  query ActivityLogs {
    getActivityLogs {
      id
      serviceRequestId
      action
      createdAt
    }
  }
`;

export const ACTIVITY_LOGS_BY_REQUEST_QUERY = `
  query ActivityLogsByRequest($serviceRequestId: UUID!) {
    getActivityLogsByServiceRequestId(serviceRequestId: $serviceRequestId) {
      id
      serviceRequestId
      action
      createdAt
    }
  }
`;
