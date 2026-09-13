# COOP-P0-01 — Romanian Cooperative Legal Validation Packet

> **STATUS: PRE-COUNSEL RESEARCH / NOT LEGAL ADVICE / IMPLEMENTATION BLOCKED**
> **Version:** 0.1.0
> **Research cut-off:** 2026-09-13
> **Issue:** [#482](https://github.com/caliofmarian-ai/dropi-mobile/issues/482)
> **Parent:** [#481](https://github.com/caliofmarian-ai/dropi-mobile/issues/481)
> **Governing product canon:** `canonical/DROPI_COOPERATIVE_HUB.md`
> **Governing legal canon:** `canonical/LEGAL_COMPLIANCE_SOURCE_OF_TRUTH.md`

This packet prepares a bounded review for a qualified Romanian cooperative lawyer and accountant. It records official material that could be captured, separates findings from unresolved legal questions, and proposes corrections for professional approval. It does not approve a legal route, form a cooperative, create membership, authorize filing, or permit implementation.

## 1. Outcome

The current evidence supports four conclusions:

1. DROPi must preserve two separate Romanian route assessments: an agricultural-cooperative route associated with Law No. 566/2004 and a society-cooperative route associated with Law No. 1/2005.
2. Current ONRC guidance shows materially different filing bundles. In particular, the agricultural route lists a lawyer-attested constitutive act and a separate statute, while the society-cooperative route lists its constitutive act under private signature, subject to the exceptions stated by ONRC.
3. ONRC permits electronic filing with a qualified electronic signature. That fact does **not** establish that remote member meetings, electronic votes, notices, mandates, or resolutions are valid for every cooperative route and statute.
4. The official consolidated texts of Laws No. 566/2004, No. 1/2005, No. 214/2024 and No. 265/2022 could not be archived from the Romanian Legislative Portal during this research session. Founder/member eligibility, minimum membership, capital/share rules, governance and electronic-act rules therefore remain blocked pending controlled current copies and written professional validation.

The existing canonical statement that both routes use a minimum of five persons is retained only as a **canonical hypothesis to validate**. It must not become a hard-coded eligibility rule before counsel confirms the current law, the cooperative degree/category, and the exact founder/member facts.

Issue #482 cannot satisfy its acceptance criteria until the dated professional memo in Section 10 is completed. No implementation issue may treat this packet as legal approval.

## 2. Method and reliance labels

Research followed the source hierarchy in `canonical/LEGAL_COMPLIANCE_SOURCE_OF_TRUTH.md`. Official snapshots are registered in `docs/legal/legal-source-register.json`; unavailable primary texts are registered as blockers rather than silently replaced with commentary.

| Label | Meaning in this packet |
|---|---|
| `CAPTURED` | Official evidence is archived, but its interpretation is not approved |
| `CANONICAL_HYPOTHESIS` | Existing DROPi product direction that counsel must accept, narrow or correct |
| `CURRENT_SOURCE_PENDING` | A controlled current primary text is unavailable |
| `WRITTEN_CONFIRMATION_REQUIRED` | Romanian counsel, accountant and/or competent authority must answer in writing |
| `PROHIBITED_FOR_PRODUCT` | Must not be implemented or claimed under the present evidence |

No row in this packet is `approved_for_design`.

## 3. Route decision matrix

The product may ask factual questions and return `LIKELY_AGRICULTURAL_COOPERATIVE`, `LIKELY_SOCIETY_COOPERATIVE`, `EXPERT_REVIEW_REQUIRED`, or `COOPERATIVE_NOT_RECOMMENDED`. It may not make the legal selection.

| Decision point | Law No. 566/2004 route | Law No. 1/2005 route | Current evidence and disposition |
|---|---|---|---|
| Intended users | Candidate route for producers and actors operating within agricultural cooperation | Candidate route for eligible non-agricultural producers, including candidate craft or valorification models | Product canon only; exact statutory categories require `WRITTEN_CONFIRMATION_REQUIRED` |
| Intended activity | Candidate for joint agricultural services, procurement, sale, processing or other in-scope agricultural cooperation | Candidate for an eligible society-cooperative category and its permitted activities | Do not infer route from a Marketplace product label; validate the full operating flow |
| Product MVP scope | First-degree readiness/formation only | First-degree readiness/formation only | This is a DROPi scope limit, not a statement that other legal degrees do not exist |
| Eligible founders | Unknown at the field-schema level | Unknown at the field-schema level | ONRC asks for identity/registration and mandate evidence for applicable natural-person, legal-person and business-form participants; the route/degree eligibility behind those documents is `CURRENT_SOURCE_PENDING` |
| Eligible later members | Unknown at the field-schema level | Unknown at the field-schema level | Admission cannot be derived from account type; law, constitutive documents and competent-body decision must all be reconciled |
| Minimum membership | Existing canon says five persons | Existing canon says five members | `CANONICAL_HYPOTHESIS`; current consolidated provisions and route/category exceptions must be confirmed before hard-coding |
| Capital and shares | ONRC requests proof of subscribed/paid social parts and evidence for in-kind property, where applicable | ONRC requests proof of subscribed/paid social capital | Exact minima, nominal values, payment timing, member exposure and category-specific limits remain `CURRENT_SOURCE_PENDING` |
| Constitutive package | Current ONRC checklist identifies a constitutive act under private signature, attested by a lawyer, plus a separate statute signed by founders | Current ONRC checklist identifies a constitutive act under private signature signed by all founders; authentic form applies when immovable property is contributed | `CAPTURED` as procedural guidance; counsel must reconcile it with current controlling law and facts |
| Activity codes | Case-specific CAEN Rev. 3 mapping | Case-specific CAEN Rev. 3 mapping | Existing source `RO-INSSE-CAEN-REV3` remains unavailable; no universal cooperative, Marketplace or export code may be offered |
| Sector permits | Product/facility/activity-specific approvals may be required | Product/facility/activity-specific approvals may be required | ONRC checklist anticipates prior permits where special law requires them; separate food/product/market gates remain unchanged |
| Public result | `LIKELY_AGRICULTURAL_COOPERATIVE` until professional acceptance | `LIKELY_SOCIETY_COOPERATIVE` until professional acceptance | Never label an informal group as a registered cooperative in the public Marketplace |

### 3.1 Required factual intake before professional review

DROPi may collect a minimum readiness brief, provided every answer is clearly marked as applicant-supplied and non-determinative:

- each proposed founder's legal form, residence/seat and intended capacity;
- planned cooperative degree/category;
- products, transformations, services, facilities and sales channels;
- who owns goods before sale and who is intended to invoice;
- proposed territory, premises, storage/processing and regulated activities;
- proposed contributions, social parts and in-kind property;
- governance expectations, including voting, mandates and remote participation;
- individual-versus-cooperative selling and supply commitments;
- domestic, B2B and cross-border ambitions.

The answer set must be sent to a qualified professional; it must not execute a deterministic legal eligibility engine.

## 4. Current ONRC formation and evidence sequence

The following is a provisional readiness sequence derived from the two ONRC pages captured on 2026-09-13. The controlling legislation and the registrar's case-specific requests prevail.

| Stage | Evidence/action | DROPi state consequence |
|---|---|---|
| 1. Route intake | Record facts and a `LIKELY_*` result; identify lawyer/accountant reviewer | Stay in `PRE_FORMATION`; no legal route is approved |
| 2. Name | Request availability check and reservation; use the route-appropriate cooperative wording | Name reservation is evidence only and does not create the entity |
| 3. Founding documents | Prepare the correct route-specific constitutive package, activity object and signatures | `DOCUMENTS_READY` is unavailable until professional review and document validation pass |
| 4. Common filing forms | Registration request, fiscal-registration annex and declaration concerning operating conditions/activities | Store the exact form version and applicant/representative authority |
| 5. Seat and capital | Seat/use evidence; proof of subscribed/paid capital or social parts; property evidence for in-kind contributions where applicable | Reject incomplete or internally inconsistent evidence; do not calculate legal sufficiency without approved rules |
| 6. People and mandates | Identity evidence; applicable founder records; administrator signature specimens; representative mandates; foreign-person declarations where applicable | Separate identity, legal capacity and authority checks |
| 7. Additional evidence | Beneficial-owner declaration, sector authorization/endorsement where applicable, fiscal-record checks, censor/auditor evidence where required, and publication tariff | Each item is versioned and case-scoped; no generic completion badge |
| 8. Filing | Applicant/authorized person files at the competent channel, including portal/email submissions signed with a qualified electronic signature where used | Enter `FILED_ONRC`; retain submission receipt, timestamp, package version and submitter authority |
| 9. Registrar review | Handle requests for completion, withdrawal, rejection or refiling | Never infer registration from elapsed time or an accepted upload |
| 10. Registration evidence | Verify registrar decision and resulting official registration evidence | Only verified official evidence may enter `REGISTERED` |
| 11. DROPi verification | Independently verify legal representative, bank, trader, product/facility and Marketplace evidence | `VERIFIED_DROPI` remains separate from `REGISTERED` |

The ONRC pages describe a one-working-day resolution period under the cited trade-register procedure, while also warning that missing mandatory elements/documents may lead to rejection and that additional evidence may be requested. DROPi must not turn that procedural statement into a delivery promise or countdown guarantee.

### 4.1 Captured route-specific filing distinctions

| Topic | Agricultural cooperative | Society cooperative |
|---|---|---|
| Name wording | Includes the agricultural-cooperative designation required by the route | Includes the society-cooperative designation required by the route |
| Founding instrument | Lawyer-attested constitutive act under private signature | Constitutive act under private signature signed by all founders; authentic form for an immovable-property contribution |
| Statute | Listed separately and signed by founders | Covered by the route's constitutive-document package; counsel must confirm structure for the selected category |
| Contribution evidence | Minimum subscribed social-parts payment evidence; ownership evidence for contributed property where applicable | Subscribed and paid capital evidence |
| Founder/representative evidence | Route/applicant-specific identity or registration records and mandates | Route/applicant-specific identity or registration records and mandates |
| Official page scope | ONRC heading includes agricultural cooperatives of grades I, II and III | ONRC heading includes society cooperatives of grades I and II |

These are checklist observations, not a complete statement of substantive validity.

## 5. Membership and governance validation grid

The legally competent cooperative body and applicable constitutive documents control membership decisions. DROPi may orchestrate tasks, evidence and access only after counsel defines the following rules per route/category.

| Topic | Product must eventually record | Question that must be answered in writing | Current state |
|---|---|---|---|
| Application | Applicant identity/capacity, requested class, application version and timestamp | Who may apply, in what form, and which representations/evidence are mandatory? | `WRITTEN_CONFIRMATION_REQUIRED` |
| Admission decision | Competent body, meeting/resolution, votes, conditions and effective date | Which body admits a member, with what quorum/majority and appeal/review process? | `WRITTEN_CONFIRMATION_REQUIRED` |
| Capital/contribution | Commitment, due date, payment evidence and reconciliation reference | Is payment a precondition, what amount/timing applies, and when does membership legally take effect? | `WRITTEN_CONFIRMATION_REQUIRED` |
| Member register | Legal member identifier, category, effective period and source resolution | What register content, form, evidentiary value, inspection right and update duty apply? | `WRITTEN_CONFIRMATION_REQUIRED` |
| Withdrawal | Notice, receipt, effective date, outstanding duties and settlement | What notice, timing, approval/acknowledgement and share/refund consequences apply? | `WRITTEN_CONFIRMATION_REQUIRED` |
| Suspension | Authority, grounds, notice, defence, duration and reinstatement evidence | Is suspension permitted, by whom, and what member rights survive? | `WRITTEN_CONFIRMATION_REQUIRED` |
| Exclusion | Grounds, competent body, procedure, decision, service and challenge status | What due process, quorum/majority, remedy and financial consequences apply? | `WRITTEN_CONFIRMATION_REQUIRED` |
| General assembly | Notice, agenda, attendance, quorum basis, votes and resolution | What notice period/form, quorum, adjournment and majority apply to each resolution type? | `WRITTEN_CONFIRMATION_REQUIRED` |
| Voting | Voter eligibility, vote weight, abstention and result | When does one-member/one-vote apply, what exceptions exist, and are proxies or electronic votes allowed? | `WRITTEN_CONFIRMATION_REQUIRED` |
| Mandates/proxies | Grantor, representative, scope, form, validity and revocation | Who may represent whom, for which acts, under what signature/form and duration? | `WRITTEN_CONFIRMATION_REQUIRED` |
| Elected roles | Office, appointing body, mandate start/end and termination | Eligibility, incompatibilities, term limits and replacement procedure? | `WRITTEN_CONFIRMATION_REQUIRED` |
| Conflicts | Declaration, affected matter, recusal and decision record | Which conflicts must be disclosed and what participation/voting restrictions apply? | `WRITTEN_CONFIRMATION_REQUIRED` |
| Individual selling | Supply mandate, exclusivity, duplicate-stock control and approved exceptions | May a member sell individually, and under what statute/competition/contract constraints? | `WRITTEN_CONFIRMATION_REQUIRED` |

Platform administrators must never be able to manufacture legal membership, a vote, a quorum, a mandate or a resolution by editing a status field.

## 6. Electronic meetings, votes, signatures and transmission

### 6.1 What the captured evidence supports

- Regulation (EU) No. 910/2014 Article 25 prevents denial of an electronic signature's legal effect solely because it is electronic and gives a qualified electronic signature the equivalent effect of a handwritten signature.
- The regulation provides related evidence rules for electronic registered-delivery services and electronic documents.
- Article 2(3) leaves national and Union rules governing the conclusion, validity and form of contracts or other legal obligations unaffected.
- Current ONRC guidance permits electronic filing through the portal or email when the submission is signed with a qualified electronic signature.

### 6.2 What it does not support

The captured material does not establish that any of the following is valid for every cooperative route, category, statute and resolution:

- a fully remote general assembly;
- a hybrid meeting or remote attendance count for quorum;
- asynchronous voting;
- a simple click, OTP, scanned signature or basic electronic signature as a valid vote;
- electronic notice as valid service on every member;
- an electronic proxy/mandate for every act;
- an electronically generated minute or resolution without route-specific execution formalities.

The official Portal's indexed text for Law No. 214/2024 indicates that special laws and rules on conclusion, validity and effect still matter. Because that text could not be archived as a controlled current copy, and the current cooperative laws are also pending, DROPi must default these capabilities to disabled.

### 6.3 Approval matrix required from counsel

Counsel must complete one row per route/category and act type:

| Route/category | Act | Remote allowed? | Notice/channel | Identity method | Signature level | Quorum evidence | Original/retention rule | Legal basis and opinion date |
|---|---|---|---|---|---|---|---|---|
| To be completed | Founding act/statute | — | — | — | — | — | — | — |
| To be completed | Admission decision | — | — | — | — | — | — | — |
| To be completed | General assembly notice | — | — | — | — | — | — | — |
| To be completed | Attendance/proxy | — | — | — | — | — | — | — |
| To be completed | Vote/resolution/minutes | — | — | — | — | — | — | — |
| To be completed | Withdrawal/exclusion notice | — | — | — | — | — | — | — |
| To be completed | ONRC submission | — | — | — | — | — | — | — |

## 7. Formation state-machine assessment

The canonical happy path remains useful as a top-level lifecycle, but it is insufficient for a filing workflow. The following candidate corrections are presented for counsel and owner approval; they do not amend canon in this packet.

| Existing point | Finding | Candidate correction before implementation | Required evidence |
|---|---|---|---|
| `PRE_FORMATION` | A `LIKELY_*` route is not legal acceptance | Record route hypothesis, factual brief and reviewer assignment separately | Applicant facts and professional engagement |
| `PROFESSIONAL_REVIEW` | Review can require rework or decline the route | Add `REWORK_REQUIRED` and `ROUTE_NOT_CONFIRMED` outcomes | Dated reviewer finding and scope |
| `DOCUMENTS_READY` | Documents may expire or become inconsistent before filing | Add `DOCUMENTS_EXPIRED_OR_INVALID`; require package hash/version and signatory authority | Professional checklist and evidence validity |
| `FILED_ONRC` | Submission can require completion, be rejected, withdrawn or refiled | Add `FILING_COMPLETION_REQUESTED`, `FILING_REJECTED`, `FILING_WITHDRAWN` and an auditable refiling transition | ONRC receipt/communication/decision |
| `REGISTERED` | Registration is an official legal result, not an upload status | Allow entry only from verified official registration evidence | Registrar decision and official entity evidence |
| `VERIFIED_DROPI` | Platform verification may expire independently | Add `VERIFICATION_EXPIRED`, `SUSPENDED` and `REMEDIATION_REQUIRED` operational outcomes | Current representative, trader, bank and sector evidence |
| `MARKETPLACE_ACTIVE` onward | Readiness is scoped, not permanent | Scope to organization + category/product + facility/zone/destination + validity | Existing Marketplace, product, B2B and export gates |

Candidate transition envelope:

```text
PROFESSIONAL_REVIEW -> REWORK_REQUIRED -> PROFESSIONAL_REVIEW
PROFESSIONAL_REVIEW -> ROUTE_NOT_CONFIRMED
PROFESSIONAL_REVIEW -> DOCUMENTS_READY
DOCUMENTS_READY -> DOCUMENTS_EXPIRED_OR_INVALID -> PROFESSIONAL_REVIEW
DOCUMENTS_READY -> FILED_ONRC
FILED_ONRC -> FILING_COMPLETION_REQUESTED -> FILED_ONRC
FILED_ONRC -> FILING_REJECTED | FILING_WITHDRAWN | REGISTERED
REGISTERED -> VERIFIED_DROPI
VERIFIED_DROPI -> VERIFICATION_EXPIRED | SUSPENDED | MARKETPLACE_ACTIVE
```

## 8. Membership state-machine assessment

The legal membership state and DROPi workspace-access state must be separate aggregates. `ACTIVE_MEMBER` may be recorded only after the cooperative's competent body has decided and every legally effective condition is proved.

| Existing point | Finding | Candidate correction before implementation |
|---|---|---|
| `APPLIED` | An application may be incomplete or lapse | Add `APPLICATION_INCOMPLETE` and `APPLICATION_LAPSED` outcomes |
| `IDENTITY_AND_ELIGIBILITY_PENDING` | Platform identity does not prove statutory eligibility | Record evidence and professional/cooperative review separately; add `ELIGIBILITY_NOT_CONFIRMED` |
| `COOPERATIVE_DECISION_PENDING` | Approval may be conditional and rejection must identify authority/evidence | Add `APPROVED_PENDING_EFFECTIVE_CONDITIONS`; record competent body, resolution and effective date |
| `CAPITAL_OR_CONTRIBUTION_PENDING` | Payment may or may not be the final legal condition | Counsel must define the route/statute rule; reconcile payment before `ACTIVE_MEMBER` |
| `ACTIVE_MEMBER` | A platform flag cannot be the legal source | Derive from decision + conditions + member-register evidence; expose provenance in audit |
| `SUSPENDED` | Legal rights and platform permissions are not necessarily identical | Record legal status and access restriction independently, with authority, scope and period |
| `EXIT_PENDING` / `FORMER_MEMBER` | Notice, effective date and financial settlement may diverge | Track legal exit, platform access, outstanding duties and settlement as separate dimensions |

Candidate transition envelope:

```text
APPLIED -> APPLICATION_INCOMPLETE | APPLICATION_LAPSED
APPLIED -> IDENTITY_AND_ELIGIBILITY_PENDING
IDENTITY_AND_ELIGIBILITY_PENDING -> ELIGIBILITY_NOT_CONFIRMED | DOCUMENTS_PENDING
DOCUMENTS_PENDING -> COOPERATIVE_DECISION_PENDING
COOPERATIVE_DECISION_PENDING -> REJECTED | APPROVED_PENDING_EFFECTIVE_CONDITIONS
APPROVED_PENDING_EFFECTIVE_CONDITIONS -> CAPITAL_OR_CONTRIBUTION_PENDING | ACTIVE_MEMBER
CAPITAL_OR_CONTRIBUTION_PENDING -> ACTIVE_MEMBER
ACTIVE_MEMBER -> SUSPENDED | EXIT_PENDING
EXIT_PENDING -> ACTIVE_MEMBER | FORMER_MEMBER
```

Exact names and transition semantics remain unapproved until counsel validates the route-specific lifecycle.

## 9. Candidate user copy and prohibited claims

### 9.1 Mandatory candidate disclaimers

The following copy may be taken to professional/content review; it is not authorized for production by this packet:

- “DROPi provides an informational and document-readiness workspace. It does not provide legal, tax, accounting or notarial advice.”
- “A qualified professional and the competent authorities determine legal eligibility and registration.”
- “A DROPi account or application does not create a cooperative or legal membership.”
- “Your route result is preliminary and must be confirmed for your founders, activities and documents.”
- “Submitting a file does not guarantee registration, timing, grants, tax treatment, sales or export eligibility.”
- “Electronic filing availability does not mean every cooperative meeting, vote or document may be completed electronically.”

### 9.2 Prohibited claims and controls

| Prohibited claim/action | Required product control |
|---|---|
| “DROPi creates/registers your cooperative” | Use readiness, coordination and filing-tracking language only; registration comes from official evidence |
| “Join by clicking” / “You are now a member” | Separate application, competent-body decision, effective conditions and platform access |
| “Official/verified cooperative” before evidence | Suppress public cooperative identity until registration and DROPi verification pass |
| “Guaranteed in one day” | Do not expose an unconditional completion date from the ONRC procedural period |
| “Guaranteed grant/funding” | Prohibit guarantee language and require program-specific eligibility review |
| “Tax-free cooperative” or generic tax advantage | Prohibit generic fiscal claims; Law No. 239/2025 confirms that old benefit summaries can become obsolete |
| “Export ready” as a permanent/global badge | Scope to organization + product + destination + validity period and specialist evidence |
| Automatic CAEN/legal-route recommendation | Return only `LIKELY_*` or expert-review outcomes; no auto-filing |
| Platform-created vote, quorum, mandate or resolution | Require route/statute rules, authorized actor and immutable evidence |

## 10. Required dated professional memo

Issue #482 remains open until a qualified Romanian professional delivers a written memo containing all fields below. Paid external review requires separate Product Owner authorization.

### 10.1 Reviewer record

| Field | Required value |
|---|---|
| Reviewer name and firm | To be completed |
| Professional capacity and credential/registration | To be completed and independently verified |
| Conflicts and reliance limitations | To be completed |
| Routes/categories reviewed | To be completed |
| Factual scenarios reviewed | To be completed |
| Primary law versions and effective dates | To be completed |
| Authorities/guidance consulted | To be completed |
| Opinion date | To be completed |
| Next mandatory review date/trigger | To be completed |
| Signed memo evidence location | To be completed outside the immutable public-source corpus if it contains personal/confidential data |

### 10.2 Questions the memo must answer

1. For each pilot scenario, which legal route, cooperative degree/category and founder/member classes are permitted?
2. What is the current minimum member count, and do transitions below the minimum require dissolution, remediation or another process?
3. What social-capital, social-part, in-kind contribution, payment-timing and member-liability rules apply?
4. Which CAEN Rev. 3 activities belong to the cooperative, members and DROPi entity for the proposed operating flow?
5. Which formation documents, forms, signature/form requirements, attestations, permits and evidence are mandatory at ONRC?
6. Who may file, what deadline applies, and how must completion requests, rejection, withdrawal, refiling and challenge be modeled?
7. What rules govern admission, effective membership, withdrawal, suspension, exclusion and financial settlement?
8. What bodies, notice periods, agenda rules, quorum, majorities, vote weights, proxy rules and evidence apply to each decision type?
9. What mandate, election, incompatibility and conflict-of-interest rules must the platform enforce or merely record?
10. Which meetings, notices, votes, mandates, minutes and resolutions may be electronic or remote, using which identity/signature/evidence standard?
11. Are the candidate state-machine corrections in Sections 7 and 8 legally accurate, and what additional states or forbidden transitions are required?
12. Are the disclaimers and prohibited-claim controls in Section 9 complete and non-misleading?
13. Which items require accountant, notary, ONRC or other authority confirmation in addition to legal counsel?
14. What change events require immediate re-review rather than waiting for the next scheduled legal-source check?

The memo must distinguish binding law, official procedure, professional interpretation and recommended DROPi policy. An answer such as “depends on the statute” must include the permitted drafting range and the exact product configuration that follows.

## 11. Source-to-gap map

| Source ID | What it currently supports | What it cannot approve |
|---|---|---|
| `RO-ONRC-AGRICULTURAL-COOPERATIVE-2026-09-13` | Time-stamped agricultural filing checklist and channel/evidence baseline | Substantive route eligibility, complete validity or guaranteed registration |
| `RO-ONRC-SOCIETY-COOPERATIVE-2026-09-13` | Time-stamped society-cooperative filing checklist and channel/evidence baseline | Substantive category eligibility, complete validity or guaranteed registration |
| `RO-LAW-566-2004-CURRENT-PENDING` | Identifies the controlling-law target | Any law-dependent agricultural route field or rule while the controlled current copy is missing |
| `RO-LAW-1-2005-CURRENT-PENDING` | Identifies the controlling-law target | Any law-dependent society-cooperative category field or rule while the controlled current copy is missing |
| `RO-LAW-265-2022-CURRENT-PENDING` | Identifies the controlling trade-register law | Final filing workflow, deadlines or legal outcomes |
| `RO-LAW-214-2024-CURRENT-PENDING` | Identifies the Romanian electronic-signature framework | Route-specific remote governance or document-form validity |
| `EU-REG-910-2014-CONSOLIDATED-2024-10-18` | EU electronic-effect/evidence baseline | Satisfaction of national or special cooperative form rules |
| `RO-LAW-239-2025` | Evidence that specified old agricultural-cooperative fiscal facilities were repealed from 2026-01-01 | Any generic or case-specific tax benefit |
| `RO-INSSE-CAEN-REV3` | Identifies the classification source to obtain | Any final activity-code mapping while the official copy/review is pending |

## 12. Exit criteria and owner gate

- [x] Current ONRC route-specific checklists captured and integrity-registered.
- [x] Official EU electronic-trust baseline and Law No. 239/2025 snapshot captured.
- [x] Missing current primary texts and product blockers recorded fail-closed.
- [x] Route, governance, electronic-act, state-machine and claims questions prepared for review.
- [ ] Current consolidated Laws No. 566/2004, No. 1/2005, No. 214/2024 and No. 265/2022 captured and reconciled.
- [ ] Current complete CAEN Rev. 3 source captured and scenario mapping confirmed.
- [ ] Qualified Romanian professional identified and credential verified.
- [ ] Dated written memo answers every Section 10 question for the selected pilot scenarios.
- [ ] Traceability requirements are updated from pending/review states using the canonical approval lifecycle.
- [ ] Product Owner separately approves any canonical amendment and implementation scope.

**Current decision:** research may continue; law-dependent design, automated filing, membership activation, electronic governance and public claims remain blocked.
