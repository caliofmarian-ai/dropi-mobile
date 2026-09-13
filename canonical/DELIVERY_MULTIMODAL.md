# DROPi Canonical Reference: Multimodal Delivery & Badge System

**Version:** 1.2.0
**Status:** ACTIVE CANON
**Updated:** 2026-09-12

## Scope Boundary

This document governs **parcel/cargo delivery only**. It does not authorize transport of people, and a delivery badge, driving licence, vehicle record, pilot profile, or global verification state MUST NOT be interpreted as passenger-service eligibility.

Passenger transport uses the separate C1 Passenger Mobility domain and service-specific authorization defined in `canonical/PASSENGER_MOBILITY.md`. Delivery and Passenger Mobility may share an account and platform primitives, but they retain separate capabilities, lifecycle records, pricing, safety controls, and legal evidence.

## Delivery Modes (NOT drone-only)
- 🚁 Dronă (aerial)
- 🚗 Auto (car)
- 🚐 Van
- 🚲 Bicicletă electrică (e-bike)
- 🔄 Multimodal (ex: merchant → DronePort → client)

These are product modes, not universal legal vehicle classes. Each technical vehicle and use case must be classified under the applicable current law before regulated onboarding or operation is designed.

## Legal Source and Authorization Gates

All delivery modes follow `canonical/LEGAL_COMPLIANCE_SOURCE_OF_TRUTH.md`, the registered evidence in `docs/legal/legal-source-register.json`, and the requirements/blockers under `docs/legal/`.

Every operational action requires two independent approvals:

1. the responsible company/market/service is authorized for the actual postal/courier, road-transport, aviation, platform, tax, data, insurance, and local role; and
2. the particular partner/person/operator/vehicle/aircraft/zone is eligible for that mission.

Authorization may be obtained and activated in stages for pedal bicycle, compliant e-bike, scooter/motorcycle, parcel car, van, drone, and later modes. No global `authorizedForDelivery` or “authorized for everything” state exists. A mode may be represented in planning/catalog configuration while its law-dependent onboarding, dispatch, acceptance, or start actions remain blocked.

A missing, stale, conflicting, or unapproved primary source blocks the affected law-dependent design and operation. Product convention and competitor practice are not substitutes.

## Eligibility Criteria
System evaluates per product:
- Dimensions & weight
- Product category
- Delivery zone
- Available infrastructure
- Weather conditions
- Pilot availability

## Badge System (Informative, NOT guarantees)
Badges indicate:
- Possible delivery modes (drone / terrestrial / fallback)
- Operational availability
- Trust & reputation signals

Badge rules:
- Do NOT guarantee final delivery method
- Do NOT obligate pilots
- Do NOT modify legal responsibility
- ARE used internally for logistics selection
- ARE used for drone eligibility determination

A badge is not a government licence, company authorization, professional certificate, vehicle permission, insurance decision, or right to operate.

## Marketplace Structure
- CONTROLLED marketplace (not open like OLX/eBay)
- Zonal by design (products visible by zone)
- Categories with dedicated rules
- Eligibility is selective for drones
- Publishing a listing does NOT guarantee delivery
- Publishing does NOT guarantee drone delivery

## Participant Types
1. Authorized merchants (B2C) - continuous listings
2. Artisans & independent creators - limited listings
3. P2P users (non-commercial) - 1-3 active listings max
4. Community sellers (unauthorized, transitional)

## Flow: Marketplace → App
Client → Marketplace → Request → App → Decision → Delivery

Marketplace:
- Initiates the request
- Does NOT validate the order
- Does NOT select pilots
- Does NOT start delivery

App:
- Validates
- Orchestrates
- Audits

## Pilots
- Planned independent-partner model; a person may be treated as self-employed only where the country-specific legal, tax, contractual, and operational analysis supports that status
- Selected by system (NOT first-come-first-served)
- Based on: technical eligibility, positioning, rating, history, rotation
- Client CANNOT see or choose the pilot

No captured source currently establishes a universal state-issued attestation for an ordinary pedal-bicycle parcel courier in Romania or the Philippines. DROPi/insurer safety training, protective equipment, competency checks, medical or personal-accident cover may still be mandatory policy, but MUST NOT be labeled as government authorization without a traced, approved source.

## Drone Delivery Special Rules
- Client must choose "drone" preference
- Client must complete tutorial
- Client must accept conditions
- Reception point must be valid
- Drone does NOT wait for client
- Drone does NOT negotiate reception
- Drone does NOT repeat delivery
- Failed reception triggers fallback

Remote-pilot/controller competence is only one aviation gate. The responsible operator/company, aircraft, registration, operational category or certificate/authorization, airspace, route/zone, payload, insurance, and exact delivery CONOPS must also be approved and current.

## Terrestrial Delivery Options
- Personal handover
- Leave at door
- Leave at gate
- Leave in yard
- Passive options = risk accepted by client

## DronePort as Buffer
- Consolidation point
- Logistics buffer
- Transfer hub
- Enables: scheduled delivery, staged delivery, reduced client pressure
