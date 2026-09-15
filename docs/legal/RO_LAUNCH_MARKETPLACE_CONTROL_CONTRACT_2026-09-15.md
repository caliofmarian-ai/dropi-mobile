# RO-LAUNCH-002 — Romania Marketplace Legal Control Contract

> **STATUS: PRE-COUNSEL / FAIL-CLOSED / LAW-DEPENDENT ENABLEMENT BLOCKED**
> **As of:** 2026-09-15
> **Issue:** #494
> **Parent:** #492

This document translates the current Romanian/EU Marketplace evidence into a technical control contract. It does not certify DROPi's final DSA classification or authorize public commerce.

## 1. Core rule

The first launch must never reduce legal state to booleans such as:

```text
merchant.verified = true
product.safe = true
marketplace.compliant = true
order.legal = true
```

Instead the application must be able to explain the applicable legal pack, evidence, effective dates, actor responsibilities and unresolved gates for every binding transaction.

## 2. Romanian online-Marketplace pre-contract information

The current consolidated OUG 34/2014, Article 6^1, requires the online-Marketplace provider, before the distance contract/offer becomes binding on the consumer, to provide clearly and accessibly:

- the main parameters determining ranking of offers and their relative importance, through a dedicated section directly/easily accessible from the offer page;
- whether the third party offering the goods/services/digital content is a professional, based on that party's declaration to the Marketplace provider;
- where the third party is not a professional, information that consumer-protection rights do not apply to that contract;
- where applicable, how contract-related obligations are shared between the third party and the online-Marketplace provider, without changing statutory liability merely through the disclosure.

The first DROPi pilot intentionally admits professional merchants only, so the non-professional path remains disabled rather than being implemented as a shortcut.

OUG 34/2014 also provides that contractual information is presented in Romanian in an accessible form and places the burden of proving compliance with the Chapter's information requirements on the professional.

### Required data model

```text
RankingDisclosureVersion {
  id
  locale
  rankingPolicyVersion
  mainParameters[]
  relativeImportanceDescription
  effectiveFrom
  effectiveTo?
  sourcePackVersion
}

SellerStatusDisclosure {
  sellerLegalEntityId
  professionalStatus
  declarationEvidenceRef
  declarationVersion
  reviewedAt
}

ResponsibilityAllocationVersion {
  id
  sellerOfRecordActor
  goodsConformityActor
  withdrawalActor
  refundActor
  platformActor
  fulfilmentRole
  postalActor?
  complaintRoutes[]
  effectiveFrom
  legalReviewState
}
```

No checkout may rely on hidden prose assembled ad hoc by the mobile UI.

## 3. Binding checkout contract snapshot

Every binding order requires an immutable `ContractSnapshot` capturing what the customer was shown/accepted at that transaction moment.

Candidate minimum contract:

```text
ContractSnapshot {
  orderId
  customerId
  sellerLegalEntityId
  sellerProfessionalStatus
  productIds[]
  productInformationVersionRefs[]
  productSafetyProfileRefs[]
  quantityPriceCurrency[]
  taxesAndFeeComponents[]
  platformFeeComponent?
  fulfilmentRole
  deliveryPostalComponent?
  effectiveProviderId?
  rankingDisclosureVersion
  responsibilityAllocationVersion
  customerTermsVersion
  merchantTermsVersion
  withdrawalInformationVersion
  legalPackVersion
  locale
  createdAt
  integrityHashOrImmutableEventRef
}
```

The snapshot does not replace fiscal invoices, PSP evidence or separate safety/legal records.

## 4. Immediate-before-order controls

OUG 34/2014 Article 8 requires certain information to be brought clearly and very visibly to the consumer immediately before an electronically concluded order that creates an obligation to pay, and the order action must unambiguously communicate the payment obligation.

Therefore checkout must have a server-validated `bindingCheckoutGate`, not UI-only rendering.

```text
bindingCheckoutGate =
  seller_status_valid
  AND product_category_allowed
  AND product_safety_gate_passed
  AND legal_pack_current
  AND required_precontract_information_renderable
  AND ranking_disclosure_current
  AND responsibility_allocation_current
  AND price_currency_components_frozen
  AND fulfilment_role_approved
  AND payment_flow_approved
  AND customer_terms_current
  AND withdrawal_information_current
```

Any `UNKNOWN`, expired or missing required component denies binding checkout with a reason-coded state.

## 5. Online withdrawal function — already effective in 2026

Current OUG 34/2014 Article 11^1, inserted by OUG 18/2026, applies from **19 June 2026** for covered distance contracts concluded via an online interface.

The current text requires the professional to ensure an online withdrawal function that is:

- clearly and unambiguously labelled (the law gives `retrageți-vă din contract aici` or similar wording);
- permanently available and visible/easily accessible during the withdrawal period;
- capable of receiving an online withdrawal declaration;
- capable of identifying the consumer, the relevant contract and the electronic means for confirmation;
- followed by an unambiguous confirmation action;
- followed without unjustified delay by durable-medium confirmation containing the withdrawal content plus date and time.

For the candidate Marketplace structure, the merchant is seller of record/professional for goods, while DROPi supplies the online interface. Whether DROPi technically operates the function as the merchant's agent/interface and the exact responsibility allocation require qualified review. The product must support that allocation instead of assuming either actor away.

### Required objects

```text
WithdrawalRequest {
  id
  orderId
  sellerLegalEntityId
  requestingCustomerId
  contractIdentification
  declarationContent
  confirmationDestination
  initiatedAt
  confirmedAt?
  legalPeriodEvidenceRef
  state
}

WithdrawalAcknowledgement {
  id
  withdrawalRequestId
  contentSnapshot
  sentAt
  deliveryChannel
  durableMediumEvidenceRef
  deliveryState
}
```

The withdrawal right cannot be replaced with `contact support`.

## 6. 27 September 2026 legal-pack switch

The current consolidated OUG 34/2014 contains several OUG 18/2026 amendments marked as applicable from **27 September 2026**, including defined durability/repairability concepts and additional pre-contract information fields in relevant cases.

Therefore the Marketplace must not freeze a September-2026 launch schema from an older ruleset.

Required control:

```text
LegalPack {
  jurisdiction = RO
  version
  effectiveFrom
  effectiveTo?
  consumerInformationSchemaVersion
  withdrawalSchemaVersion
  categorySchemaVersion
  reviewState
}
```

If a release date crosses an effective-date boundary, checkout must use the pack effective for the transaction date.

## 7. DSA applicability profile — no global exemption switch

Regulation (EU) 2022/2065 Article 29 excludes **Section 4** additional rules for online platforms allowing consumers to conclude distance contracts with traders when the provider qualifies as a micro or small enterprise, subject to the Regulation's conditions, 12-month transition after loss of status and VLOP exception.

This is not a blanket exemption from the DSA.

Article 30 trader-traceability requirements and Article 31 compliance-by-design belong to that Section and therefore must be selected through an applicability profile rather than universally hard-coded.

DROPi may nevertheless impose professional-merchant identity/business evidence as an internal risk/launch policy even if a particular DSA Article 30 obligation is not currently applicable. The evidence provenance must distinguish statutory duty from DROPi policy.

### Required object

```text
DsaApplicabilityProfile {
  operatingLegalEntityId
  serviceClassification[]
  principalEstablishmentCountry
  intermediaryServiceStatus
  hostingStatus
  onlinePlatformStatus
  distanceContractMarketplaceStatus
  enterpriseSizeEvidenceRef
  microSmallStatus
  section4Applicable
  vlopStatus
  transitionUntil?
  legalBasisVersion
  reviewedAt
  reviewDueAt
  approvalState
}
```

`section4Applicable = false` does not imply `DSA does not apply`.

## 8. Romanian DSA implementation / ANCOM evidence

Law 50/2024 designates ANCOM as Romania's Digital Services Coordinator.

Article 5 requires a Romanian provider of intermediary services, if the factual service falls within that classification, to inform ANCOM within at most 45 days from beginning the services, with identification/contact information in the required procedure; changes to submitted data also have a statutory notification path.

The current repository has identified ANCOM consultation/procedure material, but the exact final secondary procedure/current controlled copy must remain part of the source-capture/applicability review before filing.

Product evidence must support:

```text
DsaAuthorityEvidence {
  providerLegalEntityId
  classificationDecisionRef
  law50Article5Applies
  serviceStartDate
  notificationDeadline?
  ancomNotificationEvidenceRef?
  ancomAccountRef?          // reference only, no credentials
  contactPointVersion
  submittedAt?
  changeNotificationDueAt?
  authorityState
}
```

No credential or secret is stored in the legal corpus.

## 9. Merchant compliance profile

The first pilot deliberately admits professionals only.

```text
MerchantComplianceProfile {
  merchantId
  legalEntityId
  professionalStatus
  tradeRegisterRef
  taxRegistrationRef
  identityEvidenceRefs[]
  paymentProviderMerchantRef?
  sellerOfRecordProfileVersion
  allowedCategoryPack
  allowedZonePack
  productSafetyCapabilityState
  consumerLawResponsibilityVersion
  fulfilmentRolesAllowed[]
  policyDeclarations[]
  evidenceProvenance[]  // LAW_REQUIRED | DROPI_POLICY_REQUIRED | PROVIDER_REQUIRED
  reviewedAt
  reviewDueAt
  state
}
```

A merchant may be authenticated without being allowed to publish/sell. Account identity and Marketplace selling capability are separate.

## 10. Product safety and GPSR integration

`docs/legal/RO_LAUNCH_PRODUCT_ALLOWLIST_GPSR_CONTRACT_2026-09-15.md` owns the first-product allowlist and listing safety fields.

GPSR Article 19 sets distance-sale offer information for economic operators. Article 22 sets specific Marketplace obligations including Safety Gate/contact points, internal processes, three-working-day handling for relevant product-safety notices and interface design enabling required safety/traceability information.

Required Marketplace references:

```text
ListingComplianceProfile {
  listingId
  merchantComplianceProfileRef
  productSafetyProfileRef
  allowlistPackVersion
  safetyGateCheckEvidenceRef?
  legalPackVersion
  publishState
}
```

Product safety is evaluated per listing/product/category, not inherited from a globally verified merchant.

## 11. DSA notice/action and product-safety cases

The application must keep different legal workflows separate.

```text
NoticeActionCase {
  caseId
  legalDomain
  contentOrListingRef
  reporterType
  receivedAt
  legalBasisRef
  applicableDeadline?
  actionState
  reasonStatementRef?
  affectedActorNoticeRef?
  auditRefs[]
}

ProductSafetyCase {
  caseId
  productRef
  listingRefs[]
  merchantRefs[]
  source
  safetyGateRef?
  authorityOrderRef?
  receivedAt
  deadlineAt?
  disableRemoveState
  recallState
  consumerNotificationState
  evidenceRefs[]
}
```

A product-safety case is not just a generic content-moderation ticket.

## 12. Merchant/listing/checkout states

### Merchant

```text
ACCOUNT_ACTIVE
-> BUSINESS_EVIDENCE_PENDING
-> PROFESSIONAL_STATUS_REVIEW
-> SELLER_PROFILE_PENDING
-> MARKETPLACE_CAPABILITY_APPROVED
```

### Listing

```text
DRAFT
-> CATEGORY_REVIEW
-> PRODUCT_SAFETY_REVIEW
-> MARKETPLACE_DISCLOSURE_READY
-> APPROVED_FOR_PILOT
```

### Checkout

```text
DISCOVERY
-> PRECONTRACT_GATE
-> BINDING_CHECKOUT_GATE
-> CONTRACT_SNAPSHOT_COMMITTED
-> PSP_FLOW
-> ORDER_ACCEPTED
```

No transition skips a missing legal/evidence gate.

## 13. What engineering can safely implement before final legal approval

Safe `FOUNDATION` work:

- data structures supporting versioned/evidence-backed states;
- deny-by-default gate evaluator;
- immutable contract-snapshot/event mechanics;
- provenance labels distinguishing legal/policy/provider requirements;
- effective-date legal-pack selection;
- inaccessible states for non-approved seller/category/zone paths;
- tests proving UNKNOWN/expired evidence fails closed.

Law-dependent wording, exact responsibility allocation, DSA classification, final retention, final refund semantics and public enablement remain blocked until the corresponding review is approved.

## 14. Official sources rechecked 2026-09-15

- OUG 34/2014 current consolidated form: `https://legislatie.just.ro/Public/DetaliiDocument/307805`
- Law 50/2024: `https://legislatie.just.ro/public/DetaliiDocument/280106`
- DSA: `https://eur-lex.europa.eu/eli/reg/2022/2065/oj`
- GPSR consolidated: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02023R0988-20260529`
- ANCOM DSA/service-provider material: `https://www.ancom.ro/despre-noi/media/comunicate-de-presa/legea-privind-serviciile-digitale-a-fost-publicata-in-monitorul-oficial/` and current ANCOM digital-services material.

## 15. Current disposition

`CONTROL_CONTRACT_READY_FOR_REVIEW / DSA_CLASSIFICATION_PENDING / LAW-DEPENDENT ENABLEMENT DISABLED`
