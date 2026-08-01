#!/usr/bin/env python3
"""Audit filename encoding across the authoritative 04.zip archive."""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import pathlib
import sys
import unicodedata
import zipfile
from typing import Any, Iterable

SCHEMA_VERSION = 1

AUTHORITATIVE_ARCHIVE_SHA256 = (
    "82a6015b8c968645307e36c8e4aa0351515f50333c08a6c5402a7819b7b747e5"
)

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


def nfc_collisions(
    entries: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Return groups of entries whose filenames collide after NFC normalisation."""
    groups: dict[str, list[str]] = collections.defaultdict(list)

    for entry in entries:
        nfc_path = unicodedata.normalize(
            "NFC", entry["archive_path"]
        )
        groups[nfc_path].append(entry["archive_path"])

    collision_groups: list[dict[str, Any]] = []

    for nfc_path, paths in sorted(groups.items()):
        if len(paths) > 1:
            collision_groups.append(
                {
                    "nfc_path": nfc_path,
                    "original_paths": sorted(paths),
                }
            )

    return collision_groups


def audit_archive(
    archive_path: pathlib.Path,
) -> list[dict[str, Any]]:
    """Return one record per non-directory entry in the archive."""
    rows: list[dict[str, Any]] = []

    with zipfile.ZipFile(archive_path, "r") as archive:
        for archive_index, info in enumerate(
            sorted(
                archive.infolist(),
                key=lambda i: i.filename,
            )
        ):
            if info.is_dir():
                continue

            path = info.filename
            anomalies = encoding_anomalies(path)
            form = unicode_form(path)
            nfc_path = unicodedata.normalize("NFC", path)

            rows.append(
                {
                    "archive_index": archive_index,
                    "archive_path": path,
                    "filename": pathlib.PurePosixPath(path).name,
                    "unicode_form": form,
                    "nfc_path": nfc_path,
                    "path_changed_by_nfc": path != nfc_path,
                    "compressed_size": info.compress_size,
                    "uncompressed_size": info.file_size,
                    "crc32": f"{info.CRC:08x}",
                    "encoding_anomalies": anomalies,
                    "has_anomaly": bool(anomalies),
                }
            )

    return rows


def build_report(
    archive_path: pathlib.Path,
    repo_root: pathlib.Path,
) -> dict[str, Any]:
    archive_path = archive_path.resolve()
    repo_root = repo_root.resolve()

    entries = audit_archive(archive_path)

    anomaly_entries = sorted(
        [row for row in entries if row["has_anomaly"]],
        key=lambda row: row["archive_path"],
    )

    clean_entries = sorted(
        [row for row in entries if not row["has_anomaly"]],
        key=lambda row: row["archive_path"],
    )

    form_counts: dict[str, int] = dict(
        sorted(
            collections.Counter(
                row["unicode_form"] for row in entries
            ).items()
        )
    )

    anomaly_type_counts: dict[str, int] = dict(
        sorted(
            collections.Counter(
                anomaly
                for row in entries
                for anomaly in row["encoding_anomalies"]
            ).items()
        )
    )

    collision_groups = nfc_collisions(entries)

    entries_with_anomaly_paths = sorted(
        [row["archive_path"] for row in anomaly_entries]
    )

    return {
        "schema_version": SCHEMA_VERSION,
        "authority": {
            "archive_path": archive_path.relative_to(
                repo_root
            ).as_posix(),
            "archive_sha256": sha256_file(archive_path),
        },
        "summary": {
            "total_file_count": len(entries),
            "anomaly_file_count": len(anomaly_entries),
            "clean_file_count": len(clean_entries),
            "nfc_collision_group_count": len(collision_groups),
            "unicode_form_counts": form_counts,
            "anomaly_type_counts": anomaly_type_counts,
        },
        "anomaly_paths": entries_with_anomaly_paths,
        "nfc_collision_groups": collision_groups,
        "anomaly_entries": anomaly_entries,
        "clean_entries": clean_entries,
    }


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


def markdown_text(report: dict[str, Any]) -> str:
    authority = report["authority"]
    summary = report["summary"]

    lines = [
        "# CAN-005 — Canonical Filename Encoding Audit",
        "",
        "## Authority",
        "",
        f"- Archive: `{authority['archive_path']}`",
        f"- SHA-256: `{authority['archive_sha256']}`",
        "",
        "Filenames were read without modification.",
        "No archive content was rewritten.",
        "No files were extracted or renamed.",
        "",
        "## Summary",
        "",
        f"- Total file entries: {summary['total_file_count']}",
        f"- Files with encoding anomalies: {summary['anomaly_file_count']}",
        f"- Clean files: {summary['clean_file_count']}",
        f"- NFC collision groups: {summary['nfc_collision_group_count']}",
        "",
        "## Unicode normalization form counts",
        "",
        "| Form | Count |",
        "|---|---:|",
    ]

    for form, count in sorted(
        summary["unicode_form_counts"].items()
    ):
        lines.append(f"| {form} | {count} |")

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
            "## NFC collision groups",
            "",
        ]
    )

    if report["nfc_collision_groups"]:
        for group in report["nfc_collision_groups"]:
            lines.append(f"- NFC path: `{group['nfc_path']}`")

            for path in group["original_paths"]:
                lines.append(f"  - `{path}`")
    else:
        lines.append("None.")

    lines.extend(
        [
            "",
            "## Files with encoding anomalies",
            "",
        ]
    )

    if report["anomaly_entries"]:
        lines.extend(
            [
                "| Archive path | Unicode form | Anomalies |",
                "|---|---|---|",
            ]
        )

        for row in report["anomaly_entries"]:
            archive_path = row["archive_path"].replace(
                "|", "\\|"
            )
            anomalies = ", ".join(row["encoding_anomalies"])
            lines.append(
                f"| `{archive_path}` | {row['unicode_form']} | {anomalies} |"
            )
    else:
        lines.append("None.")

    return "\n".join(lines) + "\n"


def readme_text() -> str:
    return """# CAN-005 audit artifacts

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

    python scripts/audit_canonical_filename_encoding.py \\
      --archive 04.zip \\
      --repo-root . \\
      --output-dir docs/audits/can-005

## Tests

    python -m unittest -v tests/test_canonical_filename_encoding.py
"""


def write_outputs(
    report: dict[str, Any],
    output_dir: pathlib.Path,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    (output_dir / "filename_encoding_report.json").write_bytes(
        json_bytes(report)
    )

    (output_dir / "filename_encoding_report.md").write_text(
        markdown_text(report),
        encoding="utf-8",
        newline="\n",
    )

    (output_dir / "README.md").write_text(
        readme_text(),
        encoding="utf-8",
        newline="\n",
    )


def parse_args(
    argv: Iterable[str] | None = None,
) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Audit filename encoding in the authoritative 04.zip archive."
    )

    parser.add_argument("--archive", default="04.zip")
    parser.add_argument("--repo-root", default=".")
    parser.add_argument(
        "--output-dir",
        default="docs/audits/can-005",
    )
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

    archive_path = pathlib.Path(args.archive).resolve()
    repo_root = pathlib.Path(args.repo_root).resolve()
    output_dir = pathlib.Path(args.output_dir).resolve()

    if not archive_path.is_file():
        raise FileNotFoundError(
            f"archive does not exist: {archive_path}"
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
    )

    write_outputs(report, output_dir)

    archive_hash_after = sha256_file(archive_path)

    if archive_hash_after != archive_hash_before:
        raise RuntimeError(
            "archive bytes changed during filename encoding audit"
        )

    summary = report["summary"]

    print(f"Total file entries: {summary['total_file_count']}")
    print(
        f"Files with anomalies: {summary['anomaly_file_count']}"
    )
    print(f"Clean files: {summary['clean_file_count']}")
    print(
        f"NFC collision groups: {summary['nfc_collision_group_count']}"
    )

    return 0


if __name__ == "__main__":
    sys.exit(main())
