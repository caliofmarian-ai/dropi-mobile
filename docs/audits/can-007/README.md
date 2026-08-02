# CAN-007 — Verify derived package file provenance

## Purpose

Verify provenance for every file included in `DROPi_Canonical_Reference/`.

## Issue

[#49 — [CAN-007] Verify provenance of every derived canonical package file](https://github.com/caliofmarian-ai/dropi-mobile/issues/49)

## Files

| File | Description |
|---|---|
| `derived_package_provenance.json` | Machine-readable per-file provenance records |
| `derived_package_provenance.md` | Human-readable provenance summary |
| `README.md` | This file |

## Generator

```bash
PYTHONDONTWRITEBYTECODE=1 python scripts/verify_derived_package_provenance.py
```

## Tests

```bash
PYTHONDONTWRITEBYTECODE=1 python -m unittest -v tests/test_verify_derived_package_provenance.py
```
