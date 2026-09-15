# RO-LAUNCH-005 — First Product Allowlist and GPSR Gate

> **STATUS: CANDIDATE / OWNER DECISION REQUIRED / PRE-COUNSEL / FAIL-CLOSED**
> **As of:** 2026-09-15
> **Issue:** #497
> **Parent:** #492

This document converts the current product-family research into a deny-by-default technical category contract. It does not certify any product as safe and does not replace merchant/economic-operator duties.

## 1. Candidate first family

Candidate launch family:

`PAPER_STATIONERY_ART_PRINTS_SIMPLE_PAPER_GOODS`

The purpose of this narrow family is to prove the professional-merchant Marketplace transaction loop while excluding categories with materially higher sector-specific, electrical, chemical, child-safety, medical or food obligations.

The European Commission's Safety Gate 2025 report recorded cosmetics, toys and electrical appliances/equipment as the three most frequently notified dangerous-product categories. This supports the project's conservative exclusion strategy but is not proof that paper goods are automatically safe.

## 2. Allowlist — candidate subcategories

The following may be considered **only after merchant/product evidence passes the generic GPSR gate**:

- ordinary paper notebooks and writing pads with no electronics;
- plain paper/card greeting cards;
- postcards;
- paper bookmarks;
- ordinary paper envelopes;
- simple paper folders and document sleeves where no special chemical/safety claim is made;
- art prints/posters on paper/card;
- printed photographs/art reproductions sold as decorative prints;
- calendars made primarily of paper/card;
- simple paper gift tags/cards;
- ordinary adult/general-use paper stationery sets containing only allowlisted paper components.

This is a technical Marketplace allowlist, not a legal declaration that every item in those descriptions is compliant.

## 3. Hard exclusions from the first family

A listing is **not** part of the first-pilot allowlist if it includes or is marketed as any of the following:

- toy, children's play item or child-development product;
- product intended for children where child-specific safety requirements may be triggered;
- electrical/electronic component, light, battery, cable, charger, powered feature or connected function;
- cosmetic, personal-care, fragrance or body-contact formulation;
- food, beverage, food supplement or animal feed;
- food-contact article where separate material/contact rules need analysis;
- medicine, medical device, diagnostic or health-treatment product;
- alcohol, tobacco, nicotine or related controlled/restricted product;
- candle, incense, pyrotechnic or combustion product;
- adhesive, glue, paint, ink, solvent, chemical mixture or refill sold as a product in its own right;
- cleaning chemical or hazardous substance;
- sharp blade/cutting implement or other higher-risk accessory bundled with paper goods;
- magnet, battery/button-cell, small detachable component or other feature creating a child/choking/electrical risk profile;
- protective/safety product or product making a safety certification claim;
- counterfeit or IP-infringing merchandise;
- custom product whose materials/function place it outside the allowlist;
- any product recalled, prohibited or otherwise unsafe under authoritative evidence.

Unknown classification = denied by default.

## 4. Mandatory listing information gate

GPSR Article 19 requires online/distance product offers by economic operators to clearly and visibly include at least the applicable manufacturer identity/contact information, EU responsible person where the manufacturer is outside the Union, product identification information including a picture/type/identifier, and warnings/safety information required for the product.

The Marketplace listing contract must therefore support at least:

```text
merchantId
sellerLegalEntityId
productCategoryId
productSubcategoryId
manufacturerName
manufacturerPostalAddress
manufacturerElectronicAddress
manufacturerEstablishedInEU
responsiblePersonName?             // required where applicable
responsiblePersonPostalAddress?
responsiblePersonElectronicAddress?
productName
productType
productIdentifier
primaryProductImage
warningSafetyInformation[]
warningLanguage
countryOfOrigin?                   // where required/collected
merchantEvidenceRefs[]
policyVersion
listingComplianceState
reviewedAt
reviewDueAt?
```

A field existing in the database is not evidence that its content is correct.

## 5. Online Marketplace GPSR gate

Before public product activation, DROPi's Marketplace design must support the Article 22 obligations applicable to providers of online marketplaces, including:

- single point of contact for market-surveillance authorities;
- Safety Gate Portal registration and contact information;
- consumer product-safety contact point;
- internal product-safety processes;
- trader-facing mechanisms to supply required safety/traceability information;
- product-safety notice processing without undue delay and, for the Article 22(8) notice flow, within three working days;
- use of Safety Gate Portal in the applicable product-safety checking framework;
- authority order/removal/disable/warning handling;
- dangerous-product/accident reporting through the applicable Safety Business Gateway flow where required;
- trader/economic-operator notification and consumer/recall evidence where required.

Current official Commission guidance also states that online marketplaces should have mechanisms enabling traders to provide required product safety/traceability information and self-certification/identification information.

## 6. Listing state machine

```text
DRAFT
  -> CATEGORY_CLASSIFICATION_PENDING
  -> MERCHANT_EVIDENCE_PENDING
  -> PRODUCT_SAFETY_FIELDS_PENDING
  -> SAFETY_GATE_CHECK_PENDING
  -> REVIEW_PENDING
  -> APPROVED_FOR_PILOT
```

Blocking/revocation states:

```text
CATEGORY_NOT_ALLOWED
INSUFFICIENT_EVIDENCE
RESPONSIBLE_PERSON_REQUIRED
WARNING_INFO_REQUIRED
SAFETY_GATE_MATCH_REVIEW
UNSAFE_PRODUCT_NOTICE
AUTHORITY_ORDER
RECALL_REQUIRED
DISABLED
REMOVED
```

No moderator may bypass a hard first-pilot category exclusion merely because the listing appears harmless.

## 7. Merchant evidence principle

DROPi may impose stricter evidence than the statutory minimum as an internal launch policy, but the UI/API/audit trail must distinguish:

```text
LAW_REQUIRED
DROPI_POLICY_REQUIRED
PROVIDER_REQUIRED
OPTIONAL
```

This prevents internal risk policy from being falsely represented as a government licence/certificate requirement.

## 8. Candidate pilot geography

The current research candidate remains:

`BUCHAREST_ILFOV_CONTROLLED_PILOT`

This document does not make that owner decision final. The final zone must carry:

```text
zoneId
boundaryVersion
merchantCap
skuCap
orderCap
allowedProductCategoryPack
allowedFulfilmentRoles
supportCoverage
legalPackVersion
activationState
```

Outside the active zone/category pack, checkout fails closed.

## 9. Official sources rechecked 2026-09-15

- GPSR consolidated text: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02023R0988-20260529`
- European Commission Safety Gate 2025 report: `https://op.europa.eu/webpub/just/safety-gate-2025-report/en/`
- Commission product-safety information: `https://commission.europa.eu/topics/business-and-industry/product-safety_en`
- Commission GPSR guidance for businesses / online marketplaces: EUR-Lex guidance under `2025/C 6233` and related Safety Gate material.

## 10. Current disposition

Engineering may design the **deny-by-default category framework and evidence provenance model** without claiming that the candidate family is legally approved.

Public activation remains blocked until:

- Product Owner selects the family and pilot zone;
- the category-specific review confirms the allowlist/exclusions;
- applicable GPSR/DSA/consumer controls are approved for design;
- merchant/listing evidence and Safety Gate/product-safety processes are implemented and tested.

Current state:

`ALLOWLIST_CONTRACT_READY_FOR_REVIEW / OWNER_DECISION_REQUIRED / PRODUCT_ACTIVATION_DISABLED`
