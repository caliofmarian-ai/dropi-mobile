# Canonical Package Regeneration Procedure

This document defines the deterministic, read-only procedure for regenerating
`DROPi_Canonical_Reference/` with `scripts/regenerate_canonical_reference.py`.

## Preconditions

- Clean checkout.
- `04.zip` present.
- `canonical/docs/00_MasterPlan/` present.
- `docs/audits/can-006/derived_package_statistics.json` present.
- `docs/audits/can-007/derived_package_provenance.json` present.
- No package mutation.
- No 04.zip mutation.

## Package-control rule

The following package-control files are generated from documented audit inputs
and are never copied from existing package bytes:

- `AI_CANONICAL_REFERENCE_AUDIT_REPORT.md`
- `CANONICAL_KNOWLEDGE_INDEX.md`
- `CANONICAL_MANIFEST.md`
- `README_FOR_DROPi_TYCOON.md`

Generator inputs are limited to audited package metadata, provenance, and
`04.zip` SHA-256 evidence. Outputs use stable ordering, stable JSON key
ordering, stable newlines, no timestamps, and no absolute paths.

## A. Termux/Android

Repository path:
`~/storage/shared/AI-Projects/dropi-mobile`

Warning: Android shared storage cannot safely host Node symlink-heavy
dependency installation, but this Python standard-library tool itself is
compatible. This procedure performs no package mutation and no 04.zip mutation.

### Validation-only command

```bash
cd ~/storage/shared/AI-Projects/dropi-mobile || exit 1
set -euo pipefail
PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --validate-existing
```

Expected exit code for the current repository: `5`.

Meaning: the regeneration is deterministic but currently NOT CERTIFIABLE
because three files remain unsupported, one file depends on an undocumented
derived transformation, and four package-control files are generated from
documented inputs but are not exactly reproducible from the checked-in package
bytes.

### External regeneration command

```bash
cd ~/storage/shared/AI-Projects/dropi-mobile || exit 1
set -euo pipefail
OUT_DIR="$(mktemp -d "$HOME/.cache/dropi-can-008-out.XXXXXX")"
AUDIT_DIR="$(mktemp -d "$HOME/.cache/dropi-can-008-audit.XXXXXX")"
PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --output-dir "$OUT_DIR" \
  --audit-output-dir "$AUDIT_DIR"
```

### Deterministic comparison command

```bash
cd ~/storage/shared/AI-Projects/dropi-mobile || exit 1
set -euo pipefail
OUT_ONE="$(mktemp -d "$HOME/.cache/dropi-can-008-one.XXXXXX")"
OUT_TWO="$(mktemp -d "$HOME/.cache/dropi-can-008-two.XXXXXX")"
AUDIT_ONE="$(mktemp -d "$HOME/.cache/dropi-can-008-audit-one.XXXXXX")"
AUDIT_TWO="$(mktemp -d "$HOME/.cache/dropi-can-008-audit-two.XXXXXX")"

PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --output-dir "$OUT_ONE" \
  --audit-output-dir "$AUDIT_ONE"

PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --output-dir "$OUT_TWO" \
  --audit-output-dir "$AUDIT_TWO"

diff -rq "$OUT_ONE" "$OUT_TWO"
```

Expected result: full trees are identical.

## B. Standard Linux

### Validation-only command

```bash
cd /path/to/dropi-mobile
set -euo pipefail
PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --validate-existing
```

### External regeneration command

```bash
cd /path/to/dropi-mobile
set -euo pipefail
OUT_DIR="$(mktemp -d)"
AUDIT_DIR="$(mktemp -d)"
PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --output-dir "$OUT_DIR" \
  --audit-output-dir "$AUDIT_DIR"
```

### Deterministic comparison command

```bash
cd /path/to/dropi-mobile
set -euo pipefail
OUT_DIR="$(mktemp -d)"
AUDIT_DIR="$(mktemp -d)"
PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --output-dir "$OUT_DIR" \
  --audit-output-dir "$AUDIT_DIR" \
  --compare-with DROPi_Canonical_Reference
```

Current expectation: the comparison reports divergence for the four
package-control files because the checked-in bytes are not exactly reproducible
from the documented deterministic inputs.

## C. GitHub Actions compatibility assessment

- `github_actions`: `assessed_compatible_with_clean_checkout`
- `github_actions_execution`:
  `not_exercised_in_actual_github_actions_for_this_pr`

Honest interpretation:

- The script uses Python standard library only.
- It is assessed as compatible with a clean checkout on GitHub-hosted Linux.
- This PR does **not** cite a real GitHub Actions workflow run for the
  regeneration procedure.
- Do not claim `tested with ubuntu-latest`, `validated on GitHub Actions`, or
  `executed in CI` without real workflow evidence.

## Exit-code table

| Exit code | Meaning |
| --- | --- |
| `0` | Fully certifiable regeneration |
| `1` | General validation failure |
| `2` | Unsafe path or unsafe invocation |
| `3` | Missing authoritative source |
| `4` | Authoritative-source divergence or compare-with tree divergence |
| `5` | Not certifiable due to documented blockers |
| `6` | Malformed audit input |

## Failure recovery

- If validation returns `2`, replace the output path with a fresh external
  directory and rerun.
- If validation returns `3` or `6`, restore the missing or malformed audited
  inputs before rerunning.
- If validation returns `4`, treat the divergence as evidence to review; do not
  overwrite the checked-in package.
- If validation returns `5`, preserve the current NOT CERTIFIABLE status and
  document only the blocker evidence regenerated by the script.

## Prohibition on manual package edits

Do not manually edit generated package-control files to force byte identity.
They must remain generated from documented inputs only.

## Prohibition on modifying 04.zip

Do not replace, rewrite, rezip, normalize, or otherwise modify `04.zip` during
CAN-008 validation or regeneration.

## Future safe replacement PR procedure

1. Regenerate into a fresh external directory.
2. Compare the full regenerated tree with `DROPi_Canonical_Reference/`.
3. Regenerate the CAN-008 audit output into a fresh external audit directory.
4. Verify `regeneration_manifest.json` and `regeneration_report.md` are
   byte-identical to the checked-in audit outputs before proposing replacement.
5. Open a separate reviewable PR if the package bytes themselves ever need safe
   replacement after new authoritative evidence is documented.

## Review checklist

- [ ] `regeneration_manifest.json` matches a fresh `--validate-existing` run.
- [ ] `regeneration_report.md` matches a fresh `--validate-existing` run.
- [ ] Package-control files were regenerated from documented inputs, not copied.
- [ ] Fallback-retained files are not counted as regenerated from source.
- [ ] GitHub Actions wording stays at `assessed_compatible_with_clean_checkout`
      and `not_exercised_in_actual_github_actions_for_this_pr` unless real
      workflow evidence is added.
- [ ] `git diff --check` passes.
- [ ] `pnpm lint`: PASS
- [ ] `pnpm test`: PASS
- [ ] `pnpm build`: PASS
- [ ] `pnpm check`: PRE-EXISTING FAILURE only if normalized errors are
      identical to untouched `origin/main`.
- [ ] Unrelated TypeScript errors must not be repaired during CAN-008.
