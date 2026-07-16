# README_FOR_DROPi_TYCOON

## Package Metadata

| Field | Value |
|-------|-------|
| **Purpose** | Official canonical reference export for DROPi Tycoon alignment |
| **Source Repository** | `caliofmarian-ai/dropi-mobile` |
| **Source Branch** | `copilot/create-dropi-canonical-reference` |
| **Source Commit** | `9bb32560781d30e32b2a6c9b457b9e23287fe92a` |
| **Package Version** | `v2.0.0` |
| **Generation Date** | `2026-07-16` |
| **Intended Use** | Read-only reference for DROPi Tycoon game design alignment |
| **Read-Only Policy** | This package must never be modified; import updates only from DROPi repository |
| **Canonical Authority** | DROPi remains the sole canonical authority for the real platform |

## Purpose

This package is the **read-only canonical reference package** for the DROPi ecosystem.

DROPi remains the canonical source for the **real ecosystem**.
DROPi Tycoon is a **simulation** of that ecosystem.

## Mandatory Usage Rules

1. This package is **READ ONLY**.
2. This package must **never overwrite** DROPi Tycoon documentation automatically.
3. This package must be used **only as architectural and conceptual reference**.
4. Terminology between DROPi and DROPi Tycoon must remain aligned.
5. Architectural philosophy between DROPi and DROPi Tycoon must remain aligned.
6. Business concepts between DROPi and DROPi Tycoon must remain aligned.
7. If gameplay requires deviations, those deviations must be **explicitly documented** inside DROPi Tycoon.

## What This Package Contains

- Active canonical repository documents
- Recovered historical canonical documents from `04.zip`
- Recovered extracted masterplan documents in `01_Vision/`, `02_Architecture/`, `03_Logistics/`, `04_DronePorts/`, `05_Marketplace/`, `07_Economy/`, `08_AI/`, and `09_Reference/`
- Supporting blueprint/reference documents that explain how canonical concepts were interpreted in the repository
- A manifest, knowledge index, and audit report for provenance and navigation

## What This Package Does Not Do

- It does not replace the DROPi repository as the source of truth
- It does not authorize automatic gameplay reinterpretation
- It does not import runtime code, APIs, schemas, or build artifacts into DROPi Tycoon
- It does not declare every derived blueprint equal in authority to the primary canonical sources; the manifest marks primary vs derived vs historical status explicitly

## Recommended Reading Order for Tycoon Alignment

1. `CANONICAL_KNOWLEDGE_INDEX.md`
2. `CANONICAL_MANIFEST.md`
3. `00_Project/Indexes/canonical_README.md`
4. `08_AI/Governance/AI_DEVELOPMENT_HANDOVER_CANON.md`
5. `02_Architecture/Core/canonical-structure.md`
6. `03_Logistics/Delivery/DELIVERY_MULTIMODAL.md`
7. `01_Vision/` and `05_Marketplace/` source folders
8. `AI_CANONICAL_REFERENCE_AUDIT_REPORT.md`

## Alignment Rule

If two documents appear to conflict:

1. Prefer the **primary canonical source** identified in the manifest.
2. Use derived blueprints only as interpretation layers.
3. Use historical package documents for provenance, historical continuity, and concept recovery.
4. Document any Tycoon-specific deviations explicitly instead of silently changing meaning.
