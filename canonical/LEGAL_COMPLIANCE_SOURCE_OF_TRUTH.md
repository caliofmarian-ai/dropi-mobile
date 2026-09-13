# DROPi Canonical Reference: Legal Compliance Source of Truth

**Version:** 1.0.0
**Status:** ACTIVE CANON
**Decision date:** 2026-09-12
**Owner:** DROPi Product Owner
**Applies to:** every jurisdiction, company entity, channel, service, person, operator, vehicle, zone, and operational stage

## 1. Purpose and authority boundary

DROPi products MUST be derived from applicable law and verified regulatory requirements. Product intuition, competitor behavior, a document upload, or an internal approval cannot substitute for legal authority.

The law in force and the competent authority remain the external legal source of truth. This repository is DROPi's canonical, auditable record of:

- which official source and version were reviewed;
- what requirement was extracted from it;
- who reviewed and approved the interpretation;
- which company, partner, vehicle, zone, data, contract, and product gates implement it;
- when the source and interpretation must be revalidated.

An archived source is evidence of what was reviewed at a point in time. It MUST NOT be represented as proof that the text is still current, complete, applicable, or sufficient for launch.

## 2. Non-negotiable rule

**No authoritative source, no approved requirement; no approved requirement, no law-dependent design or operational enablement.**

The application may include a truthful, non-operational catalog shell for a planned service. It may also implement generic reusable infrastructure whose behavior does not presume a legal outcome. It MUST NOT implement or expose a regulated transaction path based on assumptions while the applicable sources, interpretation, entity model, or authorization remain unresolved.

Examples of law-dependent behavior include document lists, eligibility decisions, service areas, capacity, pricing constraints, required disclosures, retention periods, dispatch, trip or mission start, fiscal receipts, and regulator exports.

## 3. Source hierarchy

Sources are classified and relied upon in this order:

| Priority | Source class | Permitted use |
|---:|---|---|
| 1 | Legislation, regulation, official gazette, binding local ordinance, or treaty text | Normative baseline, subject to currency and applicability review |
| 2 | Binding decision, licence, permit, judgment, or written direction from the competent authority | Requirement or entity-specific authority within its scope |
| 3 | Current official regulator procedure, citizen charter, checklist, register, or guidance | Operational evidence; reconcile with higher-ranking law |
| 4 | Written opinion from qualified local counsel, accountant, insurer, auditor, or regulator | Interpretation and implementation evidence; never silently overrides higher authority |
| 5 | Reputable reporting or professional commentary | Change alert and discovery only; never an enablement source |
| 6 | DROPi interpretation or internal policy | Product control only; must be identified as such |

Conflicts are never resolved by choosing the most convenient text. A conflict, translation mismatch, stale checklist, inaccessible source, or uncertain competent authority creates a recorded blocker until reconciled in writing.

## 4. Canonical legal corpus

The controlled corpus consists of:

- `docs/legal/legal-source-register.json` — machine-readable inventory, provenance, hash, status, and reliance state;
- `docs/legal/sources/` — immutable snapshots of official material actually reviewed;
- `docs/legal/LEGAL_REQUIREMENTS_TRACEABILITY.md` — source-to-requirement-to-gate mapping;
- `docs/legal/LEGAL_GAPS_AND_BLOCKERS.md` — missing evidence and decisions that keep services disabled;
- jurisdiction and service research documents — analysis, not independent authority;
- counsel, regulator, insurer, and audit evidence added later under restricted evidence references.

Binary and HTML snapshots MUST retain their original bytes. A newer retrieval is stored as a new dated/versioned file and register entry; it does not overwrite the earlier snapshot. Every local snapshot MUST have a SHA-256 hash, byte length, official origin URL, retrieval date, jurisdiction, authority, and reliance state.

Copyrighted news or commentary is stored as metadata and a link unless redistribution is authorized. Personal documents, licences, criminal records, medical records, and live application evidence MUST NOT be committed to this legal corpus.

## 5. Requirement lifecycle

Every material legal requirement progresses through explicit states:

`identified → source_captured → interpreted → counsel_reviewed → regulator_confirmed_if_required → approved_for_design → implemented → verified → enabled`

Rules:

- stages cannot be skipped;
- `regulator_confirmed_if_required` is mandatory whenever the competent authority, classification, local rule, or operating model is uncertain;
- approval is scoped to one source version, jurisdiction, entity model, service, vehicle class, zone, and effective period;
- source expiry, amendment, repeal, regulator contradiction, entity change, insurance lapse, or unresolved incident can move the requirement or dependent capability back to a blocked state;
- implementation completion never proves legal approval;
- a feature flag or administrator cannot override an incomplete legal requirement.

The future machine-readable requirement record MUST include at least:

`requirementId`, `sourceIds`, `jurisdiction`, `authority`, `service`, `subjectType`, `vehicleClass`, `zone`, `legalTextReference`, `interpretation`, `mandatoryOrPolicy`, `effectiveFrom`, `effectiveTo`, `reviewState`, `reviewers`, `approvalEvidence`, `implementationControls`, `tests`, `lastCheckedAt`, and `nextReviewAt`.

## 6. Two independent authorization gates

Every regulated operation requires both gates to pass at the exact time of use.

### 6.1 Company / market / service gate

This gate proves that the responsible DROPi or local operating entity may offer, intermediate, or perform the service in the selected jurisdiction and zone. It includes, as applicable:

- correct legal entity and registered activities;
- platform, postal/courier, transport, aviation, local business, tax, and data-protection authority;
- approved contracts, insurance, security, audit, recordkeeping, fiscal, support, and incident systems;
- an approved current jurisdiction pack and service/vehicle-class rollout stage.

### 6.2 Partner / person / operator / vehicle gate

This gate proves that the particular supplier, operator, controller/driver, vehicle, and relationship may perform that specific mission. It includes, as applicable:

- identity, business form, employment or self-employed relationship, and service contract;
- personal licence, professional certificate, medical/psychological fitness, training, and background conditions;
- operator authorization or franchise;
- vehicle registration, legal use, inspection, compliant copy/badge, capacity, insurance, route/zone, and aircraft registration;
- current documents, no suspension, and successful revalidation immediately before offer, acceptance, and start.

Passing one gate never compensates for failure of the other. Delivery authorization never grants passenger authority; road authority never grants aviation authority; authority in one city, vehicle class, or legal entity never transfers automatically elsewhere.

## 7. Staged company authorization

DROPi may obtain authority and launch capability in stages. The catalog may describe the intended multimodal system from the beginning, but each market/service/vehicle combination has its own status:

`researched → legal_model_pending → application_preparation → filed → authority_granted → pilot_approved → public_enabled → suspended | expired | retired`

Examples that remain independently gated are pedal bicycle parcel delivery, electrically assisted bicycle delivery, scooter/motorcycle delivery, car/van parcel delivery, drone delivery, passenger car service, and passenger tricycle service. No "authorized for everything" state exists in the product model.

A company may file multiple lawful applications in parallel where authorities allow it. DROPi MUST nevertheless preserve the separate decision, scope, conditions, effective dates, and operational controls of every authorization.

## 8. Law versus DROPi safety policy

The system MUST label each control either:

- `legal_requirement` — directly supported by a cited authoritative source and reviewed interpretation; or
- `dropi_policy` — a contractual, insurer-driven, or internal safety/quality requirement.

DROPi may require cyclist road-safety training, protective equipment, medical or accident insurance, competency checks, or refresher training even where the state does not issue a professional cyclist attestation. Such controls are valuable, but they MUST NOT be described as government licences or legal attestations without a source establishing that fact.

The same distinction applies to drone training, driver screening, vehicle inspections, background checks, insurance limits, and service-specific badges.

## 9. Fail-closed product behavior

If a source or requirement is missing, stale, contradictory, pending legal review, outside its approved zone, or not traceable to an implemented control:

- no public quote, booking, dispatch, offer, acceptance, mission/trip start, or regulated payment collection is permitted;
- partner onboarding may open only for evidence types already approved for that stage;
- the service may remain visible as `catalog_locked` with factual status copy;
- administrator override may suspend more activity but may not invent authority;
- the affected scope must expose a reason code and immutable audit event.

The product MUST default to the narrower lawful interpretation until qualified review resolves uncertainty.

## 10. Change control and monitoring

The Legal/Compliance owner MUST review sources before initial design approval, before filing, before pilot, immediately before public launch, and thereafter on a jurisdiction-defined schedule. Additional review is triggered by:

- a new law, amendment, court decision, circular, checklist, fee, form, or regulator notice;
- a regulator page or translation that conflicts with another official version;
- a change to company entity, contractor model, vehicle, route, payment, pricing, insurance, data flow, or operating zone;
- licence expiry, suspension, enforcement action, serious incident, or counsel/regulator warning.

Each update produces a new source entry, a diff/impact assessment, requirement revisions, affected control/test updates, reapproval evidence, and—where necessary—automatic suspension. Historical records remain immutable.

## 11. Approval and accountability

Research may identify and organize sources. Only named, qualified reviewers may approve legal interpretations within their professional and jurisdictional competence. Product, engineering, or AI agents may not self-certify legality.

Minimum accountable roles are:

- Legal/Compliance owner per jurisdiction;
- qualified local counsel for launch interpretation;
- responsible company/entity representative;
- Product owner for scoped business acceptance;
- Security/Privacy owner where data or audit duties apply;
- Operations/Safety owner and insurer where operational risk applies;
- Engineering owner for control implementation and verification.

Every approval must be attributable, dated, scoped, reviewable, and revocable.

## 12. Current applicability

This canon immediately governs C1 delivery, C1 Passenger Mobility, future drone operations, and all later C2/C3 regulated activities. Existing planning documents are subordinate to this policy. Any conflict must be reconciled before implementation continues.
