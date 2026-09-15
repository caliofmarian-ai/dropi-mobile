# Romania Launch — P0 Implementation Decomposition (Pre-Gate)

> **STATUS: PRE-OWNER / NON-CANONICAL / DO NOT EXECUTE AS AUTHORIZED BACKLOG YET**
> **Issue:** #500
> **Parent:** #492
> **Prepared:** 2026-09-15
> **Legal evidence:** PR #504
> **Candidate queue:** PR #505

This document pre-composes the bounded implementation issues that can be created immediately after #501 records `AUTHORIZE IMPLEMENTATION REPRIORITIZATION` and the relevant legal/business gate is available.

It does not itself create implementation authority and must not be used to bypass `HOLD-LEGAL` or `HOLD-OWNER` states.

## 1. Existing P0 / foundation issues to retain

Before creating new launch slices, retain and re-audit existing work rather than duplicating it:

- #476 — protect `main` and required CI governance;
- #401 — real account recovery/password reset correctness;
- #71 — C1 Marketplace parent, re-baselined to professional-merchant first pilot;
- #70 / #102 / #103 — order authority/lifecycle, scoped to merchant Marketplace flow;
- #166 — canonical schema/migration authority;
- #270 — extract launch-critical integration tests rather than making every future service a launch blocker;
- #273 / #277 — scoped release acceptance and post-release rollback evidence;
- #425 — truthfulness invariant if any transport assignment/mode is exposed.

No new issue may recreate their owned authority.

## 2. Candidate new P0 slices

### RO-IMP-P0-01 — Professional Merchant Marketplace Capability

**Class:** `LAUNCH-P0 / HOLD-LEGAL until #493/#494 design contract`

**Purpose:** separate authentication/account existence from legal ability to sell on the first Marketplace pilot.

**Inputs:**

- `RO_LAUNCH_MARKETPLACE_CONTROL_CONTRACT_2026-09-15.md`;
- final entity/seller-of-record mapping from #493;
- approved evidence provenance rules.

**Required implementation:**

- `MerchantComplianceProfile` or equivalent canonical aggregate;
- legal entity/business evidence references;
- professional-status declaration/evidence;
- seller-of-record profile/version;
- allowed category pack and allowed zone pack;
- permitted fulfilment roles;
- evidence provenance: `LAW_REQUIRED | DROPI_POLICY_REQUIRED | PROVIDER_REQUIRED`;
- review/expiry/suspension state;
- no implicit selling capability from user role, store ownership or `verified=true`.

**Fail-closed invariant:**

`authenticated merchant != Marketplace seller capability`.

**Acceptance:**

- merchant with incomplete/expired evidence cannot publish or receive binding orders;
- denial exposes safe reason codes without leaking restricted evidence;
- capability changes are auditable;
- tests reject every legacy shortcut that derives sell permission from a generic verification boolean.

---

### RO-IMP-P0-02 — Launch Category / Zone / Product-Safety Gate

**Class:** `LAUNCH-P0 / HOLD-OWNER + HOLD-LEGAL until #497/#494 disposition`

**Purpose:** ensure only the exact owner-approved first family and zone can be published/ordered.

**Inputs:**

- `RO_LAUNCH_PRODUCT_ALLOWLIST_GPSR_CONTRACT_2026-09-15.md`;
- final Product Owner family/zone decision;
- approved GPSR control pack.

**Required implementation:**

- versioned `ProductCategoryPack` and `PilotZonePack`;
- deny-by-default subcategory classification;
- manufacturer/economic-operator/responsible-person/safety fields where applicable;
- product evidence provenance;
- Safety Gate check/reference hook;
- publish-state and safety-case integration;
- merchant/SKU/order caps;
- checkout denial outside category/zone/effective period.

**Fail-closed invariant:** unknown category, unknown zone or missing safety evidence cannot become `APPROVED_FOR_PILOT`.

**Acceptance:**

- hard-excluded category cannot be published by API bypass;
- changing category/zone pack invalidates or re-reviews affected listings deterministically;
- product-safety case can disable/remove affected listings without deleting audit evidence;
- no product is called government-certified merely because DROPi approved it for the pilot.

---

### RO-IMP-P0-03 — Pre-Contract Marketplace Disclosure + Immutable Contract Snapshot

**Class:** `LAUNCH-P0 / HOLD-LEGAL until #494 approved for design`

**Purpose:** make the binding checkout reproducible and legally versioned.

**Inputs:** `RO_LAUNCH_MARKETPLACE_CONTROL_CONTRACT_2026-09-15.md`.

**Required implementation:**

- `RankingDisclosureVersion`;
- professional seller-status disclosure;
- `ResponsibilityAllocationVersion`;
- Romanian contractual-information rendering path;
- server-owned `bindingCheckoutGate`;
- immutable `ContractSnapshot` containing seller, product/info/safety versions, price/currency/fee components, fulfilment role, terms, withdrawal/legal-pack versions;
- unambiguous payment-obligation action at binding checkout.

**Fail-closed invariant:** client rendering cannot create a binding order when server evidence/disclosure versions are missing, expired or incompatible.

**Acceptance:**

- exact transaction can be reconstructed from immutable/versioned evidence;
- old order remains tied to its original terms/legal pack after later policy updates;
- API bypass of required disclosure/gate fails;
- Romanian launch surfaces do not depend on English-only contractual text.

---

### RO-IMP-P0-04 — Online Withdrawal, Return, Conformity and Refund Orchestration

**Class:** `LAUNCH-P0 / HOLD-LEGAL until #494/#495/#498 responsibility matrix`

**Purpose:** implement the 2026 online withdrawal function and keep withdrawal, conformity and payment reversal as distinct but linked workflows.

**Inputs:**

- OUG 34/2014 Article 11^1 design contract from #494;
- seller/DROPi responsibility allocation;
- selected PSP refund contract from #495;
- data/support rules from #498.

**Required implementation:**

- persistent order-level withdrawal action for eligible contracts;
- `WithdrawalRequest` and confirmation action;
- durable acknowledgement evidence with content/date/time;
- eligibility/exception evidence rather than UI guesses;
- separate `RETURN`, `CONFORMITY`, `REFUND` states/cases;
- PSP reversal request linked to correct financial components;
- immutable audit timeline.

**Fail-closed invariant:** `contact support` is not the withdrawal mechanism and `refund=true` is not a complete legal state machine.

**Acceptance:**

- eligible user can exercise withdrawal without contacting support;
- acknowledgement evidence is generated and traceable;
- duplicate submission is idempotent;
- refund failure does not falsely close the withdrawal/conformity case;
- merchant/DROPi/PSP obligations remain separately attributable.

---

### RO-IMP-P0-05 — External PSP Transaction / Settlement / Reconciliation Core

**Class:** `LAUNCH-P0 / HOLD-LEGAL + HOLD-PROVIDER until #495 provider decision`

**Purpose:** implement real payments without an internal customer wallet.

**Inputs:**

- approved #495 `PaymentProviderProfile`;
- selected provider contract;
- accountant-approved money-flow/invoice matrix.

**Required implementation:**

- provider abstraction only to the degree required by selected first provider + replacement seam;
- merchant/provider account references;
- product/platform/optional postal component allocation;
- transaction authorization/capture state;
- settlement/reconciliation evidence;
- refund/partial refund/chargeback/negative-balance references;
- signed/verified webhook and idempotency contract;
- no card secret storage beyond approved PSP integration scope;
- no customer balance/stored-value ledger.

**Fail-closed invariant:** PSP uncertainty cannot become `paid/settled` and platform DB state cannot override provider financial truth without reconciliation evidence.

**Acceptance:**

- duplicate webhook/retry cannot duplicate money effects;
- merchant/platform components reconcile independently;
- failed/unknown settlement remains explicit;
- refund reverses correct economic components;
- internal wallet is not a prerequisite.

---

### RO-IMP-P0-06 — Merchant-Managed Fulfilment Contract

**Class:** `LAUNCH-P0 / Model A only`

**Purpose:** complete first orders without representing DROPi as an unapproved postal reseller/provider.

**Inputs:** `RO_LAUNCH_POSTAL_ROLE_DECISION_CONTRACT_2026-09-15.md` Model A and final #498 data/support allocation.

**Required implementation:**

- `fulfilmentRole = MERCHANT_MANAGED_FULFILMENT`;
- merchant-declared fulfilment method and truthfully known carrier/tracking reference when available;
- fulfilment evidence/status timeline;
- customer-facing wording that does not call an external merchant-selected provider `DROPi courier`;
- no DROPi postal fee under Model A;
- data sharing limited to the approved merchant/carrier flow.

**Fail-closed invariant:** absence of a DROPi postal role never silently turns into postal resale or proprietary fleet assignment.

**Acceptance:**

- order can complete using merchant-managed fulfilment without #258/#259 own-fleet registry;
- no synthetic transport mode/vehicle is required;
- carrier/tracking fields remain optional and evidence-backed;
- Model C fields cannot be populated/enabled through Model A APIs.

---

### RO-IMP-P0-07 — Production Privacy / Retention / Rights / Support Enforcement

**Class:** `LAUNCH-P0 / HOLD-LEGAL until #498 approved values`

**Purpose:** enforce the flow-specific data contract and prevent future-service data sprawl.

**Inputs:** `RO_LAUNCH_DATA_FLOW_RETENTION_SUPPORT_CONTRACT_2026-09-15.md` plus approved roles/legal bases/retention/DPIA/vendor profiles.

**Required implementation:**

- `DataFlowRoleProfile`, `LegalBasisProfile`, `RetentionPolicy` or equivalent canonical policy source;
- restricted field/access scopes and immutable privileged-access audit;
- account closure -> delete/restrict/legal-hold state machine;
- privacy-rights request case;
- breach/incident case with awareness/deadline evidence;
- vendor data profile and transfer state;
- specialized cases: withdrawal, conformity, payment, product safety, DSA, privacy, security;
- first-pilot collection allowlist that excludes later-service sensitive datasets.

**Fail-closed invariant:** missing legal basis/role/retention policy for a production field blocks or minimizes that processing rather than defaulting to consent/indefinite storage.

**Acceptance:**

- deleting an account does not destroy active legal-hold evidence and does not retain unrelated data indefinitely;
- an ordinary admin cannot read every restricted record by role name alone;
- later-service data families are absent/disabled in the first-pilot collection path;
- every retained post-closure field has an evidence-backed reason/profile.

---

### RO-IMP-P0-08 — Launch Legal / Contact / Policy Surfaces

**Class:** `LAUNCH-P0 / HOLD-LEGAL for final text`

**Purpose:** provide the public/contract surfaces required for the actual approved first pilot without publishing future or invented capabilities.

**Inputs:** #493–#498 approved public wording/responsibility matrix.

**Required implementation:**

- Romanian customer terms and merchant terms references;
- privacy information/rights contact;
- Marketplace responsibility disclosure;
- product-safety contact;
- DSA contact/notice path where applicable;
- complaint/withdrawal/conformity routes;
- legal entity/trader/platform identification;
- public fulfilment role wording;
- version/effective dates and durable contract evidence.

**Fail-closed invariant:** unpublished/unapproved text cannot be replaced with AI/demo filler in production.

**Acceptance:**

- public/current text versions match the transaction snapshots;
- no claim that P2P, own couriers, Passenger Mobility, drones, Cooperative Hub, C2/C3 or wallet/token are live;
- contacts/routes are actionable and tested;
- legal pages are Romanian-first for the Romania pilot while optional translations remain secondary.

---

### RO-IMP-P0-09 — Controlled Pilot E2E, Release and Rollback Gate

**Class:** `LAUNCH-P0`

**Purpose:** prove the exact first-loop product under a bounded cohort before any broader exposure.

**Depends on:** RO-IMP-P0-01..08 plus scoped existing CI/account/governance issues.

**Required scenario:**

```text
real account
-> approved professional merchant
-> approved product/category/zone
-> listing publication
-> customer discovery
-> pre-contract disclosures
-> binding contract snapshot
-> external PSP transaction
-> merchant acceptance/fulfilment
-> completion
-> withdrawal/refund case
-> support/privacy/safety case smoke tests
-> reconciliation
```

**Required negative scenarios:**

- unknown merchant evidence;
- excluded category;
- outside zone;
- stale legal pack;
- failed PSP/webhook;
- duplicate webhook/refund;
- missing fulfilment evidence;
- withdrawal duplicate/failure;
- restricted-data unauthorized access;
- product-safety disable/recall path;
- service kill switch/rollback.

**Acceptance:**

- source CI PASS on exact head;
- deployed/runtime smoke evidence;
- Android owner acceptance for affected app surfaces;
- money reconciliation evidence;
- audit reconstructs transaction and post-order cases;
- rollback/kill switch preserves financial/legal evidence;
- cohort/category/zone caps enforced server-side;
- owner receives explicit go/no-go evidence packet.

## 3. Optional P0/P1 integrated postal upgrade

Create only if Product Owner selects Model C for the first pilot **after** #496 approval:

### RO-IMP-POST-01 — DROPi Postal Resale Capability

**Class:** `LAUNCH-P0 only if first-pilot selected; otherwise LAUNCH-P1 / HOLD-LEGAL`

Required activation inputs:

- effective ANCOM notification/right evidence;
- selected postal services;
- verified effective provider(s);
- active written resale contract(s);
- customer postal terms/tariff/complaint/compensation matrix;
- effective/collecting-provider disclosures;
- approved postal tax/invoice/privacy flow.

No implementation may reuse Model A as proof of Model C authority.

## 4. Explicitly not created as launch P0

Do not create new P0 slices for:

- P2P/private seller activation;
- food or higher-risk categories;
- internal wallet/stored value/token;
- own delivery fleet;
- driver/rider onboarding;
- real-time own-fleet map;
- DronePort/transfer/battery infrastructure;
- Passenger Mobility;
- C2/C3;
- Cooperative Hub implementation;
- drone delivery.

Those remain independently preserved roadmap capabilities.

## 5. Candidate dependency graph

```text
#476 + #401 + scoped foundation
        |
        v
#493/#494/#497/#498 evidence decisions
        |
        +--> P0-01 merchant capability
        +--> P0-02 category/zone/GPSR
        +--> P0-03 legal checkout/snapshot
        +--> P0-07 privacy/support enforcement
        |
#495 provider decision --> P0-05 PSP core
        |
#496 Model A boundary --> P0-06 merchant fulfilment
        |
P0-03 + #494/#495/#498 --> P0-04 withdrawal/refund
        |
P0-01..07 --> P0-08 public/legal surfaces
        |
P0-01..08 --> P0-09 controlled E2E/release gate
        |
        v
later operational owner go/no-go
```

#501 remains the gate for promoting this candidate decomposition into the canonical implementation backlog. Public commercial launch requires a later operational/legal readiness decision after implementation evidence; it is not granted by #501 alone.
