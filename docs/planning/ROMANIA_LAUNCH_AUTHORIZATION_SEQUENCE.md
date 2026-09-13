# DROPi Romania — Legal MVP and Authorization Sequence

> **STATUS: PROPOSED LAUNCH STRATEGY / PRE-COUNSEL / FAIL-CLOSED**
> **Version:** 0.1.0
> **Decision date:** 2026-09-13
> **Repository baseline:** `08ac65e69028e636fd0ee51db9a9dad1b47be2bc`
> **Jurisdiction:** Romania / European Union
> **Governing legal canon:** `canonical/LEGAL_COMPLIANCE_SOURCE_OF_TRUTH.md`
> **Governing current-state checkpoint:** `canonical/CURRENT_STATE.md`
>
> This document does not authorize a launch, filing, payment flow, postal service, courier operation or marketplace exposure. It defines the candidate sequence by which DROPi should become launchable without allowing feature development to outrun legal authority.

## 1. Decision principle

The launch plan is derived from law and operating authority, not from the size of the feature backlog.

For every regulated capability:

```text
authoritative source
  -> scoped legal requirement
  -> responsible entity/role
  -> filing/authorization/contract/evidence
  -> implementation control
  -> verification
  -> enabled scope
```

No source or unresolved role means no law-dependent implementation assumption and no public enablement.

The project-wide gate remains:

```text
company_market_service_gate
  AND
partner_person_operator_vehicle_gate
```

The first launch should minimize the second gate by avoiding DROPi-operated fleets, passenger transport, drones, food, regulated goods and informal/non-trader sellers until the corresponding packs are approved.

## 2. Recommended first commercial shape

### 2.1 First public product

The recommended first public Romanian product is:

**C1 controlled Marketplace + integrated parcel logistics through an external effective postal provider, with DROPi acting under an approved intermediary/reseller model if the final ANCOM classification requires it.**

Initial Marketplace restrictions:

- verified professional merchants only;
- low-regulatory-complexity non-food consumer products only;
- seller of record remains the merchant;
- merchant identity and contractual responsibility are visible before purchase;
- no DROPi ownership of merchant inventory;
- no private P2P/community sellers at launch;
- no food, medicines, medical devices, alcohol, tobacco/nicotine, dangerous goods or other specially regulated product family at launch;
- no Passenger Mobility;
- no drone delivery;
- no DROPi-operated rider/driver fleet;
- no Cooperative Hub formation or cooperative-governance service;
- no C2 operational service and no C3/EOC service;
- no DROPi wallet, stored value, legal escrow or custody/control of client money.

This scope deliberately uses the current strongest product foundation — C1 Marketplace, orders, audit, identity and parcel-oriented delivery infrastructure — while excluding domains whose legal and operational gates are materially heavier.

### 2.2 Initial fulfilment modes

The launch design should support two separately governed fulfilment choices:

1. `merchant_pickup_or_merchant_fulfilment`
   - the merchant remains responsible for its own fulfilment arrangement;
   - DROPi must not present an external carrier service as a DROPi postal service unless the approved contract/legal model permits that representation.

2. `dropi_postal_resale_or_orchestration`
   - used only after the exact DROPi role is confirmed;
   - where DROPi offers or resells a postal service, the applicable ANCOM notification and service conditions must be in force before enablement;
   - the effective postal provider must be bound by a written commercial agreement;
   - customer-facing responsibility, complaints, compensation, proof and service conditions follow the approved ANCOM model and contract map.

The code must never silently switch between these two legal models.

## 3. Why this is the recommended first authorization path

Romanian postal regulation provides a materially lighter first logistics route than immediately operating a proprietary multimodal fleet.

ANCOM's current general-authorization procedure states that a person intending to start activity consisting in **offering, reselling or providing postal services** must notify ANCOM no later than the day the activity begins. The notification procedure is described by ANCOM as free of charge and is governed by Decision No. 925/2023.

ANCOM also states that a reseller of postal services must operate under written commercial resale agreements with the effective postal provider and, where it exclusively resells postal services, remains responsible to users for the postal service rather than transferring that responsibility to the effective provider.

Relevant controlled repository sources already include:

- `RO-OUG-13-2013-ANCOM-CONSOLIDATION-2019`;
- `RO-ANCOM-DECISION-925-2023`;
- `RO-ANCOM-GENERAL-AUTHORIZATION-2026-09-12`.

The repository already records `RO-DEL-COMP-001` as `written_confirmation_required`: DROPi must still obtain a scoped determination of whether each proposed flow makes the entity a postal provider, reseller, software intermediary or another contracted party.

Therefore the recommended first **sector authorization workstream** is the Romanian parcel/postal role, not Passenger Mobility, aviation or proprietary motor-vehicle operations.

## 4. Launch legal stack

### 4.1 Entity and tax role — P0

Before filing or coding legal-dependent checkout behavior, the owner must approve one responsible-entity model.

Candidate model for professional review:

- one Romanian operating entity for the Romanian Marketplace/postal service scope;
- seller of record for goods: each verified merchant, not DROPi;
- DROPi revenue: disclosed platform/service fee and, where approved, postal/logistics fee or margin;
- client money: handled by a licensed payment service provider under an approved marketplace/payment architecture;
- no DROPi legal escrow or stored-value wallet;
- no automatic assumption that the owner's residence outside Romania has no tax, management or permanent-establishment consequence.

Required written outputs before approval:

- legal entity recommendation;
- tax residence/management analysis;
- VAT and invoicing allocation;
- CAEN Rev. 3 activity mapping for each actual DROPi activity;
- seller-of-record and title-transfer map;
- platform fee and postal-fee invoicing model;
- responsibility/RACI map.

No CAEN code is itself proof of regulatory authority.

### 4.2 Marketplace/e-commerce — P0

The first Marketplace must be designed as an online marketplace rather than as an undefined `shop`.

Minimum legal domains to reconcile before public checkout:

- Law No. 365/2002 on electronic commerce, as applicable after the DSA implementation changes;
- Regulation (EU) 2022/2065 (Digital Services Act);
- Law No. 50/2024 implementing the DSA in Romania;
- OUG No. 34/2014 on consumer contracts, including the marketplace-specific pre-contractual information in Article 6^1;
- Regulation (EU) 2023/988 (General Product Safety Regulation) for consumer products;
- GDPR and Romanian data-protection implementation requirements;
- unfair-commercial-practices, price/promotion, warranty/conformity and complaint rules applicable to the selected merchant/product model.

The launch UI/contract model must at minimum establish:

- who the merchant/seller is;
- whether the third party is a professional;
- how contractual obligations are divided between merchant and DROPi;
- main ranking parameters where offers are ranked;
- required pre-contract information and total price/cost disclosure;
- withdrawal/return/complaint responsibility where applicable;
- product-safety information required for the selected product family;
- content/product reporting and removal paths required by the applicable DSA/GPSR scope;
- authority and customer contact points.

### 4.3 DSA scope — conditional, not assumed away

DROPi is expected to be small at launch. DSA Article 19 and Article 29 contain exclusions from specified **additional** online-platform/marketplace obligations for qualifying micro and small enterprises, subject to the regulation's conditions and VLOP exception.

That does not remove the DSA entirely. Hosting/intermediary obligations may still apply, including applicable authority/user contact points, terms transparency, illegal-content notice/action handling and other duties outside the excluded sections.

The Romanian DSA authority is ANCOM as Digital Services Coordinator. Current ANCOM guidance should be captured and the required provider-information procedure verified for the final service classification.

Product rule:

`small_business_exemption` must be an evidence-backed, dated classification, never a permanent hard-coded bypass.

### 4.4 Product safety — P0 for goods marketplace

For consumer products in scope of Regulation (EU) 2023/988, an online marketplace has platform-level duties independent of the merchant's own product obligations. The initial low-risk category choice reduces sector-specific requirements but does not eliminate GPSR.

Before public product listing/checkout, the applicable design must cover at least:

- product-safety authority contact;
- consumer safety contact;
- Safety Gate registration where required;
- product/producer/responsible-economic-operator information required by the applicable law;
- recall/withdrawal workflow;
- unsafe-product report, order handling and trader cooperation;
- immutable evidence linking listing state to the compliance evidence reviewed.

### 4.5 Payments — P0, external PSP only

Law No. 209/2019 governs professional payment-service provision and identifies the categories that may provide payment services in Romania.

The Phase-1 rule is therefore:

- use a licensed/eligible PSP architecture;
- DROPi records payment, fee, refund and reconciliation references;
- DROPi does not hold customer funds, issue stored value or advertise legal escrow unless a separate analysis and required authorization expressly permit it;
- seller proceeds, DROPi fee, delivery charge, refunds and chargebacks must be mapped contractually and fiscally before implementation is enabled.

The exact PSP/product is a separate procurement and legal-integration decision.

### 4.6 Postal parcel service — first sector filing/authorization candidate

Before DROPi exposes an integrated delivery service in its own commercial flow:

1. document the exact user-to-merchant-to-DROPi-to-carrier contract flow;
2. obtain the scoped ANCOM/counsel classification required by `RO-DEL-COMP-001`;
3. if DROPi falls within offering/reselling/providing postal services, complete the current ANCOM notification under Decision No. 925/2023;
4. execute the required written carrier/resale agreement;
5. approve the general conditions for the postal service, complaints, liability, compensation, prohibited items, proof and support;
6. capture the authority evidence and effective date;
7. enable only the approved service scope.

This stage intentionally uses an existing effective carrier. It does **not** authorize DROPi's own bicycle, e-bike, scooter, car or van delivery partner network.

## 5. Services explicitly held after first launch

### 5.1 Proprietary delivery-partner network — HOLD

Do not launch self-employed delivery partners merely because the application already has a Delivery Partner role.

Required first:

- Romanian platform-work/worker-status analysis;
- contractor/employment/tax model;
- insurance;
- service contracts;
- exact bicycle/e-bike/scooter/car/van road classification and safety rules;
- mode-specific person/vehicle capability schema;
- operational safety/support/incident process.

The repository already records `GLOBAL-WORK-001` and `GAP-RO-ROAD-MODES` as unresolved.

### 5.2 Food — HOLD

Food introduces additional facility, hygiene, food-information, allergen, traceability, temperature/storage, withdrawal/recall and sector-authority requirements. It is not needed to prove the Phase-1 Marketplace model.

### 5.3 P2P/community/non-trader sellers — HOLD

The first launch should avoid mixing professional merchants with private sellers. P2P changes consumer-rights disclosures, platform classification, tax/reporting and safety/moderation risk. Existing P2P work remains valuable but is not a launch blocker for the first professional-merchant pilot.

### 5.4 Cooperative Hub — HOLD / research continues

`canonical/DROPI_COOPERATIVE_HUB.md` remains a canonical product direction, but implementation is gated. The current #481/#482–#489 Phase-0 program remains independent and does not block the first Marketplace launch.

### 5.5 Passenger Mobility — HOLD

Passenger Mobility remains `PLANNING CANON / NOT LIVE / FAIL-CLOSED` under #460/#453–#459. It is not part of the legal MVP.

### 5.6 Drone delivery — HOLD

Aviation operator, aircraft, pilot, airspace, insurance and actual delivery-CONOPS approval remain separate. Drone delivery is not part of the legal MVP.

### 5.7 C2 and C3 — HOLD

C2 contractual operations and C3 critical/emergency operations remain later stages. Existing scaffolding must not be represented as authority to launch these channels.

## 6. Proposed launch order

| Order | Scope | Outcome required before advancing |
|---:|---|---|
| `L0` | Legal corpus / source control | Current primary source set, gaps and review owners recorded; no stale source treated as approval |
| `L1` | Responsible entity and business-role map | Entity, seller-of-record, tax/VAT, CAEN, fee, liability and contract map approved for design |
| `L2` | Marketplace legal pack | E-commerce/consumer/DSA/GPSR/privacy requirements mapped to product controls |
| `L3` | Payment architecture | Licensed PSP model, no DROPi custody, invoicing/refund/chargeback/reconciliation model approved |
| `L4` | Postal role and ANCOM path | DROPi classified; notification filed if required; written carrier model approved |
| `L5` | Initial category and pilot zone | Low-risk non-food category family and one Romanian pilot geography selected; category/local rules approved |
| `L6` | Launch implementation slice | Only issues necessary for L1–L5 become P0 engineering work |
| `L7` | Assurance | CI, security, privacy, legal traceability, contracts, support and operational acceptance PASS |
| `L8` | Controlled public pilot | Small merchant cohort + restricted catalog + approved fulfilment only |
| `L9` | Expansion | Add product families, own delivery modes, P2P, Cooperative Hub, Passenger Mobility, drone, C2/C3 only through independent gates |

## 7. Roadmap reconciliation rule

The current development backlog must no longer be prioritized only by canonical phase or age.

Every open issue must receive one launch relationship:

- `LAUNCH-P0` — required to lawfully operate the first public pilot;
- `LAUNCH-P1` — required immediately after pilot or to remove a known scaling constraint;
- `FOUNDATION` — reusable technical work that may proceed if it does not presume a blocked legal outcome;
- `LATER-SERVICE` — Passenger Mobility, proprietary mode, food, P2P, Cooperative Hub, C2/C3, drone or another service not included in the legal MVP;
- `HOLD-LEGAL` — implementation depends on unresolved legal/authority evidence;
- `HOLD-OWNER` — requires an explicit owner business decision.

An issue cannot be `LAUNCH-P0` merely because it is visually important. Conversely, a legal/entity/payment/contract requirement may be `LAUNCH-P0` even if it produces no visible UI.

## 8. Immediate reconciliation hypotheses

These are planning dispositions, not issue mutations yet.

| Existing work | Proposed relationship to first legal MVP |
|---|---|
| #362 Marketplace/Profile localization, currency, addresses | Split/reassess: Romanian locale/currency and lawful delivery address capture may be launch-relevant; broad profile polish is not automatically P0 |
| #364 P2P consumable safety/acknowledgement | `LATER-SERVICE` for the first professional/non-food merchant pilot; retain for future P2P/consumables |
| #425 synthetic transport authority | `LAUNCH-P0` invariant if any integrated delivery state is exposed; no unknown mode may become operational authority |
| #396/#426 map-first/live fixed points | likely `LAUNCH-P1` unless the selected external-carrier integration needs DROPi-owned live location for the first pilot |
| #468 Logistics Network truthfulness | `FOUNDATION` / truthfulness; must remain non-live but does not block a carrier-based first launch |
| #476 branch/ruleset protection | `LAUNCH-P0` repository-governance gate before commercial release |
| EPIC-008 Payments & Wallet | re-scope first slice to external PSP + immutable payment/reconciliation ledger; a DROPi wallet is not part of the MVP |
| #481 Cooperative Hub program | `LATER-SERVICE / RESEARCH CONTINUES` |
| #460 Passenger Mobility program | `LATER-SERVICE / HOLD-LEGAL` |
| #258/#259 owned fleet registry | `LATER-SERVICE` for proprietary-fleet activation; not required for an external effective carrier MVP |

The final issue-by-issue reconciliation must be produced only after L1–L5 owner decisions are frozen.

## 9. Required legal evidence pack before implementation reprioritization

The following evidence should be prepared before declaring a final engineering launch backlog:

1. `RO-LAUNCH-ENTITY` — entity/tax/CAEN/responsibility decision memo;
2. `RO-LAUNCH-MARKETPLACE` — marketplace, consumer, DSA and GPSR requirement matrix;
3. `RO-LAUNCH-PAYMENTS` — PSP/settlement/invoicing/refund architecture;
4. `RO-LAUNCH-POSTAL` — ANCOM classification, notification decision and carrier contract model;
5. `RO-LAUNCH-CATEGORY` — first sellable category family and excluded-category list;
6. `RO-LAUNCH-ZONE` — pilot geography and local operational requirements;
7. `RO-LAUNCH-CONTRACTS` — merchant, customer/platform and postal-service terms allocation;
8. `RO-LAUNCH-PRIVACY` — production data map, legal bases, retention and support/incident data boundaries;
9. `RO-LAUNCH-GO-NO-GO` — signed evidence matrix and owner decision.

Each unresolved point remains `NOT YET VALIDATED`; research or this document cannot self-certify legality.

## 10. Current official-source checkpoints used for this proposal

These sources were rechecked on 2026-09-13 for strategy formation. They must be archived/versioned through the legal-source registry before being relied on as approved implementation authority if they are not already controlled there.

- ANCOM — Procedure for authorization of postal-service providers; current page states notification applies to offering, reselling or providing postal services and the procedure is free.
- ANCOM — Decision No. 925/2023; status shown by ANCOM as in force.
- ANCOM — General authorization / postal resale guidance; current page describes written resale agreements and reseller responsibility to users.
- Romanian Legislative Portal — OUG No. 13/2013 on postal services.
- Romanian Legislative Portal — Law No. 365/2002 on electronic commerce.
- Romanian Legislative Portal — OUG No. 34/2014; Article 6^1 contains specific online-marketplace information duties.
- Romanian Legislative Portal — Law No. 50/2024 implementing the DSA in Romania.
- ANCOM — current DSA intermediary-provider guidance and 2026 compliance material.
- EUR-Lex — Regulation (EU) 2022/2065, including Articles 19, 29–31 and applicable hosting/intermediary duties.
- EUR-Lex — Regulation (EU) 2023/988, including Article 22 for online marketplaces.
- Romanian Legislative Portal — Law No. 209/2019 on payment services.
- ONRC — CAEN Rev. 3 structure, including `5320` and `5330` as separate postal/courier activity classes.

## 11. Owner decision requested after evidence build

The proposed strategic decision is:

```text
FIRST ROMANIA LAUNCH =
C1 verified-professional Marketplace
+ low-risk non-food goods
+ licensed external PSP
+ pickup/merchant fulfilment
  and/or ANCOM-approved DROPi postal resale/orchestration
+ external effective postal carrier
+ one controlled pilot geography
```

Everything else remains visible in the long-term architecture but does not control the first launch backlog.

The Product Owner should approve, narrow or reject this launch shape only after the evidence items in Section 9 have been prepared. Until then the status remains `PROPOSED / PRE-COUNSEL / FAIL-CLOSED`.
