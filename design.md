# DROPi Mobile App — Interface Design

> **STATUS: ACTIVE DESIGN REFERENCE**
> **Product model:** Multimodal delivery
> **Canonical authority:** `canonical/DELIVERY_MULTIMODAL.md`
> **Design companion:** Figma `DROPi Multimodal Delivery — UI/UX System` (`lfrk6LCDrRNdQZhICIs3R0`)
>
> This document describes product-level mobile UI/UX. Drone-specific mission flows remain valid where the assigned transport leg is actually a drone leg, but they do not define the whole DROPi product.

## Product UI Invariant

DROPi is not drone-only and not a generic single-mode courier application. User-facing design must preserve the platform model across:

- drone;
- auto/car;
- van;
- e-bike;
- staged / multimodal delivery;
- DronePort;
- vehicle depot;
- transfer hub / handoff;
- primary route plus fallback;
- zonal and operational eligibility;
- persisted tracking, custody, audit and delivery evidence.

Delivery-mode badges describe possible/eligible modes until the platform confirms the operational route. The client does not choose a pilot and Marketplace does not become the final delivery-method authority.

## Brand Colors

- **Primary (DROPi Blue):** #0066FF — primary actions, active states, headers
- **Background:** Light #FFFFFF / Dark #0F1419
- **Surface:** Light #F7F9FC / Dark #1A1F25
- **Foreground:** Light #0F1419 / Dark #F0F4F8
- **Muted:** Light #6B7280 / Dark #9CA3AF
- **Success (Green):** #10B981 — completed, confirmed states
- **Warning (Amber):** #F59E0B — fallback, preparing, attention needed
- **Error (Red):** #EF4444 — STOP, cancelled, critical alerts
- **Border:** Light #E5E7EB / Dark #2D3748

## Screen List

### Authentication

1. **Login Screen** — Email + password, role-aware entry.
2. **Role / Account Context** — Governed role context where the account contract supports it.

### Customer / Marketplace

3. **Customer Dashboard** — Active orders and governed C1 transactional state.
4. **Marketplace** — Zonal product availability with **possible delivery modes**, never a guaranteed final method.
5. **Cart / Checkout / P2P** — Existing governed C1 commercial flows.
6. **Order Detail / Delivery Route** — Order lifecycle, PRIMARY mode, FALLBACK, multimodal/staged explanation, reception and operational evidence.
7. **Live Tracking** — Persisted/live server-backed position for the current delivery execution; never a simulated route presented as evidence.
8. **Order History** — Past orders and final states.

### Merchant

9. **Merchant Dashboard / Queue** — Orders grouped by governed preparation states.
10. **Order Processing** — Order details and allowed preparation-state actions.
11. **Report Issue** — Stock/preparation issue reporting.

### Delivery Partner

12. **Mission Radar** — Role-specific available missions in the delivery partner's governed zone. Mission Radar is not the representation of the entire DROPi product.
13. **Mission Detail** — Pickup/delivery information, package data, assigned delivery mode and server-provided vehicle type.
14. **Vehicle-Specific Pre-Departure Checks** — Drone uses pre-flight checks; terrestrial modes use terrestrial pre-departure checks.
15. **Active Mission Supervision** — Current-leg telemetry/evidence plus STOP/FALLBACK controls appropriate to the assigned vehicle type and server authority.
16. **Delivery Completion / Post-Mission Evidence** — Completion, proof and incident/audit records.

### Logistics / Operations

17. **Logistics Network** — DronePort, Vehicle Depot and Transfer Hub as peer infrastructure surfaces.
18. **Fleet Status** — Multimodal asset view only after the authoritative fleet registry from #258/#259 exists. Do not fabricate terrestrial assets in runtime UI.
19. **Alert Feed** — Governed operational incident and safety alerts.
20. **Zone / Operations Control** — Role-authorized operational controls; no universal drone-only framing.

### Shared

21. **Profile** — User/account/role state within current authority boundaries.
22. **Support** — Create and view support tickets.

## Primary Content and Functionality

### Customer Dashboard

- Active orders with order ID, merchant, status and evidence-backed ETA when available.
- Tap an active order → Order Detail.
- Delivery presentation remains transport-neutral until a confirmed operational mode/leg exists.

### Marketplace

- Show products eligible for the current operating zone.
- Delivery-mode chips are labeled as **Possible delivery modes**.
- The UI must explain that DROPi confirms the final method after operational eligibility/orchestration checks.
- Marketplace must not imply that every product is drone eligible.

### Order Detail

- Present the platform-selected delivery route as **PRIMARY**.
- Present **FALLBACK** separately when the order contract exposes one.
- For `multimodal`, explain that DronePort / depot / transfer-hub handoff may occur between legs.
- Actual route legs, telemetry, position, custody and proof appear only from persisted/server-backed evidence.
- Missing vehicle type must remain unavailable/unknown rather than defaulting visually to drone, e-bike or another mode.

### Merchant Dashboard

- Orders grouped by governed lifecycle state.
- Each item shows only state/actions that the current merchant contract permits.
- Merchant preparation does not select the final pilot or transport authority unless an explicit canonical contract says otherwise.

### Delivery Partner / Mission Radar

- Mission cards expose pickup zone, delivery zone, package weight, distance and server-provided mission/vehicle data.
- Mission acceptance remains verification- and server-authority-gated.
- Drone missions use drone-specific pre-flight language and controls.
- Auto/van/e-bike missions use terrestrial pre-departure / in-transit language.
- A missing or unsupported vehicle assignment fails closed; UI must not substitute `drone`.

### Active Mission Supervision

- Display live/persisted telemetry only when received from the server/tracking channel.
- Never replace missing telemetry with demo position, speed, altitude, battery, ETA or route evidence.
- STOP and FALLBACK remain current-leg, server-persisted safety actions.
- Drone-specific STOP/FALLBACK copy remains valid for a drone leg; terrestrial controls remain transport-specific.

### Logistics Network

- DronePort, Vehicle Depot and Transfer Hub appear as parts of one logistics network.
- Station/capacity UI is presentation only unless backed by an authoritative registry.
- Transfers/handoffs must be represented only when supported by order/runtime contracts.

### Fleet

- The target UI is multimodal, but production runtime must consume the canonical fleet registry planned by #258 and availability/location authority in #259.
- Until those authorities exist, local mock drone arrays must not be expanded into fictional auto/van/e-bike fleets.

## Key User Flows

### Flow 1: Customer buys and tracks a multimodal-capable delivery

Login → Marketplace → Browse zonal products → See possible delivery modes → Cart / Checkout → Platform validates operational eligibility → Order Detail shows PRIMARY + optional FALLBACK → If staged/multimodal, handoff/transfer appears only from real contract/evidence → Active tracking/evidence → Delivery reception/proof → Completed order.

### Flow 2: Merchant prepares an order

Login → Merchant Dashboard → Open new order → Start Preparing → Complete preparation → Mark Ready → Platform/orchestration proceeds according to the authoritative delivery contract.

### Flow 3: Delivery partner executes an assigned transport leg

Login → Mission Radar → Open mission → Confirm server-provided vehicle assignment → Accept mission → Vehicle-specific checks → Start assigned leg → Supervise real telemetry/evidence → [If required: STOP or FALLBACK] → Delivery/leg completion → Persist proof / post-mission evidence.

**Drone leg variant:** pre-flight checks → launch → flight supervision → drone-specific fallback/DronePort behavior.

**Terrestrial leg variant:** pre-departure checks → start delivery → in-transit supervision → vehicle/depot/origin fallback behavior.

### Flow 4: Multimodal staged delivery

Order validated → PRIMARY route may contain multiple transport legs → pickup/custody → DronePort / depot / transfer hub when the real route requires it → handoff between authorized legs → final-mile execution → reception/proof. UI never invents intermediate legs that are not present in persisted state/evidence.

### Flow 5: Operator monitors logistics network

Login → Logistics Network / governed dashboard → View authorized stations, active delivery legs and evidence-backed alerts → Open incident/asset/order context → Perform only role-authorized controls → Audit record.

## Navigation Structure

```text
Tab Bar (role-dependent; exact tabs follow current runtime contracts):
├── Customer: Marketplace / Home / Orders / History / Profile as enabled
├── Merchant: Queue / Orders / History / Profile as enabled
├── Delivery Partner: Missions / Active / Profile
└── Operations roles: governed dashboards / network / alerts / fleet surfaces as enabled
```

## Layout Principles (Mobile Portrait 9:16)

- All screens use `ScreenContainer` with safe-area handling.
- Primary actions stay within comfortable thumb reach where operational safety permits.
- Critical STOP/FALLBACK controls are prominent and never hidden behind decorative UI.
- Status and delivery-mode labels use consistent semantic color treatment.
- Missing authority/data renders `UNAVAILABLE`, waiting, offline or equivalent fail-closed state rather than a fabricated default.
- UI proposals in Figma are design evidence only until implemented and validated in this repository.
- Operational evidence, live route/position and release truth always come from runtime/server verification, not design mockups.
