# RO-LAUNCH-009 — Pre-Gate Status Matrix

> **STATUS: PRE-GATE / NO FINAL OWNER OUTCOME RECORDED**
> **As of:** 2026-09-16
> **Issue:** #501
> **Parent:** #492
> **Legal evidence PR:** #504
> **Candidate backlog PR:** #505

This document prepares the final #501 review without prematurely recording either `AUTHORIZE IMPLEMENTATION REPRIORITIZATION` or `HOLD / REWORK`.

A green CI result proves repository consistency; it does not make an unresolved legal, tax, provider or authority decision valid.

The 2026-09-16 planning sync consumes `RO_LAUNCH_CROSSCUTTING_IMPLEMENTATION_ADDENDUM_PRE_GATE_2026-09-16.md`, the v1.1 cross-cutting legal contract and the exact applicability worksheet. These narrow P2B, DAC7, accessibility and packaging/PPWR states without converting them into launch approvals.

## 1. Workstream readiness matrix

| Workstream | Evidence currently available | Current disposition | What still blocks final #501 disposition |
|---|---|---|---|
| #493 Entity / tax / CAEN / seller-of-record | consolidated entity decision register; official Ireland tax/treaty and ONRC CAEN research | `NOT YET VALIDATED` | actual management facts; Romanian/Irish tax/accounting review; final entity/CAEN/VAT/e-Factura/invoice/seller-role matrix |
| #494 Marketplace legal/control pack | consumer/Marketplace control contract; OUG 34/2014/OUG 18/2026, DSA, Law 50/2024, GPSR and cross-cutting P2B/PPWR evidence | `CONTROL CONTRACT READY FOR REVIEW / LAW-DEPENDENT ENABLEMENT DISABLED` | final DSA classification including Section 4 state; qualified responsibility/consumer/P2B wording; remaining pending controlled source copies |
| #495 PSP / settlement / invoicing | external-PSP/no-wallet architecture; provider shortlist; payment authority/money-flow control contract | `PSP SHORTLIST IDENTIFIED / LIVE CHARGING DISABLED` | provider selection; competent-NCA/passport evidence; provider underwriting/contract; payment-law/accountant approval of exact money/invoice/refund/chargeback flow |
| #496 Postal role / ANCOM | four-role fail-closed decision contract | `MODEL A PLANNING BOUNDARY READY; MODELS B-C HOLD-LEGAL; MODEL D LATER` | final factual/authority interpretation for any integrated DROPi postal role; ANCOM evidence/contracts if Model C selected |
| #497 Product family / pilot zone | deny-by-default paper-goods candidate allowlist + GPSR gate; zone candidate; packaging producer/EPR + PPWR platform profiles | `OWNER DECISION REQUIRED / PRODUCT ACTIVATION DISABLED` | final owner category/zone choice; category-specific review; packaging/EPR actor matrix; PPWR platform-scope result; pilot caps/access model |
| #498 Contracts / privacy / retention / support | data-flow/legal-basis/retention/DPIA/vendor/support architecture; DAC7 purpose explicitly gated | `ARCHITECTURE READY FOR REVIEW / VALUES TBD` | final controller/processor roles, legal bases, retention periods, DPIA outcome, vendor contracts, support responsibility matrix; DAC7 purpose/retention only if reporting applicability approved |
| P2B | v1.1 legal contract + exact applicability worksheet + SME definition evidence | `LIKELY_IN_SCOPE / FINAL APPROVAL PENDING` | final service/business-user classification; merchant Terms matrix; obligation-specific Article 11/12 size-exception evidence/review |
| DAC7 | current consolidated DAC 2026 + Romanian 2023/2025/2026 source family + ANAF procedure evidence | `PLATFORM OPERATOR CANDIDATE LIKELY / REPORTING OPERATOR+JURISDICTION NOT VALIDATED` | final entity/nexus; Reporting Platform Operator/exclusion decision; seller classifier; current registration/reporting/privacy matrix |
| Accessibility | Law 232/2022/EAA + exact e-commerce-service analysis | `E-COMMERCE SCOPE IDENTIFIED / MICROENTERPRISE EXEMPTION EVIDENCE PENDING` | actual `<10 / EUR 2m` statutory size evidence/aggregation; final exemption/applicable release-control matrix |
| Packaging / PPWR | PPWR + Commission 2026 guidance + Romanian packaging/Environmental Fund source chain | `PPWR PLATFORM SCOPE NOT VALIDATED / PACKAGING EPR ACTOR NOT VALIDATED` | DSA Section 4/PPWR interaction; producer registration/self-certification verification profile if applicable; exact packaging/EPR actor matrix |
| #499 Controlled legal corpus | 93 source records / 37 immutable files; source register, traceability, blockers, contracts, applicability worksheet, review packets | `CORPUS MECHANICALLY CONSISTENT / PRE-COUNSEL` | pending controlled source copies and professional/authority/provider review where expressly required |
| #500 Engineering backlog reconciliation | candidate queue + complete pre-gate P0 decomposition + updated cross-cutting implementation addendum + Owner decision packet | `CANDIDATE / PRE-OWNER / NON-CANONICAL` | final Owner/evidence gates; authorization to mutate/reprioritize canonical backlog; separate 34-issue materialization-drift reconciliation |

## 2. Repository evidence state

PR #504 validated head:

`1b6dd6f67ac4742dd95fe0ea06c6383afa0253fe`

Checks:

- `Validate Legal Source Corpus` — **PASS**;
- `Validate Privacy controls` — **PASS**;
- `Validate Privacy rights reporting` — **PASS**.

The source validator reports:

`Legal source validation passed: 93 records, 37 immutable files.`

This establishes that the current legal corpus is mechanically self-consistent under repository controls.

It does **not** establish professional approval, #501 authorization or commercial launch readiness.

## 3. Planning-materialization governance state

PR #505's planning unit/shape validation previously established:

- planning unit tests: `37/37 PASS`;
- plan shape: `228 issues / 212 labels / 7 milestones PASS`.

The read-only live materialization comparison exposed `34` label mismatches versus the older generated plan. Representative example: stable ID `PHASE-M2` expected `status:ready` in the old plan while live issue #63 is legitimately closed as `status:completed` after later work.

Therefore:

```text
MATERIALIZATION_EQUALITY = NOT_CURRENTLY_CERTIFIED
LIVE_PROGRESS_ROLLBACK = PROHIBITED
VALIDATOR_WEAKENING_TO_FORCE_GREEN = PROHIBITED
RECONCILIATION = REQUIRED_AS_SEPARATE_GOVERNANCE_TASK
```

This drift is distinct from the legal launch gates and does not turn either category into PASS.

## 4. What can already be implemented safely in principle

Subject to explicit owner backlog authorization, safe foundation mechanics include:

- versioned evidence/provenance records;
- deny-by-default capability evaluator;
- explicit merchant/listing/category/zone states;
- immutable contract/event snapshots;
- effective-date legal-pack selector;
- separation of merchant fulfilment from DROPi postal roles;
- payment-provider interface/reconciliation structures without live charging/internal wallet;
- privacy role/legal-basis/retention engines with unresolved values non-activatable;
- restricted-access/audit/legal-hold mechanics;
- P2B Terms/notices/reason-coded merchant-decision machinery;
- domain-specific enterprise-size evidence rather than one `smallCompany` boolean;
- neutral DAC7 operator/seller/reporting-period structures with mandatory tax collection/filing disabled;
- accessibility-compatible auth/navigation/forms/checkout/withdrawal/support plus regression evidence;
- separate packaging producer/EPR and PPWR online-platform verification profiles;
- regression tests proving `UNKNOWN`, expired, absent or suspended evidence fails closed.

Law-dependent public wording, live payment behavior, final retention, DAC7 reporting, accessibility exemption claims, PPWR producer activation, packaging/EPR role claims, postal resale and category/zone activation remain blocked by their individual gates.

## 5. Owner decisions needed before final #501 review

From `RO_LAUNCH_OWNER_DECISIONS_PRE_GATE_2026-09-15.md`:

- final first product family;
- final pilot geography;
- final first-pilot fulfilment ambition: merchant-managed only versus postal resale included;
- selected PSP process/provider path after provider comparison;
- pilot access model;
- merchant/SKU/order/value/duration caps.

The broader narrow-MVP planning direction is retained, but these specific choices are not inferred from a generic `continue` instruction.

P2B, DAC7, accessibility, PPWR and packaging/EPR applicability are not Product Owner preference questions; commercial scope may be chosen, but unresolved legal/tax evidence cannot be converted to PASS by preference.

## 6. External/professional evidence still required

The following cannot be converted into PASS by Product Owner or engineering preference alone:

- Romania/Ireland corporate tax-residence/management conclusion under the current treaty/MLI framework;
- VAT/e-Factura/invoice allocation;
- final DSA classification and applicable obligation set, including Section 4 state relevant to PPWR;
- exact consumer responsibility allocation;
- final P2B classification/merchant Terms/restriction/complaint/mediation matrix and any size-exception evidence;
- DAC7 Reporting Platform Operator/activity/seller/reporting-jurisdiction classification and privacy/retention treatment;
- accessibility microenterprise exemption/applicable control matrix;
- PPWR online-platform verification scope;
- packaging/EPR actor matrix and required registration/evidence/labelling obligations;
- selected PSP regulated/commercial responsibility contract;
- postal resale authority/notification/contracts if selected;
- exact privacy roles/legal bases/retention/DPIA/vendor arrangements;
- category-specific sufficiency of the first allowlist.

## 7. Current #501 gate position

```text
FINAL #501 OUTCOME = NOT YET RECORDED
```

Reason:

- legal corpus is structured and CI-valid at `93 / 37`;
- implementation queue and cross-cutting addendum are precomposed;
- material owner decisions remain open;
- professional/provider/authority conclusions remain `NOT_YET_VALIDATED` where required;
- planning materialization has a separate stale-plan/live-progress reconciliation gap.

A future #501 review may authorize only a bounded implementation slice whose unresolved features remain disabled. No unresolved row may become implicit PASS.

## 8. Important distinction

Even a future #501 outcome of:

`AUTHORIZE IMPLEMENTATION REPRIORITIZATION`

would authorize only creation/execution of the bounded implementation backlog under fail-closed gates.

It would **not** authorize public commercial launch. Public launch still requires implemented/tested controls, provider/contracts/authority evidence, privacy/security assurance, production runtime/pilot evidence and a later operational owner go/no-go.
