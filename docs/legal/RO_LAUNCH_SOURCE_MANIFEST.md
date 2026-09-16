# Romania Launch Legal Source Manifest

> **STATUS: PRE-COUNSEL / FAIL-CLOSED**
> **Version:** 0.12.0
> **As of:** 2026-09-16
> **Issue:** #499
> **Parent:** #492
> **Governing canon:** `canonical/LEGAL_COMPLIANCE_SOURCE_OF_TRUTH.md`

This manifest is the launch-focused entry point into the controlled legal corpus for the proposed Romanian MVP. It does not authorize implementation or launch. Source status, provenance, hashes and controlled-copy state remain governed by `docs/legal/legal-source-register.json`.

Current source-register baseline after the 2026-09-16 current-authority batch: `93 records / 37 immutable files`.

## Launch corpus documents

### Source / authority layer

- `docs/legal/legal-source-register.json` — authoritative source inventory and controlled-copy state.
- `docs/legal/LEGAL_REQUIREMENTS_TRACEABILITY.md` — canonical provisional requirement/control matrix.
- `docs/legal/LEGAL_GAPS_AND_BLOCKERS.md` — explicit legal/source blockers; current cross-cutting revision v1.8.0.
- `docs/legal/RO_LAUNCH_REQUIREMENTS_TRACEABILITY.md` — launch-focused staging matrix retained as a review aid; canonical rows are also integrated into the main traceability matrix.
- `docs/research/RO_LAUNCH_007_OFFICIAL_SOURCE_FINDINGS_2026-09-15.md` — time-stamped official-endpoint findings.
- `docs/research/RO_LAUNCH_007_QUALIFIED_REVIEW_PACKET.md` — bounded questions for Romanian/EU legal, tax/accounting, payment, postal, privacy, product-safety and cross-cutting Marketplace review.

### Consolidated decision/control layer

- `docs/legal/RO_LAUNCH_DECISION_REGISTER_2026-09-15.md` — consolidated #493–#499 launch decisions, candidate operating boundaries and unresolved evidence.
- `docs/legal/RO_LAUNCH_MARKETPLACE_CONTROL_CONTRACT_2026-09-15.md` — merchant capability, consumer presentation, OUG 34/2014 disclosures, Law 363/2007 unfair-practice controls, Law 193/2000 Terms review, SAL/ADR information, binding checkout, withdrawal, DSA applicability and safety/moderation case model.
- `docs/legal/RO_LAUNCH_PLATFORM_BUSINESS_TAX_ACCESSIBILITY_PACKAGING_CONTRACT_2026-09-16.md` v1.1.0 — fail-closed P2B merchant relationship, current DAC7 applicability/reporting, e-commerce accessibility and separate packaging-producer/PPWR-platform verification profiles.
- `docs/legal/RO_LAUNCH_CROSSCUTTING_APPLICABILITY_WORKSHEET_2026-09-16.md` — evidence worksheet distinguishing facts already narrowed from entity/professional determinations still `NOT_YET_VALIDATED`.
- `docs/legal/RO_LAUNCH_PRODUCT_ALLOWLIST_GPSR_CONTRACT_2026-09-15.md` — deny-by-default first-family allowlist, exclusions and GPSR listing/safety gate.
- `docs/legal/RO_LAUNCH_PAYMENT_SETTLEMENT_CONTROL_CONTRACT_2026-09-15.md` — no-custody first-pilot money-flow boundary, provider authority evidence, SCA, webhook/idempotency, component ledger, settlement/reconciliation, refund/dispute and wallet/e-money gates.
- `docs/research/RO_LAUNCH_003_PSP_CANDIDATE_MATRIX_2026-09-15.md` — provider-owned evidence and the same authority/KYB/SCA/funds/refund/chargeback/reconciliation questionnaire across PayU/NETOPIA/Stripe/Adyen/Mollie candidates; no provider selected.
- `docs/legal/RO_LAUNCH_POSTAL_ROLE_DECISION_CONTRACT_2026-09-15.md` — separate Model A merchant fulfilment, Model B intermediation, Model C postal resale and Model D postal provision contracts.
- `docs/legal/RO_LAUNCH_DATA_FLOW_RETENTION_SUPPORT_CONTRACT_2026-09-15.md` — flow-specific roles, legal-basis/retention engine, rights, legal hold, breach, DPIA, restricted access and specialist support cases without invented retention values.

## Candidate first-launch operating envelope

Current planning hypothesis:

```text
Romanian operating entity
-> professional merchants only
-> controlled C1 Marketplace
-> low-complexity non-food allowlist
-> merchant seller of record candidate
-> eligible external PSP
-> no DROPi fund custody / no stored-value wallet
-> merchant fulfilment first
-> optional postal resale only after ANCOM classification/notification/contracts
-> restricted Romanian pilot geography
```

Excluded from the first launch: P2P/private sellers, food and deliberately higher-risk product families, proprietary DROPi courier fleet, Passenger Mobility, drone delivery, Cooperative Hub implementation, C2, C3, internal customer wallet/stored value and token/crypto settlement.

## Current launch-critical source families

### Entity / tax / CAEN

The entity/tax source chain includes controlled copies of Irish Revenue company-residency guidance, the original Ireland–Romania DTA legal order, Ireland's MLI implementing order, Revenue's explanatory synthesised MLI/DTA text and ANAF guidance on Romanian residence of foreign legal persons.

The previous shorthand that the treaty always resolves dual residence solely by `place of effective management` is superseded. The current post-MLI position requires competent-authority mutual-agreement analysis having regard to place of effective management, incorporation/constitution and other relevant factors. Actual DROPi management facts still require professional cross-border tax analysis.

The Romanian invoicing family registers current OUG 120/2021 and Law 88/2026 e-Factura endpoints. Both remain `pending_primary_copy` after automated Legislative Portal retrieval refusal. Their application must be derived per actual supplier, transaction and VAT/fiscal facts; merchant-product, DROPi platform-fee and any future postal-service invoice are not assumed to be one obligation.

Official ONRC CAEN Rev.3 material remains part of the entity pack, but CAEN never substitutes for sector authorization or tax/payment/legal classification.

Current disposition: `SOURCE FAMILY MATERIALLY IMPROVED / ACTUAL MANAGEMENT FACTS + SELLER/VAT/E-FACTURA MATRIX + WRITTEN TAX/ACCOUNTING CONFIRMATION REQUIRED`.

### Marketplace / consumer / DSA / GPSR

The controlled source family covers OUG 34/2014, OUG 18/2026, Law 363/2007, Law 193/2000, Law 365/2002, HG 1308/2002, OG 38/2015, ANPC Order 270/2026, ANPC 2026 online-commerce guidance, DSA, Law 50/2024 and GPSR.

The Romanian Portal/ANPC sources that could not be captured automatically remain honestly `pending_primary_copy`; no bytes/hash/path evidence was invented. The remaining problem is now exact provision-to-actor/surface/transaction/effective-date mapping, final Terms/unfair-practice/SAL/DSA review and tested binding-checkout/withdrawal controls.

The DSA Section 4 classification now also feeds the PPWR Marketplace-platform analysis and therefore cannot be treated as an isolated DSA-only decision.

Current disposition: `MAIN SOURCE DISCOVERY MATERIALLY IMPROVED / EXACT PROVISION-TO-FLOW + TERMS + SAL + DSA SECTION-4 REVIEW PENDING / PUBLIC CHECKOUT DISABLED`.

### Platform-to-business / DAC7 / accessibility / packaging

The source family now goes beyond the first 2026-09-16 discovery pass.

#### P2B

Registered authority includes Regulation (EU) 2019/1150, Romanian OUG 23/2021 and archived Commission Recommendation 2003/361/EC.

Candidate first-pilot facts — online Marketplace, professional merchants, EU consumers, transaction facilitation and a merchant-platform contract — make the service a `LIKELY_IN_SCOPE` P2B candidate. Final classification/current Romanian enforcement review remains pending.

The P2B internal-complaint/mediation small-enterprise exceptions are obligation-specific. The applicable EU SME Recommendation headline small-enterprise test is `<50` persons and `<= EUR 10m` turnover **or** balance-sheet total, with partner/linked-enterprise treatment where required. It is not a blanket P2B exemption and is not the accessibility threshold.

#### DAC7

Current authority chain now includes:

- archived `EU-DIR-2011-16-DAC-CONSOLIDATED-2026-01-01`;
- the original DAC7 amendment source `EU-DIR-2021-514-DAC7`;
- Romanian `RO-OG-16-2023-DAC7`;
- `RO-OUG-71-2025-DAC7-CURRENT-AMENDMENTS` and `RO-OG-1-2026-TAX-PROCEDURE-DAC-CURRENT`, whose official Portal endpoints are registered but controlled primary copies remain pending;
- registered ANAF DAC7 guidance/forms/order family.

The current candidate flow makes DROPi a `LIKELY` Platform Operator candidate for sale of goods, but Reporting Platform Operator status and reporting Member State/registration route remain `NOT_YET_VALIDATED` because the final legal entity/nexus is not fixed.

Professional/company status is not seller exclusion. The goods de-minimis excluded-seller row requires both `<30` facilitated goods activities and `<= EUR 2,000` total consideration in the reporting period. Current Romanian reporting mechanics identify a 31-January following-year reporting policy, retained as versioned legal policy rather than a magic constant.

DAC7-specific mandatory data collection/registration/filing remains disabled until the operator/jurisdiction/seller/purpose matrix is approved.

#### Accessibility

Romanian Law 232/2022 / EAA source discovery now supports a narrower factual state: the candidate consumer Marketplace matches the e-commerce-service category, while the actual operating entity's services exemption remains evidence-dependent.

The headline accessibility microenterprise test is `<10` persons and `<= EUR 2m` turnover **or** balance-sheet total. It must not be confused with the P2B `<50 / EUR 10m` test or Romanian fiscal microenterprise status.

Accessible foundation work remains safe policy/design work even while the statutory exemption is unapproved.

#### Packaging / EPR / PPWR Marketplace duty

Registered authority now includes:

- `EU-REG-2025-40-PPWR`, applicable from 12 August 2026;
- archived official Commission Notice `EU-COM-PPWR-GUIDANCE-C-2026-3702` as non-binding guidance;
- `RO-LAW-249-2015-PACKAGING-CURRENT`;
- `RO-OUG-196-2005-ENVIRONMENT-FUND-CURRENT-2026-09-16` and `RO-LAW-79-2026-ENVIRONMENT-FUND-AMENDMENT`, both registered with current official endpoints and controlled primary copies pending.

Two different legal questions are now modeled separately:

```text
PackagingProducerResponsibilityProfile
PpwrOnlinePlatformVerificationProfile
```

Where the PPWR online-platform rule applies — including the required DSA Section 4 / producer-distance-contract factual scope — DROPi must be able to obtain producer registration information/number and EPR self-certification before producer activation, and support the required `best efforts` completeness/reliability assessment. Merchant-managed fulfilment does not automatically remove this verification question.

That direct platform duty does not automatically make DROPi the packaging producer/EPR-responsible actor. The producer/importer/packing/fulfilment/environmental-fund allocation remains fact-specific.

Hard anti-shortcuts are now:

```text
merchantVerified = true   != P2B complete
merchantIsCompany = true  != DAC7 excluded
smallCompany = true       != accessibility exempt
marketplace = true        != DROPi packaging producer
merchantFulfilment = true != no PPWR platform duty
```

Current disposition:

`P2B LIKELY-IN-SCOPE / P2B FINAL TERMS+SIZE EXCEPTIONS PENDING / DAC7 PLATFORM-OPERATOR CANDIDATE LIKELY / REPORTING OPERATOR+JURISDICTION NOT VALIDATED / ACCESSIBILITY E-COMMERCE SCOPE IDENTIFIED / MICROENTERPRISE EXEMPTION EVIDENCE PENDING / PPWR PLATFORM SCOPE NOT VALIDATED / PACKAGING EPR ACTOR NOT VALIDATED / SAFE FOUNDATION DESIGN ALLOWED / PUBLIC MERCHANT ACTIVATION BLOCKED`.

### Payments

The payment source family is materially expanded beyond the original Law 209/2019 baseline.

Registered source chain includes:

- Romanian Law 209/2019 payment-services baseline already in the corpus;
- `RO-OUG-5-2026-PAYMENTS-AMENDMENT` — 2026 amendment family affecting Law 209/2019; official endpoint registered, controlled copy `pending_primary_copy`;
- `EU-DIR-2015-2366-PSD2-CONSOLIDATED-2025-01-17` — consolidated PSD2 endpoint registered; automated capture did not produce a controlled snapshot, so it remains pending;
- `EU-REG-2018-389-SCA-CONSOLIDATED-2023-09-12` — SCA/secure-communication RTS endpoint registered; controlled copy pending;
- archived EBA Q&A `2020_5354` and `2020_5355`, used as supervisory guidance showing that the e-commerce/commercial-agent exclusion is factual and not an automatic safe harbour;
- archived EBA central payment/e-money register page, explicitly treated only as a discovery/cross-check source because EBA states that the central register itself has no legal significance;
- `RO-LAW-210-2019-EMONEY-CURRENT-2026-03-05` — current Romanian e-money endpoint registered, controlled copy pending and relevant only if a later stored-value/e-money model is proposed.

The first-pilot technical boundary is explicit:

```text
customer -> regulated external PSP/platform product -> merchant proceeds + separately evidenced DROPi fee
DROPi fund custody = false
DROPi stored-value wallet = disabled
DROPi legal escrow claim = disabled
cash/COD = disabled for first pilot
```

Provider shortlist remains PayU Marketplace, NETOPIA Marketplace, Stripe Connect, Adyen for Platforms and Mollie/Connect. No provider is selected. Before selection the exact contracting entity requires competent-NCA authorization/register evidence and, where relevant, EEA/Romania passporting evidence, followed by written provider terms for KYB, SCA, split/funds path, settlement, refund, chargeback, negative balances, reserves, reconciliation and data-processing roles.

Payment movement is deliberately separated from tax/document authority:

```text
provider payout != tax invoice
provider split != seller-of-record decision
PSP settlement report != RO e-Factura compliance
```

Current disposition: `PAYMENT SOURCE DISCOVERY MATERIALLY IMPROVED / PSP NOT SELECTED / PROVIDER AUTHORITY + MONEY FLOW + TAX-INVOICE REVIEW REQUIRED / WALLET DISABLED / LIVE CHARGING DISABLED`.

### Postal / ANCOM

The postal corpus distinguishes the stale archived 2019 ANCOM consolidation from the registered current Portal source for OUG 13/2013, Decision 925/2023 and current ANCOM guidance. The unresolved blocker is no longer broad source discovery; it is controlled current-primary evidence plus the exact factual DROPi process/money/contract map and classification/notification/contract evidence where required.

Current disposition: `MODEL A MERCHANT FULFILMENT FIRST; MODEL B HOLD-CLASSIFICATION; MODEL C HOLD-LEGAL/NOT-AUTHORIZED; MODEL D LATER SERVICE`.

### Product family / zone

A deny-by-default candidate allowlist exists for simple paper stationery/art-print products. The candidate zone remains `BUCHAREST_ILFOV_CONTROLLED_PILOT`, but neither is final merely because it leads the research comparison.

Current disposition: `OWNER DECISION REQUIRED / PRODUCT ACTIVATION DISABLED`.

### Privacy

The privacy source chain includes archived GDPR authority, Romanian Law 190/2018 endpoint, ANSPDCP Decision 174/2018 DPIA list, archived ANSPDCP DPIA guidance and EDPB controller/processor guidance. The national DPIA source-discovery gap is reduced, but the factual DROPi DPIA outcome remains `TBD`.

Exact controller/processor roles, legal bases, retention periods, vendor transfer arrangements and support responsibilities remain unresolved. DAC7 data must become a distinct approved purpose only if/when the reporting-operator/seller applicability decision requires it; no hidden tax-reporting dataset is authorized by source discovery alone.

Current disposition: `DATA ARCHITECTURE DEFINED / RETENTION VALUES TBD / DPIA TBD / PRODUCTION DATA SEMANTICS BLOCKED`.

## Evidence rule

A live official URL, search result or AI/web reading is not an immutable source snapshot by itself. A source may remain `pending_primary_copy`, `metadata_only`, `missing_primary_copy` or `pending_current_validation` until its controlled evidence satisfies the repository validator.

Never invent bytes, hashes, archive paths, effective dates or approval states merely to remove a blocker.

## Promotion rule

A law-dependent implementation row may move toward approval only when the chain is evidenced:

```text
official/current source
+ controlled copy where required
+ exact provision
+ scoped DROPi factual flow
+ qualified interpretation where required
+ Product Owner operating decision
+ implementation and verification evidence
```

Safe foundation code may model versioning, provenance, evidence references and fail-closed gates before all values are approved, but it cannot enable a regulated/public path from an unresolved state.
