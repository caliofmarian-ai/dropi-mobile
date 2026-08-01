#!/usr/bin/env python3
"""Inventory and map Markdown documents stored in authoritative 04.zip."""

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

EXCLUDED_REPOSITORY_PREFIXES = (
    ".git/",
    "node_modules/",
    "docs/audits/can-003/",
)

MOJIBAKE_MARKERS = (
    "\ufffd",
    "Ã",
    "Â",
    "â€",
    "â€™",
    "â€œ",
    "ðŸ",
    "╬",
    "├",
    "┼",
    "¤",
    "тА",
    "╤В",
)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()

    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()


def decode_markdown(data: bytes) -> tuple[str | None, str | None]:
    encodings = (
        "utf-8-sig",
        "utf-8",
        "utf-16",
        "cp1252",
        "latin-1",
    )

    for encoding in encodings:
        try:
            return data.decode(encoding), encoding
        except UnicodeDecodeError:
            continue

    return None, None


def normalized_text(text: str) -> str:
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    normalized = unicodedata.normalize("NFC", normalized)

    lines = [
        line.rstrip(" \t")
        for line in normalized.split("\n")
    ]

    while lines and lines[-1] == "":
        lines.pop()

    return "\n".join(lines) + "\n"


def classify_markdown(path: str) -> str:
    lowered = path.casefold()
    basename = pathlib.PurePosixPath(path).name.casefold()

    if any(
        token in lowered
        for token in (
            "governance",
            "authority",
            "decision",
            "policy",
            "standard",
            "protocol",
            "rules",
        )
    ):
        return "canonical_governance"

    if any(
        token in lowered
        for token in (
            "index",
            "contents",
            "navigation",
            "readme",
            "manifest",
            "tree",
            "toc",
        )
    ):
        return "canonical_index_or_navigation"

    if any(
        token in lowered
        for token in (
            "runbook",
            "operation",
            "deployment",
            "incident",
            "release",
            "migration",
            "checklist",
        )
    ):
        return "operational_document"

    if any(
        token in lowered
        for token in (
            "chapter",
            "capitol",
            "volume",
            "volum",
            "masterplan",
        )
    ):
        return "canonical_chapter_or_masterplan"

    if basename in {
        "readme.md",
        "index.md",
        "contents.md",
    }:
        return "canonical_index_or_navigation"

    return "historical_markdown_document"


def encoding_anomalies(path: str) -> list[str]:
    anomalies: list[str] = []

    if unicodedata.normalize("NFC", path) != path:
        anomalies.append("path-is-not-unicode-nfc")

    if any(marker in path for marker in MOJIBAKE_MARKERS):
        anomalies.append("possible-mojibake-marker")

    if any(ord(character) < 32 for character in path):
        anomalies.append("control-character-in-path")

    return sorted(set(anomalies))


def archive_markdown_entries(
    archive_path: pathlib.Path,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    with zipfile.ZipFile(archive_path, "r") as archive:
        for archive_index, info in enumerate(archive.infolist()):
            if info.is_dir():
                continue

            if pathlib.PurePosixPath(
                info.filename
            ).suffix.casefold() != ".md":
                continue

            raw: bytes | None = None
            read_error: str | None = None

            try:
                with archive.open(info, "r") as stream:
                    raw = stream.read()
            except Exception as error:
                read_error = f"{type(error).__name__}: {error}"

            decoded_text: str | None = None
            detected_encoding: str | None = None
            normalized_sha256: str | None = None

            if raw is not None:
                decoded_text, detected_encoding = decode_markdown(raw)

                if decoded_text is not None:
                    normalized_sha256 = sha256_bytes(
                        normalized_text(decoded_text).encode("utf-8")
                    )

            rows.append(
                {
                    "archive_index": archive_index,
                    "archive_path": info.filename,
                    "relative_path": info.filename,
                    "filename": pathlib.PurePosixPath(
                        info.filename
                    ).name,
                    "classification": classify_markdown(
                        info.filename
                    ),
                    "compressed_size": info.compress_size,
                    "uncompressed_size": info.file_size,
                    "crc32": f"{info.CRC:08x}",
                    "sha256": (
                        sha256_bytes(raw)
                        if raw is not None
                        else None
                    ),
                    "normalized_text_sha256": normalized_sha256,
                    "detected_encoding": detected_encoding,
                    "encoding_anomalies": encoding_anomalies(
                        info.filename
                    ),
                    "readable": read_error is None,
                    "read_error": read_error,
                }
            )

    return rows


def repository_markdown_entries(
    repo_root: pathlib.Path,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    paths = sorted(
        (
            path
            for path in repo_root.rglob("*")
            if path.is_file()
            and path.suffix.casefold() == ".md"
            and not any(
                path.relative_to(repo_root).as_posix().startswith(
                    prefix
                )
                for prefix in EXCLUDED_REPOSITORY_PREFIXES
            )
        ),
        key=lambda path: path.relative_to(repo_root).as_posix(),
    )

    for path in paths:
        relative_path = path.relative_to(repo_root).as_posix()
        raw = path.read_bytes()
        decoded_text, detected_encoding = decode_markdown(raw)

        normalized_sha256 = None

        if decoded_text is not None:
            normalized_sha256 = sha256_bytes(
                normalized_text(decoded_text).encode("utf-8")
            )

        rows.append(
            {
                "repository_path": relative_path,
                "relative_path": relative_path,
                "filename": path.name,
                "classification": classify_markdown(relative_path),
                "size": len(raw),
                "sha256": sha256_bytes(raw),
                "normalized_text_sha256": normalized_sha256,
                "detected_encoding": detected_encoding,
                "encoding_anomalies": encoding_anomalies(
                    relative_path
                ),
            }
        )

    return rows


def suffix_candidates(path: str) -> list[str]:
    normalized = posixpath.normpath(path).lstrip("./")
    parts = pathlib.PurePosixPath(normalized).parts
    candidates: list[str] = [normalized]

    for index in range(1, len(parts)):
        candidates.append(
            pathlib.PurePosixPath(
                *parts[index:]
            ).as_posix()
        )

    return list(dict.fromkeys(candidates))


def group_indexes(
    rows: list[dict[str, Any]],
    key: str,
) -> dict[str, list[int]]:
    result: dict[str, list[int]] = collections.defaultdict(list)

    for index, row in enumerate(rows):
        value = row.get(key)

        if value:
            result[value].append(index)

    return dict(sorted(result.items()))


def compare_markdown_corpus(
    archive_path: pathlib.Path,
    repo_root: pathlib.Path,
) -> dict[str, Any]:
    archive_path = archive_path.resolve()
    repo_root = repo_root.resolve()

    archive_rows = archive_markdown_entries(archive_path)
    repository_rows = repository_markdown_entries(repo_root)

    repo_path_index = {
        row["repository_path"]: index
        for index, row in enumerate(repository_rows)
    }

    repo_raw_hash_indexes = group_indexes(
        repository_rows,
        "sha256",
    )

    repo_normalized_hash_indexes = group_indexes(
        repository_rows,
        "normalized_text_sha256",
    )

    mapped_repository_indexes: set[int] = set()
    mappings: list[dict[str, Any]] = []

    for archive_row in archive_rows:
        candidate_indexes: list[int] = []

        for candidate in suffix_candidates(
            archive_row["archive_path"]
        ):
            if candidate in repo_path_index:
                candidate_indexes.append(
                    repo_path_index[candidate]
                )

        candidate_indexes = list(
            dict.fromkeys(candidate_indexes)
        )

        exact_path_candidate: int | None = None

        if len(candidate_indexes) == 1:
            exact_path_candidate = candidate_indexes[0]

        if exact_path_candidate is not None:
            repository_row = repository_rows[
                exact_path_candidate
            ]

            if (
                archive_row["sha256"]
                == repository_row["sha256"]
            ):
                classification = "exact_byte_match"
                basis = "path_suffix_and_sha256"
            elif (
                archive_row["normalized_text_sha256"]
                and archive_row["normalized_text_sha256"]
                == repository_row[
                    "normalized_text_sha256"
                ]
            ):
                classification = "normalized_text_match"
                basis = "path_suffix_and_normalized_text"
            else:
                classification = "divergent_counterpart"
                basis = "path_suffix_only"

            mapped_repository_indexes.add(
                exact_path_candidate
            )

            mappings.append(
                {
                    "classification": classification,
                    "mapping_basis": basis,
                    "archive": archive_row,
                    "repository": repository_row,
                    "candidate_repository_paths": [],
                }
            )
            continue

        raw_candidates = []

        if archive_row["sha256"]:
            raw_candidates = [
                index
                for index in repo_raw_hash_indexes.get(
                    archive_row["sha256"],
                    [],
                )
                if index not in mapped_repository_indexes
            ]

        if len(raw_candidates) == 1:
            repository_index = raw_candidates[0]
            mapped_repository_indexes.add(repository_index)

            mappings.append(
                {
                    "classification": "content_identical_path_variant",
                    "mapping_basis": "unique_sha256",
                    "archive": archive_row,
                    "repository": repository_rows[
                        repository_index
                    ],
                    "candidate_repository_paths": [],
                }
            )
            continue

        normalized_candidates = []

        if archive_row["normalized_text_sha256"]:
            normalized_candidates = [
                index
                for index in repo_normalized_hash_indexes.get(
                    archive_row["normalized_text_sha256"],
                    [],
                )
                if index not in mapped_repository_indexes
            ]

        if len(normalized_candidates) == 1:
            repository_index = normalized_candidates[0]
            mapped_repository_indexes.add(repository_index)

            mappings.append(
                {
                    "classification": (
                        "normalized_content_path_variant"
                    ),
                    "mapping_basis": (
                        "unique_normalized_text_sha256"
                    ),
                    "archive": archive_row,
                    "repository": repository_rows[
                        repository_index
                    ],
                    "candidate_repository_paths": [],
                }
            )
            continue

        combined_candidates = sorted(
            {
                repository_rows[index][
                    "repository_path"
                ]
                for index in (
                    candidate_indexes
                    + raw_candidates
                    + normalized_candidates
                )
            }
        )

        mappings.append(
            {
                "classification": (
                    "ambiguous_counterpart"
                    if combined_candidates
                    else "archive_only_missing_counterpart"
                ),
                "mapping_basis": (
                    "multiple_candidates"
                    if combined_candidates
                    else "no_counterpart_found"
                ),
                "archive": archive_row,
                "repository": None,
                "candidate_repository_paths": (
                    combined_candidates
                ),
            }
        )

    mappings.sort(
        key=lambda row: (
            row["archive"]["archive_path"],
            row["classification"],
        )
    )

    classification_counts = collections.Counter(
        row["classification"]
        for row in mappings
    )

    recovered_repository_paths = sorted(
        {
            row["repository"]["repository_path"]
            for row in mappings
            if row["repository"] is not None
        }
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
            "archive_markdown_count": len(archive_rows),
            "repository_markdown_count": len(repository_rows),
            "mapping_count": len(mappings),
            "mapped_archive_count": sum(
                row["repository"] is not None
                for row in mappings
            ),
            "exact_byte_match_count": (
                classification_counts["exact_byte_match"]
            ),
            "normalized_text_match_count": (
                classification_counts[
                    "normalized_text_match"
                ]
            ),
            "content_identical_path_variant_count": (
                classification_counts[
                    "content_identical_path_variant"
                ]
            ),
            "normalized_content_path_variant_count": (
                classification_counts[
                    "normalized_content_path_variant"
                ]
            ),
            "divergent_counterpart_count": (
                classification_counts[
                    "divergent_counterpart"
                ]
            ),
            "archive_only_missing_counterpart_count": (
                classification_counts[
                    "archive_only_missing_counterpart"
                ]
            ),
            "ambiguous_counterpart_count": (
                classification_counts[
                    "ambiguous_counterpart"
                ]
            ),
            "recovered_repository_counterpart_count": len(
                recovered_repository_paths
            ),
            "archive_unreadable_count": sum(
                not row["readable"]
                for row in archive_rows
            ),
            "archive_encoding_anomaly_count": sum(
                bool(row["encoding_anomalies"])
                for row in archive_rows
            ),
        },
        "classification_counts": dict(
            sorted(
                collections.Counter(
                    row["classification"]
                    for row in archive_rows
                ).items()
            )
        ),
        "recovered_repository_paths": (
            recovered_repository_paths
        ),
        "archive_entries": archive_rows,
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
        "# CAN-003 — ZIP Markdown Inventory and Verification",
        "",
        "## Authority",
        "",
        f"- Archive: `{authority['archive_path']}`",
        f"- SHA-256: `{authority['archive_sha256']}`",
        "",
        "The archive and repository Markdown files were read without modification.",
        "Historical paths and bytes were preserved exactly.",
        "",
        "## Summary",
        "",
        f"- Markdown entries in archive: {summary['archive_markdown_count']}",
        f"- Repository Markdown files inspected: {summary['repository_markdown_count']}",
        f"- Archive entries mapped: {summary['mapped_archive_count']}",
        f"- Exact byte matches: {summary['exact_byte_match_count']}",
        f"- Normalized-text matches: {summary['normalized_text_match_count']}",
        f"- Content-identical path variants: {summary['content_identical_path_variant_count']}",
        f"- Normalized-content path variants: {summary['normalized_content_path_variant_count']}",
        f"- Divergent counterparts: {summary['divergent_counterpart_count']}",
        f"- Archive-only documents: {summary['archive_only_missing_counterpart_count']}",
        f"- Ambiguous counterparts: {summary['ambiguous_counterpart_count']}",
        f"- Unreadable archive entries: {summary['archive_unreadable_count']}",
        f"- Archive filename encoding anomalies: {summary['archive_encoding_anomaly_count']}",
        "",
        "## Counts by document class",
        "",
        "| Classification | Count |",
        "|---|---:|",
    ]

    for classification, count in report[
        "classification_counts"
    ].items():
        lines.append(
            f"| {classification} | {count} |"
        )

    lines.extend(
        [
            "",
            "## Complete archive Markdown mapping",
            "",
            "| Result | Document class | Archive path | Repository counterpart | Mapping basis | Archive SHA-256 | Repository SHA-256 |",
            "|---|---|---|---|---|---|---|",
        ]
    )

    for row in report["mappings"]:
        archive = row["archive"]
        repository = row["repository"]

        archive_path = archive["archive_path"].replace(
            "|",
            "\\|",
        )

        repository_path = (
            repository["repository_path"]
            if repository is not None
            else ""
        ).replace("|", "\\|")

        repository_hash = (
            repository["sha256"]
            if repository is not None
            else ""
        )

        lines.append(
            f"| {row['classification']} | "
            f"{archive['classification']} | "
            f"`{archive_path}` | "
            f"`{repository_path}` | "
            f"{row['mapping_basis']} | "
            f"`{archive['sha256'] or ''}` | "
            f"`{repository_hash}` |"
        )

    lines.extend(
        [
            "",
            "## Archive-only Markdown documents",
            "",
        ]
    )

    archive_only = [
        row
        for row in report["mappings"]
        if row["classification"]
        == "archive_only_missing_counterpart"
    ]

    if archive_only:
        for row in archive_only:
            lines.append(
                f"- `{row['archive']['archive_path']}` "
                f"({row['archive']['classification']})"
            )
    else:
        lines.append("None.")

    lines.extend(
        [
            "",
            "## Divergent recovered counterparts",
            "",
        ]
    )

    divergent = [
        row
        for row in report["mappings"]
        if row["classification"]
        == "divergent_counterpart"
    ]

    if divergent:
        for row in divergent:
            lines.append(
                f"- Archive: `{row['archive']['archive_path']}`"
            )
            lines.append(
                "  - Repository: "
                f"`{row['repository']['repository_path']}`"
            )
    else:
        lines.append("None.")

    lines.extend(
        [
            "",
            "## Ambiguous counterparts",
            "",
        ]
    )

    ambiguous = [
        row
        for row in report["mappings"]
        if row["classification"]
        == "ambiguous_counterpart"
    ]

    if ambiguous:
        for row in ambiguous:
            lines.append(
                f"- `{row['archive']['archive_path']}`"
            )

            for candidate in row[
                "candidate_repository_paths"
            ]:
                lines.append(
                    f"  - Candidate: `{candidate}`"
                )
    else:
        lines.append("None.")

    return "\n".join(lines) + "\n"


def readme_text() -> str:
    return """# CAN-003 audit artifacts

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

    python scripts/audit_zip_markdown.py \
      --archive 04.zip \
      --repo-root . \
      --output-dir docs/audits/can-003

## Tests

    python -m unittest -v tests/test_audit_zip_markdown.py
"""


def write_outputs(
    report: dict[str, Any],
    output_dir: pathlib.Path,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    (output_dir / "zip_markdown_inventory.json").write_bytes(
        json_bytes(report)
    )

    (output_dir / "zip_markdown_inventory.md").write_text(
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
        description=(
            "Inventory and map Markdown documents from 04.zip."
        )
    )

    parser.add_argument("--archive", default="04.zip")
    parser.add_argument("--repo-root", default=".")
    parser.add_argument(
        "--output-dir",
        default="docs/audits/can-003",
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
        and archive_hash_before
        != args.expected_archive_sha256
    ):
        raise ValueError(
            "authoritative archive SHA-256 mismatch: "
            f"expected {args.expected_archive_sha256}, "
            f"found {archive_hash_before}"
        )

    report = compare_markdown_corpus(
        archive_path=archive_path,
        repo_root=repo_root,
    )

    write_outputs(report, output_dir)

    archive_hash_after = sha256_file(archive_path)

    if archive_hash_after != archive_hash_before:
        raise RuntimeError(
            "archive bytes changed during Markdown audit"
        )

    summary = report["summary"]

    print(
        "Archive Markdown entries: "
        f"{summary['archive_markdown_count']}"
    )
    print(
        "Mapped archive entries: "
        f"{summary['mapped_archive_count']}"
    )
    print(
        "Exact byte matches: "
        f"{summary['exact_byte_match_count']}"
    )
    print(
        "Normalized matches: "
        f"{summary['normalized_text_match_count']}"
    )
    print(
        "Archive-only documents: "
        f"{summary['archive_only_missing_counterpart_count']}"
    )
    print(
        "Divergent counterparts: "
        f"{summary['divergent_counterpart_count']}"
    )
    print(
        "Ambiguous counterparts: "
        f"{summary['ambiguous_counterpart_count']}"
    )

    return 0


if __name__ == "__main__":
    sys.exit(main())
