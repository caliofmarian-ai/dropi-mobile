# RO-LAUNCH-007 — Official Source Findings — 2026-09-15

> **STATUS: PRE-COUNSEL / FAIL-CLOSED / OFFICIAL-ENDPOINT VERIFICATION**
> **Issue:** #499
> **Parent:** #492
> **Governing canon:** `canonical/LEGAL_COMPLIANCE_SOURCE_OF_TRUTH.md`

This checkpoint records launch-critical official sources verified on 2026-09-15 and the product consequences that can safely be carried into the controlled research queue.

It does **not** promote any requirement to `approved_for_design`, does not represent legal advice, and does not convert an official web endpoint into an immutable repository snapshot. A source remains `missing_primary_copy` / `pending_primary_copy` until the legal-source register and validator requirements are satisfied.

## 1. Romania postal services / candidate resale model

### Verified official sources

- ANCOM — General authorization for postal services:
  - https://www.ancom.ro/category/autorizare-ro/autorizare-generala-servicii-postale/
- ANCOM — Authorization procedure:
  - https://www.ancom.ro/autorizare-ro/autorizare-generala-servicii-postale/procedura-de-autorizare-a-furnizorilor/
- ANCOM — Digital platforms reselling postal services:
  - https://infocentru.ancom.ro/platformele-digitale-care-revand-servicii-postale/
- ANCOM — 2024 notice on obligations of digital postal-resale platforms:
  - https://www.ancom.ro/despre-noi/media/comunicate-de-presa/obligatiile-platformelor-digitale-care-revand-servicii-postale/
- ANCOM — Register/list of postal resellers:
  - https://www.ancom.ro/reglementare-ro/servicii-postale/furnizori-servicii-postale/furnizori-servicii-postale-revanzatori/
- Romanian Legislative Portal — OUG 13/2013 official act/consolidation interface:
  - https://legislatie.just.ro/Public/DetaliiDocumentAfis/217438

### Verified facts suitable for research gating

ANCOM currently states that any person intending to begin an activity consisting of the **offering, resale or provision** of postal services must notify ANCOM no later than the day the activity starts. ANCOM also states that exclusive postal resale may operate only under written commercial resale agreements with effective postal-service providers and that the authorized reseller remains responsible to users for the postal service it resells.

ANCOM's digital-platform guidance further requires a postal-resale platform to state clearly that effective performance is carried out by one or more postal providers and to identify at least the provider collecting the shipment from the sender.

### Product consequence

Keep these states separate in code and contracts:

1. merchant-managed fulfilment;
2. technical carrier comparison/intermediation;
3. DROPi postal resale;
4. later DROPi postal provision with own/contracted delivery network.

`postalResaleEnabled` cannot be a generic feature flag. Activation must be bound to entity, ANCOM notification/authority evidence, resale contract(s), effective provider(s), customer terms, geography and policy version.

### Remaining blocker

The repository's existing OUG 13/2013 snapshot is the ANCOM unofficial consolidation through 2019. The Legislative Portal endpoint was identified, but a controlled current primary snapshot has not yet been archived and hashed. `GAP-RO-DEL-ROLE` therefore remains open.

## 2. Marketplace / Romanian consumer distance contracts

### Verified official sources

- OUG 34/2014 — current Legislative Portal view:
  - https://legislatie.just.ro/Public/DetaliiDocument/257047
- OUG 18/2026 — amending act:
  - https://legislatie.just.ro/Public/DetaliiDocumentAfis/308474

### Verified facts suitable for research gating

OUG 34/2014 Article 6^1 requires an online-marketplace provider, before a distance contract or similar offer becomes binding, to provide clear information including:

- the main parameters determining ranking and their relative importance;
- whether the third-party seller is a professional;
- where the seller is not a professional, that consumer-protection rights arising from applicable consumer law do not apply to that contract;
- where applicable, how contract-related obligations are shared between the third party and the online-marketplace provider.

For the candidate first launch, DROPi already proposes professional merchants only; that does **not** remove the duty to represent seller status truthfully and to disclose responsibility allocation where required.

OUG 18/2026 introduced Article 11^1 into OUG 34/2014. For distance contracts concluded through an online interface, the professional must provide an online withdrawal function, keep it visibly/easily accessible throughout the withdrawal period, provide an unambiguous confirmation function and send durable-medium acknowledgement containing the withdrawal content plus date/time. The OUG 18/2026 application rule makes the relevant Article II point 13 applicable from **19 June 2026**.

Other OUG 18/2026 amendments, including parts of the new durability/repairability information framework and amended electronic checkout information, have application dates including **27 September 2026**. Since DROPi's first launch cannot reasonably rely on a pre-27-September-2026 design, the Marketplace control pack should be designed against the post-27-September applicable requirements rather than intentionally creating a short-lived legacy checkout.

### Product consequence

Before a first binding consumer order, the scoped Marketplace must have an approved control contract covering at least:

`merchant onboarding -> listing -> ranking/search disclosure -> product page -> checkout -> durable confirmation -> withdrawal/return -> complaint/conformity -> refund -> audit evidence`.

The online withdrawal function is not a future enhancement for a launch after 19 June 2026 when the statutory condition applies.

## 3. Digital Services Act / Romanian implementation

### Verified official sources

- Regulation (EU) 2022/2065 (DSA):
  - https://eur-lex.europa.eu/eli/reg/2022/2065/oj
- Law 50/2024 — Romanian DSA implementation:
  - https://legislatie.just.ro/public/DetaliiDocument/280106

### Verified facts suitable for research gating

DSA Article 19 excludes qualifying micro/small online-platform providers from the additional obligations in Section 3, except Article 24(3), subject to the Regulation's conditions and the VLOP exception. DSA Article 29 similarly excludes qualifying micro/small providers of online platforms allowing consumers to conclude distance contracts with traders from Section 4, again subject to the Regulation's conditions and the VLOP exception.

This means Article 30 trader traceability must **not** be described in the DROPi canon as automatically applicable to a micro/small first-launch entity without the enterprise-size analysis. It is nevertheless permissible for DROPi to impose verified-professional-merchant onboarding as a stricter launch policy or because another applicable law/control requires particular evidence; the source of each field must be labelled correctly.

The micro/small exclusions do not erase all DSA obligations. The exact DROPi service classification and applicable duties outside the excluded sections remain part of #494 and qualified review.

Law 50/2024 establishes Romanian measures for application of the DSA and the national Digital Services Coordinator framework.

### Product consequence

Do not hardcode one undifferentiated `DSA compliant` boolean. Store at least service classification, enterprise-size determination, effective review date, applicable DSA obligation set and any later loss-of-small-enterprise transition state.

## 4. General Product Safety Regulation / Marketplace product safety

### Verified official sources

- Regulation (EU) 2023/988 (GPSR):
  - https://eur-lex.europa.eu/eli/reg/2023/988/oj
- Consolidated GPSR text dated 2026-05-29:
  - https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02023R0988-20260529

### Verified facts suitable for research gating

GPSR Article 22 establishes specific duties for providers of online marketplaces related to product safety, including:

- an authority contact point and Safety Gate Portal registration;
- a consumer product-safety contact point;
- internal product-safety processes;
- handling market-surveillance orders;
- processing product-safety notices without undue delay and in any event within three working days under the Article 22 framework;
- interface design enabling required product-safety information to be supplied and displayed/accessed on listings.

### Product consequence

Even if DROPi qualifies for DSA micro/small exclusions, the GPSR Marketplace layer must be analysed independently. First-launch category selection should therefore remain a closed allowlist, and the listing schema must be capable of product/economic-operator identification and safety information required for the selected products.

## 5. Payment-services perimeter

### Verified official source

- Law 209/2019:
  - https://legislatie.just.ro/Public/DetaliiDocument/219736

### Verified fact suitable for research gating

Law 209/2019 regulates access to professional payment-service provision and identifies the permitted categories of payment-service providers. This supports the conservative first-launch architecture already proposed in #495: use an eligible external PSP and avoid DROPi possession/safeguarding of customer funds, stored value or an internally marketed legal `escrow` function unless separately validated.

### Product consequence

The developer should build a provider abstraction, transaction references, fee allocation, refund state and reconciliation evidence. A DROPi-held customer wallet is **not** a first-launch prerequisite.

The exact selected PSP, money-flow terms and legal perimeter still require provider-specific and qualified review.

## 6. Romanian GDPR implementation

### Verified official source

- Law 190/2018:
  - https://legislatie.just.ro/Public/DetaliiDocument/203151

### Product consequence

The existing archived GDPR source remains only the EU baseline. Romania-launch privacy design must add Law 190/2018 plus current ANSPDCP/EDPB operational material and must map roles, legal bases, retention, access and deletion/legal-hold rules per data flow. A generic privacy-policy checkbox does not satisfy this architecture.

## 7. CAEN Rev.3 — official ONRC evidence

### Verified official sources

- ONRC — CAEN Rev.3 complete structure:
  - https://www.onrc.ro/documente/caen/CAEN_Rev.3_structura_completa.pdf
- ONRC — Monitorul Oficial publication of CAEN Rev.3:
  - https://www.onrc.ro/documente/caen/Monitorul_Oficial_385_CAEN_Rev.3.pdf
- ONRC — Rev.2 / Rev.3 correspondence table:
  - https://www.onrc.ro/documente/anunturi/Corespondenta-CAEN-Rev.2-CAEN-Rev.3.pdf

### Verified classification facts

The official ONRC-hosted CAEN Rev.3 material identifies:

- `4791` — Intermedieri în comerțul cu amănuntul nespecializat;
- `4792` — Intermedieri în comerțul cu amănuntul specializat;
- `5320` — Alte activități poștale și de curier;
- `5330` — Servicii de intermediere pentru activități poștale și de curier.

ONRC's correspondence material describes `5330` as postal/courier intermediation by bringing clients and providers together for a fee/commission **without the intermediary itself providing the postal/courier service**.

### Product consequence

CAEN labels can help model roles but cannot decide the ANCOM legal classification by themselves. In particular, `5330` must not be used as a shortcut to label a factual postal-resale flow as mere intermediation.

The existing `RO-INSSE-CAEN-REV3` source entry should be updated to reference the now-identified official ONRC-hosted copy or a new ONRC evidence entry should be added. Until the bytes are archived and the entity/activity mapping receives accountant/ONRC confirmation, #493 remains gated.

## 8. Launch architecture consequence of this checkpoint

Nothing found in this checkpoint justifies expanding the first launch. It strengthens the existing narrow hypothesis:

1. Romanian operating entity and exact seller/platform roles;
2. controlled professional-merchant Marketplace;
3. narrow low-complexity non-food allowlist;
4. regulated external PSP;
5. merchant fulfilment first;
6. optional DROPi postal resale only after ANCOM classification/notification/contracts;
7. restricted pilot geography;
8. own delivery network only after the first legal/operational layer is proven.

The ordering is a **candidate operating strategy**, not a legal approval.

## 9. Remaining source-capture work

P0 unresolved source/evidence work after this checkpoint:

- archive/hash the current authoritative OUG 13/2013 text and reconcile it with Decision 925/2023/current ANCOM guidance;
- archive/hash OUG 34/2014 and OUG 18/2026;
- archive/hash DSA, Law 50/2024, consolidated GPSR, Law 209/2019 and Law 190/2018;
- archive/hash official CAEN Rev.3 and correspondence material;
- obtain current ANCOM DSA operational guidance, ANSPDCP/EDPB operational privacy guidance and selected provider evidence;
- produce exact provision-to-control rows and professional-review answers before any requirement is promoted to `approved_for_design`.
