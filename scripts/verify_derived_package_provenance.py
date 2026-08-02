#!/usr/bin/env python3
"""CAN-007 — verify provenance of every derived package file."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
from typing import Any

SCHEMA_VERSION = 1
DEFAULT_REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_PACKAGE_ROOT = "DROPi_Canonical_Reference"
DEFAULT_OUTPUT_DIR = "docs/audits/can-007"

EXCLUDED_DIR_NAMES = {".git", "node_modules", "__pycache__", ".cache", "coverage", "dist", "build"}

PACKAGE_CONTROL_PATHS = {
    "README_FOR_DROPi_TYCOON.md",
    "CANONICAL_KNOWLEDGE_INDEX.md",
    "CANONICAL_MANIFEST.md",
    "AI_CANONICAL_REFERENCE_AUDIT_REPORT.md",
}

UNSUPPORTED_PATHS = {
    "AI_CANONICAL_REFERENCE_AUDIT_REPORT.md",
    "CANONICAL_KNOWLEDGE_INDEX.md",
    "CANONICAL_MANIFEST.md",
    "README_FOR_DROPi_TYCOON.md",
    "09_Reference/Package_Metadata/inventory.json",
    "00_Project/Status_Reports/AUDIT_TRACKING.md",
    "00_Project/Status_Reports/SESSION_STATE.md",
}

EXTRA_SOURCE_MAP = {
    "00_Project/Decision_Log/DECISION_LOG.md": "DECISION_LOG.md",
    "00_Project/Sprint_Specs/SPRINT_1_2_SPEC.md": "SPRINT_1_2_SPEC.md",
    "00_Project/Status_Reports/DROPI_STATUS_REPORT_2026-06-30.md": "DROPI_STATUS_REPORT_2026-06-30.md",
    "02_Architecture/Design/design.md": "design.md",
    "03_Logistics/Delivery_Reference/canonical-delivery-reference.md": "canonical-delivery-reference.md",
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


def sha256_path(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def is_excluded(path: pathlib.Path) -> bool:
    return any(part in EXCLUDED_DIR_NAMES for part in path.parts)


def scan_package(package_root: pathlib.Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for path in sorted(package_root.rglob("*")):
        if not path.is_file() or is_excluded(path):
            continue
        rel = path.relative_to(package_root).as_posix()
        records.append({
            "package_path": rel,
            "sha256": sha256_path(path),
            "size": path.stat().st_size,
        })
    return records


def _source_exists(source_path: str | None, repo_root: pathlib.Path, zip_paths: set[str]) -> bool:
    if not source_path:
        return True
    if source_path.startswith("04.zip::"):
        return source_path.split("::", 1)[1] in zip_paths
    return (repo_root / source_path).exists()


def _class_from_repo_source(source_path: str) -> str:
    if source_path.startswith("canonical/"):
        return "copied_from_active_canonical"
    if source_path.startswith("BLUEPRINT/"):
        return "derived_from_blueprint"
    return "derived_from_root_architecture_governance"


def _class_from_inventory(source_kind: str, source_path: str) -> str:
    if source_kind == "extracted_docx":
        return "copied_from_extracted_masterplan_corpus"
    if source_kind == "zip_markdown":
        return "recovered_directly_from_04_zip"
    if source_kind == "repo_markdown":
        return _class_from_repo_source(source_path)
    return "unknown_or_unsupported"


def build_report(repo_root: pathlib.Path, package_root_name: str) -> dict[str, Any]:
    package_root = repo_root / package_root_name
    if not package_root.exists():
        raise FileNotFoundError(f"Package root not found: {package_root}")

    inventory = json.loads((package_root / "09_Reference/Package_Metadata/inventory.json").read_text(encoding="utf-8"))
    by_package_path = {row["package_path"]: row for row in inventory}

    zip_entries = json.loads((repo_root / "docs/audits/can-001/04_zip_inventory.json").read_text(encoding="utf-8"))["entries"]
    zip_paths = {row["path"] for row in zip_entries}

    package_files = scan_package(package_root)
    provenance_records: list[dict[str, Any]] = []

    for f in package_files:
        rel = f["package_path"]

        if rel in UNSUPPORTED_PATHS:
            pclass = "package_control_document" if rel in PACKAGE_CONTROL_PATHS else "unknown_or_unsupported"
            provenance_records.append(
                {
                    **f,
                    "provenance_class": pclass,
                    "supported": False,
                    "source_path": None,
                    "source_exists": True,
                    "ambiguous_source": False,
                    "evidence": "No deterministic external source-of-truth path; marked unsupported.",
                }
            )
            continue

        if rel in by_package_path:
            row = by_package_path[rel]
            source_path = row["source_path"]
            pclass = _class_from_inventory(row.get("source_kind", ""), source_path)
            source_exists = _source_exists(source_path, repo_root, zip_paths)
            supported = pclass != "unknown_or_unsupported" and source_exists
            provenance_records.append(
                {
                    **f,
                    "provenance_class": pclass,
                    "supported": supported,
                    "source_path": source_path,
                    "source_exists": source_exists,
                    "ambiguous_source": False,
                    "evidence": f"Mapped from inventory.json source_kind={row.get('source_kind', '')}.",
                }
            )
            continue

        source_path = EXTRA_SOURCE_MAP.get(rel)
        if source_path is None:
            provenance_records.append(
                {
                    **f,
                    "provenance_class": "unknown_or_unsupported",
                    "supported": False,
                    "source_path": None,
                    "source_exists": True,
                    "ambiguous_source": False,
                    "evidence": "No deterministic mapping rule matched this package path.",
                }
            )
            continue

        source_exists = _source_exists(source_path, repo_root, zip_paths)
        pclass = _class_from_repo_source(source_path)
        supported = source_exists
        provenance_records.append(
            {
                **f,
                "provenance_class": pclass,
                "supported": supported,
                "source_path": source_path,
                "source_exists": source_exists,
                "ambiguous_source": False,
                "evidence": "Mapped from explicit CAN-007 supplemental mapping for post-inventory package additions.",
            }
        )

    provenance_records.sort(key=lambda x: x["package_path"])

    summary = {
        "package_files": len(package_files),
        "provenance_records": len(provenance_records),
        "supported": sum(1 for r in provenance_records if r["supported"]),
        "unsupported": sum(1 for r in provenance_records if not r["supported"]),
        "missing_sources": sum(1 for r in provenance_records if r["supported"] and not r["source_exists"]),
        "ambiguous_sources": sum(1 for r in provenance_records if r["ambiguous_source"]),
        "package_control": sum(1 for r in provenance_records if r["provenance_class"] == "package_control_document"),
    }

    return {
        "schema_version": SCHEMA_VERSION,
        "audit": "CAN-007",
        "package_root": package_root_name,
        "summary": summary,
        "records": provenance_records,
    }


def build_markdown(report: dict[str, Any]) -> str:
    s = report["summary"]
    unsupported = [r for r in report["records"] if not r["supported"]]
    lines = [
        "# [CAN-007] Derived Package Provenance Verification",
        "",
        "## Summary",
        "",
        "| Metric | Count |",
        "| --- | ---: |",
        f"| Package files | {s['package_files']} |",
        f"| Provenance records | {s['provenance_records']} |",
        f"| Supported | {s['supported']} |",
        f"| Unsupported | {s['unsupported']} |",
        f"| Missing sources | {s['missing_sources']} |",
        f"| Ambiguous sources | {s['ambiguous_sources']} |",
        f"| Package control | {s['package_control']} |",
        "",
        "## Unsupported files",
        "",
        "| Package path | Provenance class |",
        "| --- | --- |",
    ]
    for row in unsupported:
        lines.append(f"| `{row['package_path']}` | `{row['provenance_class']}` |")
    return "\n".join(lines) + "\n"


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="CAN-007 derived package provenance verifier")
    parser.add_argument("--repo-root", default=str(DEFAULT_REPO_ROOT))
    parser.add_argument("--package-root", default=DEFAULT_PACKAGE_ROOT)
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR)
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
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
    raise SystemExit(main([]))
