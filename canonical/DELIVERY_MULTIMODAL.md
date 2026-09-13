# DROPi Canonical Reference: Multimodal Delivery & Badge System

**Version:** 1.1.0
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
- Self-employed (NOT DROPi employees)
- Selected by system (NOT first-come-first-served)
- Based on: technical eligibility, positioning, rating, history, rotation
- Client CANNOT see or choose the pilot

## Drone Delivery Special Rules
- Client must choose "drone" preference
- Client must complete tutorial
- Client must accept conditions
- Reception point must be valid
- Drone does NOT wait for client
- Drone does NOT negotiate reception
- Drone does NOT repeat delivery
- Failed reception triggers fallback

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
