# DROPi Romania Launch — DSA Article 29 / PPWR Article 45 Applicability Contract

> **STATUS: PRE-COUNSEL / FAIL-CLOSED / RESEARCH INTERPRETATION**
> **Version:** 1.0.0
> **As of:** 2026-09-16
> **Parent:** #492
> **Related:** #494 #497 #498 #499 #500 #501
> **Consumes:** Regulation (EU) 2022/2065 (DSA), Regulation (EU) 2025/40 (PPWR), Commission Recommendation 2003/361/EC

This contract narrows one previously generic launch blocker: the relationship between the DSA Chapter III Section 4 enterprise-size exclusion and the PPWR Article 45(4) online-platform producer-verification duty.

It records a textual research interpretation from current official EU sources. It is not a qualified legal opinion and does not authorize merchant or producer activation.

## 1. Exact statutory dependency

DSA Chapter III **Section 4** contains the additional provisions for online platforms that allow consumers to conclude distance contracts with traders.

DSA Article 29 provides that Section 4 does not apply to such platform providers while they qualify as a **microenterprise or small enterprise** under Commission Recommendation 2003/361/EC.

Article 29 further provides that the Section 4 exclusion continues for 12 months after the provider loses micro/small status under Article 4(2) of Recommendation 2003/361/EC, unless the provider is a very large online platform (`VLOP`) under DSA Article 33.

A VLOP designation overrides the Article 29 micro/small exclusion for Section 4.

PPWR Article 45(4), in turn, expressly applies to providers of online platforms that:

1. **fall within the scope of DSA Chapter III Section 4**; and
2. allow consumers to conclude distance contracts with producers.

Where that PPWR trigger is met, before allowing a producer to use the service the platform must obtain the Article 45(4) producer information, including the relevant producer registration information/number and the producer self-certification concerning applicable EPR compliance.

PPWR Article 45(6) then requires the platform, before producer access, to make best efforts to assess whether that information is complete and reliable.

## 2. Research consequence for DROPi

The PPWR online-platform gate is therefore **conditional on the DSA Article 29 / Section 4 state** rather than being a universal marketplace obligation.

Current research state:

```text
PPWR_ART45_PLATFORM_VERIFICATION =
  CONDITIONAL_ON_DSA_ART29_SECTION4_SCOPE

DROPI_DSA_ART29_SIZE_STATE =
  EVIDENCE_PENDING

DROPI_DSA_SECTION4_STATE =
  NOT_YET_VALIDATED
```

This is a narrower result than a generic `PPWR scope unknown`, but it is not a final `NOT_APPLICABLE` finding.

## 3. DSA Section 4 applicability profile

```text
DsaSection4ApplicabilityProfile {
  providerLegalEntityId
  serviceId
  allowsConsumerTraderDistanceContractsState

  recommendation2003_361ProfileRef
  autonomousPartnerLinkedEnterpriseState
  staffHeadcountAwuEvidenceRef
  annualTurnoverEvidenceRef
  annualBalanceSheetEvidenceRef
  latestApprovedAccountingPeriodRef?
  newlyEstablishedBonaFideEstimateRef?

  microEnterpriseState
  smallEnterpriseState
  microOrSmallState

  priorMicroOrSmallState?
  recommendationArticle4_2StatusChangeState
  statusLossEffectiveDate?
  article29TwelveMonthContinuationUntil?

  vlopDesignationState
  vlopDesignationEvidenceRef?

  dsaSection4ApplicabilityState
  sourcePackVersion
  reviewerRef?
  reviewedAt
  reviewDueAt
  approvalState
}
```

### Required `dsaSection4ApplicabilityState` values

```text
UNKNOWN
EXCLUDED_ART29_MICRO_SMALL
EXCLUDED_ART29_12_MONTH_CONTINUATION
APPLIES_NON_SMALL
APPLIES_VLOP_OVERRIDE
NOT_APPLICABLE_OTHER_REASON
```

`NOT_APPLICABLE_OTHER_REASON` requires a separate approved legal basis; it is not a fallback value.

## 4. Enterprise-size evidence used by DSA Article 29

Recommendation 2003/361/EC defines:

```text
microenterprise:
  persons_employed < 10
  AND (annual_turnover <= EUR 2m OR annual_balance_sheet_total <= EUR 2m)

small enterprise:
  persons_employed < 50
  AND (annual_turnover <= EUR 10m OR annual_balance_sheet_total <= EUR 10m)
```

The Recommendation also requires the applicable autonomous/partner/linked-enterprise calculations rather than evaluating the legal entity in isolation where aggregation rules apply.

For staff and financial data, the Recommendation uses the latest approved accounting period calculated annually. Under Article 4(2), crossing the thresholds does not normally cause acquisition/loss of the relevant status until the threshold movement occurs over two consecutive accounting periods.

For a newly established enterprise whose accounts have not yet been approved, Article 4(3) uses a bona fide estimate made during the financial year.

These rules must be represented in evidence rather than reduced to a hand-entered `smallCompany=true` field.

## 5. Distinguish DSA Article 29 from DSA Article 19

Do not use the wrong DSA size exclusion.

```text
DSA Article 19 -> Section 3 exclusion
DSA Article 29 -> Section 4 exclusion for platforms allowing consumer/trader distance contracts
PPWR Article 45(4) -> expressly references DSA Chapter III Section 4
```

For the PPWR Article 45(4) gate, **Article 29 is the directly relevant DSA enterprise-size exclusion**.

## 6. PPWR platform verification profile consumes the DSA result

```text
PpwrOnlinePlatformVerificationProfile {
  marketplaceLegalEntityId
  merchantId
  producerRoleState
  consumerMemberState

  dsaSection4ApplicabilityProfileRef
  dsaSection4ApplicabilityState

  article45_4DistanceContractProducerState
  article45_4ApplicabilityState

  producerRegistrationNumber?
  producerRegistrationEvidenceRef?
  eprSelfCertificationVersion?
  selfCertificationAcceptedAt?

  completenessAssessmentRef?
  reliabilityAssessmentRef?
  automatedRegisterReconciliationRef?
  manualEscalationRef?

  verificationState
  sourcePackVersion
  reviewedAt
  reviewDueAt
  approvalState
}
```

### `article45_4ApplicabilityState`

```text
UNKNOWN
NOT_APPLICABLE_DSA_ART29_MICRO_SMALL_CANDIDATE
NOT_APPLICABLE_DSA_ART29_12_MONTH_CANDIDATE
APPLIES_SECTION4
NOT_APPLICABLE_OTHER_APPROVED_REASON
```

The `*_CANDIDATE` values are research states until the entity-size/DSA conclusion is professionally approved.

## 7. Candidate decision table

| DSA / service state | PPWR Article 45(4) research result | Producer activation consequence |
|---|---|---|
| Section 4 state `UNKNOWN` | `UNKNOWN` | fail closed if PPWR evidence is a mandatory launch row |
| Article 29 micro/small exclusion valid, not VLOP | `NOT_APPLICABLE_DSA_ART29_MICRO_SMALL_CANDIDATE` | no Article 45(4) evidence requirement may be represented as legally mandatory until qualified review; keep capability ready |
| Article 29 12-month continuation valid, not VLOP | `NOT_APPLICABLE_DSA_ART29_12_MONTH_CANDIDATE` | same; preserve review date and continuation end date |
| Section 4 applies because provider is not micro/small | `APPLIES_SECTION4` if producer-distance-contract facts also met | require registration info/number + self-certification + best-efforts assessment before producer access |
| VLOP Article 33 designation | `APPLIES_SECTION4` if producer-distance-contract facts also met | Article 29 small-enterprise exclusion cannot be used |
| Section 4 applies but merchant is not a PPWR producer / Article 45(4) producer-distance-contract facts not met | separate Article 45(4) factual decision required | do not invent registration duty; preserve evidence for actor classification |

## 8. Fail-closed evaluation

```text
function evaluatePpwrArticle45PlatformGate(input) {
  if (input.dsaSection4ApplicabilityState === 'UNKNOWN') {
    return 'HOLD_APPLICABILITY';
  }

  if (
    input.dsaSection4ApplicabilityState === 'EXCLUDED_ART29_MICRO_SMALL' ||
    input.dsaSection4ApplicabilityState === 'EXCLUDED_ART29_12_MONTH_CONTINUATION'
  ) {
    return input.qualifiedApproval
      ? 'NOT_APPLICABLE_ART45_4'
      : 'NOT_APPLICABLE_CANDIDATE_REVIEW_REQUIRED';
  }

  if (
    input.dsaSection4ApplicabilityState === 'APPLIES_NON_SMALL' ||
    input.dsaSection4ApplicabilityState === 'APPLIES_VLOP_OVERRIDE'
  ) {
    if (input.article45_4DistanceContractProducerState !== 'YES') {
      return 'HOLD_PRODUCER_SCOPE';
    }

    if (
      !input.producerRegistrationEvidenceCurrent ||
      !input.eprSelfCertificationCurrent ||
      !input.completenessReliabilityAssessmentCurrent
    ) {
      return 'DENY_PRODUCER_ACTIVATION';
    }

    return 'ARTICLE45_4_GATE_SATISFIED';
  }

  return 'HOLD_APPLICABILITY';
}
```

This pseudocode is a design contract, not a legal conclusion.

## 9. Review triggers

Re-evaluate both DSA Section 4 and PPWR Article 45(4) state when any of the following changes:

- legal entity used for the Marketplace;
- ownership/partner/linked-enterprise structure;
- headcount/AWU;
- turnover or balance-sheet data;
- approval of a new accounting period;
- the two-consecutive-period Recommendation Article 4(2) status calculation;
- end of an Article 29 12-month continuation period;
- VLOP designation/status;
- service changes affecting consumer/trader distance-contract functionality;
- merchant/producer classification;
- consumer Member State coverage;
- DSA, PPWR or Recommendation amendments/guidance material to the gate.

## 10. Safe implementation before final legal approval

Subject to the separate #501 backlog authorization gate, engineering may safely build:

- `DsaSection4ApplicabilityProfile`;
- Recommendation 2003/361 evidence calculation support;
- linked/partner-enterprise evidence references;
- status-change/review-date machinery;
- Article 29 12-month continuation support;
- VLOP override state;
- `PpwrOnlinePlatformVerificationProfile` consuming the DSA profile;
- producer registration/self-certification evidence storage abstractions;
- best-efforts verification workflow and manual escalation hooks;
- fail-closed tests.

Engineering must **not** hard-code that DROPi is currently exempt from Section 4 or PPWR Article 45(4).

## 11. Current disposition

```text
DSA_ART29_MICRO_SMALL_EXCLUSION_MECHANISM = IDENTIFIED
DSA_ART29_12_MONTH_CONTINUATION = IDENTIFIED
DSA_ART29_VLOP_OVERRIDE = IDENTIFIED
DROPI_MICRO_OR_SMALL_STATUS = EVIDENCE_PENDING
DROPI_SECTION4_APPLICABILITY = NOT_YET_VALIDATED
PPWR_ART45_4_PLATFORM_GATE = CONDITIONAL_ON_DSA_SECTION4_AND_PRODUCER_DISTANCE_CONTRACT_SCOPE
PUBLIC_PRODUCER_ACTIVATION = BLOCKED_BY_APPLICABLE_MANDATORY_ROWS
```

The remaining uncertainty is now principally factual/evidentiary — the actual entity/group size and resulting Section 4 state — plus qualified approval of this textual interpretation. It is no longer an undifferentiated `PPWR marketplace scope unknown` blocker.
