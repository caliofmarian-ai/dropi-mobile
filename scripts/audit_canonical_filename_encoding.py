#!/usr/bin/env python3
"""
CAN-005 — Canonical Filename Encoding Inventory.

Audits filename encoding across all canonical scopes by consuming:
  docs/audits/can-001/04_zip_inventory.json
  docs/audits/can-002/masterplan_comparison.json
  docs/audits/can-003/zip_markdown_inventory.json
  docs/audits/can-004/canonical_authority_matrix.json

Scopes audited:
  - exact historical names inside immutable 04.zip (CAN-001)
  - mapped extracted names in canonical/docs/00_MasterPlan/ (CAN-002)
  - Markdown counterparts identified by CAN-003
  - files in DROPi_Canonical_Reference/, when present

For every anomalous or path-variant record the inventory includes:
  original_archive_name, extracted_repository_name, mapping_relation,
  detected_encoding_anomalies, readable_proposed_display_name,
  affected_references, risk_assessment,
  historical_bytes_modified (always false), historical_name_modified (always false).

No archive content, extracted file, or canonical document is modified.
No file is renamed. Reports contain no timestamps.
"""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import pathlib
import posixpath
import sys
import unicodedata
import zipfile
from typing import Any, Iterable

SCHEMA_VERSION = 1

AUTHORITATIVE_ARCHIVE_SHA256 = (
    "82a6015b8c968645307e36c8e4aa0351515f50333c08a6c5402a7819b7b747e5"
)

DEFAULT_CAN001 = "docs/audits/can-001/04_zip_inventory.json"
DEFAULT_CAN002 = "docs/audits/can-002/masterplan_comparison.json"
DEFAULT_CAN003 = "docs/audits/can-003/zip_markdown_inventory.json"
DEFAULT_CAN004 = "docs/audits/can-004/canonical_authority_matrix.json"

MOJIBAKE_MARKERS = (
    "\ufffd",
    "Ã",
    "Â",
    "â€",
    "â€™",
    "â€œ",
    "â€\x9d",
    "ðŸ",
    "╬",
    "├",
    "┼",
    "¤",
    "тА",
    "╤В",
)

EXCLUDED_DIR_NAMES: frozenset[str] = frozenset(
    [
        ".git",
        "node_modules",
        "__pycache__",
        ".cache",
        "coverage",
        "dist",
        "build",
    ]
)

REFERENCE_TEXT_EXTENSIONS: frozenset[str] = frozenset(
    [
        ".md",
        ".json",
        ".txt",
        ".py",
        ".ts",
        ".tsx",
        ".js",
        ".jsx",
        ".sh",
        ".yml",
        ".yaml",
    ]
)


# ---------------------------------------------------------------------------
# Low-level helpers
# ---------------------------------------------------------------------------


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()

    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()


def unicode_form(text: str) -> str:
    """Return the Unicode normalization form name for *text*."""
    is_nfc = unicodedata.normalize("NFC", text) == text
    is_nfd = unicodedata.normalize("NFD", text) == text

    if is_nfc and is_nfd:
        return "NFC+NFD"

    if is_nfc:
        return "NFC"

    if is_nfd:
        return "NFD"

    return "other"


def encoding_anomalies(path: str) -> list[str]:
    """Return a sorted list of encoding anomaly labels for *path*."""
    anomalies: list[str] = []

    if unicodedata.normalize("NFC", path) != path:
        anomalies.append("path-not-nfc")

    if any(marker in path for marker in MOJIBAKE_MARKERS):
        anomalies.append("possible-mojibake")

    if any(ord(character) < 32 for character in path):
        anomalies.append("control-character")

    return sorted(set(anomalies))


def _normalize_external_anomalies(
    anomalies: list[str],
) -> list[str]:
    """Normalise anomaly labels from prior CAN audit files.

    CAN-001 and CAN-003 use ``possible-mojibake-marker``; this generator
    uses ``possible-mojibake``.  Normalise so all records are consistent.
    """
    return sorted(
        set(
            "possible-mojibake"
            if label == "possible-mojibake-marker"
            else label
            for label in anomalies
        )
    )


# ---------------------------------------------------------------------------
# Text-file reference index (built BEFORE writing output files)
# ---------------------------------------------------------------------------


def _is_excluded(
    resolved: pathlib.Path,
    excluded_dirs: tuple[pathlib.Path, ...],
) -> bool:
    """Return True if *resolved* should be excluded from reference scanning."""
    for excluded in excluded_dirs:
        try:
            resolved.relative_to(excluded)
            return True
        except ValueError:
            pass

    return any(part in EXCLUDED_DIR_NAMES for part in resolved.parts)


def build_text_index(
    repo_root: pathlib.Path,
    output_dir: pathlib.Path,
) -> dict[str, str]:
    """Return {relative_path: content} for every text file to scan.

    The output directory is excluded by resolved path to prevent freshly
    written reports from appearing in subsequent affected-reference lists.
    The canonical CAN-005 output directory is always excluded regardless of
    where --output-dir points, so that checked-in reports do not appear as
    affected references in a fresh regeneration.  This is the key fix for the
    determinism defect described in CAN-005.
    """
    # Always exclude the canonical CAN-005 output directory so that any
    # previously checked-in reports do not pollute the reference index.
    canonical_can005_dir = (repo_root / "docs" / "audits" / "can-005").resolve()
    excluded_dirs: tuple[pathlib.Path, ...] = (
        output_dir.resolve(),
        canonical_can005_dir,
    )
    result: dict[str, str] = {}

    for f in sorted(repo_root.rglob("*")):
        if not f.is_file():
            continue

        if f.suffix.lower() not in REFERENCE_TEXT_EXTENSIONS:
            continue

        if _is_excluded(f.resolve(), excluded_dirs):
            continue

        rel = f.relative_to(repo_root).as_posix()

        try:
            content = f.read_text(encoding="utf-8", errors="replace")
            result[rel] = content
        except OSError:
            pass

    return result


def find_affected_references(
    search_term: str,
    text_index: dict[str, str],
) -> list[str]:
    """Return sorted list of index keys whose content contains *search_term*."""
    return sorted(
        rel
        for rel, content in text_index.items()
        if search_term in content
    )


# ---------------------------------------------------------------------------
# Risk assessment
# ---------------------------------------------------------------------------


def _risk_level(
    has_mojibake: bool,
    names_differ: bool,
    has_any_detected: bool,
) -> str:
    if not has_any_detected:
        return "none"

    if has_mojibake and names_differ:
        return "high"

    if has_mojibake or names_differ:
        return "medium"

    return "low"


def build_risk_assessment(
    archive_anomalies: list[str],
    names_differ: bool,
    ref_count: int,
    detected_anomalies: list[str],
) -> dict[str, Any]:
    has_mojibake = "possible-mojibake" in archive_anomalies
    has_any_detected = bool(detected_anomalies)

    return {
        "level": _risk_level(has_mojibake, names_differ, has_any_detected),
        "has_mojibake_in_archive_name": has_mojibake,
        "archive_and_extracted_names_differ": names_differ,
        "affected_reference_count": ref_count,
    }


# ---------------------------------------------------------------------------
# NFC collision detection across proposed display names
# ---------------------------------------------------------------------------


def compute_nfc_collision_groups(
    records: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Return collision groups where different proposed names share a NFC casefold."""
    key_to_names: dict[str, list[str]] = collections.defaultdict(list)

    for record in records:
        proposed = record.get("readable_proposed_display_name")

        if proposed:
            key = unicodedata.normalize("NFC", proposed).casefold()
            key_to_names[key].append(proposed)

    groups: list[dict[str, Any]] = []

    for key, names in sorted(key_to_names.items()):
        unique = sorted(set(names))

        if len(unique) > 1:
            groups.append(
                {
                    "collision_key": key,
                    "proposed_names": unique,
                }
            )

    return groups


# ---------------------------------------------------------------------------
# Inventory builders
# ---------------------------------------------------------------------------


def _build_can002_records(
    can002: dict[str, Any],
    can001_by_path: dict[str, Any],
    text_index: dict[str, str],
) -> list[dict[str, Any]]:
    """Build inventory records from CAN-002 path encoding variants."""
    records: list[dict[str, Any]] = []

    for mapping in sorted(
        can002["mappings"],
        key=lambda m: m["archive"]["archive_path"],
    ):
        if (
            mapping["classification"]
            != "content_identical_path_encoding_variant"
        ):
            continue

        archive_path: str = mapping["archive"]["archive_path"]
        local_path: str = mapping["local"]["repository_path"]

        can001_entry = can001_by_path.get(archive_path)
        archive_anomaly_list: list[str] = _normalize_external_anomalies(
            can001_entry.get("encoding_anomalies", [])
            if can001_entry is not None
            else encoding_anomalies(archive_path)
        )

        detected = sorted(
            set(archive_anomaly_list + ["path-name-mismatch"])
        )

        archive_basename = posixpath.basename(archive_path)
        refs = find_affected_references(archive_basename, text_index)
        proposed = unicodedata.normalize("NFC", archive_path)

        records.append(
            {
                "scope": "docx_masterplan",
                "original_archive_name": archive_path,
                "extracted_repository_name": local_path,
                "mapping_relation": "content_identical_path_encoding_variant",
                "detected_encoding_anomalies": detected,
                "readable_proposed_display_name": proposed,
                "affected_references": refs,
                "risk_assessment": build_risk_assessment(
                    archive_anomaly_list,
                    names_differ=True,
                    ref_count=len(refs),
                    detected_anomalies=detected,
                ),
                "historical_bytes_modified": False,
                "historical_name_modified": False,
            }
        )

    return records


def _build_can003_records(
    can003: dict[str, Any],
    text_index: dict[str, str],
) -> list[dict[str, Any]]:
    """Build inventory records from CAN-003 Markdown mappings."""
    records: list[dict[str, Any]] = []

    for mapping in sorted(
        can003["mappings"],
        key=lambda m: m["archive"]["archive_path"],
    ):
        archive = mapping["archive"]
        repo = mapping["repository"]
        classification = mapping["classification"]

        archive_path: str = archive["archive_path"]
        local_path: str | None = (
            repo["repository_path"] if repo is not None else None
        )

        archive_anomaly_list: list[str] = _normalize_external_anomalies(
            archive.get("encoding_anomalies", [])
        )

        names_differ = local_path is not None and (
            archive_path != local_path
        )

        detected = sorted(
            set(
                archive_anomaly_list
                + (["path-name-mismatch"] if names_differ else [])
            )
        )

        archive_basename = posixpath.basename(archive_path)
        refs = find_affected_references(archive_basename, text_index)
        proposed = unicodedata.normalize("NFC", archive_path)

        records.append(
            {
                "scope": "markdown_corpus",
                "original_archive_name": archive_path,
                "extracted_repository_name": local_path,
                "mapping_relation": classification,
                "detected_encoding_anomalies": detected,
                "readable_proposed_display_name": proposed,
                "affected_references": refs,
                "risk_assessment": build_risk_assessment(
                    archive_anomaly_list,
                    names_differ=names_differ,
                    ref_count=len(refs),
                    detected_anomalies=detected,
                ),
                "historical_bytes_modified": False,
                "historical_name_modified": False,
            }
        )

    return records


def _build_dcr_records(
    repo_root: pathlib.Path,
    can003_recovered: set[str],
    can002_by_local_basename: dict[str, Any],
    text_index: dict[str, str],
) -> list[dict[str, Any]]:
    """Build inventory records for DROPi_Canonical_Reference anomaly files."""
    dcr_root = repo_root / "DROPi_Canonical_Reference"

    if not dcr_root.is_dir():
        return []

    records: list[dict[str, Any]] = []

    for f in sorted(dcr_root.rglob("*")):
        if not f.is_file():
            continue

        rel = f.relative_to(repo_root).as_posix()

        if rel in can003_recovered:
            continue

        file_anomalies = encoding_anomalies(rel)

        if not file_anomalies:
            continue

        dcr_basename = f.name
        can002_mapping = can002_by_local_basename.get(dcr_basename)

        archive_path: str | None = (
            can002_mapping["archive"]["archive_path"]
            if can002_mapping is not None
            else None
        )

        archive_anomaly_list: list[str] = []

        if archive_path is not None:
            archive_anomaly_list = encoding_anomalies(archive_path)

        names_differ = archive_path is not None and (
            archive_path != rel
        )

        detected = sorted(
            set(
                file_anomalies
                + archive_anomaly_list
                + (["path-name-mismatch"] if names_differ else [])
            )
        )

        search_term = posixpath.basename(rel)
        refs = find_affected_references(search_term, text_index)
        proposed = unicodedata.normalize("NFC", rel)

        records.append(
            {
                "scope": "derived_reference",
                "original_archive_name": archive_path,
                "extracted_repository_name": rel,
                "mapping_relation": (
                    "derived_reference_copy"
                    if archive_path is not None
                    else "derived_reference_no_archive_mapping"
                ),
                "detected_encoding_anomalies": detected,
                "readable_proposed_display_name": proposed,
                "affected_references": refs,
                "risk_assessment": build_risk_assessment(
                    archive_anomaly_list or file_anomalies,
                    names_differ=names_differ,
                    ref_count=len(refs),
                    detected_anomalies=detected,
                ),
                "historical_bytes_modified": False,
                "historical_name_modified": False,
            }
        )

    return records


# ---------------------------------------------------------------------------
# Main report builder
# ---------------------------------------------------------------------------


def build_report(
    archive_path: pathlib.Path,
    repo_root: pathlib.Path,
    output_dir: pathlib.Path,
    can001_path: pathlib.Path,
    can002_path: pathlib.Path,
    can003_path: pathlib.Path,
    can004_path: pathlib.Path,
) -> dict[str, Any]:
    archive_path = archive_path.resolve()
    repo_root = repo_root.resolve()
    output_dir = output_dir.resolve()

    # --- Load input audits ---
    can001: dict[str, Any] = json.loads(
        can001_path.read_text(encoding="utf-8")
    )
    can002: dict[str, Any] = json.loads(
        can002_path.read_text(encoding="utf-8")
    )
    can003: dict[str, Any] = json.loads(
        can003_path.read_text(encoding="utf-8")
    )
    can004: dict[str, Any] = json.loads(
        can004_path.read_text(encoding="utf-8")
    )

    # --- Derive lookups ---
    can001_by_path: dict[str, Any] = {
        entry["path"]: entry for entry in can001["entries"]
    }

    can002_by_local_basename: dict[str, Any] = {
        posixpath.basename(m["local"]["repository_path"]): m
        for m in can002["mappings"]
    }

    can003_recovered: set[str] = set(
        can003.get("recovered_repository_paths", [])
    )

    # --- Build text-file reference index (excludes output_dir) ---
    text_index = build_text_index(repo_root, output_dir)

    # --- Build inventory records ---
    records: list[dict[str, Any]] = []

    records.extend(
        _build_can002_records(can001_by_path=can001_by_path, can002=can002, text_index=text_index)
    )

    records.extend(
        _build_can003_records(can003=can003, text_index=text_index)
    )

    records.extend(
        _build_dcr_records(
            repo_root=repo_root,
            can003_recovered=can003_recovered,
            can002_by_local_basename=can002_by_local_basename,
            text_index=text_index,
        )
    )

    # Sort deterministically
    records.sort(
        key=lambda r: (
            r["original_archive_name"] or "",
            r["extracted_repository_name"] or "",
            r["scope"],
        )
    )

    # --- Aggregate statistics ---
    collision_groups = compute_nfc_collision_groups(records)

    risk_counts: dict[str, int] = dict(
        sorted(
            collections.Counter(
                r["risk_assessment"]["level"] for r in records
            ).items()
        )
    )

    anomaly_type_counts: dict[str, int] = dict(
        sorted(
            collections.Counter(
                a
                for r in records
                for a in r["detected_encoding_anomalies"]
            ).items()
        )
    )

    scope_counts: dict[str, int] = dict(
        sorted(
            collections.Counter(r["scope"] for r in records).items()
        )
    )

    mojibake_count = sum(
        1
        for r in records
        if r["risk_assessment"]["has_mojibake_in_archive_name"]
    )

    path_mismatch_count = sum(
        1
        for r in records
        if r["risk_assessment"]["archive_and_extracted_names_differ"]
    )

    archive_entry_count: int = can001["archive"]["entry_count"]
    archive_file_count: int = can001["archive"]["file_count"]

    return {
        "schema_version": SCHEMA_VERSION,
        "authority": {
            "archive_path": archive_path.relative_to(
                repo_root
            ).as_posix(),
            "archive_sha256": sha256_file(archive_path),
            "archive_entry_count": archive_entry_count,
            "input_audit_paths": {
                "can_001": can001_path.relative_to(repo_root).as_posix(),
                "can_002": can002_path.relative_to(repo_root).as_posix(),
                "can_003": can003_path.relative_to(repo_root).as_posix(),
                "can_004": can004_path.relative_to(repo_root).as_posix(),
            },
        },
        "summary": {
            "archive_entry_count": archive_entry_count,
            "archive_file_count": archive_file_count,
            "inventory_record_count": len(records),
            "mojibake_record_count": mojibake_count,
            "path_mismatch_record_count": path_mismatch_count,
            "nfc_collision_group_count": len(collision_groups),
            "risk_counts": risk_counts,
            "anomaly_type_counts": anomaly_type_counts,
            "scope_counts": scope_counts,
        },
        "nfc_collision_groups": collision_groups,
        "inventory": records,
    }


# ---------------------------------------------------------------------------
# Output serialisers
# ---------------------------------------------------------------------------


def json_bytes(report: dict[str, Any]) -> bytes:
    return (
        json.dumps(
            report,
            ensure_ascii=False,
            indent=2,
            sort_keys=True,
        )
        + "\n"
    ).encode("utf-8")


def _md_escape(text: str) -> str:
    return text.replace("|", "\\|")


def markdown_text(report: dict[str, Any]) -> str:
    authority = report["authority"]
    summary = report["summary"]

    lines = [
        "# CAN-005 — Canonical Filename Encoding Inventory",
        "",
        "## Authority",
        "",
        f"- Archive: `{authority['archive_path']}`",
        f"- SHA-256: `{authority['archive_sha256']}`",
        f"- Archive entry count: {authority['archive_entry_count']}",
        "",
        "## Input audits",
        "",
    ]

    for key, path in sorted(
        authority["input_audit_paths"].items()
    ):
        lines.append(f"- `{key}`: `{path}`")

    lines.extend(
        [
            "",
            "No archive content, extracted file, or canonical document was",
            "modified. No file was renamed. Reports contain no timestamps.",
            "",
            "## Summary",
            "",
            f"- Archive total entries: {summary['archive_entry_count']}",
            f"- Archive file entries: {summary['archive_file_count']}",
            f"- Inventory records: {summary['inventory_record_count']}",
            f"- Records with mojibake in archive name: {summary['mojibake_record_count']}",
            f"- Records with archive/extracted name mismatch: {summary['path_mismatch_record_count']}",
            f"- NFC collision groups: {summary['nfc_collision_group_count']}",
            "",
            "## Risk level counts",
            "",
            "| Level | Count |",
            "|---|---:|",
        ]
    )

    for level, count in sorted(summary["risk_counts"].items()):
        lines.append(f"| {level} | {count} |")

    lines.extend(
        [
            "",
            "## Anomaly type counts",
            "",
            "| Anomaly type | Count |",
            "|---|---:|",
        ]
    )

    for anomaly_type, count in sorted(
        summary["anomaly_type_counts"].items()
    ):
        lines.append(f"| {anomaly_type} | {count} |")

    lines.extend(
        [
            "",
            "## Scope counts",
            "",
            "| Scope | Count |",
            "|---|---:|",
        ]
    )

    for scope, count in sorted(summary["scope_counts"].items()):
        lines.append(f"| {scope} | {count} |")

    lines.extend(
        [
            "",
            "## NFC collision groups",
            "",
        ]
    )

    if report["nfc_collision_groups"]:
        for group in report["nfc_collision_groups"]:
            lines.append(
                f"- Collision key: `{_md_escape(group['collision_key'])}`"
            )

            for name in group["proposed_names"]:
                lines.append(f"  - `{_md_escape(name)}`")
    else:
        lines.append("None.")

    lines.extend(
        [
            "",
            "## Inventory",
            "",
            "| Scope | Original archive name | Extracted repository name |"
            " Mapping relation | Risk | Anomalies |",
            "|---|---|---|---|---|---|",
        ]
    )

    for row in report["inventory"]:
        archive = _md_escape(row["original_archive_name"] or "")
        extracted = _md_escape(row["extracted_repository_name"] or "")
        relation = row["mapping_relation"]
        risk = row["risk_assessment"]["level"]
        anomalies = ", ".join(row["detected_encoding_anomalies"])

        lines.append(
            f"| {row['scope']} | `{archive}` | `{extracted}` |"
            f" {relation} | {risk} | {anomalies} |"
        )

    return "\n".join(lines) + "\n"


def readme_text() -> str:
    return """# CAN-005 audit artifacts

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

    python scripts/audit_canonical_filename_encoding.py \\
      --archive 04.zip \\
      --repo-root . \\
      --output-dir docs/audits/can-005

## Tests

    python -m unittest -v tests/test_canonical_filename_encoding.py
"""


# ---------------------------------------------------------------------------
# File output
# ---------------------------------------------------------------------------


def write_outputs(
    report: dict[str, Any],
    output_dir: pathlib.Path,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    (
        output_dir / "canonical_filename_encoding_inventory.json"
    ).write_bytes(json_bytes(report))

    (
        output_dir / "canonical_filename_encoding_inventory.md"
    ).write_text(
        markdown_text(report),
        encoding="utf-8",
        newline="\n",
    )

    (output_dir / "README.md").write_text(
        readme_text(),
        encoding="utf-8",
        newline="\n",
    )


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def parse_args(
    argv: Iterable[str] | None = None,
) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "CAN-005 — Canonical Filename Encoding Inventory."
        )
    )

    parser.add_argument("--archive", default="04.zip")
    parser.add_argument("--repo-root", default=".")
    parser.add_argument(
        "--output-dir",
        default="docs/audits/can-005",
    )
    parser.add_argument("--can-001", default=None)
    parser.add_argument("--can-002", default=None)
    parser.add_argument("--can-003", default=None)
    parser.add_argument("--can-004", default=None)
    parser.add_argument(
        "--expected-archive-sha256",
        default=AUTHORITATIVE_ARCHIVE_SHA256,
    )
    parser.add_argument(
        "--allow-other-archive-hash",
        action="store_true",
    )

    return parser.parse_args(argv)


def main(
    argv: Iterable[str] | None = None,
) -> int:
    args = parse_args(argv)

    repo_root = pathlib.Path(args.repo_root).resolve()
    archive_path = (
        pathlib.Path(args.archive).resolve()
        if pathlib.Path(args.archive).is_absolute()
        else (repo_root / args.archive).resolve()
    )
    output_dir = (
        pathlib.Path(args.output_dir).resolve()
        if pathlib.Path(args.output_dir).is_absolute()
        else (repo_root / args.output_dir).resolve()
    )

    def _resolve_input(arg: str | None, default: str) -> pathlib.Path:
        if arg is not None:
            p = pathlib.Path(arg)
            return p.resolve() if p.is_absolute() else (repo_root / p).resolve()
        return (repo_root / default).resolve()

    can001_path = _resolve_input(args.can_001, DEFAULT_CAN001)
    can002_path = _resolve_input(args.can_002, DEFAULT_CAN002)
    can003_path = _resolve_input(args.can_003, DEFAULT_CAN003)
    can004_path = _resolve_input(args.can_004, DEFAULT_CAN004)

    if not archive_path.is_file():
        raise FileNotFoundError(
            f"archive does not exist: {archive_path}"
        )

    for name, path in [
        ("CAN-001", can001_path),
        ("CAN-002", can002_path),
        ("CAN-003", can003_path),
        ("CAN-004", can004_path),
    ]:
        if not path.is_file():
            raise FileNotFoundError(
                f"{name} input not found: {path}"
            )

    archive_hash_before = sha256_file(archive_path)

    if (
        not args.allow_other_archive_hash
        and archive_hash_before != args.expected_archive_sha256
    ):
        raise ValueError(
            "authoritative archive SHA-256 mismatch: "
            f"expected {args.expected_archive_sha256}, "
            f"found {archive_hash_before}"
        )

    report = build_report(
        archive_path=archive_path,
        repo_root=repo_root,
        output_dir=output_dir,
        can001_path=can001_path,
        can002_path=can002_path,
        can003_path=can003_path,
        can004_path=can004_path,
    )

    write_outputs(report, output_dir)

    archive_hash_after = sha256_file(archive_path)

    if archive_hash_after != archive_hash_before:
        raise RuntimeError(
            "archive bytes changed during CAN-005 generation"
        )

    summary = report["summary"]

    print(
        f"Archive entries: {summary['archive_entry_count']}"
    )
    print(
        f"Inventory records: {summary['inventory_record_count']}"
    )
    print(
        f"Mojibake records: {summary['mojibake_record_count']}"
    )
    print(
        f"Path-mismatch records: {summary['path_mismatch_record_count']}"
    )
    print(
        f"NFC collision groups: {summary['nfc_collision_group_count']}"
    )
    print(f"Risk counts: {summary['risk_counts']}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
