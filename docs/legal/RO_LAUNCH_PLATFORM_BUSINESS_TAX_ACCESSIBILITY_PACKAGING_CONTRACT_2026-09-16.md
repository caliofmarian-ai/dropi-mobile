# DROPi Romania Launch — Platform Business, DAC7, Accessibility and Packaging Control Contract

> **STATUS: PRE-COUNSEL / PRE-ACCOUNTANT / FAIL-CLOSED**
> **Version:** 1.1.0
> **As of:** 2026-09-16
> **Parent:** #492
> **Related:** #494 #497 #498 #499 #500 #501
> **Applicability worksheet:** `RO_LAUNCH_CROSSCUTTING_APPLICABILITY_WORKSHEET_2026-09-16.md`

This contract captures four cross-cutting legal domains that affect the same first-launch Marketplace: the platform-to-business relationship with professional merchants, DAC7 platform/seller reporting, e-commerce accessibility and packaging/EPR responsibilities.

It does not certify that every obligation below applies to DROPi. It defines the evidence, state and fail-closed behavior required to reach the applicability decision without inventing a legal result.

## 1. Core rule

The following shortcuts are prohibited:

```text
merchantVerified = true  -> P2B complete               // false
merchantIsCompany = true -> DAC7 excluded              // false
smallCompany = true      -> accessibility exempt       // false
marketplace = true       -> DROPi packaging producer   // false
merchantFulfilment = true -> no PPWR platform duty     // false
```

Each domain has its own applicability profile, actor allocation, enterprise-size definition, evidence and review date.

---

# Part A — Platform-to-Business (P2B) merchant relationship

## 2. Why P2B is first-launch critical

The candidate DROPi first pilot is an online Marketplace in which professional merchants use the platform to offer goods to Romanian/EU consumers and are expected to contract with DROPi for access to the Marketplace.

Those candidate facts closely match the factual elements used by Regulation (EU) 2019/1150 for online intermediation services, including online e-commerce marketplaces. Romanian OUG 23/2021 is the national enforcement layer and current Romanian enforcement practice must still be included before final approval.

Research state:

```text
P2B_SERVICE_CLASSIFICATION = LIKELY_IN_SCOPE / QUALIFIED_CONFIRMATION_PENDING
```

This is not merchant-launch authorization.

## 3. P2B applicability profile

```text
P2bApplicabilityProfile {
  providerLegalEntityId
  serviceId
  informationSocietyServiceState
  onlineIntermediationServiceState
  businessUsersEstablishedInEUState
  consumersLocatedInEUState
  directTransactionFacilitationState
  contractualRelationshipWithBusinessUsersState
  enterpriseSizeEvidenceRef?
  smallEnterpriseState
  internalComplaintSystemArticle11State
  mediationArticle12State
  legalPackVersion
  reviewedAt
  reviewDueAt
  approvalState
}
```

`smallEnterpriseState` is not a blanket P2B exemption. It is relevant only to the specific Regulation 2019/1150 provisions that contain the small-enterprise exception, including the internal complaint-handling and mediation provisions where applicable.

## 4. P2B small-enterprise evidence is domain-specific

For the EU SME Recommendation used by those P2B exceptions, the headline **small enterprise** threshold is:

```text
persons_employed < 50
AND
(annual_turnover <= EUR 10m OR annual_balance_sheet_total <= EUR 10m)
```

Partner/linked-enterprise treatment must be included where required by the Recommendation.

This threshold must not be reused for accessibility and must not be substituted with Romanian fiscal `microîntreprindere` status.

```text
P2bEnterpriseSizeEvidence {
  legalEntityId
  headcountCalculationRef
  annualTurnoverEvidenceRef
  annualBalanceSheetEvidenceRef
  partnerEnterpriseRefs[]
  linkedEnterpriseRefs[]
  referencePeriod
  recommendationVersion
  calculatedState
  reviewerRef?
  reviewedAt
  reviewDueAt
}
```

## 5. Merchant terms must be versioned and evidence-backed

```text
MerchantTermsVersion {
  id
  locale
  providerLegalEntityId
  effectiveFrom
  effectiveTo?
  preContractAvailabilityEvidenceRef
  changeNoticePolicyRef
  restrictionGroundsVersion
  suspensionGroundsVersion
  terminationGroundsVersion
  terminationNoticePolicyRef
  rankingDisclosureVersion
  differentiatedTreatmentDisclosureVersion
  dataAccessDisclosureVersion
  parityRestrictionDisclosureVersion?
  postTerminationDataAccessPolicyRef
  complaintSystemVersion?
  mediationDisclosureVersion?
  p2bApplicabilityProfileRef
  legalReviewState
}
```

Engineering must support, when the corresponding legal row applies:

- merchant Terms available before the business user is bound;
- plain/intelligible merchant Terms;
- versioned Terms changes and the approved notice/effective-date rule;
- stated grounds and evidence for restriction, suspension and termination;
- no arbitrary seller disablement through silent `active=false` changes;
- business-user ranking transparency distinct from consumer-facing disclosure where audience/content differs;
- differentiated-treatment disclosure;
- data-access/data-use and post-termination data-access disclosure;
- parity/different-condition restriction disclosure where relevant;
- internal complaint handling and mediation where their obligation-specific applicability is established.

## 6. Merchant decision record

```text
MerchantPlatformDecision {
  merchantId
  decisionType       // RESTRICT | SUSPEND | TERMINATE | RESTORE
  groundsCode
  evidenceRefs[]
  legalPackVersion
  noticeVersion
  noticeSentAt?
  effectiveAt
  appealOrComplaintRef?
  actor
  auditRef
}
```

Account authentication is not the same as Marketplace business-user authority.

---

# Part B — DAC7 platform/seller tax reporting

## 7. Current authority chain supersedes the original-only implementation view

The DAC7 source pack must not stop at Directive (EU) 2021/514 and Romanian OG 16/2023.

The controlled source family now also includes:

- `EU-DIR-2011-16-DAC-CONSOLIDATED-2026-01-01` — archived current consolidated DAC framework;
- `RO-OUG-71-2025-DAC7-CURRENT-AMENDMENTS` — 2025/2026 Article 291^5 amendment family, controlled primary copy pending;
- `RO-OG-1-2026-TAX-PROCEDURE-DAC-CURRENT` — further 2026 Tax Procedure Code amendment family, controlled primary copy pending;
- ANAF DAC7 guidance and the current registered form/order family.

Implementation must consume a versioned current Romanian DAC7 pack. A 2023-only schema is not authoritative for a 2026 launch.

## 8. Candidate platform/operator classification

The first-pilot facts establish a strong research candidate:

- DROPi Marketplace software connects professional sellers with consumers;
- DROPi intends to contract with sellers to make the Marketplace available;
- sale of goods is the candidate first-pilot activity and is a DAC relevant-activity category.

Therefore:

```text
DAC7_PLATFORM_OPERATOR_CANDIDATE = LIKELY
DAC7_REPORTING_PLATFORM_OPERATOR = NOT_YET_VALIDATED
DAC7_REPORTING_JURISDICTION = NOT_YET_VALIDATED
```

The final legal entity, nexus and exclusion analysis still determine whether DROPi is a Reporting Platform Operator and which Member State procedure applies.

## 9. DAC7 applicability profile

```text
Dac7PlatformApplicabilityProfile {
  platformId
  operatingLegalEntityId
  platformDefinitionState
  platformOperatorState
  reportingPlatformOperatorState
  excludedPlatformOperatorState
  relevantActivities[]
  memberStateNexus[]
  reportingJurisdictionDecision
  multiStateElectionState?
  registrationRequirementState
  reportingRequirementState
  sourcePackVersion
  legalTaxReviewRef?
  reviewedAt
  reviewDueAt
  approvalState
}
```

Until approved, the system may collect only merchant/business data already justified by another approved purpose; it must not create a hidden DAC7 dataset “just in case”.

## 10. Seller classification and the goods de-minimis rule

Professional/company status does **not** itself make a seller excluded.

For the sale-of-goods de-minimis excluded-seller test in the current consolidated DAC framework, both conditions are relevant for the reporting period:

```text
facilitated_sale_of_goods_activities < 30
AND
total_consideration <= EUR 2,000
```

Other excluded-seller classes remain separate checks.

```text
Dac7SellerProfile {
  merchantId
  sellerType             // INDIVIDUAL | ENTITY
  excludedClassChecks[]
  saleOfGoodsActivityCount
  totalConsideration
  currencyConversionPolicyRef
  excludedSellerState
  reportableSellerState
  principalAddress
  memberStatesOfResidence[]
  tinEvidenceRefs[]
  vatNumber?
  tradeRegisterNumber?
  permanentEstablishmentStates[]
  relevantActivityTypes[]
  considerationLedgerRef?
  platformFeesCommissionsTaxesRef?
  dueDiligenceEvidenceRefs[]
  dataVerifiedAt?
  taxYear
  sourcePackVersion
  status
}
```

## 11. Reporting calendar and current Romanian mechanics

The current registered Romanian source pack identifies F7000 and associated registration/election/control procedures. It also identifies **31 January following the reporting period** as the current statutory reporting deadline for reportable seller information.

The code must still store that deadline as versioned policy data, not an irreversible magic constant.

The current source family also identifies procedure paths including:

- a non-EU reporting-platform-operator registration path, including Form 707 where applicable;
- Member-State election/notification mechanics, including Form 708 where applicable;
- 2025/2026 changes to Article 291^5 identification/registry mechanics.

Those forms are not automatically DROPi's forms. The final operator/nexus analysis selects the applicable route.

```text
Dac7ReportingPeriod {
  taxYear
  operatorProfileRef
  reportingJurisdiction
  sellerPopulationSnapshotRef
  dueDiligenceCompletedAt?
  filingFormVersion
  filingDeadlinePolicyRef
  reportFileEvidenceRef?
  correctionRefs[]
  anafReceiptRef?
  state
}
```

## 12. DAC7 evidence retention is purpose-specific

Current ANAF guidance identifies due-diligence/reporting supporting-evidence retention for at least five years and no more than ten years after the end of the reporting period, subject to the current Romanian pack and exact record category.

This must not become a global merchant-retention period. DAC7 data requires its own approved legal basis, notice, access and retention policy under #498.

---

# Part C — E-commerce accessibility

## 13. Service scope is materially narrowed

Romanian Law 232/2022 covers specified services including e-commerce services supplied to consumers after 28 June 2025.

The candidate DROPi Marketplace is an online/app service provided at the consumer's individual request with a view to concluding a consumer contract. The candidate service therefore matches the e-commerce service category for launch planning.

Research state:

```text
ACCESSIBILITY_ECOMMERCE_SERVICE_SCOPE = IDENTIFIED
ACCESSIBILITY_MICROENTERPRISE_EXEMPTION = EVIDENCE_PENDING
```

The main remaining applicability question is the actual operating entity's evidence-backed services exemption and the exact requirements applying to the final service.

## 14. Accessibility microenterprise threshold is different from P2B

The headline Law 232/2022 / EAA **microenterprise** test for the services exemption is:

```text
persons_employed < 10
AND
(annual_turnover <= EUR 2m OR annual_balance_sheet_total <= EUR 2m)
```

This is not the P2B `<50 / EUR 10m` small-enterprise test and not the Romanian fiscal microenterprise regime.

```text
AccessibilityApplicabilityProfile {
  operatingLegalEntityId
  serviceId
  eCommerceServiceState
  consumerServiceState
  enterpriseSizeEvidenceRef
  microenterpriseState
  statutoryServiceExemptionState
  disproportionateBurdenAssessmentRef?
  fundamentalAlterationAssessmentRef?
  accessibilityStandardProfileRef
  reviewedAt
  reviewDueAt
  approvalState
}
```

```text
AccessibilityEnterpriseSizeEvidence {
  legalEntityId
  personsEmployedCalculationRef
  annualTurnoverEvidenceRef
  annualBalanceSheetEvidenceRef
  aggregationMethodRef
  referencePeriod
  statutoryDefinitionVersion
  exemptionState
  reviewerRef?
  reviewedAt
  reviewDueAt
}
```

Loss/change of the qualifying facts is a mandatory review trigger.

## 15. Accessible foundation regardless of exemption

Engineering may build accessibility-compatible foundations before final legal applicability approval. Provenance must identify whether a control is `LAW_REQUIRED`, `DROPI_POLICY`, or both.

The Marketplace architecture must be able to support:

- perceivable text and appropriate non-text alternatives;
- sufficient contrast and scalable/readable text;
- logical navigation and visible focus;
- keyboard/assistive-technology operability where applicable;
- accessible labels/instructions and understandable validation/error recovery;
- accessible identification/authentication/security functions delivered as part of the service;
- accessible payment functions/instructions delivered as part of the service;
- accessible product/service accessibility information where supplied by the responsible economic operator and required by the approved legal pack;
- accessible withdrawal/return/support paths;
- screen-reader semantics for critical mobile controls;
- automated regression checks plus manual assistive-technology/device verification.

Accessibility is a release property, not a static PDF or one-time claim.

---

# Part D — Packaging / EPR / fulfilment roles

## 16. Current legal boundary

Regulation (EU) 2025/40 on packaging and packaging waste applies from **12 August 2026**. Romanian Law 249/2015 remains part of the national packaging/waste chain and the corpus now additionally registers the current OUG 196/2005 Environmental Fund framework endpoint and Law 79/2026 amendment family.

The exact packaging producer/EPR actor still depends on the actual placing-on-market, import, overpacking, packing and fulfilment facts.

However, the Marketplace question is no longer limited to “is DROPi the packaging producer?”. PPWR can impose a separate online-platform verification duty where its factual scope is met.

## 17. Producer/EPR responsibility profile

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
  reuseRecyclabilityProfileRef?
  sourcePackVersion
  reviewedAt
  reviewDueAt
  approvalState
}
```

No producer/EPR actor may be inferred solely from `sellerOfRecord` or `MarketplaceProvider`.

## 18. Direct PPWR online-platform verification profile

Where the actual service falls within the PPWR rule for an online platform within Section 4 of Chapter III DSA that allows consumers to conclude distance contracts with producers, the Marketplace must be able to obtain before allowing the producer to use the service:

- the producer's relevant registration information/registration number for the consumer's Member State; and
- the producer's self-certification concerning applicable extended-producer-responsibility compliance.

The platform must then support the required `best efforts` assessment of completeness/reliability.

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

Candidate fail-closed rule:

```text
if PPWR_PLATFORM_VERIFICATION_APPLIES
and required_registration_or_self_certification_or_verification_evidence_missing:
    producer_marketplace_activation = DENIED
```

The exact PPWR interaction with DSA Section 4 enterprise-size scope/exclusions remains subject to qualified analysis for the actual DROPi entity. No generic `smallCompany` shortcut may decide it.

Merchant-managed fulfilment does not, by itself, remove this platform-verification question.

## 19. Packaging launch gate

```text
PackagingLaunchGate =
  producer_epr_roles_resolved
  AND required_merchant_packaging_evidence_current
  AND fulfilment_shipping_packaging_actor_resolved
  AND applicable_registration_epr_state_resolved
  AND required_labelling_information_resolved
  AND ppwr_platform_verification_state_resolved
  AND ppwr_effective_pack_current
  AND ro_environmental_pack_current
```

If a merchant is the responsible packaging actor, DROPi must be able to require evidence without falsely representing that DROPi holds the merchant's environmental registration.

If DROPi later supplies shipping packaging, warehouses, packs or fulfils goods, both the responsibility and PPWR-platform profiles must be re-evaluated before activation.

Packaging compliance remains separate from GPSR product safety.

## 20. Later PPWR milestones are versioned, not prematurely active

The PPWR also contains later packaging-minimisation/empty-space requirements. They must be modeled through effective-date policy and roadmap controls; they are not promoted to first-pilot obligations merely because they are visible in the Regulation in 2026.

---

# Part E — Combined first-launch merchant capability

## 21. Enterprise size assessment must identify the legal domain

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

A single generic `companySize = SMALL` is not authoritative across legal domains.

## 22. Merchant capability aggregate

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

The aggregate is fail-closed. `UNKNOWN` in a row made mandatory by the approved legal pack denies merchant activation for the affected scope.

## 23. Safe engineering before final legal approval

Subject to the separate #501 owner backlog-authorization gate, safe foundation work includes:

- versioned merchant Terms and notices;
- reason-coded merchant restriction/suspension/termination machinery;
- domain-specific enterprise-size evidence models;
- P2B applicability and merchant-decision evidence models;
- DAC7 platform/operator/seller classification schemas with DAC7-specific collection disabled until purpose/applicability approval;
- versioned reporting-period/form/deadline/receipt/correction evidence structures;
- accessible component/form/navigation/auth/payment/withdrawal foundations and regression tests;
- separate packaging producer/EPR responsibility and PPWR online-platform verification profiles;
- deny-by-default activation gates;
- provenance labels distinguishing statutory, DROPi-policy and provider requirements.

Blocked law-dependent activation includes:

- final merchant Terms wording as legally approved;
- DAC7 mandatory collection, registration or filing without approved operator/jurisdiction/seller rules;
- accessibility exemption claims without entity-size evidence;
- PPWR/DSA Section 4 applicability claims without the exact entity/service analysis;
- packaging/EPR actor or registration claims without the current role/source analysis;
- public merchant activation based on unresolved mandatory rows.

## 24. Controlled source family rechecked 2026-09-16

The source family now includes/references:

- Regulation (EU) 2019/1150 and Romanian OUG 23/2021;
- Commission Recommendation 2003/361/EC for the P2B small-enterprise evidence path;
- current consolidated Directive 2011/16/EU as of 2026-01-01, Directive (EU) 2021/514, OG 16/2023, OUG 71/2025, OG 1/2026 and registered ANAF DAC7 material;
- Directive (EU) 2019/882 and Romanian Law 232/2022;
- Regulation (EU) 2025/40, Commission Notice C(2026) 3702, Romanian Law 249/2015, current OUG 196/2005 endpoint and Law 79/2026 amendment family.

Snapshot status and hashes are governed only by `docs/legal/legal-source-register.json`. `pending_primary_copy` is not converted to archived evidence by this contract.

## 25. Current disposition

```text
P2B_SERVICE_CLASSIFICATION = LIKELY_IN_SCOPE / FINAL_APPROVAL_PENDING
P2B_ARTICLE11_12_SIZE_EXCEPTION = EVIDENCE_PENDING
DAC7_PLATFORM_OPERATOR_CANDIDATE = LIKELY
DAC7_REPORTING_OPERATOR_AND_JURISDICTION = NOT_YET_VALIDATED
DAC7_MANDATORY_COLLECTION_AND_FILING = DISABLED
ACCESSIBILITY_ECOMMERCE_SERVICE_SCOPE = IDENTIFIED
ACCESSIBILITY_MICROENTERPRISE_EXEMPTION = EVIDENCE_PENDING
PPWR_ONLINE_PLATFORM_VERIFICATION_SCOPE = NOT_YET_VALIDATED
PACKAGING_EPR_RESPONSIBLE_ACTOR = NOT_YET_VALIDATED
SAFE_FOUNDATION_DESIGN_ALLOWED
PUBLIC_MERCHANT_ACTIVATION_NOT_YET_APPROVED
```
