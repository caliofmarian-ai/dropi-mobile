# Romania Launch Decision Register — 2026-09-15

> **STATUS: PRE-COUNSEL / PRE-ACCOUNTANT / FAIL-CLOSED**
> **Updated through:** 2026-09-16
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

### RO e-Factura / invoice authority

The invoice implementation must be driven by the current Romanian legal pack rather than a generic `invoiceRequired` flag. Current official source families include consolidated OUG 120/2021 and Law 88/2026. This does **not** decide which party in each DROPi flow is the invoice issuer; seller-of-record, platform-fee supplier, postal-service supplier, VAT status and transaction type must be fixed first.

```text
invoiceIssuer = derived_from_approved_supplier_role
vatTreatment = TBD_ACCOUNTING_REVIEW
roEFacturaTreatment = derived_from_current_legal_pack
merchantProductInvoice != dropiPlatformFeeInvoice
postalInvoice = disabled_until_postal_role_approved
```

### CAEN Rev.3 candidate mapping

Official ONRC CAEN Rev.3 material confirms candidate classes including:

- `4791` — Intermedieri în comerțul cu amănuntul nespecializat;
- `4792` — Intermedieri în comerțul cu amănuntul specializat;
- `5320` — Alte activități poștale și de curier;
- `5330` — Servicii de intermediere pentru activități poștale și de curier.

```text
CAEN code != sector authorization
CAEN code != ANCOM notification/right
CAEN code != payment authorization
CAEN code != product-safety approval
```

### #493 current state

`NOT YET VALIDATED / WRITTEN TAX-ACCOUNTING CONFIRMATION REQUIRED`

## 3. #494 — Marketplace / consumer / DSA / GPSR

Current research and canonical traceability support candidate controls for professional-seller status, ranking/responsibility disclosures, binding checkout, immutable contract snapshots, online withdrawal, effective-date legal packs, DSA applicability, GPSR listing/safety controls, unfair-practice/Terms review and SAL/ADR presentation. Exact law-dependent wording/applicability remains gated.

The DSA classification now also supplies a factual input to the PPWR online-platform verification analysis, so its Section 4 result must be explicit rather than hidden in a generic `dsaCompliant` state.

Current state: `PRE-COUNSEL / CURRENT SOURCE + DSA SECTION-4 APPLICABILITY REVIEW PENDING / LAW-DEPENDENT PUBLIC SEMANTICS BLOCKED`.

## 4. #495 — PSP / settlement / refunds / invoices

`docs/legal/RO_LAUNCH_PAYMENT_SETTLEMENT_CONTROL_CONTRACT_2026-09-15.md` governs the candidate first-pilot architecture.

```text
customer
-> regulated external PSP/platform product
-> merchant/submerchant proceeds
+ separately evidenced DROPi platform/service fee
```

DROPi does not intentionally hold/safeguard customer or merchant money as a payment service, issue e-money/stored value, operate a cash-equivalent customer wallet, market legal escrow, rely on cash/COD in the first pilot or rely on the PSD2 commercial-agent exclusion as a shortcut.

The provider shortlist remains PayU Marketplace, NETOPIA Marketplace, Stripe Connect, Adyen for Platforms and Mollie/Connect. No provider is selected. The exact PSP contracting entity must have competent-NCA authorization/register and any applicable Romania/EEA passporting evidence.

```text
fundsPossessionByDropi = false
paymentAuthority != UI success screen
paid != one boolean
providerPayout != taxInvoice
providerSplit != sellerOfRecordDecision
wallet/storedValue/eMoney = DISABLED
```

Current state: `PRE-COUNSEL / PRE-ACCOUNTANT / PSP NOT SELECTED / AUTHORITY EVIDENCE PER PROVIDER PENDING / MONEY FLOW NOT APPROVED / WALLET DISABLED / LIVE CHARGING BLOCKED`.

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

This is not recorded as final Product Owner selection merely because it is the leading research candidate. Public activation remains disabled until an explicit owner decision is recorded together with category/GPSR controls.

The first-product gate now requires both the factual packaging producer/EPR profile and any applicable PPWR online-platform producer-verification profile. A low-complexity paper product is not automatically a packaging PASS.

Current state: `OWNER DECISION REQUIRED / CATEGORY + PACKAGING/PPWR REVIEW REQUIRED`.

## 7. #498 — contracts / privacy / retention / support

The following anti-shortcut rules are fixed:

- no single generic Terms document allocates all responsibilities;
- no single privacy role applies to every data flow;
- consent is not a universal GDPR legal basis;
- no one global retention period;
- account deletion does not automatically delete legally retained tax/payment/postal/safety/dispute evidence;
- withdrawal, conformity, product safety, privacy rights, DSA notices and postal claims are dedicated workflows;
- restricted data access must be scoped and audited.

The first-pilot state remains `DPIA_TBD` pending final factual analysis.

DAC7-specific seller data may be collected as a mandatory tax-reporting purpose only after the Reporting Platform Operator/activity/seller/jurisdiction decision and its legal-basis/notice/retention profile are approved. Current ANAF guidance for DAC7 evidence does not become one global merchant-retention period.

Current state: `PRE-DPIA / WRITTEN PRIVACY REVIEW REQUIRED / PRODUCTION DATA SEMANTICS BLOCKED`.

## 8. Cross-cutting Marketplace controls — P2B / DAC7 / accessibility / packaging

Governing artifacts:

- `docs/legal/RO_LAUNCH_PLATFORM_BUSINESS_TAX_ACCESSIBILITY_PACKAGING_CONTRACT_2026-09-16.md` v1.1.0;
- `docs/legal/RO_LAUNCH_CROSSCUTTING_APPLICABILITY_WORKSHEET_2026-09-16.md`.

### P2B

Candidate first-pilot facts strongly match the Regulation (EU) 2019/1150 online-intermediation-service pattern. The working research classification is therefore:

`P2B_SERVICE_CLASSIFICATION = LIKELY_IN_SCOPE / FINAL_APPROVAL_PENDING`.

Merchant identity verification does not establish P2B compliance. Final merchant Terms, change notice, restriction/suspension/termination, ranking/differentiated-treatment/data-access and applicable complaint/mediation rules still require qualified review.

The Article 11/12 small-enterprise exceptions are obligation-specific. Their EU SME Recommendation headline test is `<50` persons and `<= EUR 10m` annual turnover **or** balance-sheet total, including required partner/linked-enterprise treatment. It must not be reused for accessibility.

### DAC7

The current source chain now includes the archived consolidated Directive 2011/16/EU as of 2026-01-01, Romanian OG 16/2023, OUG 71/2025 and OG 1/2026 amendment families plus registered ANAF procedure material.

Candidate facts make DROPi a `LIKELY` Platform Operator candidate for sale-of-goods activity. They do **not** yet prove Reporting Platform Operator status or the reporting Member State/registration route because the final entity/nexus is not approved.

Company/professional status does not automatically exclude a seller. For the sale-of-goods de-minimis seller exclusion, both `<30` facilitated goods activities and `<= EUR 2,000` total consideration are required for the reporting period. DAC7-specific mandatory collection/filing remains disabled until the complete applicability/purpose matrix is approved.

### Accessibility

The candidate consumer Marketplace fits the Law 232/2022 e-commerce-service category. The remaining main exemption question is the actual operating entity's microenterprise evidence.

The headline accessibility/EAA microenterprise threshold is `<10` persons and `<= EUR 2m` annual turnover **or** balance-sheet total. It is not the P2B threshold and not Romanian fiscal microenterprise status.

Accessible foundations and regression testing are safe design work even while the legal exemption remains unresolved.

### Packaging / EPR / PPWR platform verification

Two independent decisions now exist:

```text
PackagingProducerResponsibilityProfile
PpwrOnlinePlatformVerificationProfile
```

The first identifies actual producer/importer/packer/fulfilment/EPR responsibility for each packaging layer.

The second addresses the direct PPWR online-platform duty where the service falls within the relevant DSA Section 4 / producer-distance-contract scope. When applicable, DROPi must be able to obtain producer registration information/number and EPR self-certification before producer activation and support the required `best efforts` completeness/reliability assessment.

Merchant-managed fulfilment does not automatically eliminate that platform question, and the platform verification duty does not automatically make DROPi the packaging producer.

Current combined state:

`P2B LIKELY-IN-SCOPE / FINAL TERMS+SIZE EXCEPTION APPROVAL PENDING / DAC7 PLATFORM-OPERATOR CANDIDATE LIKELY / REPORTING OPERATOR+JURISDICTION NOT VALIDATED / ACCESSIBILITY E-COMMERCE SCOPE IDENTIFIED / MICROENTERPRISE EXEMPTION EVIDENCE PENDING / PPWR PLATFORM SCOPE NOT VALIDATED / PACKAGING EPR ACTOR NOT VALIDATED / SAFE FOUNDATION DESIGN ALLOWED / PUBLIC MERCHANT ACTIVATION BLOCKED`.

## 9. #499 — controlled legal corpus

PR #504 is the consolidation point for source provenance/reliance state, canonical source register, blockers, requirement traceability, official-source findings, review packet, applicability worksheet and decision/control contracts.

The current source-register baseline is `93 records / 37 immutable files`. The latest current-authority batch added seven source records; controlled snapshots were successfully archived for the 2026 consolidated DAC text, Commission PPWR guidance C(2026) 3702 and Commission Recommendation 2003/361/EC. Romanian Legislative Portal sources that were not capturable remain honestly `pending_primary_copy`.

A verified official URL is not automatically an immutable controlled source snapshot. Missing controlled copies remain explicitly pending rather than receiving fabricated hash/path evidence.

## 10. Engineering consequences exported to #500 / PR #505

Developer work may safely proceed only in two classes before legal promotion:

1. **FOUNDATION / truthfulness work** that does not presume a contested legal result; and
2. bounded implementation after the relevant legal row has been promoted to an approved design contract.

Candidate sequence:

```text
repository/account safety
-> merchant/seller evidence + versioned merchant relationship controls
-> category/zone + product safety + packaging producer/PPWR verification gates
-> Marketplace legal disclosures + accessibility-compatible surfaces
-> external PSP settlement/reconciliation
-> merchant fulfilment
-> withdrawal/refund/complaint flows
-> privacy/retention/support + approved tax-reporting purpose controls
-> release/rollback/e2e evidence
-> owner pilot gate
```

Integrated postal resale is inserted only if #496 is approved and the owner elects it for the first pilot.

## 11. Outstanding decisions/evidence that cannot be fabricated

Before #501 can authorize implementation reprioritization, record explicit dispositions for:

1. actual Romanian/Irish management facts and professional cross-border tax conclusion under the current post-MLI treaty framework;
2. final Romanian entity and CAEN activity set;
3. final seller-of-record/title/VAT/e-Factura invoice matrix;
4. final product allowlist and pilot geography;
5. selected PSP, exact contracting-entity authority/passport evidence and approved money-flow/invoice/refund/chargeback matrix;
6. merchant fulfilment-only versus first-pilot postal resale decision;
7. exact DSA/GPSR/consumer-law applicability/control set, including DSA Section 4 state used by PPWR;
8. final P2B classification and merchant Terms/restriction/complaint/mediation matrix plus any size-exception evidence;
9. DAC7 Reporting Platform Operator/activity/seller/reporting-jurisdiction decision and privacy/retention consequences;
10. accessibility microenterprise-exemption evidence and approved release requirements;
11. PPWR online-platform verification scope plus packaging/EPR actor matrix and required registration/evidence/labelling treatment;
12. privacy roles, legal bases, retention and DPIA decision;
13. contract/support responsibility matrix;
14. implementation/test/runtime evidence.

Until those gates are satisfied, the affected capability is `NOT YET VALIDATED`, never silently PASS.
