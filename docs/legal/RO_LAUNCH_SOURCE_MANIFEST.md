# Romania Launch Legal Source Manifest

> **STATUS: PRE-COUNSEL / FAIL-CLOSED**
> **Version:** 0.3.0
> **As of:** 2026-09-15
> **Issue:** #499
> **Parent:** #492
> **Governing canon:** `canonical/LEGAL_COMPLIANCE_SOURCE_OF_TRUTH.md`

This manifest is the launch-focused entry point into the controlled legal corpus for the proposed Romanian MVP. It does not authorize implementation or launch. Source status, provenance, hashes and controlled-copy state remain governed by `docs/legal/legal-source-register.json`.

## Launch corpus documents

- `docs/legal/legal-source-register.json` — authoritative source inventory and controlled-copy state.
- `docs/legal/LEGAL_REQUIREMENTS_TRACEABILITY.md` — canonical provisional requirement/control matrix.
- `docs/legal/LEGAL_GAPS_AND_BLOCKERS.md` — explicit legal/source blockers.
- `docs/legal/RO_LAUNCH_REQUIREMENTS_TRACEABILITY.md` — launch-focused staging matrix retained as a review aid; canonical rows are now also integrated into the main traceability matrix.
- `docs/legal/RO_LAUNCH_DECISION_REGISTER_2026-09-15.md` — consolidated #493–#499 launch decisions, candidate operating boundaries and unresolved evidence.
- `docs/research/RO_LAUNCH_007_OFFICIAL_SOURCE_FINDINGS_2026-09-15.md` — time-stamped official-endpoint findings.
- `docs/research/RO_LAUNCH_007_QUALIFIED_REVIEW_PACKET.md` — bounded questions for Romanian/EU legal, tax/accounting, payment, postal, privacy and product-safety review.

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
- OUG 18/2026 amendments including the online withdrawal function and later 2026 information changes;
- Regulation (EU) 2022/2065 DSA;
- Law 50/2024 Romanian DSA application framework;
- Regulation (EU) 2023/988 GPSR, consolidated 2026-05-29.

Current disposition: `CURRENT SOURCE / APPLICABILITY REVIEW PENDING`.

### Payments

Current official Romanian baseline includes Law 209/2019. Exact PSP/provider, money flow, supplier, settlement, refund, chargeback and invoicing treatment are unresolved.

Current disposition: `PSP NOT SELECTED / PAYMENT PERIMETER REVIEW REQUIRED`.

### Postal / ANCOM

Current controlled material includes Decision 925/2023 and time-stamped ANCOM authorization guidance. Current Legislative Portal / ANCOM resale endpoints have been identified, but the old controlled OUG 13/2013 consolidation remains stale and current controlled-copy/applicability work is not complete.

Current disposition: `MERCHANT FULFILMENT FIRST HYPOTHESIS; POSTAL RESALE HOLD-LEGAL`.

### Privacy

GDPR is already archived in the controlled corpus; Romanian Law 190/2018 official endpoint is registered pending controlled-copy completion. Exact controller/processor roles, legal bases, retention periods, deletion/legal hold, DPIA and vendor transfer controls remain unresolved.

Current disposition: `PRE-DPIA / WRITTEN PRIVACY REVIEW REQUIRED`.

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

Until then, affected product behavior remains configurable and fail-closed.
