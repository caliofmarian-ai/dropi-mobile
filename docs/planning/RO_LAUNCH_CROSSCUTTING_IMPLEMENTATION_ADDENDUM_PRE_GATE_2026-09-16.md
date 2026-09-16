# DROPi Romania — Cross-Cutting Implementation Addendum (Pre-Gate)

> **STATUS: CANDIDATE / PRE-OWNER / NON-CANONICAL / FAIL-CLOSED**
> **As of:** 2026-09-16
> **Parent:** #500 / #492
> **Legal evidence:** PR #504
> **Planning PR:** #505
> **Depends on:** `docs/legal/RO_LAUNCH_PLATFORM_BUSINESS_TAX_ACCESSIBILITY_PACKAGING_CONTRACT_2026-09-16.md`

This addendum extends the existing Romania launch candidate queue and P0 decomposition with four cross-cutting domains discovered/materialized after the original 2026-09-15 planning pass:

1. platform-to-business (P2B) merchant relationship;
2. DAC7 platform/seller tax reporting;
3. e-commerce accessibility;
4. packaging / EPR / fulfilment responsibility.

It does **not** authorize implementation reprioritization, public merchant activation, tax reporting, packaging-role claims or a legal exemption. It defines safe foundation work and the exact fail-closed gates that later implementation must consume if #501 authorizes backlog reprioritization.

## 1. Why this is an addendum rather than four new product epics

These domains cut across the already-defined P0 slices. Creating four independent launch epics would encourage duplicated merchant, checkout, privacy and fulfilment state.

The correct relationship is:

```text
existing P0 slice
+ cross-cutting applicability profile
+ evidence-backed legal/operational values
+ fail-closed activation gate
```

No existing slice may treat the absence of a cross-cutting decision as PASS.

## 2. P2B mapping

Primary existing slice:

- `RO-IMP-P0-01` — Professional Merchant Marketplace Capability.

Secondary consumers:

- `RO-IMP-P0-03` — Pre-Contract Disclosures + Immutable ContractSnapshot;
- `RO-IMP-P0-08` — Launch Legal / Contact / Policy Surfaces;
- `RO-IMP-P0-09` — Controlled Pilot E2E / Release / Rollback Gate.

### Safe foundation requirements

Engineering may implement, before final P2B applicability approval:

```text
P2bApplicabilityProfile
MerchantTermsVersion
MerchantPlatformDecision
```

The machinery must support:

- versioned merchant Terms;
- pre-contract availability evidence;
- Terms change notice/effective-date evidence;
- reason-coded `RESTRICT`, `SUSPEND`, `TERMINATE`, `RESTORE` decisions;
- grounds/evidence references;
- separate business-user ranking disclosure version;
- differentiated-treatment disclosure version;
- data-access/data-use disclosure version;
- optional complaint/mediation profiles whose activation depends on approved applicability;
- immutable audit attribution.

### P2B fail-closed rule

```text
if p2b_applicability_required_component == UNKNOWN
or required_merchant_terms_version != APPROVED
or required_notice_or_decision_evidence_missing:
    merchant_binding_capability = DENIED
```

`merchantVerified=true` is never a substitute for this gate.

### Law-dependent values that remain blocked

Do not hard-code:

- that every P2B obligation applies;
- that a small-enterprise state is a blanket exemption;
- final notice periods;
- final restriction/suspension/termination wording;
- final complaint/mediation duty;
- final ranking/data-access/differentiated-treatment text.

Those values come from the approved P2B applicability/merchant-terms matrix.

## 3. DAC7 mapping

Primary existing slices:

- `RO-IMP-P0-01` — Professional Merchant Marketplace Capability;
- `RO-IMP-P0-07` — Production Privacy / Retention / Rights / Support Enforcement.

Payment/reconciliation data may be referenced by:

- `RO-IMP-P0-05` — External PSP Transaction / Settlement / Reconciliation Core.

### Safe foundation requirements

Engineering may add neutral structures:

```text
Dac7PlatformApplicabilityProfile
Dac7SellerProfile
Dac7ReportingPeriod
```

Required design properties:

- platform/operator classification is separate from seller classification;
- seller `ENTITY` does not imply `EXCLUDED`;
- relevant-activity classification is versioned;
- Member State/reporting-jurisdiction decision is explicit;
- due-diligence evidence references are attributable;
- consideration/platform-fee/tax figures reference authoritative financial records rather than duplicated manually typed totals;
- filing schema/version, correction lifecycle and authority receipt are modeled as evidence;
- DAC7-purpose data is distinguishable from generic merchant-verification data.

### Collection gate

Until approved DAC7 applicability exists:

```text
dac7_specific_mandatory_collection = DISABLED
dac7_registration_state = NOT_AUTHORIZED
dac7_filing_state = NOT_AUTHORIZED
```

Fields already lawfully required for another approved purpose may exist, but engineering must not collect extra tax-reporting data “just in case”.

### Future activation prerequisites

Before enabling DAC7-specific collection/reporting:

- approved reporting-platform-operator decision;
- relevant-activity decision;
- reportable/excluded seller rules;
- reporting jurisdiction/registration route;
- current form/schema/deadline policy;
- privacy legal basis/notice/retention linkage;
- role-based access/audit controls;
- filing/correction/receipt evidence contract.

## 4. Accessibility mapping

Accessibility is cross-cutting across every customer/merchant surface, with first-launch emphasis on:

- `RO-IMP-P0-01` merchant onboarding/Terms;
- `RO-IMP-P0-03` listing/pre-contract/checkout;
- `RO-IMP-P0-04` withdrawal/returns/refunds;
- `RO-IMP-P0-08` legal/contact/policy surfaces;
- `RO-IMP-P0-09` release acceptance.

### Safe foundation requirements

Accessible foundation work is allowed even while statutory applicability/exemption remains unresolved.

The candidate implementation must support:

- semantic labels and control names;
- non-text alternatives where required;
- readable/scalable content and sufficient contrast;
- logical focus/navigation order;
- keyboard operability where applicable to the surface;
- screen-reader-compatible critical controls;
- accessible form labels, instructions, validation and error recovery;
- checkout/payment instructions not dependent solely on color, position or sound;
- accessible authentication/recovery;
- accessible withdrawal/return/support paths;
- regression evidence from automated checks plus manual assistive-technology/device verification.

### Provenance rule

Every accessibility acceptance row must identify whether it is:

```text
LAW_REQUIRED
DROPI_POLICY
BOTH
```

No UI may state `accessibilityNotRequired=true` merely because the company is new or expected to be small.

### Applicability gate

If a statutory microenterprise exemption is relied on later, store the exact enterprise-size evidence, service classification, source-pack version, approval and review trigger. Loss/change of qualifying status forces re-evaluation.

## 5. Packaging / EPR mapping

Primary existing slices:

- `RO-IMP-P0-02` — Category / Zone / Product-Safety Gate;
- `RO-IMP-P0-06` — Merchant-Managed Fulfilment Contract.

Secondary consumers:

- `RO-IMP-P0-01` merchant evidence capability;
- `RO-IMP-P0-09` release gate.

### Safe foundation requirements

Add a versioned:

```text
PackagingResponsibilityProfile
```

capable of separating:

- product packaging;
- grouped packaging;
- transport packaging;
- shipping/e-commerce packaging;
- producer/importer/distributor role;
- packer/fulfilment-service role;
- platform role;
- EPR-responsible actor;
- registration/environmental-fund evidence;
- required material/labelling/information evidence;
- legal-pack version and review date.

### Hard rule

```text
sellerOfRecord != automatic packaging producer
marketplaceProvider != automatic EPR responsible actor
merchantFulfilment != automatic no-DROPi-duty conclusion
```

The role derives from the actual product/import/packing/fulfilment facts and approved current source pack.

### First-pilot activation gate

A product/listing/merchant may become active only when the mandatory packaging row for the actual flow is resolved:

```text
packaging_roles_resolved
AND required_merchant_packaging_evidence_current
AND shipping_packaging_actor_resolved
AND applicable_registration_epr_state_resolved
AND required_information_labelling_resolved
AND legal_pack_current
```

If the first pilot remains merchant-managed fulfilment, the implementation must preserve that factual boundary. If DROPi later supplies packaging, warehouses, packs or fulfils goods, capability activation requires recalculation of the responsibility profile before rollout.

## 6. Combined merchant launch capability update

`RO-IMP-P0-01` must eventually aggregate the cross-cutting rows without flattening them into one compliance boolean.

Candidate aggregate:

```text
MerchantLaunchCapability {
  merchantIdentityState
  professionalSellerState
  p2bTermsState
  dac7SellerState
  paymentOnboardingState
  allowedCategoryState
  productSafetyState
  packagingState
  fulfilmentState
  privacyNoticeState
  contractVersionRefs[]
  approvalState
}
```

For any row designated mandatory by the approved launch pack:

```text
UNKNOWN | MISSING | EXPIRED | SUSPENDED => merchantLaunchCapability = DENIED
```

## 7. Checkout / ContractSnapshot consequences

`RO-IMP-P0-03` must not duplicate tax or merchant-platform documents into consumer checkout, but the transaction snapshot must reference the versions that control the transaction.

Where applicable, the snapshot/evidence chain must be able to reference:

- merchant capability version;
- merchant Terms/P2B version relevant to the seller-platform relationship;
- customer Terms;
- legal pack;
- ranking/responsibility disclosures;
- product safety profile;
- packaging responsibility/evidence pack version;
- accessibility release profile/version;
- payment-flow/provider profile;
- fulfilment role.

A consumer `ContractSnapshot` is not the DAC7 filing record and is not an EPR filing record; references must preserve domain separation.

## 8. Privacy consequences

`RO-IMP-P0-07` must be able to represent DAC7 as a separate purpose only after applicability is approved.

Required pattern:

```text
DataPurposeProfile {
  purposeId
  legalBasisState
  sourceRefs[]
  dataClasses[]
  recipients[]
  retentionPolicyRef
  accessPolicyRef
  noticeVersionRef
  approvalState
}
```

P2B decision evidence, DAC7 tax evidence, accessibility feedback and packaging evidence may have different legal bases, access rights and retention rules. No global `merchantDataRetentionDays` value may govern all of them.

## 9. Release-gate additions

`RO-IMP-P0-09` must add release assertions that fail closed when a mandatory cross-cutting row is unresolved.

Candidate assertions:

```text
merchant_p2b_profile_gate
merchant_tax_reporting_profile_gate
accessibility_release_evidence_gate
packaging_responsibility_gate
crosscutting_policy_version_integrity_gate
```

For a row professionally determined non-applicable/exempt, the release evidence must contain the approved reason/source/evidence/review date. `NOT_APPLICABLE` is a reasoned state, not an empty field.

## 10. Tests to pre-compose

Without enabling blocked behavior, the implementation backlog may pre-compose tests for:

- `UNKNOWN P2B applicability -> no merchant binding activation`;
- missing required merchant Terms version -> deny merchant capability;
- DAC7-specific collection disabled before approved purpose;
- entity seller does not auto-map to excluded seller;
- accessibility exemption absent/unknown -> no exemption claim;
- accessibility critical-flow regression catches unlabeled/unreachable controls;
- packaging actor unknown -> no listing/merchant activation where packaging gate is mandatory;
- seller-of-record change does not silently rewrite EPR actor;
- fulfilment-role change invalidates/reviews packaging responsibility profile;
- legal-pack/version change invalidates stale cross-cutting approvals;
- release gate rejects expired evidence.

## 11. Existing P0 slice changes — no new owner choice inferred

This addendum changes the **technical completeness** of the candidate slices but does not settle open Product Owner choices.

The existing slices should be interpreted as follows if #501 later authorizes implementation reprioritization:

| Existing slice | Cross-cutting addition |
|---|---|
| `RO-IMP-P0-01` | P2B applicability/Terms/merchant decisions + DAC7 seller/applicability references + combined merchant capability |
| `RO-IMP-P0-02` | packaging responsibility/evidence gate alongside category/GPSR |
| `RO-IMP-P0-03` | accessibility-compatible binding flow + references to applicable merchant/packaging release profiles |
| `RO-IMP-P0-04` | accessible withdrawal/return/refund path |
| `RO-IMP-P0-05` | reusable financial evidence for DAC7 only after approved purpose; no tax-reporting authority inferred from PSP data |
| `RO-IMP-P0-06` | exact merchant-managed fulfilment facts + shipping-packaging actor profile |
| `RO-IMP-P0-07` | DAC7 purpose/legal-basis/retention controls if applicable; cross-domain retention separation |
| `RO-IMP-P0-08` | accessible legal/contact surfaces + approved P2B/business-user surfaces where needed |
| `RO-IMP-P0-09` | cross-cutting evidence/review/expiry release gates |

## 12. Current state exported to #501

```text
P2B_APPLICABILITY = NOT_YET_VALIDATED
DAC7_APPLICABILITY = NOT_YET_VALIDATED
ACCESSIBILITY_APPLICABILITY = NOT_YET_VALIDATED
PACKAGING_ROLE_MATRIX = NOT_YET_VALIDATED
SAFE_FOUNDATION_WORK = CANDIDATE_IF_OWNER_AUTHORIZES_BACKLOG_REPRIORITIZATION
PUBLIC_MERCHANT_ACTIVATION = BLOCKED
```

No specific product family, pilot zone, PSP, pilot caps, access model or postal-resale decision is inferred from the Product Owner's generic instruction to continue the project.
