#!/usr/bin/env python3
"""Generate a deterministic read-only inventory of authoritative 04.zip."""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import pathlib
import posixpath
import stat
import sys
import unicodedata
import zipfile
from typing import Any, Iterable

SCHEMA_VERSION = 1

AUTHORITATIVE_SHA256 = (
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
)


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


def entry_type(info: zipfile.ZipInfo) -> str:
    if info.is_dir():
        return "directory"

    unix_mode = (info.external_attr >> 16) & 0xFFFF

    if unix_mode and stat.S_ISLNK(unix_mode):
        return "symbolic-link"

    return "file"


def extension_for(path: str, is_directory: bool) -> str:
    if is_directory:
        return "[directory]"

    suffix = pathlib.PurePosixPath(path).suffix.lower()
    return suffix or "[no extension]"


def classify(path: str, extension: str, is_directory: bool) -> str:
    if is_directory:
        return "generated artifact"

    lowered = path.casefold()
    basename = pathlib.PurePosixPath(path).name.casefold()

    source_extensions = {
        ".py",
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".java",
        ".kt",
        ".swift",
        ".c",
        ".cpp",
        ".h",
    }

    config_extensions = {
        ".json",
        ".yaml",
        ".yml",
        ".toml",
        ".ini",
        ".env",
        ".properties",
        ".xml",
        ".config",
    }

    generated_extensions = {
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".svg",
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".ppt",
        ".pptx",
        ".apk",
        ".aab",
        ".ipa",
        ".map",
        ".lock",
    }

    if extension in source_extensions:
        if (
            "/test/" in f"/{lowered}/"
            or "/tests/" in f"/{lowered}/"
            or basename.startswith("test_")
            or ".test." in basename
            or ".spec." in basename
        ):
            return "test"

        return "source code"

    if extension in config_extensions:
        return "configuration"

    if extension in generated_extensions:
        return "generated artifact"

    if extension in {".md", ".txt", ".rst"}:
        if any(
            token in lowered
            for token in (
                "masterplan",
                "master_plan",
                "canonical",
                "canon/",
                "requirement",
                "specification",
                "architecture",
            )
        ):
            return "primary canonical document"

        if any(
            token in lowered
            for token in (
                "index",
                "contents",
                "navigation",
                "readme",
                "manifest",
                "tree",
            )
        ):
            return "canonical index/navigation"

        if any(
            token in lowered
            for token in (
                "governance",
                "authority",
                "decision",
                "policy",
                "standard",
                "protocol",
            )
        ):
            return "canonical governance"

        if any(
            token in lowered
            for token in (
                "deploy",
                "runbook",
                "operation",
                "incident",
                "release",
                "migration",
            )
        ):
            return "operational document"

        return "historical implementation artifact"

    return "unknown/requires review"


def encoding_anomalies(path: str) -> list[str]:
    anomalies: list[str] = []

    if unicodedata.normalize("NFC", path) != path:
        anomalies.append("path-is-not-unicode-nfc")

    if any(marker in path for marker in MOJIBAKE_MARKERS):
        anomalies.append("possible-mojibake-marker")

    if any(ord(character) < 32 for character in path):
        anomalies.append("control-character-in-path")

    if "\x7f" in path:
        anomalies.append("delete-control-character-in-path")

    try:
        path.encode("utf-8", errors="strict")
    except UnicodeEncodeError:
        anomalies.append("path-not-strict-utf8-encodable")

    return sorted(set(anomalies))


def path_anomalies(path: str) -> list[str]:
    anomalies: list[str] = []
    pure_path = pathlib.PurePosixPath(path)

    if path.startswith("/") or pure_path.is_absolute():
        anomalies.append("absolute-path")

    if "\\" in path:
        anomalies.append("backslash-in-zip-path")

    if "\x00" in path:
        anomalies.append("nul-character-in-path")

    if any(part == ".." for part in pure_path.parts):
        anomalies.append("parent-directory-traversal")

    if path.startswith("./"):
        anomalies.append("explicit-current-directory-prefix")

    if "//" in path:
        anomalies.append("repeated-path-separator")

    return sorted(set(anomalies))


def repository_file_paths(
    repo_root: pathlib.Path,
    output_dir: pathlib.Path,
) -> set[str]:
    paths: set[str] = set()
    output_resolved = output_dir.resolve()

    for candidate in repo_root.rglob("*"):
        if not candidate.is_file():
            continue

        try:
            candidate.resolve().relative_to(output_resolved)
            continue
        except ValueError:
            pass

        relative = candidate.relative_to(repo_root).as_posix()

        if relative == ".git" or relative.startswith(".git/"):
            continue

        paths.add(relative)

    return paths


def counterpart_candidates(archive_path: str) -> list[str]:
    normalized = posixpath.normpath(archive_path).lstrip("./")
    parts = pathlib.PurePosixPath(normalized).parts
    candidates = [normalized]

    if len(parts) > 1:
        candidates.append(
            pathlib.PurePosixPath(*parts[1:]).as_posix()
        )

    for candidate in tuple(candidates):
        candidates.append(
            pathlib.PurePosixPath(
                "canonical",
                "docs",
                "00_MasterPlan",
                candidate,
            ).as_posix()
        )

    return list(
        dict.fromkeys(
            candidate
            for candidate in candidates
            if candidate not in {"", "."}
        )
    )


def find_counterpart(
    archive_path: str,
    repository_paths: set[str],
) -> str | None:
    for candidate in counterpart_candidates(archive_path):
        if candidate in repository_paths:
            return candidate

    suffix_matches = sorted(
        repository_path
        for repository_path in repository_paths
        if repository_path == archive_path
        or repository_path.endswith("/" + archive_path)
    )

    if len(suffix_matches) == 1:
        return suffix_matches[0]

    return None


def inventory_archive(
    archive_path: pathlib.Path,
    repo_root: pathlib.Path,
    output_dir: pathlib.Path,
) -> dict[str, Any]:
    archive_path = archive_path.resolve()
    repo_root = repo_root.resolve()
    output_dir = output_dir.resolve()

    repository_paths = repository_file_paths(
        repo_root,
        output_dir,
    )

    archive_sha256 = sha256_file(archive_path)

    entries: list[dict[str, Any]] = []
    path_counts: collections.Counter[str] = collections.Counter()

    with zipfile.ZipFile(archive_path, "r") as archive:
        infos = archive.infolist()

        for index, info in enumerate(infos):
            exact_path = info.filename
            path_counts[exact_path] += 1

            is_directory = info.is_dir()
            kind = entry_type(info)
            extension = extension_for(
                exact_path,
                is_directory,
            )

            encoding_issues = encoding_anomalies(exact_path)
            structural_issues = path_anomalies(exact_path)

            suspicious = sorted(
                set(encoding_issues + structural_issues)
            )

            supported_compression = info.compress_type in {
                zipfile.ZIP_STORED,
                zipfile.ZIP_DEFLATED,
                getattr(zipfile, "ZIP_BZIP2", -1),
                getattr(zipfile, "ZIP_LZMA", -1),
            }

            if not supported_compression:
                suspicious.append(
                    f"unsupported-compression-method:{info.compress_type}"
                )

            if info.flag_bits & 0x1:
                suspicious.append("encrypted-entry")

            content_sha256: str | None = None
            read_error: str | None = None

            if not is_directory:
                try:
                    with archive.open(info, "r") as stream:
                        content_sha256 = sha256_stream(stream)
                except Exception as error:
                    read_error = (
                        f"{type(error).__name__}: {error}"
                    )

            entries.append(
                {
                    "index": index,
                    "path": exact_path,
                    "filename": pathlib.PurePosixPath(
                        exact_path
                    ).name,
                    "entry_type": kind,
                    "extension": extension,
                    "compressed_size": info.compress_size,
                    "uncompressed_size": info.file_size,
                    "crc32": f"{info.CRC:08x}",
                    "compression_method": info.compress_type,
                    "flag_bits": info.flag_bits,
                    "sha256": content_sha256,
                    "classification": classify(
                        exact_path,
                        extension,
                        is_directory,
                    ),
                    "repository_counterpart": find_counterpart(
                        exact_path,
                        repository_paths,
                    ),
                    "duplicate_path": False,
                    "duplicate_content": False,
                    "duplicate_of_indexes": [],
                    "encoding_anomalies": encoding_issues,
                    "path_anomalies": structural_issues,
                    "suspicious_conditions": sorted(
                        set(suspicious)
                    ),
                    "readable": read_error is None,
                    "read_error": read_error,
                }
            )

    hash_indexes: dict[str, list[int]] = (
        collections.defaultdict(list)
    )

    for entry in entries:
        if entry["sha256"]:
            hash_indexes[entry["sha256"]].append(
                entry["index"]
            )

    for entry in entries:
        entry["duplicate_path"] = (
            path_counts[entry["path"]] > 1
        )

        if entry["sha256"]:
            matching_indexes = hash_indexes[
                entry["sha256"]
            ]

            entry["duplicate_content"] = (
                len(matching_indexes) > 1
            )

            entry["duplicate_of_indexes"] = [
                index
                for index in matching_indexes
                if index != entry["index"]
            ]

        if (
            entry["duplicate_path"]
            or entry["duplicate_content"]
        ):
            entry["classification"] = "duplicate candidate"

    by_extension = collections.Counter(
        entry["extension"]
        for entry in entries
    )

    by_classification = collections.Counter(
        entry["classification"]
        for entry in entries
    )

    duplicate_paths = sorted(
        path
        for path, count in path_counts.items()
        if count > 1
    )

    duplicate_content_hashes = {
        digest: indexes
        for digest, indexes in sorted(hash_indexes.items())
        if len(indexes) > 1
    }

    encoding_indexes = [
        entry["index"]
        for entry in entries
        if entry["encoding_anomalies"]
    ]

    suspicious_indexes = [
        entry["index"]
        for entry in entries
        if entry["suspicious_conditions"]
    ]

    unreadable_indexes = [
        entry["index"]
        for entry in entries
        if not entry["readable"]
    ]

    counterpart_indexes = [
        entry["index"]
        for entry in entries
        if entry["repository_counterpart"] is not None
    ]

    return {
        "schema_version": SCHEMA_VERSION,
        "archive": {
            "path": archive_path.relative_to(
                repo_root
            ).as_posix(),
            "sha256": archive_sha256,
            "entry_count": len(entries),
            "file_count": sum(
                entry["entry_type"] != "directory"
                for entry in entries
            ),
            "directory_count": sum(
                entry["entry_type"] == "directory"
                for entry in entries
            ),
            "readable_entry_count": sum(
                entry["readable"]
                for entry in entries
            ),
            "unreadable_entry_count": len(
                unreadable_indexes
            ),
        },
        "counts": {
            "by_extension": dict(
                sorted(by_extension.items())
            ),
            "by_classification": dict(
                sorted(by_classification.items())
            ),
            "duplicate_path_count": len(
                duplicate_paths
            ),
            "duplicate_content_hash_count": len(
                duplicate_content_hashes
            ),
            "encoding_anomaly_entry_count": len(
                encoding_indexes
            ),
            "suspicious_entry_count": len(
                suspicious_indexes
            ),
            "repository_counterpart_count": len(
                counterpart_indexes
            ),
        },
        "duplicate_paths": duplicate_paths,
        "duplicate_content_hashes": (
            duplicate_content_hashes
        ),
        "encoding_anomaly_entry_indexes": (
            encoding_indexes
        ),
        "suspicious_entry_indexes": (
            suspicious_indexes
        ),
        "unreadable_entry_indexes": (
            unreadable_indexes
        ),
        "repository_counterpart_entry_indexes": (
            counterpart_indexes
        ),
        "entries": entries,
    }


def json_bytes(inventory: dict[str, Any]) -> bytes:
    return (
        json.dumps(
            inventory,
            ensure_ascii=False,
            indent=2,
            sort_keys=True,
        )
        + "\n"
    ).encode("utf-8")


def markdown_text(inventory: dict[str, Any]) -> str:
    archive = inventory["archive"]
    counts = inventory["counts"]

    lines = [
        "# CAN-001 — Authoritative 04.zip Inventory",
        "",
        "## Archive fingerprint",
        "",
        f"- Archive: `{archive['path']}`",
        f"- SHA-256: `{archive['sha256']}`",
        f"- Archive entries: {archive['entry_count']}",
        f"- Files: {archive['file_count']}",
        f"- Directories: {archive['directory_count']}",
        f"- Readable entries: {archive['readable_entry_count']}",
        f"- Unreadable entries: {archive['unreadable_entry_count']}",
        "",
        "The archive was opened read-only through Python `zipfile`.",
        "It was not rewritten, renamed, normalized, or extracted over the repository.",
        "",
        "## Reconciliation",
        "",
        f"- Inventory rows: {len(inventory['entries'])}",
        f"- Duplicate paths: {counts['duplicate_path_count']}",
        f"- Duplicate content hashes: {counts['duplicate_content_hash_count']}",
        f"- Encoding-anomaly entries: {counts['encoding_anomaly_entry_count']}",
        f"- Suspicious entries: {counts['suspicious_entry_count']}",
        f"- Repository counterparts: {counts['repository_counterpart_count']}",
        "",
        "## Counts by extension",
        "",
        "| Extension | Count |",
        "|---|---:|",
    ]

    for extension, count in counts["by_extension"].items():
        lines.append(
            f"| `{extension}` | {count} |"
        )

    lines.extend(
        [
            "",
            "## Counts by classification",
            "",
            "| Classification | Count |",
            "|---|---:|",
        ]
    )

    for classification, count in counts[
        "by_classification"
    ].items():
        lines.append(
            f"| {classification} | {count} |"
        )

    lines.extend(
        [
            "",
            "## Encoding anomalies",
            "",
        ]
    )

    anomaly_entries = [
        entry
        for entry in inventory["entries"]
        if entry["encoding_anomalies"]
    ]

    if anomaly_entries:
        lines.extend(
            [
                "| Index | Exact archive path | Detection |",
                "|---:|---|---|",
            ]
        )

        for entry in anomaly_entries:
            escaped_path = entry["path"].replace(
                "|",
                "\\|",
            )

            detection = ", ".join(
                entry["encoding_anomalies"]
            )

            lines.append(
                f"| {entry['index']} | "
                f"`{escaped_path}` | {detection} |"
            )
    else:
        lines.append(
            "No filename encoding anomalies were detected."
        )

    lines.extend(
        [
            "",
            "## Corrupt, unreadable, malformed, or suspicious entries",
            "",
        ]
    )

    suspicious_entries = [
        entry
        for entry in inventory["entries"]
        if entry["suspicious_conditions"]
        or not entry["readable"]
    ]

    if suspicious_entries:
        lines.extend(
            [
                "| Index | Exact archive path | Conditions | Read error |",
                "|---:|---|---|---|",
            ]
        )

        for entry in suspicious_entries:
            escaped_path = entry["path"].replace(
                "|",
                "\\|",
            )

            conditions = ", ".join(
                entry["suspicious_conditions"]
            ) or "none"

            read_error = (
                entry["read_error"] or ""
            ).replace("|", "\\|")

            lines.append(
                f"| {entry['index']} | "
                f"`{escaped_path}` | "
                f"{conditions} | {read_error} |"
            )
    else:
        lines.append(
            "No corrupt, unreadable, malformed, or suspicious entries were detected."
        )

    lines.extend(
        [
            "",
            "## Duplicate candidates",
            "",
        ]
    )

    duplicate_entries = [
        entry
        for entry in inventory["entries"]
        if entry["duplicate_path"]
        or entry["duplicate_content"]
    ]

    if duplicate_entries:
        lines.extend(
            [
                "| Index | Exact archive path | Duplicate path | Duplicate content | Related indexes |",
                "|---:|---|---|---|---|",
            ]
        )

        for entry in duplicate_entries:
            escaped_path = entry["path"].replace(
                "|",
                "\\|",
            )

            related = ", ".join(
                str(index)
                for index in entry[
                    "duplicate_of_indexes"
                ]
            )

            lines.append(
                f"| {entry['index']} | "
                f"`{escaped_path}` | "
                f"{str(entry['duplicate_path']).lower()} | "
                f"{str(entry['duplicate_content']).lower()} | "
                f"{related} |"
            )
    else:
        lines.append(
            "No duplicate candidates were detected."
        )

    lines.extend(
        [
            "",
            "## Complete entry inventory",
            "",
            "| Index | Exact path | Type | Extension | Size | Compressed | CRC32 | SHA-256 | Classification | Counterpart |",
            "|---:|---|---|---|---:|---:|---|---|---|---|",
        ]
    )

    for entry in inventory["entries"]:
        escaped_path = entry["path"].replace(
            "|",
            "\\|",
        )

        digest = entry["sha256"] or ""
        counterpart = (
            entry["repository_counterpart"] or ""
        )

        lines.append(
            f"| {entry['index']} | "
            f"`{escaped_path}` | "
            f"{entry['entry_type']} | "
            f"`{entry['extension']}` | "
            f"{entry['uncompressed_size']} | "
            f"{entry['compressed_size']} | "
            f"`{entry['crc32']}` | "
            f"`{digest}` | "
            f"{entry['classification']} | "
            f"`{counterpart}` |"
        )

    return "\n".join(lines) + "\n"


def readme_text() -> str:
    return """# CAN-001 audit artifacts

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

    python scripts/audit_04_zip.py \
      --archive 04.zip \
      --repo-root . \
      --output-dir docs/audits/can-001

## Focused tests

    python -m unittest -v tests/test_audit_04_zip.py

Running the generator repeatedly against the same repository state must
produce byte-identical output files.
"""


def write_outputs(
    inventory: dict[str, Any],
    output_dir: pathlib.Path,
) -> None:
    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    (
        output_dir / "04_zip_inventory.json"
    ).write_bytes(
        json_bytes(inventory)
    )

    (
        output_dir / "04_zip_inventory.md"
    ).write_text(
        markdown_text(inventory),
        encoding="utf-8",
        newline="\n",
    )

    (
        output_dir / "README.md"
    ).write_text(
        readme_text(),
        encoding="utf-8",
        newline="\n",
    )


def parse_args(
    argv: Iterable[str] | None = None,
) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Inventory authoritative 04.zip "
            "without modifying it."
        )
    )

    parser.add_argument(
        "--archive",
        default="04.zip",
    )

    parser.add_argument(
        "--repo-root",
        default=".",
    )

    parser.add_argument(
        "--output-dir",
        default="docs/audits/can-001",
    )

    parser.add_argument(
        "--expected-archive-sha256",
        default=AUTHORITATIVE_SHA256,
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

    archive_path = pathlib.Path(
        args.archive
    ).resolve()

    repo_root = pathlib.Path(
        args.repo_root
    ).resolve()

    output_dir = pathlib.Path(
        args.output_dir
    ).resolve()

    if not archive_path.is_file():
        raise FileNotFoundError(
            f"archive does not exist: {archive_path}"
        )

    archive_sha_before = sha256_file(
        archive_path
    )

    if (
        not args.allow_other_archive_hash
        and archive_sha_before
        != args.expected_archive_sha256
    ):
        raise ValueError(
            "authoritative archive SHA-256 mismatch: "
            f"expected {args.expected_archive_sha256}, "
            f"found {archive_sha_before}"
        )

    inventory = inventory_archive(
        archive_path=archive_path,
        repo_root=repo_root,
        output_dir=output_dir,
    )

    write_outputs(
        inventory,
        output_dir,
    )

    archive_sha_after = sha256_file(
        archive_path
    )

    if archive_sha_after != archive_sha_before:
        raise RuntimeError(
            "archive bytes changed during inventory generation"
        )

    print(
        f"Archive SHA-256: {archive_sha_after}"
    )

    print(
        "Archive entries: "
        f"{inventory['archive']['entry_count']}"
    )

    print(
        f"Inventory rows: {len(inventory['entries'])}"
    )

    print(
        "Encoding anomaly entries: "
        f"{inventory['counts']['encoding_anomaly_entry_count']}"
    )

    print(
        "Unreadable entries: "
        f"{inventory['archive']['unreadable_entry_count']}"
    )

    print(
        f"Output directory: {output_dir}"
    )

    return 0


if __name__ == "__main__":
    sys.exit(main())
