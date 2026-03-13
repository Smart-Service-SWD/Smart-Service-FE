# FE Context Notes

Updated: 2026-03-09

Purpose: quick memory file for future AI/dev sessions working on `Service_FE`.

## Latest BE sync

- Latest BE merge checked:
  - `372715b` on 2026-03-08
  - merged fix branch for service request + evaluate complexity flow
- `POST /api/service-requests` changed again:
  - request now requires `serviceDefinitionId`
  - still accepts `multipart/form-data`
  - FE must send:
    - `customerId`
    - `categoryId`
    - `serviceDefinitionId`
    - `description`
    - optional `addressText`
    - optional `image`
- `PATCH /api/service-requests/{id}/evaluate-complexity` is now fixed:
  - BE no longer binds raw JSON directly into `ServiceComplexity`
  - payload shape is:
    - `complexity.level`
  - endpoint now returns `200 OK` with:
    - `serviceRequestId`
    - `complexityLevel`
    - `status`
- ServiceRequest domain changed:
  - request now stores `serviceDefinitionId`
  - `Evaluate()` now allows:
    - `Created`
    - `PendingReview`
  - `AssignProvider()` still only allows:
    - `PendingReview`
- Auth endpoints confirmed in BE:
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
  - `PUT /api/auth/change-password`
- Agent creation contract still requires `capabilities[]` with:
  - `categoryId`
  - `maxComplexityLevel`
  - `serviceIds`

## FE changes already applied

### Customer create-request flow

- FE create-request screen now loads service definitions by selected category.
- Customer must choose one concrete service before submit.
- FE create request payload now includes `serviceDefinitionId`.
- FE create button is now disabled until:
  - category is selected
  - service is selected
  - description is filled
- Optional attachment metadata on the same screen is now tied to the request just created:
  - FE no longer asks customer to paste request ID manually there
- FE still uses only the main create endpoint:
  - `POST /api/service-requests`
- FE create success UI still shows BE AI result fields:
  - urgency
  - diagnosis
  - safety advice
  - estimated price
  - estimated duration
  - danger flag

### Request data / GraphQL

- FE request GraphQL queries now also fetch `serviceDefinitionId`.
- FE request domain type now includes `serviceDefinitionId`.
- Staff dispatch screen uses that field to preselect the service the customer originally chose.
- Customer `My Requests` detail no longer requires pasting request ID:
  - user taps a request card
  - FE auto-loads detail/logs/feedback for that request

### Customer feedback flow

- Feedback screen no longer asks customer to paste request ID manually.
- FE now loads completed requests and lets customer pick one request card to rate.
- Navigation from `My Requests` to `Feedback` still preselects the request when possible.

### Agent flows

- Agent assignment screen no longer requires manual request ID input:
  - agent taps an assignment card
  - FE auto-loads request detail
- Agent request board no longer requires manual request ID input:
  - agent taps a request card
  - FE auto-loads assignment + matching data for that request
- Agent can now bật/tắt trạng thái nhận việc mới ngay trên màn `Công việc của tôi`.
- Khi `isActive = false`, staff dispatch FE không còn hiện thợ đó trong danh sách phân công mới.

### Staff dispatch flow

- Dispatch Center still remains the main mobile staff screen.
- Dispatch flow now reflects current BE behavior more accurately:
  - can evaluate complexity when request is `Created`
  - can reevaluate complexity when request is already `PendingReview`
  - can assign provider only when request is `PendingReview`
- Urgent requests are still visible in FE, but BE still does not provide a clean staff action path from `UrgentDispatch` to assignment.

### Profile / account flow

- FE profile screen no longer depends only on GraphQL `me`.
- Profile load order is now:
  - try `me`
  - if `me` is `null` or query fails, fallback to `getUserById(session.userId)`
  - if both fail, keep showing basic info already stored in auth session
- This fixes the case where customer profile screen showed:
  - empty full name
  - empty phone number
  - while login/session data was still valid

### Staff visibility sync

- Staff review queue now shows:
  - customer full name
  - assigned technician name
- Staff dispatch screen now shows:
  - customer full name
  - assigned technician name
  - request address text
- Staff screens now hydrate customer names from `getUsers`.
- Staff screens still hydrate technician names from `getServiceAgents`.

### Agent visibility sync

- Agent assignment detail now loads customer profile via `getUserById(customerId)`.
- Agent request board now also loads customer profile for the selected request.
- Agent can now see:
  - customer full name
  - customer phone number
  - customer address
- This was added because request read models already expose:
  - `customerId`
  - `addressText`
  - but not embedded customer contact info

### ServiceDefinition / admin flow

- FE still requests and displays:
  - `complexityRange`
  - `isDangerous`
- FE admin screen still sends those fields on create and update.
- FE admin screen now shows a warning that BE update for existing services still does not persist those 2 fields.

## Current BE limits still open

- `PUT /api/services/{id}` still ignores:
  - `complexityRange`
  - `isDangerous`
- Why:
  - BE command supports both fields
  - but BE controller request model and mapping still do not pass them through
- Consequence:
  - create service flow can save those fields
  - update service flow may look successful in FE, but DB may keep old values

- Full AI analysis is still not fully reloadable from request detail in FE:
  - request read models expose:
    - `estimatedPrice`
    - `estimatedDuration`
    - `ocrExtractedText`
    - `wasAnalyzedByAI`
  - but FE still cannot reload full analysis fields from request detail because current read models do not expose:
    - `summary`
    - `problemDiagnosis`
    - `riskExplanation`
    - `safetyAdvice`

- Agent execution actions are still limited by BE:
  - FE can show assignments
  - no clear start / progress / complete REST actions were found during audit

- GraphQL `me` may still be unreliable in some environments:
  - FE now has a fallback to `getUserById(session.userId)`
  - but if profile data still looks wrong after login, BE auth / GraphQL user context should still be checked

## Files touched in FE for the 2026-03-08 sync

- `src/features/customer/api/customerApi.ts`
- `src/features/customer/screens/CreateRequestScreen.tsx`
- `src/features/staff/screens/DispatchCenterScreen.tsx`
- `src/shared/api/graphqlDocuments.ts`
- `src/shared/types/domain.ts`
- `src/features/admin/screens/ServiceAdminScreen.tsx`

## Files touched in FE for the 2026-03-09 sync

- `src/shared/api/graphqlDocuments.ts`
- `src/features/common/screens/ProfileScreen.tsx`
- `src/features/staff/screens/ReviewQueueScreen.tsx`
- `src/features/staff/screens/DispatchCenterScreen.tsx`
- `src/features/agent/screens/AssignmentsScreen.tsx`
- `src/features/agent/screens/AgentRequestBoardScreen.tsx`

## Validation already done

- `npm run typecheck` passed on 2026-03-08 after FE contract updates.
- `npm run typecheck` passed on 2026-03-09 after profile + staff/agent visibility updates.

## Quick manual FE smoke test

### Customer

- Login as customer.
- Open `Tạo yêu cầu dịch vụ`.
- Select category.
- Confirm FE loads service list for that category.
- Select one service.
- Enter description.
- Optional:
  - enter address
  - attach image for OCR
- Submit.
- Expected:
  - request creates successfully
  - success card shows AI fields if BE analysis succeeds
  - no BE validation error for missing `serviceDefinitionId`

### Customer request history

- Open `Yêu cầu của tôi`.
- Open the newly created request.
- Expected:
  - request is visible
  - request still shows AI estimate fields exposed by GraphQL

### Staff dispatch

- Login as staff.
- Open `Yêu cầu` then go to `Điều phối`.
- Select the newly created request.
- Expected:
  - if request is `Created`, FE allows evaluating complexity
  - if request is `PendingReview`, FE allows reevaluating complexity
  - FE preselects the original service when `serviceDefinitionId` is available
  - FE shows customer full name
  - FE shows assigned technician name if any
  - FE shows request address in dispatch context
- Choose technician.
- Create matching result.
- Assign provider.
- Expected:
  - assignment only works when request status is `PendingReview`

### Profile fallback

- Login as customer.
- Open `Tài khoản`.
- Expected:
  - full name and phone number load from `me` when available
  - if `me` is broken/null, FE still reloads them from `getUserById(session.userId)`
  - page should no longer show only `-` for profile fields in the common failure case

### Agent customer info

- Login as agent.
- Open `Công việc của tôi`.
- Select one assignment.
- Expected:
  - FE shows customer name
  - FE shows customer phone number
  - FE shows address
- Open `Bảng yêu cầu`.
- Select one request.
- Expected:
  - FE shows customer name
  - FE shows customer phone number
  - FE shows address

### Admin service warning

- Login as admin.
- Open service admin screen.
- Select an existing service.
- Change `complexityRange` or `isDangerous`.
- Expected:
  - FE shows warning that BE may not persist these 2 fields on update

## Files to mention back to BE if needed

- FE sends update payload from:
  - `src/features/admin/api/adminApi.ts`
  - `src/features/admin/screens/ServiceAdminScreen.tsx`
- BE issue still appears to be in:
  - `../Service_BE/SmartService.WebAPI/Controllers/ServicesController.cs`
  - `../Service_BE/SmartService.Application/Features/Services/Commands/UpdateServiceDefinition/UpdateServiceDefinitionCommand.cs`
