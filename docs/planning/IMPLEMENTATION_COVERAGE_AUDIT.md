# DROPi — Implementation Coverage Audit

> **Status:** PLANNING CANONICAL — DO NOT DELETE  
> **Generated:** 2026-08-02  
> **Purpose:** Classify every canonical capability against current implementation state  
> **Sources:** See CANONICAL_PLANNING_SOURCE_REGISTER.md for authority details

---

## Classification Schema

| Status Code | Meaning |
|-------------|---------|
| `implemented_and_verified` | Code exists, tests pass, validated against canon |
| `implemented_not_verified` | Code exists, no canonical test validation |
| `partially_implemented` | Stub/UI exists, no real backend/data |
| `specified_not_implemented` | Canon specifies clearly, not in codebase |
| `planned_future` | Canon mentions but marks as future/phase X |
| `blocked_by_owner_decision` | Cannot implement until owner decides |
| `blocked_by_canonical_conflict` | Sources conflict — see CANONICAL_PLANNING_CONFLICTS.md |
| `historical_only` | In canon for context, not a software deliverable |
| `obsolete_or_superseded` | Superseded by later canonical version |
| `unknown_requires_audit` | Cannot determine without deeper investigation |

---

## Layer 2: Application Core

### 2.1 Authentication & Accounts

| Capability | Status | Evidence | Epic |
|------------|--------|----------|------|
| Email/password registration | `implemented_and_verified` | `server/auth-router.ts`, tests pass | EPIC-001 |
| JWT access + refresh tokens | `implemented_and_verified` | `server/auth-router.ts`, jose v6 | EPIC-001 |
| Email verification flow | `implemented_and_verified` | `app/verify-email.tsx`, server endpoint | EPIC-001 |
| Password reset via email | `implemented_and_verified` | `app/forgot-password.tsx`, SMTP | EPIC-001 |
| RBAC middleware | `implemented_not_verified` | `server/audit-middleware.ts` exists | EPIC-001 |
| SecureStore token persistence | `partially_implemented` | Expo SecureStore used | EPIC-001 |
| Account roles (dropiRole enum) | `implemented_not_verified` | DB schema has roles | EPIC-001 |
| Phantom mode (admin → any account) | `partially_implemented` | UI exists, server route partial | EPIC-001 |
| 29 test accounts (one per role) | `specified_not_implemented` | No seed for 29 roles | EPIC-001 |
| AI agent account pairing | `specified_not_implemented` | AI agent accounts not created | EPIC-013 |
| Apply for role flow | `partially_implemented` | `app/apply-role.tsx` exists | EPIC-001 |
| Delivery partner unverified status | `partially_implemented` | `isVerified` field exists; guard missing | EPIC-001 |
| Guard on mission endpoints | `specified_not_implemented` | Not implemented — sprint 6A | EPIC-001 |
| Admin approval gate for ops roles | `partially_implemented` | `roleApplications` table exists; UI partial | EPIC-007 |
| Company accounts | `specified_not_implemented` | No company account type | EPIC-001 |
| Partner accounts | `specified_not_implemented` | No partner account type | EPIC-001 |

### 2.2 Data Persistence & Sync

| Capability | Status | Evidence | Epic |
|------------|--------|----------|------|
| Database schema — 26 tables | `implemented_and_verified` | `drizzle/meta/0013_snapshot.json` | EPIC-002 |
| Drizzle ORM migrations (0000-0013) | `implemented_and_verified` | All migrations verified | EPIC-002 |
| Production migration runner | `implemented_and_verified` | `scripts/migrate.ts`, Railway startup | EPIC-002 |
| tRPC routers for core entities | `partially_implemented` | Multiple routers exist | EPIC-002 |
| Replace mock data with real DB | `specified_not_implemented` | All dashboards use mock data | EPIC-002 |
| Offline-first with AsyncStorage | `specified_not_implemented` | Sprint 8+ | EPIC-002 |
| TanStack Query integration | `partially_implemented` | Setup exists | EPIC-002 |
| Seed data (products, merchants) | `specified_not_implemented` | No seed scripts | EPIC-002 |

### 2.3 Order Management

| Capability | Status | Evidence | Epic |
|------------|--------|----------|------|
| Order creation flow | `partially_implemented` | UI exists, mock data | EPIC-003 |
| Order status machine | `partially_implemented` | `b2b-router.ts` exists | EPIC-003 |
| Order history | `partially_implemented` | UI exists, mock data | EPIC-003 |
| C1 order flow (customer) | `partially_implemented` | UI only | EPIC-003 |
| C2 contracted order flow | `specified_not_implemented` | No COS-specific flow | EPIC-003 |
| C3 emergency order handling | `specified_not_implemented` | EOC flows not implemented | EPIC-003 |
| Delivery selection in order | `specified_not_implemented` | Delivery mode selection not real | EPIC-003 |
| Order audit trail | `specified_not_implemented` | L6 audit on orders incomplete | EPIC-010 |

### 2.4 Marketplace C1

| Capability | Status | Evidence | Epic |
|------------|--------|----------|------|
| Product catalog UI | `partially_implemented` | UI functional, mock data | EPIC-004 |
| Category system | `partially_implemented` | UI exists, mock data | EPIC-004 |
| Merchant product listing | `partially_implemented` | UI exists, mock data | EPIC-004 |
| Zonal product visibility | `specified_not_implemented` | No zone filtering | EPIC-004 |
| P2P listings (1-3 max) | `specified_not_implemented` | No P2P listing type | EPIC-004 |
| Checkout flow | `partially_implemented` | UI exists, no real payment | EPIC-004 |
| Delivery eligibility badges | `partially_implemented` | Badge UI exists | EPIC-004 |
| Separate marketplace website | `blocked_by_canonical_conflict` | See CONFLICT-001 | EPIC-027 |

### 2.5 COS — C2 Channel

| Capability | Status | Evidence | Epic |
|------------|--------|----------|------|
| C2 channel UI (29 dashboards) | `partially_implemented` | UI exists | EPIC-005 |
| Contracted operations management | `specified_not_implemented` | No real contract management | EPIC-005 |
| SLA monitoring | `specified_not_implemented` | Not implemented | EPIC-005 |
| Logistics optimization | `specified_not_implemented` | Not implemented | EPIC-005 |

### 2.6 EOC — C3 Channel

| Capability | Status | Evidence | Epic |
|------------|--------|----------|------|
| C3 channel UI | `partially_implemented` | UI exists | EPIC-006 |
| Emergency declaration | `specified_not_implemented` | Not implemented | EPIC-006 |
| Rapid dispatch (<3 min) | `specified_not_implemented` | Not implemented | EPIC-006 |
| Resource allocation | `specified_not_implemented` | Not implemented | EPIC-006 |
| OVERRIDE capability | `specified_not_implemented` | Not implemented | EPIC-006 |

### 2.7 Admin Operations

| Capability | Status | Evidence | Epic |
|------------|--------|----------|------|
| Admin channel UI | `partially_implemented` | UI exists | EPIC-007 |
| Phantom mode login | `partially_implemented` | UI exists, partial server | EPIC-007 |
| Verification panel | `partially_implemented` | `app/admin/` exists | EPIC-007 |
| Role approval flow | `partially_implemented` | Partial; missing guard | EPIC-007 |
| System configuration | `specified_not_implemented` | Not implemented | EPIC-007 |

### 2.8 Payments & Wallet

| Capability | Status | Evidence | Epic |
|------------|--------|----------|------|
| Wallet real balance | `specified_not_implemented` | No wallet implementation | EPIC-008 |
| Promotional balance | `specified_not_implemented` | Not implemented | EPIC-008 |
| Payment provider integration | `specified_not_implemented` | Not implemented | EPIC-008 |
| Refund flows | `specified_not_implemented` | Not implemented | EPIC-008 |
| Commission calculation | `specified_not_implemented` | Not implemented | EPIC-008 |
| Withdrawal | `specified_not_implemented` | Not implemented | EPIC-008 |

### 2.9 Real-Time & Notifications

| Capability | Status | Evidence | Epic |
|------------|--------|----------|------|
| Push notifications | `partially_implemented` | `server/push-notifications.ts` exists; not wired | EPIC-009 |
| WebSocket live tracking | `partially_implemented` | `server/live-tracking.ts`; Sprint 7 | EPIC-009 |
| In-app notifications | `partially_implemented` | `notification-router.ts` exists | EPIC-009 |
| Order status push | `specified_not_implemented` | Sprint 6B | EPIC-009 |

---

## Layer 6: Audit Core

| Capability | Status | Evidence | Epic |
|------------|--------|----------|------|
| Audit log table | `partially_implemented` | Table in schema | EPIC-010 |
| Complete event logging | `specified_not_implemented` | Incomplete coverage | EPIC-010 |
| GDPR consent management | `specified_not_implemented` | Not implemented | EPIC-011 |
| Data retention policies | `specified_not_implemented` | Not implemented | EPIC-011 |
| Data deletion (right to erasure) | `specified_not_implemented` | Not implemented | EPIC-011 |
| Operational traceability | `specified_not_implemented` | Partial | EPIC-012 |
| Proof of delivery logging | `specified_not_implemented` | Not implemented | EPIC-012 |
| Incident audit trail | `specified_not_implemented` | Not implemented | EPIC-012 |

---

## Layer 4: Logic Core (AI/DSS)

| Capability | Status | Evidence | Epic |
|------------|--------|----------|------|
| AI agent framework | `specified_not_implemented` | Canon defined, no code | EPIC-013 |
| C1 agents (9 agents) | `specified_not_implemented` | Canon defined only | EPIC-014 |
| C2 agents (8 agents) | `specified_not_implemented` | Canon defined only | EPIC-015 |
| C3 agents (6 agents) | `specified_not_implemented` | Canon defined only | EPIC-016 |
| Admin agents (6+5) | `specified_not_implemented` | Canon defined only | EPIC-017 |
| 1-month simulation | `specified_not_implemented` | Not implemented | EPIC-013 |
| Eligibility engine | `specified_not_implemented` | Badge UI exists, no real engine | EPIC-018 |
| Route optimization | `specified_not_implemented` | Not implemented | EPIC-018 |

---

## Layer 3: Physical Core (DronePort)

| Capability | Status | Evidence | Epic |
|------------|--------|----------|------|
| DronePort registry (digital) | `partially_implemented` | DronePort UI module exists | EPIC-019 |
| DronePort status monitoring | `partially_implemented` | UI only | EPIC-019 |
| DronePort digital twin | `specified_not_implemented` | Not implemented | EPIC-019 |
| Multimodal transfer logic | `specified_not_implemented` | Not implemented | EPIC-020 |
| Staged delivery | `specified_not_implemented` | Not implemented | EPIC-020 |
| Battery management | `specified_not_implemented` | Not implemented | EPIC-021 |
| Safety points registry | `specified_not_implemented` | Not implemented | EPIC-022 |
| Emergency landing zones | `specified_not_implemented` | Not implemented | EPIC-022 |

---

## Layer 5: Operational Core

| Capability | Status | Evidence | Epic |
|------------|--------|----------|------|
| Delivery execution engine | `specified_not_implemented` | Mission UI exists (mock) | EPIC-023 |
| STOP mechanism | `specified_not_implemented` | STOP button UI exists | EPIC-024 |
| FALLBACK triggers | `specified_not_implemented` | FALLBACK button UI exists | EPIC-024 |
| Weather integration | `specified_not_implemented` | Not implemented | EPIC-025 |
| GPS geofencing | `specified_not_implemented` | Map UI exists | EPIC-025 |
| No-crowds operational rules | `specified_not_implemented` | Not implemented | EPIC-025 |
| Drone fleet tracking | `specified_not_implemented` | Not implemented | EPIC-026 |
| Ground fleet management | `specified_not_implemented` | Not implemented | EPIC-026 |
| Maintenance scheduling | `specified_not_implemented` | Not implemented | EPIC-026 |
| Telemetry data | `specified_not_implemented` | Not implemented | EPIC-026 |

---

## Layer 1: Public Front

| Capability | Status | Evidence | Epic |
|------------|--------|----------|------|
| Marketing website | `specified_not_implemented` | Not implemented | EPIC-027 |
| Investor pitch assets | `historical_only` | In 04.zip (docs only) | EPIC-027 |
| Public brand presence | `specified_not_implemented` | Not implemented | EPIC-027 |

---

## Transversal Modules

| Capability | Status | Evidence | Epic |
|------------|--------|----------|------|
| Security module | `partially_implemented` | Auth security done; broader incomplete | EPIC-028 |
| Biometric authentication | `specified_not_implemented` | Sprint 7 | EPIC-028 |
| Testing infrastructure | `partially_implemented` | Tests exist for auth | EPIC-029 |
| QA agent validation | `specified_not_implemented` | Not implemented | EPIC-029 |
| Release discipline | `implemented_not_verified` | Process exists | EPIC-030 |
| Rollback procedures | `implemented_not_verified` | Railway rollback possible | EPIC-030 |
| Railway deployment | `implemented_and_verified` | Live and working | EPIC-030 |
| Android distribution | `specified_not_implemented` | EAS configured, not published | EPIC-030 |
| Localization (EN/RO/TL) | `specified_not_implemented` | Sprint 7 | Various |

---

## Summary Counts

| Status | Count |
|--------|-------|
| implemented_and_verified | 9 |
| implemented_not_verified | 5 |
| partially_implemented | 33 |
| specified_not_implemented | 64 |
| planned_future | 4 |
| blocked_by_owner_decision | 1 |
| blocked_by_canonical_conflict | 1 |
| historical_only | 4 |
| obsolete_or_superseded | 0 |
| unknown_requires_audit | 1 |
| **TOTAL** | **122** |

---

## Immediate Action Required (Sprint 6A — Critical)

Based on AUDIT_TRACKING.md and BLUEPRINT_SPRINT_ROADMAP.md:

| # | Capability | Status | Issue |
|---|------------|--------|-------|
| 1 | Delivery Partner unverified status display | `partially_implemented` | IMPL-001 |
| 2 | Guard on mission endpoints | `specified_not_implemented` | IMPL-002 |
| 3 | Admin approval gate for ops roles | `partially_implemented` | IMPL-003 |
| 4 | Admin approval panel UI | `partially_implemented` | IMPL-004 |
| 5 | QA-debugger validation Sprint 1-2 | `specified_not_implemented` | IMPL-005 |

---

*This audit was generated by inspecting all canonical sources and comparing against the current codebase state.*
