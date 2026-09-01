# DROPi — Canonical Planning Source Register

> **Status:** PLANNING CANONICAL — DO NOT DELETE  
> **Generated:** 2026-08-02  
> **Authority:** Active canon  
> **Purpose:** Deterministic record of every planning-relevant source inspected for GitHub roadmap materialization

---

## Archive Fingerprint

| Field | Value |
|-------|-------|
| Archive | `04.zip` |
| SHA-256 | `82a6015b8c968645307e36c8e4aa0351515f50333c08a6c5402a7819b7b747e5` |
| Total entries | 299 |
| Files | 235 |
| Directories | 64 |
| Primary canonical docs (.docx) | 148 |
| ZIP-only markdown docs | 29 |
| Source code files | 49 |
| Configuration files | 5 |

Archive was verified read-only. Not modified, not extracted over repository paths.

---

## Source Authority Classes

| Class | Code | Description |
|-------|------|-------------|
| Historical Primary Archive | `04-ZIP` | `04.zip` — immutable primary archive |
| Extracted Historical Copy | `HIST-EXTRACT` | Extracted copies in `canonical/docs/00_MasterPlan/` |
| Active Canon | `ACTIVE-CANON` | `canonical/*.md` — later approved active canonical documents |
| Blueprint/Governance | `BLUEPRINT` | `BLUEPRINT/` and root architecture docs |
| Implementation Evidence | `IMPL` | App code, server code, tests, migrations |
| Derived Reference | `DERIVED` | `DROPi_Canonical_Reference/` — navigation only |
| Audit Evidence | `AUDIT` | `docs/audits/can-001` through `can-008` |
| GitHub Planning Metadata | `GH-META` | Existing issues, labels, milestones |

**Authority Order:** 04-ZIP > HIST-EXTRACT > ACTIVE-CANON > BLUEPRINT > IMPL > DERIVED > GH-META

---

## Source Register

### S-001: 04.zip — Primary Historical Archive

| Field | Value |
|-------|-------|
| Path | `04.zip` |
| Authority Class | `04-ZIP` |
| SHA-256 | `82a6015b8c968645307e36c8e4aa0351515f50333c08a6c5402a7819b7b747e5` |
| Language | Romanian (primary), English (secondary), Filipino (pitch docs) |
| Document Type | Historical primary archive |
| Relevant Domains | ALL — complete product canon |
| Roadmap Claims | Complete 6-layer roadmap, 36-month execution plan, Zone 0 Philippines |
| Functional Requirements | Complete (148 canonical docs) |
| Operational Requirements | Drone operations, pilot governance, DronePort standards |
| Legal/Compliance | EASA compliance, GDPR, Philippines regulations, franchise law |
| Technical Requirements | Full platform specification, API contracts, DB schema, deployment |
| Unresolved Contradictions | See CANONICAL_PLANNING_CONFLICTS.md |
| Derived Planning Objects | All epics, phases, milestones, programs |

### S-002: canonical/docs/00_MasterPlan/

| Field | Value |
|-------|-------|
| Path | `canonical/docs/00_MasterPlan/` |
| Authority Class | `HIST-EXTRACT` |
| Language | Romanian |
| Document Type | Extracted historical corpus |
| Relevant Domains | ALL |
| Contents | 4 subdirectories: FUNDAMENT, PRODUS & TEHNOLOGIE, BUSINESS/LEGAL, PITCH |

**Key documents inspected:**

| Document | Domain | Planning Objects Derived |
|----------|--------|--------------------------|
| 01_EXECUTIVE SUMMARY | Vision, Strategy | PROG-001, PHASE-* |
| 02_PROBLEMA GLOBALA | Market Context | GTM epics |
| 03_SOLUTIA DROPi — ARHITECTURA | Architecture | All epics |
| 04_DIFERENTIEREA STRATEGICA | Competitive | GTM, business model |
| 05_ZONA 0 — FILIPINE | Geography, GTM | EPIC-027 (GTM), M1-M6 dates |
| 06_PRODUSUL DROPi | Product | EPIC-001 to EPIC-027 |
| 07_DEZVOLTAREA SITE-ULUI | Web | EPIC-027 |
| 08_DEZVOLTAREA APLICATIEI | Mobile App | EPIC-001 to EPIC-009 |
| 09_INFRASTRUCTURA DRONEPORT | DronePort | EPIC-019 to EPIC-022 |
| 10_AI ASISTAT | AI/DSS | EPIC-013 to EPIC-018 |
| 11_LIVRAREA AUTONOMA | Delivery | EPIC-023 to EPIC-026 |
| 12_SISTEMUL DE DATE / LOG-URI | Audit/Privacy | EPIC-010 to EPIC-012 |
| 13_TESTARE / QA | QA/Release | EPIC-029 |
| 14_ARHITECTURA INFRASTRUCTURII | Backend/DB | EPIC-030 |
| 15_INTEGRARE & INTEROPERABILITATE | Integrations | EPIC-030 |
| 16_GUVERNANTA TEHNICA | Governance | OWNER-* issues |
| 17_MANAGEMENTUL RISCULUI | Risk | RISK labels |
| 18_KPI / METRICI | Analytics | EPIC-012 |
| 19_CE NU FACE DROPi | Boundaries | Forbidden changes |
| 21_MODELUL ECONOMIC COMPLET | Business Model | EPIC-027, investment docs |
| 22_GO-TO-MARKET FILIPINE ZONA 0 | GTM | M5, M6 |
| 23_COMPLIANCE MULTI-TARA | Compliance | EPIC-011 |
| 24_FRANCIZARE | Franchise | Future epics |
| 25_STRATEGIA DE INVESTITII | Investment | Owner decisions |
| 26_ROADMAP 0-36 LUNI | Roadmap | All milestones |
| 27_SCENARII DE EXIT | Exit | Future epics |

### S-003: canonical/AI_DEVELOPMENT_HANDOVER_CANON.md

| Field | Value |
|-------|-------|
| Path | `canonical/AI_DEVELOPMENT_HANDOVER_CANON.md` |
| Authority Class | `ACTIVE-CANON` |
| Language | Romanian |
| Document Type | AI Governance Canon |
| Relevant Domains | AI agents, governance, development rules |
| Roadmap Claims | AI organization of 29 agents, dual account model |
| Derived Planning Objects | EPIC-013 to EPIC-017, OWNER-005 |

### S-004: canonical/AI_AGENT_SYSTEM.md

| Field | Value |
|-------|-------|
| Path | `canonical/AI_AGENT_SYSTEM.md` |
| Authority Class | `ACTIVE-CANON` |
| Language | Romanian |
| Document Type | AI Agent System Specification |
| Relevant Domains | AI agents (C1/C2/C3/Admin), dual account model |
| Key Claims | 29 roles with human+AI pairing; C1: 9 agents, C2: 8, C3: 6, Admin+Support: 11 |
| Derived Planning Objects | EPIC-013 to EPIC-017 |

### S-005: canonical/DELIVERY_MULTIMODAL.md

| Field | Value |
|-------|-------|
| Path | `canonical/DELIVERY_MULTIMODAL.md` |
| Authority Class | `ACTIVE-CANON` |
| Language | English |
| Document Type | Delivery System Specification |
| Relevant Domains | Drone delivery, ground delivery, multimodal, badges, pilot rules |
| Key Claims | 5 delivery modes, badge system rules, pilot selection (not first-come), client-presence rules |
| Derived Planning Objects | EPIC-023 to EPIC-026, EPIC-018 |

### S-006: canonical/SESSION_HANDOVER.md

| Field | Value |
|-------|-------|
| Path | `canonical/SESSION_HANDOVER.md` |
| Authority Class | `ACTIVE-CANON` |
| Language | Romanian |
| Document Type | Session continuity |
| Relevant Domains | All — current implementation state |
| Implementation State | Auth (real), DB schema (26 tables), migrations (0000-0013), Railway deployment active |

### S-007: canonical/ADMIN_PROVISIONING.md

| Field | Value |
|-------|-------|
| Path | `docs/ADMIN_PROVISIONING.md` |
| Authority Class | `ACTIVE-CANON` |
| Relevant Domains | Admin accounts, provisioning |
| Derived Planning Objects | EPIC-007 (Admin Operations) |

### S-008: BLUEPRINT/DROPi_ROADMAP_BY_LAYERS.md

| Field | Value |
|-------|-------|
| Path | `BLUEPRINT/DROPi_ROADMAP_BY_LAYERS.md` |
| Authority Class | `BLUEPRINT` |
| Language | Romanian |
| Document Type | Layer-ordered roadmap |
| Roadmap Claims | 6-layer implementation order: L2→L6→L4→L3→L5→L1 |
| Key Content | Phase 2.1-2.9 (App Core), 6.1-6.3 (Audit), 4.1-4.7 (Logic), 3.1-3.4 (DronePort), 5.1-5.4 (Ops), 1.1 (Website) |
| Derived Planning Objects | All batches and implementation epics |

### S-009: BLUEPRINT/DROPi_NEXT_SPRINT_TASKS.md

| Field | Value |
|-------|-------|
| Path | `BLUEPRINT/DROPi_NEXT_SPRINT_TASKS.md` |
| Authority Class | `BLUEPRINT` |
| Relevant Domains | Immediate priorities |
| Key Content | Sprint 3-4: delivery partner verification, admin approval, apply-for-role |
| Derived Planning Objects | BATCH-001 through BATCH-005, IMPL-001 to IMPL-012 |

### S-010: BLUEPRINT/BLUEPRINT_SPRINT_ROADMAP.md (in docs/)

| Field | Value |
|-------|-------|
| Path | `docs/BLUEPRINT_SPRINT_ROADMAP.md` |
| Authority Class | `BLUEPRINT` |
| Relevant Domains | Sprint prioritization methodology |
| Key Content | Sprint 6A (security critical), 6B (UX medium), 7 (websocket/biometric), 8+ (offline) |
| Derived Planning Objects | BATCH priority ordering |

### S-011: BLUEPRINT/BLUEPRINT_MARKETPLACE_DROPI.md (in docs/)

| Field | Value |
|-------|-------|
| Path | `docs/BLUEPRINT_MARKETPLACE_DROPI.md` |
| Authority Class | `BLUEPRINT` |
| Relevant Domains | Marketplace, product catalog, merchant accounts |
| Derived Planning Objects | EPIC-004 (Marketplace C1) |

### S-012: BLUEPRINT/BLUEPRINT_PILOT_SELECTION_SYSTEM.md (in docs/)

| Field | Value |
|-------|-------|
| Path | `docs/BLUEPRINT_PILOT_SELECTION_SYSTEM.md` |
| Authority Class | `BLUEPRINT` |
| Relevant Domains | Pilot selection, eligibility, dispatch |
| Derived Planning Objects | EPIC-018 (Eligibility Engine), EPIC-023 (Delivery Execution) |

### S-013: AUDIT_TRACKING.md

| Field | Value |
|-------|-------|
| Path | `AUDIT_TRACKING.md` |
| Authority Class | `BLUEPRINT` |
| Relevant Domains | All — implementation status |
| Key Content | 10 pending items, 252/262 done, sprint 6A/6B/7/8+ priority |
| Derived Planning Objects | IMPL-001 to IMPL-010 (immediate batch) |

### S-014: DROPI_STATUS_REPORT_2026-06-30.md

| Field | Value |
|-------|-------|
| Path | `DROPI_STATUS_REPORT_2026-06-30.md` |
| Authority Class | `BLUEPRINT` |
| Relevant Domains | All — audit snapshot |
| Key Content | 252/262 tasks complete; detailed per-feature status |

### S-015: ARCHITECTURE.md

| Field | Value |
|-------|-------|
| Path | `ARCHITECTURE.md` |
| Authority Class | `BLUEPRINT` |
| Relevant Domains | System architecture |
| Derived Planning Objects | Platform labels, EPIC-030 |

### S-016: DEPLOYMENT.md

| Field | Value |
|-------|-------|
| Path | `DEPLOYMENT.md` |
| Authority Class | `BLUEPRINT` |
| Relevant Domains | Deployment, Railway, Android distribution |
| Derived Planning Objects | EPIC-030 (Deployment) |

### S-017: docs/audits/can-001/ through can-008/

| Field | Value |
|-------|-------|
| Path | `docs/audits/can-001/` to `docs/audits/can-008/` |
| Authority Class | `AUDIT` |
| Relevant Domains | Canonical certification, provenance |
| Key Content | CAN-001: 04.zip inventory. CAN-002: MasterPlan corpus verification. CAN-003: ZIP-only markdown. CAN-004: Authority matrix. CAN-005: Filename/encoding. CAN-006: Statistics. CAN-007: Provenance. CAN-008: Regeneration protocol. |
| GitHub Status | Issues #42–#50 CLOSED — must remain closed |

### S-018: Application Code

| Field | Value |
|-------|-------|
| Path | `app/` |
| Authority Class | `IMPL` |
| Key Components | 29 dashboards, marketplace UI, navigation RBAC, DronePort module, Pilot dashboard, Auth screens, Register/Login |

### S-019: Server Code

| Field | Value |
|-------|-------|
| Path | `server/` |
| Authority Class | `IMPL` |
| Key Components | auth-router, b2b-router, marketplace-router, pilot-selection-router, notification-router, operations-router, audit-middleware, moderation-engine |

### S-020: Database Schema

| Field | Value |
|-------|-------|
| Path | `drizzle/` |
| Authority Class | `IMPL` |
| Key Content | 26 tables, migrations 0000-0013, Drizzle ORM |

### S-021: DROPi_Canonical_Reference/ (Derived)

| Field | Value |
|-------|-------|
| Path | `DROPi_Canonical_Reference/` |
| Authority Class | `DERIVED` |
| Note | Used for navigation only. Does not outrank primary sources. |

### S-022: GitHub Existing State

| Field | Value |
|-------|-------|
| Source | GitHub repository issues/labels/milestones |
| Authority Class | `GH-META` |
| Open Issues | 0 |
| Closed Issues | 12 (#2, #4, #8 CI failures; #42-#50 CAN-001–CAN-008 audits) |
| Existing Labels | Default GitHub labels only |
| Existing Milestones | None |
| Note | Historical closed issues (#42-#50) must remain closed |

---

## Domain Coverage Summary

| Domain | Primary Source | Implementation Status |
|--------|---------------|----------------------|
| Identity & Authentication | S-001, S-002 (Cap.08), S-006 | implemented_and_verified |
| Account Lifecycle | S-001, S-002 (Cap.06) | partially_implemented |
| Email Verification | S-001, S-006 | implemented_and_verified |
| Password Reset | S-001, S-006 | implemented_and_verified |
| Roles & Permissions | S-001, S-004 | implemented_not_verified |
| Owner/Admin Controls | S-001, S-007 | partially_implemented |
| Customer Accounts | S-001, S-002 | implemented_not_verified |
| Company Accounts | S-001, S-002 | specified_not_implemented |
| Partner Accounts | S-001, S-004 | specified_not_implemented |
| Courier/Delivery Partner | S-001, S-004, S-009 | partially_implemented |
| Pilot Accounts | S-001, S-004, S-012 | partially_implemented |
| Host/DronePort Accounts | S-001, S-002 | specified_not_implemented |
| Marketplace | S-001, S-011 | partially_implemented |
| Product Catalogs | S-001, S-002 | partially_implemented |
| Merchant Portfolios | S-001, S-011 | partially_implemented |
| Zonal Search | S-001, S-005 | specified_not_implemented |
| Checkout | S-001, S-002 | partially_implemented |
| Orders | S-001, S-008 | partially_implemented |
| P2P Parcel Sending | S-001, S-005 | specified_not_implemented |
| Delivery Selection | S-001, S-005, S-012 | specified_not_implemented |
| Ground Delivery | S-001, S-005 | specified_not_implemented |
| Van/Heavy-Item Delivery | S-001, S-005 | specified_not_implemented |
| Drone Delivery | S-001, S-005 | specified_not_implemented |
| Weather Fallback | S-001, S-005 | specified_not_implemented |
| Client-Presence Rules | S-001, S-005 | specified_not_implemented |
| Lockers | S-001, S-002 | planned_future |
| Wallet / Real Balance | S-001, S-002 | specified_not_implemented |
| Promotional Balance | S-001, S-002 | specified_not_implemented |
| Withdrawal | S-001, S-002 | specified_not_implemented |
| Payment Providers | S-001, S-002 | specified_not_implemented |
| Refunds | S-001, S-002 | specified_not_implemented |
| Commissions | S-001, S-002 | specified_not_implemented |
| Pricing | S-001, S-002 | specified_not_implemented |
| Promotions | S-001, S-002 | specified_not_implemented |
| Notifications | S-001, S-013 | partially_implemented |
| Messaging | S-001 | specified_not_implemented |
| Tracking | S-001, S-018 | partially_implemented |
| Maps | S-001, S-018 | partially_implemented |
| Geolocation | S-001, S-018 | partially_implemented |
| Zones | S-001 | specified_not_implemented |
| Dispatch | S-001, S-012 | specified_not_implemented |
| Routing | S-001, S-012 | specified_not_implemented |
| Delivery Lifecycle | S-001, S-008 | specified_not_implemented |
| Proof of Delivery | S-001, S-005 | specified_not_implemented |
| Failure Handling | S-001, S-005 | specified_not_implemented |
| Incident Handling | S-001 | specified_not_implemented |
| Audit Logs | S-001, S-002, S-017 | partially_implemented |
| Observability | S-001, S-015 | specified_not_implemented |
| Analytics | S-001, S-002 | specified_not_implemented |
| KPI & Unit Economics | S-001, S-002 | specified_not_implemented |
| Privacy | S-001, S-002 | specified_not_implemented |
| Security | S-001, S-028 | partially_implemented |
| Data Protection | S-001, S-002 | specified_not_implemented |
| Retention | S-001, S-002 | specified_not_implemented |
| Legal Compliance | S-001, S-002 | specified_not_implemented |
| EASA/Drone Compliance | S-001, S-002 | blocked_by_owner_decision |
| Pilot Governance | S-001, S-012 | specified_not_implemented |
| Partner Governance | S-001 | specified_not_implemented |
| Operator/Franchise Governance | S-001, S-002 | planned_future |
| DronePort Infrastructure | S-001, S-002 | specified_not_implemented |
| Mobile DronePorts | S-001, S-002 | planned_future |
| Fixed DronePorts | S-001, S-002 | specified_not_implemented |
| Batteries & Charging | S-001, S-002 | specified_not_implemented |
| Drone Fleet | S-001, S-002 | specified_not_implemented |
| Ground Fleet | S-001 | specified_not_implemented |
| Maintenance | S-001 | specified_not_implemented |
| Telemetry | S-001, S-002 | specified_not_implemented |
| Autonomous Supervised Delivery | S-001, S-002 | specified_not_implemented |
| AI-Assisted Decisions | S-001, S-003, S-004 | specified_not_implemented |
| Fallback/Manual Control | S-001, S-005 | specified_not_implemented |
| Testing | S-001, S-017 | partially_implemented |
| QA | S-001 | partially_implemented |
| Release Discipline | S-001, S-002 | implemented_not_verified |
| Rollback | S-001, S-002 | implemented_not_verified |
| Deployment | S-001, S-016 | implemented_and_verified |
| Railway Hosting | S-016 | implemented_and_verified |
| Mobile Packaging | S-001 | partially_implemented |
| Android Distribution | S-001 | specified_not_implemented |
| Web Application | S-001, S-002 | specified_not_implemented |
| API/Backend | S-019 | partially_implemented |
| Database | S-020 | implemented_and_verified |
| File Storage | S-001 | specified_not_implemented |
| Integrations | S-001, S-002 | specified_not_implemented |
| Localization | S-001, S-013 | specified_not_implemented |
| Accessibility | S-001 | unknown_requires_audit |
| Support | S-001, S-004 | specified_not_implemented |
| Moderation | S-001, S-019 | partially_implemented |
| Risk Management | S-001, S-002 | specified_not_implemented |
| Business Model | S-001, S-002 | historical_only |
| Go-to-Market | S-001, S-002 | planned_future |
| Philippines Zone 0 | S-001, S-002 | planned_future |
| EU Expansion | S-001, S-002 | planned_future |
| Franchising | S-001, S-002 | planned_future |
| Investment | S-001, S-002 | historical_only |
| Finance | S-001, S-002 | historical_only |
| Roadmap | S-008 | implemented_not_verified |
| Exit Scenarios | S-001, S-002 | historical_only |

---

## Implementation Status Count

| Status | Count |
|--------|-------|
| implemented_and_verified | 5 |
| implemented_not_verified | 4 |
| partially_implemented | 19 |
| specified_not_implemented | 47 |
| planned_future | 8 |
| blocked_by_owner_decision | 1 |
| blocked_by_canonical_conflict | 0 |
| historical_only | 5 |
| obsolete_or_superseded | 0 |
| unknown_requires_audit | 1 |

**Total domains classified:** 90

---

*This register was generated by inspecting all canonical sources listed above. It is deterministic and must be regenerated if sources change.*
