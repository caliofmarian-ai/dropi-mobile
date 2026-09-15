import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve("docs/legal/LEGAL_REQUIREMENTS_TRACEABILITY.md");
let text = readFileSync(path, "utf8");
const marker = "## 8. Romania — first-launch Marketplace, payments, postal resale and privacy";

if (text.includes(marker)) {
  console.log("Romania launch traceability section already present.");
  process.exit(0);
}

text = text
  .replace("**Version:** 1.0.0", "**Version:** 1.1.0")
  .replace("**Research cut-off:** 2026-09-12", "**Research cut-off:** 2026-09-15");

const section = `

${marker}

This section narrows the Romanian legal MVP before #500 backlog reconciliation. None of these rows is an authorization. The first-launch operating hypothesis is deliberately narrower than the complete DROPi capability catalog.

### 8.1 Launch-scope policy

| Requirement ID | Source IDs | Provisional requirement | Product/control implication | State |
|---|---|---|---|---|
| \`RO-LAUNCH-SCOPE-001\` | Owner launch decision + legal-risk reduction | First public pilot is restricted to verified professional merchants and a closed low-complexity non-food allowlist | Private/P2P sellers and unapproved product categories remain disabled by default | \`policy_only\` |
| \`RO-LAUNCH-SCOPE-002\` | \`RO-LAW-209-2019-CURRENT\` plus pending PSP review | First launch uses an eligible external PSP and does not intentionally hold/safeguard customer funds or issue stored value | No DROPi wallet/escrow claim; provider abstraction, payment references, fees, refunds and reconciliation only | \`policy_only\` |
| \`RO-LAUNCH-SCOPE-003\` | Postal sources below + owner launch decision | Merchant fulfilment may precede integrated DROPi postal resale; own delivery network is a later authorization layer | Fulfilment role is explicit per order; no universal \`deliveryEnabled\` flag | \`policy_only\` |

### 8.2 Marketplace and Romanian consumer-contract controls

| Requirement ID | Source IDs | Provisional requirement | Gate and implementation consequence | State |
|---|---|---|---|---|
| \`RO-MKT-001\` | \`RO-OUG-34-2014-CURRENT\` Art. 6^1 | Before a Marketplace offer/contract becomes binding, provide the legally required information on main ranking parameters and relative importance | Search/ranking policy must be versioned and surfaced through the applicable pre-contract UI | \`current_source_pending\` |
| \`RO-MKT-002\` | \`RO-OUG-34-2014-CURRENT\` Art. 6^1 | Disclose whether the third-party seller is a professional | Merchant legal status must be represented and rendered before binding order; first-launch policy admits professionals only | \`current_source_pending\` |
| \`RO-MKT-003\` | \`RO-OUG-34-2014-CURRENT\` Art. 6^1 | Where applicable, disclose how contract-related obligations are shared between seller and Marketplace provider without misrepresenting statutory responsibility | Versioned seller/DROPi responsibility allocation is required before binding checkout | \`current_source_pending\` |
| \`RO-MKT-004\` | \`RO-OUG-18-2026\`; \`RO-OUG-34-2014-CURRENT\` Art. 11^1 | For covered online distance contracts, provide the required visible online withdrawal function, unambiguous confirmation and durable acknowledgement containing withdrawal content and date/time | Withdrawal becomes an auditable order-state action, not a later support-only feature | \`current_source_pending\` |
| \`RO-MKT-005\` | \`RO-OUG-18-2026\`; \`RO-OUG-34-2014-CURRENT\` | Product information and checkout must be designed against provisions applicable at actual launch, including 2026 amendments applicable from 19 June and 27 September as relevant | Legal-pack version/effective date gates checkout and product-information schema | \`current_source_pending\` |
| \`RO-MKT-006\` | Same + qualified Romanian consumer/e-commerce review | Determine exactly who performs withdrawal, conformity, complaint and refund duties when merchant is seller of record and DROPi supplies the interface | Support/responsibility state machine cannot be inferred from preferred UX | \`written_confirmation_required\` |

### 8.3 DSA classification and small-enterprise scope

| Requirement ID | Source IDs | Provisional requirement | Gate and implementation consequence | State |
|---|---|---|---|---|
| \`RO-DSA-001\` | \`EU-REG-2022-2065-DSA\`, \`RO-LAW-50-2024\` | Classify each first-launch DROPi function under the DSA intermediary/hosting/online-platform/Marketplace framework | Store service classification and applicable legal pack; no global \`dsaCompliant\` boolean | \`written_confirmation_required\` |
| \`RO-DSA-002\` | \`EU-REG-2022-2065-DSA\` Arts. 19 and 29 | Determine and periodically revalidate whether the operating entity qualifies for the relevant micro/small exclusions and whether a transition or VLOP exception applies | Enterprise-size evidence and effective/review dates select the applicable obligation set | \`written_confirmation_required\` |
| \`RO-DSA-003\` | \`EU-REG-2022-2065-DSA\` Arts. 29-30 | Do not represent Article 30 trader traceability as universally mandatory where Section 4 is excluded; distinguish law-required fields from stricter DROPi professional-merchant policy | Merchant-verification fields carry provenance such as law/policy/provider requirement | \`current_source_pending\` |

### 8.4 GPSR / product-safety Marketplace controls

| Requirement ID | Source IDs | Provisional requirement | Gate and implementation consequence | State |
|---|---|---|---|---|
| \`RO-GPSR-001\` | \`EU-REG-2023-988-GPSR-CONSOLIDATED-2026-05-29\` Art. 22 | Implement the applicable Marketplace product-safety authority contact and Safety Gate registration obligations | Public product activation requires scoped registration/contact evidence where applicable | \`current_source_pending\` |
| \`RO-GPSR-002\` | Same | Implement consumer product-safety contact and internal product-safety processes | Dedicated safety-report intake, case state and escalation evidence | \`current_source_pending\` |
| \`RO-GPSR-003\` | Same | Handle product-safety notices/orders within the applicable statutory timeframes, including Article 22's three-working-day notice framework where applicable | Timed safety queue, SLA evidence, escalation and immutable audit | \`current_source_pending\` |
| \`RO-GPSR-004\` | Same | Listing interface must enable required product/economic-operator/safety information to be supplied and displayed/accessed | Category-aware mandatory listing fields and publish gate | \`current_source_pending\` |
| \`RO-GPSR-005\` | Same + category-specific sources | Fix the exact first-launch paper/stationery/art-print allowlist and exclusions before public catalog activation | Category compliance pack controls what can be listed | \`written_confirmation_required\` |

### 8.5 Payment perimeter and money flow

| Requirement ID | Source IDs | Provisional requirement | Gate and implementation consequence | State |
|---|---|---|---|---|
| \`RO-PAY-001\` | \`RO-LAW-209-2019-CURRENT\` plus PSD2/EBA/current PSP evidence pending | Determine the payment-service perimeter for the exact factual money flow | No live charging until the selected PSP architecture and legal perimeter are approved | \`written_confirmation_required\` |
| \`RO-PAY-002\` | First-launch policy derived from #495 | DROPi does not intentionally take custody/safeguard customer funds or issue stored value in the first launch | Regulated PSP moves funds; DROPi stores provider references, allocation and reconciliation evidence | \`policy_only\` |
| \`RO-PAY-003\` | Selected PSP + Romanian accountant/payment review | Determine supplier, platform fee, postal fee, settlement, refund, chargeback, negative-balance and invoice treatment | Versioned money-flow/invoice matrix drives ledger and refund implementation | \`written_confirmation_required\` |

### 8.6 Postal resale / ANCOM role

| Requirement ID | Source IDs | Provisional requirement | Gate and implementation consequence | State |
|---|---|---|---|---|
| \`RO-POST-001\` | \`RO-OUG-13-2013-PORTAL-2026-09-15\`, \`RO-ANCOM-DECISION-925-2023\`, \`RO-ANCOM-GENERAL-AUTHORIZATION-2026-09-12\` | Classify offering, resale, provision and technical/intermediation roles from the factual end-to-end flow before activation | Legal role is bound to entity, contracts and service flow; UI or CAEN label cannot decide it | \`written_confirmation_required\` |
| \`RO-POST-002\` | \`RO-ANCOM-DIGITAL-POSTAL-RESELLERS-2026-09-15\`, \`RO-ANCOM-DECISION-925-2023\` | If DROPi acts as postal reseller, establish the required commercial relationship with effective postal provider(s) and allocate reseller responsibility correctly | Contract registry, provider authority evidence, customer terms and complaint/claim ownership are activation evidence | \`current_source_pending\` |
| \`RO-POST-003\` | \`RO-ANCOM-DIGITAL-POSTAL-RESELLERS-2026-09-15\` | A postal-resale platform must disclose that effective performance is by postal provider(s) and identify at least the collecting provider as required by current ANCOM guidance | Checkout/order/tracking exposes effective provider identity | \`current_source_pending\` |
| \`RO-POST-004\` | \`RO-OUG-13-2013-PORTAL-2026-09-15\`, \`RO-ANCOM-GENERAL-AUTHORIZATION-2026-09-12\` | Required notification/authority evidence must exist before the relevant postal role is enabled | Fail-closed company/service capability gate | \`current_source_pending\` |
| \`RO-POST-005\` | Owner launch policy | Merchant fulfilment, carrier intermediation, postal resale and later own postal provision remain distinct operating states | Separate domain/API roles and contract families; no ambiguous generic delivery authorization | \`policy_only\` |

### 8.7 CAEN role evidence

| Requirement ID | Source IDs | Provisional requirement | Gate and implementation consequence | State |
|---|---|---|---|---|
| \`RO-CAEN-LAUNCH-001\` | \`RO-ONRC-CAEN-REV3-2026-09-15\` | Candidate launch activity mapping must distinguish Marketplace/intermediation classes \`4791\`/\`4792\` and postal provision/intermediation classes \`5320\`/\`5330\` according to the actual business flow | Entity activity set is role-specific and versioned; accountant/ONRC confirmation remains required | \`current_source_pending\` |
| \`RO-CAEN-LAUNCH-002\` | \`RO-ONRC-CAEN-REV2-REV3-CORRESPONDENCE-2026-09-15\` + ANCOM sources | ONRC describes \`5330\` as intermediation without the intermediary itself providing postal/courier service; CAEN cannot reclassify factual postal resale/provision | Sector role is independently derived and reviewed | \`written_confirmation_required\` |

### 8.8 Romania-launch privacy and data roles

| Requirement ID | Source IDs | Provisional requirement | Gate and implementation consequence | State |
|---|---|---|---|---|
| \`RO-DATA-001\` | \`EU-GDPR-2016-679\`, \`RO-LAW-190-2018-CURRENT\` | Map controller/processor/independent-controller role per flow among DROPi, merchant, PSP, carrier and infrastructure vendors | Data-flow role registry drives agreement, access and responsibility selection | \`written_confirmation_required\` |
| \`RO-DATA-002\` | Same plus current ANSPDCP/EDPB guidance pending | Determine purpose/legal basis and retention/legal-hold separately for account, merchant verification, order, tax, PSP, postal, withdrawal, complaint, DSA/GPSR, support and marketing data | No universal consent checkbox or one-size retention period | \`written_confirmation_required\` |
| \`RO-DATA-003\` | Same + qualified review | Determine DPIA need and breach/data-rights ownership for the first pilot | DPIA decision record, incident routing and deletion/restriction/legal-hold state machine are launch evidence | \`written_confirmation_required\` |

### 8.9 Launch promotion gate

For this section, a row may move toward \`approved\` only when:

\`registered source + controlled current copy where required + exact provision + scoped DROPi factual flow + qualified interpretation where required + owner operating decision + implementation/test evidence\`.

Until then, law-dependent behavior stays configurable and fail-closed. #500 may use these rows to build a **candidate** developer priority map, but it must not treat a pending legal row as permission to enable the corresponding service.
`;

writeFileSync(path, `${text.trimEnd()}${section}\n`);
console.log("Romania launch traceability section appended.");
