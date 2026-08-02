# CAN-006 — Derived Package Statistics Reconciliation

## Purpose

This audit reconciles all reported statistics for `DROPi_Canonical_Reference/`.

## Issue

[#48 — \[CAN-006\] Reconcile derived canonical package statistics](https://github.com/caliofmarian-ai/dropi-mobile/issues/48)

## Dependencies

- CAN-002 (#44) — closed
- CAN-003 (#45) — closed

## Files

| File | Description |
|---|---|
| `derived_package_statistics.json` | Machine-readable reconciliation report |
| `derived_package_statistics.md` | Human-readable reconciliation report |
| `README.md` | This file |

## Generator

```
PYTHONDONTWRITEBYTECODE=1 python scripts/reconcile_derived_package_statistics.py
```

Options:

```
  --repo-root PATH      Repository root (default: auto-detected from script location)
  --package-root NAME   Package root relative to repo root (default: DROPi_Canonical_Reference)
  --output-dir PATH     Output directory (default: docs/audits/can-006)
```

## Tests

```
PYTHONDONTWRITEBYTECODE=1 python -m unittest -v tests/test_reconcile_derived_package_statistics.py
```

## Key Findings

- **Actual file count**: 217 files
- **Source document count**: 213
- **Package control document count**: 4
- **Directory count**: 88

### Historical 199 claim (stale)

The value **199** appears in `DROPi_Canonical_Reference/AI_CANONICAL_REFERENCE_AUDIT_REPORT.md`
and `canonical/SESSION_HANDOVER.md`.

It equals 195 (manifest source documents in `inventory.json`) + 4 (package control documents).
This was accurate at the time the audit report and inventory were finalized.
Subsequently, 18 additional source documents were added to the package,
raising the total to 217. The audit report was not updated.

### Historical 217 claim (current_exact)

The value **217** appears in `DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md`
and `canonical/SESSION_HANDOVER.md` (v2.0.0 reference).

This matches the actual file count exactly.

### Manifest discrepancy

`inventory.json` contains 195 source-document entries. The current package
contains 213 source documents. The 18-file gap corresponds to source documents
added after the inventory was finalized; these are not listed in `inventory.json`.

## Safety

No canonical source file, package control document, or historical audit report
was modified during CAN-006. `DROPi_Canonical_Reference/` was scanned read-only.
`04.zip` was not accessed.
