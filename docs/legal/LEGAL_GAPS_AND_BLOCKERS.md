# Legal Gaps and Launch Blockers

**Version:** 1.0.0
**As of:** 2026-09-12
**Default:** every item below blocks only its affected scope, but no affected scope may be enabled by an override.

This register prevents an unanswered legal question from becoming an accidental product assumption. Resolution requires a primary/current source, written analysis, scoped approval, updated traceability, and implementation/test evidence.

## P0 — blocks law-dependent product design or filing

| ID | Scope | Gap | Required evidence to close | Owner role | Blocks |
|---|---|---|---|---|---|
| `GAP-RO-DEL-ROLE` | Romania parcel delivery | DROPi's exact status as postal provider, reseller/intermediary, or software platform is unresolved for each proposed flow | Current consolidated OUG 13/2013, Decision 925/2023 analysis, process map, written Romanian counsel/ANCOM position | RO Legal/Compliance | Company gate, contracts, partner model, document schema, public delivery launch |
| `GAP-RO-CAEN` | Romania company/partners | ARR Romanian checklist names 4933 while its English section still names 4939; platform, delivery and transport-operator activities may differ | Archived INSSE Rev. 3 source plus written ONRC/ARR/accountant/counsel mapping for each entity and role | RO Legal + Finance | Entity filing fields, onboarding business-code validation, Passenger Mobility filing |
| `GAP-RO-ROAD-MODES` | Romania bicycle/e-bike/scooter/car/van delivery | Current road, vehicle classification, licence, registration, inspection, insurance, occupational-safety and cargo rules are not yet captured as a complete set | Current legislation and authority/insurer matrix per technical vehicle class, mass, power, speed, use and geography | RO Legal + Safety | Mode-specific onboarding and online/dispatch/start eligibility |
| `GAP-RO-DRONE-CONOPS` | Romania drone delivery | Current AACR material and classification/approval of the actual DROPi delivery CONOPS are missing | Current AACR sources; operator/remote-pilot/aircraft/airspace/insurance requirements; SORA/authorization or certificate position; written authority/counsel review | Aviation Compliance | All law-dependent drone design, pilot and public operation |
| `GAP-PH-DEL-AUTHORITY` | Philippines parcel delivery | RA 7354 is historic; current regulator, implementing procedure, licence/registration, scope, exemptions and DROPi role are unknown | Current primary regulations, competent-authority charter/forms, counsel/regulator confirmation and end-to-end provider map | PH Legal/Compliance | Company delivery gate, partner contracts, public parcel operation |
| `GAP-PH-TNC-CURRENT` | Philippines car Passenger Mobility | Official current TNC accreditation/TNVS rules and Citizen's Charter were not obtained | Current LTFRB/DOTr primary instruments, charter, forms, entity eligibility, caps/windows, service areas, vehicle/driver criteria, fees and validity | PH Legal/Compliance | TNC entity model, document schema, onboarding, pilot/public rides |
| `GAP-PH-MC-2026-049` | Philippines TNVS authority | Official MC 2026-049 was not located; CPC-to-ATOC details exist only as news alerts | Official signed circular and LTFRB confirmation of scope, effective date, eligibility, transition, validity and terminology | PH Legal/Compliance | CPC/PA/ATOC data model, migration, expiry and UI copy |
| `GAP-PH-ZONE0-LGU` | Philippines tricycle Passenger Mobility | Zone 0 city/municipality has not been named, so its ordinance and competent franchising body cannot be identified | Owner selects exact LGU; obtain current ordinance, MTFRB/franchise rules, permits, routes/roads, boundaries, capacity, fares, hours, insurance and written app-dispatch/TNC position | Project Owner + PH Legal | All tricycle law-dependent design and every operational stage |
| `GAP-PH-DRONE-CURRENT` | Philippines drone delivery | CAAP Part 11 and ROC pages are marked as undergoing updates/maintenance | Controlled current PCAR text and direct CAAP confirmation of controller, aircraft, operator, CONOPS, BVLOS/payload/route/airspace, insurance and local entity rules | Aviation Compliance | Company/operator schema, drone onboarding, flight pilot/public operation |

## P1 — blocks pilot or public enablement

| ID | Scope | Gap | Required evidence to close | Owner role | Blocks |
|---|---|---|---|---|---|
| `GAP-ENTITY-MAP` | Both countries, all services | Responsible legal entity and allocation between DROPi Core, platform/TNC, Zone Operator, postal/courier provider and transport operator are not fixed | Counsel-approved entity/responsibility/RACI and contract map per market and service | Corporate Legal | Filing, contracts, liability and company gate |
| `GAP-WORKER-STATUS` | Both countries, all partner modes | “Self-employed”/PFA labeling is not a complete worker-status or algorithmic-management analysis | Country-specific employment, contractor, tax and platform-work opinion for each operator model | Labor/Tax Counsel | Partner terms, controls, payouts and public onboarding |
| `GAP-CONTRACTS` | Both countries | Required affiliation, service, partner, data, regulator-access, audit, termination and incident agreements are not approved | Local-counsel-approved agreement set, versioning and signatory rules | Legal + Operations | Onboarding acceptance and any pilot |
| `GAP-INSURANCE` | Both countries, each mode | Products, limits, exclusions, passenger/baggage/cargo/aviation cover and claims process are not confirmed | Written insurer/broker bindable coverage and claims/runbook approval per entity/service/vehicle/zone | Risk/Insurance | Capability activation and pilot/public operation |
| `GAP-DATA-RETENTION` | Both countries | Exact purposes, legal bases, regulator/tax/insurance/safety retention, deletion and legal-hold rules are incomplete | DPIA/privacy impact work, records-of-processing map and counsel-approved retention schedule | Privacy/Security | Production data schema, collection and operational launch |
| `GAP-PRICING-FISCAL` | Both countries, passenger and delivery | Price/fare, cash, invoice/receipt, tax, commission, payout, refund and chargeback duties depend on the entity/payment flow | Counsel/accountant/regulator-approved flow per market and service | Finance/Legal | Live quotes, charging, cash and receipts |
| `GAP-SAFETY-OPS` | Both countries, each mode | Training, medical/accident cover, protective equipment, work-hour/fatigue, incident response and emergency/support requirements are not reconciled with law/insurer policy | Separate legal requirements and labeled DROPi/insurer policies; tested runbooks and staffing | Safety/Operations | Partner activation and operational pilot |
| `GAP-LOCAL-ZONES` | Both countries | City, road, route, airspace and local-business restrictions are not fully mapped | Approved per-zone authority pack and geospatial controls | Local Compliance | Zone enablement and matching/dispatch |

## Explicit non-assumptions

- No source captured so far establishes a universal government attestation for a parcel courier riding an ordinary pedal bicycle in either country.
- A bicycle safety course, medical policy, helmet rule, or personal-accident cover may be imposed by DROPi, contract, employer, LGU, or insurer; its source must be labeled accurately.
- A PFA, sole proprietor, corporate registration, PSIC/CAEN code, driving licence, vehicle registration, or uploaded document is not by itself service authorization.
- Passenger authority does not authorize parcel/postal service; parcel authority does not authorize passengers.
- A drone controller certificate does not authorize the company, aircraft, route, payload operation, airspace, or delivery CONOPS by itself.
- A foreign company registration does not automatically authorize local platform, postal, transport, privacy, tax, or aviation activity.

## Closure protocol

For every gap:

1. archive/register the current primary source;
2. cite the exact provision, version, authority and effective date;
3. obtain qualified interpretation and written confirmation where required;
4. separate legal duties from DROPi/insurer policy;
5. update the requirement and company/partner/product gate;
6. implement and test the control;
7. record scoped approval and next review date;
8. enable only the approved entity/service/vehicle/zone stage.
