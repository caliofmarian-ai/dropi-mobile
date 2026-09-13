# RO-LAUNCH-005 — First Product Family and Romanian Pilot Zone Packet

> **STATUS: RESEARCH / OWNER DECISION REQUIRED / IMPLEMENTATION BLOCKED**
> **Version:** 0.1.0
> **Research cut-off:** 2026-09-13
> **Issue:** #497
> **Parent:** #492
> **Repository baseline:** `08ac65e69028e636fd0ee51db9a9dad1b47be2bc`

This packet narrows the first commercial pilot by comparing category and geography complexity. It does not authorize merchant recruitment, public listing, carrier contracting or launch.

## 1. Pilot objective

The first pilot is not intended to prove every DROPi category or transport mode. It should prove the smallest legally controlled loop:

```text
verified professional merchant
  -> compliant listing
  -> Romanian consumer checkout
  -> external PSP
  -> merchant fulfilment or approved postal flow
  -> delivery / proof
  -> withdrawal / complaint / refund / recall capability
  -> reconciliation / audit
```

The selected category should minimize sector-specific regulation and physical-delivery complexity while still allowing real merchants and customers to test the Marketplace.

## 2. Category risk evidence

The European Commission's 2025 Safety Gate report recorded 4,671 dangerous-product alerts. The most frequently reported categories were:

- cosmetics — 36%;
- toys — 16%;
- electrical appliances/equipment — 11%.

This does not prove that other categories are safe. It is strong evidence that these three categories are poor choices for a deliberately low-complexity first pilot.

## 3. Product-family candidates

### Candidate A — paper stationery, art prints and simple paper goods

Examples:

- notebooks and paper stationery;
- greeting cards;
- posters/art prints;
- paper organizers and similar simple goods.

Explicit exclusions:

- children's craft/toy products;
- electronic accessories;
- chemical art supplies, paints/solvents/adhesives unless separately approved;
- products making health/safety claims;
- regulated documents/tickets/certificates.

Advantages:

- compact, simple parcel shipping;
- low breakage compared with fragile craft goods;
- no food/cold-chain/medical/cosmetic/electrical system by default;
- suitable for small professional producers/designers;
- simple returns and inventory identification.

Residual controls:

- GPSR and Marketplace Article 22 controls still apply where in scope;
- manufacturer/responsible-person/product-identification/warnings where applicable;
- general consumer/conformity/withdrawal rules;
- materials/chemical rules if the item contains regulated substances.

**Rank: 1 — recommended first family for legal/operational simplicity.**

### Candidate B — non-electrical decorative artisan goods

Examples:

- simple decorative wood/ceramic/textile objects;
- wall décor;
- non-electrical ornaments.

Explicit exclusions:

- food-contact articles;
- candles/open-flame products;
- children's products/toys;
- electrical/lighted products;
- cosmetics/body-contact preparations;
- structural/furniture safety-critical products;
- antiques or cultural goods requiring special provenance/export treatment.

Advantages:

- aligns with future local-producer/artisan strategy;
- can prove provenance and small-producer onboarding.

Disadvantages:

- breakage/material/warning variability;
- handmade-item consistency and batch/product identification are harder;
- product-safety analysis varies by construction/material.

**Rank: 2 — good Phase 1b after the paper-goods flow works.**

### Candidate C — adult apparel and simple textile accessories

Examples:

- adult clothing;
- scarves/bags/simple textile accessories.

Explicit exclusions:

- children's clothing/product safety cases;
- protective clothing/PPE;
- medical/compression claims;
- heated/electronic textiles.

Advantages:

- online demand is strong: Eurostat reports clothing/shoes/accessories as the most common online goods category in Europe, and Romanian online shoppers historically show high participation in clothing purchases.

Disadvantages:

- textile-fibre labelling rules;
- sizing/fit creates higher return frequency;
- product variants complicate stock and returns;
- safety issues remain possible.

**Rank: 3 — commercially attractive, but not the simplest compliance/returns pilot.**

### Excluded from first pilot

The following are not candidates for Phase 1:

- food and beverages;
- food supplements;
- cosmetics/personal-care preparations;
- toys/children-targeted products;
- electrical/electronic products and batteries;
- medical devices/medicines;
- alcohol;
- tobacco/nicotine products;
- chemicals/cleaning products/pesticides;
- dangerous goods;
- automotive safety-critical parts;
- PPE;
- weapons;
- live plants/animals or phytosanitary-regulated goods;
- products with controlled cultural/export provenance.

An exclusion is a launch-scope decision, not a statement that DROPi can never support the category.

## 4. Recommended first catalog scope

Proposed Phase 1 category:

**`PAPER_STATIONERY_ART_PRINTS`**

with a closed allowlist rather than a broad `Home & Lifestyle` category.

Candidate rule:

```text
listing.categoryFamily == PAPER_STATIONERY_ART_PRINTS
AND productSafetyPack == approved_v1
AND merchantCategoryCapability.active
```

Anything outside the explicit allowlist stays `catalog_locked` until a later category pack is approved.

## 5. Romanian demand context

Eurostat reports continued growth of e-commerce in Romania, although adoption remains below the EU leaders. In 2024, 60% of Romanian internet users had bought or ordered online in the previous 12 months, up strongly from 2014; 2025 data continue the long-term growth trend.

For a pilot, the practical objective is not maximum national market share. It is enough to select a zone where:

- digital payment adoption is usable;
- enough professional merchants can be recruited;
- external carrier coverage is strong;
- support/returns can be observed closely;
- delivery cost/time can be kept predictable.

## 6. Pilot-geography candidates

### Candidate 1 — București–Ilfov, restricted service area

Evidence supporting the candidate:

- Eurostat regional digitalisation data distinguish București–Ilfov from most Romanian regions on digital-finance readiness indicators;
- it is the country's largest dense consumer/merchant market;
- external courier infrastructure is strongest here;
- Sameday currently advertises same-day service specifically for Bucharest and surrounding localities;
- nationwide next-day providers can also serve the area.

Risks:

- operational demand may be too high if the pilot opens broadly;
- merchant/category variability is high;
- customer-support load can hide product defects behind volume.

Mitigation:

- use an explicit postal-code/locality allowlist;
- cap merchant cohort and active SKUs;
- cap daily orders during controlled pilot;
- use one approved carrier/fulfilment model first.

**Rank: 1 — recommended demand/logistics pilot, but only as a restricted cohort/zone, not a full capital-city launch.**

### Candidate 2 — a single secondary-city pilot

Potential examples for later owner comparison: Brașov, Cluj-Napoca, Iași, Timișoara, Galați or another city where merchant demand is evidenced.

Advantages:

- easier cohort/support management;
- lower order spike risk;
- useful for learning before national expansion.

Disadvantages:

- no city should be chosen from intuition alone;
- merchant supply and local digital demand need evidence;
- same-day carrier features may be weaker than București–Ilfov.

**Rank: 2 — good if merchant recruitment evidence is stronger than in București.**

### Candidate 3 — national launch using next-day carrier

Carrier networks can cover most/all Romania; FAN Courier states 100% nationwide coverage and Sameday advertises Next Day service across more than 13,800 localities.

This is operationally possible but strategically inappropriate for Phase 1 because:

- support/returns geography becomes broad immediately;
- local delivery exceptions and extra-kilometre/access rules vary;
- merchant/catalog moderation scales before the compliance flow is proven;
- incident/recall communication becomes nationwide.

**Rank: 3 — reject for first controlled pilot.**

## 7. Recommended pilot-zone decision

Proposed zone:

**`BUCHAREST_ILFOV_CONTROLLED_PILOT`**

with these limits to define before implementation:

- exact allowed postal codes/localities;
- one approved external carrier model;
- merchant cohort limit;
- SKU/listing limit;
- daily-order limit;
- customer-support coverage;
- return/withdrawal route;
- excluded difficult-access/extra-cost destinations;
- pilot start/end/review dates.

This recommendation must be replaced if actual merchant recruitment evidence shows a secondary city gives a materially better controlled cohort.

## 8. Merchant-demand evidence required before final owner approval

Do not contact merchants without owner authorization. Before final selection, prepare a non-binding evidence plan:

- target number of candidate merchants in selected category;
- business registration/category fit;
- willingness to use PSP onboarding;
- current delivery method and volume;
- willingness to provide product-safety/manufacturer data;
- expected SKU count;
- expected weekly orders;
- return/complaint process maturity;
- carrier pickup availability;
- willingness to accept DROPi fees/terms.

After owner approval, outreach can validate whether the category/zone is commercially viable.

## 9. Pilot readiness gates

```text
categoryPack.approved
AND zonePack.approved
AND merchantCohort.verified
AND paymentPack.approved
AND fulfilmentPack.approved
AND marketplaceLegalPack.approved
AND supportAndReturns.ready
AND safetyGate.ready
AND ownerGoNoGo == GO
```

## 10. Expansion order after successful pilot

Candidate sequence:

1. add more merchants/SKUs within the same approved category/zone;
2. expand approved delivery geography with the same carrier/legal model;
3. add Phase 1b non-electrical decorative artisan goods;
4. add adult apparel/textile accessories after labelling/returns pack;
5. only then assess higher-risk categories independently;
6. food, P2P, own-fleet delivery, Passenger Mobility, drones and Cooperative Hub remain independent programs.

## 11. Required source/control follow-up

#499 should capture:

- current GPSR/Safety Gate materials;
- selected category-specific EU/Romanian rules;
- selected carrier coverage/service evidence;
- local-zone restrictions only where they materially affect the selected flow.

#500 should not classify national-scale features as first-launch P0 merely because they exist in the long-term roadmap.

## 12. Current disposition

| Decision | State |
|---|---|
| First family: paper stationery/art prints/simple paper goods | `RECOMMENDED / OWNER + LEGAL CATEGORY REVIEW REQUIRED` |
| Decorative artisan goods | `PHASE 1B CANDIDATE` |
| Adult apparel/textile accessories | `LATER CATEGORY CANDIDATE` |
| Cosmetics/toys/electrical | `EXCLUDED FROM FIRST PILOT` |
| Pilot geography: restricted București–Ilfov | `RECOMMENDED / COHORT EVIDENCE REQUIRED` |
| National launch | `REJECTED FOR FIRST PILOT` |
| Merchant outreach | `NOT AUTHORIZED BY THIS PACKET` |

This packet supplies the proposed category/zone decision for #492. It does not authorize public launch or merchant engagement.