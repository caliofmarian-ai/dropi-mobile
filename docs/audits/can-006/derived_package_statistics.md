# [CAN-006] Derived Package Statistics — Reconciliation Report

## 1. Definitions and Counting Rules

**Actual package file**: any regular file discovered by recursive traversal of `DROPi_Canonical_Reference/`, excluding directories and excluded directory names (`.git`, `node_modules`, `__pycache__`, `.cache`, `coverage`, `dist`, `build`). Each file is recorded exactly once.

**Source document**: an actual package file that is not a package control document. Source documents are the primary knowledge content of the package.

**Package control document**: one of the four files explicitly labelled 'package control document' in `CANONICAL_MANIFEST.md`: `README_FOR_DROPi_TYCOON.md`, `CANONICAL_KNOWLEDGE_INDEX.md`, `CANONICAL_MANIFEST.md`, and `AI_CANONICAL_REFERENCE_AUDIT_REPORT.md`.

**Directories**: excluded from all file totals.

**Generated audit reports**: included in the package file total (they are actual package files).

**Manifest/index/control files**: included in the package file total.

**Domain assignment**: files are assigned to canonical domains (CAN-004) using an explicit ordered rule set based on top-level section and subdirectory. Each file is counted exactly once by primary domain. Files that cannot be safely classified are marked `unclassified`.

## 2. Ground-Truth Actual Totals

| Metric | Count |
| --- | --- |
| Actual file count | 217 |
| Source document count | 213 |
| Package control document count | 4 |
| Directory count | 88 |
| Duplicate path count | 0 |
| Duplicate content groups | 1 |
| Classified files | 214 |
| Unclassified files | 3 |

## 3. Source-Document versus Package-Control Totals

- **Source documents**: 213

- **Package control documents**: 4

- **Total**: 217

Package control documents (explicitly labelled in CANONICAL_MANIFEST.md):

- `AI_CANONICAL_REFERENCE_AUDIT_REPORT.md`
- `CANONICAL_KNOWLEDGE_INDEX.md`
- `CANONICAL_MANIFEST.md`
- `README_FOR_DROPi_TYCOON.md`

## 4. Files by Extension

| Extension | Count |
| --- | --- |
| `.docx` | 147 |
| `.json` | 1 |
| `.md` | 69 |

## 5. Files by Domain

| Domain | Count |
| --- | --- |
| ai-agents | 6 |
| backend | 1 |
| database | 0 |
| delivery-modes | 2 |
| deployment-and-operations | 16 |
| droneports | 5 |
| economy | 15 |
| governance | 47 |
| logistics | 6 |
| marketplace | 41 |
| mobile | 2 |
| roles-and-channels | 3 |
| security | 7 |
| system-architecture | 33 |
| unclassified | 3 |
| vision-and-strategy | 30 |

**Domain total check**: sum of primary-domain counts = 217 (must equal actual file count 217).

## 6. Files by Package Section

| Top-level section | Count |
| --- | --- |
| (root) | 4 |
| 00_Project | 25 |
| 01_Vision | 14 |
| 02_Architecture | 27 |
| 03_Logistics | 8 |
| 04_DronePorts | 5 |
| 05_Marketplace | 41 |
| 06_Roles | 3 |
| 07_Economy | 15 |
| 08_AI | 6 |
| 09_Reference | 69 |

## 7. Duplicate-Content Findings

1 group(s) of files share identical SHA-256 content:

### Hash `6fdad4c3cd93ef13…`

- `03_Logistics/Delivery/DELIVERY_MULTIMODAL.md`
- `03_Logistics/Delivery_Reference/canonical-delivery-reference.md`

## 8. Discovered Statistical Claims

| ID | Source | Claimed Value | Metric | Actual | Status |
| --- | --- | --- | --- | --- | --- |
| CLAIM-001 | `DROPi_Canonical_Reference/AI_CANONICAL_REFERENCE_AUDIT_REPORT.md` | 199 | total_files_in_package_including_package_control_docs | 217 | **stale** |
| CLAIM-002 | `DROPi_Canonical_Reference/AI_CANONICAL_REFERENCE_AUDIT_REPORT.md` | 195 | source_document_count_in_final_package | 213 | **stale** |
| CLAIM-003 | `DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md` | 217 | total_files_packaged | 217 | **current_exact** |
| CLAIM-004 | `DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md` | 52 | canonical_markdown_document_count | — | **contradictory** |
| CLAIM-005 | `DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md` | 147 | historical_docx_document_count | — | **contradictory** |
| CLAIM-006 | `DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md` | 18 | recovered_zip_only_markdown_count | — | **contradictory** |
| CLAIM-007 | `DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md` | 4 | package_control_document_count | 4 | **current_exact** |
| CLAIM-008 | `canonical/SESSION_HANDOVER.md` | 217 | dropi_canonical_reference_file_count | 217 | **current_exact** |
| CLAIM-009 | `canonical/SESSION_HANDOVER.md` | 199 | total_files_in_package_at_earlier_state | 217 | **stale** |
| CLAIM-010 | `DROPi_Canonical_Reference/09_Reference/Package_Metadata/inventory.json` | 195 | manifest_source_document_count | 213 | **stale** |

## 9. Status of Each Claim

### CLAIM-001 — STALE

**Source**: `DROPi_Canonical_Reference/AI_CANONICAL_REFERENCE_AUDIT_REPORT.md`

**Context**: | Included in final package (including package control docs) | 199 |

**Claimed**: 199  |  **Actual**: 217

**Explanation**: Claimed value 199 does not match the actual computed value of 217 for metric 'total_files_in_package_including_package_control_docs'. The claim appears to have been accurate at an earlier state of the package and has not been updated to reflect the current 217 files.

### CLAIM-002 — STALE

**Source**: `DROPi_Canonical_Reference/AI_CANONICAL_REFERENCE_AUDIT_REPORT.md`

**Context**: | Included in final package (source documents only) | 195 |

**Claimed**: 195  |  **Actual**: 213

**Explanation**: Claimed value 195 does not match the actual computed value of 213 for metric 'source_document_count_in_final_package'. The claim appears to have been accurate at an earlier state of the package and has not been updated to reflect the current 213 files.

### CLAIM-003 — CURRENT_EXACT

**Source**: `DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md`

**Context**: | Total files packaged | 217 |

**Claimed**: 217  |  **Actual**: 217

**Explanation**: Claimed value 217 matches the actual computed value for metric 'total_files_packaged'.

### CLAIM-004 — CONTRADICTORY

**Source**: `DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md`

**Context**: | Canonical markdown documents | 52 |

**Claimed**: 52  |  **Actual**: —

**Explanation**: CANONICAL_KNOWLEDGE_INDEX.md breakdown rows (52 canonical md + 147 docx + 18 ZIP-only md + 4 package control = 221) do not sum to the stated total of 217. These subcategory counts are internally inconsistent; no safe actual value can be derived for this specific subcategory without resolving the document's internal contradiction.

### CLAIM-005 — CONTRADICTORY

**Source**: `DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md`

**Context**: | Historical `.docx` documents (from 04.zip masterplan) | 147 |

**Claimed**: 147  |  **Actual**: —

**Explanation**: CANONICAL_KNOWLEDGE_INDEX.md breakdown rows (52 canonical md + 147 docx + 18 ZIP-only md + 4 package control = 221) do not sum to the stated total of 217. These subcategory counts are internally inconsistent; no safe actual value can be derived for this specific subcategory without resolving the document's internal contradiction.

### CLAIM-006 — CONTRADICTORY

**Source**: `DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md`

**Context**: | Recovered ZIP-only markdown documents | 18 |

**Claimed**: 18  |  **Actual**: —

**Explanation**: CANONICAL_KNOWLEDGE_INDEX.md breakdown rows (52 canonical md + 147 docx + 18 ZIP-only md + 4 package control = 221) do not sum to the stated total of 217. These subcategory counts are internally inconsistent; no safe actual value can be derived for this specific subcategory without resolving the document's internal contradiction.

### CLAIM-007 — CURRENT_EXACT

**Source**: `DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md`

**Context**: | Package control documents | 4 |

**Claimed**: 4  |  **Actual**: 4

**Explanation**: Claimed value 4 matches the actual computed value for metric 'package_control_document_count'.

### CLAIM-008 — CURRENT_EXACT

**Source**: `canonical/SESSION_HANDOVER.md`

**Context**: `DROPi_Canonical_Reference/` (217 fișiere, v2.0.0)

**Claimed**: 217  |  **Actual**: 217

**Explanation**: Claimed value 217 matches the actual computed value for metric 'dropi_canonical_reference_file_count'.

### CLAIM-009 — STALE

**Source**: `canonical/SESSION_HANDOVER.md`

**Context**: 199 fișiere totale în pachet incluzând documentele de control

**Claimed**: 199  |  **Actual**: 217

**Explanation**: Claimed value 199 does not match the actual computed value of 217 for metric 'total_files_in_package_at_earlier_state'. The claim appears to have been accurate at an earlier state of the package and has not been updated to reflect the current 217 files.

### CLAIM-010 — STALE

**Source**: `DROPi_Canonical_Reference/09_Reference/Package_Metadata/inventory.json`

**Context**: Array length of inventory.json: 195 source-document entries (does not list package control documents).

**Claimed**: 195  |  **Actual**: 213

**Explanation**: Claimed value 195 does not match the actual computed value of 213 for metric 'manifest_source_document_count'. The claim appears to have been accurate at an earlier state of the package and has not been updated to reflect the current 213 files.

## 10. Reconciliation

### 10.1 Actual Package Contents

- Total files: **217**

- Source documents: **213**

- Package control documents: **4**

### 10.2 Manifest (inventory.json)

- Manifest path: `DROPi_Canonical_Reference/09_Reference/Package_Metadata/inventory.json`

- Manifest entry count: **195**

- Actual file count: **217**

- Matched (in both): **195**

- In manifest but not in actual: **0**

- In actual but not in manifest: **22**

- Status: **divergent**

inventory.json contains source documents only; package control documents and files added after the audit report was finalized are not listed.

Files in actual package but absent from manifest:

- `00_Project/Decision_Log/DECISION_LOG.md`
- `00_Project/Sprint_Specs/SPRINT_1_2_SPEC.md`
- `00_Project/Status_Reports/AUDIT_TRACKING.md`
- `00_Project/Status_Reports/DROPI_STATUS_REPORT_2026-06-30.md`
- `00_Project/Status_Reports/SESSION_STATE.md`
- `02_Architecture/Design/design.md`
- `03_Logistics/Delivery_Reference/canonical-delivery-reference.md`
- `05_Marketplace/Implementation/MARKETPLACE_IMPLEMENTATION_PLAN.md`
- `09_Reference/Blueprint/Sprint_Roadmap/BLUEPRINT_SPRINT_ROADMAP.md`
- `09_Reference/Blueprint/Sprint_Roadmap/DROPi_NEXT_SPRINT_TASKS.md`
- `09_Reference/Deployment/ADMIN_PROVISIONING.md`
- `09_Reference/Historical_RCA/AUTH_PASSWORD_RESET_RCA_2026-07-12.md`
- `09_Reference/Mobile_Setup/MOBILE_FIRST_SETUP.md`
- `09_Reference/Package_Metadata/inventory.json`
- `09_Reference/Periodic_Updates/periodic-updates.md`
- `09_Reference/ROADMAP.md`
- `09_Reference/Testing_Release/Blueprints/BLUEPRINT_TESTING_FORMAT.md`
- `09_Reference/Testing_Release/Blueprints/BLUEPRINT_TESTING_REQUIREMENTS.md`
- `AI_CANONICAL_REFERENCE_AUDIT_REPORT.md`
- `CANONICAL_KNOWLEDGE_INDEX.md`
- `CANONICAL_MANIFEST.md`
- `README_FOR_DROPi_TYCOON.md`

### 10.3 Knowledge Index (CANONICAL_KNOWLEDGE_INDEX.md)

- Source: `DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md`

- Claimed total: **217**  |  Actual: **217**  |  Status: **current_exact**

- Breakdown claimed: canonical md=52, historical docx=147, ZIP-only md=18, package control=4 (sum=221)

- Breakdown status: **contradictory**

The KI total of 217 matches the actual file count. However, the four breakdown rows sum to 221, not 217. The breakdown is internally inconsistent.

### 10.4 Audit Report (AI_CANONICAL_REFERENCE_AUDIT_REPORT.md)

- Source: `DROPi_Canonical_Reference/AI_CANONICAL_REFERENCE_AUDIT_REPORT.md`

- Claimed source docs: **195**  |  Actual: **213**

- Claimed package control docs: **4**  |  Actual: **4**

- Claimed total: **199**  |  Actual: **217**

- Status: **stale**

The audit report was finalized at an earlier package state. 195 source documents + 4 package control documents = 199. The current package contains 213 source documents + 4 package control documents = 217. 18 additional source documents are present in the current package that were not listed in the inventory.json manifest.

### 10.5 Historical 199 Claim

- Source: `DROPi_Canonical_Reference/AI_CANONICAL_REFERENCE_AUDIT_REPORT.md`

- Claimed value: **199**  |  Actual: **217**  |  Status: **stale**

The value 199 = 195 manifest source documents (inventory.json) + 4 package control documents. This count was accurate at the time the audit report and inventory.json were finalized. Subsequently, 18 additional source documents were added to the package, raising the total to 217. The audit report was not updated. This claim is stale.

195 (manifest) + 4 (package control) = 199. Actual = 217. Difference = 18.

### 10.6 Historical 217 Claim

- Source: `DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md`

- Claimed value: **217**  |  Actual: **217**  |  Status: **current_exact**

The value 217 appears in CANONICAL_KNOWLEDGE_INDEX.md as the total files packaged. Actual computed total is 217. This claim is current and exact.

Claimed 217. Actual 217. Match.

## 11. Proposed Corrections

### Proposal 1: `DROPi_Canonical_Reference/AI_CANONICAL_REFERENCE_AUDIT_REPORT.md`

**Current claim**: Included in final package (including package control docs) | 199

**Proposed claim**: Included in final package (including package control docs) | 217

**Reason**: The actual package file count is 217. The 199 figure was accurate at the time the audit report was finalized but 18 additional source documents have since been added to the package.

*Proposal only. `file_modified = False`*

### Proposal 2: `DROPi_Canonical_Reference/AI_CANONICAL_REFERENCE_AUDIT_REPORT.md`

**Current claim**: Included in final package (source documents only) | 195

**Proposed claim**: Included in final package (source documents only) | 213

**Reason**: The actual source document count is 213. The 195 figure matches the inventory.json manifest entry count but 18 additional source documents are present in the package that were not in the manifest.

*Proposal only. `file_modified = False`*

### Proposal 3: `DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md`

**Current claim**: Breakdown: canonical_markdown=52, historical_docx=147, recovered_zip_only_md=18, package_control=4 (sum=221)

**Proposed claim**: Breakdown subcategory figures require authorial review to reconcile internal sum (221) with stated total (217). No safe automatic correction is proposed.

**Reason**: The KI breakdown rows sum to 221 but the stated total is 217. The 4-file discrepancy cannot be resolved without authorial clarification of category boundaries.

*Proposal only. `file_modified = False`*

### Proposal 4: `DROPi_Canonical_Reference/09_Reference/Package_Metadata/inventory.json`

**Current claim**: 195 entries; does not include 18 source documents present in the package.

**Proposed claim**: Add 18 missing source document entries: 00_Project/Decision_Log/DECISION_LOG.md, 00_Project/Sprint_Specs/SPRINT_1_2_SPEC.md, 00_Project/Status_Reports/AUDIT_TRACKING.md, 00_Project/Status_Reports/DROPI_STATUS_REPORT_2026-06-30.md, 00_Project/Status_Reports/SESSION_STATE.md ... and 13 more

**Reason**: 18 source documents exist in the package but are not listed in inventory.json. The manifest is incomplete.

*Proposal only. `file_modified = False`*

## 12. Safety Statement

No canonical source file, derived package file, historical audit report, or package control document was modified during the generation of this report. All corrections above are proposals only. `DROPi_Canonical_Reference/` was scanned read-only. `04.zip` was not accessed.
