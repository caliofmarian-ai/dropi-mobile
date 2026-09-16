# DROPi Romania Launch — Platform Business, DAC7, Accessibility and Packaging Control Contract

> **STATUS: PRE-COUNSEL / PRE-ACCOUNTANT / FAIL-CLOSED**
> **As of:** 2026-09-16
> **Parent:** #492
> **Related:** #494 #497 #498 #499 #500 #501

This contract captures four cross-cutting legal domains that affect the same first-launch Marketplace: the platform-to-business relationship with professional merchants, DAC7 platform/seller reporting, e-commerce accessibility and packaging/EPR responsibilities.

It does not certify that every obligation below applies to DROPi. It requires the application to hold the facts and evidence needed to make the applicability decision without inventing a legal result.

## 1. Core rule

The following shortcuts are prohibited:

```text
merchantVerified = true  -> P2B complete          // false
merchantIsCompany = true -> DAC7 excluded         // false
smallCompany = true      -> accessibility exempt  // false unless evidenced against the statutory test
marketplace = true       -> DROPi packaging producer // false
```

Each domain has its own applicability profile, actor allocation, evidence and review date.

---

# Part A — Platform-to-Business (P2B) merchant relationship

## 2. Why P2B is first-launch critical

The candidate DROPi first pilot is an online Marketplace in which professional merchants use the platform to offer goods to consumers. Regulation (EU) 2019/1150 expressly covers online intermediation services such as online e-commerce marketplaces when the factual scope conditions are met.

Romanian OUG 23/2021 is the national enforcement layer for Regulation (EU) 2019/1150 and must be reconciled with later amendments/current Competition Council practice before launch.

The result is that the merchant-side contract cannot be treated as an ordinary generic `Terms of Service` document.

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

`smallEnterpriseState` is not a blanket P2B exemption. It is used only for obligations for which the Regulation itself provides the relevant exception, including the specific complaint/mediation provisions where applicable.

## 4. Merchant terms must be versioned and evidence-backed

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

Engineering must support at least these behaviors when the corresponding legal row applies:

- merchant Terms available before the business user is bound;
- plain/intelligible merchant Terms;
- versioned Terms changes and applicable notice/effective date;
- stated grounds and evidence for restriction, suspension and termination;
- no arbitrary seller disablement without a reason-coded platform decision path;
- ranking transparency separate from the consumer-facing ranking disclosure where the legal audience/content differs;
- differentiated-treatment disclosure;
- data-access/data-use disclosure, including what merchants can access and what the platform/business users may access after the relationship ends;
- parity/different-condition restriction disclosure where relevant;
- internal complaint system and mediation data when their specific statutory applicability is established.

## 5. Merchant capability state

Account authentication is not the same as Marketplace business-user authority.

```text
ACCOUNT_ACTIVE
-> BUSINESS_IDENTITY_EVIDENCE
-> P2B_TERMS_PRESENTED
-> P2B_TERMS_ACCEPTED
-> TAX_REPORTING_PROFILE_PENDING
-> CATEGORY_AND_PRODUCT_SAFETY_PROFILE_PENDING
-> MERCHANT_CAPABILITY_APPROVED
```

Restriction/suspension/termination events require an attributable decision record rather than silent `active=false` changes.

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

---

# Part B — DAC7 platform/seller tax reporting

## 6. DAC7 is an applicability decision, not a merchant-verification checkbox

Directive (EU) 2021/514 (DAC7) and Romanian OG 16/2023 establish due-diligence and reporting rules for reporting platform operators. ANAF's DAC7 materials, F7000 and Orders 1946/2023 and 1226/2023 provide operational reporting/registration/verification evidence.

The existence of a Marketplace does not by itself prove that every DROPi entity, activity or seller is reportable. Conversely, admitting only professional merchants does not automatically remove DAC7.

## 7. DAC7 applicability profile

```text
Dac7PlatformApplicabilityProfile {
  platformId
  operatingLegalEntityId
  platformDefinitionState
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

Until this profile is approved, the system may collect only the merchant/business data already justified by an approved purpose; it must not create a hidden tax-surveillance dataset on the assumption that DAC7 applies.

## 8. Seller tax-reporting profile

```text
Dac7SellerProfile {
  merchantId
  sellerType             // INDIVIDUAL | ENTITY
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
  status
}
```

For the candidate first pilot, sellers are legal/business merchants, but the data model must not assume `entity = excluded seller`.

ANAF Form F7000 evidence shows that reporting for reportable entity sellers may include legal name, principal address, TIN, VAT number where present, trade-register number and available permanent-establishment information, alongside activity/consideration reporting. Exact current mandatory fields remain controlled by the current Romanian legal/form pack at the time of filing.

## 9. DAC7 reporting calendar and evidence

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

The implementation must support:

- reportable/excluded seller classification;
- evidence of seller due diligence;
- versioned reporting forms/schema;
- correction lifecycle;
- immutable filing/receipt evidence;
- segregation of DAC7-purpose data from unrelated merchant data;
- privacy notice/legal-basis/retention linkage under #498.

No filing deadline should be hard-coded from model memory; it is policy data derived from the approved current tax pack.

---

# Part C — E-commerce accessibility

## 10. Accessibility scope

Romanian Law 232/2022 implements the European Accessibility Act framework and covers specified services including e-commerce services from 28 June 2025. The law contains a microenterprise exemption for microenterprises providing services.

That exemption is evidence-dependent. DROPi may not set `accessibilityNotRequired=true` merely because the launch company is new or expected to be small.

## 11. Accessibility applicability profile

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

A later loss of microenterprise status is a mandatory review trigger.

## 12. Accessible foundation regardless of exemption

Engineering may and should build accessibility-compatible foundations before final applicability approval. The provenance must say whether a control is `LAW_REQUIRED`, `DROPI_POLICY`, or both.

The web/mobile Marketplace architecture must be able to support:

- perceivable text and non-text alternatives;
- sufficient contrast and scalable/readable text;
- keyboard and assistive-technology operability where the surface supports keyboard input;
- visible focus and logical navigation order;
- accessible labels/instructions for forms;
- programmatically understandable errors, validation and recovery;
- checkout and payment instructions that do not depend solely on color/sound/location;
- accessible authentication and account-recovery paths;
- accessible product information required for the e-commerce service;
- accessible withdrawal/return/support flows;
- screen-reader semantics for critical mobile controls;
- accessibility information/statement/support path required by the approved legal pack;
- regression testing with automated checks plus manual assistive-technology/device verification.

Accessibility is a release property, not a static PDF.

---

# Part D — Packaging / EPR / fulfilment roles

## 13. Current legal boundary

Regulation (EU) 2025/40 on packaging and packaging waste applies from **12 August 2026** and is directly applicable in Member States. Romanian Law 249/2015 remains part of the national packaging/waste source chain and must be reconciled with PPWR and current Romanian environmental/EPR implementing rules.

All packaging placed on the Romanian market is not automatically the legal responsibility of DROPi. Responsibility depends on the actual economic-operator/producer/importer/packer/distributor/fulfilment facts and the packaging involved.

## 14. Packaging responsibility profile

```text
PackagingResponsibilityProfile {
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

No actor may be inferred solely from `sellerOfRecord` or `MarketplaceProvider`.

## 15. First-pilot packaging gate

The candidate first product family deliberately reduces product-law complexity, but stationery/art prints still involve product and/or shipping packaging.

```text
PackagingLaunchGate =
  packaging_roles_resolved
  AND required_merchant_packaging_evidence_current
  AND fulfilment_shipping_packaging_actor_resolved
  AND applicable_registration_epr_state_resolved
  AND required_labelling_information_resolved
  AND ppwr_effective_pack_current
  AND ro_environmental_pack_current
```

If a merchant is the relevant responsible actor, DROPi must be able to require evidence without falsely representing that DROPi itself holds that environmental authorization/registration.

If DROPi later supplies standard shipping packaging or takes over fulfilment/packing, the responsibility profile must be recalculated before that capability is activated.

Packaging compliance is separate from GPSR product safety. A safe product can still have non-compliant packaging, and compliant packaging does not prove the product is safe.

---

# Part E — Combined first-launch merchant capability

## 16. Merchant capability aggregate

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

The aggregate is fail-closed. `UNKNOWN` in a mandatory row means the merchant cannot publish/accept binding orders for the affected scope.

## 17. What engineering may implement before final legal approval

Safe foundation work includes:

- versioned merchant Terms and notices;
- reason-coded merchant restriction/suspension/termination event machinery;
- P2B applicability and merchant-decision evidence models;
- DAC7 applicability/seller classification schemas with collection fields disabled until purpose/legal basis is approved;
- tax-reporting period/file/receipt/correction evidence structures;
- accessible component/form/navigation foundations and regression tests;
- packaging responsibility/evidence profiles and deny-by-default activation gates;
- provenance labels distinguishing statutory, DROPi-policy and provider requirements.

Blocked law-dependent activation includes:

- final merchant Terms wording as legally approved;
- DAC7 reporting/registration flags or mandatory data collection without approved applicability;
- any accessibility exemption claim without enterprise-size/applicability evidence;
- packaging/EPR actor claims or registration requirements without exact role/source analysis;
- public merchant activation based on unresolved mandatory rows.

## 18. Source family registered/rechecked 2026-09-16

The controlled corpus now identifies the source families for:

- Regulation (EU) 2019/1150 (P2B) and Romanian OUG 23/2021 enforcement;
- Directive (EU) 2021/514 (DAC7), Romanian OG 16/2023, ANAF DAC7 guide and ANAF Orders 1996/2023, 1946/2023 and 1226/2023;
- Directive (EU) 2019/882 and Romanian Law 232/2022 accessibility framework;
- Regulation (EU) 2025/40 (PPWR), applicable from 12 August 2026, and Romanian Law 249/2015 packaging baseline.

Snapshot status and hashes remain governed only by `docs/legal/legal-source-register.json`. A registered URL or this contract is not launch authorization.

## 19. Current disposition

```text
P2B_APPLICABILITY_PENDING
DAC7_APPLICABILITY_PENDING
ACCESSIBILITY_APPLICABILITY_PENDING
PACKAGING_ROLE_MATRIX_PENDING
SAFE_FOUNDATION_DESIGN_ALLOWED
PUBLIC_MERCHANT_ACTIVATION_NOT_YET_APPROVED
```
