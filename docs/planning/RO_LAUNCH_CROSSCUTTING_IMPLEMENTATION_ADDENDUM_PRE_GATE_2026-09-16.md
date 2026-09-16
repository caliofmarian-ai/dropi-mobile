# DROPi Romania — Cross-Cutting Implementation Addendum (Pre-Gate)

> **STATUS: CANDIDATE / PRE-OWNER / NON-CANONICAL / FAIL-CLOSED**
> **As of:** 2026-09-16
> **Parent:** #500 / #492
> **Legal evidence:** PR #504
> **Planning PR:** #505
> **Depends on:** `docs/legal/RO_LAUNCH_PLATFORM_BUSINESS_TAX_ACCESSIBILITY_PACKAGING_CONTRACT_2026-09-16.md` v1.1.0
> **Applicability evidence:** `docs/legal/RO_LAUNCH_CROSSCUTTING_APPLICABILITY_WORKSHEET_2026-09-16.md`

This addendum extends the existing Romania launch candidate queue and P0 decomposition with four cross-cutting domains:

1. platform-to-business (P2B) merchant relationship;
2. DAC7 platform/seller tax reporting;
3. e-commerce accessibility;
4. packaging/EPR plus the distinct PPWR online-platform verification duty.

It does **not** authorize implementation reprioritization, public merchant activation, tax reporting, an accessibility exemption, packaging-role claims or PPWR producer activation. It defines safe foundation work and exact fail-closed gates that later implementation may consume only if #501 authorizes backlog reprioritization.

## 1. Design rule

These domains cross-cut existing P0 slices and must not become duplicate epics with conflicting state.

```text
existing P0 slice
+ cross-cutting applicability profile
+ domain-specific evidence
+ versioned legal policy
+ fail-closed activation gate
```

No missing cross-cutting decision is an implicit PASS.

## 2. Shared enterprise-size rule

Engineering must not implement one generic `smallCompany=true` control.

```text
P2B Article 11/12 small-enterprise candidate test:
  persons < 50
  AND (turnover <= EUR 10m OR balance sheet <= EUR 10m)

Accessibility/EAA services microenterprise candidate test:
  persons < 10
  AND (turnover <= EUR 2m OR balance sheet <= EUR 2m)

Romanian fiscal microenterprise status:
  separate #493 tax concept; not a substitute for either row
```

Use a domain-specific evidence model:

```text
EnterpriseSizeAssessment {
  legalEntityId
  legalDomain             // P2B | ACCESSIBILITY | OTHER
  definitionSourceRef
  headcountMethod
  headcountEvidenceRef
  turnoverEvidenceRef
  balanceSheetEvidenceRef
  partnerLinkedAggregationRef?
  referencePeriod
  calculatedState
  reviewerRef?
  reviewedAt
  reviewDueAt
}
```

## 3. P2B mapping

Primary existing slice:

- `RO-IMP-P0-01` — Professional Merchant Marketplace Capability.

Secondary consumers:

- `RO-IMP-P0-03` — Pre-Contract Disclosures + Immutable ContractSnapshot;
- `RO-IMP-P0-08` — Launch Legal / Contact / Policy Surfaces;
- `RO-IMP-P0-09` — Controlled Pilot E2E / Release / Rollback Gate.

### Current legal research state

Candidate facts strongly match the Regulation (EU) 2019/1150 online-intermediation-service pattern:

```text
P2B_SERVICE_CLASSIFICATION = LIKELY_IN_SCOPE / FINAL_APPROVAL_PENDING
```

This does not remove the final qualified review requirement.

### Safe foundation requirements

Engineering may implement:

```text
P2bApplicabilityProfile
P2bEnterpriseSizeEvidence
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
- data-access/data-use and post-termination disclosure versions;
- optional complaint/mediation profiles whose activation depends on approved applicability;
- immutable audit attribution.

### P2B fail-closed rule

```text
if required_p2b_component == UNKNOWN
or required_merchant_terms_version != APPROVED
or required_notice_or_decision_evidence_missing:
    merchant_binding_capability = DENIED
```

The `<50 / EUR 10m` size result may affect only the obligations for which the approved legal matrix says the exception applies. It never sets global `p2bApplicable=false`.

## 4. DAC7 mapping

Primary existing slices:

- `RO-IMP-P0-01` — Professional Merchant Marketplace Capability;
- `RO-IMP-P0-07` — Production Privacy / Retention / Rights / Support Enforcement.

Financial evidence may be referenced from:

- `RO-IMP-P0-05` — External PSP Transaction / Settlement / Reconciliation Core.

### Current legal research state

The 2026 source chain now includes the consolidated Directive 2011/16/EU as of 2026-01-01 plus Romanian 2025/2026 amendment families.

Candidate Marketplace facts support:

```text
DAC7_PLATFORM_OPERATOR_CANDIDATE = LIKELY
DAC7_REPORTING_PLATFORM_OPERATOR = NOT_YET_VALIDATED
DAC7_REPORTING_JURISDICTION = NOT_YET_VALIDATED
```

Sale of goods is the relevant candidate activity; final legal entity/nexus determines the reporting operator and Member State procedure.

### Safe foundation requirements

```text
Dac7PlatformApplicabilityProfile
Dac7SellerProfile
Dac7ReportingPeriod
```

Required properties:

- platform/operator classification separate from seller classification;
- seller `ENTITY` does not imply `EXCLUDED`;
- current source/legal-pack version attached to every decision;
- Member State/reporting-jurisdiction decision explicit;
- due-diligence evidence attributable;
- consideration/platform-fee/tax figures reference authoritative financial records;
- form/schema/deadline policy versioned;
- correction lifecycle and authority receipt modeled as evidence;
- DAC7-purpose data separated from generic merchant verification.

### Sale-of-goods excluded-seller test

The design must support the current conjunctive de-minimis test:

```text
saleOfGoodsActivityCount < 30
AND
totalConsideration <= EUR 2,000
```

This is one excluded-seller class, not the whole classifier.

### Reporting policy

Current Romanian source research identifies **31 January following the reporting period** as the current statutory reporting deadline. It must be stored as versioned policy, not scattered as a magic constant.

The design must also be able to select current registration/election procedures, including Forms 707/708 where the approved operator/nexus facts make them applicable.

### Collection gate

Until approved applicability exists:

```text
dac7_specific_mandatory_collection = DISABLED
dac7_registration_state = NOT_AUTHORIZED
dac7_filing_state = NOT_AUTHORIZED
```

Existing data required for another lawful approved purpose may exist, but no extra tax dataset is collected merely because future DAC7 fields are modeled.

## 5. Accessibility mapping

Accessibility is cross-cutting across:

- `RO-IMP-P0-01` merchant onboarding/Terms;
- `RO-IMP-P0-03` listing/pre-contract/checkout;
- `RO-IMP-P0-04` withdrawal/returns/refunds;
- `RO-IMP-P0-08` legal/contact/policy surfaces;
- `RO-IMP-P0-09` release acceptance.

### Current legal research state

The candidate consumer Marketplace fits the Romanian Law 232/2022 e-commerce-service category.

```text
ACCESSIBILITY_ECOMMERCE_SERVICE_SCOPE = IDENTIFIED
ACCESSIBILITY_MICROENTERPRISE_EXEMPTION = EVIDENCE_PENDING
```

The actual `<10 / EUR 2m` entity-size evidence decides the candidate services exemption; being new or fiscally classified as a Romanian microenterprise does not.

### Safe foundation requirements

The implementation must support:

- semantic labels and control names;
- appropriate non-text alternatives;
- readable/scalable content and sufficient contrast;
- logical focus/navigation order;
- keyboard/assistive-technology operation where applicable;
- screen-reader-compatible critical controls;
- accessible form labels, instructions, validation and error recovery;
- accessible identification/authentication/security functions delivered as part of the service;
- accessible payment/checkout instructions and controls;
- accessible withdrawal/return/support paths;
- product/service accessibility information where required by the approved pack;
- automated regression evidence plus manual assistive-technology/device verification.

Every row records provenance:

```text
LAW_REQUIRED | DROPI_POLICY | BOTH
```

No release may state `accessibilityNotRequired=true` without approved enterprise-size and service-exemption evidence.

## 6. Packaging producer/EPR mapping

Primary existing slices:

- `RO-IMP-P0-02` — Category / Zone / Product-Safety Gate;
- `RO-IMP-P0-06` — Merchant-Managed Fulfilment Contract.

Secondary consumers:

- `RO-IMP-P0-01` — merchant evidence;
- `RO-IMP-P0-09` — release gate.

### Producer/EPR responsibility profile

```text
PackagingProducerResponsibilityProfile {
  merchantId
  productOrSkuId?
  fulfilmentRole
  productPackagingActor
  groupedPackagingActor?
  transportPackagingActor?
  shippingPackagingActor
  producerRoleState
  importerRoleState
  distributorRoleState
  fulfilmentServiceRoleState
  platformRoleState
  eprResponsibleActor
  registrationEvidenceRef?
  environmentalFundEvidenceRef?
  packagingMaterialProfileRef?
  labellingInformationProfileRef?
  sourcePackVersion
  reviewedAt
  reviewDueAt
  approvalState
}
```

Hard rules:

```text
sellerOfRecord != automatic packaging producer
marketplaceProvider != automatic EPR responsible actor
merchantFulfilment != automatic no-DROPi-duty conclusion
```

## 7. PPWR online-platform verification mapping

PPWR applies from 12 August 2026 and introduces a **separate Marketplace question** from producer/EPR responsibility.

Where the approved legal profile establishes the relevant PPWR rule for an online platform within DSA Section 4 that allows consumers to conclude distance contracts with producers, the system must support pre-activation evidence for:

- producer registration information/registration number for the relevant consumer Member State;
- producer EPR self-certification;
- required `best efforts` completeness/reliability assessment.

```text
PpwrOnlinePlatformVerificationProfile {
  marketplaceLegalEntityId
  dsaSection4ScopeState
  merchantId
  producerRoleState
  consumerMemberState
  producerRegistrationNumber?
  producerRegistrationEvidenceRef?
  eprSelfCertificationVersion?
  selfCertificationAcceptedAt?
  completenessAssessmentRef?
  reliabilityAssessmentRef?
  verificationState
  sourcePackVersion
  reviewedAt
  reviewDueAt
  approvalState
}
```

Fail-closed candidate rule:

```text
if PPWR_PLATFORM_VERIFICATION_APPLIES
and required_evidence_missing:
    producer_marketplace_activation = DENIED
```

The PPWR/DSA Section 4 interaction remains `NOT_YET_VALIDATED` for the final DROPi entity. The implementation models the gate without pretending the answer is known.

If DROPi later supplies shipping packaging, warehouses, packs or fulfils goods, recalculate both the producer/EPR responsibility and platform-verification profiles before rollout.

## 8. Combined merchant launch capability

`RO-IMP-P0-01` eventually aggregates the cross-cutting rows without flattening them into one compliance boolean:

```text
MerchantLaunchCapability {
  merchantIdentityState
  professionalSellerState
  p2bTermsState
  dac7SellerState
  paymentOnboardingState
  allowedCategoryState
  productSafetyState
  packagingProducerRoleState
  ppwrPlatformVerificationState
  fulfilmentState
  privacyNoticeState
  contractVersionRefs[]
  approvalState
}
```

For every row made mandatory by the approved legal pack:

```text
UNKNOWN | MISSING | EXPIRED | SUSPENDED => merchantLaunchCapability = DENIED
```

## 9. Checkout / ContractSnapshot consequences

`RO-IMP-P0-03` must reference, not duplicate, the controlling versions for the transaction:

- merchant capability;
- merchant Terms/P2B version;
- customer Terms;
- legal pack;
- ranking/responsibility disclosures;
- product safety;
- packaging producer/EPR profile;
- applicable PPWR platform-verification evidence profile;
- accessibility release profile;
- payment-flow/provider profile;
- fulfilment role.

A consumer `ContractSnapshot` is not the DAC7 filing record and not an EPR filing record.

## 10. Privacy consequences

`RO-IMP-P0-07` may activate DAC7 as a separate data purpose only after its reporting applicability is approved.

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

P2B decision evidence, DAC7 tax evidence, accessibility feedback and packaging/PPWR evidence may use different purposes, legal bases, access rules and retention periods. No global `merchantDataRetentionDays` value governs them all.

## 11. Release-gate additions

`RO-IMP-P0-09` candidate assertions:

```text
merchant_p2b_profile_gate
merchant_p2b_size_exception_evidence_gate
merchant_tax_reporting_profile_gate
accessibility_release_evidence_gate
accessibility_exemption_evidence_gate
packaging_producer_responsibility_gate
ppwr_platform_verification_gate
crosscutting_policy_version_integrity_gate
```

A professionally determined `NOT_APPLICABLE` or exemption state must contain its source, factual evidence, approval and review date. It is not an empty field.

## 12. Tests to pre-compose

Safe pre-gate tests include:

- `LIKELY_IN_SCOPE` P2B research state does not become legal `APPROVED` automatically;
- missing merchant Terms version denies binding merchant capability;
- P2B `<50 / 10m` and accessibility `<10 / 2m` assessments cannot reuse the wrong legal-domain result;
- DAC7-specific collection remains disabled before approved purpose;
- entity seller does not auto-map to excluded seller;
- DAC7 goods exclusion requires both `<30` and `<= EUR 2,000`;
- accessibility exemption absent/unknown produces no exemption claim;
- accessibility critical-flow regression catches unlabeled/unreachable controls;
- packaging producer actor unknown denies affected activation where mandatory;
- PPWR platform rule applicable + missing producer registration/self-certification denies producer activation;
- seller-of-record change does not silently rewrite EPR actor;
- fulfilment-role change invalidates/reviews packaging responsibility;
- DSA Section 4 state change invalidates/reviews the PPWR platform profile;
- legal-pack/version change invalidates stale approvals;
- release gate rejects expired evidence.

## 13. Existing P0 slice mapping

| Existing slice | Cross-cutting addition |
|---|---|
| `RO-IMP-P0-01` | P2B applicability/Terms/size evidence + DAC7 seller/applicability + PPWR producer evidence + combined merchant capability |
| `RO-IMP-P0-02` | packaging producer/EPR and PPWR evidence gates alongside category/GPSR |
| `RO-IMP-P0-03` | accessibility-compatible binding flow + references to applicable cross-cutting profiles |
| `RO-IMP-P0-04` | accessible withdrawal/return/refund path |
| `RO-IMP-P0-05` | reusable financial evidence for DAC7 only after approved purpose; no reporting authority inferred from PSP data |
| `RO-IMP-P0-06` | exact merchant-managed fulfilment facts + shipping-packaging actor profile |
| `RO-IMP-P0-07` | DAC7 purpose/legal-basis/retention controls if applicable; cross-domain retention separation |
| `RO-IMP-P0-08` | accessible legal/contact surfaces + approved business-user surfaces where applicable |
| `RO-IMP-P0-09` | P2B/DAC7/accessibility/packaging/PPWR evidence-review-expiry release gates |

## 14. Current state exported to #501

```text
P2B_SERVICE_CLASSIFICATION = LIKELY_IN_SCOPE / FINAL_APPROVAL_PENDING
P2B_SIZE_EXCEPTION_EVIDENCE = PENDING
DAC7_PLATFORM_OPERATOR_CANDIDATE = LIKELY
DAC7_REPORTING_OPERATOR_AND_JURISDICTION = NOT_YET_VALIDATED
DAC7_MANDATORY_COLLECTION_AND_FILING = DISABLED
ACCESSIBILITY_ECOMMERCE_SCOPE = IDENTIFIED
ACCESSIBILITY_MICROENTERPRISE_EXEMPTION = EVIDENCE_PENDING
PPWR_ONLINE_PLATFORM_VERIFICATION_SCOPE = NOT_YET_VALIDATED
PACKAGING_EPR_RESPONSIBLE_ACTOR = NOT_YET_VALIDATED
SAFE_FOUNDATION_WORK = CANDIDATE_IF_OWNER_AUTHORIZES_BACKLOG_REPRIORITIZATION
PUBLIC_MERCHANT_ACTIVATION = BLOCKED
```

No specific product family, pilot zone, PSP, pilot caps, access model or postal-resale decision is inferred from the Product Owner's generic instruction to continue the project.
