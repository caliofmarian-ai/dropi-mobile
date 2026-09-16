# DROPi Romania — Cross-Cutting Applicability Worksheet

> **STATUS: PRE-COUNSEL / PRE-ACCOUNTANT / FAIL-CLOSED**
> **As of:** 2026-09-16
> **Parent:** #492
> **Related:** #494 #497 #498 #499 #500 #501
> **Consumes:** `RO_LAUNCH_PLATFORM_BUSINESS_TAX_ACCESSIBILITY_PACKAGING_CONTRACT_2026-09-16.md`

This worksheet separates facts already established by the candidate first-pilot architecture from facts that still require entity evidence, professional interpretation or a Product Owner commercial choice.

`LIKELY_IN_SCOPE` is a research classification used to focus review. It is **not** legal approval, filing authority or production enablement.

## 1. Common candidate facts

The current first-pilot hypothesis supplies these factual inputs:

```text
jurisdiction = Romania / EU
surface = online Marketplace / web + mobile interface
seller cohort = professional merchants
customer cohort = consumers
merchant relationship = contractual platform relationship
transaction = consumer may conclude purchase through DROPi interface
first goods = goods already located in Romania
first fulfilment = merchant-managed
payment = external Marketplace PSP
DROPi customer-fund custody = false
```

Facts not yet approved include the final Romanian entity, actual linked/partner-enterprise group facts, final product family/zone/caps, selected PSP, final packaging/import/packing actors and any integrated postal-resale role.

---

# A. P2B — Regulation (EU) 2019/1150

## 2. Factual scope worksheet

| Test | Candidate fact | Research state | Production consequence |
|---|---|---|---|
| Information-society service | DROPi is designed as an online/app Marketplace | `LIKELY_YES / REVIEW_REQUIRED` | Preserve P2B applicability profile; do not bypass merchant-side Terms controls. |
| Business users | First pilot admits professional merchants | `LIKELY_YES / REVIEW_REQUIRED` | Merchant relationship is distinct from consumer Terms. |
| Consumers in EU | Romanian consumers are the first target | `YES_BY_CANDIDATE_SCOPE` | EU consumer-facing transaction limb is present. |
| Platform facilitates direct transactions | Consumer checkout is intended through DROPi | `LIKELY_YES / REVIEW_REQUIRED` | Candidate service resembles an online intermediation service. |
| Contractual relationship with business users | Merchant onboarding/Marketplace Terms are required | `YES_BY_CANDIDATE_SCOPE` | Merchant contract must be versioned and evidence-backed. |

Research disposition:

```text
P2B_SERVICE_CLASSIFICATION = LIKELY_IN_SCOPE / QUALIFIED_CONFIRMATION_PENDING
```

No public merchant activation is authorized by this research classification.

## 3. P2B size exception must be obligation-specific

Regulation 2019/1150 uses the EU SME Recommendation for the specific small-enterprise exceptions attached to its internal complaint-handling and mediation provisions.

For that recommendation, a candidate **small enterprise** test uses:

```text
persons_employed < 50
AND
(annual_turnover <= EUR 10m OR annual_balance_sheet_total <= EUR 10m)
```

Partner/linked-enterprise treatment must be included where the Recommendation requires it.

This threshold must not be confused with:

- the EAA/accessibility **microenterprise** threshold below; or
- Romanian fiscal `microîntreprindere` status.

Required evidence object:

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

## 4. P2B obligation matrix to obtain final review for

Final counsel review must explicitly classify, rather than globally enable/disable:

- merchant Terms availability/intelligibility;
- merchant Terms change notice/effective date;
- restriction/suspension/termination grounds and decision evidence;
- business-user ranking disclosure;
- differentiated-treatment disclosure;
- data-access/data-use and post-termination access disclosure;
- parity/different-condition restrictions where relevant;
- internal complaint-handling system — including the specific small-enterprise exception;
- mediation obligations — including the specific small-enterprise exception.

Safe engineering before final review: versioning, reason-coded decisions, evidence references, notice delivery/audit and fail-closed applicability machinery.

---

# B. DAC7 — current consolidated DAC + Romanian implementation

## 5. Current authority chain correction

The DAC7 pack must no longer stop at Directive (EU) 2021/514 + OG 16/2023.

Current controlled source family now includes:

- `EU-DIR-2011-16-DAC-CONSOLIDATED-2026-01-01` — archived current consolidated DAC text;
- `EU-DIR-2021-514-DAC7` — amendment source/history;
- `RO-OG-16-2023-DAC7` — Romanian implementation source family;
- `RO-OUG-71-2025-DAC7-CURRENT-AMENDMENTS` — 2025/2026 Article 291^5 update family, controlled copy pending;
- `RO-OG-1-2026-TAX-PROCEDURE-DAC-CURRENT` — further 2026 Tax Procedure Code amendment family, controlled copy pending;
- ANAF DAC7 guidance and current form/order family already registered.

Implementation must consume a versioned Romanian DAC7 legal pack rather than treating the original 2023 implementation as frozen.

## 6. Platform/operator/relevant-activity worksheet

| Test | Candidate fact | Research state | Consequence |
|---|---|---|---|
| Software/platform enabling sellers to connect to users | DROPi Marketplace connects merchants and consumers | `LIKELY_YES` | Keep DAC7 platform profile active for review. |
| Contract with sellers to make platform available | Merchant Marketplace contract is part of first pilot | `LIKELY_YES` | Candidate DROPi entity may be a Platform Operator. |
| Relevant Activity — sale of goods | First pilot is sale of merchant goods | `YES_FOR_ACTIVITY_TYPE` | Goods branch of DAC7 must be assessed. |
| Reporting Platform Operator | Depends on final DROPi legal entity/nexus and exclusions | `NOT_YET_VALIDATED` | No filing/registration flag may be enabled yet. |
| Reporting Member State / registration route | Final entity/nexus not approved | `NOT_YET_VALIDATED` | Do not hard-code Romania merely from pilot geography. |

Research disposition:

```text
DAC7_PLATFORM_OPERATOR_CANDIDATE = LIKELY
DAC7_REPORTING_PLATFORM_OPERATOR = NOT_YET_VALIDATED
DAC7_REPORTING_JURISDICTION = NOT_YET_VALIDATED
```

## 7. Seller exclusion — important first-pilot rule

Professional/company status does **not** itself make a seller excluded.

For the sale-of-goods de-minimis excluded-seller test in the current consolidated DAC framework, both conditions are material for the reporting period:

```text
facilitated_sale_of_goods_activities < 30
AND
total_consideration <= EUR 2,000
```

Other excluded-seller classes must be evaluated separately from current authority; engineering must not reduce the entire test to this de-minimis row.

Required seller classifier:

```text
Dac7SellerClassification {
  merchantId
  sellerType
  excludedClassChecks[]
  saleOfGoodsActivityCount
  totalConsideration
  currencyConversionPolicyRef
  evidenceRefs[]
  reportableSellerState
  sourcePackVersion
  taxYear
  reviewedAt
}
```

## 8. Current Romanian reporting mechanics

The controlled ANAF source family identifies a current operational path including F7000 and the associated registration/election/control forms.

The current source pack identifies **31 January following the reporting period** as the statutory DAC7 reporting deadline for reportable seller information. Engineering should nevertheless store the deadline as versioned policy data, not as an irreversible magic constant, because forms/procedure/amendment packs can change.

Current Romanian source discovery also identifies:

- specific non-EU registration path(s), including Form 707 where applicable;
- election/notification mechanics where an operator qualifies in multiple Member States, including Form 708 where applicable;
- 2025/2026 changes to Article 291^5 identification/registry mechanics.

These do not prove that DROPi must use any one of those forms; the entity/nexus analysis chooses the route.

## 9. DAC7 evidence retention

Current ANAF guidance identifies retention of supporting due-diligence/reporting evidence for at least five years and not more than ten years after the end of the reporting period, subject to the current Romanian pack and the exact record category.

This does **not** create one global merchant-retention period. DAC7 evidence must use its own approved retention policy and legal basis under #498.

---

# C. Accessibility — Romanian Law 232/2022 / EAA

## 10. Service-scope worksheet

The candidate DROPi consumer Marketplace is an online service provided at a consumer's individual request with a view to concluding a consumer contract.

Romanian Law 232/2022 expressly includes e-commerce services in its service scope for services provided to consumers after 28 June 2025.

Research disposition:

```text
ACCESSIBILITY_ECOMMERCE_SERVICE_SCOPE = IDENTIFIED
ACCESSIBILITY_MICROENTERPRISE_EXEMPTION = EVIDENCE_PENDING
```

The remaining main launch classification question is therefore not whether the proposed flow resembles e-commerce; it is whether the actual operating entity qualifies for the statutory services exemption and what controls remain applicable to the factual service.

## 11. Accessibility microenterprise test

The relevant headline statutory/EAA microenterprise test is:

```text
persons_employed < 10
AND
(annual_turnover <= EUR 2m OR annual_balance_sheet_total <= EUR 2m)
```

This is not the same threshold as the P2B `small enterprise` exception and is not the Romanian Tax Code's fiscal microenterprise regime.

Required evidence:

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

A change in group structure, workforce, turnover/balance evidence or legal definition is a review trigger.

## 12. Candidate accessibility implementation profile

If the service is not exempt, the final matrix must cover the applicable requirements for at least:

- product/service accessibility information exposed through the e-commerce service where supplied by the responsible economic operator;
- identification/authentication/security functions delivered as part of the service;
- payment functions delivered as part of the service;
- navigation/forms/checkout;
- withdrawal/returns/support;
- accessibility information required for the service;
- web and mobile critical flows.

Accessible engineering remains a safe DROPi quality policy even while exemption evidence is pending. A release may be tested for accessibility without claiming legal certification.

---

# D. PPWR / Romanian packaging and EPR

## 13. Two different packaging questions must never be collapsed

The first launch needs two independent profiles:

```text
1. PackagingProducerResponsibilityProfile
2. PpwrOnlinePlatformVerificationProfile
```

The first asks who is the producer/importer/distributor/packer/fulfilment/EPR actor for each packaging layer.

The second asks whether DROPi, as an online platform, has a direct PPWR verification duty before allowing a producer to use the Marketplace.

`merchant-managed fulfilment` may simplify operational packing but does not automatically answer either legal question.

## 14. PPWR online-platform verification gate

Regulation (EU) 2025/40 applies from 12 August 2026.

Where the factual service falls within the PPWR rule for online platforms that are within Section 4 of Chapter III DSA and allow consumers to conclude distance contracts with producers, the platform must be able to obtain before allowing the producer to use the service:

- the producer's relevant registration information/registration number for the Member State where the consumer is located; and
- the producer's self-certification concerning compliance with the applicable extended-producer-responsibility requirements.

The platform must then support the PPWR `best efforts` completeness/reliability assessment required by the applicable provision.

Candidate evidence model:

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
and required_registration_or_self_certification_or_verification_evidence_missing:
    producer_marketplace_activation = DENIED
```

The exact interaction with the DSA Section 4 enterprise-size scope/exclusion must be professionally confirmed for the actual DROPi entity; it must not be inferred from a generic `smallCompany` flag.

## 15. Producer/EPR actor profile remains separate

Even if DROPi has the online-platform verification duty, that does not automatically make DROPi the packaging producer or the entity owing every Romanian Environmental Fund/EPR obligation.

Current Romanian source family now additionally registers:

- `RO-OUG-196-2005-ENVIRONMENT-FUND-CURRENT-2026-09-16` — current Environmental Fund framework endpoint, controlled primary copy pending;
- `RO-LAW-79-2026-ENVIRONMENT-FUND-AMENDMENT` — 2026 amendment family, controlled primary copy pending;
- `RO-LAW-249-2015-PACKAGING-CURRENT` — packaging/waste baseline already registered.

Final role analysis must map actual placing-on-market, importing, overpacking, fulfilment and shipping-packaging facts to the current Romanian obligations.

## 16. PPWR later effective engineering policy

The legal pack should also version future PPWR operational milestones instead of coding all visible consolidated provisions as active immediately.

One relevant later design track is the PPWR empty-space/minimisation framework for grouped, transport and e-commerce packaging. Those later requirements are not promoted here as first-pilot August/September 2026 obligations merely because they exist in PPWR; their exact effective dates/methodology must remain versioned policy data.

---

# E. Cross-domain size evidence — do not reuse the wrong threshold

## 17. Threshold matrix

| Domain | Candidate exception | Headline size test | Current state |
|---|---|---|---|
| P2B | Specific Article 11/12 small-enterprise exceptions | `<50` persons and `<= EUR 10m` turnover **or** balance-sheet total | Evidence + exact obligation applicability pending |
| Accessibility/EAA | Microenterprise providing services exemption | `<10` persons and `<= EUR 2m` turnover **or** balance-sheet total | Evidence pending |
| Romanian fiscal microenterprise regime | Tax classification | **Not a substitute for either row above** | Separate #493 tax analysis |

No generic `companySize = SMALL` state is authoritative across these domains.

Recommended shared evidence model:

```text
EnterpriseSizeAssessment {
  legalEntityId
  legalDomain
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

---

# F. Implementation disposition

## 18. Safe work now

Subject to the separate #501 backlog-authorization gate, safe foundation design includes:

- P2B versioned Terms, notices and reason-coded merchant decisions;
- enterprise-size evidence abstraction by legal domain;
- DAC7 platform/operator/seller classification objects with tax-specific collection disabled until approved;
- versioned reporting-calendar/schema/receipt/correction evidence machinery;
- accessible web/mobile critical-flow components and regression tests;
- separate packaging producer-role and PPWR platform-verification profiles;
- fail-closed merchant activation when a mandatory applicability/evidence row is `UNKNOWN`, missing, expired or suspended.

## 19. Still blocked

```text
P2B_FINAL_APPLICABILITY_AND_TERMS = NOT_YET_VALIDATED
DAC7_REPORTING_OPERATOR_AND_JURISDICTION = NOT_YET_VALIDATED
DAC7_MANDATORY_COLLECTION_AND_FILING = DISABLED
ACCESSIBILITY_MICROENTERPRISE_EXEMPTION = NOT_YET_VALIDATED
PPWR_DSA_SECTION4_INTERACTION = NOT_YET_VALIDATED
PACKAGING_EPR_RESPONSIBLE_ACTOR = NOT_YET_VALIDATED
PUBLIC_MERCHANT_ACTIVATION = BLOCKED
```

This worksheet narrows the remaining questions; it does not convert them into PASS.
