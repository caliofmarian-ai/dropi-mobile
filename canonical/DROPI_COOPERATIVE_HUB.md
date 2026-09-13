# DROPi Cooperative Hub — Canonical Product Proposal

> **STATUS: PROPOSED CANONICAL — OWNER REVIEW REQUIRED**
> **Version:** 0.1.0
> **Research checkpoint:** 2026-09-13
> **Primary scope:** C1 controlled Marketplace for small local producers
> **Later integration gate:** C2 contractual B2B and cross-border trade
> **Delivery type:** research and product-governance only; no implementation is authorized by this document

## 1. Decision requested

Create **DROPi Cooperative Hub** as a separate, bounded service inside the DROPi ecosystem for small local producers who want to:

- understand whether a cooperative fits their needs;
- find compatible founding members;
- prepare and track the legal formation process with qualified partners;
- apply to join an existing cooperative;
- operate a verified cooperative storefront in the controlled C1 Marketplace;
- pool supply while preserving producer- and lot-level traceability;
- become ready for wholesale, institutional and cross-border sales through later C2 gates.

The Hub is a distinct product capability, **not a new standalone marketplace, repository or legal entity controlled by DROPi**. It must reuse DROPi identity, organization access control, Marketplace, order, audit, payment, notification and multimodal logistics capabilities.

The cooperative remains an independent legal person owned and democratically controlled by its members. DROPi supplies technology, workflow, logistics and partner coordination. DROPi does not own the cooperative, appoint its governing bodies, exercise member votes or replace its legal representatives.

## 2. What a cooperative means

In plain language, a cooperative is a business that several people create and own together in order to solve a shared economic problem. Small producers may use it to buy inputs together, share equipment or storage, aggregate quantities, process or package products, negotiate with larger buyers, sell through one commercial channel and distribute results under rules approved by the members.

The internationally accepted model is a voluntary, autonomous, jointly owned and democratically controlled enterprise. In a primary cooperative, equal member voting is a core principle; invested capital alone should not turn one member into the owner of the others.

Membership therefore has two dimensions:

1. **Legal membership** — shares or contributions, rights, duties, voting and acceptance under the cooperative's constitutive act and statute.
2. **Platform access** — the account, permissions and tools used in DROPi.

A DROPi account does not create legal membership. A legal membership decision does not become valid merely because a platform administrator changes a status.

## 3. The communist-era distinction

Modern cooperatives must not be presented as a return to the communist collective farm.

Romania's agricultural collectivization between 1949 and 1962 was a state-directed transformation associated with coercion, loss of private control and political command. That historical experience explains why the word *cooperativă* may create distrust.

The modern legal and product model is the opposite on the essential points:

| Communist collectivization | Modern member cooperative |
|---|---|
| State-directed participation | Voluntary entry under applicable law and statute |
| Political or administrative control | Member control and elected governance |
| Loss of meaningful private control | Cooperative and member property governed by contract and law |
| Central plan | Member-approved business plan |
| Exit constrained by the regime | Entry, withdrawal and exclusion governed by current law and statute |
| No independent digital audit chosen by members | Transparent member ledger, resolutions and auditable transactions |

DROPi onboarding must include this distinction in neutral language. It must not use communist symbols, terminology such as CAP/GAC as a product label, or claims that minimize the harm caused by forced collectivization.

## 4. Target users and problem

The initial target is the small producer already eligible, or capable of becoming eligible, to operate in the controlled C1 Marketplace, including:

- farmers and food producers;
- beekeepers and other primary producers;
- small processors, subject to sector authorization;
- artisans and makers;
- local producer businesses that cannot individually supply stable wholesale quantities;
- existing cooperatives that need a digital storefront, member workflow and traceable pooled fulfilment.

The Hub addresses four recurring constraints:

1. fragmented supply and inconsistent quantities;
2. weak bargaining power and limited access to larger buyers;
3. formation and governance complexity;
4. missing traceability, compliance and settlement infrastructure for pooled sales.

It does **not** convert an occasional P2P seller into a commercial producer and does not legalize an unauthorized activity. Existing C1 limits for private P2P and community offers remain unchanged.

## 5. Legal route model for Romania

The onboarding assessment must branch before any formation workflow. It must not present one generic `Create cooperative` path.

### Route A — Agricultural cooperative

Use the route based on **Law no. 566/2004 on agricultural cooperation** when the planned members and activities fall within its scope. The current law describes agricultural cooperatives as autonomous private-law entities and includes service, joint purchasing/sales, processing and other agricultural cooperation forms. A cooperative is constituted and operates with at least five persons.

The MVP should support only a first-degree formation/readiness path. Higher-degree structures, unions and complex reorganizations remain expert-led future cases.

### Route B — Society cooperative

Use the route based on **Law no. 1/2005 on the organization and functioning of cooperation** for eligible non-agricultural producer models such as craft or valorification cooperatives. The law includes craft and valorification forms, autonomous member control and a minimum of five members.

The precise form, permitted membership, activities, CAEN Rev. 3 codes, capital, authorizations and constitutive clauses must be selected by a qualified Romanian lawyer and accountant for the actual case.

### Routes not treated as equivalents

- An association under Government Ordinance no. 26/2000 is not the default vehicle for continuous pooled commercial sales: its direct economic activities must remain accessory and closely linked to its main purpose.
- Recognition as a producer group or producer organization under Government Ordinance no. 37/2005 and sector rules is a separate, later status. It is not a substitute for creating the underlying legal entity.
- A European Cooperative Society, grant application, federation or higher-degree cooperative is outside the MVP.

### Legal-route output

The assessment produces only one of these results:

- `LIKELY_AGRICULTURAL_COOPERATIVE`;
- `LIKELY_SOCIETY_COOPERATIVE`;
- `EXPERT_REVIEW_REQUIRED`;
- `COOPERATIVE_NOT_RECOMMENDED`.

The word `LIKELY` is mandatory until a qualified professional accepts the case. DROPi must never issue legal advice or guarantee registration.

## 6. Product boundary

DROPi Cooperative Hub is a bounded context under C1 Marketplace with controlled downstream access to C2.

| Surface or service | Cooperative Hub responsibility |
|---|---|
| Public C1 Marketplace | Cooperative profile, verified seller identity, product discovery, provenance and controlled order initiation |
| Private producer workspace | Readiness assessment, group matching, formation tasks, document requests and application tracking |
| Private cooperative workspace | Members, roles, resolutions, catalog, pooled supply, allocations, orders, settlements and compliance |
| Operational Core | Validated order intake, preparation/READY gates, multimodal delivery, proof, fallback and execution audit |
| C2 B2B | Wholesale account, buyer contract and recurring volume integration after readiness approval |
| Export readiness | Product-and-destination checks; documentation handoff to customs, tax and sector specialists |

Public Marketplace discovery must remain separable from the Operational Core in accordance with `docs/planning/C1_MARKETPLACE_POSITIONING_RESOLUTION.md`. Private cooperative administration may be available in the app, but public product browsing is not an execution responsibility.

## 7. DROPi role and non-negotiable red lines

DROPi may:

- provide education and structured readiness questions;
- match producers who explicitly opt in and meet compatibility rules;
- provide document checklists and a secure workspace;
- connect the group with lawyers, accountants, notaries, certifiers, laboratories or other specialists;
- transmit documents when a qualified partner and the applicants authorize it;
- verify registration and marketplace evidence;
- provide catalog, order, traceability, settlement-ledger and logistics software;
- provide B2B lead, fulfilment and export-readiness tools.

DROPi must not:

- be a founding member merely to control the cooperative;
- own member voting rights or override the general assembly;
- act as lawyer, accountant, notary, customs representative or public authority unless separately authorized and contracted;
- mark an organization as registered based on self-declaration alone;
- promise registration, grants, tax exemptions, sales volume, export access or profit;
- treat member production as DROPi inventory;
- hold or control client funds without a documented regulatory basis and required authorization;
- use the word `cooperative` for an unregistered informal group in public seller identity.

## 8. Formation lifecycle

The authoritative formation state machine is:

```text
IDEA_GROUP
  -> PRE_FORMATION
  -> PROFESSIONAL_REVIEW
  -> DOCUMENTS_READY
  -> FILED_ONRC
  -> REGISTERED
  -> VERIFIED_DROPI
  -> MARKETPLACE_ACTIVE
  -> B2B_READY
  -> EXPORT_READY
```

Rules:

- A state may advance only when its evidence requirements are satisfied.
- `FILED_ONRC` means submitted, not registered.
- `REGISTERED` requires official registration evidence.
- `VERIFIED_DROPI` requires current trader, bank-account, representative and authorization checks.
- `MARKETPLACE_ACTIVE` is granted per organization and permitted product category.
- `B2B_READY` requires capacity, contracting and fulfilment checks.
- `EXPORT_READY` is never a global badge; it is scoped to organization + product + destination + validity period.
- Rejection, expiry, suspension and remediation must be modeled explicitly; no state is permanent merely because it was once approved.

Minimum evidence bundles are versioned. Each document must record issuer, subject, issue date, expiry where applicable, verification source, reviewer and review timestamp.

## 9. Joining an existing cooperative

The platform membership workflow is:

```text
APPLIED
  -> IDENTITY_AND_ELIGIBILITY_PENDING
  -> DOCUMENTS_PENDING
  -> COOPERATIVE_DECISION_PENDING
  -> CAPITAL_OR_CONTRIBUTION_PENDING
  -> ACTIVE_MEMBER
```

Alternative terminal or temporary states include `REJECTED`, `WITHDRAWN`, `SUSPENDED`, `EXIT_PENDING` and `FORMER_MEMBER`.

The cooperative's legally competent body decides the application according to the applicable law and its constitutive act. DROPi records the decision and evidence; it does not make the decision. Where applicable, the workflow must capture subscribed shares/contribution and proof of payment without turning the DROPi status into the legal source of membership.

An active member may retain an individual DROPi store only if the cooperative's statute, supply mandate and competition rules permit it. The same stock or lot must not be offered twice through individual and cooperative channels.

## 10. Governance workspace

The private cooperative workspace should eventually support:

- member register and eligibility evidence;
- elected roles and time-bounded mandates;
- general assembly notices, agenda, quorum and attendance;
- resolutions and immutable resolution versions;
- voting records appropriate to the legal form and statute;
- declared conflicts of interest;
- admission, withdrawal, suspension and exclusion cases;
- capital/share ledger references;
- member supply mandates and commercial rules;
- policy acknowledgement and member training;
- audit export for authorized reviewers.

The platform is a system of record for evidence and workflow, not the source of powers that the law or statute assigns to a governing body. Electronic meetings, signatures and votes may be activated only after a legal-validity assessment for the selected route and document type.

## 11. Marketplace seller model

For a cooperative listing, the default commercial model is:

- **seller of record:** the verified cooperative legal entity;
- **invoice issuer:** the entity identified by the approved tax/legal model;
- **public store:** the cooperative storefront;
- **source of goods:** one or more identified member production lots;
- **contract and consumer responsibility:** allocated explicitly in terms, listing and order records;
- **DROPi role:** marketplace and logistics service provider, subject to the final contractual model.

The buyer must see who sells the product before purchase. A generic `local producers` label is insufficient.

The final legal design must answer, without ambiguity:

1. Who owns each lot before sale?
2. When, if ever, does title transfer to the cooperative?
3. Who sets the price?
4. Who invoices and accounts for VAT or other taxes?
5. Who handles conformity, withdrawal, returns, complaints and recalls?
6. Who bears loss, spoilage and failed-delivery risk at each state?
7. How is the net amount allocated among members and reserves?

No cooperative commerce may go live while any of these answers is unresolved.

## 12. Payments and settlement

The historical Marketplace financial source says that DROPi may retain client funds in an escrow/facilitator model. That wording is **not implementation-ready as written**.

For Cooperative Hub, the default architecture is:

1. a licensed payment service provider receives and safeguards the payment;
2. the order ledger separates product price, delivery, Marketplace fee, taxes, refund reserve and other disclosed charges;
3. release or split rules follow the approved seller-of-record and cancellation model;
4. DROPi records the ledger and reconciliation identifiers but does not take possession or control of client funds unless a dedicated legal analysis establishes a lawful model and all required authorization is obtained;
5. cooperative-to-member allocation occurs through the cooperative's approved settlement rules and bank/accounting process.

An `escrow-like` customer experience must never be marketed as legal escrow unless the actual arrangement supports that term.

No cash, off-platform payment or hidden settlement may be used to bypass audit, consumer protection, tax or platform fees.

## 13. Pooled supply and traceability

A cooperative product may aggregate supply, but traceability must not be aggregated away.

Each sellable unit or batch must link, as applicable, to:

- cooperative;
- contributing member;
- source production lot;
- product and variant;
- quantity and unit;
- production, harvest or manufacturing date;
- facility and relevant authorization;
- certifications and validity;
- custody and transformation events;
- pooled batch;
- order and recipient;
- withdrawal or recall case.

The minimum chain is:

```text
Member production lot
  -> accepted cooperative lot
  -> pooled or processed batch
  -> cooperative listing allocation
  -> order line
  -> delivery proof / buyer
```

Pooled inventory rules must prevent double allocation, negative stock and substitution with an unapproved lot. For food, the system must support one-step-back/one-step-forward traceability and targeted withdrawal/recall workflows.

Public provenance must balance transparency and personal-data minimization. The buyer may see producer, locality, lot and certification information when justified; private identity documents, precise home coordinates, bank data and internal governance records remain restricted.

## 14. Required platform model changes before implementation

The current implementation models `stores.ownerId` as one required user owner. That is sufficient for an individual merchant but not for a member-owned legal organization.

Implementation planning must introduce an organization authority model rather than adding a `cooperative` boolean to `stores`.

Candidate domain entities are:

| Entity | Purpose |
|---|---|
| `CooperativeOrganization` | Legal identity, route, registration, representatives and verification state |
| `OrganizationRoleAssignment` | User-to-organization roles with scope and validity |
| `FormationCase` | Readiness, professionals, tasks, submissions and evidence |
| `MembershipApplication` | Applicant request and cooperative decision workflow |
| `CooperativeMember` | Legal membership state and share/contribution references |
| `GeneralAssembly` | Convening, quorum, agenda and evidence |
| `Resolution` / `Vote` | Versioned governance decision and legally permitted voting evidence |
| `SupplyMandate` | Member authorization, product scope, pricing and exclusivity rules |
| `MemberProductionLot` | Producer-level origin and compliance data |
| `PooledInventoryBatch` | Aggregated stock without losing source-lot lineage |
| `CooperativeListing` | Organization-owned commercial offer linked to lots |
| `SettlementLedger` | Order-level amounts, PSP references and member allocation |
| `ComplianceDocument` | Issuer, scope, validity and verification history |
| `RecallCase` | Affected lots, orders, notices and authority cooperation |
| `B2BExportReadiness` | Product/destination-specific readiness and expiry |

This model must integrate with existing Marketplace entities; it must not duplicate products, orders, audit logs, notifications or delivery orchestration.

## 15. Compliance gates

### 15.1 Trader and Marketplace gate

Before a cooperative can sell, DROPi must verify the legal entity, representative authority, trade-register data, contact details, payment-account ownership and applicable self-certifications or supporting evidence. The exact Digital Services Act duties, including trader traceability, must be assessed against DROPi's size and service classification; micro/small exclusions must not be assumed forever.

### 15.2 Product-safety gate

Non-food consumer products require category-specific safety data, responsible economic-operator information where applicable, warning and recall processes, and Marketplace cooperation capabilities under the General Product Safety Regulation and sector rules.

### 15.3 Food gate

Food activation is per product category and facility, not merely per cooperative. The system must support:

- food-business registration/authorization evidence as applicable;
- hygiene and control-plan evidence appropriate to the activity;
- mandatory food information before distance purchase;
- allergen and storage information;
- batch traceability;
- withdrawal, recall and consumer notification;
- cold-chain or time/temperature controls where required.

The cooperative label does not replace DSVSA, food-hygiene, labeling, organic, geographical-indication or other sector requirements.

### 15.4 Platform-to-business and consumer gate

Seller terms must explain ranking, moderation, suspension, data access, fees, complaints and termination. Consumer information, withdrawal/return exceptions, guarantees and dispute handling must be designed per product and sales model.

### 15.5 Tax gate

Tax treatment and any cooperative facility must be versioned by legal basis, effective date, eligibility and reviewer. DROPi must not advertise a generic `tax-free cooperative` benefit. Law no. 239/2025 repealed specific provisions of Article 76(1) of Law no. 566/2004 from 1 January 2026, demonstrating why old guides cannot be copied into product claims.

## 16. B2B and export readiness

The cooperative may aggregate supply for hotels, restaurants, retailers, distributors, public procurement or external buyers, but this does not turn it into a `large B2B partner` under the existing DROPi model by default.

Two distinct modes remain:

1. **Cooperative as C1 seller:** its own small-producer products are listed in the controlled Marketplace.
2. **Cooperative as C2 contractual supplier/client:** recurring wholesale or logistics volumes use a separate contract and operational gate.

For cross-border sales:

- sale from Romania to another EU Member State is intra-EU trade, with product, VAT and distance-sales rules as applicable;
- sale to a non-EU destination is an export/customs flow and may require EORI, classification, origin, customs, sanitary/phytosanitary and destination-country evidence;
- product legality in Romania does not prove eligibility in the destination country;
- `EXPORT_READY` must expire and must be reevaluated when law, product, facility, certification, destination or logistics changes.

DROPi may produce a readiness checklist and coordinate specialists. It must not act as exporter of record or customs representative by default.

## 17. Service modules

The proposed service contains eight modules:

1. **Learn** — simple education, modern-vs-communist distinction, examples and readiness questionnaire.
2. **Form a group** — opt-in producer matching by region, product, volume and objectives.
3. **Form the entity** — legal-route assessment, tasks, documents, professional review and ONRC tracking.
4. **Join** — membership application, evidence, cooperative decision and contribution tracking.
5. **Govern** — member register, roles, meetings, resolutions, conflicts and audit.
6. **Sell together** — cooperative storefront, pooled catalog, lots, inventory, orders and settlements.
7. **Deliver together** — consolidation, packaging, pickup windows, hub transfer and multimodal delivery.
8. **Grow** — capacity evidence, B2B contracts and destination-specific export readiness.

AI may explain, prefill, detect missing data and recommend next steps. AI must not make binding legal, membership, governance, safety, tax, credit or export decisions.

## 18. Commercial model for DROPi

Permitted candidate revenue streams are:

- fixed readiness/formation-workspace fee;
- monthly cooperative operations subscription;
- disclosed Marketplace and logistics fees;
- optional B2B/export-readiness package;
- partner referral fee only when lawful, transparent and conflict-managed.

DROPi should not take a percentage of cooperative share capital, sell voting influence, charge for favorable member decisions or guarantee public funding. Any success-based fee requires legal and conflict review.

## 19. MVP and pilot

### Phase 0 — legal and operating design

- Romanian lawyer validates both legal routes and standard disclosures.
- Accountant validates seller-of-record, invoicing, VAT and member settlement models.
- Payment counsel/PSP validates money flow.
- Product-category specialist validates the first pilot category.
- Data-protection assessment defines access and retention.

### Phase 1 — readiness and assisted formation

- Learn module;
- readiness assessment;
- invite and opt-in group workspace;
- evidence checklist;
- professional handoff;
- formation state tracking;
- no automated filing guarantee.

### Phase 2 — verified cooperative Marketplace

- organization identity and role model;
- member applications;
- cooperative storefront;
- member lots and pooled inventory;
- PSP-backed order settlement;
- traceability and recall workflow;
- operational integration with existing C1 orders and delivery.

### Phase 3 — B2B/export readiness

- capacity and buyer requirements;
- recurring volume contract;
- product/destination compliance pack;
- export document handoff and expiry monitoring.

Recommended pilot envelope:

- 5–15 committed producers;
- one Romanian region;
- one shelf-stable product family;
- limited product and delivery radius;
- a named lawyer, accountant and product-category specialist;
- manual professional review at every legal/compliance gate;
- measurable buyer demand before building export automation.

Packaged honey may be assessed as an initial candidate because of aggregation and shelf-life characteristics, but it is not pre-approved. DSVSA, labeling, facility, product-origin and destination requirements must be confirmed first.

## 20. Success measures

The MVP should be evaluated by:

- percentage of groups reaching professional review with a complete evidence pack;
- time from readiness start to filed and registered states, reported separately;
- membership application completion and abandonment reasons;
- percentage of active listings with complete lot lineage;
- order fill rate without unauthorized substitution;
- settlement reconciliation exceptions;
- withdrawal/recall drill completion time;
- producer net revenue and repeat-buyer rate;
- number of compliance findings by severity;
- B2B readiness conversion without false `export ready` claims.

Registration count alone is not a success metric. A legally created but inactive or poorly governed cooperative is a failed product outcome.

## 21. Principal risks and controls

| Risk | Required control |
|---|---|
| DROPi appears to control member governance | Explicit legal independence, scoped roles and immutable decision evidence |
| Informal group shown as registered cooperative | Verified lifecycle states and public naming gate |
| Single user controls a member-owned store | Organization ownership and multi-role authorization |
| Duplicate or untraceable pooled stock | Lot lineage, reservations and invariant checks |
| Unlicensed custody of funds | Licensed PSP and legal review before money movement |
| Tax or grant promises become stale | Versioned claims, effective dates and professional approval |
| Unauthorized food/non-food products | Category/facility compliance gates and suspension workflow |
| Cooperative used to disguise recurrent unauthorized selling | Seller verification, activity monitoring and moderation |
| Member data exposed publicly | Purpose limitation, field-level access and public/private provenance split |
| Export badge overstates readiness | Product + destination + expiry scope; no global badge |
| Platform dependency weakens autonomy | Data export, termination rules and no DROPi voting/control rights |

## 22. Preconditions for implementation authorization

No schema, API, UI, payment or Marketplace implementation should begin until all of the following are approved:

1. Product Owner accepts this canonical proposal or an amended version.
2. A Romanian cooperative-law professional validates the route model and membership/formation workflows.
3. An accountant validates invoicing, VAT, stock ownership and member settlement.
4. A PSP or payment-law review approves the exact fund flow.
5. The seller-of-record and liability matrix is complete.
6. The first product category and region are selected with sector-authority requirements mapped.
7. The organization/RBAC architecture is approved as an extension of existing identity and audit systems.
8. A separate implementation issue decomposes the work and explicitly excludes unrelated Marketplace cleanup.

## 23. Canon reconciliation notes

This proposal extends, but does not silently rewrite, existing authority:

- `canonical/DELIVERY_MULTIMODAL.md` remains authoritative for delivery modes and non-guarantee badge rules.
- `docs/planning/C1_MARKETPLACE_POSITIONING_RESOLUTION.md` remains authoritative for separation between the public C1 surface and Operational Core.
- Existing P2P/community limits are unchanged.
- The frozen historical `Marketplace_Financial_Flow.md` remains provenance, but its statement that DROPi retains funds requires licensed-PSP/legal reconciliation before implementation.
- Existing `stores.ownerId` implementation remains current code truth; this proposal records why it is insufficient for cooperative organization ownership.
- C2 large-retailer rules remain unchanged. A small-producer cooperative reaches C2 only through a later contractual readiness gate.

## 24. Source register

This is product research, not legal advice. Romanian consolidated law, implementing orders and authority procedures must be rechecked at each professional review and before launch.

### Cooperative identity and Romanian formation

- International Cooperative Alliance, [Cooperative identity, values and principles](https://ica.coop/en/cooperatives/cooperative-identity).
- Romanian Legislative Portal, [Law no. 566/2004 on agricultural cooperation](https://legislatie.just.ro/Public/DetaliiDocumentAfis/58004).
- Romanian Legislative Portal, [Law no. 1/2005 on the organization and functioning of cooperation](https://legislatie.just.ro/Public/DetaliiDocument/202368).
- National Trade Register Office, [Registration — legal persons](https://www.onrc.ro/index.php/ro/inmatriculari/persoane-juridice).
- Romanian Legislative Portal, [Government Ordinance no. 26/2000 on associations and foundations](https://legislatie.just.ro/Public/DetaliiDocumentAfis/20740).
- Romanian Legislative Portal, [Government Ordinance no. 37/2005 on producer groups and organizations](https://legislatie.just.ro/public/detaliidocument/63439).
- Romanian Legislative Portal, [Law no. 239/2025](https://legislatie.just.ro/Public/DetaliiDocument/305208).

### Marketplace, products, food, payments and trade

- EUR-Lex, [Regulation (EU) 2022/2065 — Digital Services Act](https://eur-lex.europa.eu/eli/reg/2022/2065/oj/eng).
- EUR-Lex, [Regulation (EU) 2023/988 — General Product Safety Regulation](https://eur-lex.europa.eu/eli/reg/2023/988/oj/eng).
- EUR-Lex, [Regulation (EC) no. 178/2002 — General Food Law](https://eur-lex.europa.eu/eli/reg/2002/178/oj/eng).
- EUR-Lex, [Regulation (EC) no. 852/2004 — food hygiene](https://eur-lex.europa.eu/eli/reg/2004/852/oj/eng).
- EUR-Lex, [Regulation (EU) no. 1169/2011 — food information to consumers](https://eur-lex.europa.eu/eli/reg/2011/1169/oj/eng).
- EUR-Lex, [Directive (EU) 2015/2366 — payment services](https://eur-lex.europa.eu/eli/dir/2015/2366/oj/eng).
- EUR-Lex, [Regulation (EU) 2019/1150 — platform-to-business fairness](https://eur-lex.europa.eu/eli/reg/2019/1150/oj/eng).
- European Commission, [Access2Markets guide for export of goods](https://trade.ec.europa.eu/access-to-markets/en/content/guide-export-goods).
- European Commission, [VAT One Stop Shop](https://vat-one-stop-shop.ec.europa.eu/index_en).

### Historical context

- Gail Kligman and Katherine Verdery, [*Peasants under Siege: The Collectivization of Romanian Agriculture, 1949–1962*](https://academic.oup.com/princeton-scholarship-online/book/21037).

## 25. Approval effect

If approved and merged as canonical v1.0.0, this document authorizes **planning decomposition only**. It does not authorize production claims, legal services, automated filings, fund custody, export status or implementation without the preconditions in Section 22.
