# CANONICAL_KNOWLEDGE_INDEX

## 1. Package Scope

This index is the master inventory and navigation guide for the first official portable DROPi Canonical Reference Package.

It consolidates canonical knowledge recovered from three source classes:

- **Active repository documents**
- **Recovered historical ZIP materials from `04.zip`**
- **Recovered extracted masterplan files redistributed across the thematic package folders**

## 2. Canonical Ownership Model

| Ownership label | Meaning | Typical source |
|---|---|---|
| Founder + canonical governance | Primary canonical authority | `canonical/*`, extracted masterplan corpus |
| Founder + Manus AI | Repository-level canonical/derived reference stabilized inside the repo | `02_Architecture/Core/ARCHITECTURE.md`, `02_Architecture/Core/canonical-structure.md`, governance docs |
| Manus AI derived reference | Secondary interpretation layer based on canonical sources | `09_Reference/Blueprint/*`, selected `05_Marketplace/*`, selected `06_Roles/*` |
| Historical canonical package | Archived canonical bundle provenance | Recovered ZIP-only markdown in `00_Project/Recovered_04_ZIP/` and thematic recovered folders |

## 3. Quick-Read Path for Future AI Agents

1. `00_Project/Indexes/canonical_README.md`
2. `08_AI/Governance/AI_DEVELOPMENT_HANDOVER_CANON.md`
3. `02_Architecture/Core/canonical-structure.md`
4. `02_Architecture/Core/ARCHITECTURE.md`
5. `03_Logistics/Delivery/DELIVERY_MULTIMODAL.md`
6. `06_Roles/AI_Agent_System/AI_AGENT_SYSTEM.md`
7. `01_Vision/` primary strategy sources
8. `05_Marketplace/` and `04_DronePorts/` topic folders

## 4. Concept Origin Map

| Concept | Primary origin documents | Supporting / derived documents |
|---|---|---|
| Ecosystem vision and launch logic | `01_Vision/MasterPlan_Volume_I/`, `01_Vision/Recovered_04_ZIP/02_VOLUME_I_STRATEGY/` | `08_AI/Governance/AI_DEVELOPMENT_HANDOVER_CANON.md` |
| Four operational channels | `02_Architecture/Core/canonical-structure.md`, `02_Architecture/Historical_Archive/SYSTEM_ARCHITECTURE.md` | `02_Architecture/Blueprint/DROPi_6_LAYERS_EXPLAINED.md` |
| Six-layer architecture | `02_Architecture/Historical_Archive/SYSTEM_ARCHITECTURE.md` | `02_Architecture/Core/ARCHITECTURE.md`, `02_Architecture/Blueprint/DROPi_6_LAYERS_EXPLAINED.md` |
| Marketplace separation from app core | `05_Marketplace/MasterPlan_Product/`, `05_Marketplace/Recovered_04_ZIP/Cap_06_Product_DROPi/` | `05_Marketplace/Derived_Blueprints/BLUEPRINT_MARKETPLACE_DROPI.md`, `05_Marketplace/Derived_Analyses/marketplace-canonical-analysis.md` |
| Multimodal delivery and badges | `03_Logistics/Delivery/DELIVERY_MULTIMODAL.md`, `05_Marketplace/Recovered_04_ZIP/Cap_06_Product_DROPi/Delivery_Multimodal.md` | `06_Roles/Pilot_Selection/BLUEPRINT_PILOT_SELECTION_SYSTEM.md` |
| DronePort physical layer | `04_DronePorts/MasterPlan/` | `02_Architecture/Blueprint/DROPi_6_LAYERS_EXPLAINED.md` |
| Supervised autonomous delivery | `03_Logistics/Supervised_Autonomous_Delivery/` | `06_Roles/Pilot_Selection/BLUEPRINT_PILOT_SELECTION_SYSTEM.md` |
| AI organization and DSS limits | `08_AI/Governance/AI_DEVELOPMENT_HANDOVER_CANON.md`, `08_AI/DSS/` | `06_Roles/AI_Agent_System/AI_AGENT_SYSTEM.md` |
| Governance, escalation, and non-goals | `00_Project/Governance/MasterPlan_Governance/`, `09_Reference/Strategic_Boundaries/` | `00_Project/Governance/AGENTS.md`, `00_Project/Governance/AI_DEVELOPMENT_CHARTER.md`, `00_Project/Governance/PROJECT_TRANSFER.md` |
| Business model, legal model, GTM, scaling | `07_Economy/Business_Legal_Scaling/`, `07_Economy/KPI_Unit_Economics/`, `07_Economy/Recovered_Contracts/` | `09_Reference/Pitch/` |
| Independent deployment philosophy | `09_Reference/Deployment/BLUEPRINT_INDEPENDENT_DEPLOYMENT.md` | `09_Reference/Deployment/DEPLOYMENT.md`, `09_Reference/Deployment/Historical_Archive/DEPLOYMENT_GUIDE.md` |

## 5. Folder-by-Folder Intent

| Folder | Intent | Main content |
|---|---|---|
| `00_Project/` | Governance, package indexes, project transfer | Canonical folder index, session continuity, governance rules, recovered package readmes |
| `01_Vision/` | Strategic foundation and top-level masterplan | Volume I strategy, masterplan root, recovered strategy markdown |
| `02_Architecture/` | Structural model of the ecosystem | Core repo architecture docs, six-layer blueprint, recovered system architecture, app-core/integration chapters |
| `03_Logistics/` | Delivery execution model | Multimodal delivery rules and supervised autonomous delivery chapters |
| `04_DronePorts/` | Physical infrastructure layer | DronePort chapters from the extracted masterplan |
| `05_Marketplace/` | Controlled marketplace doctrine | Chapter 6 product docs, marketplace website governance, recovered marketplace markdown, derived marketplace blueprints |
| `06_Roles/` | Roles, RBAC, AI/human pairing, pilot selection | AI agent system, registration model, pilot-selection blueprint |
| `07_Economy/` | Economics, legal, scaling, contracts | Business/legal/scaling masterplan docs, KPI/unit economics, merchant terms |
| `08_AI/` | AI governance and DSS | AI handover canon and DSS chapters |
| `09_Reference/` | Supporting reference, deployment, pitch, risk, audit, historical package context | Deployment docs, pitch docs, recovered package indexes, historical component readmes, testing/release, risk, boundaries |

## 6. Package Statistics (v2.0 — 2026-07-16)

| Metric | Count |
|---|---|
| Total files packaged | 217 |
| Canonical markdown documents | 52 |
| Historical `.docx` documents (from 04.zip masterplan) | 147 |
| Recovered ZIP-only markdown documents | 18 |
| Package control documents | 4 |
| Source commit | `9bb32560781d30e32b2a6c9b457b9e23287fe92a` |
| Package version | `v2.0.0` |

## 7. Duplicate and Supersession Rules

- `canonical-delivery-reference.md` is included in `03_Logistics/Delivery_Reference/` as an independent canonical entry (it contains specific cross-references and metadata not present in `DELIVERY_MULTIMODAL.md`).
- The extracted masterplan corpus duplicates the masterplan `.docx` files inside `04.zip`; the package keeps the extracted copies for readability and provenance, and recovers ZIP-only markdown separately.
- Derived blueprints are kept, but they do **not** outrank primary canonical sources.

## 8. Recommended Tycoon Usage

Use this package to align:

- terminology
- architecture
- business concepts
- logistics philosophy
- role structure
- governance boundaries

Do **not** use it to auto-import implementation assumptions into gameplay. Where gameplay diverges, document the divergence explicitly.
