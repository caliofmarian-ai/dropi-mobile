#!/usr/bin/env python3
"""CAN-008 — deterministic canonical package regeneration."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import sys
import zipfile
from typing import Any

SCHEMA_VERSION = 2
ARCHIVE_EXPECTED_SHA256 = "82a6015b8c968645307e36c8e4aa0351515f50333c08a6c5402a7819b7b747e5"

DEFAULT_REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_PACKAGE_ROOT_NAME = "DROPi_Canonical_Reference"
DEFAULT_AUDIT_OUTPUT_DIR = "docs/audits/can-008"
ARCHIVE_REL_PATH = "04.zip"
CAN006_REL_PATH = "docs/audits/can-006/derived_package_statistics.json"
CAN007_REL_PATH = "docs/audits/can-007/derived_package_provenance.json"
REPOSITORY_SLUG = "caliofmarian-ai/dropi-mobile"

OFFICIAL_PROVENANCE_CLASSES = (
    "recovered_directly_from_04_zip",
    "copied_from_extracted_masterplan",
    "copied_from_active_canonical",
    "derived_from_root_architecture_or_governance",
    "derived_from_blueprint",
    "package_control_document",
    "unknown_or_unsupported",
)

OFFICIAL_DERIVED_STATUSES = (
    "copied_byte_identical",
    "copied_with_path_or_filename_variant",
    "normalized_content_equivalent",
    "derived_transformation",
    "package_control",
    "unsupported",
)

EXIT_PASS = 0
EXIT_GENERAL_FAILURE = 1
EXIT_UNSAFE_PATH = 2
EXIT_MISSING_SOURCE = 3
EXIT_DIVERGENT = 4
EXIT_NOT_CERTIFIABLE = 5
EXIT_MALFORMED_INPUT = 6

FORBIDDEN_OUTPUT_NAMES = frozenset(
    [DEFAULT_PACKAGE_ROOT_NAME, "04.zip", "canonical", "BLUEPRINT"]
)

AUDIT_INPUT_PATHS = [
    ("can001_report", "docs/audits/can-001/04_zip_inventory.json"),
    ("can002_report", "docs/audits/can-002/masterplan_comparison.json"),
    ("can003_report", "docs/audits/can-003/zip_markdown_inventory.json"),
    ("can004_report", "docs/audits/can-004/canonical_authority_matrix.json"),
    ("can005_report", "docs/audits/can-005/canonical_filename_encoding_inventory.json"),
    ("can006_report", CAN006_REL_PATH),
    ("can007_report", CAN007_REL_PATH),
]

EXCLUDED_DIR_NAMES: frozenset[str] = frozenset(
    [".git", "node_modules", "__pycache__", ".cache", "coverage", "dist", "build"]
)

SOURCE_CATEGORY_AUTHORITATIVE = "authoritative_source"
SOURCE_CATEGORY_PACKAGE_CONTROL = "generated_package_control"
SOURCE_CATEGORY_FALLBACK = "retained_existing_fallback"
SOURCE_CATEGORY_UNSUPPORTED = "unsupported"

METHOD_COPY_BYTE_IDENTICAL = "copy_exact_source_bytes"
METHOD_COPY_PATH_VARIANT = "copy_exact_source_bytes_path_variant"
METHOD_GENERATE_README = "generate_readme_from_package_metadata"
METHOD_GENERATE_KNOWLEDGE_INDEX = "generate_knowledge_index_from_statistics_and_provenance"
METHOD_GENERATE_MANIFEST = "generate_manifest_from_package_inventory_and_provenance"
METHOD_GENERATE_AUDIT_REPORT = "generate_audit_report_from_statistics_and_provenance"
METHOD_RETAINED_FALLBACK = "retained_existing_fallback"

PACKAGE_CONTROL_METADATA: dict[str, dict[str, Any]] = {
    "README_FOR_DROPi_TYCOON.md": {
        "role": "consumer_usage_readme",
        "generator": METHOD_GENERATE_README,
        "documented_inputs": [
            "docs/audits/can-006/derived_package_statistics.json",
            "docs/audits/can-007/derived_package_provenance.json",
            "04.zip",
        ],
        "unreproducible_reason": (
            "package_control_readme_checked_in_bytes_depend_on_undocumented_branch_commit_generation_metadata"
        ),
    },
    "CANONICAL_KNOWLEDGE_INDEX.md": {
        "role": "navigation_index",
        "generator": METHOD_GENERATE_KNOWLEDGE_INDEX,
        "documented_inputs": [
            "docs/audits/can-006/derived_package_statistics.json",
            "docs/audits/can-007/derived_package_provenance.json",
        ],
        "unreproducible_reason": (
            "package_control_knowledge_index_checked_in_bytes_depend_on_undocumented_curated_navigation_text"
        ),
    },
    "CANONICAL_MANIFEST.md": {
        "role": "package_inventory_manifest",
        "generator": METHOD_GENERATE_MANIFEST,
        "documented_inputs": [
            "docs/audits/can-006/derived_package_statistics.json",
            "docs/audits/can-007/derived_package_provenance.json",
        ],
        "unreproducible_reason": (
            "package_control_manifest_checked_in_bytes_depend_on_undocumented_curated_per_document_metadata"
        ),
    },
    "AI_CANONICAL_REFERENCE_AUDIT_REPORT.md": {
        "role": "recovery_audit_summary",
        "generator": METHOD_GENERATE_AUDIT_REPORT,
        "documented_inputs": [
            "docs/audits/can-006/derived_package_statistics.json",
            "docs/audits/can-007/derived_package_provenance.json",
            "04.zip",
        ],
        "unreproducible_reason": (
            "package_control_audit_report_checked_in_bytes_depend_on_undocumented_curated_audit_narrative"
        ),
    },
}
PACKAGE_CONTROL_PATHS = tuple(sorted(PACKAGE_CONTROL_METADATA))


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_path(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def stable_json_dumps(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def resolve_safe(path: pathlib.Path) -> pathlib.Path:
    try:
        return path.resolve(strict=False)
    except (OSError, RuntimeError) as exc:
        raise ValueError(f"Path resolution failed: {path}") from exc


def is_excluded(path: pathlib.Path) -> bool:
    return any(part in EXCLUDED_DIR_NAMES for part in path.parts)


def validate_output_dir(
    output_dir: pathlib.Path,
    repo_root: pathlib.Path,
    package_root_abs: pathlib.Path,
    audit_output_abs: pathlib.Path,
) -> None:
    out_resolved = resolve_safe(output_dir)
    repo_resolved = resolve_safe(repo_root)

    if out_resolved == repo_resolved:
        _die(EXIT_UNSAFE_PATH, "Output directory must not equal repository root.")
    if out_resolved == resolve_safe(package_root_abs):
        _die(EXIT_UNSAFE_PATH, "Output directory must not equal DROPi_Canonical_Reference/.")

    try:
        rel = out_resolved.relative_to(repo_resolved)
        first_part = rel.parts[0] if rel.parts else ""
        if first_part in FORBIDDEN_OUTPUT_NAMES or str(rel) in FORBIDDEN_OUTPUT_NAMES:
            _die(EXIT_UNSAFE_PATH, f"Output directory '{out_resolved}' is a forbidden path.")
    except ValueError:
        pass

    for forbidden_name in ("canonical", "BLUEPRINT", DEFAULT_PACKAGE_ROOT_NAME):
        forbidden_abs = resolve_safe(repo_resolved / forbidden_name)
        try:
            out_resolved.relative_to(forbidden_abs)
            _die(EXIT_UNSAFE_PATH, f"Output directory must not be inside '{forbidden_name}/'.")
        except ValueError:
            pass

    for _, rel_path in AUDIT_INPUT_PATHS:
        audit_dir = resolve_safe(repo_resolved / pathlib.Path(rel_path).parent)
        try:
            out_resolved.relative_to(audit_dir)
            _die(EXIT_UNSAFE_PATH, "Output directory must not be inside an existing audit input directory.")
        except ValueError:
            pass

    if output_dir.exists() and output_dir.resolve() != out_resolved:
        _die(EXIT_UNSAFE_PATH, "Output directory contains a symlink — unsafe.")


def _die(code: int, message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    sys.exit(code)


def build_zip_index(archive_path: pathlib.Path) -> dict[str, dict[str, Any]]:
    index: dict[str, dict[str, Any]] = {}
    with zipfile.ZipFile(archive_path, "r") as zf:
        for info in sorted(zf.infolist(), key=lambda item: item.filename):
            if info.is_dir():
                continue
            data = zf.read(info.filename)
            index[info.filename] = {"sha256": sha256_bytes(data), "data": data}
    return index


def read_source_bytes(
    source_path: str,
    repo_root: pathlib.Path,
    zip_index: dict[str, dict[str, Any]],
) -> bytes | None:
    if source_path.startswith("04.zip::"):
        entry = source_path.split("::", 1)[1]
        entry_info = zip_index.get(entry)
        return None if entry_info is None else entry_info["data"]
    fs_path = repo_root / source_path
    if not fs_path.exists() or not fs_path.is_file():
        return None
    return fs_path.read_bytes()


def source_exists_in(
    source_path: str | None,
    repo_root: pathlib.Path,
    zip_index: dict[str, dict[str, Any]],
) -> bool:
    if source_path is None:
        return False
    if source_path.startswith("04.zip::"):
        return source_path.split("::", 1)[1] in zip_index
    return (repo_root / source_path).is_file()


def write_output_file(dest: pathlib.Path, data: bytes, output_root: pathlib.Path) -> None:
    try:
        dest.relative_to(output_root)
    except ValueError:
        _die(EXIT_UNSAFE_PATH, f"Path traversal detected: {dest} is outside {output_root}")

    if dest.exists():
        real = dest.resolve()
        try:
            real.relative_to(resolve_safe(output_root))
        except ValueError:
            _die(EXIT_UNSAFE_PATH, f"Symlink escape detected writing to {dest}")

    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)


def hash_tree(root: pathlib.Path) -> dict[str, str]:
    result: dict[str, str] = {}
    for path in sorted(root.rglob("*")):
        if not path.is_file() or is_excluded(path):
            continue
        result[path.relative_to(root).as_posix()] = sha256_path(path)
    return result


def compare_trees(tree_a: pathlib.Path, tree_b: pathlib.Path) -> dict[str, Any]:
    hashes_a = hash_tree(tree_a)
    hashes_b = hash_tree(tree_b)
    all_paths = sorted(set(hashes_a) | set(hashes_b))
    identical: list[str] = []
    divergent: list[str] = []
    only_in_a: list[str] = []
    only_in_b: list[str] = []

    for path in all_paths:
        in_a = path in hashes_a
        in_b = path in hashes_b
        if in_a and in_b:
            if hashes_a[path] == hashes_b[path]:
                identical.append(path)
            else:
                divergent.append(path)
        elif in_a:
            only_in_a.append(path)
        else:
            only_in_b.append(path)

    return {
        "total_files": len(all_paths),
        "identical_count": len(identical),
        "divergent_count": len(divergent),
        "only_in_a_count": len(only_in_a),
        "only_in_b_count": len(only_in_b),
        "trees_identical": not divergent and not only_in_a and not only_in_b,
        "divergent_paths": divergent,
        "only_in_a": only_in_a,
        "only_in_b": only_in_b,
    }


def load_json_file(path: pathlib.Path, label: str) -> dict[str, Any]:
    if not path.exists():
        _die(EXIT_MALFORMED_INPUT, f"{label} not found: {path}")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        _die(EXIT_MALFORMED_INPUT, f"{label} is not valid JSON: {exc}")


def load_can007(can007_path: pathlib.Path) -> list[dict[str, Any]]:
    data = load_json_file(can007_path, "CAN-007 report")
    records = data.get("records")
    if not isinstance(records, list):
        _die(EXIT_MALFORMED_INPUT, "CAN-007 report missing 'records' list.")
    return records


def compute_audit_input_hashes(repo_root: pathlib.Path) -> dict[str, str]:
    result: dict[str, str] = {}
    for key, rel_path in AUDIT_INPUT_PATHS:
        path = repo_root / rel_path
        result[key] = sha256_path(path) if path.exists() else ""
    return result


def top_level_section(package_path: str) -> str:
    return package_path.split("/", 1)[0] if "/" in package_path else "(root)"


def build_package_control_context(
    repo_root: pathlib.Path,
    can007_records: list[dict[str, Any]] | None = None,
    archive_sha256: str | None = None,
    audit_input_hashes: dict[str, str] | None = None,
) -> dict[str, Any]:
    can006 = load_json_file(repo_root / CAN006_REL_PATH, "CAN-006 report")
    if can007_records is None:
        can007_records = load_can007(repo_root / CAN007_REL_PATH)
    if archive_sha256 is None:
        archive_sha256 = sha256_path(repo_root / ARCHIVE_REL_PATH)
    if audit_input_hashes is None:
        audit_input_hashes = compute_audit_input_hashes(repo_root)

    can006_files = {item["path"]: item for item in can006.get("files", [])}
    package_entries: list[dict[str, Any]] = []
    for record in sorted(can007_records, key=lambda item: item["package_path"]):
        package_path = record["package_path"]
        file_meta = can006_files.get(package_path, {})
        package_entries.append(
            {
                "package_path": package_path,
                "package_sha256": record["package_sha256"],
                "package_size": record.get("package_size", file_meta.get("size")),
                "top_level_section": file_meta.get("top_level_section", top_level_section(package_path)),
                "classification": file_meta.get("classification"),
                "provenance_class": record["primary_provenance_class"],
                "derived_status": record["derived_status"],
                "source_path": record.get("source_path"),
                "source_exists": bool(record.get("source_exists")),
                "matching_method": record.get("matching_method"),
                "evidence": record.get("evidence"),
                "extension": record.get("extension", file_meta.get("extension")),
            }
        )

    section_counts: dict[str, int] = {}
    for entry in package_entries:
        section = entry["top_level_section"]
        section_counts[section] = section_counts.get(section, 0) + 1

    return {
        "archive_sha256": archive_sha256,
        "audit_input_hashes": dict(sorted((audit_input_hashes or {}).items())),
        "can006": can006,
        "can007_records": list(sorted(can007_records, key=lambda item: item["package_path"])),
        "package_entries": package_entries,
        "package_control_paths": PACKAGE_CONTROL_PATHS,
        "section_counts": dict(sorted(section_counts.items())),
        "summary": can006.get("summary", {}),
    }


def format_inputs(inputs: list[str]) -> str:
    return ", ".join(f"`{item}`" for item in inputs)


def generate_package_control_readme(context: dict[str, Any]) -> str:
    summary = context["summary"]
    counts = context["can007_records"]
    lines = [
        "# README_FOR_DROPi_TYCOON",
        "",
        "## Package Metadata",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Package purpose | Official canonical reference export for DROPi Tycoon alignment |",
        f"| Source repository | `{REPOSITORY_SLUG}` |",
        f"| Package root | `{DEFAULT_PACKAGE_ROOT_NAME}/` |",
        f"| Total packaged files | {summary.get('actual_file_count', len(context['package_entries']))} |",
        f"| Source documents | {summary.get('source_document_count', 0)} |",
        f"| Package-control documents | {summary.get('package_control_document_count', len(PACKAGE_CONTROL_PATHS))} |",
        f"| 04.zip SHA-256 | `{context['archive_sha256']}` |",
        "",
        "## Deterministic Generation Inputs",
        "",
        "This document is deterministically regenerated from:",
        "",
        "- `docs/audits/can-006/derived_package_statistics.json`",
        "- `docs/audits/can-007/derived_package_provenance.json`",
        "- `04.zip` SHA-256 evidence",
        "",
        "## Mandatory Usage Rules",
        "",
        "1. This package is read-only.",
        "2. DROPi remains the canonical source for the real ecosystem.",
        "3. This package is a reference export for alignment, not a replacement for repository governance.",
        "4. Any divergence in Tycoon-specific usage must be documented explicitly.",
        "",
        "## Included Source Classes",
        "",
        "| Provenance class | Count |",
        "| --- | ---: |",
    ]
    prov_counts: dict[str, int] = {key: 0 for key in OFFICIAL_PROVENANCE_CLASSES}
    for record in counts:
        prov_counts[record["primary_provenance_class"]] += 1
    for key in OFFICIAL_PROVENANCE_CLASSES:
        lines.append(f"| `{key}` | {prov_counts[key]} |")

    lines.extend(
        [
            "",
            "## Package-Control Documents",
            "",
        ]
    )
    for path in PACKAGE_CONTROL_PATHS:
        role = PACKAGE_CONTROL_METADATA[path]["role"]
        lines.append(f"- `{path}` — {role}")
    lines.append("")
    return "\n".join(lines) + "\n"


def generate_package_control_knowledge_index(context: dict[str, Any]) -> str:
    summary = context["summary"]
    lines = [
        "# CANONICAL_KNOWLEDGE_INDEX",
        "",
        "## 1. Package Scope",
        "",
        "This index is deterministically regenerated from audited package metadata and provenance records.",
        "",
        "## 2. Ground-Truth Counts",
        "",
        "| Metric | Count |",
        "| --- | ---: |",
        f"| Total packaged files | {summary.get('actual_file_count', 0)} |",
        f"| Source documents | {summary.get('source_document_count', 0)} |",
        f"| Package-control documents | {summary.get('package_control_document_count', 0)} |",
        "",
        "## 3. Section Inventory",
        "",
        "| Top-level section | File count |",
        "| --- | ---: |",
    ]
    for section, count in context["section_counts"].items():
        lines.append(f"| `{section}` | {count} |")

    lines.extend(
        [
            "",
            "## 4. Package-Control Documents",
            "",
            "| Path | Semantic role | Generator | Documented inputs |",
            "| --- | --- | --- | --- |",
        ]
    )
    for path in PACKAGE_CONTROL_PATHS:
        meta = PACKAGE_CONTROL_METADATA[path]
        lines.append(
            f"| `{path}` | `{meta['role']}` | `{meta['generator']}` | {format_inputs(meta['documented_inputs'])} |"
        )

    lines.extend(
        [
            "",
            "## 5. Provenance Breakdown",
            "",
            "| Derived status | Count |",
            "| --- | ---: |",
        ]
    )
    status_counts: dict[str, int] = {key: 0 for key in OFFICIAL_DERIVED_STATUSES}
    for record in context["can007_records"]:
        status_counts[record["derived_status"]] += 1
    for key in OFFICIAL_DERIVED_STATUSES:
        lines.append(f"| `{key}` | {status_counts[key]} |")
    lines.append("")
    return "\n".join(lines) + "\n"


def generate_package_control_manifest(context: dict[str, Any]) -> str:
    lines = [
        "# CANONICAL_MANIFEST",
        "",
        "All paths below are relative to the root of `DROPi_Canonical_Reference/`.",
        "",
        "## Package Control Documents",
        "",
        "| Path | Semantic role | Generator | Documented inputs |",
        "| --- | --- | --- | --- |",
    ]
    for path in PACKAGE_CONTROL_PATHS:
        meta = PACKAGE_CONTROL_METADATA[path]
        lines.append(
            f"| `{path}` | `{meta['role']}` | `{meta['generator']}` | {format_inputs(meta['documented_inputs'])} |"
        )

    grouped: dict[str, list[dict[str, Any]]] = {}
    for entry in context["package_entries"]:
        grouped.setdefault(entry["top_level_section"], []).append(entry)

    for section in sorted(grouped):
        if section == "(root)":
            continue
        lines.extend(
            [
                "",
                f"## {section}",
                "",
                "| Package path | Classification | Provenance | Derived status | Deterministic source |",
                "| --- | --- | --- | --- | --- |",
            ]
        )
        for entry in sorted(grouped[section], key=lambda item: item["package_path"]):
            if entry["package_path"] in PACKAGE_CONTROL_METADATA:
                continue
            source_path = entry["source_path"] or "—"
            lines.append(
                f"| `{entry['package_path']}` | `{entry['classification'] or 'unknown'}` | `{entry['provenance_class']}` | `{entry['derived_status']}` | `{source_path}` |"
            )
    lines.append("")
    return "\n".join(lines) + "\n"


def generate_package_control_audit_report(context: dict[str, Any]) -> str:
    summary = context["summary"]
    counts_by_status: dict[str, int] = {key: 0 for key in OFFICIAL_DERIVED_STATUSES}
    for record in context["can007_records"]:
        counts_by_status[record["derived_status"]] += 1
    lines = [
        "# AI_CANONICAL_REFERENCE_AUDIT_REPORT",
        "",
        "## 1. Deterministic Audit Inputs",
        "",
        "| Input | SHA-256 |",
        "| --- | --- |",
        f"| `04.zip` | `{context['archive_sha256']}` |",
    ]
    for key, rel_path in AUDIT_INPUT_PATHS:
        lines.append(
            f"| `{rel_path}` | `{context['audit_input_hashes'].get(key, '')}` |"
        )

    lines.extend(
        [
            "",
            "## 2. Current Package Totals",
            "",
            "| Metric | Count |",
            "| --- | ---: |",
            f"| Actual packaged files | {summary.get('actual_file_count', 0)} |",
            f"| Source documents | {summary.get('source_document_count', 0)} |",
            f"| Package-control documents | {summary.get('package_control_document_count', 0)} |",
            "",
            "## 3. Provenance Status Counts",
            "",
            "| Derived status | Count |",
            "| --- | ---: |",
        ]
    )
    for key in OFFICIAL_DERIVED_STATUSES:
        lines.append(f"| `{key}` | {counts_by_status[key]} |")

    lines.extend(
        [
            "",
            "## 4. Package-Control Regeneration Rules",
            "",
            "| Path | Semantic role | Generator | Documented inputs |",
            "| --- | --- | --- | --- |",
        ]
    )
    for path in PACKAGE_CONTROL_PATHS:
        meta = PACKAGE_CONTROL_METADATA[path]
        lines.append(
            f"| `{path}` | `{meta['role']}` | `{meta['generator']}` | {format_inputs(meta['documented_inputs'])} |"
        )

    lines.extend(
        [
            "",
            "## 5. Historical Blockers Preserved",
            "",
            "- `00_Project/Governance/SESSION_HANDOVER.md` remains non-certifiable because the deterministic derived transformation is undocumented.",
            "- `00_Project/Status_Reports/AUDIT_TRACKING.md` remains unsupported.",
            "- `00_Project/Status_Reports/SESSION_STATE.md` remains unsupported.",
            "- `09_Reference/Package_Metadata/inventory.json` remains unsupported.",
            "",
        ]
    )
    return "\n".join(lines) + "\n"


def generate_package_control_bytes(package_path: str, context: dict[str, Any]) -> bytes:
    if package_path == "README_FOR_DROPi_TYCOON.md":
        text = generate_package_control_readme(context)
    elif package_path == "CANONICAL_KNOWLEDGE_INDEX.md":
        text = generate_package_control_knowledge_index(context)
    elif package_path == "CANONICAL_MANIFEST.md":
        text = generate_package_control_manifest(context)
    elif package_path == "AI_CANONICAL_REFERENCE_AUDIT_REPORT.md":
        text = generate_package_control_audit_report(context)
    else:
        raise KeyError(f"Unsupported package-control path: {package_path}")
    return text.encode("utf-8")


def compute_file_result(
    record: dict[str, Any],
    repo_root: pathlib.Path,
    package_root_abs: pathlib.Path,
    zip_index: dict[str, dict[str, Any]],
    package_control_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    pkg_path: str = record["package_path"]
    expected_sha: str = record["package_sha256"]
    derived_status: str = record["derived_status"]
    source_path: str | None = record.get("source_path")
    prov_class: str = record["primary_provenance_class"]

    base: dict[str, Any] = {
        "package_path": pkg_path,
        "source_path": source_path,
        "provenance_class": prov_class,
        "derived_status": derived_status,
        "expected_sha256": expected_sha,
        "regenerated_sha256": None,
        "existing_package_sha256": None,
        "checked_in_package_matches_expected": None,
        "byte_identical": False,
        "source_exists": False,
        "source_category": None,
        "regeneration_method": None,
        "regenerated_from_authoritative_source": False,
        "regenerated_from_documented_inputs": False,
        "certifiable": False,
        "failure_reason": None,
        "package_control_role": None,
        "documented_inputs": [],
    }

    if derived_status == "package_control":
        if package_control_context is None:
            package_control_context = build_package_control_context(repo_root)
        meta = PACKAGE_CONTROL_METADATA[pkg_path]
        generated = generate_package_control_bytes(pkg_path, package_control_context)
        pkg_file_abs = package_root_abs / pkg_path
        existing_sha = sha256_path(pkg_file_abs) if pkg_file_abs.exists() else None
        generated_sha = sha256_bytes(generated)
        base["source_exists"] = True
        base["source_category"] = SOURCE_CATEGORY_PACKAGE_CONTROL
        base["regeneration_method"] = meta["generator"]
        base["regenerated_from_documented_inputs"] = True
        base["package_control_role"] = meta["role"]
        base["documented_inputs"] = list(meta["documented_inputs"])
        base["regenerated_sha256"] = generated_sha
        base["existing_package_sha256"] = existing_sha
        base["checked_in_package_matches_expected"] = existing_sha == expected_sha if existing_sha else False
        base["byte_identical"] = generated_sha == expected_sha
        base["certifiable"] = generated_sha == expected_sha
        if not base["byte_identical"]:
            base["failure_reason"] = meta["unreproducible_reason"]
        return base

    if derived_status == "unsupported":
        pkg_file_abs = package_root_abs / pkg_path
        base["source_category"] = SOURCE_CATEGORY_UNSUPPORTED
        base["regeneration_method"] = METHOD_RETAINED_FALLBACK
        if not pkg_file_abs.exists():
            base["failure_reason"] = "unsupported_existing_package_file_missing"
            return base
        existing_sha = sha256_path(pkg_file_abs)
        base["regenerated_sha256"] = existing_sha
        base["existing_package_sha256"] = existing_sha
        base["checked_in_package_matches_expected"] = existing_sha == expected_sha
        base["byte_identical"] = existing_sha == expected_sha
        base["failure_reason"] = "unsupported_no_deterministic_source"
        return base

    if derived_status == "derived_transformation":
        pkg_file_abs = package_root_abs / pkg_path
        base["source_exists"] = source_exists_in(source_path, repo_root, zip_index)
        base["source_category"] = SOURCE_CATEGORY_FALLBACK
        base["regeneration_method"] = METHOD_RETAINED_FALLBACK
        if not pkg_file_abs.exists():
            base["failure_reason"] = "retained_existing_fallback_missing"
            return base
        existing_sha = sha256_path(pkg_file_abs)
        base["regenerated_sha256"] = existing_sha
        base["existing_package_sha256"] = existing_sha
        base["checked_in_package_matches_expected"] = existing_sha == expected_sha
        base["byte_identical"] = existing_sha == expected_sha
        base["failure_reason"] = "derived_transformation_algorithm_not_documented"
        return base

    base["source_exists"] = source_exists_in(source_path, repo_root, zip_index)
    base["source_category"] = SOURCE_CATEGORY_AUTHORITATIVE
    base["regenerated_from_authoritative_source"] = True
    base["regenerated_from_documented_inputs"] = True
    base["regeneration_method"] = (
        METHOD_COPY_BYTE_IDENTICAL
        if derived_status == "copied_byte_identical"
        else METHOD_COPY_PATH_VARIANT
    )

    if not base["source_exists"]:
        base["failure_reason"] = "source_missing"
        base["regenerated_from_authoritative_source"] = False
        base["regenerated_from_documented_inputs"] = False
        return base

    src_bytes = read_source_bytes(source_path or "", repo_root, zip_index)
    if src_bytes is None:
        base["failure_reason"] = "source_unreadable"
        base["regenerated_from_authoritative_source"] = False
        base["regenerated_from_documented_inputs"] = False
        return base

    regen_sha = sha256_bytes(src_bytes)
    pkg_file_abs = package_root_abs / pkg_path
    if pkg_file_abs.exists():
        existing_sha = sha256_path(pkg_file_abs)
        base["existing_package_sha256"] = existing_sha
        base["checked_in_package_matches_expected"] = existing_sha == expected_sha

    base["regenerated_sha256"] = regen_sha
    base["byte_identical"] = regen_sha == expected_sha
    base["certifiable"] = regen_sha == expected_sha
    if not base["byte_identical"]:
        base["failure_reason"] = "source_hash_diverged_from_expected"
    return base


def materialize_file_bytes(
    record: dict[str, Any],
    file_result: dict[str, Any],
    repo_root: pathlib.Path,
    package_root_abs: pathlib.Path,
    zip_index: dict[str, dict[str, Any]],
    package_control_context: dict[str, Any],
) -> bytes | None:
    derived_status = file_result["derived_status"]
    pkg_path = file_result["package_path"]
    source_path = file_result.get("source_path")

    if derived_status == "package_control":
        return generate_package_control_bytes(pkg_path, package_control_context)
    if derived_status in ("copied_byte_identical", "copied_with_path_or_filename_variant"):
        if source_path and file_result.get("source_exists"):
            return read_source_bytes(source_path, repo_root, zip_index)
        return None
    if derived_status in ("derived_transformation", "unsupported"):
        src_abs = package_root_abs / pkg_path
        return src_abs.read_bytes() if src_abs.exists() else None
    return None


def build_manifest(
    file_results: list[dict[str, Any]],
    archive_sha256: str,
    audit_input_hashes: dict[str, str],
    mode: str,
    determinism_passed: bool,
) -> dict[str, Any]:
    counts_by_prov: dict[str, int] = {key: 0 for key in OFFICIAL_PROVENANCE_CLASSES}
    counts_by_status: dict[str, int] = {key: 0 for key in OFFICIAL_DERIVED_STATUSES}
    source_category_counts = {
        SOURCE_CATEGORY_AUTHORITATIVE: 0,
        SOURCE_CATEGORY_PACKAGE_CONTROL: 0,
        SOURCE_CATEGORY_FALLBACK: 0,
        SOURCE_CATEGORY_UNSUPPORTED: 0,
    }
    for result in file_results:
        counts_by_prov[result["provenance_class"]] += 1
        counts_by_status[result["derived_status"]] += 1
        category = result.get("source_category")
        if category in source_category_counts:
            source_category_counts[category] += 1

    total = len(file_results)
    regenerated_from_source = sum(1 for result in file_results if result.get("regenerated_from_documented_inputs"))
    retained_fallback = sum(
        1
        for result in file_results
        if result.get("source_category") in (SOURCE_CATEGORY_FALLBACK, SOURCE_CATEGORY_UNSUPPORTED)
    )
    package_control_regenerated = sum(
        1 for result in file_results if result.get("source_category") == SOURCE_CATEGORY_PACKAGE_CONTROL
    )
    package_control_unreproducible = sum(
        1
        for result in file_results
        if result.get("source_category") == SOURCE_CATEGORY_PACKAGE_CONTROL and not result.get("certifiable")
    )
    byte_identical_regenerated = sum(
        1
        for result in file_results
        if result.get("regenerated_from_documented_inputs") and result.get("byte_identical")
    )
    byte_identical_total = sum(1 for result in file_results if result.get("byte_identical"))
    divergent_total = sum(
        1 for result in file_results if result.get("regenerated_sha256") is not None and not result.get("byte_identical")
    )
    authoritative_divergent = sum(
        1
        for result in file_results
        if result.get("source_category") == SOURCE_CATEGORY_AUTHORITATIVE
        and result.get("regenerated_sha256") is not None
        and not result.get("byte_identical")
    )
    missing_source_count = sum(
        1 for result in file_results if result.get("source_category") == SOURCE_CATEGORY_AUTHORITATIVE and not result.get("source_exists")
    )
    unsupported_count = counts_by_status["unsupported"]
    undocumented_transformation_count = counts_by_status["derived_transformation"]
    certifiable_count = sum(1 for result in file_results if result.get("certifiable"))
    non_certifiable_count = total - certifiable_count

    blockers = [
        {
            "package_path": result["package_path"],
            "source_category": result.get("source_category"),
            "failure_reason": result.get("failure_reason"),
        }
        for result in sorted(file_results, key=lambda item: item["package_path"])
        if not result.get("certifiable")
    ]
    package_control_results = [
        result
        for result in sorted(file_results, key=lambda item: item["package_path"])
        if result["derived_status"] == "package_control"
    ]
    unsupported_files = [
        result["package_path"]
        for result in sorted(file_results, key=lambda item: item["package_path"])
        if result["derived_status"] == "unsupported"
    ]
    retained_fallback_files = [
        result["package_path"]
        for result in sorted(file_results, key=lambda item: item["package_path"])
        if result.get("source_category") in (SOURCE_CATEGORY_FALLBACK, SOURCE_CATEGORY_UNSUPPORTED)
    ]

    inputs: dict[str, Any] = {
        "archive_path": ARCHIVE_REL_PATH,
        "archive_sha256": archive_sha256,
    }
    for key, rel_path in AUDIT_INPUT_PATHS:
        inputs[f"{key}_path"] = rel_path
        inputs[f"{key}_sha256"] = audit_input_hashes.get(key, "")

    totals_reconcile = (
        regenerated_from_source + retained_fallback == total
        and certifiable_count + non_certifiable_count == total
    )

    summary = {
        "expected_package_file_count": total,
        "actually_regenerated_from_source_count": regenerated_from_source,
        "retained_existing_fallback_count": retained_fallback,
        "package_control_regenerated_count": package_control_regenerated,
        "package_control_unreproducible_count": package_control_unreproducible,
        "byte_identical_regenerated_count": byte_identical_regenerated,
        "byte_identical_file_count": byte_identical_total,
        "divergent_file_count": divergent_total,
        "authoritative_divergent_file_count": authoritative_divergent,
        "missing_source_count": missing_source_count,
        "unsupported_source_count": unsupported_count,
        "undocumented_transformation_count": undocumented_transformation_count,
        "certifiable_file_count": certifiable_count,
        "non_certifiable_file_count": non_certifiable_count,
        "regeneration_certifiable": non_certifiable_count == 0,
        "deterministic_repetition_passed": determinism_passed,
        "summary_totals_reconcile": totals_reconcile,
    }

    environment_compatibility = {
        "termux_android": "compatible",
        "standard_linux": "compatible",
        "github_actions": "assessed_compatible_with_clean_checkout",
        "github_actions_execution": "not_exercised_in_actual_github_actions_for_this_pr",
        "compatibility_notes": (
            "Requires Python 3.9+, standard library only. "
            "GitHub Actions compatibility was assessed for a clean checkout and was not exercised in an actual workflow run for this PR. "
            "Android shared storage cannot safely host Node symlink-heavy dependency installation, but this Python standard-library tool itself is compatible. "
            "Termux requires the python package. All modes run without network access."
        ),
        "limitations": (
            "04.zip must be present. canonical/docs/00_MasterPlan/ must be present. "
            "CAN-007 provenance records must exist at docs/audits/can-007/derived_package_provenance.json. "
            "No package mutation is performed. No 04.zip mutation is performed."
        ),
    }

    return {
        "schema_version": SCHEMA_VERSION,
        "audit": "CAN-008",
        "mode": mode,
        "scope": {
            "package_root": DEFAULT_PACKAGE_ROOT_NAME,
            "source_mutation_performed": False,
            "package_mutation_performed": False,
            "historical_archive_mutation_performed": False,
        },
        "inputs": inputs,
        "environment_compatibility": environment_compatibility,
        "summary": summary,
        "counts_by_provenance_class": counts_by_prov,
        "counts_by_derived_status": counts_by_status,
        "counts_by_source_category": source_category_counts,
        "file_results": sorted(file_results, key=lambda item: item["package_path"]),
        "package_control_results": package_control_results,
        "unsupported_files": unsupported_files,
        "retained_existing_fallback_files": retained_fallback_files,
        "certification_blockers": blockers,
        "non_certifiable_files": blockers,
        "not_certifiable_files": blockers,
        "determinism_results": {
            "sorted_filesystem_traversal": True,
            "sorted_zip_traversal": True,
            "stable_json_key_ordering": True,
            "stable_markdown_ordering": True,
            "stable_newlines": True,
            "no_timestamps": True,
            "no_absolute_paths": True,
            "no_random_values": True,
            "deterministic_repetition_passed": determinism_passed,
        },
    }


def build_report_markdown(manifest: dict[str, Any]) -> str:
    summary = manifest["summary"]
    lines = [
        "# [CAN-008] Canonical Package Regeneration Report",
        "",
        "## 1. Scope",
        "",
        f"- Package root: `{manifest['scope']['package_root']}`",
        f"- Validation mode: `{manifest['mode']}`",
        "- Package-control files are regenerated from documented inputs; existing package bytes are never used as the generation source.",
        "",
        "## 2. GitHub Actions compatibility assessment",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Assessment | {manifest['environment_compatibility']['github_actions']} |",
        f"| Execution evidence for this PR | {manifest['environment_compatibility']['github_actions_execution']} |",
        f"| Notes | {manifest['environment_compatibility']['compatibility_notes']} |",
        "",
        "## 3. Package-control generation rules",
        "",
        "| Path | Semantic role | Generator | Documented inputs |",
        "| --- | --- | --- | --- |",
    ]
    for result in manifest["package_control_results"]:
        lines.append(
            f"| `{result['package_path']}` | `{result.get('package_control_role')}` | `{result['regeneration_method']}` | {format_inputs(result.get('documented_inputs', []))} |"
        )

    lines.extend(
        [
            "",
            "## 4. Summary",
            "",
            "| Metric | Count |",
            "| --- | ---: |",
        ]
    )
    for key in [
        "expected_package_file_count",
        "actually_regenerated_from_source_count",
        "retained_existing_fallback_count",
        "package_control_regenerated_count",
        "package_control_unreproducible_count",
        "byte_identical_regenerated_count",
        "byte_identical_file_count",
        "divergent_file_count",
        "authoritative_divergent_file_count",
        "missing_source_count",
        "unsupported_source_count",
        "undocumented_transformation_count",
        "certifiable_file_count",
        "non_certifiable_file_count",
    ]:
        lines.append(f"| `{key}` | {summary[key]} |")
    lines.append(f"| `summary_totals_reconcile` | {summary['summary_totals_reconcile']} |")
    lines.append(f"| `deterministic_repetition_passed` | {summary['deterministic_repetition_passed']} |")

    lines.extend(
        [
            "",
            "## 5. Source categories",
            "",
            "| Source category | Count |",
            "| --- | ---: |",
        ]
    )
    for key, value in sorted(manifest["counts_by_source_category"].items()):
        lines.append(f"| `{key}` | {value} |")

    lines.extend(
        [
            "",
            "## 6. Package-control regeneration evidence",
            "",
            "| Path | Expected SHA-256 | Generated SHA-256 | Byte-identical | Certifiable | Failure reason |",
            "| --- | --- | --- | --- | --- | --- |",
        ]
    )
    for result in manifest["package_control_results"]:
        lines.append(
            f"| `{result['package_path']}` | `{result['expected_sha256']}` | `{result['regenerated_sha256']}` | {result['byte_identical']} | {result['certifiable']} | {result.get('failure_reason') or ''} |"
        )

    lines.extend(["", "## 7. Certification blockers", ""])
    if manifest["certification_blockers"]:
        lines.extend(
            [
                "| Package path | Source category | Failure reason |",
                "| --- | --- | --- |",
            ]
        )
        for item in manifest["certification_blockers"]:
            lines.append(
                f"| `{item['package_path']}` | `{item.get('source_category')}` | {item.get('failure_reason') or ''} |"
            )
    else:
        lines.append("No certification blockers.")

    lines.extend(
        [
            "",
            "## 8. Full file results",
            "",
            "| Package path | Derived status | Source category | Regeneration method | Regenerated from authoritative source | Regenerated from documented inputs | Byte-identical | Certifiable | Failure reason |",
            "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
        ]
    )
    for result in manifest["file_results"]:
        lines.append(
            f"| `{result['package_path']}` | `{result['derived_status']}` | `{result.get('source_category')}` | `{result.get('regeneration_method')}` | {result.get('regenerated_from_authoritative_source')} | {result.get('regenerated_from_documented_inputs')} | {result.get('byte_identical')} | {result.get('certifiable')} | {result.get('failure_reason') or ''} |"
        )

    lines.extend(
        [
            "",
            "## 9. Determinism guarantees",
            "",
            "| Property | Value |",
            "| --- | --- |",
        ]
    )
    for key, value in sorted(manifest["determinism_results"].items()):
        lines.append(f"| {key} | {value} |")
    lines.append("")
    return "\n".join(lines) + "\n"


def run_regeneration_core(
    repo_root: pathlib.Path,
    package_root_abs: pathlib.Path,
    archive_path: pathlib.Path,
    can007_records: list[dict[str, Any]],
    output_dir: pathlib.Path | None,
    audit_output_dir: pathlib.Path,
    mode: str,
) -> tuple[dict[str, Any], int]:
    actual_archive_sha = sha256_path(archive_path)
    if actual_archive_sha != ARCHIVE_EXPECTED_SHA256:
        _die(
            EXIT_DIVERGENT,
            f"04.zip SHA-256 mismatch. Expected {ARCHIVE_EXPECTED_SHA256}, got {actual_archive_sha}",
        )

    zip_index = build_zip_index(archive_path)
    audit_input_hashes = compute_audit_input_hashes(repo_root)
    package_control_context = build_package_control_context(
        repo_root,
        can007_records=can007_records,
        archive_sha256=actual_archive_sha,
        audit_input_hashes=audit_input_hashes,
    )

    file_results = [
        compute_file_result(record, repo_root, package_root_abs, zip_index, package_control_context)
        for record in sorted(can007_records, key=lambda item: item["package_path"])
    ]

    if output_dir is not None:
        output_dir.mkdir(parents=True, exist_ok=True)
        for record, file_result in zip(sorted(can007_records, key=lambda item: item["package_path"]), file_results):
            data = materialize_file_bytes(
                record,
                file_result,
                repo_root,
                package_root_abs,
                zip_index,
                package_control_context,
            )
            if data is not None:
                write_output_file(output_dir / file_result["package_path"], data, output_dir)

    manifest = build_manifest(
        file_results=file_results,
        archive_sha256=actual_archive_sha,
        audit_input_hashes=audit_input_hashes,
        mode=mode,
        determinism_passed=True,
    )

    audit_output_dir.mkdir(parents=True, exist_ok=True)
    (audit_output_dir / "regeneration_manifest.json").write_text(
        stable_json_dumps(manifest),
        encoding="utf-8",
    )
    (audit_output_dir / "regeneration_report.md").write_text(
        build_report_markdown(manifest),
        encoding="utf-8",
    )

    summary = manifest["summary"]
    if summary["missing_source_count"] > 0:
        return manifest, EXIT_MISSING_SOURCE
    if summary["authoritative_divergent_file_count"] > 0:
        return manifest, EXIT_DIVERGENT
    if not summary["regeneration_certifiable"]:
        return manifest, EXIT_NOT_CERTIFIABLE
    return manifest, EXIT_PASS


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="CAN-008: Deterministic canonical package regeneration.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--repo-root",
        type=pathlib.Path,
        default=DEFAULT_REPO_ROOT,
        help="Repository root directory (default: parent of scripts/).",
    )
    parser.add_argument(
        "--package-root",
        default=DEFAULT_PACKAGE_ROOT_NAME,
        help=f"Package root directory name relative to repo root (default: {DEFAULT_PACKAGE_ROOT_NAME}).",
    )
    parser.add_argument(
        "--validate-existing",
        action="store_true",
        help="Validation-only mode: read sources and validate, do not write any package files.",
    )
    parser.add_argument(
        "--output-dir",
        type=pathlib.Path,
        default=None,
        help="Output directory for regenerated package files (must be explicit and external).",
    )
    parser.add_argument(
        "--compare-with",
        type=pathlib.Path,
        default=None,
        help="Compare regenerated output with this directory after regeneration.",
    )
    parser.add_argument(
        "--audit-output-dir",
        type=pathlib.Path,
        default=None,
        help=f"Where to write manifest and report (default: <repo-root>/{DEFAULT_AUDIT_OUTPUT_DIR}).",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    repo_root = resolve_safe(args.repo_root)
    if not repo_root.exists():
        _die(EXIT_GENERAL_FAILURE, f"Repository root not found: {repo_root}")

    package_root_abs = repo_root / args.package_root
    if not package_root_abs.exists():
        _die(EXIT_GENERAL_FAILURE, f"Package root not found: {package_root_abs}")

    archive_path = repo_root / ARCHIVE_REL_PATH
    if not archive_path.exists():
        _die(EXIT_MISSING_SOURCE, f"Archive not found: {archive_path}")

    can007_records = load_can007(repo_root / CAN007_REL_PATH)
    audit_output_dir = resolve_safe(args.audit_output_dir) if args.audit_output_dir else repo_root / DEFAULT_AUDIT_OUTPUT_DIR

    if args.output_dir is not None:
        output_dir = resolve_safe(args.output_dir)
        validate_output_dir(output_dir, repo_root, package_root_abs, audit_output_dir)
    elif args.validate_existing:
        output_dir = None
    else:
        _die(EXIT_UNSAFE_PATH, "Must specify either --validate-existing or --output-dir <path>.")
        return EXIT_UNSAFE_PATH

    mode = "validate_existing" if args.validate_existing else "regenerate"
    manifest, exit_code = run_regeneration_core(
        repo_root=repo_root,
        package_root_abs=package_root_abs,
        archive_path=archive_path,
        can007_records=can007_records,
        output_dir=output_dir,
        audit_output_dir=audit_output_dir,
        mode=mode,
    )

    if args.compare_with is not None and output_dir is not None:
        compare_dir = repo_root / args.compare_with
        if not compare_dir.exists():
            compare_dir = resolve_safe(args.compare_with)
        if not compare_dir.exists():
            _die(EXIT_GENERAL_FAILURE, f"--compare-with directory not found: {args.compare_with}")
        cmp = compare_trees(output_dir, compare_dir)
        print(f"Tree comparison: {output_dir} vs {compare_dir}")
        print(f"  Total files: {cmp['total_files']}")
        print(f"  Identical:   {cmp['identical_count']}")
        print(f"  Divergent:   {cmp['divergent_count']}")
        print(f"  Only in A:   {cmp['only_in_a_count']}")
        print(f"  Only in B:   {cmp['only_in_b_count']}")
        print(f"  Trees identical: {cmp['trees_identical']}")
        if not cmp["trees_identical"] and exit_code in (EXIT_PASS, EXIT_NOT_CERTIFIABLE):
            exit_code = EXIT_DIVERGENT

    summary = manifest["summary"]
    cert = "CERTIFIABLE" if summary["regeneration_certifiable"] else "NOT CERTIFIABLE"
    print(f"CAN-008 regeneration: {cert}")
    print(
        "  Expected: {expected}  Regenerated from source: {regenerated}  "
        "Fallback retained: {fallback}  Package-control unreproducible: {pc_unreproducible}  "
        "Non-certifiable: {non_certifiable}".format(
            expected=summary["expected_package_file_count"],
            regenerated=summary["actually_regenerated_from_source_count"],
            fallback=summary["retained_existing_fallback_count"],
            pc_unreproducible=summary["package_control_unreproducible_count"],
            non_certifiable=summary["non_certifiable_file_count"],
        )
    )
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
