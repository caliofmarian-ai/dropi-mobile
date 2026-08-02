# Canonical Package Regeneration Procedure

This document defines the deterministic, read-only procedure for regenerating
`DROPi_Canonical_Reference/` with
`/home/runner/work/dropi-mobile/dropi-mobile/scripts/regenerate_canonical_reference.py`.

## Preconditions

- Clean checkout.
- `04.zip` present.
- `canonical/docs/00_MasterPlan/` present.
- `docs/audits/can-006/derived_package_statistics.json` present.
- `docs/audits/can-007/derived_package_provenance.json` present.

## Package-control rule

The following package-control files are generated from documented inputs and are
never copied from existing package bytes:

- `AI_CANONICAL_REFERENCE_AUDIT_REPORT.md`
- `CANONICAL_KNOWLEDGE_INDEX.md`
- `CANONICAL_MANIFEST.md`
- `README_FOR_DROPi_TYCOON.md`

Generator inputs are limited to audited package metadata, provenance, and
`04.zip` SHA-256 evidence. Outputs use stable ordering, stable JSON key
ordering, stable newlines, no timestamps, and no absolute paths.

## Validation-only

```bash
cd /home/runner/work/dropi-mobile/dropi-mobile
PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --validate-existing
```

Expected exit code for the current repository: `5`.

Reason: three unsupported files, one undocumented derived transformation, and
four package-control files that are deterministically regenerated but are not
exactly reproducible from the documented inputs of the currently checked-in
package bytes.

## External regeneration

```bash
OUT_DIR="$(mktemp -d)"
PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --output-dir "$OUT_DIR"
```

## Compare regenerated output with the checked-in package

```bash
OUT_DIR="$(mktemp -d)"
PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --output-dir "$OUT_DIR" \
  --compare-with DROPi_Canonical_Reference
```

Current expectation: the comparison reports divergence for the four
package-control files because the checked-in bytes are not exactly reproducible
from the documented deterministic inputs.

## Prove repeated deterministic regeneration

```bash
OUT_ONE="$(mktemp -d)"
OUT_TWO="$(mktemp -d)"

PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --output-dir "$OUT_ONE"

PYTHONDONTWRITEBYTECODE=1 python scripts/regenerate_canonical_reference.py \
  --repo-root . \
  --output-dir "$OUT_TWO"

diff -rq "$OUT_ONE" "$OUT_TWO"
```

Expected result: full trees are identical.

## GitHub Actions compatibility assessment

- `github_actions`: `assessed_compatible_with_clean_checkout`
- `github_actions_execution`:
  `not_exercised_in_actual_github_actions_for_this_pr`

Honest interpretation:

- The script uses Python standard library only.
- It is assessed as compatible with a clean checkout on GitHub-hosted Linux.
- This PR does **not** cite a real GitHub Actions workflow run for the
  regeneration procedure.
- Do not claim `ubuntu-latest` execution for this PR without workflow evidence.

## Exit codes

| Exit code | Meaning |
| --- | --- |
| `0` | Fully certifiable regeneration |
| `1` | General validation failure |
| `2` | Unsafe path or unsafe invocation |
| `3` | Missing authoritative source |
| `4` | Authoritative-source divergence or compare-with tree divergence |
| `5` | Not certifiable due to documented blockers |
| `6` | Malformed audit input |

## Review checklist

- [ ] `regeneration_manifest.json` matches a fresh `--validate-existing` run.
- [ ] `regeneration_report.md` matches a fresh `--validate-existing` run.
- [ ] Package-control files were regenerated from documented inputs, not copied.
- [ ] Fallback-retained files are not counted as regenerated from source.
- [ ] GitHub Actions wording stays at `assessed_compatible_with_clean_checkout` and `not_exercised_in_actual_github_actions_for_this_pr` unless real workflow evidence is added.
- [ ] `git diff --check` passes.
- [ ] `pnpm lint` passes.
- [ ] `pnpm test` passes.
- [ ] `pnpm build` passes.
- [ ] `pnpm check` passes.
