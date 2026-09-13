# Passenger Mobility Legal Baseline — Romania and Philippines

**Research date:** 2026-09-12
**Version:** 1.1.0
**Purpose:** Product, compliance, UX, and implementation planning
**Status:** Research baseline; counsel and regulator confirmation required
**Launch scope considered:** C1 Passenger Mobility in Romania and Philippines Zone 0

> This document is not legal, tax, insurance, or employment advice. It records a product-oriented reading of public sources. No market, vehicle class, or partner may be enabled solely because it appears in this document.

## 1. Executive conclusion

DROPi can combine parcel delivery and passenger mobility in one account and application, but cannot combine their legal permissions. The workable model is:

1. one identity and one C1 shell;
2. separate `parcel` and `passenger_mobility` service domains;
3. separate, expiring capabilities for every person/operator/vehicle/zone combination;
4. DROPi or its approved local entity holds the platform-level authority;
5. each transport operator/driver/vehicle holds the authority required in that jurisdiction;
6. a versioned jurisdiction pack blocks service unless all rules are satisfied.

Romania has an explicit national framework for app-intermediated “transport alternativ” under OUG 49/2019. The Philippines has a national TNC/TNVS framework for app-based car services, while tricycles-for-hire are principally franchised and regulated by the selected local government unit (LGU). These are not interchangeable.

The immediate product decision should therefore be:

- plan C1 Passenger Mobility for both countries;
- keep Romania cars and Philippines TNVS cars as separate jurisdiction packs;
- keep Philippines tricycles visible only in planning/configuration and default them to `disabled_legal_gate` until the exact Zone 0 city/municipality and ordinance are known;
- do not open C2 or C3 passenger use cases in the first release.

## 2. Research method and confidence

Sources were prioritized as follows:

| Tier | Source type | Use in this baseline |
|---|---|---|
| A | legislation portals, regulators, official classification systems | Normative baseline and mandatory product gates |
| B | government e-libraries and official service portals | Regulatory instruments and operational filing requirements |
| C | reputable reporting on very recent changes | Change alert only; never used alone to enable production |

“Confirmed” below means supported by a Tier A/B source reviewed on the research date. “Revalidate” means the rule is time-sensitive, the currently published operational checklist may lag a classification change, the exact local rule is unknown, or an official copy of a recent instrument was not available in the reviewed sources.

### 2.1 Canonical evidence and limitation

The source inventory, official URLs, immutable local snapshots, SHA-256 hashes, retrieval dates, qualifiers, and missing-primary-source states are maintained in `docs/legal/legal-source-register.json`. Source handling is governed by `canonical/LEGAL_COMPLIANCE_SOURCE_OF_TRUTH.md`; provisional source-to-gate mappings are in `docs/legal/LEGAL_REQUIREMENTS_TRACEABILITY.md`, and unresolved matters are in `docs/legal/LEGAL_GAPS_AND_BLOCKERS.md`.

The identifiers in backticks below refer to that register. An archived file proves what was reviewed, not that it remains current or authorizes DROPi. Where the current primary source is absent, the registry and blocker list deliberately prevent the product from converting a research statement into an operational rule.

| Research area | Principal registered source IDs | Current evidence condition |
|---|---|---|
| Romania Passenger Mobility | `RO-OUG-49-2019`, `RO-LAW-204-2019`, `RO-ADR-DECISION-572-2020-NORMS`, `RO-ADR-PLATFORM-PROCEDURE-2026-09-12`, `RO-ARR-AUTHORIZATION-CHECKLIST-2026-09-12` | Official snapshots captured; current consolidation, CAEN discrepancy, fiscal and filing confirmations remain gated |
| Romania parcel/postal delivery | `RO-OUG-13-2013-ANCOM-CONSOLIDATION-2019`, `RO-ANCOM-DECISION-925-2023`, `RO-ANCOM-GENERAL-AUTHORIZATION-2026-09-12` | Decision/current guidance captured; archived ordinance copy is unofficial and stale |
| EU/Romania drone and vehicle classification | `EU-REG-2019-945-ORIGINAL`, `EU-REG-2019-947-CONSOLIDATED-2025-05-01`, `EU-REG-168-2013-CONSOLIDATED-2024-11-27`, `RO-AACR-DRONE-GUIDANCE-CURRENT` | EU texts captured; current AACR/national CONOPS source set incomplete |
| Philippines TNC/TNVS and tricycle | `PH-RA-7160`, `PH-SC-GR-242860-2019`, historical DOTr/LTFRB IDs, `PH-LTFRB-MC-2026-049-PENDING` | National law/judgment captured; historical primary files, current LTFRB rules and exact LGU ordinance incomplete |
| Philippines road, delivery and drone | `PH-RA-4136`, `PH-RA-7354`, `PH-CAAP-PCAR-PART-11-2026-09-12`, controller/registration/operator CAAP IDs | Base laws and CAAP pages captured; current delivery authority and controlled CAAP source set incomplete |

## 3. Romania

### 3.1 Legal actors are intentionally separate

[OUG 49/2019](https://legislatie.just.ro/Public/DetaliiDocument/215598) regulates the organization, authorization, and control of passenger transport by car and driver intermediated through a digital platform. For DROPi, the critical model is:

| Legal actor | Product representation | Required separation |
|---|---|---|
| `operatorul platformei digitale` | DROPi platform legal entity | Platform technical endorsement, platform duties, records, support, security |
| `operatorul de transport alternativ` | PFA/II/IF or legal-person partner/fleet | ARR transport authorization and responsibility for authorized cars/drivers |
| `conducătorul auto` | Passenger-capable Delivery Partner | Personal qualification and fitness evidence |
| `autoturismul` | Mobility vehicle | Individual compliant copy, badges, registration, inspection, insurance |
| `pasagerul` | Customer/Merchant acting as rider | Transport request/contract, price, identity, privacy and safety rights |

DROPi must not describe the driver as “authorized by the app” when the actual authority is issued by ARR or another competent institution. The platform may verify evidence and decide access to DROPi, but that is an additional private gate, not a government authorization.

### 3.2 Platform-level obligations

The platform must be technically endorsed and must only intermediate compliant actors and cars. The current application procedure published by the [Authority for the Digitalization of Romania (ADR)](https://www.adr.gov.ro/platforme-digitale-pentru-transport-alternativ) requires, for a Romanian resident platform operator, corporate registration and constitutional documents, recent registry evidence, administrator/representative documents, a functional system description, a security plan, an independent IT audit performed by an auditor on ADR’s list, a recent audit report, business-continuity/disaster-recovery planning, proof of the applicable tax/payment, GDPR declarations, and a contract with an accredited electronic archive administrator.

For a non-resident platform operator, ADR’s published list adds a Romanian registered branch and a mandate that expressly enables the branch to provide competent authorities with data on trips, routes, passengers, drivers, transport operators, vehicles, locations, and contracts. This is a strong reason not to treat a foreign software company as automatically able to launch in Romania.

The law and ADR procedure translate into these product requirements:

- show and record a pre-trip fare/estimate as legally applicable;
- identify the matched driver and car, including registration plate;
- record the trip route/location and material state changes;
- monitor the validity of operator, driver, and vehicle evidence;
- provide incident reporting and the required continuously available support interface;
- support permitted electronic/cash payment configurations and fiscal documents;
- provide Romanian terms, privacy information, and interfaces;
- retain trip and contractual evidence for the legally required period;
- implement cybersecurity, continuity, recovery, electronic archiving, and regulator-access controls;
- periodically reverify participants and remove/suspend non-compliant ones.

The endorsement’s exact validity and the current annual/endorsement tax must be taken from the decision and fee schedule in force at filing time. The [ADR service page](https://www.adr.gov.ro/platforme-digitale-pentru-transport-alternativ) and the norms approved through Decision 572/2020 are the operational sources, not an amount copied into application code.

### 3.3 Transport operator: PFA/II/IF or legal person

The [ARR transport-alternative Q&A](https://www.arr.ro/arr_doc_736_intrebari-si-raspunsuri-transport-alternativ_pg_0.htm) confirms that authorization is issued through the territorial ARR agency for the operator’s registered office/domicile. Its published checklist includes:

- application;
- trade-register certificate/constatator showing the transport activity;
- professional certificate(s) for qualifying drivers;
- transport-manager professional competence for a legal person;
- for PFA/II/IF, the titular person’s professional driver certificate;
- criminal-record evidence for drivers and, for a legal person, the manager;
- medical and psychological “APT” evidence for the relevant manager or PFA/II/IF titular;
- payment evidence.

The resulting authorization is operator-specific and non-transferable. A PFA is therefore a possible operator form, but “self-employed” alone is not enough: the PFA/II/IF still needs the activity registration, ARR authorization, qualifying person, vehicles, affiliation, insurance, tax setup, and other current evidence.

When the operator is a legal person and drivers are not the owner/titular, the employment/contract model must be confirmed against OUG 49/2019, labor law, and ARR practice. DROPi’s generic “independent partner” wording must not override a statutory employment requirement.

### 3.4 Driver baseline

Article 23 of [OUG 49/2019](https://legislatie.just.ro/Public/DetaliiDocument/215598) requires cumulative conditions. The application should collect and independently validate at least:

- identity and age (minimum 21);
- valid category B driving licence with at least two years’ seniority;
- valid ARR professional training certificate for passenger transport in rental regime;
- legally acceptable criminal-record status, including the statutory disqualifying categories;
- medical and psychological fitness;
- any driving-record/suspension condition currently required;
- relationship with the authorized transport operator;
- acceptance of the platform affiliation/conduct/safety terms.

The exact criminal-record and driving-history declarations must reproduce the current legal text and ARR form, not a shortened product paraphrase. Criminal-record evidence receives restricted access and a specific retention rule under GDPR.

### 3.5 Vehicle baseline

For each car, the ARR process requires a separate `copie conformă` and two badges after proof of at least one platform affiliation contract. The [ARR checklist](https://www.arr.ro/arr_doc_736_intrebari-si-raspunsuri-transport-alternativ_pg_0.htm) identifies the transport authorization, registration certificate, vehicle identity card, statutory vehicle declaration, and—where applicable—rental, authenticated loan-for-use (`comodat`), or leasing agreement.

Product gates must cover:

- vehicle ownership or lawful use by the operator;
- registration certificate and vehicle identity evidence;
- operator–vehicle identity match;
- valid compliant copy and both badges;
- roadworthiness/ITP status at the applicable interval;
- mandatory motor civil-liability insurance;
- passenger and passenger-property/baggage insurance;
- legal age limit: ARR states that, at expiry of the compliant copy, the car must be under 15 years from manufacture;
- no prohibited taxi-specific markings/equipment when operating as transport alternativ;
- legally registered seating capacity and the special statutory cap.

Article 19 of OUG 49/2019 permits an automobile with a maximum of nine seats including the driver for transport alternativ. The statutory ceiling can therefore be up to eight passengers, but it is not the automatically bookable capacity of every car. DROPi must use the lower of the car’s registered passenger seats, compliant-copy/authorization conditions, insurer-covered capacity, vehicle-class product rules, and any other applicable limit. Capacity must always be stored as an evidence-backed field.

### 3.6 Affiliation, geography, and trip operation

An operator–platform affiliation contract is required. ARR states that badges are issued only after the operator presents an affiliation contract with at least one technically endorsed platform. The platform must keep the accepted terms/version and allow the operator to produce proof of the relationship.

ARR also states that the authorized operator may operate permanently inside the locality of its registered office/domicile (or Bucharest–Ilfov, as applicable) and occasionally depart from that base toward other localities. Zone configuration and matching must model this operating-area rule; a country-wide “online” toggle is unsafe.

During a trip, the product must preserve the legally relevant fare, route, driver/vehicle identity, payment and fiscal evidence. Cash acceptance cannot be switched on until the required fiscal-device/receipt setup is confirmed for that operator.

### 3.7 CAEN — answer to the user’s classification question

This is a live transition and multilingual-source consistency issue, not a number to hardcode.

The Romanian section of the [ARR authorization page](https://www.arr.ro/instructiuni-eliberare-documente_doc_738_autorizare_pg_0.htm) captured on 2026-09-12 states **CAEN 4933**. The English section of the same captured page still states **4939**. The discrepancy is preserved in `RO-ARR-AUTHORIZATION-CHECKLIST-2026-09-12`. The official INSSE CAEN Rev. 3 source is registered as `RO-INSSE-CAEN-REV3`, but its complete official file could not be archived in this review and therefore remains a blocking source gap.

| Activity | CAEN Rev. 3 planning candidate | Status |
|---|---:|---|
| On-demand passenger transport with driver (operator/PFA/SRL) | `4933` | Candidate shown by current Romanian ARR content; confirm against complete current INSSE/ONRC sources and in writing |
| Intermediation of passenger transport (platform) | `5232` | Planning candidate only; confirm exact DROPi legal entity activity set |
| Courier/home-delivery activity | `5320` | Planning candidate only; first determine whether the partner/platform is legally the provider |
| Freight-transport intermediation | `5231` | Planning candidate only and relevant only if the legal activity actually matches |

Practical conclusion: a PFA or company intending to perform both courier/delivery and passenger transport may need multiple activity classes and two independent regulatory files. The platform entity may need an intermediation class different from the driver/operator’s transport class. Before filing, obtain the complete current INSSE classification and written confirmation from ONRC/accountant/counsel and the territorial ARR agency for every entity/role. Do not resolve the ARR page's Romanian/English inconsistency by silently choosing either number.

### 3.8 Romania company checklist

Before any live ride, the responsible Romanian launch owner should provide evidence for:

- Romanian platform operator or required Romanian branch;
- CAEN/activity-set confirmation for platform intermediation;
- ADR technical endorsement and its expiry;
- functional description, security plan, IT audit, BCP/DR, electronic archive arrangement;
- GDPR controller/processor map, DPO decision where applicable, DPIA, data-retention and authority-disclosure procedure;
- Romanian passenger terms, operator affiliation terms, driver terms, pricing/cancellation/refund policy;
- 24/7 incident-support operating model where required;
- payment, invoice/receipt, commission, payout, and tax design;
- insurer-approved incident and claims process;
- ARR registry verification process and periodic re-verification calendar.

Given continuous geolocation, systematic monitoring, automated eligibility/matching, safety signals, identity documents, and criminal-record data, a DPIA is a launch gate under the risk-based requirements of the [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj), not a post-launch documentation task.

## 4. Philippines

### 4.1 Two different passenger regimes

The Philippines baseline must split at least two vehicle/service classes:

| Class | Primary authority path | DROPi implication |
|---|---|---|
| App-dispatched car | DOTr policy + LTFRB TNC/TNVS rules + LTO licensing/registration | DROPi/local entity requires TNC authority; each operator/vehicle requires current TNVS authority |
| Tricycle-for-hire | RA 7160 + DILG/DOTC guidelines + chosen LGU ordinance/franchising body + LTO | No national “TNVS car” approval can be reused; exact LGU is a hard prerequisite |

The foundational [DOTr Department Order 2015-011](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/70341) created the TNVS category and the TNC accreditation model. [Department Order 2018-013](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/91261) reinforced LTFRB authority over TNCs/TNVS as public-transport providers. Exact current instruments, caps, allowed vehicle specifications, fares, and territorial windows must be checked with LTFRB before launch.

### 4.2 DROPi/local company as TNC

[LTFRB Memorandum Circular 2015-015](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/70877) defines a TNC as an organization using internet/digital-platform technology to connect passengers with drivers using personal vehicles for pre-arranged compensated transport. Its baseline application material includes:

- applicant and business contact information;
- DTI business-name registration for a sole proprietor, or SEC formation/authority documents for juridical entities;
- for a resident foreign juridical entity, SEC licence to do business, branch/representative-office and resident-agent material;
- business model description;
- local business permit;
- BIR registration;
- sample electronic passenger receipt;
- process for accrediting/affiliating TNVS vehicles and drivers;
- platform/application information and further safety/operating material required by LTFRB.

Later amendments, including MC 2015-015-A, and [DO 2018-013](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/91261) affect the responsibility model. The Philippine Supreme Court’s [LTFRB v. Valenzuela decision](https://lawphil.net/judjuris/juri2019/mar2019/gr_242860_2019.html) identifies the amended TNC/TNVS instruments and confirms that the service is subject to LTFRB regulation. DROPi should not launch from a foreign core entity based only on the older circular’s entity categories. Recommended structure: DROPi Core licenses the product/policies to a Philippine operating entity or approved Zone Operator whose TNC authority, tax, insurance, support, and regulator interfaces are confirmed by Philippine counsel.

TNC accreditation is separate from every TNVS operator/vehicle authority. The platform must allow only currently authorized vehicles and drivers, maintain complaint/safety processes, provide appropriate receipts and reports, and cooperate with LTFRB/LTO and other competent authorities.

### 4.3 Car-based TNVS operator/vehicle baseline

[LTFRB Memorandum Circular 2015-017](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/70883) sets the original CPC application framework; [MC 2015-018](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/70886) supplies the original operating terms. The later amended terms, including MC 2015-018-A cited by the [Supreme Court](https://lawphil.net/judjuris/juri2019/mar2019/gr_242860_2019.html), and every current LTFRB issuance control over the 2015 baseline. The evidence categories to model include:

- verified application and proof of eligible citizenship/entity status;
- TNC endorsement/accreditation relationship;
- vehicle ownership/applicant match;
- current LTO Official Receipt/Certificate of Registration (OR/CR) and correct for-hire classification/process;
- eligible vehicle specifications and inspection/accreditation;
- qualified driver and current professional driver’s licence;
- current NBI/police or other clearances as required;
- proof of garage/right to use the garage;
- proof of financial capacity and tax registration/returns as required;
- passenger/public-liability insurance required for the authority;
- CPC, Provisional Authority, ATOC, or successor authority current for that unit;
- regulator/TNC identification or stickers required in the current rules.

The current checklist and authority label must be revalidated. Reputable July 2026 reports describe LTFRB Memorandum Circular 2026-049 as automatically transitioning eligible existing TNVS CPCs to five-year ATOCs, but an official copy was not available in the sources reviewed. This is a **regulatory-change alert**, not an implementation fact; obtain MC 2026-049 and the current LTFRB Citizen’s Charter directly before designing document labels or expiry periods. See [BusinessWorld’s report](https://www.bworldonline.com/corporate/2026/07/15/763411/ltfrb-says-eligible-tnvs-operators-no-longer-need-to-apply-for-cpc-renewal/) and [Inquirer’s report](https://newsinfo.inquirer.net/2263563/ltfrb-tnvs-cpcs-to-be-automatically-converted-into-atocs) only as pointers to the primary circular.

No capacity number is assumed by DROPi. The ride cap is the lowest of the vehicle’s designed seating, LTFRB authority, insurance cover, and platform safety rule.

### 4.4 Tricycles-for-hire: the Zone 0 hard gate

The [Local Government Code, RA 7160](https://lawphil.net/statutes/repacts/ra1991/ra_7160_1991.html), including sections 447 and 458, empowers municipalities/cities to regulate tricycles and grant franchises within their territorial jurisdiction. The government e-library also publishes the implementing [LTO Memorandum Circular 94-199](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/11/47970) on transfer of tricycle-for-hire franchising authority to LGUs.

Consequences for DROPi:

- “Philippines” is not a sufficient operating zone; the exact city/municipality must be selected;
- the relevant Sangguniang Bayan/Panlungsod ordinance, Tricycle Franchising Board or equivalent process must be obtained;
- a motorized-tricycle operator’s franchise/MTOP/permit, route/zone, plate/OR/CR, inspection, driver licence, local business/association requirements, insurance, fare rules, and capacity are local-pack fields;
- many local rules restrict tricycles to city/municipal roads, authorized zones/routes, or roads not served by higher modes, and national-road operation is restricted; map routing must enforce the confirmed rule;
- an app-dispatched, on-demand model or trips crossing LGU boundaries may require a specific ordinance, approval, or regulatory interpretation;
- a tricycle may be approved for parcels but still be prohibited from carrying DROPi passengers;
- “one or two passengers” is a product hypothesis only. The actual number comes from registration, body configuration, franchise, ordinance, and insurance.

Until the Zone 0 LGU and its written position are known, `passenger_tricycle` remains `disabled_legal_gate`. Mockups may demonstrate the class but must label it “Available only in approved zones”; production clients must not see it as orderable.

### 4.5 Driver and vehicle evidence for tricycles

The final checklist is LGU-specific. The product must be capable of collecting, at minimum:

- identity and eligibility/citizenship evidence where required;
- current professional driver’s licence with the correct vehicle category/restrictions;
- NBI, police, barangay, medical, drug-test, training, or seminar evidence where the ordinance requires it;
- tricycle franchise/MTOP/CPC/local permit and authorized zone/route;
- LTO OR/CR and correct classification;
- proof of ownership or authorized use;
- vehicle inspection/roadworthiness and required markings/body number;
- passenger/public-liability and vehicle insurance;
- local business/mayor’s/barangay permits and association membership if required;
- fare schedule, passenger capacity, and prohibited-road constraints.

No field in this list should be marked universally mandatory until mapped to the chosen LGU’s source and effective date.

### 4.6 Philippine business and classification answer

Business registration and transport authority are separate layers:

- a sole proprietor registers a business name through the [DTI Business Name Registration System](https://bnrs.dti.gov.ph/);
- a corporation/partnership/qualified foreign entity uses the [SEC registration system](https://esparc.sec.gov.ph/);
- the business registers for tax through the [BIR NewBizReg service](https://web-services.bir.gov.ph/newbizreg/);
- the principal place of business needs the applicable local permits;
- the TNC, TNVS, and/or tricycle-franchise authority is still required.

The Philippines uses **PSIC**, not CAEN. The official [Philippine Statistics Authority PSIC Revision 5](https://psa.gov.ph/classification/psic/class) includes useful planning codes:

| Activity | PSIC Rev. 5 code | Product use |
|---|---:|---|
| Tricycles and pedicabs operation | `49322` | Candidate activity for the local tricycle operator |
| Transportation network service / ride-sharing vehicle operation | `49325` | Candidate activity for TNVS vehicle operation |
| Courier activities | `5320` | Delivery/courier class; subclasses include private postal, messenger, food delivery, and other courier activities |

PSIC classification does not itself confer a franchise. The precise set for the DROPi platform entity, Zone Operator, and each transport operator must be confirmed with SEC/DTI, BIR, PSA classification guidance, accountant, LTFRB, and the LGU. A dual-service operator may need both passenger and courier classifications plus independent licences.

### 4.7 Privacy and audit in the Philippines

The [Data Privacy Act of 2012, RA 10173](https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html), and the [National Privacy Commission](https://privacy.gov.ph/) framework apply to rider, driver, vehicle, location, safety, identity, and document processing. The NPC states that covered personal-information controllers/processors must register their DPO and data-processing systems under NPC Circular 2022-04 and use the official breach/incident reporting systems.

Before launch, the Philippine operator needs:

- controller/processor and cross-border transfer map;
- appointed DPO and registration assessment;
- data-processing-system registration where covered;
- privacy impact assessment for live location, matching, monitoring, identity and safety data;
- privacy notices in the actual languages used;
- least-privilege document and incident access;
- breach and annual security-incident reporting runbooks;
- retention/deletion schedule reconciled with LTFRB, tax, litigation, insurance, and safety duties;
- contracts with DROPi Core/cloud/support vendors governing instructions, security, access, transfer, deletion, and audit.

### 4.8 Philippines company checklist

Before any live ride, the responsible Zone 0 launch owner should provide evidence for:

- exact city/municipality and approved service geography;
- Philippine entity/Zone Operator structure and foreign-ownership/corporate analysis;
- DTI or SEC registration, BIR registration, and local business permits;
- current TNC accreditation and operating terms;
- current LTFRB Citizen’s Charter/checklist, open application/cap status, fares, and unit specifications;
- official MC 2026-049 analysis and correct CPC/PA/ATOC terminology;
- TNC–TNVS affiliation/enrollment and current operator/vehicle authority;
- LTO licence/OR/CR verification method;
- insurance and claims program;
- 24/7 support/incident escalation expected by regulator and insurer;
- NPC privacy/DPO/DPS/breach compliance;
- for tricycles, the exact ordinance, franchising body, permits, routes, capacity, fares, road restrictions, and explicit acceptance of app dispatch.

## 5. Comparative control matrix

| Control | Romania car | Philippines TNVS car | Philippines tricycle |
|---|---|---|---|
| Platform authority | ADR technical endorsement | LTFRB TNC accreditation | TNC/LGU position must be confirmed |
| Transport operator authority | ARR authorization | LTFRB unit/operator authority | LGU franchise/MTOP/permit |
| Vehicle document | ARR compliant copy + badges | CPC/PA/ATOC or current successor + LTO OR/CR | LGU franchise/permit + LTO OR/CR |
| Driver credential | ARR professional certificate + B licence | Professional licence + LTFRB/TNC/current clearances | Professional licence + LGU-specific evidence |
| Business form | PFA/II/IF or legal person | Eligible sole proprietor/juridical operator | LGU-eligible person/entity/cooperative as ordinance allows |
| Business classification | 4933 operator / 5232 platform are planning candidates only; confirm current sources and ARR multilingual discrepancy | PSIC 49325 candidate | PSIC 49322 candidate |
| Delivery classification | CAEN 5320 candidate | PSIC 5320 candidate | PSIC 5320 candidate for separate courier activity |
| Geography | statutory base locality/occasional outward rules | LTFRB-authorized service area | exact LGU zone/route/roads |
| Capacity | statutory/registered/insured lower bound | designed/LTFRB/insured lower bound | LGU/registration/insured lower bound |
| Privacy | GDPR + Romanian law | RA 10173 + NPC issuances | RA 10173 + NPC issuances |
| Initial product status | planned, legal-gated | planned, legal-gated | disabled until LGU confirmation |

## 6. Contract and audit controls common to both countries

DROPi needs a contract registry, not uploaded PDF files without context. Each agreement should identify parties and legal roles, jurisdiction, effective/expiry date, version, acceptance/signature evidence, authority to sign, commission/payment/tax treatment, service/vehicle scope, data roles, insurance duties, incident cooperation, complaints, audit/regulator access, suspension/termination, and surviving retention duties.

Minimum agreement set:

1. Passenger Terms and Privacy Notice.
2. Platform–Transport Operator Affiliation Agreement.
3. Platform–Zone Operator/Local Operator Agreement, where used.
4. Driver–Transport Operator relationship evidence and driver conduct/safety terms.
5. Data processing and cross-border transfer agreements.
6. Payment/payout/tax/receipt schedule.
7. Insurance and claims cooperation schedule.

The audit system must answer, without editing history:

- which licence/document was relied on;
- who reviewed it and how;
- which rule-pack version was evaluated;
- when the capability became active, expired, or was suspended;
- which driver and vehicle were matched;
- what price and terms the passenger accepted;
- where legally necessary, what route/state/location events occurred;
- who accessed sensitive evidence;
- what happened after an incident, dispute, refund, regulator request, or legal hold.

## 7. Questions that must be answered before implementation begins

### Product-owner decisions

- What exact Philippines city/municipality is Zone 0?
- Will DROPi own the Romanian platform operator, use a Romanian subsidiary/branch, or contract a licensed operator?
- Will the Philippine Zone Operator be the TNC, or will DROPi integrate with an already accredited TNC?
- Will payments be platform-collected, operator-collected, cash, or a controlled subset in each market?
- Are rides strictly one party/one booking in v1, with no minors and no pooling? The canon currently says yes.

### Written counsel/regulator confirmations

- Romania CAEN Rev. 3 mapping and the 4933/4939 inconsistency between the Romanian and English sections of ARR's current page.
- Romania employment/contract treatment for drivers under each operator form.
- Romania fiscal-device/invoice treatment by payment flow.
- Philippines TNC entity/ownership/residency and local operator structure.
- Official effect and scope of LTFRB MC 2026-049 and current Citizen’s Charter.
- Whether the selected Zone 0 LGU permits app-dispatched tricycle rides, on what roads/routes, and across which boundaries.
- Insurance products and limits for every service/vehicle class.
- Exact regulator and tax retention schedules in both countries.

## 8. Launch recommendation

Use a staged compliance pilot:

1. complete entity and regulator discovery without live passengers;
2. build jurisdiction packs and admin evidence review;
3. test with synthetic rides and no public dispatch;
4. conduct security/privacy/safety/audit exercises;
5. onboard a very small, manually reviewed cohort;
6. launch one approved zone and one vehicle class at a time;
7. keep an immediate zone/service kill switch;
8. expand only after regulator, insurer, incident, and audit review.

The sequence should be independent per pack. Romania approval does not validate Philippines, car approval does not validate tricycle, and delivery approval does not validate passenger transport.

## 9. Primary and authoritative sources

The links below are discovery/readability links. The controlled inventory and local evidence status are in `docs/legal/legal-source-register.json`. Missing or pending entries are not silently replaced by this list.

### Romania

- [OUG 49/2019 — Romanian Legislative Portal](https://legislatie.just.ro/Public/DetaliiDocument/215598)
- [ARR — Questions and answers for alternative transport](https://www.arr.ro/arr_doc_736_intrebari-si-raspunsuri-transport-alternativ_pg_0.htm)
- [ADR — Digital platforms for alternative transport](https://www.adr.gov.ro/platforme-digitale-pentru-transport-alternativ)
- [Romanian public-services catalog — ADR technical endorsement service](https://serviciipublice.gov.ro/serviciu/acordarea-avizului-tehnic-pentru-platformele-digitale-de-transport-alternativ-cu-autoturism-si-conducator-auto)
- [INSSE — CAEN Rev. 3 complete structure](https://insse.ro/cms/files/CAEN/CAEN-Rev.3_structura-completa.pdf)
- [ONRC — CAEN authorization lookup](https://caen.onrc.ro/)
- [EUR-Lex — Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj)

### Philippines

- [Supreme Court E-Library — DOTr Department Order 2015-011](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/70341)
- [Supreme Court E-Library — DOTr Department Order 2018-013](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/91261)
- [Supreme Court E-Library — LTFRB MC 2015-015, TNC accreditation](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/70877)
- [Supreme Court E-Library — LTFRB MC 2015-017, TNVS application](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/70883)
- [Supreme Court E-Library — LTFRB MC 2015-018, TNVS terms](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/70886)
- [Lawphil — LTFRB v. Valenzuela, G.R. No. 242860](https://lawphil.net/judjuris/juri2019/mar2019/gr_242860_2019.html)
- [Lawphil — RA 7160, Local Government Code](https://lawphil.net/statutes/repacts/ra1991/ra_7160_1991.html)
- [Supreme Court E-Library — LTO MC 94-199, tricycle franchising devolution](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/11/47970)
- [Philippine Statistics Authority — PSIC Revision 5 classes](https://psa.gov.ph/classification/psic/class)
- [PSA — PSIC 4932 subclasses](https://psa.gov.ph/classification/psic/class/4932)
- [PSA — PSIC 5320 subclasses](https://psa.gov.ph/classification/psic/class/5320)
- [DTI — Business Name Registration System](https://bnrs.dti.gov.ph/)
- [SEC — eSPARC company registration](https://esparc.sec.gov.ph/)
- [BIR — New Business Registration](https://web-services.bir.gov.ph/newbizreg/)
- [LTO — Land Transportation Management System](https://portal.lto.gov.ph/)
- [Lawphil — RA 10173, Data Privacy Act](https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html)
- [National Privacy Commission](https://privacy.gov.ph/)
