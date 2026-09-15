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

The current official Revenue synthesised text of the Ireland–Romania convention, reflecting the Multilateral Instrument (MLI), requires a correction to the earlier project shorthand. The original convention's Article 4(3) rule that assigned a dual-resident non-individual solely by `place of effective management` has been replaced by MLI Article 4(1). Under the synthesised post-MLI wording, the competent authorities are to endeavour to determine treaty residence by mutual agreement, having regard to place of effective management, place of incorporation/constitution and other relevant factors. In the absence of such agreement, treaty relief/exemption is not automatically available except to the extent and in the manner the competent authorities may agree.

The official synthesised text states that relevant MLI provisions have effect in Romania, for taxes other than withholding taxes, for taxable periods beginning on or after 1 January 2024. The synthesised document itself is explanatory and states that the authentic Convention and MLI texts remain the legal texts.

The treaty permanent-establishment article separately includes a place of management, branch and office among examples of fixed places of business.

Therefore:

```text
ROMANIAN_INCORPORATION != CROSS_BORDER_TAX_RESIDENCE_RESOLVED
PLACE_OF_EFFECTIVE_MANAGEMENT != AUTOMATIC_POST_MLI_TREATY_TIE_BREAKER
DUAL_RESIDENCE_REQUIRES_CURRENT_TREATY_MLI_ANALYSIS
```

No artificial board minutes, nominal management location or fictional local decision-making may be used as evidence. Actual governance facts must be recorded truthfully and reviewed professionally before the entity model is promoted.

Official references rechecked 2026-09-15:

- Irish Revenue — company residency rules: `https://www.revenue.ie/en/companies-and-charities/corporation-tax-for-companies/corporation-tax/company-residency-rules.aspx`
- Irish Revenue — Romania treaty index: `https://www.revenue.ie/en/tax-professionals/tax-agreements/double-taxation-treaties/R/romania.aspx`
- Irish Revenue — synthesised MLI + Ireland–Romania convention: `https://www.revenue.ie/en/tax-professionals/documents/double-taxation-treaties/r/synthesised-text-of-the-mli-and-the-ireland-romania-double-taxation-convention.pdf`

### RO e-Factura / invoice authority — current-source correction

The invoice implementation must be driven by the current Romanian legal pack rather than an old generic `invoiceRequired` flag. Current official sources rechecked on 2026-09-15 include the consolidated OUG 120/2021 and Law 88/2026. The current consolidated OUG 120/2021 reflects, among other things, the 2026 B2C identification rules and a five-working-day transmission deadline in the relevant mandatory e-Factura flow. Law 88/2026 amended the 2026 B2C/register provisions. ANAF also publishes 2026 explanatory material for these changes.

This does **not** decide which party in each DROPi flow is the invoice issuer. The seller-of-record, platform-fee supplier, any postal-service supplier, VAT status and exact transaction type must be fixed first. Engineering must therefore model invoice obligations per supplier/transaction/legal-pack version, not per order globally.

Current invoice invariant:

```text
invoiceIssuer = derived_from_approved_supplier_role
vatTreatment = TBD_ACCOUNTING_REVIEW
roEFacturaTreatment = derived_from_current_legal_pack
merchantProductInvoice != dropiPlatformFeeInvoice
postalInvoice = disabled_until_postal_role_approved
```

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

The Romanian DPIA source family now includes ANSPDCP Decision 174/2018 and official ANSPDCP DPIA guidance. Exact controller/processor relationships, legal bases, retention durations and the factual DPIA outcome remain professionally unresolved; the first-pilot state remains `DPIA_TBD`.

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

1. actual Romanian/Irish management facts and professional cross-border tax conclusion under the current post-MLI treaty framework;
2. final Romanian entity and CAEN activity set;
3. final seller-of-record/title/VAT/e-Factura invoice matrix;
4. final product allowlist and pilot geography;
5. selected PSP and approved money-flow/invoice/refund matrix;
6. merchant fulfilment-only versus first-pilot postal resale decision;
7. exact DSA/GPSR/consumer-law applicability/control set;
8. privacy roles, legal bases, retention and DPIA decision;
9. contract/support responsibility matrix;
10. implementation/test/runtime evidence.

Until those gates are satisfied, the affected capability is `NOT YET VALIDATED`, never silently PASS.
