# [CAN-008] Deterministic Canonical Package Regeneration

## Purpose

This audit defines and validates the deterministic, reproducible, read-only
regeneration process for `DROPi_Canonical_Reference/`.

## Scope

- **Audit**: CAN-008
- **Package**: `DROPi_Canonical_Reference/` (217 files)
- **Tool**: `scripts/regenerate_canonical_reference.py`
- **Provenance source**: CAN-007 (`docs/audits/can-007/derived_package_provenance.json`)

## Certification status

**NOT CERTIFIABLE**

Four files prevent full certification:

- `00_Project/Governance/SESSION_HANDOVER.md` — `derived_transformation_algorithm_not_documented`
- `00_Project/Status_Reports/AUDIT_TRACKING.md` — `unsupported_no_deterministic_source`
- `00_Project/Status_Reports/SESSION_STATE.md` — `unsupported_no_deterministic_source`
- `09_Reference/Package_Metadata/inventory.json` — `unsupported_no_deterministic_source`

The 213 remaining files (209 copied + 4 package-control) are deterministically
reproduced and byte-identical.

## Output files

| File | Description |
| --- | --- |
| `regeneration_manifest.json` | Full per-file regeneration results |
| `regeneration_report.md` | Human-readable regeneration report |
| `README.md` | This file |

## Related audits

| Audit | Purpose |
| --- | --- |
| CAN-001 | 04.zip inventory and SHA-256 evidence |
| CAN-006 | Package statistics reconciliation |
| CAN-007 | Per-file provenance records (primary input) |

## Procedure

See `docs/CANONICAL_PACKAGE_REGENERATION.md` for operational commands.
