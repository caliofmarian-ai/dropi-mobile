# DROPi — Authorized Design & Creative Tooling

> **STATUS: CANONIC**
> **Owner decision:** Marian / Project Owner
> **Scope:** `caliofmarian-ai/dropi-mobile` only
> **Version:** v1.1.0
> **Date:** 2026-09-12

## 1. Source-of-truth boundary

The GitHub repository `caliofmarian-ai/dropi-mobile` remains the source of truth for implementation, runtime behavior, API contracts, release state, security boundaries, operational evidence and product capability.

External creative/design tools are companion tools. Their output does **not** by itself prove that a feature is implemented, deployed, Android-verified, release-ready or commercially available.

The canonical product model is **multimodal delivery**, not drone-only and not a generic single-mode courier workflow. Design work must preserve `canonical/DELIVERY_MULTIMODAL.md` and the current implementation in `main`.

## 2. Figma — ACTIVE / OWNER AUTHORIZED

The Project Owner authorizes normal project use of the connected paid Figma workspace without requiring a new approval for each ordinary design task.

Authorized uses include:
- mobile UI/UX design and refinement;
- design-system foundations, tokens and reusable components;
- multimodal delivery flows and logistics-network visualization;
- screen and interaction specifications;
- responsive/light/dark design validation;
- visual QA and implementation guidance;
- prototypes and design-to-code handoff.

Active DROPi Mobile design companion:
- `DROPi Multimodal Delivery — UI/UX System`
- Figma file key: `lfrk6LCDrRNdQZhICIs3R0`
- URL: `https://www.figma.com/design/lfrk6LCDrRNdQZhICIs3R0`

Superseded design direction:
- `DROPi Mobile — UI/UX Design System` (`TsY2fhISpXHD1pMsJSVRMF`) is **SUPERSEDED as the active product companion** because its initial UI direction over-emphasized a generic Mission Radar / courier model and did not express the canonical multimodal product strongly enough.
- Content from that file may only be reused after checking it against the multimodal canon and the current repository source.

Figma must follow current repository truth. A Figma proposal becomes product/runtime truth only after it is accepted, implemented in this repository and validated through the relevant evidence gates.

### Multimodal design invariant

DROPi UI/UX must represent, when relevant:
- drone;
- auto;
- van;
- e-bike;
- multimodal/staged delivery;
- DronePort;
- vehicle depot;
- transfer hub / handoff;
- primary route plus fallback;
- zonal/operational eligibility;
- tracking, custody, audit and delivery evidence.

A design must **not** imply that:
- DROPi is drone-only;
- every product is drone eligible;
- a delivery-mode badge guarantees the final mode;
- a customer chooses a pilot;
- Marketplace itself validates or starts delivery;
- a single courier/mission-radar model represents the whole product.

## 3. Canva — ACTIVE / OWNER AUTHORIZED

The Project Owner authorizes normal project use of the connected paid Canva workspace without requiring a new approval for each ordinary design task.

Authorized uses include:
- internal review boards and presentations;
- Google Play / store presentation assets when release truth supports them;
- social/static marketing materials;
- pitch and partnership materials;
- visual documentation and communication assets.

Canva is a presentation/creative layer, not a product authority. It must not invent runtime capabilities, release claims, operational metrics, testimonials, awards, user counts or other unsupported statements.

Any Canva artifact that presents DROPi as drone-only or as a generic courier/mission-radar application is **INVALID for canonical product communication** unless explicitly framed as a narrow role-specific view.

## 4. Runway — AUTHORIZED BUT HOLD UNTIL FINAL PRODUCTION PHASE

Runway is an Owner-authorized project tool, but credit-consuming Runway operations are **HOLD** during current design/development phases.

Rule:
- **NO RUNWAY CREDIT CONSUMPTION BEFORE THE FINAL PRODUCTION PHASE.**
- Do not start video/image generation, editing, upscaling or other credit-consuming Runway operations before that phase.
- Any exception before the final production phase requires a new explicit Project Owner instruction.

When activated in the final phase, Runway may be used for final cinematic/video/motion production. Generated material that is not authentic runtime capture must be labelled truthfully and must not be represented as gameplay/runtime evidence.

## 5. Product isolation rule

This canonical tooling authorization applies to the real DROPi mobile application repository `caliofmarian-ai/dropi-mobile`.

Do not import source truth, PR state, issue state, design screens or product claims from sibling products such as `DROPi-Tycoon` unless the Project Owner explicitly requests a cross-product task.

## 6. Agent operating rule

Before using Figma or Canva for DROPi:
1. read the relevant current source from `main`;
2. read `canonical/DELIVERY_MULTIMODAL.md` for delivery/product-model work;
3. preserve multimodal, safety, privacy and operational semantics;
4. label exploratory/proposed design as such;
5. keep runtime/release evidence separate from design evidence;
6. document accepted implementation-impacting decisions back in GitHub.

Runway remains subject to the HOLD rule in section 4.
