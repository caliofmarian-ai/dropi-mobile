# DROPi Romania — Product Owner Pre-Gate Decision Packet

> **STATUS: PRE-GATE / NON-CANONICAL**
> **As of:** 2026-09-15
> **Parent:** #492
> **Backlog gate:** #500
> **Owner gate:** #501
> **Legal evidence:** PR #504
> **Candidate engineering queue:** PR #505

This packet separates decisions the Product Owner can make as commercial/product choices from conclusions that require legal, tax/accounting, authority or provider evidence.

A Product Owner choice does not convert an unresolved legal point into PASS. Conversely, a lawyer/accountant/provider should not silently choose DROPi's commercial scope.

## 1. Existing Product Owner direction retained for planning

The current project direction is to continue with the narrow Romanian legal-MVP path:

```text
professional merchants only
+ controlled C1 Marketplace
+ deliberately narrow low-complexity non-food catalog
+ merchant seller-of-record candidate
+ external regulated Marketplace PSP
+ no DROPi customer-fund wallet/stored value as first-launch prerequisite
+ merchant-managed fulfilment first
+ own DROPi delivery operations later
```

Status: `OWNER_DIRECTION_FOR_PLANNING`.

This remains subject to legal/accounting/provider validation for the exact implementation, but engineering planning no longer needs to assume the full DROPi ecosystem is a first-pilot prerequisite.

## 2. Decisions that remain explicitly open

### OD-RO-001 — Final first product family

**Research candidate:** `PAPER_STATIONERY_ART_PRINTS_SIMPLE_PAPER_GOODS`.

Candidate scope is defined in `RO_LAUNCH_PRODUCT_ALLOWLIST_GPSR_CONTRACT_2026-09-15.md` with deny-by-default exclusions.

Owner choices at the later gate:

- `SELECT PAPER-GOODS PILOT`;
- `SELECT ANOTHER LOW-COMPLEXITY FAMILY` — requires new category comparison/control pack;
- `HOLD CATEGORY`.

Current state: `OWNER_DECISION_REQUIRED + CATEGORY_REVIEW_REQUIRED`.

No public product activation from this candidate state.

### OD-RO-002 — Final pilot geography

**Research candidate:** `BUCHAREST_ILFOV_CONTROLLED_PILOT`.

The recommendation is intentionally not a national launch. The pilot should have an explicit boundary and activation version.

Owner choices:

- `SELECT BUCHAREST_ILFOV_CONTROLLED_PILOT`;
- `SELECT OTHER ROMANIAN PILOT ZONE` — triggers local/operational re-evaluation;
- `HOLD ZONE`.

Current state: `OWNER_DECISION_REQUIRED`.

### OD-RO-003 — First-pilot fulfilment ambition

Two practical launch choices remain:

**Option A — merchant-managed fulfilment first**

- lowest-assumption path;
- DROPi Marketplace proves merchant/customer/payment/order loop without representing an unapproved DROPi postal service;
- postal resale can be added later under a separate gate.

**Option C — include DROPi postal resale in the first pilot**

- only after #496 receives sufficient classification/ANCOM/contract evidence;
- adds notification/authority, provider contract, customer postal terms, provider disclosure, complaints/compensation, tax/invoicing and privacy dependencies.

Current planning default: `OPTION_A / MERCHANT_MANAGED_FULFILMENT_FIRST`.

Final state: `OWNER_DECISION_REQUIRED BEFORE CANONICAL REPRIORITIZATION`.

### OD-RO-004 — Marketplace PSP provider

Current shortlist from provider-owned evidence:

- PayU Marketplace;
- NETOPIA Marketplace;
- Stripe Connect;
- Adyen for Platforms;
- Mollie / Connect, pending exact Marketplace-flow confirmation.

Owner should not select by brand familiarity alone. Selection consumes the provider questionnaire in `RO_LAUNCH_003_PSP_CANDIDATE_MATRIX_2026-09-15.md` plus pricing/underwriting/commercial availability and the approved payment/tax model.

Owner outcomes:

- `SELECT <provider> SUBJECT TO CONTRACT/LEGAL ACCOUNTING REVIEW`;
- `RUN PROVIDER COMMERCIAL COMPARISON`;
- `HOLD PAYMENTS`.

Current state: `PROVIDER_SELECTION_PENDING`.

### OD-RO-005 — Controlled pilot scale caps

Caps are business-risk controls, not legal thresholds. They should start low enough that support, product-safety, refund and reconciliation evidence can be reviewed manually.

Decision fields:

```text
merchantCap
skuCapPerMerchant
totalActiveSkuCap
dailyOrderCap
totalPilotOrderCap
maxOrderValueRon
pilotDurationDays
invitedCustomerCap
```

No numeric value is being hard-coded here. A later owner choice should be informed by support capacity, PSP/carrier terms, merchant readiness and test evidence.

Current state: `OWNER_DECISION_REQUIRED`.

### OD-RO-006 — Pilot access model

Candidate choices:

- `INVITE_ONLY_CONTROLLED_PILOT` — only approved merchants/customers;
- `RESTRICTED_PUBLIC_PILOT` — public discovery/order only within active category/zone/caps;
- `INTERNAL/SYNTHETIC ONLY` — no real consumer transactions yet.

Current research posture favors a controlled/invite-limited first transaction wave, but this is not automatically recorded as final.

Current state: `OWNER_DECISION_REQUIRED`.

## 3. Decisions that are NOT Product Owner substitutions for professional evidence

The owner may choose commercial direction, but these cannot become factual/legal PASS solely by owner instruction:

- Romania/Ireland corporate tax residence and effective-management consequences;
- VAT/e-Factura/fiscal-device/invoice treatment;
- final CAEN mapping where professional/ONRC confirmation is required;
- legal payment-service perimeter and exact PSP responsibility model;
- exact DSA classification/applicability;
- exact legal allocation of consumer withdrawal/conformity/refund obligations;
- GPSR/category-specific legal sufficiency;
- ANCOM classification/notification/right for postal resale;
- controller/processor roles, legal bases, final retention durations and DPIA outcome;
- contract clauses that purport to transfer statutory duties;
- provider licence/authority/contract status.

These remain `NOT YET VALIDATED` until their evidence gate is satisfied.

## 4. Safe owner decisions versus launch authorization

Three distinct approvals must never be conflated:

```text
OWNER PRODUCT DIRECTION
    != APPROVED FOR DESIGN
    != AUTHORIZED FOR PUBLIC COMMERCIAL LAUNCH
```

- Product direction chooses what DROPi wants to build/test.
- `APPROVED FOR DESIGN` requires the relevant evidence/interpretation for law-dependent semantics.
- public commercial launch requires implemented controls, contracts, PSP/carrier readiness, filings/authority evidence where applicable, privacy/security assurance, production tests and a later operational go/no-go.

## 5. Proposed owner-gate sequence

### Gate A — can be decided from product strategy

- professional merchants only for first pilot;
- no P2P/private sellers first pilot;
- external PSP/no internal customer wallet first pilot;
- merchant-managed fulfilment as the baseline first path;
- own fleet/Passenger Mobility/drone/Cooperative Hub/C2/C3 later.

These define the planning envelope.

### Gate B — select after the corresponding evidence packet is reviewed

- final product family;
- final pilot zone;
- pilot access/caps;
- selected PSP subject to approved provider/commercial/legal/accounting terms;
- whether to pull postal resale into first pilot or leave it P1.

### Gate C — #501 implementation reprioritization

Only after the legal/business decision matrix is complete enough to prevent engineering from inventing unresolved semantics, #501 may record exactly one:

- `AUTHORIZE IMPLEMENTATION REPRIORITIZATION`; or
- `HOLD / REWORK`.

This promotes the bounded P0 queue in PR #505; it is not launch authorization.

## 6. Current pre-gate recommendation for sequencing, not a final owner vote

To minimize dependencies while maximizing learning, the current candidate sequence is:

```text
professional merchants
-> paper-goods candidate pack
-> controlled Romanian zone
-> legal Marketplace checkout
-> external PSP
-> merchant-managed fulfilment
-> very small controlled transaction cohort
-> evidence/reconciliation/refund/withdrawal review
-> only then add integrated postal resale and broader categories/geography
```

This is the smallest architecture that can prove whether customers, merchants, checkout, money flow and fulfilment work together without first financing/authorizing DROPi's own delivery network.

## 7. Gate status today

| Decision/evidence | State |
|---|---|
| Narrow professional-merchant MVP direction | `OWNER_DIRECTION_FOR_PLANNING` |
| External PSP / no internal wallet prerequisite | `OWNER_DIRECTION_FOR_PLANNING` |
| Merchant-managed fulfilment baseline | `OWNER_DIRECTION_FOR_PLANNING / FINAL GATE PENDING` |
| Final product family | `OWNER_DECISION_REQUIRED` |
| Final pilot zone | `OWNER_DECISION_REQUIRED` |
| Pilot scale/access caps | `OWNER_DECISION_REQUIRED` |
| PSP provider | `PROVIDER_SELECTION_PENDING` |
| Entity/tax/invoice model | `NOT YET VALIDATED` |
| Marketplace/DSA/GPSR final applicability | `NOT YET VALIDATED` |
| Postal resale authority | `NOT YET VALIDATED` |
| Privacy/retention/DPIA final values | `NOT YET VALIDATED` |
| #501 implementation reprioritization | `NOT YET AUTHORIZED` |
| Public commercial launch | `NOT AUTHORIZED` |
