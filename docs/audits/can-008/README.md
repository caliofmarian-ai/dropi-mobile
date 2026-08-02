# [CAN-008] Deterministic Canonical Package Regeneration

## Purpose

This audit defines the deterministic, read-only regeneration procedure for
`DROPi_Canonical_Reference/` and records the current certification blockers.

## Scope

- **Audit**: CAN-008
- **Package**: `DROPi_Canonical_Reference/` (217 files)
- **Tool**: `scripts/regenerate_canonical_reference.py`
- **Primary audited inputs**:
  - `docs/audits/can-006/derived_package_statistics.json`
  - `docs/audits/can-007/derived_package_provenance.json`
  - `04.zip`

## Certification status

**NOT CERTIFIABLE**

Current blockers: **8**

- `00_Project/Governance/SESSION_HANDOVER.md` — `derived_transformation_algorithm_not_documented`
- `00_Project/Status_Reports/AUDIT_TRACKING.md` — `unsupported_no_deterministic_source`
- `00_Project/Status_Reports/SESSION_STATE.md` — `unsupported_no_deterministic_source`
- `09_Reference/Package_Metadata/inventory.json` — `unsupported_no_deterministic_source`
- `AI_CANONICAL_REFERENCE_AUDIT_REPORT.md` — `package_control_audit_report_checked_in_bytes_depend_on_undocumented_curated_audit_narrative`
- `CANONICAL_KNOWLEDGE_INDEX.md` — `package_control_knowledge_index_checked_in_bytes_depend_on_undocumented_curated_navigation_text`
- `CANONICAL_MANIFEST.md` — `package_control_manifest_checked_in_bytes_depend_on_undocumented_curated_per_document_metadata`
- `README_FOR_DROPi_TYCOON.md` — `package_control_readme_checked_in_bytes_depend_on_undocumented_branch_commit_generation_metadata`

## Exact package-control paths

1. `AI_CANONICAL_REFERENCE_AUDIT_REPORT.md`
2. `CANONICAL_KNOWLEDGE_INDEX.md`
3. `CANONICAL_MANIFEST.md`
4. `README_FOR_DROPi_TYCOON.md`

## Package-control generation rules

| Path | Semantic role | Deterministic generator inputs |
| --- | --- | --- |
| `AI_CANONICAL_REFERENCE_AUDIT_REPORT.md` | Recovery audit summary | CAN-006 statistics, CAN-007 provenance, `04.zip` SHA-256 evidence |
| `CANONICAL_KNOWLEDGE_INDEX.md` | Navigation index | CAN-006 statistics and section counts, CAN-007 provenance |
| `CANONICAL_MANIFEST.md` | Package inventory manifest | CAN-006 package inventory metadata, CAN-007 provenance |
| `README_FOR_DROPi_TYCOON.md` | Consumer usage readme | CAN-006 package totals, CAN-007 provenance, `04.zip` SHA-256 evidence |

These files are generated from documented inputs only. Existing bytes inside
`DROPi_Canonical_Reference/` are not used as the source for regenerated
package-control output.

## Current regeneration summary

- Expected package files: 217
- Actually regenerated from documented inputs: 213
- Retained existing fallback files: 4
- Package-control files regenerated: 4
- Package-control files not exactly reproducible: 4
- Certifiable files: 209
- Non-certifiable files: 8

## GitHub Actions compatibility assessment

- `github_actions`: `assessed_compatible_with_clean_checkout`
- `github_actions_execution`:
  `not_exercised_in_actual_github_actions_for_this_pr`

This audit does not claim `tested with ubuntu-latest`, `validated on GitHub
Actions`, or `executed in CI` for this PR.

## Output files

| File | Description |
| --- | --- |
| `regeneration_manifest.json` | Full per-file results with source category, counters, and blockers |
| `regeneration_report.md` | Human-readable report with package-control evidence |
| `README.md` | This audit overview |

## Procedure

See `docs/CANONICAL_PACKAGE_REGENERATION.md` for the Termux/Android procedure,
the Standard Linux procedure, the validation-only command, the external
regeneration command, and the deterministic comparison command.
