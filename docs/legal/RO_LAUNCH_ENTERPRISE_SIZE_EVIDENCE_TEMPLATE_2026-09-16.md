# DROPi Romania Launch — Enterprise Size Evidence Template

> **STATUS: PRE-ENTITY / EVIDENCE TEMPLATE / FAIL-CLOSED**
> **Version:** 1.0.0
> **As of:** 2026-09-16
> **Parent:** #492
> **Related:** #493 #494 #497 #498 #499 #500 #501
> **Primary reference:** Commission Recommendation 2003/361/EC, as consumed by the relevant legal instrument

This document defines the evidence DROPi must gather before any legal-domain implementation may conclude that the Marketplace entity is a microenterprise, small enterprise, outside those categories, or entitled to an enterprise-size-based exception.

It intentionally contains **no invented company numbers**. Values remain `TBD` until the actual operating entity, ownership structure and accounting evidence exist.

## 1. Rule: one factual evidence pack, multiple legal-domain decisions

The same underlying company facts may be reused as evidence, but each legal instrument must produce its own applicability decision.

```text
factual enterprise evidence
  -> Recommendation 2003/361 calculation
  -> DSA Article 29 decision
  -> P2B Article 11/12 decision
  -> Accessibility/EAA microenterprise decision
```

Do not implement:

```text
smallCompany = true
```

as a universal compliance switch.

## 2. Core factual evidence pack

```text
EnterpriseEvidencePack {
  legalEntityId
  legalName
  countryOfIncorporation
  incorporationDate
  companyRegisterEvidenceRef

  ownershipSnapshotDate
  shareholdersOrMembers[]
  partnerEnterpriseRefs[]
  linkedEnterpriseRefs[]
  publicBodyControlState

  latestApprovedAccountingPeriodRef?
  previousApprovedAccountingPeriodRef?
  newlyEstablishedState
  bonaFideCurrentYearEstimateRef?

  directStaffAwu
  aggregatedStaffAwu
  staffCalculationEvidenceRef

  directAnnualTurnoverExVat
  aggregatedAnnualTurnoverExVat
  turnoverEvidenceRef

  directAnnualBalanceSheetTotal
  aggregatedAnnualBalanceSheetTotal
  balanceSheetEvidenceRef

  calculationCurrency
  currencyConversionPolicyRef?
  recommendationVersion
  preparedAt
  preparer
  reviewerRef?
  approvalState
}
```

## 3. Ownership / partner / linked enterprise worksheet

For each entity or person whose relationship can affect the Recommendation calculation, capture:

```text
EnterpriseRelationshipEvidence {
  subjectEntityId
  relatedEntityId
  relationshipType       // AUTONOMOUS | PARTNER | LINKED | OTHER_REVIEW_REQUIRED
  ownershipPercent?
  votingRightsPercent?
  controlRightsDescription?
  upstreamOrDownstream
  evidenceRefs[]
  effectiveFrom
  effectiveTo?
  reviewState
}
```

No threshold calculation is final while a material relationship remains `OTHER_REVIEW_REQUIRED`.

## 4. Staff headcount evidence

Recommendation 2003/361 uses annual work units (`AWU`), not a casual current employee count.

The evidence model must support the relevant categories of staff and proportional treatment required by the Recommendation.

```text
StaffAwuEvidence {
  accountingPeriod
  employeeAwu
  employeeEquivalentAwu
  ownerManagerAwu
  activePartnerAwu
  partTimeSeasonalFractionalAwu
  excludedApprenticeStudentAwu?
  parentalLeaveTreatmentRef?
  directTotalAwu
  partnerLinkedAdjustments[]
  aggregatedTotalAwu
  sourceEvidenceRefs[]
  reviewerRef?
}
```

The legal/accounting reviewer must confirm the exact treatment of each real person/category before the value becomes authoritative.

## 5. Financial evidence

```text
FinancialSizeEvidence {
  accountingPeriod
  approvedAccountsState
  annualTurnoverExVat
  annualBalanceSheetTotal
  partnerLinkedAdjustments[]
  aggregatedTurnoverExVat
  aggregatedBalanceSheetTotal
  sourceEvidenceRefs[]
  reviewerRef?
}
```

Turnover and balance-sheet total are separate alternative financial thresholds under Recommendation 2003/361. Do not replace them with profit, cash balance, valuation or tax liability.

## 6. Newly established entity path

Where the company has no approved accounts yet, the Recommendation provides for a bona fide estimate during the financial year.

```text
NewEnterpriseEstimate {
  legalEntityId
  estimatePeriod
  projectedStaffAwu
  projectedAnnualTurnoverExVat
  projectedAnnualBalanceSheetTotal
  assumptions[]
  sourceEvidenceRefs[]
  preparedBy
  preparedAt
  accountantReviewRef?
  approvalState
}
```

A product manager estimate or placeholder number is not sufficient evidence.

## 7. Two-consecutive-accounting-period status-change record

Recommendation Article 4(2) must be represented where relevant to acquisition/loss of micro/small/medium status.

```text
RecommendationStatusChangeAssessment {
  legalEntityId
  targetStatus          // MICRO | SMALL | MEDIUM | OUTSIDE_SME
  period1AssessmentRef
  period2AssessmentRef
  thresholdDirection   // ABOVE | BELOW
  consecutivePeriodsSatisfied
  statusBefore
  candidateStatusAfter
  effectiveStatusState
  reviewerRef?
  reviewedAt
}
```

No implementation may infer a status change merely because a single current-year metric crossed a threshold when Article 4(2) requires the two-period rule.

## 8. Domain-specific decision — DSA Article 29

```text
DsaArticle29EnterpriseDecision {
  enterpriseEvidencePackRef
  recommendationStatusChangeAssessmentRef?
  microEnterpriseState
  smallEnterpriseState
  microOrSmallState
  priorMicroOrSmallStatusLossDate?
  article29TwelveMonthContinuationUntil?
  vlopDesignationState
  section4ApplicabilityProfileRef
  decisionState
  reviewerRef?
  reviewedAt
  reviewDueAt
}
```

Candidate decision values:

```text
EVIDENCE_INCOMPLETE
MICRO_OR_SMALL_EXCLUSION_CANDIDATE
TWELVE_MONTH_CONTINUATION_CANDIDATE
SECTION4_APPLIES_NON_SMALL_CANDIDATE
SECTION4_APPLIES_VLOP_OVERRIDE
APPROVED
```

The `*_CANDIDATE` values are not production authority.

## 9. Domain-specific decision — P2B

For the P2B obligation-specific small-enterprise exception candidate:

```text
P2bSmallEnterpriseDecision {
  enterpriseEvidencePackRef
  recommendationStatusChangeAssessmentRef?
  personsThresholdState      // <50
  turnoverThresholdState     // <=10m
  balanceSheetThresholdState // <=10m
  smallEnterpriseState
  article11ComplaintExceptionState
  article12MediationExceptionState
  otherP2bObligationsUnaffected
  reviewerRef?
  reviewedAt
  reviewDueAt
}
```

A positive size exception for Articles 11/12 must not disable other P2B duties.

## 10. Domain-specific decision — Accessibility

For the accessibility services microenterprise exception candidate:

```text
AccessibilityMicroenterpriseDecision {
  enterpriseEvidencePackRef
  personsThresholdState      // <10
  turnoverThresholdState     // <=2m
  balanceSheetThresholdState // <=2m
  microenterpriseState
  servicesExemptionState
  accessibilityPolicyControlsRemainEnabled
  reviewerRef?
  reviewedAt
  reviewDueAt
}
```

Romanian fiscal `microîntreprindere` status is not an input substitute for this decision.

## 11. Review triggers

Invalidate/review the evidence pack when any material item changes:

- operating legal entity;
- ownership, voting or control rights;
- partner/linked enterprise structure;
- merger/acquisition/reorganisation;
- close/approval of a new accounting period;
- headcount/AWU materially changes;
- annual turnover or balance-sheet total changes across thresholds;
- newly established estimate is replaced by approved accounts;
- VLOP designation/status changes;
- Recommendation 2003/361 or a consuming legal instrument changes.

## 12. Storage and privacy

Do not place confidential accounts, payroll data, shareholder identity documents or tax filings in a public legal corpus merely to prove a threshold.

Repository-safe evidence may contain:

- evidence IDs;
- document type;
- period/date;
- sanitized calculated values where approved for repository disclosure;
- hash/reference to restricted storage;
- reviewer identity/qualification where appropriate;
- approval/review dates.

Restricted source documents remain outside the public repository and are referenced, not copied, unless the repository and access model are later changed deliberately.

## 13. Fail-closed rule

```text
if entity_unknown
or material_ownership_relation_unknown
or size_evidence_incomplete
or calculation_stale
or required_reviewer_approval_missing:
    size_based_legal_exception = NOT_AUTHORIZED
```

No missing evidence may be replaced with a favorable default.

## 14. Current DROPi state

```text
OPERATING_ENTITY = NOT_YET_APPROVED
OWNERSHIP_GROUP_EVIDENCE = NOT_YET_CAPTURED
RECOMMENDATION_2003_361_SIZE_STATE = EVIDENCE_PENDING
DSA_ART29_SIZE_EXCEPTION = NOT_YET_VALIDATED
P2B_ART11_12_SIZE_EXCEPTION = NOT_YET_VALIDATED
ACCESSIBILITY_MICROENTERPRISE_EXEMPTION = NOT_YET_VALIDATED
```

This template allows the project to gather the right evidence once and derive the separate legal-domain decisions without hardcoding assumptions.
