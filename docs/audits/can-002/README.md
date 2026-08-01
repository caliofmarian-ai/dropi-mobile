# CAN-002 audit artifacts

This directory contains the deterministic one-to-one mapping between:

- authoritative MasterPlan DOCX entries in `04.zip`; and
- extracted DOCX files under `canonical/docs/00_MasterPlan/`.

## Mapping rules

1. Exact relative path is considered first.
2. Exact-path files are compared by SHA-256.
3. Remaining entries are mapped only when one authoritative entry and one
   local file share a unique SHA-256.
4. Unique hash matches with different paths are classified as
   `content_identical_path_encoding_variant`.
5. Only genuinely unmapped entries are reported as missing or additional.
6. Ambiguous duplicate-hash groups are reported without guessing.

## Safety

- No archive content is rewritten.
- No DOCX file is modified.
- No filename is renamed or normalized.
- No file is extracted over the repository.
- Reports contain no timestamps.

## Regenerate

    python scripts/audit_masterplan_corpus.py       --archive 04.zip       --archive-prefix "04/DROPI_CANONICAL/01_CANONICAL_DOCS/00_MasterPlan/"       --local-root canonical/docs/00_MasterPlan       --repo-root .       --output-dir docs/audits/can-002

## Tests

    python -m unittest -v tests/test_audit_masterplan_corpus.py
