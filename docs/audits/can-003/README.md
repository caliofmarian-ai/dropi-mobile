# CAN-003 audit artifacts

This directory contains the deterministic inventory and mapping of every
Markdown document stored in the authoritative `04.zip` archive.

## Mapping order

1. Path suffix plus byte-level SHA-256.
2. Path suffix plus normalized-text SHA-256.
3. Unique byte-level SHA-256 across repository Markdown files.
4. Unique normalized-text SHA-256 across repository Markdown files.
5. Unresolved entries are classified as archive-only or ambiguous.

Normalized text comparison is used only as an audit classification. It does
not rewrite either source.

## Safety

- `04.zip` is immutable and opened read-only.
- Historical Markdown files are opened read-only.
- No filename is renamed or normalized.
- No Markdown content is rewritten.
- Nothing is extracted over the repository.
- Reports contain no timestamps.

## Outputs

- `zip_markdown_inventory.json`
- `zip_markdown_inventory.md`
- `README.md`

## Regenerate

    python scripts/audit_zip_markdown.py       --archive 04.zip       --repo-root .       --output-dir docs/audits/can-003

## Tests

    python -m unittest -v tests/test_audit_zip_markdown.py
