# CAN-001 audit artifacts

This directory contains the deterministic, read-only inventory of the
authoritative historical canonical archive `04.zip`.

## Safety

- `04.zip` is immutable.
- The generator opens the archive in read-only mode.
- The generator does not rename archive entries.
- The generator does not normalize archive paths.
- The generator does not extract files over the repository.
- Encoding anomalies are reported without correction.
- Generated reports contain no timestamps.

## Outputs

- `04_zip_inventory.json`
- `04_zip_inventory.md`
- `README.md`

## Regenerate

From the repository root:

    python scripts/audit_04_zip.py       --archive 04.zip       --repo-root .       --output-dir docs/audits/can-001

## Focused tests

    python -m unittest -v tests/test_audit_04_zip.py

Running the generator repeatedly against the same repository state must
produce byte-identical output files.
