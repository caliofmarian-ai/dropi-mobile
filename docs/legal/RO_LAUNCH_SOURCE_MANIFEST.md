# Romania Launch Legal Source Manifest

> **STATUS: PRE-COUNSEL / FAIL-CLOSED**
> **Version:** 0.4.0
> **As of:** 2026-09-15
> **Issue:** #499
> **Parent:** #492
> **Governing canon:** `canonical/LEGAL_COMPLIANCE_SOURCE_OF_TRUTH.md`

This manifest is the launch-focused entry point into the controlled legal corpus for the proposed Romanian MVP. It does not authorize implementation or launch. Source status, provenance, hashes and controlled-copy state remain governed by `docs/legal/legal-source-register.json`.

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
- `docs/legal/RO_LAUNCH_MARKETPLACE_CONTROL_CONTRACT_2026-09-15.md` — merchant capability, OUG 34/2014 disclosures, binding checkout, contract snapshot, withdrawal, DSA applicability and safety/moderation case model.
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

Controlled or identified authority includes the Romanian company/fiscal framework, official ONRC CAEN Rev.3 structure/correspondence and the Ireland–Romania tax treaty/Irish Revenue company-residence guidance used to identify cross-border management risk.

Current disposition: `WRITTEN TAX/ACCOUNTING CONFIRMATION REQUIRED`.

### Marketplace / consumer / DSA / GPSR

Current official endpoints identified/rechecked include:

- OUG 34/2014 current consolidated consumer-contract framework;
- OUG 18/2026 amendments including Article 11^1 online withdrawal effective from 19 June 2026 and relevant later information changes effective from 27 September 2026;
- Regulation (EU) 2022/2065 DSA;
- Law 50/2024 Romanian DSA application framework, including the Article 5 information path for Romanian intermediary-service providers where applicable;
- Regulation (EU) 2023/988 GPSR, consolidated 2026-05-29.

Current disposition: `CONTROL CONTRACTS DEFINED / APPLICABILITY AND FINAL WORDING REVIEW PENDING`.

### Payments

Current official Romanian baseline includes Law 209/2019. Provider-owned evidence now identifies a real Marketplace shortlist (PayU, NETOPIA, Stripe Connect, Adyen for Platforms and Mollie/Connect), but exact provider, money flow, supplier, settlement, refund, chargeback, negative balance and invoicing treatment remain unresolved.

Current disposition: `PSP SHORTLIST IDENTIFIED / PROVIDER NOT SELECTED / PAYMENT PERIMETER REVIEW REQUIRED`.

### Postal / ANCOM

Current controlled material includes Decision 925/2023 and time-stamped ANCOM authorization guidance. Current ANCOM resale guidance has been reconciled into a role contract, but the old controlled OUG 13/2013 consolidation remains stale and current controlled-copy/applicability work is not complete.

Current disposition: `MODEL A MERCHANT FULFILMENT FIRST; MODELS B-C HOLD-LEGAL; MODEL D LATER SERVICE`.

### Product family / zone

A deny-by-default candidate allowlist now exists for simple paper stationery/art-print products. The candidate zone remains `BUCHAREST_ILFOV_CONTROLLED_PILOT`, but neither the family nor zone is treated as the final Product Owner decision merely because it leads the research comparison.

Current disposition: `OWNER DECISION REQUIRED / PRODUCT ACTIVATION DISABLED`.

### Privacy

GDPR is already archived in the controlled corpus; Romanian Law 190/2018 official endpoint is registered pending controlled-copy completion. EDPB Guidelines 07/2020 support the factual flow-by-flow controller/processor approach. Exact roles, legal bases, retention periods, DPIA outcome and vendor transfer arrangements remain unresolved.

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
