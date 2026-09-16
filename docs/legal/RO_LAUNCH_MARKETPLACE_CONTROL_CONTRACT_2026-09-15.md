# RO-LAUNCH-002 — Romania Marketplace Legal Control Contract

> **STATUS: PRE-COUNSEL / FAIL-CLOSED / LAW-DEPENDENT ENABLEMENT BLOCKED**
> **As of:** 2026-09-15
> **Issue:** #494
> **Parent:** #492

This document translates the current Romanian/EU Marketplace evidence into a technical control contract. It does not certify DROPi's final DSA classification, validate final consumer wording, or authorize public commerce.

## 1. Core rule

The first launch must never reduce legal state to booleans such as:

```text
merchant.verified = true
product.safe = true
marketplace.compliant = true
order.legal = true
```

Instead the application must be able to explain the applicable legal pack, evidence, effective dates, actor responsibilities and unresolved gates for every binding transaction.

The current consumer source family must be evaluated together, not as isolated checkbox laws:

```text
OUG 34/2014          // distance/off-premises consumer contracts + Marketplace disclosures
OUG 18/2026          // 2026 amendments with multiple effective-date boundaries
Law 363/2007         // unfair commercial practices / online-marketplace consumer rules
Law 193/2000         // unfair terms in professional-consumer contracts
Law 365/2002         // electronic-commerce / information-society-service baseline
HG 1308/2002         // historical methodological norms; current payment rules require reconciliation
OG 38/2015           // alternative dispute resolution baseline
ANPC Order 270/2026  // current SAL information/display changes
DSA + Law 50/2024    // intermediary/platform obligations where factually applicable
GPSR                 // product-safety / Marketplace obligations
```

A source being registered does not mean every provision applies to DROPi or is already effective on the transaction date.

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

## 3. Unfair-commercial-practice / presentation integrity gate

The current Legislative Portal consolidation of Law 363/2007 dated 27 March 2026 is now registered in the controlled source inventory. It is part of the Marketplace consumer pack and must be reviewed together with OUG 18/2026 and OUG 34/2014.

The application therefore needs a versioned presentation-integrity control rather than treating marketing/UI copy as outside compliance.

Candidate model:

```text
ConsumerPresentationProfile {
  surfaceId
  legalPackVersion
  offerIdentityRef
  pricePresentationRef
  rankingDisclosureRef?
  sponsoredPlacementDisclosureRef?
  reviewProvenancePolicyRef?
  scarcityUrgencyClaimEvidenceRef?
  environmentalDurabilityClaimEvidenceRef?
  comparisonClaimEvidenceRef?
  darkPatternReviewRef?
  locale
  effectiveFrom
  effectiveTo?
  approvalState
}
```

Fail-closed rule:

```text
UNVERIFIED MATERIAL CONSUMER CLAIM
OR MISLEADING/AMBIGUOUS PRICE OR RESPONSIBILITY PRESENTATION
OR REQUIRED DISCLOSURE MISSING
=> BINDING/PROMOTED SURFACE NOT APPROVED
```

This does not mean every field above is legally mandatory for every listing. It means DROPi has a place to preserve the evidence and applicability decision when a claim/feature exists.

The official ANPC 2026 online-commerce guide is useful as a design-QA checklist for Marketplace information, interface practices, payments, complaints and product safety, but ANPC expressly presents the guide as orientative/informative. It is not promoted to normative authority and cannot override the underlying law.

## 4. Consumer Terms / unfair-terms gate

Law 193/2000 is now registered as the Romanian unfair-terms baseline for contracts between professionals and consumers.

DROPi must not assume that acceptance of a click-wrap Terms document makes every clause enforceable. Final customer/merchant responsibility wording must therefore pass a dedicated legal review before public checkout.

Required contract metadata:

```text
ConsumerTermsVersion {
  id
  supplierActorId
  platformActorId?
  locale
  termsDocumentRef
  responsibilityAllocationRef
  withdrawalInformationRef
  complaintAdrInformationRef
  legalPackVersion
  effectiveFrom
  effectiveTo?
  unfairTermsReviewState
  qualifiedReviewerRef?
  approvalState
}
```

Hard rules:

- consumer Terms must not be generated dynamically from unreviewed merchant/platform fragments;
- contractual wording cannot waive mandatory consumer rights merely because the consumer clicked `Accept`;
- responsibility allocation shown by DROPi cannot be used to erase liability imposed by law on the relevant actor;
- a new material Terms version requires version/effective-date evidence and a decision on whether renewed acceptance/notice is required.

Current state for final public Terms: `HOLD_QUALIFIED_REVIEW`.

## 5. Binding checkout contract snapshot

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
  consumerPresentationProfileRef
  customerTermsVersion
  merchantTermsVersion
  withdrawalInformationVersion
  complaintAdrInformationVersion
  legalPackVersion
  locale
  createdAt
  integrityHashOrImmutableEventRef
}
```

The snapshot does not replace fiscal invoices, PSP evidence or separate safety/legal records.

## 6. Immediate-before-order controls

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
  AND consumer_presentation_profile_approved
  AND price_currency_components_frozen
  AND fulfilment_role_approved
  AND payment_flow_approved
  AND customer_terms_current
  AND unfair_terms_review_approved
  AND withdrawal_information_current
  AND complaint_adr_information_current
```

Any `UNKNOWN`, expired or missing required component denies binding checkout with a reason-coded state.

## 7. Online withdrawal function — already effective in 2026

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

## 8. Effective-date legal-pack switching — 27 September 2026 boundary

OUG 18/2026 creates multiple 2026 effective-date boundaries. The current consolidated OUG 34/2014 and Law 363/2007 source families contain provisions/amendments that are marked as applying from **27 September 2026**.

On 15 September 2026 those future-effective rules must not be represented as already active merely because they appear in a consolidated Portal page.

Required control:

```text
LegalPack {
  jurisdiction = RO
  version
  effectiveFrom
  effectiveTo?
  consumerInformationSchemaVersion
  unfairPracticesSchemaVersion
  withdrawalSchemaVersion
  adrInformationSchemaVersion
  categorySchemaVersion
  sourceRefs[]
  applicabilityDecisionRefs[]
  reviewState
}
```

If a release/transaction date crosses an effective-date boundary, checkout and consumer-facing surfaces must select the pack effective for that date.

Tests must cover at least:

```text
2026-09-26 transaction -> pre-27-Sept pack
2026-09-27 transaction -> post-boundary pack, if the cited provision is legally effective then
```

The exact fields changing at the boundary remain tied to the provision-to-control matrix and qualified review; engineering must not infer them from a date alone.

## 9. Consumer ADR / SAL support contract

OG 38/2015 is now registered as the Romanian alternative-dispute-resolution baseline, and ANPC Order 270/2026 is registered as the current 2026 source changing SAL information/display measures, including the current ANPC SAL destination referenced by the order.

DROPi must model ADR information as a versioned consumer-information capability rather than hardcoding a footer link copied from an old website.

```text
ConsumerAdrInformationVersion {
  id
  actorId
  channel        // WEB | ANDROID | IOS | EMAIL | CONTRACT | OTHER
  salApplicabilityState
  requiredTextRef?
  requiredIconOrPlaqueRef?
  destinationUrlRef?
  legalPackVersion
  effectiveFrom
  effectiveTo?
  reviewState
}
```

The exact duty to display a plaque/icon/link on each DROPi surface must be determined from the current source pack and factual role before enforcement. A generic support page is not evidence that required ADR information has been provided.

Dedicated consumer-rights workflows may link to general support, but general support does not replace withdrawal, conformity, ADR, safety or privacy rights.

## 10. DSA applicability profile — no global exemption switch

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

## 11. Romanian DSA implementation / ANCOM evidence

Law 50/2024 designates ANCOM as Romania's Digital Services Coordinator.

Article 5 requires a Romanian provider of intermediary services, if the factual service falls within that classification, to inform ANCOM within at most 45 days from beginning the services, with identification/contact information in the required procedure; changes to submitted data also have a statutory notification path.

The repository has current evidence that ANCOM's secondary procedure remains a separate current-source/applicability checkpoint. A consultation draft is not production filing authority.

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

## 12. Merchant compliance profile

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

## 13. Product safety and GPSR integration

`docs/legal/RO_LAUNCH_PRODUCT_ALLOWLIST_GPSR_CONTRACT_2026-09-15.md` owns the first-product allowlist and listing safety fields.

GPSR Article 19 sets distance-sale offer information for economic operators. Article 22 sets specific Marketplace obligations including Safety Gate/contact points, internal processes, handling of relevant product-safety notices and interface design enabling required safety/traceability information.

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

## 14. DSA notice/action and product-safety cases

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

## 15. Merchant/listing/checkout states

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
-> CONSUMER_PRESENTATION_GATE
-> PRECONTRACT_GATE
-> BINDING_CHECKOUT_GATE
-> CONTRACT_SNAPSHOT_COMMITTED
-> PSP_FLOW
-> ORDER_ACCEPTED
```

No transition skips a missing legal/evidence gate.

## 16. What engineering can safely implement before final legal approval

Safe `FOUNDATION` work:

- data structures supporting versioned/evidence-backed states;
- deny-by-default gate evaluator;
- immutable contract-snapshot/event mechanics;
- provenance labels distinguishing legal/policy/provider requirements;
- effective-date legal-pack selection;
- consumer-presentation evidence/versioning;
- Terms/unfair-terms review state;
- ADR/SAL information versioning by channel;
- inaccessible states for non-approved seller/category/zone paths;
- tests proving UNKNOWN/expired evidence fails closed.

Law-dependent wording, exact responsibility allocation, DSA classification, final Terms approval, final ADR surface requirements, final retention, final refund semantics and public enablement remain blocked until the corresponding review is approved.

## 17. Official sources rechecked / registered 2026-09-15

Primary/current source endpoints:

- OUG 34/2014 current consolidated form: `https://legislatie.just.ro/Public/DetaliiDocument/307805`
- OUG 18/2026: `https://legislatie.just.ro/Public/DetaliiDocumentAfis/308474`
- Law 363/2007 consolidated 2026-03-27: `https://legislatie.just.ro/Public/DetaliiDocument/307803`
- Law 193/2000 republished: `https://legislatie.just.ro/Public/DetaliiDocument/91502`
- Law 365/2002 electronic commerce: registered official Legislative Portal source
- OG 38/2015 ADR: `https://legislatie.just.ro/Public/DetaliiDocument/193569`
- ANPC Order 270/2026: `https://legislatie.just.ro/Public/DetaliiDocument/310590`
- Law 50/2024: `https://legislatie.just.ro/public/DetaliiDocument/280106`
- DSA: `https://eur-lex.europa.eu/eli/reg/2022/2065/oj`
- GPSR consolidated: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02023R0988-20260529`

Official non-normative guidance:

- ANPC Good Practices Guide for Online Products and Services Market — 2026: `https://anpc.ro/wp-content/uploads/2026/07/GHID-comert-online-final-06.07.2026.pdf`

Controlled-copy state for the newly registered Law 363/2007, Law 193/2000, OG 38/2015, ANPC Order 270/2026 and ANPC 2026 online-commerce guide remains `pending_primary_copy` because their official endpoints refused automated retrieval from GitHub Actions. No hash or archive path was invented. Their official endpoints and reliance states remain registered for later controlled capture/review.

## 18. Current disposition

The source-discovery gap for the main Romanian Marketplace consumer-law family is materially reduced. The unresolved launch work is now primarily:

```text
exact provision-to-DROPi-flow matrix
+ effective-date switching validation
+ final seller/platform responsibility allocation
+ Law 193/2000 Terms review
+ Law 363/2007 presentation/marketing/ranking applicability review
+ OG 38/2015 + Order 270/2026 SAL surface applicability
+ DSA classification
+ qualified final checkout/public wording review
+ implementation/runtime evidence
```

Current state:

`CONTROL_CONTRACT_READY_FOR_REVIEW / SOURCE_COPIES_PARTLY_PENDING / PUBLIC_BINDING_CHECKOUT HOLD`
