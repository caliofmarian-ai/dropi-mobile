# Romania Launch Requirements Traceability — Pre-Integration Matrix

> **STATUS: PRE-COUNSEL / FAIL-CLOSED**
> **Version:** 0.1.0
> **As of:** 2026-09-15
> **Issue:** #499
> **Parent:** #492
> **Target canonical matrix:** `docs/legal/LEGAL_REQUIREMENTS_TRACEABILITY.md`

This file is a launch-focused staging matrix. It exists so #499 can derive exact product controls without silently promoting web research into canonical approved requirements.

Rows may be integrated into `LEGAL_REQUIREMENTS_TRACEABILITY.md` only after the referenced source IDs are registered/captured consistently with `legal-source-register.json`.

States:

- `current_source_pending` — official source identified but controlled source/version work remains;
- `written_confirmation_required` — application to the exact DROPi factual flow requires qualified interpretation/authority confirmation;
- `policy_only` — deliberate DROPi launch restriction, not represented as a statutory duty;
- `approved` — reserved; no row below is approved.

## A. First-launch scope policy

| Requirement ID | Basis | Provisional requirement | Product/control implication | State |
|---|---|---|---|---|
| `RO-LAUNCH-SCOPE-001` | Owner launch hypothesis + legal-risk reduction | First launch is restricted to verified professional merchants and a closed low-complexity non-food allowlist | No private/P2P seller activation; category allowlist is deny-by-default | `policy_only` |
| `RO-LAUNCH-SCOPE-002` | Owner launch hypothesis + #495 perimeter | First launch uses an eligible external PSP and does not intentionally hold/safeguard customer funds or issue stored value | No DROPi wallet/escrow product claim; provider abstraction + reconciliation only | `policy_only` |
| `RO-LAUNCH-SCOPE-003` | Owner launch hypothesis + postal gating | Merchant fulfilment may precede integrated DROPi postal resale; own courier network is later | Fulfilment role is explicit per order; no universal `deliveryEnabled` | `policy_only` |

## B. Marketplace / consumer contracts

| Requirement ID | Pending/controlled source | Exact provisional requirement | Product/control implication | State |
|---|---|---|---|---|
| `RO-MKT-001` | `RO-OUG-34-2014-CURRENT` Art. 6^1 | Before a Marketplace offer/contract becomes binding, show main ranking parameters and their relative importance in the legally required manner | Search/ranking disclosure surface, versioned ranking-policy evidence | `current_source_pending` |
| `RO-MKT-002` | `RO-OUG-34-2014-CURRENT` Art. 6^1 | Disclose whether the third-party seller is a professional | Seller legal-status field must be verified/declared and rendered before binding order | `current_source_pending` |
| `RO-MKT-003` | `RO-OUG-34-2014-CURRENT` Art. 6^1 | Where applicable, disclose allocation of contract-related obligations between seller and Marketplace provider without misrepresenting statutory responsibility | Versioned responsibility allocation surfaced pre-contract | `current_source_pending` |
| `RO-MKT-004` | `RO-OUG-18-2026`; OUG 34/2014 Art. 11^1 | For covered online distance contracts, provide persistent, visible, unambiguous online withdrawal and confirmation functions and send durable-medium acknowledgement with content/date/time | Order detail contains withdrawal action; immutable withdrawal receipt/audit event; durable acknowledgement channel | `current_source_pending` |
| `RO-MKT-005` | `RO-OUG-18-2026`; OUG 34/2014 effective post-2026 amendments | Checkout and product information must be designed against the provisions applicable at actual launch, including relevant durability/repairability and immediate-pre-order disclosure rules | Legal pack version/date gates checkout fields; no frozen 2025-era checkout schema | `current_source_pending` |
| `RO-MKT-006` | OUG 34/2014 + professional review | Determine who performs each withdrawal, conformity, complaint and refund duty where merchant is seller of record and DROPi supplies the interface | Responsibility state machine and support routing cannot be approved from UX preference | `written_confirmation_required` |

## C. DSA / intermediary-service controls

| Requirement ID | Pending/controlled source | Exact provisional requirement | Product/control implication | State |
|---|---|---|---|---|
| `RO-DSA-001` | `EU-REG-2022-2065-DSA`, `RO-LAW-50-2024` | Determine DROPi's exact intermediary/hosting/online-platform/Marketplace classification for each first-launch function | Store service classification and applicable legal pack; no global DSA boolean | `written_confirmation_required` |
| `RO-DSA-002` | DSA Art. 19 and 29 | Determine and periodically revalidate whether the operating entity qualifies for micro/small exclusions and whether any transition/VLOP exception applies | Enterprise-size evidence + effective/review dates + obligation-set selector | `written_confirmation_required` |
| `RO-DSA-003` | DSA Art. 29/30 | Do not label Article 30 trader traceability as universally mandatory if Section 4 is excluded for the entity; distinguish statutory fields from stricter DROPi professional-merchant policy | Merchant-KYB field provenance: `law_required` vs `dropi_policy` vs `provider_required` | `current_source_pending` |

## D. GPSR / product safety

| Requirement ID | Pending/controlled source | Exact provisional requirement | Product/control implication | State |
|---|---|---|---|---|
| `RO-GPSR-001` | `EU-REG-2023-988-GPSR`, Art. 22 | Marketplace requires a product-safety authority contact point and Safety Gate registration when within scope | Activation gate includes registration/contact evidence | `current_source_pending` |
| `RO-GPSR-002` | GPSR Art. 22 | Marketplace requires a consumer product-safety contact point and internal product-safety processes | Dedicated safety-report route and case state machine | `current_source_pending` |
| `RO-GPSR-003` | GPSR Art. 22 | Product-safety notices must be processed within the applicable Article 22 timeframe, including the three-working-day rule for notices under the referenced framework | Timed safety queue, SLA evidence, escalation and audit | `current_source_pending` |
| `RO-GPSR-004` | GPSR Art. 22 | Listing interface must enable required product/economic-operator/safety information to be supplied and displayed/accessed | Category-aware mandatory listing schema; listing publish gate | `current_source_pending` |
| `RO-GPSR-005` | GPSR + category-specific sources | Exact paper-goods allowlist/exclusions and sector-specific material/labelling requirements must be fixed before public catalog activation | Category pack controls schema and publishability | `written_confirmation_required` |

## E. Payments / money flow

| Requirement ID | Pending/controlled source | Exact provisional requirement | Product/control implication | State |
|---|---|---|---|---|
| `RO-PAY-001` | `RO-LAW-209-2019-CURRENT` + PSD2/EBA | Determine payment-service perimeter for the selected factual money flow | No live charging until PSP/perimeter decision is approved | `written_confirmation_required` |
| `RO-PAY-002` | #495 launch policy | Do not intentionally take custody/safeguard customer funds or issue stored value in first launch | PSP owns regulated money movement; DROPi stores provider refs/reconciliation evidence | `policy_only` |
| `RO-PAY-003` | selected PSP + accountant/legal review | Determine supplier, fee allocation, settlement, refund, chargeback, negative-balance and invoice treatment for goods/platform/postal components | Versioned money-flow and invoice matrix drives ledger/refund implementation | `written_confirmation_required` |

## F. Postal role / ANCOM

| Requirement ID | Pending/controlled source | Exact provisional requirement | Product/control implication | State |
|---|---|---|---|---|
| `RO-POST-001` | current OUG 13/2013 + Decision 925/2023 + ANCOM current procedure | Offering, resale and provision roles must be classified before activation; any notification obligation follows factual activity, not UI label/CAEN label | Service-role gate bound to entity and legal pack | `written_confirmation_required` |
| `RO-POST-002` | ANCOM current authorization guidance | If DROPi operates as postal reseller, effective provision requires written commercial resale contract(s) with postal provider(s) and DROPi remains responsible to users for the resold service under the ANCOM-described model | Resale contract registry, provider authority evidence, customer terms, claims/complaint ownership | `current_source_pending` |
| `RO-POST-003` | ANCOM digital-platform resale guidance | Postal-resale platform must clearly identify that effective service is performed by postal provider(s) and identify at least the collecting provider | Checkout/order/tracking surfaces expose effective provider identity | `current_source_pending` |
| `RO-POST-004` | ANCOM procedure | Notification/authority evidence must exist before the integrated postal role is enabled when notification is required | Fail-closed company-service capability gate | `current_source_pending` |
| `RO-POST-005` | owner launch policy | Merchant fulfilment, carrier intermediation, postal resale and later own provision remain distinct product states | Separate API/domain enums and contract families; no ambiguous `delivery` role | `policy_only` |

## G. CAEN / activity classification

| Requirement ID | Pending/controlled source | Exact provisional requirement | Product/control implication | State |
|---|---|---|---|---|
| `RO-CAEN-LAUNCH-001` | official ONRC CAEN Rev.3 structure | Candidate Marketplace intermediation classes include `4791`/`4792`; candidate postal provision/intermediation classes include `5320`/`5330` | Entity activity list is role-specific and versioned | `current_source_pending` |
| `RO-CAEN-LAUNCH-002` | ONRC correspondence + ANCOM | `5330` describes intermediation without the intermediary providing postal/courier service; do not use CAEN alone to reclassify factual resale/provision | Regulatory role is independently derived from factual flow | `written_confirmation_required` |

## H. Privacy / data

| Requirement ID | Pending/controlled source | Exact provisional requirement | Product/control implication | State |
|---|---|---|---|---|
| `RO-DATA-001` | `EU-GDPR-2016-679`, `RO-LAW-190-2018-CURRENT` | Map controller/processor/independent-controller role per flow among DROPi, merchant, PSP, carrier and infrastructure vendors | Data-flow role registry; agreement and access selection by flow | `written_confirmation_required` |
| `RO-DATA-002` | GDPR + Romanian/EDPB guidance | Purpose/legal basis and retention/legal-hold rules must be determined separately for account, merchant verification, order, tax, PSP, postal, withdrawal, complaint, DSA/GPSR, support and marketing data | No one-size privacy purpose/retention or universal consent checkbox | `written_confirmation_required` |
| `RO-DATA-003` | GDPR + qualified review | Determine DPIA need and breach/rights ownership for first pilot | DPIA decision record, incident routing, deletion/restriction/legal-hold state machine | `written_confirmation_required` |

## I. Promotion rule

No row in this staging matrix authorizes implementation or launch by itself.

Canonical promotion requires:

```text
registered controlled source
+ exact provision
+ scoped factual DROPi flow
+ qualified interpretation where required
+ owner operating decision
+ canonical traceability integration
= candidate for approved_for_design
```

Until then, law-dependent code must either remain configurable/fail-closed or be explicitly marked as non-production prototype behavior.