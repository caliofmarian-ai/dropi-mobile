# RO-LAUNCH-006 — Romania Data Flow, Retention and Support Contract

> **STATUS: PRE-DPIA / PRE-COUNSEL / FAIL-CLOSED**
> **As of:** 2026-09-15
> **Issue:** #498
> **Parent:** #492

This document defines the data/support architecture that engineering may safely model before exact Romanian privacy/legal retention decisions are approved. It intentionally does **not** invent one legal basis, controller role or retention period for all data.

## 1. Non-negotiable architecture rules

1. Controller/processor status is decided per actual processing activity, not by global vendor labels.
2. Consent is not a universal legal basis.
3. Retention is purpose/event based; `keep forever` and one global retention constant are prohibited.
4. Account deletion and data-subject erasure do not automatically delete evidence that must be retained under another valid legal obligation/claim basis; that conflict must be resolved through restriction/legal-hold rules.
5. Access to identity, payment, address, complaint, safety and authority evidence is role/scenario scoped and audited.
6. Personal data needed only by later services is not collected in the first Marketplace pilot merely because the schema might support it.
7. Statutory/legal workflows are not collapsed into generic support tickets.
8. `UNKNOWN` legal basis/role/retention means the corresponding production collection/use is blocked or minimized until resolved.

EDPB Guidelines 07/2020 confirm that controller/processor concepts are functional and depend on actual roles and factual circumstances. That supports this flow-by-flow model.

## 2. First-pilot data inventory

The candidate first-pilot scope may require the following data classes only to the extent necessary for the approved flow.

| Data class | Candidate purpose | Candidate actors | Legal basis | Role allocation | Retention | Production state |
|---|---|---|---|---|---|---|
| Account identity/contact | account creation, authentication, communication | DROPi, auth/infrastructure vendors | `TBD_PER_PURPOSE` | `TBD` | `TBD` | `DESIGN_ALLOWED / APPROVAL_REQUIRED` |
| Account security/session | login, abuse prevention, session safety, incident evidence | DROPi, security/infrastructure vendors | `TBD` | `TBD` | `TBD` | `DESIGN_ALLOWED / APPROVAL_REQUIRED` |
| Professional merchant business evidence | Marketplace seller capability, business verification | DROPi, merchant, registry/data providers | `TBD` | `TBD` | `TBD` | `HOLD_FOR_ROLE_BASIS_APPROVAL` |
| PSP merchant/payment references | payment onboarding, transaction, settlement, reconciliation | PSP, DROPi, merchant | `PROVIDER_AND_LEGAL_REVIEW_TBD` | `TBD_PER_PROVIDER` | `TBD` | `HOLD_PSP_SELECTION` |
| Customer order/contract | contract execution/evidence, support | merchant, DROPi | `TBD` | `TBD` | `TBD` | `DESIGN_ALLOWED / APPROVAL_REQUIRED` |
| Delivery address/contact | merchant fulfilment / approved carrier fulfilment | customer, merchant, DROPi, carrier where applicable | `TBD` | `TBD_PER_FULFILMENT_ROLE` | `TBD` | `MINIMIZE / PURPOSE_BOUND` |
| Contract snapshot / terms evidence | prove what was displayed/agreed | merchant, DROPi | `TBD` | `TBD` | `TBD` | `DESIGN_ALLOWED` |
| Withdrawal/return/conformity case | exercise consumer rights and resolve obligations | customer, merchant, DROPi, PSP where refund relevant | `TBD` | `TBD` | `TBD` | `DESIGN_ALLOWED / APPROVAL_REQUIRED` |
| DSA notice/action evidence | intermediary/platform obligations where applicable | DROPi, users, authorities | `TBD_APPLICABILITY` | `TBD` | `TBD` | `HOLD_DSA_CLASSIFICATION` |
| GPSR safety/recall evidence | product-safety case management | DROPi, merchant, economic operators, authorities, consumers | `TBD` | `TBD` | `TBD` | `DESIGN_ALLOWED / APPROVAL_REQUIRED` |
| Customer support case | general support not covered by specialist statutory workflow | DROPi, merchant/provider as required | `TBD` | `TBD` | `TBD` | `DESIGN_ALLOWED / APPROVAL_REQUIRED` |
| Marketing preference | optional marketing communication | DROPi, messaging vendor | `TBD_CONSENT_OR_OTHER_VALID_BASIS` | `TBD` | `TBD` | `DEFAULT_OFF` |

`TBD` is deliberate evidence, not missing documentation to be silently filled by engineering.

## 3. Explicitly excluded first-pilot personal-data families

Unless a separate approved feature genuinely requires them, the first Marketplace pilot must not collect merely for future use:

- driver/rider licences and vehicle documents for a proprietary DROPi fleet;
- passenger-transport professional certificates;
- criminal-record or medical/psychological fitness data for Passenger Mobility;
- continuous pilot/driver GPS history;
- drone pilot/operator credentials;
- biometric templates for production biometric identity verification;
- Cooperative Hub member/governance/share/contribution documents;
- C2 customer confidential contract datasets;
- C3 emergency incident data;
- token/crypto wallet identity/transaction data.

Later-service implementation must have its own privacy/legal pack before those datasets are activated.

## 4. Data-flow role profile

Every external data exchange requires a `DataFlowRoleProfile` rather than one global `processor=true` flag.

```text
DataFlowRoleProfile {
  id
  processingActivity
  dataClasses[]
  purposeVersion
  dataSubjects[]
  dropiRole           // CONTROLLER | JOINT_CONTROLLER | PROCESSOR | TBD
  counterpartyId
  counterpartyRole
  instructionsOrArrangementRef?
  article28AgreementRef?
  jointControllerArrangementRef?
  internationalTransferState
  transferMechanismRef?
  legalBasisProfileRef
  retentionPolicyRef
  securityProfileRef
  reviewedAt
  reviewDueAt
  approvalState
}
```

The selected PSP, merchant and carrier may have different roles for different activities. Provider contract wording does not override the factual allocation automatically.

## 5. Purpose and legal-basis profile

```text
LegalBasisProfile {
  id
  processingActivity
  purpose
  legalBasis        // Art 6 basis or other applicable basis; TBD until approved
  specialCategoryBasis?
  statutorySourceRefs[]
  contractNecessityEvidenceRef?
  legitimateInterestAssessmentRef?
  consentProfileRef?
  objectionRules?
  withdrawalRules?
  approvedAt?
  approvalState
}
```

The application must not display a universal `I consent to all processing` checkbox as a substitute for lawful-basis analysis.

## 6. Retention policy engine — no invented durations

GDPR Article 5 requires storage limitation; exact launch durations must be justified per purpose and applicable legal/contract/claim obligations.

Engineering may implement the retention engine now, but duration values remain policy data until approved.

```text
RetentionPolicy {
  id
  dataClass
  processingPurpose
  triggerEvent
  retentionDuration?       // required before production activation
  minimumLegalPeriodRef?
  maximumPolicyPeriodRef?
  deletionAction
  restrictionAction
  anonymizationAction?
  legalHoldEligible
  legalHoldReasons[]
  sourceRefs[]
  approvedAt?
  reviewDueAt?
  state
}
```

Candidate trigger events include:

- account closed;
- merchant capability ended;
- contract/order completed;
- fiscal period/record created;
- PSP settlement finalised;
- chargeback/dispute closed;
- fulfilment completed;
- withdrawal/return/conformity case closed;
- DSA case closed;
- safety/recall case closed;
- support case closed;
- consent withdrawn;
- legal hold released.

A row without an approved retention duration cannot be translated into an arbitrary number by a developer.

## 7. Account closure / erasure state machine

```text
ACCOUNT_ACTIVE
  -> CLOSURE_REQUESTED
  -> ACTIVE_PURPOSES_STOPPED
  -> RETENTION_EVALUATION
      -> DELETE_ELIGIBLE_DATA
      -> RESTRICT_RETAINED_DATA
      -> LEGAL_HOLD_DATA
  -> ACCOUNT_CLOSED_RETAINED_EVIDENCE_SEPARATED
  -> FINAL_DELETION_WHEN_ALL_TRIGGERS_EXPIRE
```

Every retained field must have a reason/policy reference. `User deleted account` is not permission to keep every record forever, nor an instruction to destroy every legally necessary record immediately.

## 8. Data-subject rights workflow

Privacy rights must be represented separately from generic customer support.

```text
DataRightsRequest {
  id
  subjectId
  requestType
  receivedAt
  identityVerificationState
  scope
  affectedDataClasses[]
  restrictionsOrExemptions[]
  legalHoldConflicts[]
  decisionState
  responseEvidenceRef
  completedAt?
}
```

The exact response deadline/extension logic must be driven by the approved legal pack rather than hard-coded from memory.

## 9. Breach/incident workflow

GDPR Article 33 requires controller notification to the competent supervisory authority without undue delay and, where feasible, within 72 hours after awareness unless the breach is unlikely to result in a risk to natural persons' rights/freedoms. Processors notify controllers without undue delay. Article 34 requires communication to affected data subjects without undue delay when the breach is likely to result in high risk, subject to the Regulation's conditions/exceptions.

The application therefore needs:

```text
PersonalDataIncident {
  id
  detectedAt
  awarenessAt?
  affectedSystems[]
  affectedDataClasses[]
  estimatedSubjects
  controllerRoleProfileRefs[]
  processorNotifications[]
  riskAssessmentState
  supervisoryAuthorityDeadlineAt?
  authorityNotificationState
  dataSubjectCommunicationState
  mitigationActions[]
  evidenceRefs[]
  legalHoldRef?
  closedAt?
}
```

The system must calculate deadlines from the recorded `awarenessAt` only after the responsible controller/legal pack is known; it must never silently declare `no notification required`.

## 10. DPIA decision record

GDPR Article 35 requires a DPIA before processing likely to result in high risk, considering nature, scope, context and purposes. Romanian ANSPDCP Decision 174/2018 adds the national supervisory-authority list of processing operations for which a DPIA is mandatory. The list is evaluated together with Article 35 against the factual processing activity; it is not a universal `DROPi requires a DPIA` switch.

The first pilot deliberately excludes several high-risk future datasets/operations, but that does not automatically mean `DPIA_NOT_REQUIRED`.

Every Romanian DPIA decision record must therefore perform and preserve both checks:

```text
GDPR_ARTICLE_35_RISK_CHECK
AND ANSPDCP_DECISION_174_2018_LIST_CHECK
```

At minimum the assessment must be able to represent risk factors relevant to present or later DROPi services, including where factually applicable:

- systematic and extensive automated evaluation/profiling producing legal or similarly significant effects;
- large-scale special-category or criminal-offence data;
- systematic large-scale monitoring of publicly accessible areas;
- large-scale/systematic monitoring of vulnerable persons, including minors or employees;
- large-scale use of innovative/new technologies;
- large-scale Internet-of-Things/sensor processing;
- large-scale/systematic traffic or location data where the relevant legal conditions are met.

These are assessment triggers/categories, not a statement that the current first pilot performs every listed operation.

```text
DpiaDecision {
  scopeVersion
  processingActivities[]
  riskFactors[]
  gdprArticle35AssessmentRef
  supervisoryAuthorityListCheckRef      // ANSPDCP Decision 174/2018 check
  supervisoryAuthorityGuidanceRef?
  outcome          // REQUIRED | NOT_REQUIRED | REQUIRED_BEFORE_EXPANSION | TBD
  rationaleRef
  mitigationRefs[]
  reviewer
  decidedAt?
  reviewTrigger[]
  state
}
```

Review triggers include adding live location monitoring, biometric processing, large-scale sensitive datasets, profiling/significant automated decisions, Passenger Mobility, own-fleet safety/fitness data, materially larger scale, materially new technology, or any change that causes a previously negative Decision 174/2018 list check to become potentially applicable.

Current first-pilot outcome remains deliberately:

`DPIA_TBD`

No developer or admin switch may promote that state to `NOT_REQUIRED` merely because high-risk future features are excluded from the pilot.

## 11. Restricted access contract

At minimum the platform must support attribute/scope-based access for:

```text
ACCOUNT_SUPPORT
MERCHANT_COMPLIANCE
ORDER_SUPPORT
PAYMENT_RECONCILIATION
PRIVACY_RIGHTS
PRODUCT_SAFETY
DSA_MODERATION
LEGAL_HOLD
SECURITY_INCIDENT
AUDITOR_REGULATOR_EXPORT
```

No role receives all personal data merely because it is called `admin`.

Privileged reads/exports/changes must be attributable and auditable.

## 12. Support workflow separation

The first launch needs independent case types:

```text
GENERAL_SUPPORT
WITHDRAWAL
RETURN_CONFORMITY
PAYMENT_REFUND
CHARGEBACK_DISPUTE
FULFILMENT_DELIVERY
POSTAL_CLAIM            // only when the postal role is active
PRODUCT_SAFETY
DSA_NOTICE_ACTION       // where applicable
PRIVACY_RIGHTS
SECURITY_INCIDENT
```

Routing rules:

- withdrawal/conformity cannot be closed solely because generic support answered;
- product-safety notices use the dedicated safety SLA/evidence path;
- privacy requests use the privacy workflow;
- postal claims appear only under an approved postal role;
- PSP disputes/refunds preserve provider transaction evidence;
- generic support may link to, but cannot replace, specialist workflows.

## 13. Vendor/data-transfer register

Before a production vendor receives personal data, keep:

```text
VendorDataProfile {
  vendorId
  service
  dataClasses[]
  processingLocations[]
  roleProfileRef
  article28AgreementRef?
  transferMechanismRef?
  subprocessorListRef?
  securityAssessmentRef
  retentionDeletionContractRef
  incidentNotificationContractRef
  effectiveFrom
  reviewDueAt
  approvalState
}
```

Provider marketing pages are not a substitute for the signed/current data-processing contract.

## 14. Official sources / guidance rechecked 2026-09-15

- GDPR: `https://eur-lex.europa.eu/eli/reg/2016/679/`
- Romanian Law 190/2018: official Legislative Portal source registered in the legal-source register pending controlled-copy completion.
- ANSPDCP Decision 174/2018: official Romanian Legislative Portal source registered as `RO-ANSPDCP-DECISION-174-2018-DPIA`; controlled byte copy remains `pending_primary_copy`, and applicability to each DROPi processing activity remains `pending_current_validation`.
- ANSPDCP final DPIA guidance: official authority guidance registered as `RO-ANSPDCP-DPIA-GUIDANCE-2026-09-15`; controlled snapshot archived on 2026-09-15. The guidance supports the assessment process but does not substitute for GDPR Article 35, Decision 174/2018, or the documented DROPi decision.
- EDPB Guidelines 07/2020, final version, controller/processor concepts: `https://www.edpb.europa.eu/documents/guideline/guidelines-072020-on-the-concepts-of-controller-and-processor-in-the-gdpr_en`

The repository's archived GDPR source remains part of the controlled legal corpus.

## 15. Current disposition

Engineering may implement the **flow registry, policy engine, access/audit mechanics, legal-hold separation, dedicated case types, DPIA decision record and fail-closed handling** without inventing unresolved legal values.

Production activation remains blocked until controller/processor roles, legal bases, exact retention periods, a documented GDPR Article 35 + ANSPDCP Decision 174/2018 DPIA determination, vendor arrangements and support responsibility matrix are approved.

Current state:

`DATA_ARCHITECTURE_READY_FOR_REVIEW / RETENTION_VALUES_TBD / DPIA_TBD / PRODUCTION_DATA_SEMANTICS BLOCKED`
