# DROPi Mobile App — TODO

## Phase 1 (Completed - Basic)
- [x] Theme configuration (DROPi brand colors)
- [x] Basic authentication system
- [x] Basic role routing (4 roles)
- [x] App logo generation

## Phase 2 - Full Canonical Rebuild
- [x] Channel Selector screen (C1, C2, C3, Admin)
- [x] Complete RBAC with all 29 agent types
- [x] C1 Marketplace: Customer Dashboard
- [x] C1 Marketplace: Merchant Dashboard
- [x] C1 Marketplace: Delivery Partner (Pilot) Dashboard
- [x] C1 Marketplace: Support Agent Dashboard
- [x] C1 Marketplace: Analyst Dashboard
- [x] C1 Marketplace: Compliance Officer Dashboard
- [x] C1 Marketplace: Fraud Detection Dashboard
- [x] C1 Marketplace: Performance Monitor Dashboard
- [x] C1 Marketplace: Incident Responder Dashboard
- [x] C2 COS: Operations Manager Dashboard
- [x] C2 COS: Logistics Coordinator Dashboard
- [x] C2 COS: Fleet Manager Dashboard
- [x] C2 COS: Compliance Officer Dashboard
- [x] C2 COS: Performance Monitor Dashboard
- [x] C2 COS: Incident Responder Dashboard
- [x] C2 COS: Data Analyst Dashboard
- [x] C2 COS: Quality Assurance Dashboard
- [x] C3 EOC: Emergency Coordinator Dashboard
- [x] C3 EOC: Dispatch Manager Dashboard
- [x] C3 EOC: Resource Allocator Dashboard
- [x] C3 EOC: Communication Officer Dashboard
- [x] C3 EOC: Data Analyst Dashboard
- [x] C3 EOC: Incident Commander Dashboard
- [x] Admin: System Administrator Dashboard
- [x] Admin: Security Officer Dashboard
- [x] Admin: Audit Manager Dashboard
- [x] Admin: Configuration Manager Dashboard
- [x] Admin: Analytics Manager Dashboard
- [x] Admin: Support Coordinator Dashboard
- [x] DronePort Management Module
- [x] Authorities Interface Module
- [x] Accounting Module
- [x] Audit Core (complete logging)
- [x] Admin Phantom Mode (login as any user)

## Phase 3 - Marketplace & Multimodal Delivery Integration
- [x] Marketplace module: Product catalog with categories
- [x] Marketplace module: Merchant store pages
- [x] Marketplace module: Product detail with delivery badges (drone/terrestrial/multimodal)
- [x] Marketplace module: Shopping cart
- [x] Marketplace module: Checkout flow with delivery mode selection
- [x] Marketplace module: Zone-based product visibility
- [x] Delivery badges: Drone eligible indicator
- [x] Delivery badges: Terrestrial eligible indicator
- [x] Delivery badges: Multimodal eligible indicator
- [x] Delivery mode selection: Drone (with tutorial + conditions acceptance)
- [x] Delivery mode selection: Auto/Van/E-bike (terrestrial)
- [x] Delivery mode selection: DronePort buffer (staged delivery)
- [x] Connect marketplace orders to operational flow (validated → preparing → ready → dispatch)
- [x] Pilot types: Drone pilot vs Terrestrial driver distinction
- [x] Fallback mechanism: Drone → Terrestrial when conditions change
- [x] DronePort as transfer hub in multimodal flow
- [x] Participant types: Authorized merchant, Artisan, P2P user, Community seller
- [x] Trust & reputation badges on seller profiles
- [x] Eligibility engine: Product weight/size/category → available delivery modes

## Phase 4 - Multimodal Auxiliary Modules Update
- [x] DronePort → Rețea Logistică (drone + vehicule + transfer hubs)
- [x] Authorities → Conformitate aeriană + terestră (permise multimodale)
- [x] Accounting → Costuri per mod de livrare (drone vs auto vs van vs ebike vs multimodal)

## Future Enhancements
- [x] Real map integration (canvas-based + react-native-maps for native)
- [ ] Push notifications for order status changes
- [ ] Real-time WebSocket connections for live data
- [ ] Backend API integration (replace mock data with real DB)
- [ ] Biometric authentication (Face ID / Fingerprint)
- [ ] Offline mode with data sync

## Canonical Documents (PERMANENT)
- [x] canonical/AI_AGENT_SYSTEM.md — Sistem dual Cont Uman + Agent AI
- [x] canonical/DELIVERY_MULTIMODAL.md — Referință livrare multimodală
- [x] canonical/README.md — Index documente canonice

## Phase 5 - Interactive Map Integration
- [x] Install react-native-maps package
- [x] Create DeliveryMap component with real-time vehicle/drone tracking
- [x] Integrate map into order detail screen (order/[id].tsx)
- [x] Integrate map into mission detail screen (mission/[id].tsx)
- [x] Add simulated real-time position updates for demo
- [x] Show delivery route (pickup → delivery) with polyline
- [x] Different markers for drone vs auto vs van vs ebike
- [x] Show DronePort transfer points on map

## Sprint 1-2: Auth Real + Audit Core (Blueprint v2 — Faza 2.1 + 6.1)
- [x] Extend DB schema: users (passwordHash, resetToken, isAIAgent, agentMode, humanPairId, etc.)
- [x] Extend DB schema: auditLogs (channel, isAIAction, isPhantomMode, phantomAdminId, ipAddress, etc.)
- [x] Create DB table: sessions (userId, token, deviceInfo, isPhantom, expiresAt)
- [x] Run migrations (drizzle-kit generate + migrate)
- [x] Implement tRPC router: dropiAuth (register, login, logout, me, forgotPassword, resetPassword)
- [x] Implement tRPC router: adminAuth (listUsers, phantomLogin, exitPhantom, toggleUserActive, changeUserRole)
- [x] Implement tRPC router: audit (list, getByUser, getByResource, getStats)
- [x] Implement audit middleware (auto-log all tRPC procedures)
- [x] Password hashing with bcryptjs
- [x] JWT session creation for DROPi-native auth (separate from Manus OAuth)
- [x] Rate limiting on login (5 attempts / 15 min)
- [x] Account lockout after 10 failed attempts
- [x] Seed data: 29 human test accounts with password
- [x] Seed data: 29 AI agent accounts (paired with human accounts)
- [x] Seed data: superadmin account
- [x] Redesign login screen (email+password + demo mode button)
- [x] Create register screen
- [x] Create forgot-password screen
- [x] Update auth-context.tsx to use real API calls
- [x] Keep Demo Mode functional (separate button)
- [x] Admin phantom mode (login as any user from dashboard)
- [x] Password recovery via Gmail (email link)
- [ ] qa-debugger validation for Sprint 1-2 (pending)

## Bug Fix: Language Consistency
- [x] Remove all Romanian text from UI — app must be English-only for now
- [ ] Future: Add language selector at install (English, Romanian, Tagalog)

## Bug Fixes: Registration + Password Recovery (Sprint 1-2 fixes)
- [x] Remove channel/role selector from Register screen — roles are assigned by admin, not self-selected
- [x] Register shows only account type: Customer, Merchant (with sub-type: Business/Community/Artisan/P2P), Delivery Partner
- [x] Auto-activate accounts: Customer, Merchant, Delivery Partner (unverified flag)
- [ ] Require admin approval for: Ops Manager, Emergency Coordinator, Fleet Manager, DronePort Operator, Safety Officer, all authority roles
- [ ] Delivery Partner gets "unverified" status — cannot receive missions until verified
- [x] Add Artisan as Merchant sub-type (not a separate role)
- [x] Fix Forgot Password: 6-digit verification code generated on server, NOT returned to client
- [x] Fix Forgot Password: token expires after 15 min, single-use
- [x] Fix Forgot Password: cannot reset password without valid token (security fix applied)

## Sprint 3-4: Critical Tasks (User Lifecycle)
- [x] DB: Create verifications table (id, userId, documentType, documentUrl, licenseNumber, expiryDate, vehicleType, status, reviewedBy, reviewedAt, rejectionReason)
- [x] DB: Create role_applications table (id, userId, requestedRole, requestedChannel, motivation, documentUrls, status, reviewedBy, reviewedAt, rejectionReason)
- [x] DB: Add emailVerified field to users table
- [x] Server: submitVerification endpoint (delivery partner uploads documents)
- [x] Server: reviewVerification endpoint (admin approves/rejects)
- [x] Server: applyForRole endpoint (user requests operational role)
- [x] Server: reviewApplication endpoint (admin approves/rejects role application)
- [ ] Server: guard on mission endpoints (block unverified delivery partners)
- [x] UI: Delivery Partner Verification screen (/app/verify-documents.tsx)
- [x] UI: Admin Approvals panel (/app/admin/approvals.tsx) — combined verifications + role applications
- [x] UI: Apply for Role screen (/app/apply-role.tsx)
- [x] SMTP: Email notification on verification approval/rejection
- [x] Audit: All verification and role actions logged (L6 compliance)
- [x] Navigation: Profile screen links to Verify Documents, Apply for Role, Admin Approvals

## Sprint 3-4 Continuation: Guards, Upload, Email Verification
- [x] Server: Mission guard — block unverified delivery partners from accepting missions
- [x] Server: File upload endpoint for document verification (S3/local storage)
- [x] UI: Update verify-documents screen with file picker + upload (gallery & camera)
- [x] Server: Email verification flow (send code on register, verify endpoint, resend)
- [x] DB: Add emailVerified, emailVerifyToken, emailVerifyExpires to users
- [x] UI: Email verification screen after registration (/app/verify-email.tsx)
- [x] Registration redirects to verify-email screen instead of tabs

## Profile Photo Upload
- [x] UI: Profile photo upload modal (gallery + camera) on profile screen
- [x] Server: Upload profile photo endpoint and save URL to user record
- [x] DB: Added profilePhotoUrl column to users table
- [x] Profile screen avatar is tappable to open photo modal

## Image Cropping Feature
- [x] UI: Add image cropping step to profile photo modal (zoom, pan, circular crop)
- [x] Installed expo-image-manipulator for native crop operations
- [x] Web fallback uses canvas-based cropping
- [x] Circular preview with zoom/pan controls (D-pad + zoom buttons)
- [x] 3-step flow: Select → Crop → Upload

## Suggested Upgrades (Sprint 5)
- [x] UI: Pinch-to-zoom and pan gesture for image cropper (react-native-gesture-handler + reanimated)
- [x] Server: Push notification on verification approval (notifyOwner on both verification and role application review)
- [x] UI: Onboarding nudge banner on home screen when profile completion < 100% (Customer, Merchant, Delivery Partner dashboards)

## Sprint A — Marketplace Foundation (Blueprint Implementation)
- [x] DB: Create stores table (type internal/external, trustScore, zone, category, status)
- [x] DB: Create products table (storeId, price, weight, dimensions, deliveryModes, cancellationPolicy, status)
- [x] DB: Create product_reviews table (productId, orderId, overallRating, qualityRating)
- [x] DB: Create seller_badges table (storeId, type, reason, isActive, overriddenBy)
- [x] DB: Create delivery_badges table (productId, mode, isEligible, conditions)
- [x] DB: Using existing auditLogs table (auto-logs all tRPC mutations via middleware)
- [x] DB: Create store_analytics table (storeId, period, totalOrders, revenue, avgRating)
- [x] Server: CRUD Store endpoints (create, update, get, getMyStore, list for admin)
- [x] Server: CRUD Products endpoints (create, update, remove, myProducts, getById, listActive, submitForReview, moderate)
- [x] Server: Audit Log middleware (auto-logs all marketplace mutations — already existed)
- [x] Server: Reviews router (submit, getForProduct, myStoreReviews)
- [x] UI: Merchant Dashboard main screen (stats, orders, trust score, badges)
- [x] UI: Store Setup screen (create/edit store, type internal/external)
- [x] UI: Products list screen (filter by status, delivery mode badges)
- [x] UI: New Product screen (full form with drone eligibility preview, regulations notice)
- [x] UI: Product Detail screen (badges, reviews, moderation notes, timeline)
- [x] UI: Merchant Reviews screen (summary stats, star distribution, review list)
- [x] UI: API Integration screen (external store merchants — API key, webhook config)

## Sprint B — Catalog & Moderation
- [x] Server: Auto-moderation rules engine (prohibited keywords, price limits, mandatory fields, weight/dimension validation)
- [x] Server: Delivery badge auto-calculation on product create/update (drone ≤2kg + ≤30cm, terrestrial always, multimodal if both)
- [x] Server: Auto-reject products with critical violations (prohibited content) with detailed reason
- [x] UI: Admin Product Moderation Panel (pending queue, product details, approve/reject with notes, stats)
- [x] UI: Moderation filters (by status: pending/approved/rejected)
- [x] Server: Admin notification (notifyOwner) when products are submitted for review with warnings
- [x] Server: Auto-approve products from trusted merchants (trustScore ≥ 80, no previous rejections)
- [x] UI: Merchant gets real-time moderation feedback after submitForReview (auto-approved/rejected/pending)

## Sprint C — Trust & Badge System
- [x] Server: Trust score calculation engine (5 components: postDeliveryRating 35%, qualityVsDescription 20%, orderCompletionRate 20%, ruleCompliance 15%, absenceOfComplaints 10%)
- [x] Server: Badge assignment logic (high_trust, new_activity, high_risk, restricted)
- [x] Server: Natural elimination mechanism (4 levels: warning → restricted visibility → suspended → removed)
- [x] Server: Trust endpoints (getMyTrustScore, getStoreTrustScore, recalculate, recalculateAll, overrideBadge)
- [x] Server: Improvement tips generator based on weakest score components
- [x] Server: Admin badge override with mandatory justification (logged in audit)
- [x] UI: Merchant Trust Dashboard (score gauge, component breakdown, badge, elimination status)
- [x] UI: Badge history timeline with active indicator
- [x] UI: Improvement tips with priority and impact levels
- [x] UI: Elimination status warning banner for merchants at risk
- [x] Navigation: Trust Score card on merchant dashboard links to trust screen

## Sprint D — Admin Dashboard Revision (Marketplace)
- [x] UI: Admin Marketplace Overview panel (pending moderation count, trust alerts, store stats, flagged products, trust distribution)
- [x] UI: Audit Log Viewer screen (filterable by action type, actor, date, severity, phantom mode)
- [x] UI: Phantom mode toggle in audit viewer (highlight admin-as-user actions with distinct styling)
- [x] UI: Export audit logs functionality (JSON download)
- [x] UI: Revise System Administrator dashboard with marketplace section (overview, moderation, audit links)
- [x] UI: Revise Security Officer dashboard with marketplace security links (audit logs, identity verification)
- [x] UI: Revise Audit Manager dashboard with marketplace audit panel (full log viewer, compliance, moderation audit)
- [x] Server: Admin marketplace stats via existing store.list + product.listActive + trust.getStoreTrustScore endpoints

## Sprint E — B2B Logistic API Integration
- [x] DB: Create api_keys table (storeId, keyHash, keyPrefix, name, permissions, isActive, lastUsedAt, rateLimit, expiresAt)
- [x] DB: Create webhook_endpoints table (storeId, url, events, secret, isActive, failureCount, lastTriggeredAt)
- [x] DB: Create b2b_deliveries table (storeId, externalOrderId, status, pickupAddress, deliveryAddress, deliveryMode, trackingCode, 34 columns total)
- [x] Server: API key management (generate with SHA-256 hash, revoke, list — apiKeyRouter in b2b-router.ts)
- [x] Server: B2B Logistic endpoints (request, getStatus, cancel, estimate, list — b2bDeliveryRouter in b2b-router.ts)
- [x] Server: Webhook system (register, test with HMAC-SHA256 signature, list, delete, logs — webhookRouter in b2b-router.ts)
- [x] Server: Rate limiting per API key (configurable 10-1000 req/min, stored in apiKeys table)
- [x] UI: Update merchant API Integration screen with live API key management (generate, revoke, status, delivery history)
- [x] UI: Webhook configuration panel (add/delete endpoints, event selection, test webhook, delivery logs) — /app/merchant/webhook-config.tsx
- [x] UI: API documentation viewer (4 sections: auth, endpoints, webhooks, errors) — /app/merchant/api-docs.tsx
- [x] DB: Create webhook_logs table (webhookEndpointId, deliveryId, event, payload, responseStatus, success, attemptNumber)
- [x] Server: B2B router registered in server/routers.ts (apiKey, b2bDelivery, webhook namespaces)
- [x] Server: Delivery estimate marked "informativă, non-contractuală" per Blueprint constraint

## Sprint E Upgrades — B2B API Enhancements
- [x] Server: Webhook auto-trigger on delivery status transitions (webhook-trigger.ts with HMAC-SHA256, exponential backoff 1/5/30min, auto-deactivation after 10 failures)
- [x] UI: Partner Card screen (/app/merchant/partner-card.tsx) — store branding, integration health score, API usage stats, storefront redirect URL, partner profile link
- [x] Server: REST API gateway at /api/v1/ (rest-gateway.ts — 7 endpoints: health, request, get, track, cancel, estimate, list)
- [x] Server: REST middleware — API key SHA-256 validation, in-memory rate limiting per key, lastUsedAt tracking
- [x] Server: REST error handling (standardized JSON: error code, message, timestamp, details)

## Sprint E+ Upgrades — B2B Analytics, Pilot Flow & Webhook Retry
- [x] DB: Create apiRequestLogs table (apiKeyId, method, endpoint, statusCode, responseTimeMs, requestBody, ipAddress)
- [x] Server: Request logging middleware in REST gateway (logs every API call with timing, response size)
- [x] Server: API analytics endpoint (apiAnalytics.summary — totals, performance, daily breakdown, top endpoints)
- [x] UI: Update Partner Card with API analytics section (total calls, error rate, avg response, daily bar chart, top endpoints)
- [x] Server: pilotUpdateStatus procedure (validates pilot identity, forward-only transitions, triggers webhooks, notifies store owner)
- [x] UI: Wire pilot status updates into mission/[id].tsx (accept→assigned, launch→pickup_enroute→picked_up→in_transit, complete→delivered, stop/fallback→failed)
- [x] UI: Webhook retry dashboard in webhook-config.tsx (filter failed-only, retry button per failed log, success/failure feedback, failed count summary)
- [x] Server: webhook.retry procedure (re-sends failed webhook with fresh HMAC-SHA256 signature, resets failure count on success)

## Sprint E++ — Merchant Orders, Live Tracking & C2/C3 Dispatch
- [x] UI: Merchant Orders screen (/app/merchant/orders.tsx) — real-time B2B delivery list with status filters, tracking codes, timestamps
- [x] UI: Order detail modal/expandable with delivery timeline, pilot info, webhook delivery status
- [x] Navigation: Link Merchant Orders from merchant dashboard
- [x] Server: WebSocket endpoint (/ws/tracking) for live pilot position broadcasting (server/live-tracking.ts)
- [x] UI: LiveTrackingMap component (components/live-tracking-map.tsx) with animated position, reconnect logic
- [x] UI: Customer and merchant can subscribe to delivery position updates via WebSocket
- [x] Server: C2/C3 dispatch integration — adminList, assignPilot, escalate endpoints in b2b-router.ts
- [x] UI: Operations Manager dashboard shows live pending queue with Assign button
- [x] UI: Emergency Coordinator dashboard shows failed deliveries with Escalate button + in-flight ops

## Pilot Selection System (Blueprint §12)
- [x] DB: Create pilotProfiles table (24 columns: rating, components, stats, availability, capacity, COS eligibility, rotation)
- [x] DB: Create pilotRatingHistory table (10 columns: audit trail for every rating change)
- [x] DB: Generate and apply migration 0009_melted_excalibur.sql
- [x] Server: Rating Engine — recalculateRating procedure with weighted formula (pilot-rating-engine.ts)
- [x] Server: Rating hooks on delivery completion/failure/review (pilot-rating-hooks.ts with 6 hooks: onB2bDeliveryCompleted, onB2bDeliveryFailed, onMarketplaceDeliveryCompleted, onMarketplaceDeliveryFailed, onCustomerReviewSubmitted, onIncidentReported)
- [x] Server: Wired rating hooks into b2b-router.ts pilotUpdateStatus and updateStatus procedures
- [x] Server: Admin rating adjustment endpoints (pilot-rating-admin.ts: adjustRating, getRatingHistory, getLeaderboard, getStats, triggerPeriodicRecalculation, resetRating)
- [x] Fix TypeScript errors in pilot-rating-hooks.ts (recalculateRating signature, RatingUpdateResult type)
- [x] Verify all rating recalculation flows end-to-end (6 hooks: onB2bDeliveryCompleted, onB2bDeliveryFailed, onMarketplaceDeliveryCompleted, onMarketplaceDeliveryFailed, onCustomerReviewSubmitted, onIncidentReported)
- [x] Periodic recalculation job (periodicRatingRecalculation)
- [x] Admin rating adjustment hook (onAdminRatingAdjustment)
- [x] Server: pilotSelectionRouter — getEligiblePilots, getAutoSelectedPilot, assignPilotManual, updateAvailability, updatePosition, getMyProfile, getRatingHistory, getLeaderboard
- [x] Server: Automatic selection algorithm (C1) with scoring formula (proximity 30%, rating 30%, completion 25%, rotation 15%)
- [x] Server: Manual selection validation (C2/C3) with rating gate (>= 4.00, cosEligible = TRUE)
- [x] UI: PilotPickerModal component for C2/C3 dashboards (eligible pilots list, stats, selection modal)
- [x] UI: AutoAssignBadge component for C1 marketplace (system-selected badge with selection reason)
- [x] UI: Wire PilotPickerModal into Operations Manager, Dispatch Manager, Emergency Coordinator dashboards
- [x] Integration: Wire webhook payload with pilot info on assignment (delivery.assigned event)
- [x] Integration: Audit log entries for all pilot selections (action: pilot_assigned_manual, channel, operator role)
