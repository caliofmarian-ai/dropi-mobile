# CAN-005 audit artifacts

This directory contains the CAN-005 canonical filename encoding inventory.

## Scope

CAN-005 audits filename encoding across all canonical scopes:

1. Exact historical names inside immutable `04.zip` (via CAN-001).
2. Mapped extracted names in `canonical/docs/00_MasterPlan/` (via CAN-002).
3. Markdown counterparts identified by CAN-003.
4. Files in `DROPi_Canonical_Reference/`, when present.

## What is detected

- Mojibake markers in archive or repository filenames.
- Non-NFC Unicode paths.
- Control characters in paths.
- Archive/repository filename differences (path-name-mismatch).
- Content-identical encoding/path variants.
- Case-folded NFC proposed-name collisions.
- Textual references affected by a future rename.
- Normalization risk and prerequisites.

## Safety

- No archive content is rewritten.
- No file is extracted, renamed, or modified.
- The `readable_proposed_display_name` field is proposal metadata only.
- Reports contain no timestamps.
- `04.zip` remains byte-identical after generation.

## Determinism fix

Repository textual-reference scanning excludes the complete CAN-005 output
directory by resolved path. This prevents freshly written reports from
appearing as additional affected references on the next run.

## Input audits consumed

- `docs/audits/can-001/04_zip_inventory.json`
- `docs/audits/can-002/masterplan_comparison.json`
- `docs/audits/can-003/zip_markdown_inventory.json`
- `docs/audits/can-004/canonical_authority_matrix.json`

## Regenerate

    python scripts/audit_canonical_filename_encoding.py \
      --archive 04.zip \
      --repo-root . \
      --output-dir docs/audits/can-005

## Tests

    python -m unittest -v tests/test_canonical_filename_encoding.py
