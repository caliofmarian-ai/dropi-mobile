# DROPi Mobile — Test Registry

Cumulative record of all test lists generated per feature/update.
See `/docs/BLUEPRINT_TESTING_REQUIREMENTS.md` for the testing standard.

---

## Sprint E — B2B Logistic API (Retroactive)

### Tests for: API Key Management

#### Unit Tests (Server)
- [ ] `apiKey.generate` creates a key with SHA-256 hash stored in DB
- [ ] `apiKey.generate` returns the raw key only once (not stored)
- [ ] `apiKey.generate` enforces unique key prefix per store
- [ ] `apiKey.revoke` sets isActive=false and records revokedAt
- [ ] `apiKey.list` returns only keys belonging to the authenticated user's store
- [ ] `apiKey.list` never exposes the full key hash

#### Authorization Tests
- [ ] Only store owners can generate/revoke API keys
- [ ] Non-authenticated users get 401
- [ ] Users cannot access other stores' keys

#### Edge Cases
- [ ] Generating key when store doesn't exist returns error
- [ ] Revoking already-revoked key is idempotent
- [ ] Rate limit field validates range 10-1000

---

### Tests for: B2B Delivery Endpoints

#### Unit Tests (Server)
- [ ] `b2bDelivery.request` creates delivery with status "pending"
- [ ] `b2bDelivery.request` generates unique tracking code
- [ ] `b2bDelivery.getStatus` returns correct delivery by tracking code
- [ ] `b2bDelivery.cancel` only works for pending/assigned deliveries
- [ ] `b2bDelivery.cancel` fails for in_transit/delivered deliveries
- [ ] `b2bDelivery.estimate` calculates price based on distance and weight
- [ ] `b2bDelivery.list` paginates correctly with limit/offset

#### Integration Tests
- [ ] Creating a delivery triggers webhook to registered endpoints
- [ ] Cancelling a delivery triggers "delivery.cancelled" webhook event
- [ ] Status update fires webhook with correct payload and HMAC signature

#### Edge Cases
- [ ] Request with missing pickup address returns validation error
- [ ] Request with weight exceeding max returns appropriate error
- [ ] Concurrent delivery requests don't generate duplicate tracking codes

---

### Tests for: Webhook System

#### Unit Tests (Server)
- [ ] `webhook.register` creates endpoint with HMAC secret
- [ ] `webhook.register` validates URL format
- [ ] `webhook.test` sends test payload and records result
- [ ] `webhook.delete` removes endpoint and associated logs
- [ ] `webhook.logs` returns delivery attempts for the endpoint
- [ ] `webhook.retry` re-sends failed webhook with fresh signature

#### Integration Tests
- [ ] Webhook fires on delivery status change with correct event type
- [ ] HMAC-SHA256 signature in X-DROPi-Signature header is verifiable
- [ ] Failed webhook increments failureCount
- [ ] Webhook auto-deactivates after 10 consecutive failures
- [ ] Retry resets failureCount on success

#### Edge Cases
- [ ] Webhook to unreachable URL times out gracefully (5s)
- [ ] Webhook with invalid secret still logs the attempt
- [ ] Registering duplicate URL for same store returns error

---

### Tests for: REST API Gateway (/api/v1/)

#### Unit Tests (Server)
- [ ] `GET /api/v1/health` returns 200 with status "ok"
- [ ] `POST /api/v1/deliveries` creates delivery with valid API key
- [ ] `GET /api/v1/deliveries/:id` returns delivery details
- [ ] `GET /api/v1/deliveries/:id/track` returns tracking info
- [ ] `POST /api/v1/deliveries/:id/cancel` cancels pending delivery
- [ ] `POST /api/v1/estimate` returns price estimate
- [ ] `GET /api/v1/deliveries` lists deliveries with pagination

#### Authorization Tests
- [ ] Missing X-DROPi-API-Key header returns 401
- [ ] Invalid API key returns 401 with "Invalid API key" message
- [ ] Revoked API key returns 401
- [ ] Expired API key returns 401
- [ ] Rate-limited key returns 429 with retry-after header

#### Request Logging Tests
- [ ] Every API call creates entry in apiRequestLogs
- [ ] Log captures endpoint, method, statusCode, responseTimeMs
- [ ] Log captures request IP and user agent
- [ ] lastUsedAt on apiKey is updated on each call

---

## Sprint E+ — Analytics, Pilot Flow, Webhook Retry (Retroactive)

### Tests for: API Analytics

#### Unit Tests (Server)
- [ ] `apiAnalytics.summary` returns correct total request count
- [ ] `apiAnalytics.summary` calculates error rate (4xx+5xx / total)
- [ ] `apiAnalytics.summary` computes average response time
- [ ] `apiAnalytics.summary` returns daily breakdown for last 30 days
- [ ] `apiAnalytics.summary` identifies top endpoints by call count

#### Edge Cases
- [ ] Analytics with no data returns zeroes, not errors
- [ ] Analytics for store with no API keys returns empty summary

---

### Tests for: Pilot Status Update Flow

#### Unit Tests (Server)
- [ ] `pilotUpdateStatus` validates forward-only transitions
- [ ] `pilotUpdateStatus` rejects backward transitions (delivered→in_transit)
- [ ] `pilotUpdateStatus` triggers webhooks on status change
- [ ] `pilotUpdateStatus` notifies store owner on completion/failure

#### Authorization Tests
- [ ] Only delivery_partner role can call pilotUpdateStatus
- [ ] Pilot can only update deliveries assigned to them

#### Integration Tests
- [ ] Full flow: assigned→pickup_enroute→picked_up→in_transit→delivered
- [ ] Each transition fires correct webhook event
- [ ] Rating recalculation triggers on delivered/failed

---

## Pilot Selection System (Retroactive)

### Tests for: Rating Engine

#### Unit Tests
- [ ] `recalculateRating` computes weighted average correctly (40/25/25/10)
- [ ] `recalculateRating` clamps result between 0.00 and 5.00
- [ ] `recalculateRating` creates history entry with previous/new rating
- [ ] `ensurePilotProfile` creates profile if none exists
- [ ] `ensurePilotProfile` returns existing profile ID if already exists

#### Edge Cases
- [ ] Rating with 0 deliveries uses default values
- [ ] Rating with all perfect scores returns 5.00
- [ ] Rating with all failures returns minimum (not negative)

---

### Tests for: Automatic Selection (C1)

#### Unit Tests
- [ ] `getAutoSelectedPilot` returns highest-scoring available pilot
- [ ] Scoring formula: proximity 30% + rating 30% + completion 25% + rotation 15%
- [ ] Only available pilots (isAvailable=true) are considered
- [ ] Rotation factor penalizes recently-assigned pilots (last 24h)

#### Edge Cases
- [ ] No available pilots returns null/empty
- [ ] All pilots at same location — rating breaks tie
- [ ] Pilot with 0 deliveries gets neutral rotation score

---

### Tests for: Manual Selection (C2/C3)

#### Unit Tests
- [ ] `getEligiblePilotsForCOS` returns only pilots with rating >= 4.00
- [ ] `getEligiblePilotsForCOS` returns only cosEligible=true pilots
- [ ] `assignPilotManual` succeeds for eligible pilot
- [ ] `assignPilotManual` fails for pilot below rating threshold
- [ ] `assignPilotManual` creates audit log entry

#### Authorization Tests
- [ ] Only COS roles (operations_manager, fleet_manager, etc.) can access
- [ ] Marketplace roles (customer, delivery_partner) get 403
- [ ] Audit log records operator role and channel

---

### Tests for: Rating Recalculation Hooks

#### Unit Tests
- [ ] `onB2bDeliveryCompleted` increments totalDeliveries and recalculates
- [ ] `onB2bDeliveryFailed` increments totalFailed and recalculates
- [ ] `onCustomerReviewSubmitted` updates customerRating component
- [ ] `onIncidentReported` updates incidentRate component
- [ ] `periodicRatingRecalculation` processes all active pilots

#### Integration Tests
- [ ] Delivery completion in b2b-router triggers rating hook
- [ ] Rating change triggers COS eligibility re-evaluation
- [ ] Admin adjustment creates proper audit trail

---

### Tests for: Pilot Leaderboard Screen

#### Unit Tests (Server)
- [ ] `getLeaderboard` returns paginated results with correct limit/offset
- [ ] `getLeaderboard` filters by minDeliveries threshold correctly
- [ ] `getLeaderboard` returns rank starting from offset+1
- [ ] `getLeaderboard` returns empty array when no pilots exist
- [ ] `getLeaderboard` only includes active users (isActive=true)

#### Unit Tests (UI)
- [ ] Leaderboard screen renders without crash
- [ ] Zone filter buttons display all 5 zones + "All"
- [ ] Sort selector shows 4 options (Rating, Completion, Deliveries, On-Time)
- [ ] Rank badges show correct colors (gold #1, silver #2, bronze #3)
- [ ] COS eligibility badge appears only for eligible pilots
- [ ] Performance metrics display with correct formatting (%.1f)
- [ ] Empty state shows "No pilots found" message

#### Integration Tests
- [ ] Changing zone filter updates displayed pilots
- [ ] Changing sort order re-sorts the list correctly
- [ ] Pull-to-refresh triggers data refetch
- [ ] Loading state shows spinner during fetch

#### Edge Cases
- [ ] Handles null/undefined rating values gracefully (parseFloat fallback)
- [ ] Handles pilots with 0 deliveries
- [ ] Handles very long pilot names (text truncation)
- [ ] Handles network failure with error state

---

*Registry updated: 2026-06-28*
