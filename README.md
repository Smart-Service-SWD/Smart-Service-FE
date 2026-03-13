# Smart Service Mobile

Frontend mobile rebuilt and connected to BE flow in `Service_BE`.

Architecture follows BE guidance:

- REST (`/api/*`) for command/write actions
- GraphQL (`/graphql`) for read/query actions
- JWT auth + refresh token
- Role routing: `CUSTOMER`, `AGENT`, `STAFF`, `ADMIN`

## Setup

```bash
npm install
npm run typecheck
npm run start
```

## Env

Copy `.env.example` to `.env` and configure:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5268
EXPO_PUBLIC_GRAPHQL_URL=http://localhost:5268/graphql
```

Examples:

- iOS simulator: `http://localhost:5268`
- Android emulator: `http://10.0.2.2:5268`
- Physical device: `http://<lan-ip>:5268`

## Implemented Role Flows

### Customer

- Home catalog:
  - `getServiceCategories`
  - `getServiceDefinitions`
  - `getActiveServiceAgents`
- Create request flow:
  - AI analyze: `POST /api/service-analysis`
  - Create request: `POST /api/service-requests`
  - Add attachment: `POST /api/service-attachments`
- My requests:
  - `getMyServiceRequests`
  - `getServiceRequestById`
  - `getFeedbackByServiceRequestId`
  - `getAverageRatingByServiceRequestId`
- Feedback:
  - `POST /api/service-feedbacks`
  - `getMyServiceFeedbacks`

### Agent

- Assignments:
  - `getAssignmentsByAgentId`
  - request detail lookup: `getServiceRequestById`
- Request board:
  - `getServiceRequests`
  - `getAssignmentsByServiceRequestId`
  - `getMatchingResultsByServiceRequestId`

### Staff

- Review queue:
  - `getServiceRequestsByStatus`
  - Evaluate complexity: `PATCH /api/service-requests/{id}/evaluate-complexity`
  - Activity log: `POST /api/activity-logs`
- Dispatch center:
  - `getServiceAgents`
  - `getMatchingResultsByServiceRequestId`
  - `getRecommendedMatches`
  - `getAssignmentsByServiceRequestId`
  - Create matching: `POST /api/matching-results`
  - Assign provider: `PATCH /api/service-requests/{id}/assign-provider`
  - Create assignment: `POST /api/assignments`
- Activity monitor:
  - `getActivityLogs`
  - `getActivityLogsByServiceRequestId`

### Admin

- Dashboard:
  - `getDashboardSummary`
  - `getUsersByRole`
- User admin:
  - `getUsers`
  - Create user: `POST /api/users/customers|agents|staff`
  - Update role: `PATCH /api/auth/users/{id}/role`
  - Lock/unlock: `PATCH /api/auth/users/{id}/lock`
- Service admin:
  - `getServiceCategories`
  - `getServiceDefinitions`
  - Create category: `POST /api/service-categories`
  - Service CRUD: `POST/PUT/DELETE /api/services`

### Common (all roles)

- Profile:
  - `me`
  - `PUT /api/auth/profile`
  - `POST /api/auth/change-password`
  - `POST /api/auth/refresh-token`
  - `POST /api/auth/logout`

## Folder Structure

```text
src/
  app/
    navigation/
    theme/
  features/
    auth/
    customer/
    agent/
    staff/
    admin/
    common/
  shared/
    api/
    config/
    storage/
    types/
    ui/
    utils/
```
