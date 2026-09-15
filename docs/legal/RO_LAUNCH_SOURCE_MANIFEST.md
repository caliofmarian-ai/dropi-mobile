# Romania Launch Legal Source Manifest

> **STATUS: PRE-COUNSEL / FAIL-CLOSED**
> **Version:** 0.9.0
> **As of:** 2026-09-15
> **Issue:** #499
> **Parent:** #492
> **Governing canon:** `canonical/LEGAL_COMPLIANCE_SOURCE_OF_TRUTH.md`

This manifest is the launch-focused entry point into the controlled legal corpus for the proposed Romanian MVP. It does not authorize implementation or launch. Source status, provenance, hashes and controlled-copy state remain governed by `docs/legal/legal-source-register.json`.

Current validator baseline: `67 records / 30 immutable files`.

## Launch corpus documents

### Source / authority layer

- `docs/legal/legal-source-register.json` — authoritative source inventory and controlled-copy state.
- `docs/legal/LEGAL_REQUIREMENTS_TRACEABILITY.md` — canonical provisional requirement/control matrix.
- `docs/legal/LEGAL_GAPS_AND_BLOCKERS.md` — explicit legal/source blockers.
- `docs/legal/RO_LAUNCH_REQUIREMENTS_TRACEABILITY.md` — launch-focused staging matrix retained as a review aid; canonical rows are now also integrated into the main traceability matrix.
- `docs/research/RO_LAUNCH_007_OFFICIAL_SOURCE_FINDINGS_2026-09-15.md` — time-stamped official-endpoint findings.
- `docs/research/RO_LAUNCH_007_QUALIFIED_REVIEW_PACKET.md` — bounded questions for Romanian/EU legal, tax/accounting, payment, postal, privacy and product-safety review.

### Consolidated decision/control layer

- `docs/legal/RO_LAUNCH_DECISION_REGISTER_2026-09-15.md` — consolidated #493–#499 launch decisions, candidate operating boundaries and unresolved evidence.
- `docs/legal/RO_LAUNCH_MARKETPLACE_CONTROL_CONTRACT_2026-09-15.md` — merchant capability, consumer presentation, OUG 34/2014 disclosures, Law 363/2007 unfair-practice controls, Law 193/2000 Terms review, SAL/ADR information, binding checkout, withdrawal, DSA applicability and safety/moderation case model.
- `docs/legal/RO_LAUNCH_PRODUCT_ALLOWLIST_GPSR_CONTRACT_2026-09-15.md` — deny-by-default first-family allowlist, exclusions and GPSR listing/safety gate.
- `docs/research/RO_LAUNCH_003_PSP_CANDIDATE_MATRIX_2026-09-15.md` — provider-owned evidence and written questionnaire for PayU/NETOPIA/Stripe/Adyen/Mollie candidates; no provider selected.
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
-> merchant fulfilment first
-> optional postal resale only after ANCOM classification/notification/contracts
-> restricted Romanian pilot geography
```

Excluded from the first launch: P2P/private sellers, food and deliberately higher-risk product families, proprietary DROPi courier fleet, Passenger Mobility, drone delivery, Cooperative Hub implementation, C2, C3, internal customer wallet/stored value and token/crypto settlement.

## Current launch-critical source families

### Entity / tax / CAEN

The entity/tax source chain now includes controlled copies of:

- Irish Revenue company-residency guidance (`IE-REVENUE-COMPANY-RESIDENCY-2026-09-15`);
- the original Ireland–Romania Double Taxation Convention legal order, S.I. No. 427/1999 (`IE-RO-DTA-SI-427-1999`);
- Ireland's MLI implementing order, S.I. No. 440/2018 (`IE-MLI-SI-440-2018`);
- Irish Revenue's synthesised MLI + Ireland–Romania Convention (`IE-RO-DTA-MLI-SYNTHESISED-2026-09-15`), explicitly recorded as official explanatory guidance and not itself a source of law;
- ANAF's guide on Romanian tax residence of foreign legal persons (`RO-ANAF-FOREIGN-LEGAL-RESIDENCE-GUIDE-2025`).

The previous shorthand that the Ireland–Romania treaty always resolves dual residence solely by `place of effective management` is superseded. Under the post-MLI treaty position reflected in Revenue's official synthesis, a dual-resident non-individual is subject to a competent-authority mutual-agreement determination having regard to place of effective management, place of incorporation/constitution and other relevant factors. Actual DROPi management facts therefore require professional cross-border tax analysis; Romanian incorporation alone does not settle the issue, and `place of effective management` is not an automatic post-MLI tie-breaker by itself.

The Romanian invoicing source chain additionally registers:

- `RO-OUG-120-2021-EFACTURA-CURRENT-2026-09-15` — current consolidated RO e-Factura framework;
- `RO-LAW-88-2026-EFACTURA` — 2026 amendments affecting B2C/register rules.

Both Romanian Legislative Portal endpoints were verified but refused the automated controlled-byte fetch, so they remain `pending_primary_copy`; no archive path/hash was fabricated. Their application remains `pending_current_validation` and must be derived per actual supplier, transaction and VAT/fiscal facts. A merchant-product invoice, DROPi platform-fee invoice and any future postal-service invoice are not assumed to be one invoice obligation.

Official ONRC CAEN Rev.3 structure/correspondence remains part of the entity pack, including candidate activity/intermediation classes, but a CAEN code never substitutes for sector authorization or tax/payment/legal classification.

Current disposition: `SOURCE FAMILY MATERIALLY IMPROVED / ACTUAL MANAGEMENT FACTS + SELLER/VAT/E-FACTURA MATRIX + WRITTEN TAX/ACCOUNTING CONFIRMATION REQUIRED`.

### Marketplace / consumer / DSA / GPSR

The controlled source family now covers the main identified Romanian consumer/Marketplace layers:

- OUG 34/2014 current consolidated consumer-contract framework;
- OUG 18/2026 amendments, including the already-effective Article 11^1 online withdrawal function from 19 June 2026 and separate provisions with a 27 September 2026 effective boundary;
- `RO-LAW-363-2007-CONSOLIDATED-2026-03-27` — current unfair-commercial-practices / online-marketplace consumer baseline;
- `RO-LAW-193-2000-REPUBLISHED` — unfair terms in professional-consumer contracts;
- Law 365/2002, republicated, electronic-commerce / information-society-service baseline;
- HG 1308/2002 methodological norms for Law 365/2002, separately gated because historical payment references require reconciliation with the current payment-services framework;
- `RO-OG-38-2015-ADR-CURRENT` — alternative consumer dispute-resolution baseline;
- `RO-ANPC-ORDER-270-2026-ADR` — 2026 ANPC SAL information/display changes;
- `RO-ANPC-ONLINE-COMMERCE-GUIDE-2026` — official ANPC 2026 online-commerce guidance, classified as non-normative `research_only` because ANPC states the guide is orientative/informative and does not replace law;
- Regulation (EU) 2022/2065 DSA;
- Law 50/2024 Romanian DSA application framework, including the Article 5 information path for Romanian intermediary-service providers where applicable;
- Regulation (EU) 2023/988 GPSR, consolidated 2026-05-29.

The five newly registered consumer-commerce sources — Law 363/2007, Law 193/2000, OG 38/2015, ANPC Order 270/2026 and the ANPC 2026 online-commerce guide — all refused automated retrieval from GitHub Actions. Their official endpoints remain registered and their controlled-copy state remains `pending_primary_copy`; no bytes, hashes or archive files were fabricated.

This source expansion changes the remaining problem from broad discovery to an exact implementation/applicability exercise:

```text
provision -> actor -> surface -> transaction state -> effective date -> technical control -> evidence -> qualified approval
```

In particular, future-effective provisions visible in a consolidated source must not be enabled before their legal effective date. Law 193/2000 requires a final Terms/unfair-terms review; Law 363/2007 requires a presentation/marketing/ranking applicability review; OG 38/2015 + ANPC Order 270/2026 require a channel/surface SAL applicability decision. None of those reviews is replaced by the ANPC guidance document.

Current disposition: `MAIN SOURCE DISCOVERY MATERIALLY IMPROVED / EXACT PROVISION-TO-FLOW + TERMS + SAL + DSA REVIEW PENDING / PUBLIC CHECKOUT DISABLED`.

### Payments

Current official Romanian baseline includes Law 209/2019. Provider-owned evidence identifies a real Marketplace shortlist (PayU, NETOPIA, Stripe Connect, Adyen for Platforms and Mollie/Connect), but exact provider, money flow, supplier, settlement, refund, chargeback, negative balance and invoicing treatment remain unresolved.

Current disposition: `PSP SHORTLIST IDENTIFIED / PROVIDER NOT SELECTED / PAYMENT PERIMETER REVIEW REQUIRED`.

### Postal / ANCOM

The postal corpus distinguishes historical evidence from the current source chain:

- the archived ANCOM copy of OUG 13/2013 consolidated only through 2019 remains historical evidence and is explicitly non-authoritative for current-law reliance by itself;
- `RO-OUG-13-2013-PORTAL-2026-09-15` registers the official Romanian Legislative Portal source as `primary_normative`, with controlled bytes/hash still `pending_primary_copy` and DROPi applicability still `pending_current_validation`;
- Decision 925/2023 is archived as the current general-authorization baseline;
- time-stamped ANCOM general-authorization guidance and current digital postal-reseller guidance are registered separately;
- current ANCOM guidance identifies OUG 13/2013, as amended, together with Decision 925/2023 as the principal framework and states that offering, reselling or providing postal services requires a legally complete notification before the right exists.

The unresolved blocker is therefore no longer discovery of OUG 13/2013. It is controlled current-primary evidence plus the exact factual DROPi process map, legal/authority classification of that flow, and notification/contract evidence where the classified role requires it.

Current disposition: `MODEL A MERCHANT FULFILMENT FIRST; MODEL B HOLD-CLASSIFICATION; MODEL C HOLD-LEGAL/NOT-AUTHORIZED; MODEL D LATER SERVICE`.

### Product family / zone

A deny-by-default candidate allowlist exists for simple paper stationery/art-print products. The candidate zone remains `BUCHAREST_ILFOV_CONTROLLED_PILOT`, but neither the family nor zone is treated as the final Product Owner decision merely because it leads the research comparison.

Current disposition: `OWNER DECISION REQUIRED / PRODUCT ACTIVATION DISABLED`.

### Privacy

The privacy source chain includes:

- archived GDPR authority in the controlled corpus;
- Romanian Law 190/2018 official Legislative Portal endpoint, still pending controlled-copy completion;
- `RO-ANSPDCP-DECISION-174-2018-DPIA`, the official Romanian supervisory-authority DPIA list, registered as primary normative authority with its controlled byte copy still `pending_primary_copy` and activity-specific applicability still `pending_current_validation`;
- `RO-ANSPDCP-DPIA-GUIDANCE-2026-09-15`, official ANSPDCP DPIA guidance archived as a controlled snapshot;
- EDPB Guidelines 07/2020 supporting factual, flow-by-flow controller/processor classification.

The national DPIA source-discovery gap is reduced, but the actual DROPi DPIA outcome remains `TBD`. Each processing activity must be checked against GDPR Article 35 and ANSPDCP Decision 174/2018; exclusion of later high-risk features does not by itself prove that the first pilot does not require a DPIA.

Exact controller/processor roles, legal bases, retention periods, DPIA determination, vendor transfer arrangements and support responsibilities remain unresolved.

Current disposition: `DATA ARCHITECTURE DEFINED / RETENTION VALUES TBD / DPIA TBD / PRODUCTION DATA SEMANTICS BLOCKED`.

## Evidence rule

A live official URL, search result or AI/web reading is not an immutable source snapshot by itself. A source may be recorded as `pending_primary_copy`, `metadata_only`, `missing_primary_copy` or `pending_current_validation` until its controlled evidence satisfies the repository validator.

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
