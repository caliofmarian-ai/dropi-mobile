# C1 Passenger Mobility — UX Specification

**Version:** 1.0.0
**Status:** PLANNING — NO LIVE RIDES
**Date:** 2026-09-12
**Markets considered:** Romania and Philippines Zone 0
**Canonical source:** `canonical/PASSENGER_MOBILITY.md`

## 1. Product intent

Passenger Mobility lets any eligible human C1 participant request point-to-point transport for people and lets an eligible Delivery Partner offer both parcel delivery and passenger rides from the same DROPi account.

The experience must make the service boundary unmistakable:

- a ride transports people and uses a dedicated ride lifecycle;
- a delivery transports a parcel and retains the current delivery lifecycle;
- delivery verification never implies passenger authority;
- a partner chooses an explicit work mode and never receives work for an inactive or unauthorized capability;
- availability is controlled by jurisdiction, zone, vehicle class, time, evidence, contracts, and safety state.

This specification describes the intended UX and handoff. It does not authorize implementation or production launch.

## 2. Information architecture

Passenger Mobility is a service inside **C1 Marketplace**. It is not a fourth channel.

### 2.1 Personal passenger navigation

When Passenger Mobility is enabled for the current zone, the C1 home surface shows two equal, explicit service cards:

| Entry point | Primary action | Domain |
|---|---|---|
| Send a package | Create a parcel request | Existing delivery |
| Request a ride | Create a passenger ride | Passenger Mobility |

If the service is not enabled, the app must not imply that a ride can be ordered. A market-approved informational card may say “Rides are not available in this area” without collecting a destination or payment.

Customer, Merchant, and Delivery Partner accounts can enter this personal passenger view without changing their canonical role or creating a second account. Merchant or partner status must not change passenger terms, safety controls, pricing disclosure, or service priority. AI mirror accounts, phantom-mode sessions, and unattended agents cannot request a real ride.

### 2.2 Partner navigation

The partner home surface adds:

- **Capability Center** — status and onboarding for Deliveries and Rides;
- **Work mode** — `Deliveries`, `Rides`, or `Offline`;
- **Vehicle selector** — only vehicles valid for the chosen mode and current zone;
- **Compliance inbox** — expiring, rejected, superseded, or newly required evidence;
- **Safety and support** — always reachable, including when the partner is suspended.

The app must never silently change work mode. A partner with an active mission cannot change mode or vehicle until the mission reaches a permitted terminal state.

### 2.3 Admin navigation

Passenger Mobility adds restricted Admin areas for:

- jurisdiction packs and zone enablement;
- legal entities, platform operators, Zone Operators, and transport operators;
- person, vehicle, contract, and document review;
- capability decisions and expiry queues;
- active rides and operational intervention;
- safety incidents and restricted evidence;
- pricing, payments, receipts, refunds, and payouts;
- regulator/auditor exports and access logs;
- service, zone, vehicle-class, and operator kill switches.

## 3. Customer ride flow

### 3.1 Entry and availability

1. User selects **Request a ride**.
2. The app checks country, jurisdiction pack, operating zone, service hours, platform status, and rough supply availability.
3. Location permission is requested only with a clear purpose. Manual pickup entry remains available unless a local safety rule requires otherwise.
4. If unavailable, the screen gives the specific safe reason category—outside area, service closed, no eligible class, or temporary suspension—without exposing internal compliance details.

Required copy principle: never promise “taxi anywhere”. Prefer “Rides in approved areas”.

### 3.2 Trip setup

The setup screen captures:

- pickup pin and text address;
- destination pin and text address;
- pickup notes that do not contain prohibited sensitive data;
- passenger count;
- eligible vehicle class;
- accessibility or assistance needs as declared needs, not medical diagnoses;
- normal passenger baggage note;
- payment method;
- optional scheduled time only after a jurisdiction pack permits scheduling.

Passenger count starts at one and may not exceed the capacity returned for the offered vehicle class. The final match must be rechecked against the selected vehicle’s evidence-backed capacity.

### 3.3 Quote and confirmation

Before the user confirms, show:

- pickup and destination;
- selected class and passenger count;
- fare or legally permitted estimate, currency, taxes/fees, and material surge or toll treatment;
- payment method and receipt/invoice treatment;
- cancellation/no-show terms;
- material baggage/accessibility limits;
- the legal contracting/platform role copy required by the jurisdiction pack;
- links to passenger terms and privacy notice, with the accepted versions recorded.

The primary action is **Request ride**, not “Order delivery”. A quote expiry must be visible and a changed quote must be accepted again.

### 3.4 Matching

The matching surface shows:

- request status and cancel action;
- approximate search progress, without fake driver dots;
- selected class, pickup, destination, passenger count, and current quote;
- support entry point;
- what happens if no eligible driver accepts.

An offer expiration or rejected match returns to matching only while the request remains valid. A price or terms change requires explicit reconfirmation.

### 3.5 Driver matched

Before boarding, show the locally permitted identity and safety set:

- driver name and approved photo;
- vehicle make/model/color and plate or official identifier;
- passenger capacity;
- ETA and verified pickup point;
- rating/service status where legally and statistically appropriate;
- contact through masked or in-app communications;
- **Share trip**, **Safety**, and **Cancel** actions;
- a reminder to verify driver, plate, and vehicle before entering.

The passenger should have a short challenge/confirmation mechanism where approved—for example, a rotating pickup code—without exposing it before the driver arrives.

### 3.6 Pickup and trip

The passenger sees distinct states: driver en route, arrived, boarding confirmation, in trip, and completed. The application must not start a trip merely because the driver arrived.

During the trip, show:

- live route/progress with a degraded-connectivity state;
- driver/vehicle identity summary;
- destination;
- share-trip and safety actions;
- contact/support;
- a clear correction path if the user boarded the wrong vehicle or the trip started incorrectly.

Safety prompts must not suggest that DROPi replaces emergency services. Local emergency-number guidance is selected from the active jurisdiction pack.

### 3.7 Completion and aftercare

On completion, show:

- final fare with line items and payment status;
- downloadable or emailable jurisdiction-appropriate receipt/invoice;
- route and trip reference at a privacy-appropriate level;
- rating and structured feedback;
- report safety issue;
- report lost item without disclosing personal phone numbers;
- fare dispute/refund entry point;
- support case status.

Ratings must not substitute for incident reporting. A low rating may suggest a support path, but a safety report uses a separate, restricted workflow.

## 4. Partner onboarding and authorization

### 4.1 Capability Center

The center shows each service separately:

| Service card | Example state | Meaning |
|---|---|---|
| Deliveries | Active | Partner may perform eligible parcel missions |
| Rides — car | Documents required | Passenger capability is not active |
| Rides — tricycle | Not available in this zone | Legal/zone gate blocks application |

An active delivery status must never produce “You are approved for rides.”

### 4.2 Application structure

The ride application is resumable and organized around legal subjects rather than a single document list:

1. **You** — identity, licence, professional qualification, fitness, background/clearance evidence, declarations.
2. **Business/operator** — PFA/II/IF/company or Philippine operator details, registrations, tax/local permits, authority.
3. **Your relationship** — driver–operator relationship and platform affiliation.
4. **Vehicle** — ownership/use, registration, legal passenger capacity, inspection, service authority/badge/franchise, insurance.
5. **Operating area** — country, locality/LGU, approved zone/route, vehicle class.
6. **Agreements** — current operator, driver, data, safety, payment, and platform terms.
7. **Review** — completeness, declarations, submission, expected review path.

Requirements come only from the selected jurisdiction-pack version. Optional and not-applicable items must be distinguishable from missing mandatory evidence.

### 4.3 Document interaction

For each evidence item, show:

- official document name and issuing authority;
- whose document it is—person, operator, vehicle, platform, or zone;
- why it is required;
- accepted pages/sides and image-quality guidance;
- document number, issue/effective/expiry date fields;
- upload status and secure-preview controls;
- review result, human-readable reason, and resubmission action;
- next expiry/reverification date.

Automated extraction may prefill fields, but the user must review them. Do not claim “verified” until the designated decision process completes.

### 4.4 Review states and copy

| Internal state | Partner label | Allowed action |
|---|---|---|
| `requested` | Application started | Continue |
| `evidence_pending` | Documents required | Upload/correct |
| `under_review` | Under review | View; add requested evidence |
| `active` | Approved for rides | Go online with an eligible vehicle |
| `expired` | Approval expired | Renew; no new rides |
| `suspended` | Temporarily unavailable | View reason/support/appeal where allowed |
| `revoked` | Ride access removed | View decision/support/appeal where allowed |
| `rejected` | Application not approved | View reason/reapply where allowed |

Copy must distinguish the affected scope: one document, one vehicle, one zone, one service, or the entire account. Avoid “Account blocked” when only a car’s ride capability expired.

## 5. Partner online and ride flow

### 5.1 Going online

To choose **Rides**, the partner must select an approved passenger vehicle. Before the online state is granted, the backend re-evaluates person, operator, vehicle, jurisdiction, zone, document, contract, and safety gates.

If blocked, the app shows a stable reason category and the next actionable step. It must not expose another entity’s restricted evidence.

### 5.2 Ride offer

Subject to local disclosure rules, the offer includes:

- pickup area and estimated pickup distance/time;
- destination or permitted destination/route information;
- passenger count and required verified capability;
- offered vehicle/class;
- expected duration/distance;
- fare/driver earnings and material adjustments;
- payment method;
- accessibility or baggage needs relevant to safe acceptance;
- countdown and decline action.

Accepting is an atomic action. The server rechecks eligibility and mission concurrency; two drivers cannot win the same offer and one driver cannot accept a ride while holding another capacity-consuming mission.

### 5.3 Fulfilment states

Partner actions are explicit and server-validated:

1. Accept ride.
2. Navigate to pickup.
3. Mark arrived only inside the permitted geofence or approved exception path.
4. Confirm passenger/pickup code where enabled.
5. Mark passenger on board.
6. Start trip after a final eligibility and identity check.
7. Navigate to destination.
8. Complete at the permitted destination/geofence or use an audited exception.

Every state action must support retry/idempotency and show whether it is confirmed by the server. Offline actions remain pending; they must not be presented as final until synchronized.

### 5.4 Incidents and degraded operation

The partner can report wrong passenger, unsafe pickup, extra passengers, vehicle problem, collision, harassment, route closure, medical concern, lost item, payment issue, or other incident. A severe category opens safety guidance and human escalation, preserves relevant evidence, and may immediately stop new offers.

If data connectivity is lost:

- the app retains last confirmed state and clearly labels stale information;
- safety/emergency guidance remains locally available;
- no new offer is accepted offline;
- state transitions queue only where the policy permits and reconcile with an audit timestamp;
- the app does not fabricate live tracking or completion.

## 6. Admin and compliance UX

### 6.1 Jurisdiction Pack Studio

Only authorized compliance/configuration roles may create or change a pack. The UI must display:

- country, regulator, locality/LGU, operating polygon/route, service and vehicle class;
- source link, instrument identifier, effective date, counsel/regulator decision reference;
- required document/contract matrix and expiry rules;
- capacity, pricing, payment, receipt, retention, safety, and support rules;
- pack state and approval history;
- affected capabilities and rides before an update is enabled.

Publication requires four-eyes approval. `draft`, `counsel_review`, or expired packs cannot enable production.

### 6.2 Entity and evidence review

Reviewers need a subject tree:

`platform → Zone Operator → transport operator → driver → vehicle → service/zone capability`

The workbench shows document provenance, extracted fields versus source image, expiry, mismatches, duplicate numbers, prior decisions, relationship validity, applicable pack requirement, and conflict-of-interest declaration. Sensitive documents use watermarked, time-limited previews and access logging.

A reviewer decides evidence; the policy engine computes capability eligibility. The UI must not encourage a reviewer to mark an entire person “verified” after approving one licence.

### 6.3 Audit, incidents, and exports

Admin views include:

- append-only capability timeline;
- ride event timeline with source and server/client timestamps;
- document access and decision logs;
- override request and second approver;
- expiry/reverification queues;
- severe incident queue separated from ordinary support;
- evidence-preservation/legal-hold controls;
- scoped regulator/auditor export with reason, authority, fields, date range, and export log;
- global, market, zone, operator, vehicle-class, and capability kill switches.

A kill switch must show estimated impact, require a reason, record the actor, and never delete history.

## 7. Content, localization, and accessibility

- Romanian UI uses the counsel-approved distinction among “platformă digitală”, “operator de transport alternativ”, “conducător auto”, and “pasager”. Avoid calling every actor “taximetrist”.
- Philippine English/local-language copy uses current LTFRB/LGU terms. `TNVS`, `TNC`, `CPC`, `PA`, `ATOC`, `MTOP`, and franchise labels are pack content, not hardcoded universal labels.
- Dates, time zones, currencies, names, addresses, plates, document numbers, and emergency numbers are localized.
- Critical actions have text labels and do not rely on color alone.
- Touch targets, contrast, screen-reader names/order, dynamic text, reduced motion, and map alternatives meet the project accessibility baseline.
- Route color and map pins are reinforced with text/state labels.
- Safety, cancellation, and payment terms use plain language with expandable legal detail.
- Accessibility needs are framed as service capabilities; no unsupported promise is made.

## 8. Privacy-by-design UX

- Ask for precise location when needed for pickup/trip/safety; explain background access separately.
- Do not display driver criminal-record, medical, or psychological documents to passengers.
- Do not display passenger phone number or exact historical addresses to drivers after the operational need ends.
- Do not place document images, full routes, safety narratives, or identity numbers in push notifications.
- Mask contact details where possible and log privileged evidence access.
- Give passengers and partners privacy-request entry points while explaining legal-retention exceptions.
- Keep safety reports out of public rating/reputation screens.

## 9. Key empty, error, and boundary states

The design set must include:

- rides not launched in this market;
- outside approved service area;
- service temporarily suspended;
- no eligible vehicles for passenger count;
- no driver available;
- quote expired or changed;
- payment authorization failed;
- driver/vehicle changed before pickup;
- driver eligibility expired after match;
- passenger count exceeds matched capacity;
- partner ride application incomplete/under review/rejected/expired/suspended;
- vehicle valid for delivery but not rides;
- tricycle rides blocked pending LGU approval;
- weak/no connectivity;
- safety stop and post-incident restricted state;
- regulator-required service shutdown.

## 10. Analytics and experiment guardrails

Allowed product funnel events include service card viewed, quote requested, request confirmed, matching result, cancellation reason, completion, onboarding section progress, evidence resubmission, and eligibility reason category.

Never put document numbers, exact addresses/routes, free-text incident reports, criminal information, or health information in general analytics. Safety and compliance metrics use restricted stores and purpose-bound access.

Experiments may optimize comprehension, funnel layout, or matching presentation. They may not weaken legal disclosures, capacity checks, consent, evidence requirements, safety access, incident handling, or eligibility decisions.

## 11. Figma handoff

Create a distinct planning page in the active companion file:

`C1 Passenger Mobility — Planning`

Recommended sections:

1. foundations and service/domain boundary;
2. customer happy path;
3. customer safety and exception states;
4. partner Capability Center and onboarding;
5. partner ride execution;
6. Admin compliance and incident views;
7. responsive/localized variants;
8. prototype and annotated handoff.

Component inventory:

- service entry card;
- location input and map pin;
- vehicle-class/capacity card;
- fare breakdown;
- driver/vehicle identity card;
- ride status stepper;
- safety action tray;
- work-mode switch;
- capability status card;
- evidence requirement row/uploader;
- jurisdiction badge and legal-gate banner;
- review decision panel;
- capability/audit timeline;
- kill-switch confirmation;
- restricted-data marker.

All Passenger Mobility frames remain labeled **PLANNING — NOT LIVE** until the product owner authorizes design implementation and the relevant legal pack is approved.

## 12. UX acceptance criteria

The design is ready for implementation planning only when:

1. ride and delivery entry points cannot be confused;
2. unavailable jurisdictions fail closed without a bookable flow;
3. passenger count is validated at setup, match, and trip start;
4. driver and vehicle identity are visible before boarding;
5. safety actions are reachable from matching through aftercare;
6. partner mode changes are explicit and blocked during an active mission;
7. delivery approval is visibly distinct from ride approval;
8. every failed capability gate identifies affected scope and a safe next step;
9. tricycle UI cannot be enabled without an approved LGU pack;
10. Admin review separates evidence decisions from computed capability state;
11. expiry, suspension, override, legal hold, and regulator export are designed;
12. offline/stale states never masquerade as confirmed live state;
13. legal copy, currencies, terms, and emergency guidance are pack-driven;
14. restricted data never appears in general analytics or notifications;
15. Romanian, Philippine English, long-text, screen-reader, and reduced-motion variants pass review;
16. a full prototype covers quote-to-receipt and application-to-first-ride journeys;
17. design review includes Product, Engineering, Compliance, Safety, Privacy, Support, Payments, and local operations.

## 13. Out of scope

- C2 contracted passenger transport;
- C3 emergency, ambulance, or patient transport;
- street hailing, taxi meter, taxi rank, or cash unless a pack explicitly enables it;
- pooled rides, minors traveling alone, school transport, medical transport;
- motorcycles, bicycle taxis, vans/minibuses, autonomous vehicles;
- simultaneous DROPi parcel and passenger jobs;
- Figma production changes in this documentation task.
