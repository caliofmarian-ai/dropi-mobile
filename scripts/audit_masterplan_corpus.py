#!/usr/bin/env python3
"""Map extracted MasterPlan DOCX files to authoritative 04.zip sources."""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import pathlib
import sys
import zipfile
from typing import Any, Iterable

SCHEMA_VERSION = 2

AUTHORITATIVE_ARCHIVE_SHA256 = (
    "82a6015b8c968645307e36c8e4aa0351515f50333c08a6c5402a7819b7b747e5"
)

DEFAULT_ARCHIVE_PREFIX = (
    "04/DROPI_CANONICAL/01_CANONICAL_DOCS/00_MasterPlan/"
)

DEFAULT_LOCAL_ROOT = "canonical/docs/00_MasterPlan"


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()

    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()


def sha256_stream(stream: Any) -> str:
    digest = hashlib.sha256()

    for chunk in iter(lambda: stream.read(1024 * 1024), b""):
        digest.update(chunk)

    return digest.hexdigest()


def archive_docx_entries(
    archive_path: pathlib.Path,
    archive_prefix: str,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    with zipfile.ZipFile(archive_path, "r") as archive:
        for archive_index, info in enumerate(archive.infolist()):
            if info.is_dir():
                continue

            if not info.filename.startswith(archive_prefix):
                continue

            relative_path = info.filename[len(archive_prefix):]

            if not relative_path:
                continue

            if pathlib.PurePosixPath(relative_path).suffix.casefold() != ".docx":
                continue

            digest: str | None = None
            read_error: str | None = None

            try:
                with archive.open(info, "r") as stream:
                    digest = sha256_stream(stream)
            except Exception as error:
                read_error = f"{type(error).__name__}: {error}"

            rows.append(
                {
                    "archive_index": archive_index,
                    "archive_path": info.filename,
                    "relative_path": relative_path,
                    "filename": pathlib.PurePosixPath(relative_path).name,
                    "compressed_size": info.compress_size,
                    "uncompressed_size": info.file_size,
                    "crc32": f"{info.CRC:08x}",
                    "sha256": digest,
                    "readable": read_error is None,
                    "read_error": read_error,
                }
            )

    return rows


def local_docx_entries(
    local_root: pathlib.Path,
    repo_root: pathlib.Path,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    paths = sorted(
        (
            path
            for path in local_root.rglob("*")
            if path.is_file() and path.suffix.casefold() == ".docx"
        ),
        key=lambda path: path.relative_to(local_root).as_posix(),
    )

    for path in paths:
        rows.append(
            {
                "repository_path": path.relative_to(repo_root).as_posix(),
                "relative_path": path.relative_to(local_root).as_posix(),
                "filename": path.name,
                "size": path.stat().st_size,
                "sha256": sha256_file(path),
            }
        )

    return rows


def group_indexes_by_hash(
    rows: list[dict[str, Any]],
) -> dict[str, list[int]]:
    result: dict[str, list[int]] = collections.defaultdict(list)

    for index, row in enumerate(rows):
        digest = row.get("sha256")

        if digest:
            result[digest].append(index)

    return dict(sorted(result.items()))


def duplicate_relative_paths(
    rows: list[dict[str, Any]],
) -> list[str]:
    counts = collections.Counter(row["relative_path"] for row in rows)

    return sorted(
        path
        for path, count in counts.items()
        if count > 1
    )


def compare_corpus(
    archive_path: pathlib.Path,
    archive_prefix: str,
    local_root: pathlib.Path,
    repo_root: pathlib.Path,
) -> dict[str, Any]:
    archive_path = archive_path.resolve()
    local_root = local_root.resolve()
    repo_root = repo_root.resolve()

    archive_rows = archive_docx_entries(
        archive_path,
        archive_prefix,
    )

    local_rows = local_docx_entries(
        local_root,
        repo_root,
    )

    archive_path_indexes = {
        row["relative_path"]: index
        for index, row in enumerate(archive_rows)
    }

    local_path_indexes = {
        row["relative_path"]: index
        for index, row in enumerate(local_rows)
    }

    archive_hash_indexes = group_indexes_by_hash(archive_rows)
    local_hash_indexes = group_indexes_by_hash(local_rows)

    mapped_archive_indexes: set[int] = set()
    mapped_local_indexes: set[int] = set()
    mappings: list[dict[str, Any]] = []

    common_paths = sorted(
        set(archive_path_indexes) & set(local_path_indexes)
    )

    for relative_path in common_paths:
        archive_index = archive_path_indexes[relative_path]
        local_index = local_path_indexes[relative_path]

        archive_row = archive_rows[archive_index]
        local_row = local_rows[local_index]

        mapped_archive_indexes.add(archive_index)
        mapped_local_indexes.add(local_index)

        if (
            archive_row["readable"]
            and archive_row["sha256"] == local_row["sha256"]
        ):
            classification = "exact_path_and_content_match"
        else:
            classification = "same_path_divergent_content"

        mappings.append(
            {
                "classification": classification,
                "mapping_basis": "exact_relative_path",
                "archive": archive_row,
                "local": local_row,
            }
        )

    common_hashes = sorted(
        set(archive_hash_indexes) & set(local_hash_indexes)
    )

    ambiguous_hashes: list[dict[str, Any]] = []

    for digest in common_hashes:
        remaining_archive_indexes = [
            index
            for index in archive_hash_indexes[digest]
            if index not in mapped_archive_indexes
        ]

        remaining_local_indexes = [
            index
            for index in local_hash_indexes[digest]
            if index not in mapped_local_indexes
        ]

        if not remaining_archive_indexes and not remaining_local_indexes:
            continue

        if (
            len(remaining_archive_indexes) == 1
            and len(remaining_local_indexes) == 1
        ):
            archive_index = remaining_archive_indexes[0]
            local_index = remaining_local_indexes[0]

            mapped_archive_indexes.add(archive_index)
            mapped_local_indexes.add(local_index)

            mappings.append(
                {
                    "classification": (
                        "content_identical_path_encoding_variant"
                    ),
                    "mapping_basis": "unique_sha256",
                    "archive": archive_rows[archive_index],
                    "local": local_rows[local_index],
                }
            )
            continue

        if remaining_archive_indexes or remaining_local_indexes:
            ambiguous_hashes.append(
                {
                    "sha256": digest,
                    "archive_relative_paths": [
                        archive_rows[index]["relative_path"]
                        for index in remaining_archive_indexes
                    ],
                    "local_relative_paths": [
                        local_rows[index]["relative_path"]
                        for index in remaining_local_indexes
                    ],
                }
            )

    missing_archive_sources = [
        archive_rows[index]
        for index in range(len(archive_rows))
        if index not in mapped_archive_indexes
    ]

    additional_local_files = [
        local_rows[index]
        for index in range(len(local_rows))
        if index not in mapped_local_indexes
    ]

    mappings.sort(
        key=lambda row: (
            row["archive"]["relative_path"],
            row["local"]["relative_path"],
            row["classification"],
        )
    )

    classification_counts = collections.Counter(
        row["classification"] for row in mappings
    )

    unreadable_archive_entries = [
        row["relative_path"]
        for row in archive_rows
        if not row["readable"]
    ]

    return {
        "schema_version": SCHEMA_VERSION,
        "authority": {
            "archive_path": archive_path.relative_to(repo_root).as_posix(),
            "archive_sha256": sha256_file(archive_path),
            "archive_prefix": archive_prefix,
            "local_corpus_root": local_root.relative_to(repo_root).as_posix(),
        },
        "summary": {
            "archive_docx_count": len(archive_rows),
            "local_docx_count": len(local_rows),
            "mapped_archive_count": len(mapped_archive_indexes),
            "mapped_local_count": len(mapped_local_indexes),
            "mapping_count": len(mappings),
            "exact_path_and_content_match_count": classification_counts[
                "exact_path_and_content_match"
            ],
            "content_identical_path_encoding_variant_count": (
                classification_counts[
                    "content_identical_path_encoding_variant"
                ]
            ),
            "same_path_divergent_content_count": classification_counts[
                "same_path_divergent_content"
            ],
            "missing_archive_source_count": len(missing_archive_sources),
            "additional_local_file_count": len(additional_local_files),
            "ambiguous_hash_group_count": len(ambiguous_hashes),
            "archive_unreadable_count": len(unreadable_archive_entries),
            "archive_duplicate_path_count": len(
                duplicate_relative_paths(archive_rows)
            ),
            "local_duplicate_path_count": len(
                duplicate_relative_paths(local_rows)
            ),
        },
        "archive_duplicate_paths": duplicate_relative_paths(archive_rows),
        "local_duplicate_paths": duplicate_relative_paths(local_rows),
        "archive_unreadable_paths": unreadable_archive_entries,
        "ambiguous_hash_groups": ambiguous_hashes,
        "missing_archive_sources": missing_archive_sources,
        "additional_local_files": additional_local_files,
        "mappings": mappings,
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
        "# CAN-002 — Extracted MasterPlan Corpus Verification",
        "",
        "## Authority",
        "",
        f"- Archive: `{authority['archive_path']}`",
        f"- Archive SHA-256: `{authority['archive_sha256']}`",
        f"- Archive prefix: `{authority['archive_prefix']}`",
        f"- Extracted corpus: `{authority['local_corpus_root']}`",
        "",
        "The archive and extracted DOCX files were read without modification.",
        "Filename differences are recorded exactly and are not normalized.",
        "",
        "## Summary",
        "",
        f"- Authoritative DOCX files: {summary['archive_docx_count']}",
        f"- Extracted DOCX files: {summary['local_docx_count']}",
        f"- Authoritative files mapped: {summary['mapped_archive_count']}",
        f"- Extracted files mapped: {summary['mapped_local_count']}",
        f"- Exact path and content matches: {summary['exact_path_and_content_match_count']}",
        f"- Content-identical path/encoding variants: {summary['content_identical_path_encoding_variant_count']}",
        f"- Same-path divergent files: {summary['same_path_divergent_content_count']}",
        f"- Missing authoritative mappings: {summary['missing_archive_source_count']}",
        f"- Additional unmatched local files: {summary['additional_local_file_count']}",
        f"- Ambiguous SHA-256 groups: {summary['ambiguous_hash_group_count']}",
        f"- Unreadable authoritative entries: {summary['archive_unreadable_count']}",
        "",
        "## Interpretation",
        "",
        "A `content_identical_path_encoding_variant` is not missing or additional. "
        "It is a one-to-one mapping established through a unique identical "
        "SHA-256 where the stored paths differ because of filename encoding.",
        "",
        "## Complete authoritative-to-local mapping",
        "",
        "| Classification | Archive relative path | Local relative path | SHA-256 | Mapping basis |",
        "|---|---|---|---|---|",
    ]

    for row in report["mappings"]:
        archive_path = row["archive"]["relative_path"].replace("|", "\\|")
        local_path = row["local"]["relative_path"].replace("|", "\\|")
        digest = row["archive"]["sha256"] or ""

        lines.append(
            f"| {row['classification']} | `{archive_path}` | "
            f"`{local_path}` | `{digest}` | {row['mapping_basis']} |"
        )

    lines.extend(
        [
            "",
            "## Genuinely unmatched authoritative files",
            "",
        ]
    )

    if report["missing_archive_sources"]:
        for row in report["missing_archive_sources"]:
            lines.append(f"- `{row['relative_path']}`")
    else:
        lines.append("None.")

    lines.extend(
        [
            "",
            "## Genuinely unmatched local files",
            "",
        ]
    )

    if report["additional_local_files"]:
        for row in report["additional_local_files"]:
            lines.append(f"- `{row['relative_path']}`")
    else:
        lines.append("None.")

    lines.extend(
        [
            "",
            "## Ambiguous SHA-256 groups",
            "",
        ]
    )

    if report["ambiguous_hash_groups"]:
        for group in report["ambiguous_hash_groups"]:
            lines.append(f"- SHA-256 `{group['sha256']}`")
            lines.append(
                "  - Archive: "
                + ", ".join(
                    f"`{path}`"
                    for path in group["archive_relative_paths"]
                )
            )
            lines.append(
                "  - Local: "
                + ", ".join(
                    f"`{path}`"
                    for path in group["local_relative_paths"]
                )
            )
    else:
        lines.append("None.")

    return "\n".join(lines) + "\n"


def readme_text() -> str:
    return """# CAN-002 audit artifacts

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

    python scripts/audit_masterplan_corpus.py \
      --archive 04.zip \
      --archive-prefix "04/DROPI_CANONICAL/01_CANONICAL_DOCS/00_MasterPlan/" \
      --local-root canonical/docs/00_MasterPlan \
      --repo-root . \
      --output-dir docs/audits/can-002

## Tests

    python -m unittest -v tests/test_audit_masterplan_corpus.py
"""


def write_outputs(
    report: dict[str, Any],
    output_dir: pathlib.Path,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    (output_dir / "masterplan_comparison.json").write_bytes(
        json_bytes(report)
    )

    (output_dir / "masterplan_comparison.md").write_text(
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
        description="Map extracted MasterPlan DOCX files to 04.zip."
    )

    parser.add_argument("--archive", default="04.zip")
    parser.add_argument(
        "--archive-prefix",
        default=DEFAULT_ARCHIVE_PREFIX,
    )
    parser.add_argument(
        "--local-root",
        default=DEFAULT_LOCAL_ROOT,
    )
    parser.add_argument("--repo-root", default=".")
    parser.add_argument(
        "--output-dir",
        default="docs/audits/can-002",
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
    local_root = pathlib.Path(args.local_root).resolve()
    repo_root = pathlib.Path(args.repo_root).resolve()
    output_dir = pathlib.Path(args.output_dir).resolve()

    if not archive_path.is_file():
        raise FileNotFoundError(
            f"archive does not exist: {archive_path}"
        )

    if not local_root.is_dir():
        raise FileNotFoundError(
            f"local corpus does not exist: {local_root}"
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

    report = compare_corpus(
        archive_path=archive_path,
        archive_prefix=args.archive_prefix,
        local_root=local_root,
        repo_root=repo_root,
    )

    write_outputs(report, output_dir)

    archive_hash_after = sha256_file(archive_path)

    if archive_hash_after != archive_hash_before:
        raise RuntimeError(
            "archive bytes changed during MasterPlan mapping"
        )

    summary = report["summary"]

    print(f"Authoritative DOCX: {summary['archive_docx_count']}")
    print(f"Extracted DOCX: {summary['local_docx_count']}")
    print(f"Mapped authoritative: {summary['mapped_archive_count']}")
    print(f"Mapped local: {summary['mapped_local_count']}")
    print(
        "Exact path/content: "
        f"{summary['exact_path_and_content_match_count']}"
    )
    print(
        "Path/encoding variants: "
        f"{summary['content_identical_path_encoding_variant_count']}"
    )
    print(
        "Same-path divergent: "
        f"{summary['same_path_divergent_content_count']}"
    )
    print(
        "Missing mappings: "
        f"{summary['missing_archive_source_count']}"
    )
    print(
        "Additional unmatched: "
        f"{summary['additional_local_file_count']}"
    )

    return 0


if __name__ == "__main__":
    sys.exit(main())
