# RO-LAUNCH-007 — Qualified Professional Review Packet

> **STATUS: PRE-ENGAGEMENT / NOT LEGAL OR TAX ADVICE / NO PAID ENGAGEMENT AUTHORIZED**
> **Version:** 0.1.0
> **As of:** 2026-09-13
> **Issue:** #499
> **Parent:** #492
> **Governing canon:** `canonical/LEGAL_COMPLIANCE_SOURCE_OF_TRUTH.md`

This document prepares a bounded review package for qualified Romanian/EU professionals. Its purpose is to reduce cost, ambiguity and project re-discovery by presenting the proposed first-launch facts and exact questions that require written professional validation.

It does not authorize contacting, hiring, paying or transmitting confidential documents to any professional. Those actions require separate Product Owner approval.

## 1. Product facts the reviewer should assume for the candidate MVP

Unless corrected through review, the current launch hypothesis is:

- jurisdiction: Romania / EU;
- channel: C1 controlled online Marketplace;
- seller cohort: verified professional merchants only;
- first catalog: closed allowlist of low-complexity non-food goods, with paper stationery/art prints/simple paper goods as current candidate;
- seller of record for goods: merchant, not DROPi;
- goods for first pilot: already located in Romania;
- customers: Romanian consumers in a restricted pilot geography;
- payment: eligible external PSP; DROPi does not intend to hold customer funds or issue stored value;
- delivery: merchant fulfilment and/or external effective postal provider;
- candidate integrated logistics model: DROPi postal resale only if ANCOM/counsel confirms that role and required notification/terms/contracts are complete;
- first zone candidate: restricted București–Ilfov pilot;
- excluded from first launch: P2P/private sellers, food, cosmetics, toys, electrical/electronic goods, medicines/medical devices, alcohol, tobacco/nicotine, dangerous goods, DROPi own courier fleet, Passenger Mobility, drones, Cooperative Hub implementation, C2 and C3.

If any reviewer conclusion requires changing these facts, the answer should state the replacement facts explicitly rather than answering against an unstated alternative model.

## 2. Desired response format from every reviewer

For each question, provide:

- `ANSWER`: yes / no / depends / not within competence;
- `LEGAL_OR_PROFESSIONAL_BASIS`: exact act/article/guidance/accounting basis;
- `FACTS_ASSUMED`: facts material to the conclusion;
- `REQUIRED_EVIDENCE`: filing, contract, registration, record or operational proof;
- `PRODUCT_CONSEQUENCE`: what DROPi must implement, prohibit or display;
- `EXPIRY_OR_REVIEW_TRIGGER`: law change, threshold, entity change, provider change, annual review, etc.;
- `UNRESOLVED`: questions requiring authority/other specialist confirmation.

Avoid generic statements such as “comply with GDPR” or “get ANCOM authorization” where an exact obligation, actor or filing can be named.

## 3. Romanian company / tax / accounting review

### Facts

Candidate entity: one Romanian SRL for the first Romanian Marketplace and possibly the approved postal role. The owner/manager may physically live and perform significant management activity outside Romania, including Ireland.

### Questions

1. Is one Romanian SRL a suitable first operating entity for the described Marketplace + candidate postal-resale/intermediation model?
2. Under the intended real management facts, could the SRL also become Irish tax resident under central-management-and-control rules?
3. How should the Romania–Ireland treaty place-of-effective-management test be applied to the proposed facts?
4. Could management activity, office/home-office, employees/agents or contracting in Ireland create an Irish permanent establishment, employer/payroll or other registration duty?
5. What truthful governance records should evidence where strategic management actually occurs?
6. Confirm the exact CAEN Rev.3 activity set for:
   - Marketplace retail intermediation;
   - digital/platform operations actually sold/performed;
   - postal/courier intermediation;
   - postal provision/resale after #496 fixes the regulatory role.
7. Confirm whether `4791` or `4792` fits the selected first catalog model and why.
8. Confirm whether `5330`, `5320` or both are appropriate after the postal role is fixed; state explicitly that CAEN registration does not substitute for ANCOM authority.
9. Confirm seller-of-record, title/risk-transfer and invoicing allocation where each merchant sells its own goods.
10. Confirm VAT-registration strategy, including the current 395,000 lei exemption threshold and whether voluntary registration is advisable for this business model.
11. For each checkout component—product, platform fee, postal/delivery fee—identify supplier, VAT treatment and invoice/receipt issuer.
12. Identify RO e-Factura obligations for the proposed B2C/B2B flows.
13. Confirm accounting treatment of PSP split settlement, refunds, chargebacks, platform fees and postal resale margin.
14. Identify any cross-border withholding/service-payment consequences for non-Romanian vendors/management.

### Required output

A signed/dated `Entity-Tax-CAEN Decision Memo` with a transaction diagram and invoice matrix.

## 4. Marketplace / e-commerce / consumer-law review

### Facts

DROPi operates the online interface and hosts merchant listings. Professional merchants are candidate sellers of record. Consumers conclude distance contracts through the DROPi interface.

### Questions

1. Confirm DROPi's exact classification under Law 365/2002 and the DSA: intermediary, hosting service, online platform, online marketplace, or another combination.
2. Confirm which DSA obligations apply immediately to the proposed entity/service.
3. Confirm which additional DSA Sections 3/4 duties may be excluded while DROPi qualifies as micro/small, and how enterprise size/linked enterprises must be assessed and revalidated.
4. Confirm the exact OUG 34/2014 Article 6^1 requirements for:
   - ranking parameters/relative importance;
   - seller professional status;
   - responsibility allocation.
5. Confirm every pre-contract and binding-checkout disclosure required for the expected pilot date after 27 September 2026.
6. Confirm the exact effect of OUG 18/2026 amendments on durability, repairability, legal/commercial guarantees and other information for the selected product family.
7. Confirm the Article 11^1 online withdrawal function requirements already applicable from 19 June 2026 and whether DROPi may operate the function technically on behalf of the merchant seller.
8. Define durable-medium evidence required for contract confirmation and withdrawal acknowledgement.
9. Confirm seller/Marketplace responsibility for conformity remedies, complaints and refunds.
10. Confirm any Romanian-language requirements for pre-contract, terms, safety warnings and durable communications.
11. Confirm current Law 363/2007/unfair-practices constraints relevant to ranking, reviews, scarcity, discounts, dark patterns and claims.

### Required output

A provision-by-provision `Marketplace Legal Control Matrix` mapping each obligation to UI/API/data/audit controls.

## 5. GPSR / product-safety review

### Facts

First category candidate is a closed allowlist of simple paper stationery/art-print products. Higher-risk categories are excluded.

### Questions

1. Confirm GPSR applicability to the exact first-category allowlist and identify excluded/sector-specific product cases.
2. Confirm Article 22 online-marketplace obligations that apply to DROPi regardless of merchant duties.
3. Identify mandatory listing fields for:
   - manufacturer;
   - EU responsible person/economic operator where applicable;
   - product identifier/image/type;
   - warnings/safety information.
4. Confirm Safety Gate registration and authority/consumer contact-point requirements.
5. Confirm authority-notice handling deadlines and required disabling/removal actions.
6. Confirm consumer notification/recall duties and evidence retention.
7. Define merchant evidence DROPi may require as stricter internal policy versus legally mandatory evidence.
8. Confirm whether the proposed paper-goods subcategories trigger chemical/material/labelling rules that require narrowing the allowlist.

### Required output

A signed/dated category pack with an explicit allowlist/exclusion list and Marketplace control checklist.

## 6. Payment / PSP review

### Facts

DROPi intends to use an eligible external Marketplace PSP. DROPi does not intend to possess/safeguard customer funds, issue stored value or market legal escrow.

### Questions

1. Confirm that the selected architecture keeps DROPi outside regulated payment-service provision and identify prohibited activities.
2. Confirm whether the technical-services exclusion is available for the exact architecture.
3. Do not assume the PSD2 commercial-agent exclusion. If relevant, state the factual/contractual basis and authority position explicitly.
4. Identify who legally receives payment and when the consumer's debt to the merchant is discharged.
5. Confirm merchant-beneficiary/KYB allocation between PSP and DROPi.
6. Confirm platform-fee and postal-fee settlement structure.
7. Confirm refund treatment for withdrawal, conformity, cancellation, failed delivery and postal claims.
8. Confirm chargeback/negative-balance allocation and reserve obligations.
9. Confirm payment/reconciliation evidence retention and export requirements.
10. Confirm whether cash should remain disabled for the first pilot.

### Required output

A `Payment Perimeter and Money Flow Memo` plus approved PSP transaction/settlement diagram.

## 7. Postal / ANCOM review

### Facts

Four models are being kept legally separate:

- Model A: merchant-managed fulfilment;
- Model B: carrier comparison/intermediation;
- Model C: DROPi postal resale using an effective authorized provider;
- Model D: later DROPi postal provision using own/contracted delivery operators.

### Questions

1. For Model A, identify the precise boundary at which technical Marketplace integration becomes postal-service offering/intermediation/resale.
2. For Model B, determine whether the proposed matching/commission model requires ANCOM notification.
3. For Model C, confirm whether the proposed DROPi customer/merchant flow is postal resale under OUG 13/2013 and Decision 925/2023.
4. List the exact notification documents, signatures, general conditions and evidence required before Model C may operate.
5. Confirm whether one DROPi entity may resell services from multiple effective providers.
6. Confirm mandatory disclosure of the effective provider(s), including the collecting provider.
7. Confirm liability, complaint and compensation allocation between reseller and effective provider.
8. Confirm tariff/markup rules and customer-price disclosure.
9. Confirm which operational changes require updated notification/information to ANCOM.
10. For later Model D, explain when contracted riders/drivers act on behalf of DROPi versus becoming separate postal providers.

### Required output

A `Postal Role Determination` for Models A–D and, if Model C is selected, an ANCOM filing checklist and customer-terms checklist.

## 8. Privacy / data-protection review

### Facts

The first pilot processes platform accounts, merchant verification, customer orders/addresses, PSP transaction references, postal fulfilment data, complaints/withdrawals and DSA/GPSR safety/moderation cases.

### Questions

1. Map controller/processor/independent-controller roles per data flow among DROPi, merchant, PSP, carrier and infrastructure vendors.
2. Approve purpose/legal-basis mapping for each data class.
3. Define exact retention periods and triggers for:
   - account/security;
   - merchant verification;
   - order/contract;
   - invoice/tax;
   - PSP/reconciliation;
   - postal proof/claim;
   - withdrawal/conformity/complaint;
   - DSA moderation;
   - GPSR safety/recall;
   - support;
   - marketing consent.
4. Define deletion versus restriction/legal-hold treatment after account closure/data-right requests.
5. Determine whether a DPIA is required for the first pilot.
6. Approve restricted-data access roles and audit expectations.
7. Confirm vendor Article 28/international-transfer safeguards.
8. Define personal-data breach assessment/notification ownership and deadlines.
9. Confirm data minimisation for carrier/PSP sharing.
10. Confirm what evidence may be retained when a legal obligation or claim overrides erasure.

### Required output

A `RoPA/Data Flow + Retention Schedule + Role Matrix`, with DPIA decision.

## 9. Product Owner decisions that professionals should not make for DROPi

Professionals should validate legality/financial/accounting implications, but the owner must choose the commercial scope:

- one entity versus more than one after receiving risk/cost advice;
- whether to start with merchant fulfilment only or pursue postal resale for pilot;
- selected PSP after compliant providers are compared;
- selected effective carrier(s);
- final paper-goods allowlist;
- final pilot zone/cohort/order caps;
- fee/pricing strategy after tax/legal constraints;
- whether/when later services are funded.

Professional advice should present lawful alternatives and consequences; it should not silently expand the first-launch scope.

## 10. Evidence handling

Do not place personal identity documents, bank statements, signed confidential opinions or live customer/merchant data in the public legal corpus.

The repository should store, as appropriate:

- public official sources and hashes;
- sanitized decision summaries;
- evidence references/IDs;
- reviewer name/qualification/date/scope where disclosure is appropriate;
- restricted-document location/reference rather than sensitive bytes.

## 11. Promotion outcome

Each workstream should end with one of:

- `APPROVED FOR DESIGN` — enough evidence for scoped law-dependent design;
- `APPROVED FOR FILING` — filing package/role approved where relevant;
- `NOT YET VALIDATED` — explicit blocker and owner;
- `OUT OF SCOPE` — professional confirms question belongs to another specialist/authority.

No professional memo alone enables production. After implementation, verification and operational evidence remain required under the legal canon.