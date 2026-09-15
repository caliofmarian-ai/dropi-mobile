# Romania Launch Decision Register — 2026-09-15

> **STATUS: PRE-COUNSEL / PRE-ACCOUNTANT / FAIL-CLOSED**
> **Parent:** #492
> **Workstreams:** #493–#499
> **Legal evidence PR:** #504
> **Engineering candidate PR:** #505
> **Governing canon:** `canonical/LEGAL_COMPLIANCE_SOURCE_OF_TRUTH.md`

This register consolidates the current first-launch decisions and blockers so they are not scattered across branch-specific research packets and issue comments. It is a planning/evidence document, not legal, tax, accounting or regulatory advice and not authorization to trade.

## 1. Current candidate launch envelope

The narrow candidate first pilot remains:

```text
Romanian operating entity
  -> verified professional merchants only
  -> goods already located in Romania
  -> Romanian consumers in one restricted pilot geography
  -> closed low-complexity non-food allowlist
  -> merchant remains seller of record for goods
  -> DROPi operates the controlled Marketplace/interface
  -> eligible external PSP; no DROPi customer-fund custody/stored value/legal escrow
  -> merchant fulfilment first
  -> optional DROPi postal resale only after #496 classification, notification and contracts
  -> proprietary DROPi delivery fleet later
```

Excluded from first launch: P2P/private sellers, food, cosmetics, toys, electrical/electronic goods, medical products, alcohol, tobacco/nicotine, dangerous goods, Passenger Mobility, drone delivery, DronePort physical operations, Cooperative Hub implementation, C2, C3, internal customer wallet and crypto/token settlement.

## 2. #493 — entity / tax / CAEN / seller-of-record

### Candidate operating structure

- one Romanian SRL remains the practical candidate operating entity;
- Romanian professional merchant remains candidate seller of record for its goods;
- DROPi should not take title to merchant inventory merely to simplify checkout;
- DROPi platform/service revenue is separate from merchant product revenue;
- any postal/logistics fee is separately classified and depends on #496.

### Cross-border P0 blocker

Official Irish Revenue guidance states that a foreign-incorporated company centrally managed and controlled in Ireland may be Irish tax resident. Revenue looks to the highest level of control, including where policy, major investment decisions, major contracts, head office and directors are located.

The Ireland–Romania Double Taxation Convention provides that where a non-individual is resident in both states, treaty residence is assigned to the state where its place of effective management is situated. The treaty permanent-establishment article also includes a place of management, branch and office among the examples of fixed places of business.

Therefore:

`ROMANIAN_INCORPORATION != CROSS_BORDER_TAX_RESIDENCE_RESOLVED`

No artificial board minutes, nominal management location or fictional local decision-making may be used as evidence. Actual governance facts must be recorded truthfully and reviewed professionally before the entity model is promoted.

Official references rechecked 2026-09-15:

- Irish Revenue — company residency rules: `https://www.revenue.ie/en/companies-and-charities/corporation-tax-for-companies/corporation-tax/company-residency-rules.aspx`
- Ireland–Romania DTA: `https://www.revenue.ie/en/tax-professionals/documents/double-taxation-treaties/r/romania.pdf`

### CAEN Rev.3 candidate mapping

Official ONRC CAEN Rev.3 material confirms:

- `4791` — Intermedieri în comerțul cu amănuntul nespecializat;
- `4792` — Intermedieri în comerțul cu amănuntul specializat;
- `5320` — Alte activități poștale și de curier;
- `5330` — Servicii de intermediere pentru activități poștale și de curier.

The old assumption `4791 = Internet retail` must not be used as current Rev.3 authority.

Official references rechecked 2026-09-15:

- `https://www.onrc.ro/documente/caen/Monitorul_Oficial_385_CAEN_Rev.3.pdf`
- `https://www.onrc.ro/documente/anunturi/CAEN-Rev.3_structura-completa.pdf`
- `https://www.onrc.ro/documente/anunturi/Corespondenta-CAEN-Rev.2-CAEN-Rev.3.pdf`

Hard invariant:

```text
CAEN code != sector authorization
CAEN code != ANCOM notification/right
CAEN code != payment authorization
CAEN code != product-safety approval
```

### #493 current state

`NOT YET VALIDATED / WRITTEN TAX-ACCOUNTING CONFIRMATION REQUIRED`

Implementation may model roles generically, but must not hard-code the entity tax residence, final CAEN set, VAT regime or invoice allocation as approved facts.

## 3. #494 — Marketplace / consumer / DSA / GPSR

Current research and canonical traceability support the following **candidate controls**, still pending controlled-source completion and qualified interpretation where marked:

- professional-seller status represented before binding checkout;
- versioned ranking disclosure where legally required;
- versioned seller/DROPi responsibility allocation;
- online withdrawal function and durable acknowledgement for covered distance contracts;
- legal-pack effective dates so the checkout schema changes with applicable law;
- DSA service classification and enterprise-size applicability record rather than global `dsaCompliant=true`;
- GPSR Marketplace contact/Safety Gate/process controls;
- category-aware product-safety listing schema;
- unsafe-product notice, removal/disable, recall and consumer-notification evidence.

Current state: `PRE-COUNSEL / CURRENT_SOURCE_PENDING / IMPLEMENTATION BLOCKED FOR LAW-DEPENDENT SEMANTICS`.

## 4. #495 — PSP / settlement / refunds / invoices

Candidate MVP boundary:

```text
customer -> eligible external PSP -> merchant / DROPi allocations
```

DROPi does not intentionally:

- hold/safeguard customer money;
- issue stored value;
- operate a customer cash-equivalent wallet;
- market legal escrow.

Candidate financial components must be independently identifiable: product amount, platform fee, postal/delivery amount where applicable, PSP fee/reference, refund/reversal and reconciliation evidence.

`paid=true` is not an adequate financial authority model.

Cash remains `HOLD` for the first pilot unless an approved fiscal/payment flow later enables it.

Provider selection remains open. A provider name in research is not approval.

Current state: `PRE-COUNSEL / PRE-ACCOUNTANT / PSP NOT SELECTED / LIVE CHARGING BLOCKED`.

## 5. #496 — postal / ANCOM role

Four models remain legally and technically separate:

- **A — merchant-managed fulfilment:** current lowest-assumption first-pilot fallback;
- **B — carrier comparison/intermediation:** requires scoped written classification;
- **C — DROPi postal resale:** candidate integrated-logistics upgrade after classification/notification/contracts;
- **D — DROPi postal provision with own/contracted delivery operators:** later service.

No generic `deliveryEnabled` or CAEN value may collapse these roles.

Current state: `MODEL_A AVAILABLE AS LAUNCH HYPOTHESIS / MODELS_B-C HOLD-LEGAL / MODEL_D LATER-SERVICE`.

## 6. #497 — first product family / pilot zone

Research candidate remains:

- first family: closed allowlist of paper stationery, art prints and simple paper goods;
- first geography candidate: restricted `BUCHAREST_ILFOV_CONTROLLED_PILOT`;
- merchant/SKU/order caps;
- one approved fulfilment/carrier model;
- all higher-risk categories denied by default.

This is not recorded as final Product Owner selection merely because it is the leading research candidate. Public activation remains disabled until an explicit owner decision is recorded together with the category/GPSR control pack.

Current state: `OWNER DECISION REQUIRED / CATEGORY REVIEW REQUIRED`.

## 7. #498 — contracts / privacy / retention / support

The following anti-shortcut rules are fixed for planning:

- no single generic Terms document allocates all responsibilities;
- no single privacy role applies to every data flow;
- consent is not a universal GDPR legal basis;
- no one global retention period;
- account deletion does not automatically delete legally retained tax/payment/postal/safety/dispute evidence;
- withdrawal, conformity, product safety, privacy rights, DSA notices and postal claims are dedicated workflows, not generic `contact support` tickets;
- restricted data access must be scoped and audited.

Exact controller/processor relationships, legal bases, retention durations and DPIA outcome remain professionally unresolved.

Current state: `PRE-DPIA / WRITTEN PRIVACY REVIEW REQUIRED / PRODUCTION DATA SEMANTICS BLOCKED`.

## 8. #499 — controlled legal corpus

PR #504 is the consolidation point for:

- source provenance and reliance state;
- canonical source register;
- legal gaps/blockers;
- main requirement traceability;
- official-source findings;
- professional-review packet;
- this decision register.

A verified official URL is not automatically an immutable controlled source snapshot. Missing controlled copies remain explicitly pending rather than receiving fabricated hash/path evidence.

## 9. Engineering consequences exported to #500 / PR #505

Developer work may safely proceed only in two classes before legal promotion:

1. **FOUNDATION / truthfulness work** that does not presume a contested legal result; and
2. bounded implementation after the relevant legal row has been promoted to an approved design contract.

The candidate launch implementation sequence remains:

```text
repository/account safety
-> merchant/seller evidence
-> category/zone activation gate
-> Marketplace legal disclosures + product safety
-> external PSP settlement/reconciliation
-> merchant fulfilment
-> withdrawal/refund/complaint flows
-> privacy/retention/support controls
-> release/rollback/e2e evidence
-> owner pilot gate
```

Integrated postal resale is inserted only if #496 is approved and the owner elects it for the first pilot.

## 10. Outstanding decisions/evidence that cannot be fabricated

Before #501 can authorize implementation reprioritization, record explicit dispositions for:

1. actual Romanian/Irish management facts and professional cross-border tax conclusion;
2. final Romanian entity and CAEN activity set;
3. final seller-of-record/title/invoice matrix;
4. final product allowlist and pilot geography;
5. selected PSP and approved money-flow/invoice/refund matrix;
6. merchant fulfilment-only versus first-pilot postal resale decision;
7. exact DSA/GPSR/consumer-law applicability/control set;
8. privacy roles, legal bases, retention and DPIA decision;
9. contract/support responsibility matrix;
10. implementation/test/runtime evidence.

Until those gates are satisfied, the affected capability is `NOT YET VALIDATED`, never silently PASS.
