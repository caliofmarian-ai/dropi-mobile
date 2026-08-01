# CAN-004 audit artifacts

This directory contains the deterministic DROPi Canonical Authority Matrix.

## Inputs

- `docs/audits/can-001/04_zip_inventory.json`
- `docs/audits/can-002/masterplan_comparison.json`
- `docs/audits/can-003/zip_markdown_inventory.json`
- repository Markdown paths used only for deterministic candidate discovery

## Outputs

- `canonical_authority_matrix.json`
- `canonical_authority_matrix.md`
- `README.md`

## Safety and interpretation

- The historical archive remains the highest historical authority.
- Extracted copies remain subordinate to their archive sources.
- Derived references remain subordinate.
- Keyword discovery does not create approval or ownership.
- Missing owner or approval evidence is marked `unresolved`.
- Multiple candidates are displayed rather than silently reconciled.
- No canonical source content is changed.

## Regenerate

    python scripts/build_canonical_authority_matrix.py       --repo-root .       --output-dir docs/audits/can-004

## Tests

    python -m unittest -v tests/test_canonical_authority_matrix.py
