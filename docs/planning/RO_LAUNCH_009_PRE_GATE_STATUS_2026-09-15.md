# RO-LAUNCH-009 — Pre-Gate Status Matrix

> **STATUS: PRE-GATE / NO FINAL OWNER OUTCOME RECORDED**
> **As of:** 2026-09-15
> **Issue:** #501
> **Parent:** #492
> **Legal evidence PR:** #504
> **Candidate backlog PR:** #505

This document prepares the final #501 review without prematurely recording either `AUTHORIZE IMPLEMENTATION REPRIORITIZATION` or `HOLD / REWORK`.

A green CI result proves repository consistency; it does not make an unresolved legal, tax, provider or authority decision valid.

## 1. Workstream readiness matrix

| Workstream | Evidence currently available | Current disposition | What still blocks final #501 disposition |
|---|---|---|---|
| #493 Entity / tax / CAEN / seller-of-record | consolidated entity decision register; official Ireland tax/treaty and ONRC CAEN research | `NOT YET VALIDATED` | actual management facts; Romanian/Irish tax/accounting review; final entity/CAEN/VAT/e-Factura/invoice/seller-role matrix |
| #494 Marketplace legal/control pack | detailed Marketplace control contract; OUG 34/2014/OUG 18/2026, DSA, Law 50/2024, GPSR mappings | `CONTROL CONTRACT READY FOR REVIEW / LAW-DEPENDENT ENABLEMENT DISABLED` | final factual DSA classification/applicability; qualified responsibility wording; controlled/current source completion where pending |
| #495 PSP / settlement / invoicing | external-PSP/no-wallet architecture; provider-owned shortlist and 18-question provider questionnaire | `PSP SHORTLIST IDENTIFIED / LIVE CHARGING DISABLED` | provider selection; provider underwriting/contract; payment-law and accountant approval of exact money/invoice/refund/chargeback flow |
| #496 Postal role / ANCOM | four-role fail-closed decision contract | `MODEL A PLANNING BOUNDARY READY; MODELS B-C HOLD-LEGAL; MODEL D LATER` | final factual/authority interpretation for any integrated DROPi postal role; ANCOM evidence/contracts if Model C selected |
| #497 Product family / pilot zone | deny-by-default paper-goods candidate allowlist + GPSR gate; zone candidate | `OWNER DECISION REQUIRED / PRODUCT ACTIVATION DISABLED` | final owner category/zone choice; category-specific review; pilot caps/access model |
| #498 Contracts / privacy / retention / support | data-flow/legal-basis/retention/DPIA/vendor/support architecture | `ARCHITECTURE READY FOR REVIEW / VALUES TBD` | final controller/processor roles, legal bases, retention periods, DPIA outcome, vendor contracts, support responsibility matrix |
| #499 Controlled legal corpus | 47 source records / 22 immutable files; source register, traceability, blockers, review packet, control contracts; latest legal/privacy CI PASS | `CORPUS MECHANICALLY CONSISTENT / PRE-COUNSEL` | pending controlled source copies and professional/authority/provider review where expressly required |
| #500 Engineering backlog reconciliation | candidate queue + complete pre-gate P0 decomposition + Owner decision packet | `CANDIDATE / PRE-OWNER / NON-CANONICAL` | final Owner/evidence gates; authorization to mutate/reprioritize canonical backlog |

## 2. Repository evidence state

PR #504 latest validated normal head:

`08e2422c169d82fce1763b16ef847937d2cab8b6`

Checks:

- `Validate Legal Source Corpus` — PASS;
- `Validate Privacy controls` — PASS;
- `Validate Privacy rights reporting` — PASS.

This establishes that the current legal corpus is mechanically self-consistent under repository controls.

It does **not** establish professional approval or commercial launch readiness.

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
- regression tests proving `UNKNOWN`, expired, absent or suspended evidence fails closed.

Law-dependent public wording, live payment behavior, final data retention, postal resale and category/zone activation remain blocked by their individual gates.

## 4. Owner decisions needed before final #501 review

From `RO_LAUNCH_OWNER_DECISIONS_PRE_GATE_2026-09-15.md`:

- final first product family;
- final pilot geography;
- final first-pilot fulfilment ambition: merchant-managed only versus postal resale included;
- selected PSP process/provider path after provider comparison;
- pilot access model;
- merchant/SKU/order/value/duration caps.

The broader narrow-MVP planning direction is retained, but these specific choices are not inferred from a generic `continue` instruction.

## 5. External/professional evidence still required

The following cannot be converted into PASS by Product Owner or engineering preference alone:

- Romania/Ireland corporate tax-residence/effective-management conclusion;
- VAT/e-Factura/invoice allocation;
- final DSA classification and applicable obligation set;
- exact consumer responsibility allocation where legal duties are actor-specific;
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

- the technical/legal corpus is now structured and CI-valid;
- the implementation queue is fully precomposed;
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
