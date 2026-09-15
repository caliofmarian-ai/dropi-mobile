# Legal Requirements Traceability — Romania and Philippines

**Version:** 1.1.0
**Research cut-off:** 2026-09-15
**Status:** PRE-COUNSEL / FAIL-CLOSED
**Governing canon:** `canonical/LEGAL_COMPLIANCE_SOURCE_OF_TRUTH.md`

This matrix translates captured sources into provisional requirements and explicit product gates. It is not a legal opinion or an authorization. `docs/legal/legal-source-register.json` is the authoritative inventory for source provenance and currency status.

## 1. Gate model

Every regulated action evaluates both:

`company_market_service_gate ∧ partner_person_operator_vehicle_gate`

The conjunction is scoped to jurisdiction, responsible legal entity, service, vehicle class, zone, authority, policy version, and time. No global `verified`, `authorized`, or `selfEmployed` boolean can replace it.

Traceability states used below:

| State | Meaning |
|---|---|
| `captured_for_research` | An official source was archived, but interpretation/approval is incomplete |
| `current_source_pending` | A required primary/current/local source is missing or stale |
| `written_confirmation_required` | An ambiguity must be resolved by qualified counsel and/or the authority |
| `policy_only` | DROPi may impose the control, but it is not currently evidenced as a government requirement |
| `approved` | Reserved for signed, scoped legal/compliance approval; no item in this baseline has this state |

## 2. Cross-service controls

| Requirement ID | Source IDs | Provisional requirement | Company gate | Partner/vehicle gate | Product/control implication | State |
|---|---|---|---|---|---|---|
| `GLOBAL-LEGAL-001` | All applicable registered sources | Legal authority is evaluated per entity, service, vehicle class, zone, and effective period | Company holds every authority required for its actual legal role | Particular partner/operator/person/vehicle holds its own current authority | Versioned jurisdiction pack; no universal authorization | `captured_for_research` |
| `GLOBAL-LEGAL-002` | Canonical policy | A source conflict or missing current instrument blocks the affected law-dependent path | Filing/launch remains disabled | Onboarding/online/start remains disabled | Reason-coded fail-closed gate and audit event | `policy_only` |
| `GLOBAL-DATA-001` | `EU-GDPR-2016-679`, `PH-RA-10173` | Identity, location, document, safety, and decision data require jurisdiction-specific lawful processing controls | Controller/processor roles, DPIA/risk analysis, security, retention, rights, breach process | Notice, access limits, evidence protection, lawful collection | Do not collect locked-service trip/mission data; purpose/retention are pack-driven | `captured_for_research` |
| `GLOBAL-WORK-001` | `EU-DIR-2024-2831` and missing national/PH employment sources | Calling a participant self-employed does not determine legal status | Approved contractor/employment model and algorithmic-management review | Valid business/working relationship evidence | No product copy promising universal PFA/self-employed eligibility | `current_source_pending` |
| `GLOBAL-CONTRACT-001` | Service-specific sources | Company authorization and partner authorization do not replace a current service contract | Approved agreement family and signatory/entity mapping | Versioned acceptance/affiliation/service relationship | Contract registry links acceptance to capability decision | `captured_for_research` |

## 3. Romania — parcel delivery

### 3.1 Company and network role

| Requirement ID | Source IDs | Provisional requirement | Gate and implementation consequence | State |
|---|---|---|---|---|
| `RO-DEL-COMP-001` | `RO-OUG-13-2013-ANCOM-CONSOLIDATION-2019`, `RO-ANCOM-DECISION-925-2023`, `RO-ANCOM-GENERAL-AUTHORIZATION-2026-09-12` | Determine whether each DROPi entity is a postal-service provider, reseller, intermediary/software provider, or contracted third party; responsibility follows the actual operating model, not the label | No Romanian parcel-service company gate or document schema may be approved until ANCOM/counsel classifies the end-to-end flow | `written_confirmation_required` |
| `RO-DEL-COMP-002` | `RO-ANCOM-DECISION-925-2023`, `RO-ANCOM-GENERAL-AUTHORIZATION-2026-09-12` | If the entity provides postal services, complete the current general-authorization notification and ongoing obligations; written contracts with third parties do not automatically transfer provider responsibility | Store notification/authority evidence, service conditions, complaint/claims controls, subcontractor contracts, audit and revocation/expiry status | `captured_for_research` |
| `RO-DEL-COMP-003` | `RO-OUG-13-2013-ANCOM-CONSOLIDATION-2019` | The archived consolidation is unofficial and stops in 2019 | Current consolidated ordinance and amendments are mandatory before requirement approval | `current_source_pending` |

### 3.2 Road delivery modes

| Mode | Company gate | Partner/person gate | Vehicle gate | Current design decision | Source status |
|---|---|---|---|---|---|
| Pedal bicycle | Approved delivery-role/ANCOM model, contracts, insurance and safety policy | Identity and lawful work/business relationship; no general state-issued courier-cyclist attestation has been established by the captured sources | Roadworthy bicycle and locally approved safety equipment/policy | Do not label internal training as a legal attestation; exact road, occupational-safety and insurer rules remain open | `current_source_pending` |
| Electrically assisted bicycle | Same delivery-role gate | Same person/relationship gate plus any rules triggered by vehicle classification | Technical characteristics must prove whether it remains an excluded pedal-assisted cycle or becomes another regulated category | Store motor power, assistance cut-off, design speed and type evidence; classification cannot be selected from marketing name | `EU-REG-168-2013-CONSOLIDATED-2024-11-27` captured; Romanian road sources pending |
| Scooter/motorcycle | Same delivery-role gate plus approved motor-vehicle operating model | Correct licence/category, lawful work relationship, safety and any professional requirements established by current law | Registration, inspection, insurance, lawful use, technical class and cargo constraints as applicable | Entire regulated onboarding schema remains blocked pending current Romanian road/insurance sources | `current_source_pending` |
| Parcel car | Same delivery-role gate; passenger-transport authority is irrelevant unless people are carried | Correct licence and lawful work/business relationship; no passenger professional certificate inferred for parcel-only work | Registration, inspection, insurance, lawful use and cargo limits applicable to actual vehicle/use | Separate `parcel_ground` capability; never reuse `passenger_car` approval | `current_source_pending` |
| Parcel van | Same delivery-role gate plus any freight/operator rules triggered by mass, use, route or cargo | Correct licence/professional qualification for the exact class/use | Registration, permissible mass/capacity, inspection, insurance, cargo/route constraints | “Van” is not one legal category; store technical and maximum-mass data and keep variants disabled until classified | `current_source_pending` |

Internal road-safety induction, helmets/protective equipment, defensive-riding checks, fatigue limits, and accident/medical cover may be mandatory DROPi or insurer policy. They are not described as state attestations unless a traced source and approved interpretation establish that requirement.

### 3.3 Drone parcel delivery

| Requirement ID | Source IDs | Provisional requirement | Company gate | Controller/aircraft/operation gate | State |
|---|---|---|---|---|---|
| `RO-UAS-001` | `EU-REG-2019-945-ORIGINAL`, `EU-REG-2019-947-CONSOLIDATED-2025-05-01`, `RO-AACR-DRONE-GUIDANCE-CURRENT` | Classify the real delivery CONOPS under current EU and Romanian rules; delivery is not presumed to fit the open category | Operator registration/authorization/certificate and manuals appropriate to the approved category/CONOPS | Remote-pilot competency, aircraft class/registration, airspace/geography, operating authorization, insurance, payload and mission limits | `current_source_pending` |
| `RO-UAS-002` | Same | Every mission must remain inside the approved operating volume and conditions | Approved zones, operational risk assessment, authority conditions, safety/incident system | Exact pilot, aircraft, weather, airspace, payload, route and authorization current at dispatch/start | `current_source_pending` |

EU source capture permits architectural planning only. Missing current AACR/national material and a counsel/authority-approved CONOPS block law-dependent onboarding, dispatch, and flight.

## 4. Romania — Passenger Mobility by car

| Requirement ID | Source IDs | Provisional requirement | Company/platform gate | Partner/operator/driver/car gate | Product/control implication | State |
|---|---|---|---|---|---|---|
| `RO-PM-PLATFORM-001` | `RO-OUG-49-2019`, `RO-LAW-204-2019`, `RO-ADR-DECISION-572-2020-NORMS`, `RO-ADR-PLATFORM-PROCEDURE-2026-09-12` | The digital-platform operator is a distinct regulated actor and requires the applicable ADR technical endorsement | Correct resident entity or qualifying Romanian branch; functional description, security plan, eligible independent IT audit, recent audit report, continuity/recovery, fee, privacy declarations and accredited electronic archive evidence as currently required | Not applicable to the individual driver gate | Model platform authority independently and block all ride operation if absent/suspended/expired | `captured_for_research` |
| `RO-PM-OPERATOR-001` | `RO-OUG-49-2019`, `RO-ARR-AUTHORIZATION-CHECKLIST-2026-09-12` | Transport operator authority belongs to an eligible PFA/II/IF/legal person and is not granted by DROPi | Platform may affiliate only with eligible transport operators | Operator activity, ARR authorization, competent manager or qualifying titular, records, contracts and current status | `transportOperator` aggregate and affiliation gate | `captured_for_research` |
| `RO-PM-DRIVER-001` | Same | Driver qualification, licence, criminal-record conditions and medical/psychological fitness are separately evidenced | Verification/reverification procedure and suspension integration | Driver-specific current licence, professional certificate and required fitness/background evidence | No ride offer/accept/start without active driver capability | `captured_for_research` |
| `RO-PM-CAR-001` | Same | Each car requires its own lawful-use, compliant-copy, badge, inspection, insurance and capacity evidence | Platform verifies approved vehicle class and operator affiliation | Vehicle-specific documents, passenger/baggage cover, registered/legal capacity, zone and current status | Vehicle substitution triggers review; capacity is evidence-derived | `captured_for_research` |
| `RO-PM-ZONE-001` | `RO-OUG-49-2019`, `RO-ARR-AUTHORIZATION-CHECKLIST-2026-09-12` | Operating geography follows the authorized operator's statutory/local scope and applicable trip rules | Enable exact approved territorial pack only | Operator/vehicle eligibility intersects the current request zone | No country-wide online toggle | `captured_for_research` |
| `RO-PM-CAEN-001` | `RO-ARR-AUTHORIZATION-CHECKLIST-2026-09-12`, `RO-INSSE-CAEN-REV3` | The current Romanian ARR page states 4933, but its English section still states 4939; platform and operator may also require different activity classes | Obtain written ONRC/ARR/accountant/counsel confirmation for each entity's actual activity set | Operator business record must match the approved mapping | Never hardcode 4933, 4939, 5232, 5231 or 5320 as universal eligibility | `written_confirmation_required` |
| `RO-PM-FISCAL-001` | `RO-OUG-49-2019`; current fiscal sources pending | Payment method affects receipt/invoice/fiscal-device duties | Approve collection, commission, payout, tax and refund model | Operator-specific fiscal readiness | Cash and live charging remain disabled until approved | `current_source_pending` |

Result: the read-only C1 Passenger Mobility shell may remain `catalog_locked`. Law-dependent Romanian onboarding must wait for approved requirements; live quotes, bookings, matching, dispatch, ride start, and payment remain blocked until both gates pass.

## 5. Philippines — parcel delivery

| Requirement ID | Source IDs | Provisional requirement | Gate and implementation consequence | State |
|---|---|---|---|---|
| `PH-DEL-COMP-001` | `PH-RA-7354` | The base act refers to registration/prequalification of letter/parcel messengerial, door-to-door, and similar transport-of-property activity | Identify the current competent authority, implementing rules, licence/registration procedure, scope, exemptions, and DROPi/local operator role before designing company authorization | `current_source_pending` |
| `PH-DEL-CONTRACT-001` | `PH-RA-7354`; current commercial/labor/local sources pending | A local entity, independent operator, or contractor label does not settle regulatory responsibility | Counsel-approved entity, courier/provider, tax, employment/contract and subcontracting model is required per zone/service | `written_confirmation_required` |

### 5.1 Road delivery modes

| Mode | Company gate | Partner/person gate | Vehicle gate | Current design decision | Source status |
|---|---|---|---|---|---|
| Pedal bicycle | Approved delivery/provider and local business model | Identity and lawful work/business relationship; no general state-issued courier-cyclist attestation is established here | LGU road/safety rules and insurer-approved equipment | DROPi training/medical or accident cover may be policy; do not call it a government certificate | `PH-RA-4136` is a base source; current national/LGU sources pending |
| E-bike | Same company gate | Current LTO/LGU rider requirements for exact classification | LTO classification, registration, allowed roads/speed/equipment and insurance if applicable | Do not infer that every e-bike is legally a bicycle | `current_source_pending` |
| Scooter/motorcycle | Same company gate | Professional/non-professional licence treatment, lawful work relationship and required safety evidence | LTO registration/OR/CR, roadworthiness, class, insurance and local restrictions | Onboarding labels and eligibility remain blocked | `PH-RA-4136` captured; current LTO/LGU instruments pending |
| Parcel car/van | Same company gate plus exact provider/transport role | Correct licence and lawful work/business relationship | LTO registration/OR/CR, classification, capacity/mass, inspection, insurance and use/route rules | Parcel capability remains separate from TNVS passenger authority | `current_source_pending` |

## 6. Philippines — drone parcel delivery

| Requirement ID | Source IDs | Provisional requirement | Company/operator gate | Controller/aircraft/operation gate | State |
|---|---|---|---|---|---|
| `PH-UAS-001` | `PH-CAAP-PCAR-PART-11-2026-09-12`, `PH-CAAP-RPAS-OPERATOR-2026-09-12` | Commercial operation is represented by CAAP material as requiring an RPAS Operator Certificate | Local entity/operator eligibility, certificate, organization, manuals, nominated responsible personnel and approved operations | Operation must fall inside certificate and CAAP conditions | `current_source_pending` because the official pages are under maintenance |
| `PH-UAS-002` | `PH-CAAP-RPA-CONTROLLER-2026-09-12`, `PH-CAAP-PCAR-PART-11-2026-09-12` | Commercial controllers require the applicable CAAP controller certificate | Company verifies and revalidates credential | Controller training, exam/fitness/experience, aircraft type and validity as confirmed by CAAP | `captured_for_research` |
| `PH-UAS-003` | `PH-CAAP-RPA-REGISTRATION-2026-09-12`, `PH-CAAP-PCAR-PART-11-2026-09-12` | CAAP material states commercial RPAs require registration regardless of weight | Fleet and registration control | Aircraft-specific registration, serial identity, maintenance, payload and operating conditions | `captured_for_research` |
| `PH-UAS-004` | Same plus current operational approvals pending | Operator/controller/aircraft certificates do not automatically authorize parcel routes, BVLOS, urban flight, dropping/releasing payload, airspace, or each CONOPS | Direct CAAP approval of the delivery CONOPS and zones | Mission-specific conditions pass at dispatch/start | `current_source_pending` |

## 7. Philippines — Passenger Mobility

### 7.1 Car-based TNC/TNVS

| Requirement ID | Source IDs | Provisional requirement | Company/TNC gate | Partner/TNVS/driver/car gate | Product/control implication | State |
|---|---|---|---|---|---|---|
| `PH-PM-TNC-001` | `PH-DOTR-DO-2015-011`, `PH-DOTR-DO-2018-013`, `PH-LTFRB-MC-2015-015`, `PH-SC-GR-242860-2019`, current charter/circular pending | App-based compensated car transport uses a regulated TNC/TNVS model | Eligible Philippine operating entity or approved Zone Operator holds current TNC authority, regulator interfaces, support, audit and insurance systems | Separate from individual TNVS authority | Do not present DROPi Core software registration as TNC authority | `current_source_pending` |
| `PH-PM-TNVS-001` | `PH-LTFRB-MC-2015-017`, `PH-LTFRB-MC-2015-018`, `PH-LTFRB-MC-2026-049-PENDING`, `PH-LTFRB-CITIZENS-CHARTER-CURRENT` | Each operator/vehicle requires the current LTFRB authority and TNC affiliation/enrollment | TNC verifies only currently admitted classes/service areas | Current operator authority, driver licence/clearances, OR/CR, vehicle eligibility, insurance and capacity | Document types, labels and expiry cannot be finalized until primary current sources are obtained | `current_source_pending` |
| `PH-PM-ATOC-001` | `PH-LTFRB-MC-2026-049-PENDING` plus two secondary alert IDs | Reports of a CPC-to-ATOC transition are not an implementation fact | Obtain official MC 2026-049 and written scope/effect confirmation | Migrate only eligible records under approved rules | No `ATOC`, five-year validity, or automatic conversion hardcoding | `current_source_pending` |

### 7.2 Motorized tricycle-for-hire

| Requirement ID | Source IDs | Provisional requirement | Company/local-service gate | Driver/operator/tricycle gate | Product/control implication | State |
|---|---|---|---|---|---|---|
| `PH-PM-TRI-001` | `PH-RA-7160`, `PH-LTO-MC-94-199` | Tricycle-for-hire franchising/operation depends materially on the competent city or municipality | Exact Zone 0 LGU, local entity/TNC position, ordinance, franchise board and app-dispatch permission are mandatory | Franchise/MTOP or exact local authority, driver licence/permit, OR/CR, inspection, insurance, route/zone and capacity | Capability stays `disabled_legal_gate`; country-level configuration is insufficient | `current_source_pending` |
| `PH-PM-TRI-002` | Exact LGU ordinance missing | Capacity, fare, streets/routes, boundaries and service hours must come from the local authorization and vehicle/insurance evidence | Pack encodes only written approved local rules | Vehicle capacity is the lowest proved limit | Never assume “one or two passengers” | `current_source_pending` |

## 8. Multiservice combination rule

Delivery and Passenger Mobility can coexist in one application, one identity system, and one partner account. They cannot share authority.

| Shared safely | Must remain separate |
|---|---|
| Login, identity core, payments infrastructure, secure storage, notifications, maps, support shell, audit platform | Company service authorization, partner capability, vehicle capability, contracts, insurance, document requirements, mission/trip records, price rules, safety lifecycle, retention, regulator exports |

A person authorized for both receives independent capabilities such as `parcel_ground` and `passenger_car`. The first release must prevent simultaneous capacity-consuming DROPi parcel and passenger missions. Any later mixed-use change requires a new legal, insurance, safety, and product decision.

## 9. Current approval result

No entry in this matrix is `approved` for public operation. The following are allowed now:

- research and source capture;
- generic compliance/audit architecture;
- read-only, truthful `catalog_locked` service presence;
- synthetic tests that cannot dispatch a real person, parcel, or aircraft.

Law-dependent onboarding fields, live dispatch, mission/trip start, and regulated payment must remain fail-closed until the relevant source records and requirements complete the canonical approval lifecycle.

## 8. Romania — first-launch Marketplace, payments, postal resale and privacy

This section narrows the Romanian legal MVP before #500 backlog reconciliation. None of these rows is an authorization. The first-launch operating hypothesis is deliberately narrower than the complete DROPi capability catalog.

### 8.1 Launch-scope policy

| Requirement ID | Source IDs | Provisional requirement | Product/control implication | State |
|---|---|---|---|---|
| `RO-LAUNCH-SCOPE-001` | Owner launch decision + legal-risk reduction | First public pilot is restricted to verified professional merchants and a closed low-complexity non-food allowlist | Private/P2P sellers and unapproved product categories remain disabled by default | `policy_only` |
| `RO-LAUNCH-SCOPE-002` | `RO-LAW-209-2019-CURRENT` plus pending PSP review | First launch uses an eligible external PSP and does not intentionally hold/safeguard customer funds or issue stored value | No DROPi wallet/escrow claim; provider abstraction, payment references, fees, refunds and reconciliation only | `policy_only` |
| `RO-LAUNCH-SCOPE-003` | Postal sources below + owner launch decision | Merchant fulfilment may precede integrated DROPi postal resale; own delivery network is a later authorization layer | Fulfilment role is explicit per order; no universal `deliveryEnabled` flag | `policy_only` |

### 8.2 Marketplace and Romanian consumer-contract controls

| Requirement ID | Source IDs | Provisional requirement | Gate and implementation consequence | State |
|---|---|---|---|---|
| `RO-MKT-001` | `RO-OUG-34-2014-CURRENT` Art. 6^1 | Before a Marketplace offer/contract becomes binding, provide the legally required information on main ranking parameters and relative importance | Search/ranking policy must be versioned and surfaced through the applicable pre-contract UI | `current_source_pending` |
| `RO-MKT-002` | `RO-OUG-34-2014-CURRENT` Art. 6^1 | Disclose whether the third-party seller is a professional | Merchant legal status must be represented and rendered before binding order; first-launch policy admits professionals only | `current_source_pending` |
| `RO-MKT-003` | `RO-OUG-34-2014-CURRENT` Art. 6^1 | Where applicable, disclose how contract-related obligations are shared between seller and Marketplace provider without misrepresenting statutory responsibility | Versioned seller/DROPi responsibility allocation is required before binding checkout | `current_source_pending` |
| `RO-MKT-004` | `RO-OUG-18-2026`; `RO-OUG-34-2014-CURRENT` Art. 11^1 | For covered online distance contracts, provide the required visible online withdrawal function, unambiguous confirmation and durable acknowledgement containing withdrawal content and date/time | Withdrawal becomes an auditable order-state action, not a later support-only feature | `current_source_pending` |
| `RO-MKT-005` | `RO-OUG-18-2026`; `RO-OUG-34-2014-CURRENT` | Product information and checkout must be designed against provisions applicable at actual launch, including 2026 amendments applicable from 19 June and 27 September as relevant | Legal-pack version/effective date gates checkout and product-information schema | `current_source_pending` |
| `RO-MKT-006` | Same + qualified Romanian consumer/e-commerce review | Determine exactly who performs withdrawal, conformity, complaint and refund duties when merchant is seller of record and DROPi supplies the interface | Support/responsibility state machine cannot be inferred from preferred UX | `written_confirmation_required` |

### 8.3 DSA classification and small-enterprise scope

| Requirement ID | Source IDs | Provisional requirement | Gate and implementation consequence | State |
|---|---|---|---|---|
| `RO-DSA-001` | `EU-REG-2022-2065-DSA`, `RO-LAW-50-2024` | Classify each first-launch DROPi function under the DSA intermediary/hosting/online-platform/Marketplace framework | Store service classification and applicable legal pack; no global `dsaCompliant` boolean | `written_confirmation_required` |
| `RO-DSA-002` | `EU-REG-2022-2065-DSA` Arts. 19 and 29 | Determine and periodically revalidate whether the operating entity qualifies for the relevant micro/small exclusions and whether a transition or VLOP exception applies | Enterprise-size evidence and effective/review dates select the applicable obligation set | `written_confirmation_required` |
| `RO-DSA-003` | `EU-REG-2022-2065-DSA` Arts. 29-30 | Do not represent Article 30 trader traceability as universally mandatory where Section 4 is excluded; distinguish law-required fields from stricter DROPi professional-merchant policy | Merchant-verification fields carry provenance such as law/policy/provider requirement | `current_source_pending` |

### 8.4 GPSR / product-safety Marketplace controls

| Requirement ID | Source IDs | Provisional requirement | Gate and implementation consequence | State |
|---|---|---|---|---|
| `RO-GPSR-001` | `EU-REG-2023-988-GPSR-CONSOLIDATED-2026-05-29` Art. 22 | Implement the applicable Marketplace product-safety authority contact and Safety Gate registration obligations | Public product activation requires scoped registration/contact evidence where applicable | `current_source_pending` |
| `RO-GPSR-002` | Same | Implement consumer product-safety contact and internal product-safety processes | Dedicated safety-report intake, case state and escalation evidence | `current_source_pending` |
| `RO-GPSR-003` | Same | Handle product-safety notices/orders within the applicable statutory timeframes, including Article 22's three-working-day notice framework where applicable | Timed safety queue, SLA evidence, escalation and immutable audit | `current_source_pending` |
| `RO-GPSR-004` | Same | Listing interface must enable required product/economic-operator/safety information to be supplied and displayed/accessed | Category-aware mandatory listing fields and publish gate | `current_source_pending` |
| `RO-GPSR-005` | Same + category-specific sources | Fix the exact first-launch paper/stationery/art-print allowlist and exclusions before public catalog activation | Category compliance pack controls what can be listed | `written_confirmation_required` |

### 8.5 Payment perimeter and money flow

| Requirement ID | Source IDs | Provisional requirement | Gate and implementation consequence | State |
|---|---|---|---|---|
| `RO-PAY-001` | `RO-LAW-209-2019-CURRENT` plus PSD2/EBA/current PSP evidence pending | Determine the payment-service perimeter for the exact factual money flow | No live charging until the selected PSP architecture and legal perimeter are approved | `written_confirmation_required` |
| `RO-PAY-002` | First-launch policy derived from #495 | DROPi does not intentionally take custody/safeguard customer funds or issue stored value in the first launch | Regulated PSP moves funds; DROPi stores provider references, allocation and reconciliation evidence | `policy_only` |
| `RO-PAY-003` | Selected PSP + Romanian accountant/payment review | Determine supplier, platform fee, postal fee, settlement, refund, chargeback, negative-balance and invoice treatment | Versioned money-flow/invoice matrix drives ledger and refund implementation | `written_confirmation_required` |

### 8.6 Postal resale / ANCOM role

| Requirement ID | Source IDs | Provisional requirement | Gate and implementation consequence | State |
|---|---|---|---|---|
| `RO-POST-001` | `RO-OUG-13-2013-PORTAL-2026-09-15`, `RO-ANCOM-DECISION-925-2023`, `RO-ANCOM-GENERAL-AUTHORIZATION-2026-09-12` | Classify offering, resale, provision and technical/intermediation roles from the factual end-to-end flow before activation | Legal role is bound to entity, contracts and service flow; UI or CAEN label cannot decide it | `written_confirmation_required` |
| `RO-POST-002` | `RO-ANCOM-DIGITAL-POSTAL-RESELLERS-2026-09-15`, `RO-ANCOM-DECISION-925-2023` | If DROPi acts as postal reseller, establish the required commercial relationship with effective postal provider(s) and allocate reseller responsibility correctly | Contract registry, provider authority evidence, customer terms and complaint/claim ownership are activation evidence | `current_source_pending` |
| `RO-POST-003` | `RO-ANCOM-DIGITAL-POSTAL-RESELLERS-2026-09-15` | A postal-resale platform must disclose that effective performance is by postal provider(s) and identify at least the collecting provider as required by current ANCOM guidance | Checkout/order/tracking exposes effective provider identity | `current_source_pending` |
| `RO-POST-004` | `RO-OUG-13-2013-PORTAL-2026-09-15`, `RO-ANCOM-GENERAL-AUTHORIZATION-2026-09-12` | Required notification/authority evidence must exist before the relevant postal role is enabled | Fail-closed company/service capability gate | `current_source_pending` |
| `RO-POST-005` | Owner launch policy | Merchant fulfilment, carrier intermediation, postal resale and later own postal provision remain distinct operating states | Separate domain/API roles and contract families; no ambiguous generic delivery authorization | `policy_only` |

### 8.7 CAEN role evidence

| Requirement ID | Source IDs | Provisional requirement | Gate and implementation consequence | State |
|---|---|---|---|---|
| `RO-CAEN-LAUNCH-001` | `RO-ONRC-CAEN-REV3-2026-09-15` | Candidate launch activity mapping must distinguish Marketplace/intermediation classes `4791`/`4792` and postal provision/intermediation classes `5320`/`5330` according to the actual business flow | Entity activity set is role-specific and versioned; accountant/ONRC confirmation remains required | `current_source_pending` |
| `RO-CAEN-LAUNCH-002` | `RO-ONRC-CAEN-REV2-REV3-CORRESPONDENCE-2026-09-15` + ANCOM sources | ONRC describes `5330` as intermediation without the intermediary itself providing postal/courier service; CAEN cannot reclassify factual postal resale/provision | Sector role is independently derived and reviewed | `written_confirmation_required` |

### 8.8 Romania-launch privacy and data roles

| Requirement ID | Source IDs | Provisional requirement | Gate and implementation consequence | State |
|---|---|---|---|---|
| `RO-DATA-001` | `EU-GDPR-2016-679`, `RO-LAW-190-2018-CURRENT` | Map controller/processor/independent-controller role per flow among DROPi, merchant, PSP, carrier and infrastructure vendors | Data-flow role registry drives agreement, access and responsibility selection | `written_confirmation_required` |
| `RO-DATA-002` | Same plus current ANSPDCP/EDPB guidance pending | Determine purpose/legal basis and retention/legal-hold separately for account, merchant verification, order, tax, PSP, postal, withdrawal, complaint, DSA/GPSR, support and marketing data | No universal consent checkbox or one-size retention period | `written_confirmation_required` |
| `RO-DATA-003` | Same + qualified review | Determine DPIA need and breach/data-rights ownership for the first pilot | DPIA decision record, incident routing and deletion/restriction/legal-hold state machine are launch evidence | `written_confirmation_required` |

### 8.9 Launch promotion gate

For this section, a row may move toward `approved` only when:

`registered source + controlled current copy where required + exact provision + scoped DROPi factual flow + qualified interpretation where required + owner operating decision + implementation/test evidence`.

Until then, law-dependent behavior stays configurable and fail-closed. #500 may use these rows to build a **candidate** developer priority map, but it must not treat a pending legal row as permission to enable the corresponding service.
