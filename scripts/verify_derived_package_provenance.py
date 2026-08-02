#!/usr/bin/env python3
"""CAN-007 — verify provenance of every derived package file."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
from typing import Any

SCHEMA_VERSION = 2
DEFAULT_REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_PACKAGE_ROOT = "DROPi_Canonical_Reference"
DEFAULT_OUTPUT_DIR = "docs/audits/can-007"

EXCLUDED_DIR_NAMES = {".git", "node_modules", "__pycache__", ".cache", "coverage", "dist", "build"}

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

PACKAGE_CONTROL_PATHS = {
    "README_FOR_DROPi_TYCOON.md",
    "CANONICAL_KNOWLEDGE_INDEX.md",
    "CANONICAL_MANIFEST.md",
    "AI_CANONICAL_REFERENCE_AUDIT_REPORT.md",
}

EXPLICIT_UNSUPPORTED_PATHS = {
    "09_Reference/Package_Metadata/inventory.json",
    "00_Project/Status_Reports/AUDIT_TRACKING.md",
    "00_Project/Status_Reports/SESSION_STATE.md",
}

EXTRA_SOURCE_MAP = {
    "00_Project/Decision_Log/DECISION_LOG.md": "DECISION_LOG.md",
    "00_Project/Sprint_Specs/SPRINT_1_2_SPEC.md": "SPRINT_1_2_SPEC.md",
    "00_Project/Status_Reports/DROPI_STATUS_REPORT_2026-06-30.md": "DROPI_STATUS_REPORT_2026-06-30.md",
    "02_Architecture/Design/design.md": "design.md",
    "03_Logistics/Delivery_Reference/canonical-delivery-reference.md": "canonical/DELIVERY_MULTIMODAL.md",
    "05_Marketplace/Implementation/MARKETPLACE_IMPLEMENTATION_PLAN.md": "docs/MARKETPLACE_IMPLEMENTATION_PLAN.md",
    "09_Reference/Blueprint/Sprint_Roadmap/BLUEPRINT_SPRINT_ROADMAP.md": "docs/BLUEPRINT_SPRINT_ROADMAP.md",
    "09_Reference/Blueprint/Sprint_Roadmap/DROPi_NEXT_SPRINT_TASKS.md": "BLUEPRINT/DROPi_NEXT_SPRINT_TASKS.md",
    "09_Reference/Deployment/ADMIN_PROVISIONING.md": "docs/ADMIN_PROVISIONING.md",
    "09_Reference/Historical_RCA/AUTH_PASSWORD_RESET_RCA_2026-07-12.md": "docs/AUTH_PASSWORD_RESET_RCA_2026-07-12.md",
    "09_Reference/Mobile_Setup/MOBILE_FIRST_SETUP.md": "docs/MOBILE_FIRST_SETUP.md",
    "09_Reference/Periodic_Updates/periodic-updates.md": "references/periodic-updates.md",
    "09_Reference/ROADMAP.md": "ROADMAP.md",
    "09_Reference/Testing_Release/Blueprints/BLUEPRINT_TESTING_FORMAT.md": "docs/BLUEPRINT_TESTING_FORMAT.md",
    "09_Reference/Testing_Release/Blueprints/BLUEPRINT_TESTING_REQUIREMENTS.md": "docs/BLUEPRINT_TESTING_REQUIREMENTS.md",
}


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_path(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def is_excluded(path: pathlib.Path) -> bool:
    return any(part in EXCLUDED_DIR_NAMES for part in path.parts)


def extension_for(rel_path: str) -> str:
    p = pathlib.Path(rel_path)
    return p.suffix.lower() if p.suffix else "(none)"


def scan_package(package_root: pathlib.Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for path in sorted(package_root.rglob("*")):
        if not path.is_file() or is_excluded(path):
            continue
        rel = path.relative_to(package_root).as_posix()
        records.append(
            {
                "package_path": rel,
                "package_sha256": sha256_path(path),
                "package_size": path.stat().st_size,
                "extension": extension_for(rel),
            }
        )
    return records


def normalize_text_bytes(data: bytes) -> bytes | None:
    for enc in ("utf-8-sig", "utf-8"):
        try:
            txt = data.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        return None
    normalized = "\n".join(line.rstrip() for line in txt.replace("\r\n", "\n").replace("\r", "\n").split("\n"))
    return normalized.encode("utf-8")


def file_bytes(path: pathlib.Path) -> bytes:
    return path.read_bytes()


def source_exists(source_path: str | None, repo_root: pathlib.Path, zip_paths: set[str]) -> bool:
    if source_path is None:
        return False
    if source_path.startswith("04.zip::"):
        return source_path.split("::", 1)[1] in zip_paths
    return (repo_root / source_path).exists()


def source_sha(source_path: str | None, repo_root: pathlib.Path, zip_sha_by_path: dict[str, str]) -> str | None:
    if source_path is None:
        return None
    if source_path.startswith("04.zip::"):
        return zip_sha_by_path.get(source_path.split("::", 1)[1])
    p = repo_root / source_path
    if p.exists() and p.is_file():
        return sha256_path(p)
    return None


def source_normalized_sha(source_path: str | None, repo_root: pathlib.Path, zip_norm_sha_by_path: dict[str, str | None]) -> str | None:
    if source_path is None:
        return None
    if source_path.startswith("04.zip::"):
        return zip_norm_sha_by_path.get(source_path.split("::", 1)[1])
    p = repo_root / source_path
    if not p.exists() or not p.is_file():
        return None
    nb = normalize_text_bytes(file_bytes(p))
    return sha256_bytes(nb) if nb is not None else None


def class_from_repo_source(source_path: str) -> str:
    if source_path.startswith("canonical/"):
        return "copied_from_active_canonical"
    if source_path.startswith("BLUEPRINT/"):
        return "derived_from_blueprint"
    return "derived_from_root_architecture_or_governance"


def class_from_inventory(source_kind: str, source_path: str) -> str:
    if source_kind == "extracted_docx":
        return "copied_from_extracted_masterplan"
    if source_kind == "zip_markdown":
        return "recovered_directly_from_04_zip"
    if source_kind == "repo_markdown":
        return class_from_repo_source(source_path)
    return "unknown_or_unsupported"


def build_source_indexes(
    repo_root: pathlib.Path,
    inventory: list[dict[str, Any]],
    zip_entries: list[dict[str, Any]],
) -> tuple[dict[str, str], dict[str, str | None], dict[str, set[str]]]:
    zip_sha_by_path: dict[str, str] = {}
    zip_norm_sha_by_path: dict[str, str | None] = {}
    for row in zip_entries:
        if row.get("entry_type") != "file":
            continue
        path = row["path"]
        digest = row.get("sha256")
        if digest:
            zip_sha_by_path[path] = digest
        norm = None
        nt = row.get("normalized_text_sha256")
        if isinstance(nt, str):
            norm = nt
        zip_norm_sha_by_path[path] = norm

    by_sha: dict[str, set[str]] = {}

    def add_source(path: str, digest: str | None) -> None:
        if not digest:
            return
        by_sha.setdefault(digest, set()).add(path)

    for inv in inventory:
        sp = inv["source_path"]
        if sp.startswith("04.zip::"):
            add_source(sp, zip_sha_by_path.get(sp.split("::", 1)[1]))
        else:
            p = repo_root / sp
            add_source(sp, sha256_path(p) if p.exists() and p.is_file() else None)

    for sp in EXTRA_SOURCE_MAP.values():
        p = repo_root / sp
        add_source(sp, sha256_path(p) if p.exists() and p.is_file() else None)

    return zip_sha_by_path, zip_norm_sha_by_path, by_sha


def detect_duplicate_content_groups(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_sha: dict[str, list[str]] = {}
    for r in records:
        by_sha.setdefault(r["package_sha256"], []).append(r["package_path"])
    groups = []
    for digest, paths in sorted(by_sha.items()):
        if len(paths) > 1:
            groups.append({"package_sha256": digest, "package_paths": sorted(paths)})
    return groups


def relation_from_audits(
    package_path: str,
    source_path: str,
    source_kind: str,
    can002_by_local: dict[str, dict[str, Any]],
    can003_by_archive: dict[str, dict[str, Any]],
) -> str | None:
    if source_kind == "extracted_docx":
        mapping = can002_by_local.get(source_path)
        if mapping is None:
            return None
        c = mapping["classification"]
        if c == "exact_path_and_content_match":
            return "copied_byte_identical"
        if c == "content_identical_path_encoding_variant":
            return "copied_with_path_or_filename_variant"
        return "derived_transformation"
    if source_kind == "zip_markdown":
        archive_path = source_path.split("::", 1)[1]
        mapping = can003_by_archive.get(archive_path)
        if mapping is None:
            return None
        c = mapping["classification"]
        if c == "content_identical_path_variant":
            return "copied_with_path_or_filename_variant"
        return "derived_transformation"
    return None


def build_report(repo_root: pathlib.Path, package_root_name: str) -> dict[str, Any]:
    package_root = repo_root / package_root_name
    if not package_root.exists():
        raise FileNotFoundError(f"Package root not found: {package_root}")

    inventory = json.loads((package_root / "09_Reference/Package_Metadata/inventory.json").read_text(encoding="utf-8"))
    by_package_path = {row["package_path"]: row for row in inventory}

    can001 = json.loads((repo_root / "docs/audits/can-001/04_zip_inventory.json").read_text(encoding="utf-8"))
    zip_entries = can001["entries"]
    zip_paths = {row["path"] for row in zip_entries if row.get("entry_type") == "file"}

    can002 = json.loads((repo_root / "docs/audits/can-002/masterplan_comparison.json").read_text(encoding="utf-8"))
    can003 = json.loads((repo_root / "docs/audits/can-003/zip_markdown_inventory.json").read_text(encoding="utf-8"))
    can002_by_local = {row["local"]["repository_path"]: row for row in can002["mappings"]}
    can003_by_archive = {row["archive"]["archive_path"]: row for row in can003["mappings"]}

    zip_sha_by_path, zip_norm_sha_by_path, source_paths_by_sha = build_source_indexes(repo_root, inventory, zip_entries)

    package_files = scan_package(package_root)
    records: list[dict[str, Any]] = []

    for f in package_files:
        package_path = f["package_path"]
        package_sha = f["package_sha256"]
        package_abs = package_root / package_path
        package_norm_sha = None
        pnb = normalize_text_bytes(package_abs.read_bytes())
        if pnb is not None:
            package_norm_sha = sha256_bytes(pnb)

        if package_path in PACKAGE_CONTROL_PATHS:
            record = {
                **f,
                "primary_provenance_class": "package_control_document",
                "derived_status": "package_control",
                "supported": True,
                "source_path": None,
                "source_exists": True,
                "source_sha256": None,
                "content_relation": "package_control_document",
                "matching_method": "package-control classification from CANONICAL_MANIFEST.md",
                "candidate_sources": [],
                "ambiguous_source": False,
                "evidence": "Explicit package-control document at package root.",
                "confidence": "high",
                "unsupported_reason": None,
            }
            records.append(record)
            continue

        source_path: str | None = None
        primary_class = "unknown_or_unsupported"
        matched_via = "none"
        source_kind = ""

        if package_path in by_package_path:
            inv = by_package_path[package_path]
            source_path = inv["source_path"]
            source_kind = inv.get("source_kind", "")
            primary_class = class_from_inventory(source_kind, source_path)
            matched_via = f"inventory.source_kind={source_kind}"
        elif package_path in EXTRA_SOURCE_MAP:
            source_path = EXTRA_SOURCE_MAP[package_path]
            primary_class = class_from_repo_source(source_path)
            source_kind = "supplemental_repo_mapping"
            matched_via = "supplemental_explicit_path_map"
        elif package_path in EXPLICIT_UNSUPPORTED_PATHS:
            source_path = None
            primary_class = "unknown_or_unsupported"
            source_kind = "unsupported"
            matched_via = "explicit_unsupported_allowlist"

        exists = source_exists(source_path, repo_root, zip_paths)
        ssha = source_sha(source_path, repo_root, zip_sha_by_path)
        snorm = source_normalized_sha(source_path, repo_root, zip_norm_sha_by_path)

        candidate_sources = sorted(source_paths_by_sha.get(package_sha, set()))
        if source_path and source_path not in candidate_sources and exists and ssha == package_sha:
            candidate_sources = sorted(candidate_sources + [source_path])

        ambiguous = len(candidate_sources) > 1

        if primary_class == "unknown_or_unsupported":
            record = {
                **f,
                "primary_provenance_class": "unknown_or_unsupported",
                "derived_status": "unsupported",
                "supported": False,
                "source_path": source_path,
                "source_exists": exists,
                "source_sha256": ssha,
                "content_relation": "unsupported",
                "matching_method": matched_via,
                "candidate_sources": candidate_sources,
                "ambiguous_source": ambiguous,
                "evidence": "No deterministic supported provenance mapping with required evidence strength.",
                "confidence": "low",
                "unsupported_reason": "deterministic_source_not_established",
            }
            records.append(record)
            continue

        audit_status = relation_from_audits(package_path, source_path or "", source_kind, can002_by_local, can003_by_archive)

        if exists and ssha == package_sha:
            if audit_status == "copied_with_path_or_filename_variant":
                dstatus = "copied_with_path_or_filename_variant"
                relation = "byte_identical_path_or_filename_variant"
                method = "sha256 equality verified; path/filename variant classification from prior canonical audit"
            else:
                dstatus = "copied_byte_identical"
                relation = "byte_identical"
                method = "sha256 equality comparison between package file and source file"
            confidence = "high"
            unsupported_reason = None
            supported = True
        elif exists and package_norm_sha is not None and snorm is not None and package_norm_sha == snorm:
            dstatus = "normalized_content_equivalent"
            relation = "normalized_text_equivalent"
            method = "normalized text digest comparison after newline/whitespace normalization"
            confidence = "medium"
            unsupported_reason = None
            supported = True
        elif exists:
            dstatus = "derived_transformation"
            relation = "derived_transformation"
            method = "explicit deterministic source mapping with non-identical content digest"
            confidence = "medium"
            unsupported_reason = None
            supported = True
        else:
            dstatus = "unsupported"
            relation = "missing_source"
            method = "source path existence check"
            confidence = "low"
            unsupported_reason = "source_path_missing"
            supported = False

        record = {
            **f,
            "primary_provenance_class": primary_class,
            "derived_status": dstatus,
            "supported": supported,
            "source_path": source_path,
            "source_exists": exists,
            "source_sha256": ssha,
            "content_relation": relation,
            "matching_method": method,
            "candidate_sources": candidate_sources,
            "ambiguous_source": ambiguous,
            "evidence": f"Deterministic mapping via {matched_via}.",
            "confidence": confidence,
            "unsupported_reason": unsupported_reason,
        }
        records.append(record)

    records.sort(key=lambda r: r["package_path"])

    duplicate_groups = detect_duplicate_content_groups(records)
    unsupported_files = [r for r in records if r["derived_status"] == "unsupported"]
    missing_sources = [r for r in records if r["supported"] and not r["source_exists"]]
    ambiguous_sources = [r for r in records if r["ambiguous_source"]]

    counts_by_provenance_class = {k: 0 for k in OFFICIAL_PROVENANCE_CLASSES}
    counts_by_derived_status = {k: 0 for k in OFFICIAL_DERIVED_STATUSES}
    for r in records:
        counts_by_provenance_class[r["primary_provenance_class"]] += 1
        counts_by_derived_status[r["derived_status"]] += 1

    summary = {
        "package_file_count": len(package_files),
        "provenance_record_count": len(records),
        "supported_file_count": sum(1 for r in records if r["supported"]),
        "unsupported_file_count": len(unsupported_files),
        "missing_source_count": len(missing_sources),
        "ambiguous_source_count": len(ambiguous_sources),
        "package_control_count": counts_by_provenance_class["package_control_document"],
        "byte_identical_count": counts_by_derived_status["copied_byte_identical"],
        "path_or_filename_variant_count": counts_by_derived_status["copied_with_path_or_filename_variant"],
        "normalized_equivalent_count": counts_by_derived_status["normalized_content_equivalent"],
        "derived_transformation_count": counts_by_derived_status["derived_transformation"],
        "duplicate_content_group_count": len(duplicate_groups),
    }

    return {
        "schema_version": SCHEMA_VERSION,
        "audit": "CAN-007",
        "package_root": package_root_name,
        "summary": summary,
        "counts_by_provenance_class": counts_by_provenance_class,
        "counts_by_derived_status": counts_by_derived_status,
        "records": records,
        "duplicate_content_groups": duplicate_groups,
        "unsupported_files": [r["package_path"] for r in unsupported_files],
        "missing_sources": [r["package_path"] for r in missing_sources],
        "ambiguous_sources": [r["package_path"] for r in ambiguous_sources],
    }


def build_markdown(report: dict[str, Any]) -> str:
    s = report["summary"]
    lines = [
        "# [CAN-007] Derived Package Provenance Verification",
        "",
        "## Definitions",
        "",
        "- **Supported file**: record with `supported = true` and non-unsupported derived status.",
        "- **Unsupported file**: record with `primary_provenance_class = unknown_or_unsupported` and `derived_status = unsupported`.",
        "- **Package-control document**: one of the four package root control files; always `derived_status = package_control`.",
        "- **Ambiguous source**: multiple equally strong SHA-256 candidate sources retained in sorted `candidate_sources`.",
        "",
        "## Summary",
        "",
        "| Metric | Count |",
        "| --- | ---: |",
    ]
    for key in [
        "package_file_count",
        "provenance_record_count",
        "supported_file_count",
        "unsupported_file_count",
        "missing_source_count",
        "ambiguous_source_count",
        "package_control_count",
        "byte_identical_count",
        "path_or_filename_variant_count",
        "normalized_equivalent_count",
        "derived_transformation_count",
        "duplicate_content_group_count",
    ]:
        lines.append(f"| {key} | {s[key]} |")

    lines.extend(["", "## Counts by provenance class", "", "| Provenance class | Count |", "| --- | ---: |"])
    for k in OFFICIAL_PROVENANCE_CLASSES:
        lines.append(f"| `{k}` | {report['counts_by_provenance_class'][k]} |")

    lines.extend(["", "## Counts by derived status", "", "| Derived status | Count |", "| --- | ---: |"])
    for k in OFFICIAL_DERIVED_STATUSES:
        lines.append(f"| `{k}` | {report['counts_by_derived_status'][k]} |")

    lines.extend(
        [
            "",
            "## Full provenance table (217 files)",
            "",
            "| package_path | package_sha256 | package_size | extension | primary_provenance_class | derived_status | source_path | source_exists | source_sha256 | content_relation | matching_method | candidate_sources | evidence | confidence | unsupported_reason |",
            "| --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
        ]
    )
    for r in report["records"]:
        cands = ", ".join(r["candidate_sources"])
        lines.append(
            "| `{package_path}` | `{package_sha256}` | {package_size} | `{extension}` | `{primary_provenance_class}` | `{derived_status}` | `{source_path}` | `{source_exists}` | `{source_sha256}` | `{content_relation}` | `{matching_method}` | `{candidate_sources}` | {evidence} | `{confidence}` | `{unsupported_reason}` |".format(
                package_path=r["package_path"],
                package_sha256=r["package_sha256"],
                package_size=r["package_size"],
                extension=r["extension"],
                primary_provenance_class=r["primary_provenance_class"],
                derived_status=r["derived_status"],
                source_path=r["source_path"] if r["source_path"] is not None else "null",
                source_exists=str(r["source_exists"]).lower(),
                source_sha256=r["source_sha256"] if r["source_sha256"] is not None else "null",
                content_relation=r["content_relation"],
                matching_method=r["matching_method"],
                candidate_sources=cands,
                evidence=r["evidence"].replace("|", "\\|"),
                confidence=r["confidence"],
                unsupported_reason=r["unsupported_reason"] if r["unsupported_reason"] is not None else "null",
            )
        )

    lines.extend(["", "## Unsupported files", ""])
    if report["unsupported_files"]:
        for p in report["unsupported_files"]:
            lines.append(f"- `{p}`")
    else:
        lines.append("- None")

    lines.extend(["", "## Missing sources", ""])
    if report["missing_sources"]:
        for p in report["missing_sources"]:
            lines.append(f"- `{p}`")
    else:
        lines.append("- None")

    lines.extend(["", "## Ambiguous sources", ""])
    if report["ambiguous_sources"]:
        for p in report["ambiguous_sources"]:
            lines.append(f"- `{p}`")
    else:
        lines.append("- None")

    lines.extend(["", "## Duplicate-content groups", ""])
    if report["duplicate_content_groups"]:
        for g in report["duplicate_content_groups"]:
            lines.append(f"- SHA256 `{g['package_sha256']}`")
            for p in g["package_paths"]:
                lines.append(f"  - `{p}`")
    else:
        lines.append("- None")

    lines.extend(
        [
            "",
            "## No-mutation statement",
            "",
            "Generation is read-only for `04.zip`, `canonical/`, `BLUEPRINT/`, and `DROPi_Canonical_Reference/`; only CAN-007 outputs are written.",
        ]
    )

    return "\n".join(lines) + "\n"


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="CAN-007 derived package provenance verifier")
    parser.add_argument("--repo-root", default=str(DEFAULT_REPO_ROOT))
    parser.add_argument("--package-root", default=DEFAULT_PACKAGE_ROOT)
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv if argv is not None else [])
    repo_root = pathlib.Path(args.repo_root).resolve()
    report = build_report(repo_root=repo_root, package_root_name=args.package_root)

    output_dir = (repo_root / args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    json_path = output_dir / "derived_package_provenance.json"
    md_path = output_dir / "derived_package_provenance.md"

    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    md_path.write_text(build_markdown(report), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
