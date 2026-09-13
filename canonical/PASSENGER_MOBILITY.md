# DROPi Canonical Reference: Passenger Mobility

**Version:** 1.0.0
**Status:** PLANNING CANON — NOT LIVE
**Decision date:** 2026-09-12
**Initial jurisdictions:** Philippines (Zone 0) and Romania
**Legal review:** Required before any production enablement

## 1. Purpose

DROPi may connect a passenger who requests point-to-point ground transport with an eligible partner who is legally authorized to provide that service. The product name for this capability is **Passenger Mobility**. Jurisdiction-specific user-facing names may include “Ride”, “Transport alternativ”, “TNVS”, or a locally approved equivalent.

Passenger Mobility is distinct from parcel delivery. A person is the transported subject, not a package, order item, or delivery recipient. Passenger safety, operator licensing, vehicle capacity, insurance, incident response, privacy, pricing, and retention therefore use a dedicated domain and dedicated authorization gates.

This document defines the product boundary and architecture. It does not grant legal authority, replace regulator approval, or constitute legal advice.

## 2. Canonical placement

### 2.1 Channel decision

Passenger Mobility is a **service vertical inside C1**, not a new operational channel.

| Context | Canonical status | Rule |
|---|---|---|
| C1 Marketplace | Planned, launch scope | A dedicated “Request a ride” surface may be enabled per jurisdiction and zone. |
| C2 Contracted Operations | Reserved, disabled | Contracted passenger transport requires its own future business and legal decision; C1 authorization does not carry over. |
| C3 Emergency Operations | Prohibited for this service | Passenger Mobility must not be presented as ambulance, patient transport, evacuation, or emergency response. |
| Admin | Required control plane | Compliance, audit, incident, pricing, jurisdiction, and capability controls live here. |

No C4/taxi channel is created. Channels describe operating contexts; `delivery` and `passenger_mobility` describe services.

### 2.2 Product surfaces

The same DROPi human account and application shell are reused. The customer-facing C1 service selector exposes two explicit entry points:

1. **Send a package** — existing delivery domain.
2. **Request a ride** — Passenger Mobility domain, shown only where the jurisdiction and zone are enabled.

Any eligible, non-suspended human C1 participant—including a Customer, Merchant, or Delivery Partner using the personal passenger view—may request a ride. Passenger participation is a service context, not another mutually exclusive `dropiRole`. Merchant or partner status does not change passenger rights, price, safety treatment, or driver eligibility. A Delivery Partner may apply to provide Passenger Mobility and may separately request a personal ride without creating a second human account.

## 3. Non-negotiable separation from delivery

- A delivery authorization MUST NOT unlock Passenger Mobility.
- A global `isVerified` flag MUST NOT be treated as authority to carry passengers.
- Passenger Mobility MUST NOT reuse cargo `orders`, `deliveries`, package states, proof-of-delivery, or delivery pricing as its system of record.
- Passenger trips MUST have a dedicated lifecycle, safety controls, audit events, cancellation rules, and receipts.
- A vehicle approved for parcel delivery MUST undergo passenger-service review before it can carry passengers.
- A partner MUST NOT carry a commercial DROPi parcel and a DROPi passenger on the same active job in the first release. Normal passenger baggage is not a parcel mission.
- Only one capacity-consuming DROPi mission may be active for a partner/vehicle at a time in the first release.

Shared primitives are allowed for identity, authentication, payments, notifications, secure document storage, maps, support, audit infrastructure, and jurisdiction configuration.

## 4. Identity, roles, and capabilities

The canonical human roles remain unchanged. Passenger Mobility is represented through many-to-many **service capabilities**, not by replacing `dropiRole` or `channel`. Only natural persons may be passengers or drivers. AI agents may assist with disclosed, governed recommendations and administrative workflows but MUST NOT request, accept, board, start, or complete a real passenger ride on a human’s behalf.

Initial capability vocabulary:

| Capability | Meaning | Example evidence |
|---|---|---|
| `parcel_ground` | Terrestrial parcel delivery | Delivery-specific identity, vehicle, insurance, and local operating evidence |
| `parcel_drone` | Drone delivery/supervision | Aviation and zone-specific evidence |
| `passenger_car` | Passenger service with an eligible car | Driver, operator, platform affiliation, vehicle, insurance, and jurisdiction evidence |
| `passenger_tricycle` | Passenger service with a motorized tricycle | Driver, vehicle, local franchise/permit, route/zone, insurance, and LGU-specific evidence |

Capability state is evaluated at request/offer/accept/start time:

`requested → evidence_pending → under_review → active → suspended | expired | revoked | rejected`

An `active` capability MUST be bound to:

- one person/account;
- one service type;
- one or more approved vehicles;
- one jurisdiction pack and operating zone;
- an effective period;
- all required contracts and evidence versions.

Eligibility is the conjunction below, never a single boolean:

`person eligible ∧ operator eligible ∧ vehicle eligible ∧ platform enabled ∧ zone enabled ∧ documents current ∧ contracts current ∧ no safety suspension`

## 5. Jurisdiction packs

Every production zone MUST select a versioned jurisdiction pack. A pack defines regulator roles, permitted service and vehicle classes, documentary requirements, expiry/reverification rules, pricing controls, retention, tax/receipt rules, safety controls, and legal copy.

Pack states:

`draft → counsel_review → regulator_confirmed → approved → enabled → suspended | retired`

The application MUST fail closed when a pack is absent, expired, suspended, or not approved. Country selection alone is insufficient; local authority rules may differ by city or municipality.

### 5.1 Romania baseline

The production model must distinguish:

- **operatorul platformei digitale** — the legal entity operating/intermediating the platform and holding the required technical endorsement;
- **operatorul de transport alternativ** — PFA, II, IF, or legal person authorized for the transport activity;
- **conducătorul auto** — the qualified driver;
- **autoturismul** — the individually authorized and badged vehicle;
- **pasagerul** — the party to the trip request/transport contract.

Required evidence is defined in the Romania jurisdiction pack and must, at minimum, cover the platform endorsement, affiliation contract, operator authorization, compliant copy per car, badges, professional certificate, driving licence, criminal record conditions, medical/psychological fitness, registration/ownership or lawful use, technical inspection, civil liability, passenger/baggage insurance, and fiscal/receipt configuration as applicable.

The pack MUST preserve the legal distinction between DROPi’s platform activity and each partner’s transport activity. Current CAEN Rev. 3 classifications and the legacy classification still referenced in transport procedures MUST be confirmed with ONRC/ARR before filing or production copy is finalized.

### 5.2 Philippines / Zone 0 baseline

Zone 0 follows a local-operator model. DROPi Core supplies software, policy, and audit controls; a counsel-approved Philippine entity and operating arrangement must hold or contract for the required national and local authority.

Passenger cars and motorized tricycles MUST NOT share one ruleset:

- car-based app transport is governed through the applicable TNC/TNVS and LTFRB/LTO framework;
- tricycles-for-hire depend on the selected city/municipality’s franchise, permit, route/zone, capacity, vehicle, and driver rules;
- a tricycle capability remains disabled until the exact Zone 0 LGU is named and its ordinance/franchising authority confirms the operating model;
- a parcel-delivery permit or account does not substitute for passenger authority.

Current LTFRB terminology, validity periods, application windows/caps, and any CPC-to-ATOC transition MUST be revalidated against the official circular and current Citizen’s Charter immediately before implementation.

## 6. Vehicle rules

The platform never invents legal capacity. `passengerCapacity` is the smallest of:

- registered passenger capacity excluding the driver;
- capacity stated by the relevant authorization/franchise;
- insurance-covered capacity;
- jurisdiction or vehicle-class cap;
- platform safety cap approved for the zone.

Initial vehicle classes are `car` and `motorized_tricycle`. Each class is independently enabled by jurisdiction and zone. Motorcycles, bicycles, vans/minibuses, patient transport, school transport, and pooled/shared rides are out of initial scope.

Before a driver can go online for Passenger Mobility, the selected vehicle, plate/identifier, capacity, documents, inspection state, insurance, and zone authority must all be current. Vehicle substitution triggers a new review; authority never transfers automatically between vehicles.

## 7. Company and contract model

The legal-entity mapping is hybrid by jurisdiction and MUST be approved before launch. The product supports these distinct actors:

| Actor | Canonical responsibility |
|---|---|
| DROPi Core | Product, policy templates, security baseline, audit schema, software, and brand governance |
| Platform operator | Regulated digital intermediation, platform approval/accreditation, required records, support, and regulator access |
| Zone Operator | Local permits, regulator relationships, operating controls, incident escalation, and local audits where contracted |
| Transport operator | Holds passenger-transport authority and eligible vehicles; signs affiliation/operating agreements |
| Driver | Holds personal qualifications; accepts conduct, safety, data, and service terms |
| Passenger | Accepts passenger terms, pricing, privacy, safety, and cancellation conditions |

Required agreement families:

1. platform terms and passenger transport request terms;
2. platform–transport operator affiliation agreement;
3. Zone Operator agreement where that model is used;
4. driver/operator relationship evidence where required by law;
5. data-controller/processor and cross-border data clauses as applicable;
6. insurance acknowledgements and incident-cooperation duties;
7. payment, commission, tax, invoice/receipt, refund, and chargeback terms;
8. regulator/auditor access and record-retention obligations.

Contract acceptance must be versioned, timestamped, printable/exportable where required, and linked to the capability decision.

## 8. Compliance documents and review

Documents are evidence, not permissions by themselves. Each record MUST include:

- subject type and subject identifier (`person`, `operator`, `vehicle`, `platform`, `zone`);
- jurisdiction, regulator, document type, number, issuer, and source;
- issued/effective/expiry dates;
- secure object reference and integrity hash;
- review state, reviewer, decision time, rationale, and policy version;
- verification method (`manual`, `registry`, `issuer`, `automated_assist`);
- privacy classification and retention rule.

Automated extraction may assist a reviewer but MUST NOT issue passenger authority. Expiry, revocation, entity mismatch, vehicle mismatch, failed periodic re-verification, insurance lapse, or serious safety action suspends the affected capability immediately.

The Admin surface must support four-eyes review for high-risk overrides, expiry queues, regulator sampling, conflict-of-interest recording, and an immutable decision trail.

## 9. Ride lifecycle

Canonical ride state machine:

`draft → quoted → requested → matching → offered → accepted → driver_en_route → driver_arrived → passenger_on_board → in_trip → completed`

Terminal/exception states:

`cancelled_by_passenger | cancelled_by_driver | cancelled_by_system | no_show | expired | safety_stopped | disputed`

Rules:

- A request is not a transport commitment until validation and driver acceptance succeed.
- The quoted fare or permitted estimate, vehicle class, passenger count, pickup/drop-off, payment method, cancellation terms, and accessibility needs must be explicit before confirmation.
- Driver identity, vehicle identity/plate, legal passenger capacity, rating/status, ETA, and safety actions must be shown before pickup as allowed by local law.
- The passenger confirms the matched vehicle/driver before boarding.
- GPS and state changes create immutable ride events with appropriate privacy controls.
- A ride cannot start unless the same eligibility decision succeeds again at start time.
- Completion generates the jurisdiction-appropriate receipt/invoice and opens rating, support, lost-item, and safety flows.

## 10. Matching and availability

Partners explicitly choose `Deliveries`, `Rides`, or `Offline`; the app may recommend but cannot silently switch modes. Only partners with an active service/vehicle/zone capability receive ride offers.

Initial matching considers:

- service and vehicle eligibility;
- legal passenger capacity versus requested passenger count;
- current zone and permitted operating area/route;
- proximity and ETA;
- safety/incident state;
- driver hours or platform limits where applicable;
- rating, completion history, and fair rotation.

Passenger preference must not create unlawful discrimination. Accessibility requirements are matched only to declared, verified vehicle/support capabilities.

## 11. Safety and incident controls

The initial product requires:

- emergency/SOS entry point with local emergency-number guidance;
- share-trip and trusted-contact flow where legally supportable;
- masked communications where available;
- pre-boarding identity/plate check;
- route deviation and prolonged-stop signals with human escalation;
- incident reporting by passenger or driver, available during and after a ride;
- lost-item flow that does not expose personal telephone numbers;
- immediate capability suspension and preservation of evidence for severe events;
- trained support with a documented handoff to the Zone Operator, insurer, or authority;
- no claim that DROPi is an emergency-response service.

Safety automation may flag and recommend. It must not conceal uncertainty, fabricate a regulator decision, or delete evidence.

## 12. Audit, privacy, and retention

The system MUST record who decided what, under which policy and evidence, at which time. Auditable events include document submission/review, capability activation/suspension, agreement acceptance, quote calculation, offer/match/acceptance, trip states, location-access decisions, support access, incidents, refunds, exports, administrative overrides, and regulator disclosures.

Exact retention periods are jurisdiction-pack policy, not hardcoded application constants. Legal holds override normal deletion. Passenger location, identity documents, criminal-record evidence, and safety data require least-privilege access, purpose limitation, encryption, access logging, and documented deletion/anonymization. Privacy-rights handling must account for legal retention and active disputes.

## 13. Planned technical aggregates

Implementation should introduce dedicated, normalized aggregates rather than extending the present global verification flag:

- `jurisdictionPacks` and `capabilityRequirements`;
- `legalEntities` and `transportOperators`;
- `serviceCapabilities` and `partnerCapabilities`;
- `mobilityVehicles` and `vehicleCapabilities`;
- `complianceDocuments`, `documentReviews`, and `reverificationRuns`;
- `affiliationContracts` and `agreementAcceptances`;
- `rides`, `rideOffers`, and append-only `rideEvents`;
- `safetyIncidents` and restricted incident evidence;
- passenger-mobility pricing, receipt, refund, and payout records.

Existing identity, session, notification, payment-provider integration, secure storage, and `auditLogs` infrastructure may be adapted. Existing `verifications` records require an explicit migration/mapping; they do not become passenger permissions automatically.

## 14. Launch gates

Passenger Mobility remains hidden and cannot accept real rides until all applicable gates are approved:

1. exact legal entities and contracting model approved by local counsel;
2. exact launch geography selected, including the Zone 0 LGU;
3. platform approval/accreditation or technical endorsement obtained;
4. transport-operator, driver, vehicle, inspection, insurance, tax, and affiliation evidence validated;
5. jurisdiction pack regulator-confirmed and enabled;
6. privacy impact assessment, security review, retention schedule, and regulator-access procedure approved;
7. safety operations, 24/7 obligations where applicable, incident runbooks, and insurance claims process tested;
8. pricing, payment, receipt/invoice, cancellation, refund, and payout rules approved;
9. customer, driver, admin, and degraded-connectivity UX tested in the local languages;
10. controlled pilot authorization signed, with kill switch and rollback exercised.

No feature flag, admin override, pilot demand, or business deadline may bypass a missing legal or safety gate.

## 15. Scope exclusions for v1

- C2 passenger contracts and C3 emergency/patient transport;
- street hailing or taxi-meter operation;
- pooled/shared passenger rides;
- unaccompanied minors;
- school transport;
- medical transport or accessibility claims not backed by verified capability;
- motorcycles, bicycle taxis, vans/minibuses, and autonomous vehicles;
- cross-border passenger trips;
- simultaneous parcel mission and passenger ride;
- enabling Philippine tricycles before LGU confirmation.

## 16. Supporting specifications

- Legal baseline: `docs/research/PASSENGER_MOBILITY_LEGAL_BASELINE_RO_PH.md`
- UX specification: `docs/ux/PASSENGER_MOBILITY_UX_SPEC.md`
- Technical and delivery plan: `docs/planning/PASSENGER_MOBILITY_IMPLEMENTATION_PLAN.md`
- Cargo boundary: `canonical/DELIVERY_MULTIMODAL.md`
