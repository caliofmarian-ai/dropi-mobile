# CAN-005 audit artifacts

This directory contains the deterministic filename encoding audit of
every file entry in the authoritative `04.zip` archive.

## What is audited

- Unicode normalization form of each filename (NFC, NFD, NFC+NFD, other)
- Possible mojibake markers in filename bytes
- Control characters in filenames
- NFC normalization collisions (pairs of filenames that would become
  identical after NFC normalisation)

## Safety

- No archive content is rewritten.
- No file is extracted or renamed.
- Reports contain no timestamps.

## Regenerate

    python scripts/audit_canonical_filename_encoding.py \
      --archive 04.zip \
      --repo-root . \
      --output-dir docs/audits/can-005

## Tests

    python -m unittest -v tests/test_canonical_filename_encoding.py
