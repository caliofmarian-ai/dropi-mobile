# Canonical Package Regeneration Procedure

This document specifies the operational procedure for deterministic regeneration
of `DROPi_Canonical_Reference/` using `scripts/regenerate_canonical_reference.py`.

## Prerequisites

- The repository must be a complete, clean checkout (no uncommitted modifications).
- `04.zip` must be present in the repository root.
- `canonical/docs/00_MasterPlan/` must be present.
- `docs/audits/can-007/derived_package_provenance.json` must be present.
- CAN-007 provenance records must reflect the current package state.

## Required Python version

Python 3.9 or later. Standard library only — no external packages required.

Verify:

```
python --version
```

## Required repository state

The working tree must be clean before running regeneration:

```
git status --porcelain
```

Expected: no output (clean tree).

## A. Termux/Android

Install Python if not present:

```
pkg install python
```

Run validation-only (read-only, no package files written):

```
cd /path/to/dropi-mobile
PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --validate-existing
```

Run external regeneration:

```
OUT_DIR="$HOME/tmp/dropi-canonical-reference"
PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --output-dir "$OUT_DIR"
```

Run deterministic comparison:

```
PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --output-dir "$OUT_DIR" \
  --compare-with DROPi_Canonical_Reference
```

## B. Standard Linux

Run validation-only (read-only, no package files written):

```
cd /path/to/dropi-mobile
PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --validate-existing
```

Run external regeneration to a temporary directory:

```
OUT_DIR="$(mktemp -d)"
PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --output-dir "$OUT_DIR"
```

Run deterministic comparison against the checked-in package:

```
PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --output-dir "$OUT_DIR" \
  --compare-with DROPi_Canonical_Reference
```

Prove byte-identical repeated regeneration:

```
OUT_ONE="$(mktemp -d)"
OUT_TWO="$(mktemp -d)"

PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --output-dir "$OUT_ONE"

PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --output-dir "$OUT_TWO"

diff -rq "$OUT_ONE" "$OUT_TWO" && echo "IDENTICAL" || echo "DIVERGENT"
```

## C. GitHub Actions compatibility assessment

**Status: compatible_with_clean_checkout**

The tool uses Python standard library only and has been assessed against
`ubuntu-latest` runner behaviour.

Compatibility notes:

- Requires `actions/checkout` with full tree (not shallow).
- Requires `04.zip` present in the repository (it is committed).
- Requires `python` to be available (pre-installed on `ubuntu-latest`).
- `PYTHONDONTWRITEBYTECODE=1` prevents `.pyc` artifacts in the repository.
- No network access required during regeneration.

Assessed example workflow step:

```yaml
- name: Validate canonical package regeneration
  run: |
    PYTHONDONTWRITEBYTECODE=1 python \
      scripts/regenerate_canonical_reference.py \
      --repo-root . \
      --validate-existing
  # Expected exit code: 5 (NOT CERTIFIABLE — documented unsupported files)
```

A full workflow file is not added because GitHub Actions compatibility has been
assessed but not continuously exercised. Do not claim full Actions support without
actual CI evidence.

## Interpretation of exit codes

| Exit code | Meaning |
| --- | --- |
| `0` | PASS — all files reproduced, CERTIFIABLE |
| `1` | General validation failure |
| `2` | Unsafe path or unsafe invocation |
| `3` | Missing source file |
| `4` | Divergent source or output hash |
| `5` | NOT CERTIFIABLE — unsupported or undocumented transformation prevents full certification |
| `6` | Malformed audit input |

**Expected exit code for this repository**: `5` — because three files have
`unknown_or_unsupported` provenance and one file has `derived_transformation`
with no documented deterministic algorithm. This is correct and documented
behaviour. Exit code `5` does NOT indicate a tool failure.

## Failure recovery

If the tool exits with code `3` (missing source):

1. Run with `--validate-existing` and read the manifest at
   `docs/audits/can-008/regeneration_manifest.json`.
2. Inspect the `missing_sources` field.
3. Verify that the source file exists at the expected path in the repository.
4. If the source was accidentally deleted, restore it from git history:
   `git checkout HEAD -- <path>`.

If the tool exits with code `4` (divergent):

1. Check the `divergent_files` field in the manifest.
2. Verify that no source file has been accidentally modified.
3. If source diverged deliberately (e.g. canonical update), a new CAN-007
   audit must be run before regeneration.

If the tool exits with code `6` (malformed input):

1. Verify that `docs/audits/can-007/derived_package_provenance.json` is valid JSON.
2. Verify it contains a `records` list.

## Prohibition on manual package edits

**Never manually edit files inside `DROPi_Canonical_Reference/`.**

The package is a derived, read-only output. Any change to a package file must
be made to the authoritative source, then a new regeneration must be run and
a verified PR must be opened.

## Prohibition on modifying 04.zip

**Never modify or replace `04.zip`.**

The archive has a fixed SHA-256:

```
82a6015b8c968645307e36c8e4aa0351515f50333c08a6c5402a7819b7b747e5
```

The tool verifies this hash on every run and will exit `4` if it does not match.

## How to perform a safe package replacement

If the canonical sources have changed and a new package must be regenerated:

1. Ensure all source changes are committed and reviewed.
2. Run CAN-007 again to update provenance records.
3. Run this tool with `--output-dir /tmp/new-package`.
4. Review all differences between the old and new package.
5. Open a focused PR replacing `DROPi_Canonical_Reference/`.
6. The PR must pass independent review and include the updated manifest.

**Never use `--output-dir DROPi_Canonical_Reference` directly.**
The tool rejects this path to prevent accidental in-place mutation.

## Review checklist

Before committing any regeneration result:

- [ ] Tool exited with code `0` (CERTIFIABLE) or `5` (NOT CERTIFIABLE — documented).
- [ ] `regeneration_manifest.json` checked in and matches fresh `--validate-existing` run.
- [ ] `regeneration_report.md` checked in and matches fresh `--validate-existing` run.
- [ ] `04.zip` SHA-256 unchanged.
- [ ] `canonical/` unchanged.
- [ ] `BLUEPRINT/` unchanged.
- [ ] `DROPi_Canonical_Reference/` unchanged (if validation only).
- [ ] No timestamps in outputs.
- [ ] No environment-specific paths in outputs.
- [ ] `git diff --check` passes.
- [ ] `pnpm lint` passes.
- [ ] Tests pass: `PYTHONDONTWRITEBYTECODE=1 python -m unittest -v tests/test_regenerate_canonical_reference.py`.
