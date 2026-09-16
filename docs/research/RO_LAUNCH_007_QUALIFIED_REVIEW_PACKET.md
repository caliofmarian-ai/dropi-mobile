# RO-LAUNCH-007 — Qualified Professional Review Packet

> **STATUS: PRE-ENGAGEMENT / NOT LEGAL OR TAX ADVICE / NO PAID ENGAGEMENT AUTHORIZED**
> **Version:** 0.2.0
> **As of:** 2026-09-16
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

The legal corpus also now treats four cross-cutting domains as separate applicability decisions rather than assumptions: P2B business-user rules, DAC7 platform/seller reporting, e-commerce accessibility and packaging/EPR roles.

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
3. Under the current Ireland–Romania treaty as modified by the MLI, if dual residence arises, how should the competent-authority mutual-agreement framework be approached, including the relevance of place of effective management, incorporation/constitution and other material factors? Do not apply the superseded automatic `place of effective management` tie-breaker as the current rule.
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
10. Confirm VAT-registration strategy and the current applicable Romanian threshold/rules at the review date; do not rely on a hard-coded historic threshold from this packet.
11. For each checkout component—product, platform fee, postal/delivery fee—identify supplier, VAT treatment and invoice/receipt issuer.
12. Identify current RO e-Factura obligations for the proposed B2C/B2B flows, including the correct current transmission/identification rules.
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
4. Confirm the exact OUG 34/2014 Article 6^1 requirements for ranking parameters/relative importance, seller professional status and responsibility allocation.
5. Confirm every pre-contract and binding-checkout disclosure required for the expected pilot date, including the 27 September 2026 effective-date boundary where relevant.
6. Confirm the exact effect of OUG 18/2026 amendments on the selected product family rather than importing unrelated future requirements.
7. Confirm the Article 11^1 online withdrawal function requirements already applicable from 19 June 2026 and whether DROPi may operate the function technically on behalf of the merchant seller.
8. Define durable-medium evidence required for contract confirmation and withdrawal acknowledgement.
9. Confirm seller/Marketplace responsibility for conformity remedies, complaints and refunds.
10. Confirm any Romanian-language requirements for pre-contract, terms, safety warnings and durable communications.
11. Confirm current Law 363/2007/unfair-practices constraints relevant to ranking, reviews, scarcity, discounts, dark patterns and claims.
12. Confirm the exact Law 193/2000 unfair-terms review needed for customer Terms and responsibility allocation.
13. Confirm current SAL/ADR information/display duties by web/mobile/email/contract channel under the applicable Romanian pack.

### Required output

A provision-by-provision `Marketplace Legal Control Matrix` mapping each obligation to UI/API/data/audit controls.

## 5. Platform-to-business (P2B) merchant relationship review

### Facts

DROPi intends to contract with professional merchants that use the Marketplace to offer goods to Romanian/EU consumers. The corpus registers Regulation (EU) 2019/1150 and Romanian OUG 23/2021, but does not pre-decide final applicability or obligation-specific size exceptions.

### Questions

1. Does the proposed DROPi service satisfy the current factual definition of an online intermediation service for Regulation (EU) 2019/1150?
2. Which merchant cohorts qualify as business users for the first pilot?
3. Which P2B obligations apply to the proposed service immediately and which, if any, have an enterprise-size exception? Identify the exact provision; do not treat small-enterprise status as a blanket P2B exemption.
4. What must merchant Terms contain regarding restriction, suspension and termination grounds and notices?
5. What advance-notice/effective-date rules apply to merchant Terms changes and what exceptions exist?
6. What ranking disclosure must be made to business users, and how does it differ from consumer-facing ranking disclosure?
7. What differentiated-treatment, data-access/data-use and post-termination data-access disclosures are required?
8. Are parity or different-conditions restrictions relevant to the proposed merchant contract?
9. Does DROPi need an internal complaint-handling system for the actual entity/service size and, if so, what must it contain/report?
10. Do mediation duties apply to the actual entity/service, and what mediator/Terms disclosures are required?
11. What procedure and evidence must accompany merchant restriction/suspension/termination decisions?
12. Which Romanian authority/enforcement procedures under OUG 23/2021/current practice should be reflected in the compliance pack?

### Required output

A `P2B Applicability + Merchant Terms Control Matrix` with explicit obligation-specific size exceptions, if any.

## 6. GPSR / product-safety review

### Facts

First category candidate is a closed allowlist of simple paper stationery/art-print products. Higher-risk categories are excluded.

### Questions

1. Confirm GPSR applicability to the exact first-category allowlist and identify excluded/sector-specific product cases.
2. Confirm Article 22 online-marketplace obligations that apply to DROPi regardless of merchant duties.
3. Identify mandatory listing fields for manufacturer, EU responsible person/economic operator where applicable, product identifier/image/type and warnings/safety information.
4. Confirm Safety Gate registration and authority/consumer contact-point requirements.
5. Confirm authority-notice handling deadlines and required disabling/removal actions.
6. Confirm consumer notification/recall duties and evidence retention.
7. Define merchant evidence DROPi may require as stricter internal policy versus legally mandatory evidence.
8. Confirm whether the proposed paper-goods subcategories trigger chemical/material/labelling rules that require narrowing the allowlist.

### Required output

A signed/dated category pack with an explicit allowlist/exclusion list and Marketplace control checklist.

## 7. DAC7 platform/seller reporting review

### Facts

The first pilot uses professional merchants. The corpus registers Directive (EU) 2021/514, Romanian OG 16/2023, ANAF DAC7 guidance, F7000 and ANAF Orders 1996/2023, 1946/2023 and 1226/2023. No conclusion has been made that DROPi is or is not a reporting platform operator, and no professional/company seller is assumed excluded merely because it is an entity.

### Questions

1. Does the proposed DROPi Marketplace satisfy the statutory platform definition for the relevant activities?
2. Which legal entity, if any, is the reporting platform operator and why?
3. Does any excluded-platform-operator rule apply to the exact model?
4. Which first-pilot activities are relevant activities for DAC7?
5. What Member State nexus and reporting jurisdiction/registration route applies to the actual operating entity?
6. Which merchant/entity seller categories are excluded sellers and which are reportable sellers? State the exact tests/evidence.
7. What seller due-diligence data is mandatory, and when must it be obtained/verified?
8. What consideration, platform fee/commission/tax and transaction data must be tracked for each reportable seller?
9. What current F7000/form/schema/version is authoritative at the intended filing date?
10. What registration/notification obligations and current forms apply before/alongside reporting?
11. What reporting deadline, correction process and authority-receipt evidence apply? Provide current authority rather than asking engineering to hard-code a remembered date.
12. What legal basis/privacy notice/retention is required for DAC7-specific data, and what should not be collected before applicability is established?

### Required output

A `DAC7 Platform Operator + Seller Classification Memo`, a required-data matrix and a current registration/reporting/correction checklist.

## 8. Payment / PSP review

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
11. Verify the exact PSP contracting entity against its competent national register/authorization and any EEA/Romania passporting evidence; do not rely on the EBA central register as legal authority by itself.
12. Confirm the selected provider's SCA, webhook/idempotency, split, settlement and reconciliation responsibility model in writing.

### Required output

A `Payment Perimeter and Money Flow Memo` plus approved PSP transaction/settlement diagram and provider-authority evidence pack.

## 9. Postal / ANCOM review

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

## 10. E-commerce accessibility review

### Facts

The corpus registers Directive (EU) 2019/882 and Romanian Law 232/2022. The proposed consumer-facing Marketplace is an e-commerce service candidate. DROPi may initially be a microenterprise, but no exemption is assumed from age, revenue expectations or company size labels without statutory evidence.

### Questions

1. Does the proposed web/mobile Marketplace fall within the covered e-commerce services under current Romanian law?
2. What legal entity/enterprise-size evidence is required to use the microenterprise service exemption, if available?
3. How must linked/partner enterprises or other relevant size concepts be assessed for that exemption?
4. What events trigger loss/reassessment of the exemption?
5. If covered, what exact accessibility requirements apply to product information, navigation, forms, authentication, checkout/payment instructions, withdrawal/returns and customer support?
6. What accessibility information/statement/documentation must be made available and retained?
7. Which Romanian authority/enforcement/cooperation procedures are relevant?
8. What standards or harmonized technical references should the engineering acceptance criteria use at the review date?
9. What evidence is appropriate for disproportionate-burden/fundamental-alteration analyses if ever relied on?
10. What automated and manual assistive-technology/device testing evidence should be retained for release assurance?

### Required output

An `Accessibility Applicability + Release Control Matrix`, with any exemption supported by evidence and review triggers.

## 11. Packaging / EPR / fulfilment responsibility review

### Facts

The first-product candidate includes stationery/art prints/simple paper goods. The pilot uses merchant-managed fulfilment first. Product and shipping packaging still exist. PPWR applies from 12 August 2026, and Romanian Law 249/2015 remains part of the national source chain.

### Questions

1. For each first-pilot product/fulfilment pattern, identify the actor for product packaging, grouped packaging, transport packaging and shipping/e-commerce packaging.
2. Which actor is a producer/importer/distributor/packer/fulfilment-service provider/platform for the applicable PPWR/Romanian rules?
3. Which actor has Romanian EPR/environmental-fund/registration/reporting obligations for each packaging layer?
4. What merchant evidence may DROPi require before a listing/merchant can be activated?
5. What packaging composition, recyclability/reuse, minimisation or information/labelling requirements apply to the first-pilot packaging after 12 August 2026?
6. What transition/effective-date provisions must the legal pack model?
7. Does merchant-managed fulfilment leave DROPi outside any packaging-producer role for the proposed facts, or are there platform-specific duties regardless?
8. How does the result change if DROPi later supplies standard shipping packaging, packs goods, warehouses goods or provides fulfilment?
9. What environmental claims about packaging/recyclability must be evidence-backed in the Marketplace presentation?
10. What records and review triggers should be retained for merchant/packaging actor status?

### Required output

A `Packaging Responsibility + EPR Matrix` per packaging layer and fulfilment model, with required registrations/evidence and effective-date rules.

## 12. Privacy / data-protection review

### Facts

The first pilot processes platform accounts, merchant verification, customer orders/addresses, PSP transaction references, postal fulfilment data, complaints/withdrawals and DSA/GPSR safety/moderation cases. DAC7-specific data is not assumed collectable until the corresponding purpose/applicability decision is approved.

### Questions

1. Map controller/processor/independent-controller roles per data flow among DROPi, merchant, PSP, carrier and infrastructure vendors.
2. Approve purpose/legal-basis mapping for each data class.
3. Define exact retention periods and triggers for account/security, merchant verification, order/contract, invoice/tax, PSP/reconciliation, postal proof/claim, withdrawal/conformity/complaint, DSA moderation, GPSR safety/recall, support and marketing consent.
4. If DAC7 applies, add its due-diligence/reporting purpose, required fields, disclosure, retention and deletion/restriction rules separately rather than reusing generic merchant-verification purposes.
5. Define deletion versus restriction/legal-hold treatment after account closure/data-right requests.
6. Determine whether a DPIA is required for the first pilot.
7. Approve restricted-data access roles and audit expectations.
8. Confirm vendor Article 28/international-transfer safeguards.
9. Define personal-data breach assessment/notification ownership and deadlines.
10. Confirm data minimisation for carrier/PSP sharing and for any tax-reporting collection.
11. Confirm what evidence may be retained when a legal obligation or claim overrides erasure.

### Required output

A `RoPA/Data Flow + Retention Schedule + Role Matrix`, with DPIA decision.

## 13. Product Owner decisions that professionals should not make for DROPi

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

## 14. Evidence handling

Do not place personal identity documents, bank statements, signed confidential opinions or live customer/merchant data in the public legal corpus.

The repository should store, as appropriate:

- public official sources and hashes;
- sanitized decision summaries;
- evidence references/IDs;
- reviewer name/qualification/date/scope where disclosure is appropriate;
- restricted-document location/reference rather than sensitive bytes.

## 15. Promotion outcome

Each workstream should end with one of:

- `APPROVED FOR DESIGN` — enough evidence for scoped law-dependent design;
- `APPROVED FOR FILING` — filing package/role approved where relevant;
- `NOT YET VALIDATED` — explicit blocker and owner;
- `OUT OF SCOPE` — professional confirms question belongs to another specialist/authority.

No professional memo alone enables production. After implementation, verification and operational evidence remain required under the legal canon.
