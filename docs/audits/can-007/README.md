# CAN-007 — Verify derived package file provenance

## Purpose

Verify provenance for every file included in `DROPi_Canonical_Reference/` with deterministic evidence and explicit supported/unsupported semantics.

## Issue

[#49 — [CAN-007] Verify provenance of every derived canonical package file](https://github.com/caliofmarian-ai/dropi-mobile/issues/49)

## Files

| File | Description |
|---|---|
| `derived_package_provenance.json` | Machine-readable per-file provenance report (217 records) |
| `derived_package_provenance.md` | Human-readable report with full 217-row provenance table |
| `README.md` | This file |

## Official provenance classes

- `recovered_directly_from_04_zip`
- `copied_from_extracted_masterplan`
- `copied_from_active_canonical`
- `derived_from_root_architecture_or_governance`
- `derived_from_blueprint`
- `package_control_document`
- `unknown_or_unsupported`

## Official derived statuses

- `copied_byte_identical`
- `copied_with_path_or_filename_variant`
- `normalized_content_equivalent`
- `derived_transformation`
- `package_control`
- `unsupported`

## Generator

```bash
PYTHONDONTWRITEBYTECODE=1 python scripts/verify_derived_package_provenance.py
```

## Tests

```bash
PYTHONDONTWRITEBYTECODE=1 python -m unittest -v tests/test_verify_derived_package_provenance.py
```
