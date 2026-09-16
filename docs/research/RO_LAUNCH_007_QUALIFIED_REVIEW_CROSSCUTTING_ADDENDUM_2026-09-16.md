# RO-LAUNCH-007 — Qualified Review Cross-Cutting Addendum

> **STATUS: PRE-ENGAGEMENT / NOT LEGAL OR TAX ADVICE / FAIL-CLOSED**
> **As of:** 2026-09-16
> **Supplements:** `RO_LAUNCH_007_QUALIFIED_REVIEW_PACKET.md` v0.2.0
> **Consumes:** `docs/legal/RO_LAUNCH_CROSSCUTTING_APPLICABILITY_WORKSHEET_2026-09-16.md`
> **Related gaps:** `GAP-RO-P2B-MERCHANT`, `GAP-RO-DAC7`, `GAP-RO-ACCESSIBILITY`, `GAP-RO-PACKAGING-EPR`, `GAP-RO-DSA-SCOPE`

This addendum narrows the professional review to questions that remain genuinely unresolved after the 2026-09-16 current-authority research pass. Reviewers should not spend paid time re-discovering the baseline source/factual points below unless they disagree with them.

Every disagreement must identify the authority/version and factual assumption that changes the result.

## 1. Response format

For every row return:

```text
DECISION = APPROVED | NOT_APPLICABLE | NOT_YET_VALIDATED | REQUIRES_OTHER_SPECIALIST
FACTS_RELied_ON = [...]
PRIMARY_AUTHORITY = act/article/version
SECONDARY_GUIDANCE = optional
EVIDENCE_REQUIRED = [...]
PRODUCT_CONTROL = [...]
REVIEW_TRIGGER = date/fact/law-change
```

Do not replace an unresolved row with general statements such as `comply with P2B`, `comply with DAC7` or `comply with PPWR`.

---

# A. P2B — focused review

## Facts already supplied to reviewer

Candidate first pilot:

- online/app Marketplace;
- professional merchants use the service to offer goods;
- Romanian/EU consumers;
- DROPi facilitates the initiation/conclusion of Marketplace purchases;
- merchants enter a contractual Marketplace relationship with DROPi.

Research classification: `LIKELY_IN_SCOPE / FINAL_APPROVAL_PENDING` under Regulation (EU) 2019/1150.

## Questions requiring written answer

1. Confirm or reject that the candidate service is an `online intermediation service` for Regulation (EU) 2019/1150. If rejected, identify the missing statutory element and changed factual design.
2. Confirm the Romanian enforcement/applicability layer under current OUG 23/2021/current Competition Council practice.
3. Confirm which merchant Terms/change/restriction/suspension/termination/ranking/differentiated-treatment/data-access requirements apply to the proposed service.
4. Confirm the exact obligation-specific small-enterprise exceptions for the internal complaint system and mediation provisions; do not treat them as a blanket P2B exemption.
5. Confirm that the relevant EU SME Recommendation headline small-enterprise test is:
   - fewer than 50 persons; and
   - annual turnover **or** annual balance-sheet total not exceeding EUR 10 million;
   and specify the required partner/linked-enterprise aggregation method for the actual DROPi ownership structure.
6. Identify the exact evidence period/documents needed to establish or reject that exception.
7. Confirm the merchant notice/reason/effective-date evidence required for each `RESTRICT`, `SUSPEND`, `TERMINATE`, and `RESTORE` decision.
8. State the review trigger if company/group size changes.

### Required deliverable

`P2B Applicability + Merchant Terms Matrix`, including a separate decision for the Article 11/12 size exceptions.

---

# B. DAC7 — focused current-law review

## Authority correction already supplied

Do not review the 2026 launch solely against the original Directive (EU) 2021/514 and OG 16/2023.

The controlled source family includes:

- consolidated Directive 2011/16/EU as of 2026-01-01;
- Directive (EU) 2021/514;
- Romanian OG 16/2023;
- OUG 71/2025 amendment family;
- OG 1/2026 amendment family;
- registered ANAF DAC7 guidance and form/order family.

## Candidate facts already narrowed

- the service connects sellers with users;
- DROPi intends to contract with merchants for access to the Marketplace;
- sale of goods is a first-pilot activity.

Research classification:

```text
DAC7_PLATFORM_OPERATOR_CANDIDATE = LIKELY
DAC7_REPORTING_PLATFORM_OPERATOR = NOT_YET_VALIDATED
DAC7_REPORTING_JURISDICTION = NOT_YET_VALIDATED
```

## Questions requiring written answer

1. Confirm or reject Platform Operator status for the final proposed DROPi legal entity and service.
2. Determine whether that entity is a Reporting Platform Operator and whether any excluded-platform-operator category applies.
3. Identify the Member State nexus and reporting/registration jurisdiction using the final entity/residence/incorporation/management/PE facts.
4. Confirm which first-pilot goods transactions are Relevant Activities.
5. Confirm each Excluded Seller class applicable to the first-pilot merchant population.
6. Confirm that the sale-of-goods de-minimis seller exclusion requires **both**:
   - fewer than 30 facilitated sale-of-goods activities in the reporting period; and
   - total consideration not exceeding EUR 2,000.
7. Confirm the exact current required due-diligence fields for an entity seller and the verification method/evidence.
8. Confirm the currently applicable F7000 schema/version and when Forms 707/708 or another current form are relevant to DROPi.
9. Confirm the current statutory filing deadline; the controlled research pack currently identifies 31 January following the reporting period. State any weekend/holiday/procedural rule separately from the statutory deadline.
10. Reconcile the effect of OUG 71/2025 and OG 1/2026 on Article 291^5, identification fields, central registry/registration and any reporting mechanics relevant to DROPi.
11. Confirm the current due-diligence/reporting evidence-retention rule. The current ANAF guide identifies a floor of five years and a ceiling of ten years after the end of the reporting period; specify which records and current authority support the final policy.
12. Approve the separate privacy purpose/legal basis/notice/access/retention profile for DAC7 data. Identify data that DROPi must **not** collect before DAC7 applicability is approved.
13. Define the correction/re-filing and ANAF receipt evidence that should close a reporting period.

### Required deliverable

`DAC7 Reporting Platform Operator + Seller Classification Memo` plus registration/reporting/correction matrix.

---

# C. Accessibility — focused applicability/exemption review

## Candidate scope already narrowed

The proposed consumer Marketplace is an online/app service provided to consumers with a view to concluding consumer contracts. Romanian Law 232/2022 expressly covers e-commerce services for the relevant post-28-June-2025 period.

Research classification:

```text
ACCESSIBILITY_ECOMMERCE_SERVICE_SCOPE = IDENTIFIED
ACCESSIBILITY_MICROENTERPRISE_EXEMPTION = EVIDENCE_PENDING
```

## Questions requiring written answer

1. Confirm that the candidate DROPi service is a covered e-commerce service under the current Romanian Law 232/2022/EAA framework.
2. Confirm the service-provider microenterprise exemption and the exact evidence/aggregation method needed for the actual DROPi entity.
3. Confirm the headline test currently identified in the source pack:
   - fewer than 10 persons; and
   - annual turnover **or** annual balance-sheet total not exceeding EUR 2 million.
4. Confirm that Romanian fiscal `microîntreprindere` status is not a substitute for this accessibility-law test.
5. Identify any partner/linked/group aggregation or other entity-calculation rule relevant to the actual ownership facts.
6. If exempt, identify what documentation must support the exemption and when it must be reviewed.
7. If not exempt, map the exact requirements for:
   - product/service accessibility information exposed through the e-commerce service;
   - identification/authentication/security functions;
   - payment functions;
   - navigation/forms/checkout;
   - withdrawal/returns/support;
   - required accessibility information/statement/documentation.
8. Identify the authoritative technical standard/harmonised-standard or other acceptance reference for the intended release date.
9. Confirm the Romanian competent authority and required cooperation/evidence path for this service.
10. State which accessibility controls should remain DROPi policy even during a lawful microenterprise exemption.

### Required deliverable

`Accessibility Applicability + Exemption Evidence + Release Control Matrix`.

---

# D. PPWR / packaging / EPR — focused review

## Authority and architecture correction already supplied

PPWR applies from 12 August 2026.

The controlled source family now includes:

- Regulation (EU) 2025/40;
- official Commission Notice C(2026) 3702 as non-binding guidance;
- Romanian Law 249/2015;
- current OUG 196/2005 Environmental Fund endpoint;
- Law 79/2026 amendment family.

Two legal questions must be answered separately:

```text
A. who is the producer/importer/packer/fulfilment/EPR actor?
B. does DROPi itself have the PPWR online-platform producer-verification duty?
```

## Questions requiring written answer

1. For the actual first-pilot entity/service, determine whether DROPi is an online platform within the PPWR rule tied to Section 4 of Chapter III DSA and permitting consumers to conclude distance contracts with producers.
2. Explain the exact interaction between DSA Section 4 scope/enterprise-size exclusions and the PPWR platform rule. Do not infer it from a generic `smallCompany` field.
3. If the PPWR platform-verification rule applies, confirm the pre-activation evidence DROPi must obtain from each producer, including:
   - relevant producer registration information/registration number for the consumer Member State; and
   - EPR compliance self-certification.
4. Define the required `best efforts` completeness/reliability assessment and evidence. State what may be automated and what requires manual escalation.
5. Confirm whether missing/invalid required evidence must deny or suspend producer Marketplace access for the affected Member State/scope.
6. Confirm how the PPWR platform duty interacts with DSA trader-traceability evidence without merging the two evidence sets incorrectly.
7. Separately identify the producer/EPR-responsible actor for:
   - product/sales packaging;
   - grouped packaging;
   - transport packaging;
   - e-commerce/shipping packaging.
8. Apply the current Romanian Law 249/2015 + OUG 196/2005 + Law 79/2026/environmental implementing layer to the actual placing-on-market/import/overpacking/fulfilment facts.
9. Identify Romanian Environmental Fund/EPR/registration/reporting duties for each actor; do not automatically assign them to DROPi merely because it operates the Marketplace.
10. Confirm how the result changes if DROPi later supplies shipping packaging, warehouses, packs or fulfils merchant goods.
11. Identify later PPWR packaging-minimisation/empty-space milestones relevant to architecture and their exact effective dates/methodology; do not activate later requirements merely because they appear in the 2026 Regulation text.

### Required deliverable

Two distinct outputs:

- `PPWR Online Platform Verification Matrix`;
- `Packaging Producer/EPR Responsibility Matrix`.

---

# E. Shared evidence rules

## Enterprise-size evidence must not be cross-reused blindly

The reviewer must explicitly approve the legal-domain definition used:

| Legal domain | Candidate size concept | Headline threshold currently identified |
|---|---|---|
| P2B specific Article 11/12 exceptions | small enterprise | `<50` persons + `<= EUR 10m` turnover **or** balance-sheet total |
| Accessibility services exemption | microenterprise | `<10` persons + `<= EUR 2m` turnover **or** balance-sheet total |
| Romanian tax | fiscal status | separate #493 tax analysis; not a substitute |

A reviewer should reject a single shared `smallCompany=true` implementation.

## Final promotion rule

A professional answer may promote a row only when it states:

```text
current authority
+ actual DROPi facts
+ evidence proving those facts
+ scoped legal/tax conclusion
+ required product control
+ review trigger
```

If any element is missing, return `NOT_YET_VALIDATED` rather than an assumed PASS.
