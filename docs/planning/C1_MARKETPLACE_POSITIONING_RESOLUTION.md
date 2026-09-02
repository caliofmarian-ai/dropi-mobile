# DROPi C1 Marketplace Positioning Resolution

> **Status:** CANONICAL PLANNING RESOLUTION — 2026-09-02  
> **Scope:** Channel C1 Marketplace positioning, P2P participation, and Operational Core boundary  
> **Resolves:** CANON-RES-001 / #283 and P2P conflict / #294

## Authority basis

The planning authority order is:

`04-ZIP > HIST-EXTRACT > ACTIVE-CANON > BLUEPRINT > IMPLEMENTATION OBSERVATION`

The controlling source for this decision is the recovered 04-ZIP canonical/frozen document:

`DROPi_Canonical_Reference/05_Marketplace/Recovered_04_ZIP/Cap_06_Product_DROPi/Anexa 6B — Marketplace Controlat DROPi.md`

That source explicitly defines the Marketplace as the public controlled offer-and-delivery-initiation layer and states that it is strictly separated from the execution application, pilot selection, delivery infrastructure, and COS channels.

## Resolution 1 — Marketplace vs execution application

The DROPi Marketplace is a **public C1 product surface**, not the Operational Core execution application.

The two may share governed backend capabilities, identity, order contracts, audit infrastructure, and APIs, but their responsibilities remain distinct:

### Public C1 Marketplace surface

Owns:
- controlled product and community-offer discovery;
- category and zone visibility rules;
- seller/storefront presentation;
- controlled checkout / order initiation;
- verified post-delivery reputation surfaces;
- limited community/P2P offer publication where permitted.

Does not own:
- pilot selection or assignment logic;
- delivery execution controls;
- flight/fleet infrastructure;
- emergency execution;
- COS private/institutional operations.

### DROPi execution application / Operational Core

Owns:
- validated order intake from C1;
- merchant preparation lifecycle;
- READY gating;
- pilot voluntary acceptance;
- delivery execution and live tracking;
- fallback / STOP / operational safety;
- execution audit and notifications.

### Repository implication

Existing Marketplace UI inside `dropi-mobile` is treated as an implementation-stage surface, not architectural proof that Marketplace and Operational Core are one inseparable application. New code must preserve modular boundaries so public discovery can be hosted independently without rewriting canonical order, identity, audit, and execution contracts.

## Resolution 2 — P2P model

P2P is **non-commercial** and has two distinct C1 behaviors.

### A. Private P2P delivery

A private person may initiate a private P2P delivery without creating a public commercial Marketplace product.

Rules:
- non-commercial purpose;
- no public storefront requirement;
- no commercial recurrence model;
- execution still passes through normal DROPi validation and operational safety gates.

### B. Occasional community offer

A private person may publish a limited public community offer only under the 04-ZIP rules.

Allowed examples include:
- donations;
- free transfers;
- occasional fixed-price sales without repetitive commercial character.

Required controls:
- maximum small active set, canonically exemplified as 1–3 active simultaneously;
- time-limited publication;
- moderation before/while visible;
- automatic audit;
- no paid promotion or logistics priority;
- no auctions;
- no free-form price negotiation;
- no speculative sales;
- no unlimited/recurrent listings;
- no disguised commercial activity.

A P2P participant is therefore **not equivalent to a normal merchant store**. P2P capability must be modeled separately from recurring merchant catalog activity even if shared Marketplace listing primitives are reused internally.

## Resolution 3 — Consequences for IMPL-020 / #177

IMPL-020 can proceed on the following contract:

1. Controlled commercial checkout uses the existing governed Marketplace order creation contract.
2. Public Marketplace UI must remain a separable C1 surface from Operational Core execution UI.
3. Private P2P delivery is a parcel/delivery-initiation flow, not a merchant product checkout.
4. Public P2P/community offers are limited, moderated, time-bounded, non-commercial listings with a hard active-count gate.
5. Verified reputation remains tied to completed, authenticated purchase evidence; P2P private delivery must not fabricate merchant/product reputation.
6. Any public P2P reputation signal must be explicitly separated from merchant commercial trust unless a later canonical source defines aggregation.

## Superseded interpretation

The derived Blueprint statement that P2P is categorically “NU în marketplace” is too restrictive when read against the higher-authority 04-ZIP source. The correct interpretation is:

- private P2P delivery is not a public Marketplace product listing;
- **limited occasional community offers may appear in the public Marketplace** under strict non-commercial controls.

Likewise, current integrated mobile Marketplace screens do not supersede the higher-authority requirement that Marketplace remain strictly separated from execution responsibilities.

## Implementation guardrails

- No C2/COS work is required to complete this C1 resolution.
- No public Marketplace component may directly control pilot assignment or delivery execution.
- No P2P user may obtain unlimited merchant-style catalog behavior.
- No P2P flow may silently become recurring commercial trade.
- Shared services must remain reusable by an independently hosted public Marketplace surface.

## Closure criteria

This resolution is complete when:
- #283 records Marketplace/Operational Core separation as resolved;
- #294 records the dual private-P2P / limited-community-offer model as resolved;
- #177 is returned to executable status and implemented against this document;
- planning conflict records no longer describe these two points as unresolved.
