# DROPi Romania Launch — Legal Source Manifest

> **STATUS: CONTROLLED RESEARCH QUEUE / FAIL-CLOSED**
> **Version:** 0.2.0
> **As of:** 2026-09-15
> **Parent:** #492
> **Workstream:** #499
> **Governing canon:** `canonical/LEGAL_COMPLIANCE_SOURCE_OF_TRUTH.md`

This manifest is a launch-specific view over the controlled legal corpus. It does **not** replace `docs/legal/legal-source-register.json` and does not itself approve any legal requirement.

The purpose is to answer, for the proposed first Romanian pilot:

1. which authoritative sources are already controlled in the repository;
2. which existing sources are stale, incomplete or only research-grade;
3. which launch-critical sources are still missing from the controlled corpus;
4. which product/filing decision each source blocks;
5. what must be supplied to a qualified reviewer before design approval.

## 1. Reliance rule

The repository rule remains:

```text
no authoritative current source
  -> no approved requirement
  -> no law-dependent implementation assumption
  -> no enablement
```

A source may be publicly accessible on the web and still remain `MISSING FROM CONTROLLED CORPUS` until the repository stores or registers it according to `scripts/validate-legal-sources.mjs`.

An archived snapshot proves only what DROPi reviewed at a point in time. It does not prove continued applicability.

## 2. Existing controlled sources relevant to the Romanian legal MVP

| Source ID | Domain | Repository state | Launch disposition |
|---|---|---|---|
| `EU-GDPR-2016-679` | Privacy | `archived / research_only` | Existing baseline. Romanian implementation, role map, retention and DPIA remain separately required. |
| `RO-OUG-13-2013-ANCOM-CONSOLIDATION-2019` | Postal | `archived / pending_current_validation` | **STALE FOR LAUNCH RELIANCE.** ANCOM-hosted copy is explicitly unofficial and consolidated only through 2019. Current controlled primary text remains required. |
| `RO-ANCOM-DECISION-925-2023` | Postal | `archived / research_only` | Current core general-authorization/notification baseline; exact DROPi role and later amendments/applicability remain review-gated. |
| `RO-ANCOM-GENERAL-AUTHORIZATION-2026-09-12` | Postal | `archived / research_only` | Current regulator procedure/guidance checkpoint; recheck before actual filing. |
| `RO-INSSE-CAEN-REV3` | Entity/activities | `pending_upstream_access / missing_primary_copy` | Official ONRC-hosted CAEN Rev.3 copies were verified on 2026-09-15, but repository bytes/hash are still missing. Entity/activity mapping remains gated. |
| `EU-DIR-2024-2831` | Platform work | `archived / research_only` | Relevant to later proprietary delivery-partner model, not first external-carrier MVP. Romanian transposition remains required before own-fleet activation. |
| `EU-REG-168-2013-CONSOLIDATED-2024-11-27` | Powered road vehicles | `archived / research_only` | Later proprietary e-bike/scooter/vehicle scope only. Not first-launch authority. |

## 2.1 Official endpoints verified on 2026-09-15 but not yet promoted to controlled snapshots

The following official endpoints were independently re-verified and are recorded in `docs/research/RO_LAUNCH_007_OFFICIAL_SOURCE_FINDINGS_2026-09-15.md`. They remain pending controlled archival/registration where required.

| Domain | Official material verified | Research consequence | Controlled-corpus status |
|---|---|---|---|
| Postal | ANCOM authorization procedure, current general-authorization page, digital postal-reseller guidance/list; Portal Legislativ OUG 13/2013 interface | Confirms notification covers offering/resale/provision and supports a distinct postal-resale model with reseller responsibility | ANCOM baseline partly archived; current OUG 13 controlled primary snapshot still pending |
| Consumer Marketplace | OUG 34/2014 current Portal view, Art. 6^1 | Ranking, seller-professional status and responsibility-allocation disclosures are launch controls | primary snapshot/register refresh pending |
| 2026 consumer amendments | OUG 18/2026 | Art. 11^1 online withdrawal-function requirements applicable from 19 June 2026; other relevant changes include 27 September 2026 application dates | primary snapshot/register entry pending |
| DSA | Regulation (EU) 2022/2065 | Article 19/29 micro/small exclusions must be modelled accurately; no generic `DSA compliant` flag | primary snapshot/register entry pending |
| Romanian DSA | Law 50/2024 | Romanian implementation/DSC framework | primary snapshot/register entry pending |
| Product safety | Regulation (EU) 2023/988, consolidated 2026-05-29 | Article 22 Marketplace safety controls, Safety Gate/contact/process/listing obligations | consolidated primary snapshot/register entry pending |
| Payments | Law 209/2019 | Supports fail-closed PSP perimeter and external-PSP-first architecture | primary snapshot/register entry pending |
| Romanian privacy | Law 190/2018 | Required alongside GDPR for Romania launch data design | primary snapshot/register entry pending |
| CAEN | ONRC CAEN Rev.3 structure, Monitorul Oficial publication and Rev.2/Rev.3 correspondence | Confirms candidate role labels `4791`, `4792`, `5320`, `5330`; does not replace ANCOM classification | official bytes/hash/register refresh pending |

No row in this table is an authorization or professional interpretation.

## 3. Launch-critical missing or incomplete source set

The following source families must be added to the controlled legal corpus or explicitly remain blockers before their dependent design/filing state is promoted.

### 3.1 Entity, company, tax and activity classification

| Proposed source ID | Source / authority | Needed for | Current state |
|---|---|---|---|
| `RO-LAW-31-1990-CURRENT` | Companies Law No. 31/1990, current consolidated official text | SRL formation/governance baseline | `PRIMARY_COPY_REQUIRED` |
| `RO-LAW-239-2025` | Law No. 239/2025 | Current SRL capital rules | `PRIMARY_COPY_REQUIRED` |
| `RO-FISCAL-CODE-CURRENT` | Romanian Fiscal Code, current consolidated official text | residence, VAT, corporate tax, invoicing/tax model | `PRIMARY_COPY_REQUIRED` |
| `RO-ANAF-LEGAL-PERSON-RESIDENCE-CURRENT` | current ANAF guidance | place-of-effective-management evidence/questions | `PRIMARY_GUIDANCE_COPY_REQUIRED` |
| `RO-IRELAND-DTA-CURRENT` | Romania–Ireland double-taxation convention/current protocol text | dual company residence / PE analysis | `PRIMARY_COPY_REQUIRED` |
| `IE-REVENUE-COMPANY-RESIDENCE-CURRENT` | Irish Revenue | central-management-and-control analysis | `PRIMARY_GUIDANCE_COPY_REQUIRED` |
| `RO-INSSE-CAEN-REV3` | official CAEN Rev.3, with ONRC official-hosted copy verified 2026-09-15 | activity mapping | `EXISTING ENTRY — MISSING_PRIMARY_COPY` |
| `RO-ONRC-CAEN-REV3-CORRESPONDENCE-CURRENT` | ONRC | Rev.2→Rev.3 mapping / 5330 explanatory mapping | `OFFICIAL_ENDPOINT_VERIFIED — PRIMARY_COPY_REQUIRED` |
| `RO-VAT-395000-2025` | current Romanian fiscal amendment/ANAF guidance | VAT exemption threshold | `PRIMARY_COPY_REQUIRED` |
| `RO-EFACTURA-CURRENT` | OUG 120/2021 current consolidated + current ANAF guidance | B2C/B2B invoice transmission design | `PRIMARY_COPY_REQUIRED` |

**Blocks:** #493 approval, entity filing model, invoice schema, tax-related checkout assumptions.

### 3.2 Marketplace, consumer and electronic commerce

| Proposed source ID | Source / authority | Needed for | Current state |
|---|---|---|---|
| `RO-LAW-365-2002-CURRENT` | Law No. 365/2002, current consolidated text | information-society/e-contract provider duties | `PRIMARY_COPY_REQUIRED` |
| `RO-OUG-34-2014-CURRENT` | OUG No. 34/2014, current consolidated text | consumer distance-contract and Marketplace duties | `OFFICIAL_ENDPOINT_VERIFIED — PRIMARY_COPY_REQUIRED` |
| `RO-OUG-18-2026` | OUG No. 18/2026 | online withdrawal function + 2026 consumer-law amendments | `OFFICIAL_ENDPOINT_VERIFIED — PRIMARY_COPY_REQUIRED` |
| `RO-OUG-140-2021-CURRENT` | OUG No. 140/2021 | goods conformity / commercial guarantees | `PRIMARY_COPY_REQUIRED` |
| `RO-LAW-363-2007-CURRENT` | Law No. 363/2007 | unfair commercial practices | `PRIMARY_COPY_REQUIRED` |
| `EU-REG-2022-2065-DSA` | Regulation (EU) 2022/2065 | intermediary/hosting/platform/marketplace duties | `OFFICIAL_ENDPOINT_VERIFIED — PRIMARY_COPY_REQUIRED` |
| `RO-LAW-50-2024` | Law No. 50/2024 | Romanian DSA implementation/ANCOM role | `OFFICIAL_ENDPOINT_VERIFIED — PRIMARY_COPY_REQUIRED` |
| `RO-ANCOM-DSA-GUIDANCE-CURRENT` | ANCOM current intermediary/DSA procedure | provider/contact/reporting operational requirements | `PRIMARY_GUIDANCE_COPY_REQUIRED` |
| `EU-REG-2023-988-GPSR` | Regulation (EU) 2023/988, consolidated 2026-05-29 endpoint verified | online marketplace product-safety duties | `OFFICIAL_ENDPOINT_VERIFIED — PRIMARY_COPY_REQUIRED` |
| `EU-SAFETY-GATE-MARKETPLACE-CURRENT` | EU Safety Gate official marketplace guidance | registration/notice/recall operational procedure | `PRIMARY_GUIDANCE_COPY_REQUIRED` |

**Blocks:** #494 approval, merchant onboarding schema, listing compliance, ranking disclosure, binding checkout, online withdrawal, safety/recall controls.

### 3.3 Payments

| Proposed source ID | Source / authority | Needed for | Current state |
|---|---|---|---|
| `RO-LAW-209-2019-CURRENT` | Law No. 209/2019 current consolidated official text | payment-service perimeter | `OFFICIAL_ENDPOINT_VERIFIED — PRIMARY_COPY_REQUIRED` |
| `EU-PSD2-CURRENT` | Directive (EU) 2015/2366 current applicable text/amendments | payment perimeter / exclusions | `PRIMARY_COPY_REQUIRED` |
| `EBA-COMMERCIAL-AGENT-ECOMMERCE-QA` | EBA/EC official Q&A | commercial-agent exclusion interpretation evidence | `PRIMARY_GUIDANCE_COPY_REQUIRED` |
| `PSP-SELECTED-LICENCE-EVIDENCE` | selected PSP's regulator/passport evidence | provider eligibility | `BLOCKED UNTIL PSP SELECTED` |
| `PSP-SELECTED-MARKETPLACE-TERMS` | selected PSP official terms/docs | onboarding, fund flow, fees, refunds, negative balance, exit | `BLOCKED UNTIL PSP SELECTED` |

**Blocks:** #495 approval and all live charging.

### 3.4 Postal delivery

| Source ID | Source / authority | Needed for | Current state |
|---|---|---|---|
| `RO-OUG-13-2013-CURRENT` | OUG No. 13/2013 current consolidated official text | provider/reseller/intermediary scope | `OFFICIAL PORTAL ENDPOINT VERIFIED — CURRENT CONTROLLED PRIMARY COPY REQUIRED` |
| `RO-ANCOM-DECISION-925-2023` | ANCOM Decision No. 925/2023 | notification/general conditions | `EXISTING ARCHIVED` |
| `RO-ANCOM-GENERAL-AUTHORIZATION-2026-09-12` | ANCOM current page | filing/process checkpoint | `EXISTING ARCHIVED` |
| `RO-ANCOM-DIGITAL-POSTAL-RESELLERS-CURRENT` | ANCOM digital-platform resale guidance | effective provider disclosure / reseller model | `OFFICIAL_ENDPOINT_VERIFIED — CONTROLLED GUIDANCE COPY REQUIRED` |
| `RO-ANCOM-POSTAL-REGISTER-CURRENT` | ANCOM provider/reseller register | effective-carrier verification | `OFFICIAL_ENDPOINT_VERIFIED — CONTROLLED DATA METHOD REQUIRED` |
| `CARRIER-SELECTED-AUTHORITY-EVIDENCE` | selected carrier | partner authority/scope | `BLOCKED UNTIL CARRIER SELECTED` |

**Blocks:** #496 approval, postal terms/notification and integrated DROPi postal option.

### 3.5 Privacy and data

| Proposed source ID | Source / authority | Needed for | Current state |
|---|---|---|---|
| `EU-GDPR-2016-679` | GDPR | general privacy baseline | `EXISTING ARCHIVED` |
| `RO-LAW-190-2018-CURRENT` | Law No. 190/2018 | Romanian GDPR implementation | `OFFICIAL_ENDPOINT_VERIFIED — PRIMARY_COPY_REQUIRED` |
| `RO-ANSPDCP-GUIDANCE-CURRENT` | ANSPDCP | rights/breach/controller-processor operational guidance | `PRIMARY_GUIDANCE_COPY_REQUIRED` |
| `EDPB-CONTROLLER-PROCESSOR-CURRENT` | EDPB guidelines | role mapping | `PRIMARY_GUIDANCE_COPY_REQUIRED` |
| `VENDOR-SELECTED-DPA-TRANSFER-EVIDENCE` | selected cloud/PSP/carrier/support vendors | Article 28 / transfer / subprocessor decisions | `BLOCKED UNTIL VENDOR SET FIXED` |

**Blocks:** #498 approval, production data map and exact retention/access model.

### 3.6 First category and pilot zone

| Proposed source ID | Source / authority | Needed for | Current state |
|---|---|---|---|
| `EU-REG-2023-988-GPSR` | GPSR | paper-goods Marketplace baseline | `OFFICIAL_ENDPOINT_VERIFIED — PRIMARY_COPY_REQUIRED` |
| `CATEGORY-PAPER-GOODS-SPECIFIC-SOURCES` | EU/Romanian sector sources if any selected item triggers them | exact category allowlist | `CATEGORY REVIEW REQUIRED` |
| `CARRIER-COVERAGE-PILOT-ZONE` | selected carrier official service/coverage rules | zone/price/delivery design | `BLOCKED UNTIL CARRIER SELECTED` |
| `LOCAL-ZONE-RESTRICTIONS-BUCHAREST-ILFOV` | local authorities if applicable to selected operation | local operational limits | `RESEARCH REQUIRED` |

**Blocks:** #497 final owner/legal selection and public catalog activation.

## 4. Source acquisition states

Use these launch-manifest states descriptively; only `legal-source-register.json` controls source provenance state:

- `EXISTING_ARCHIVED` — controlled repository snapshot already exists;
- `EXISTING_PENDING_CURRENT_VALIDATION` — controlled snapshot exists but is stale/incomplete for current launch reliance;
- `MISSING_PRIMARY_COPY` — official source identified, controlled copy unavailable;
- `PRIMARY_COPY_REQUIRED` — official source must be captured/registered;
- `PRIMARY_GUIDANCE_COPY_REQUIRED` — current official operational guidance must be captured/registered;
- `OFFICIAL_ENDPOINT_VERIFIED` — official endpoint was re-verified but controlled bytes/hash/register promotion is still pending;
- `BLOCKED_UNTIL_DECISION` — source identity depends on owner/provider/category selection;
- `PROFESSIONAL_INTERPRETATION_REQUIRED` — source exists but application to DROPi remains unresolved.

Never convert a web-search snippet, model summary or secondary article into `EXISTING_ARCHIVED`.

## 5. Professional-review dependency map

| Workstream | Must be reviewed by | Minimum answer before promotion |
|---|---|---|
| #493 entity/tax/CAEN | Romanian accountant/tax counsel; Ireland tax advice where needed | entity structure, actual management/residence treatment, CAEN, VAT/invoice allocation |
| #494 Marketplace | Romanian/EU e-commerce/consumer lawyer | service classification, applicable DSA scope, Marketplace disclosures, withdrawal, GPSR control set |
| #495 payments | payment/fintech counsel + accountant + selected PSP compliance | DROPi outside payment-service perimeter under selected architecture; money/invoice/refund allocation |
| #496 postal | Romanian postal counsel and/or written ANCOM confirmation | exact Model A/B/C/D classification; notification/terms/contract path |
| #497 category/zone | product-safety counsel/compliance + Product Owner | first category allowlist and exact pilot zone |
| #498 privacy/contracts | privacy counsel/DPO + commercial counsel | data-role map, legal bases, retention, agreements, incident/support allocation |

## 6. Promotion gate

No launch requirement may move to `approved_for_design` merely because this manifest marks its source as found.

Required promotion evidence:

```text
controlled source
+ exact provision/reference
+ scoped DROPi factual flow
+ qualified interpretation where required
+ owner-approved operating decision
= candidate for approved_for_design
```

Filing/pilot/public enablement require later evidence stages as defined in the legal canon.

## 7. Immediate P0 source priorities

Acquire/validate in this order because they define the largest architecture decisions:

1. controlled current OUG 13/2013 + controlled ANCOM resale guidance;
2. controlled current OUG 34/2014 + OUG 18/2026;
3. DSA + Law 50/2024 + current ANCOM DSA procedure;
4. consolidated GPSR + Safety Gate Marketplace guidance;
5. current Law 209/2019 + PSD2 official materials;
6. official CAEN Rev.3 copy + ONRC correspondence;
7. current Romanian fiscal/e-Factura sources + Romania–Ireland tax material;
8. Law 190/2018 + ANSPDCP/EDPB operational privacy sources;
9. selected PSP/carrier/category/zone evidence after owner selections.

## 8. Current architecture implication

Official-source verification on 2026-09-15 does not justify expanding the first pilot. The working legal-MVP hypothesis remains:

```text
Romania
  -> verified professional merchants
  -> controlled Marketplace
  -> narrow low-complexity non-food allowlist
  -> external regulated PSP
  -> merchant fulfilment first
  -> postal resale only after ANCOM role/notification/contracts
  -> restricted pilot geography
  -> own delivery network later, one regulated layer at a time
```

This is a candidate launch strategy, not an authorization.

## 9. Status

This manifest is **not a legal-source register entry** and therefore requires no immutable source hash itself. It is the controlled acquisition/review queue for #499.

#499 remains open until launch-critical source states, traceability/blocker updates and the qualified-review packet satisfy the parent #492 evidence gate.