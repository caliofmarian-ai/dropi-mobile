# DROPi Legal Source Corpus

This directory stores the evidence used to derive regulated product requirements. It supports legal review; it does not replace the law in force, a competent authority, or qualified legal advice.

The governing policy is `canonical/LEGAL_COMPLIANCE_SOURCE_OF_TRUTH.md`.

## Structure

| Path | Purpose |
|---|---|
| `legal-source-register.json` | Machine-readable provenance, integrity, scope, and reliance status for every source |
| `sources/<jurisdiction>/<domain>/` | Immutable official-source snapshots reviewed by DROPi |
| `source-notes/` | Retrieval limitations, discrepancies, and provenance notes |
| `LEGAL_REQUIREMENTS_TRACEABILITY.md` | Legal source → interpreted requirement → company/partner/product gate |
| `LEGAL_GAPS_AND_BLOCKERS.md` | Unresolved questions that block law-dependent design or enablement |

## Source handling rules

1. Prefer legislation portals, official gazettes, regulators, courts, and local-government sources.
2. Register the official URL, authority, citation, language, retrieval date, file path, SHA-256, and byte length.
3. Keep downloaded bytes unchanged. Do not reformat, optimize, translate, OCR, or overwrite an archived original.
4. Store a changed or refreshed source under a new dated/versioned filename and a new register entry.
5. Record official guidance separately from binding legislation. Reconcile contradictions with higher-ranking authority and qualified review.
6. Treat articles and news only as change alerts. Do not archive copyrighted copies without permission and never use them alone to enable a service.
7. Do not commit applicant identity files, licences, criminal records, medical data, signatures, contracts containing personal data, or production regulator submissions here.
8. If an official source cannot be obtained or its current applicability is uncertain, register it as pending and add a blocking gap.

## Naming

Use a stable uppercase identifier followed by an optional consolidation or retrieval date:

`<JURISDICTION>-<AUTHORITY_OR_TYPE>-<NUMBER_OR_TOPIC>-<YYYY-MM-DD>.<ext>`

Examples:

- `RO-OUG-49-2019.pdf`
- `EU-REG-2019-947-CONSOLIDATED-2025-05-01.pdf`
- `PH-CAAP-RPA-REGISTRATION-2026-09-12.html`

## Updating the corpus

1. Retrieve the current official source.
2. Add a new immutable file and registry record.
3. Run `pnpm legal:sources:validate`.
4. Compare the previous and current source and create an impact assessment.
5. Update traceability, blockers, jurisdiction packs, UX/technical requirements, and tests.
6. Obtain the approvals required by the canonical requirement lifecycle.
7. Enable only the exact approved company/service/vehicle/zone scope.

The validator checks repository integrity only. A passing validation does not mean that a source is current or that DROPi is legally authorized.
