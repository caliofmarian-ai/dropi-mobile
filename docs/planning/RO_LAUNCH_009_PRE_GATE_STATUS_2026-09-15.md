# RO-LAUNCH-009 — Pre-Gate Status Matrix

> **STATUS: PRE-GATE / NO FINAL OWNER OUTCOME RECORDED**
> **As of:** 2026-09-16
> **Issue:** #501
> **Parent:** #492
> **Legal evidence PR:** #504
> **Candidate backlog PR:** #505

This document prepares the final #501 review without prematurely recording either `AUTHORIZE IMPLEMENTATION REPRIORITIZATION` or `HOLD / REWORK`.

A green CI result proves repository consistency; it does not make an unresolved legal, tax, provider or authority decision valid.

The 2026-09-16 planning sync also consumes `RO_LAUNCH_CROSSCUTTING_IMPLEMENTATION_ADDENDUM_PRE_GATE_2026-09-16.md`, which adds P2B, DAC7, accessibility and packaging/EPR gates without converting them into approvals.

## 1. Workstream readiness matrix

| Workstream | Evidence currently available | Current disposition | What still blocks final #501 disposition |
|---|---|---|---|
| #493 Entity / tax / CAEN / seller-of-record | consolidated entity decision register; official Ireland tax/treaty and ONRC CAEN research | `NOT YET VALIDATED` | actual management facts; Romanian/Irish tax/accounting review; final entity/CAEN/VAT/e-Factura/invoice/seller-role matrix |
| #494 Marketplace legal/control pack | detailed Marketplace control contract; OUG 34/2014/OUG 18/2026, DSA, Law 50/2024, GPSR mappings; P2B cross-cutting contract now linked | `CONTROL CONTRACT READY FOR REVIEW / LAW-DEPENDENT ENABLEMENT DISABLED` | final factual DSA/P2B classification/applicability; qualified responsibility/merchant Terms wording; controlled/current source completion where pending |
| #495 PSP / settlement / invoicing | external-PSP/no-wallet architecture; provider shortlist; payment authority/money-flow control contract | `PSP SHORTLIST IDENTIFIED / LIVE CHARGING DISABLED` | provider selection; competent-NCA/passport evidence; provider underwriting/contract; payment-law and accountant approval of exact money/invoice/refund/chargeback flow |
| #496 Postal role / ANCOM | four-role fail-closed decision contract | `MODEL A PLANNING BOUNDARY READY; MODELS B-C HOLD-LEGAL; MODEL D LATER` | final factual/authority interpretation for any integrated DROPi postal role; ANCOM evidence/contracts if Model C selected |
| #497 Product family / pilot zone | deny-by-default paper-goods candidate allowlist + GPSR gate; zone candidate; packaging responsibility contract now linked | `OWNER DECISION REQUIRED / PRODUCT ACTIVATION DISABLED` | final owner category/zone choice; category-specific review; packaging/EPR actor matrix; pilot caps/access model |
| #498 Contracts / privacy / retention / support | data-flow/legal-basis/retention/DPIA/vendor/support architecture; DAC7-specific purpose is explicitly gated | `ARCHITECTURE READY FOR REVIEW / VALUES TBD` | final controller/processor roles, legal bases, retention periods, DPIA outcome, vendor contracts, support responsibility matrix; DAC7 purpose/retention only if applicability approved |
| Cross-cutting P2B / DAC7 / accessibility / packaging | dedicated legal control contract + source families + planning addendum | `SAFE FOUNDATION DESIGN IDENTIFIED / PUBLIC ACTIVATION BLOCKED` | approved P2B applicability/merchant Terms matrix; DAC7 platform/operator/seller/jurisdiction decision; accessibility applicability/exemption evidence; packaging/EPR role matrix |
| #499 Controlled legal corpus | 86 source records / 34 immutable files; source register, traceability, blockers, review packet, control contracts; latest legal/privacy CI PASS | `CORPUS MECHANICALLY CONSISTENT / PRE-COUNSEL` | pending controlled source copies and professional/authority/provider review where expressly required |
| #500 Engineering backlog reconciliation | candidate queue + complete pre-gate P0 decomposition + cross-cutting implementation addendum + Owner decision packet | `CANDIDATE / PRE-OWNER / NON-CANONICAL` | final Owner/evidence gates; authorization to mutate/reprioritize canonical backlog |

## 2. Repository evidence state

PR #504 latest validated normal head after the 2026-09-16 cross-cutting integration/cleanup batch:

`d2ed7bd39f220663d5d6da8f03a2361b2e478493`

Checks:

- `Validate Legal Source Corpus` — PASS;
- `Validate Privacy controls` — PASS;
- `Validate Privacy rights reporting` — PASS.

The legal-source validator has already established the current source baseline as `86 records / 34 immutable files`.

This establishes that the current legal corpus is mechanically self-consistent under repository controls.

It does **not** establish professional approval, #501 authorization or commercial launch readiness.

## 3. What can already be implemented safely in principle

Subject to owner backlog authorization, the following **foundation mechanics** can be implemented without pretending unresolved legal values are known:

- versioned evidence/provenance records;
- deny-by-default capability evaluator;
- explicit merchant/listing/category/zone states;
- immutable contract/event snapshots;
- effective-date legal-pack selector;
- separation of merchant fulfilment from DROPi postal roles;
- payment provider interface/reconciliation data structures without live provider charging or internal wallet;
- privacy role/legal-basis/retention policy engines where unresolved values remain non-activatable;
- restricted-access/audit/legal-hold mechanics;
- versioned P2B applicability/merchant Terms/reason-coded merchant-decision machinery with final legal values disabled;
- neutral DAC7 platform/seller/reporting-period evidence schemas with DAC7-specific mandatory collection/filing disabled until approved;
- accessibility-compatible components/forms/navigation/auth/checkout/withdrawal/support plus regression evidence, while legal exemption/applicability remains separately evidenced;
- packaging responsibility/evidence profiles with unknown actors failing closed;
- regression tests proving `UNKNOWN`, expired, absent or suspended evidence fails closed.

Law-dependent public wording, live payment behavior, final data retention, DAC7 reporting, accessibility-exemption claims, packaging/EPR role claims, postal resale and category/zone activation remain blocked by their individual gates.

## 4. Owner decisions needed before final #501 review

From `RO_LAUNCH_OWNER_DECISIONS_PRE_GATE_2026-09-15.md`:

- final first product family;
- final pilot geography;
- final first-pilot fulfilment ambition: merchant-managed only versus postal resale included;
- selected PSP process/provider path after provider comparison;
- pilot access model;
- merchant/SKU/order/value/duration caps.

The broader narrow-MVP planning direction is retained, but these specific choices are not inferred from a generic `continue` instruction.

P2B, DAC7, accessibility and packaging applicability are not Product Owner preference questions; the owner may choose a commercial scope, but cannot turn a legally unresolved row into PASS by preference.

## 5. External/professional evidence still required

The following cannot be converted into PASS by Product Owner or engineering preference alone:

- Romania/Ireland corporate tax-residence/management conclusion under the current treaty/MLI framework;
- VAT/e-Factura/invoice allocation;
- final DSA classification and applicable obligation set;
- exact consumer responsibility allocation where legal duties are actor-specific;
- P2B service/business-user applicability and final merchant Terms/restriction/complaint/mediation matrix;
- DAC7 platform/operator/activity/seller/reporting-jurisdiction classification and associated privacy/retention treatment;
- accessibility applicability and any evidence-backed microenterprise service exemption;
- packaging/EPR actor matrix and any required registration/evidence/labelling obligations;
- selected PSP regulated/commercial responsibility contract;
- postal resale authority/notification/contracts if selected;
- exact privacy roles/legal bases/retention/DPIA/vendor arrangements;
- category-specific sufficiency of the first allowlist.

## 6. Current #501 gate position

As of this checkpoint:

```text
FINAL #501 OUTCOME = NOT YET RECORDED
```

Reason:

- the technical/legal corpus is structured and CI-valid;
- the implementation queue plus cross-cutting addendum is precomposed;
- several material owner decisions remain open;
- several professional/provider/authority conclusions remain `NOT YET VALIDATED`.

The next legitimate #501 review should occur after the open Owner decisions are recorded and each external evidence gap has either:

1. sufficient disposition for the bounded implementation being authorized; or
2. an explicit `NOT YET VALIDATED` state that keeps that feature out of the authorized implementation slice.

No unresolved item may become implicit PASS.

## 7. Important distinction

Even a future #501 outcome of:

`AUTHORIZE IMPLEMENTATION REPRIORITIZATION`

would authorize only creation/execution of the bounded implementation backlog under its fail-closed gates.

It would **not** authorize public commercial launch, which requires implemented/tested controls, signed/provider contracts, filings/authority evidence where applicable, privacy/security assurance, production runtime evidence and a later operational owner go/no-go.
