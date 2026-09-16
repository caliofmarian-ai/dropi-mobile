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

Current research and canonical traceability support candidate controls for professional-seller status, ranking/responsibility disclosures, binding checkout, immutable contract snapshots, online withdrawal, effective-date legal packs, DSA applicability, GPSR listing/safety controls, unfair-practice/Terms review and SAL/ADR presentation. Exact law-dependent wording/applicability remains gated.

Current state: `PRE-COUNSEL / CURRENT_SOURCE_PENDING / IMPLEMENTATION BLOCKED FOR LAW-DEPENDENT SEMANTICS`.

## 4. #495 — PSP / settlement / refunds / invoices

The payment source family and technical contract are now materially more complete. `docs/legal/RO_LAUNCH_PAYMENT_SETTLEMENT_CONTROL_CONTRACT_2026-09-15.md` governs the candidate first-pilot architecture.

Candidate MVP boundary:

```text
customer
-> regulated external PSP/platform product
-> merchant/submerchant proceeds
+ separately evidenced DROPi platform/service fee
```

DROPi does not intentionally:

- hold/safeguard customer or merchant money as a payment service;
- issue stored monetary value/e-money;
- operate a customer cash-equivalent wallet;
- market legal escrow;
- rely on cash/COD in the first pilot;
- rely on the PSD2 commercial-agent exclusion as a design shortcut.

The legal corpus now registers the consolidated PSD2 endpoint, SCA RTS endpoint, EBA Q&A 2020_5354 and 2020_5355, OUG 5/2026 amendments affecting Law 209/2019, current Law 210/2019 e-money endpoint and the EBA central payment/e-money register page. The EBA Q&A and central-register page are archived controlled evidence; the central register is expressly treated only as a discovery/cross-check source because EBA states it has no legal significance. The exact PSP contracting entity must have competent-NCA authorization/register and, where applicable, Romania/EEA passporting evidence.

The provider shortlist remains PayU Marketplace, NETOPIA Marketplace, Stripe Connect, Adyen for Platforms and Mollie/Connect. No provider is selected. For every candidate, the same evidence must be obtained for contracting entity, NCA authorization, passporting, merchant KYB, SCA, funds path, split/fee model, settlement/payout, refunds, chargebacks, negative balances, reserves, webhook/idempotency, reconciliation, DPA/subprocessors and commercial terms.

Candidate financial components are independently identifiable: product amount, DROPi platform fee, future postal amount only if #496 approves it, PSP fee/reference, refund, reversal, chargeback and settlement adjustment.

Hard invariants:

```text
fundsPossessionByDropi = false   // first-pilot boundary
paymentAuthority != UI success screen
paid != one boolean
providerPayout != taxInvoice
providerSplit != sellerOfRecordDecision
wallet/storedValue/eMoney = DISABLED
```

Safe pre-approval engineering is limited to provider abstraction, signed-webhook/idempotency machinery, evidence-backed payment states, component ledger, reconciliation engine and fail-closed activation gates. Live charging requires selected/provider-authorized production configuration plus approved money-flow and tax/invoice matrix.

Current state:

`PRE-COUNSEL / PRE-ACCOUNTANT / PSP NOT SELECTED / AUTHORITY EVIDENCE PER PROVIDER PENDING / MONEY FLOW NOT APPROVED / WALLET DISABLED / LIVE CHARGING BLOCKED`.

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

The Romanian DPIA source family includes ANSPDCP Decision 174/2018 and official ANSPDCP DPIA guidance. Exact controller/processor relationships, legal bases, retention durations and the factual DPIA outcome remain professionally unresolved; the first-pilot state remains `DPIA_TBD`.

Current state: `PRE-DPIA / WRITTEN PRIVACY REVIEW REQUIRED / PRODUCTION DATA SEMANTICS BLOCKED`.

## 8. #499 — controlled legal corpus

PR #504 is the consolidation point for source provenance/reliance state, canonical source register, gaps/blockers, requirement traceability, official-source findings, review packet and these decision contracts.

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
5. selected PSP, exact contracting-entity authority/passport evidence and approved money-flow/invoice/refund/chargeback matrix;
6. merchant fulfilment-only versus first-pilot postal resale decision;
7. exact DSA/GPSR/consumer-law applicability/control set;
8. privacy roles, legal bases, retention and DPIA decision;
9. contract/support responsibility matrix;
10. implementation/test/runtime evidence.

Until those gates are satisfied, the affected capability is `NOT YET VALIDATED`, never silently PASS.
