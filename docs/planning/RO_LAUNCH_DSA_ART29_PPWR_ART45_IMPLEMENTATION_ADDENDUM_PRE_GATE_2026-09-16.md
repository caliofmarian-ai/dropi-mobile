# DROPi Romania — DSA Article 29 / PPWR Article 45 Implementation Addendum (Pre-Gate)

> **STATUS: CANDIDATE / PRE-OWNER / NON-CANONICAL / FAIL-CLOSED**
> **As of:** 2026-09-16
> **Parent:** #500 / #492
> **Legal evidence:** PR #504
> **Planning PR:** #505
> **Consumes:** `docs/legal/RO_LAUNCH_DSA_ART29_PPWR_ART45_APPLICABILITY_2026-09-16.md`

This addendum translates the DSA Article 29 → DSA Section 4 → PPWR Article 45(4) dependency into a bounded implementation contract. It does not determine that DROPi is currently micro/small, exempt, non-exempt or VLOP.

## 1. Architectural correction

The implementation must not use:

```text
smallCompany -> ppwrExempt
```

Instead:

```text
Recommendation2003_361 evidence
-> DSA Article 29 / Section 4 applicability
-> PPWR Article 45(4) applicability
-> producer verification gate
```

The Article 29 result is the controlling DSA input because PPWR Article 45(4) expressly targets platforms falling within DSA Chapter III Section 4.

## 2. New foundation object

```text
DsaSection4ApplicabilityProfile {
  providerLegalEntityId
  serviceId
  allowsConsumerTraderDistanceContractsState
  enterpriseSizeAssessmentRef
  autonomousPartnerLinkedEnterpriseState
  microEnterpriseState
  smallEnterpriseState
  microOrSmallState
  recommendationArticle4_2StatusChangeState
  statusLossEffectiveDate?
  article29TwelveMonthContinuationUntil?
  vlopDesignationState
  dsaSection4ApplicabilityState
  sourcePackVersion
  reviewerRef?
  reviewedAt
  reviewDueAt
  approvalState
}
```

Allowed Section 4 states:

```text
UNKNOWN
EXCLUDED_ART29_MICRO_SMALL
EXCLUDED_ART29_12_MONTH_CONTINUATION
APPLIES_NON_SMALL
APPLIES_VLOP_OVERRIDE
NOT_APPLICABLE_OTHER_REASON
```

## 3. PPWR profile consumes the Section 4 profile

`PpwrOnlinePlatformVerificationProfile` gains an explicit reference to `DsaSection4ApplicabilityProfile` and must not recalculate company size independently.

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
  verificationState
  sourcePackVersion
  reviewedAt
  reviewDueAt
  approvalState
}
```

## 4. Candidate evaluation order

```text
1. resolve Marketplace legal entity
2. resolve Recommendation 2003/361 enterprise/group evidence
3. resolve DSA Article 29 micro/small state
4. apply Recommendation Article 4(2) two-accounting-period status-change rule where relevant
5. apply DSA Article 29 12-month continuation after status loss where relevant
6. override exclusion if VLOP Article 33 applies
7. resolve DSA Section 4 applicability
8. resolve PPWR producer + distance-contract facts
9. if Article 45(4) applies, require producer registration/self-certification
10. require completeness/reliability assessment before producer activation
```

## 5. Fail-closed release behavior

```text
if dsaSection4ApplicabilityState == UNKNOWN:
    ppwrArticle45Gate = HOLD_APPLICABILITY

if dsaSection4ApplicabilityState in {
    EXCLUDED_ART29_MICRO_SMALL,
    EXCLUDED_ART29_12_MONTH_CONTINUATION
}:
    ppwrArticle45Gate = NOT_APPLICABLE_CANDIDATE_REVIEW_REQUIRED

if dsaSection4ApplicabilityState in {
    APPLIES_NON_SMALL,
    APPLIES_VLOP_OVERRIDE
}:
    if producerDistanceContractScope != YES:
        ppwrArticle45Gate = HOLD_PRODUCER_SCOPE
    else if requiredProducerEvidenceMissing:
        ppwrArticle45Gate = DENY_PRODUCER_ACTIVATION
    else:
        ppwrArticle45Gate = SATISFIED
```

A candidate `NOT_APPLICABLE` state may become production-authoritative only after the approved legal/evidence profile exists.

## 6. P0 slice mapping

| Existing slice | Addition |
|---|---|
| `RO-IMP-P0-01` | capture legal entity/group-size evidence refs and Section 4 profile used by merchant/producer activation |
| `RO-IMP-P0-02` | PPWR producer evidence gate consumes approved Section 4 profile |
| `RO-IMP-P0-03` | no duplicate size logic in checkout; snapshot only references controlling legal-pack/profile versions |
| `RO-IMP-P0-07` | protect enterprise/group evidence and environmental evidence with purpose/access/retention controls |
| `RO-IMP-P0-09` | add Section 4/Article 45 profile-integrity and expiry/review release checks |

## 7. Tests to pre-compose

- unknown entity-size evidence -> Section 4 state remains `UNKNOWN`;
- newly established entity -> supports bona fide estimate evidence rather than fabricated approved accounts;
- threshold crossed for only one accounting period -> does not silently mark Recommendation status lost/acquired where Article 4(2) requires two consecutive periods;
- Article 29 12-month continuation active -> Section 4 exclusion candidate remains until recorded end date unless VLOP;
- VLOP designation -> overrides micro/small Section 4 exclusion;
- Article 19 Section 3 state must not be consumed as Article 29 Section 4 state;
- Section 4 exclusion candidate -> PPWR Article 45(4) gate cannot claim final `NOT_APPLICABLE` without approval evidence;
- Section 4 applies + producer-distance-contract scope + missing registration -> producer activation denied;
- Section 4 applies + missing EPR self-certification -> producer activation denied;
- Section 4 applies + evidence present but reliability assessment stale/missing -> producer activation denied;
- ownership/group structure change -> invalidate/review enterprise-size and downstream Section 4/PPWR states;
- VLOP designation change -> invalidate/review Section 4 and PPWR state.

## 8. Current pre-gate state

```text
DSA_ART29_MECHANISM = IDENTIFIED
DROPI_MICRO_OR_SMALL_STATUS = EVIDENCE_PENDING
DROPI_SECTION4_APPLICABILITY = NOT_YET_VALIDATED
PPWR_ART45_4_PLATFORM_GATE = CONDITIONAL_ON_DSA_SECTION4_AND_PRODUCER_DISTANCE_CONTRACT_SCOPE
SAFE_FOUNDATION_IMPLEMENTATION = CANDIDATE_IF_501_AUTHORIZES_BACKLOG_REPRIORITIZATION
PUBLIC_PRODUCER_ACTIVATION = BLOCKED
```

This addendum does not alter `FINAL #501 OUTCOME = NOT YET RECORDED` and does not authorize live issue relabeling or canonical backlog mutation.
