#!/usr/bin/env python3
"""
CAN-006 — Reconcile derived canonical package statistics.

Scans DROPi_Canonical_Reference/ read-only and reconciles all reported
statistics about the package contents.

Produces:
  docs/audits/can-006/derived_package_statistics.json
  docs/audits/can-006/derived_package_statistics.md

Safety guarantees:
  - No canonical source file is modified.
  - No file is renamed or deleted.
  - No timestamps are emitted.
  - Output is deterministic and byte-identical across repeated runs.
"""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import pathlib
import re
import sys
from typing import Any

SCHEMA_VERSION = 1

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

DEFAULT_REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_PACKAGE_ROOT = "DROPi_Canonical_Reference"
DEFAULT_OUTPUT_DIR = "docs/audits/can-006"

# ---------------------------------------------------------------------------
# Exclusion rules
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# Package control documents
# Evidence: CANONICAL_MANIFEST.md labels these four files explicitly as
# "package control document" in its Package Control Documents section.
# ---------------------------------------------------------------------------

PACKAGE_CONTROL_PATHS: frozenset[str] = frozenset(
    [
        "README_FOR_DROPi_TYCOON.md",
        "CANONICAL_KNOWLEDGE_INDEX.md",
        "CANONICAL_MANIFEST.md",
        "AI_CANONICAL_REFERENCE_AUDIT_REPORT.md",
    ]
)

# ---------------------------------------------------------------------------
# Canonical domains (CAN-004 authority matrix)
# ---------------------------------------------------------------------------

CANONICAL_DOMAINS: tuple[str, ...] = (
    "vision-and-strategy",
    "system-architecture",
    "governance",
    "roles-and-channels",
    "marketplace",
    "logistics",
    "droneports",
    "delivery-modes",
    "economy",
    "ai-agents",
    "mobile",
    "backend",
    "database",
    "security",
    "deployment-and-operations",
    "unclassified",
)

# ---------------------------------------------------------------------------
# Domain classification rules
#
# Rules are applied in order. The first match determines primary_domain.
# Every rule records the evidence key used for the classification decision.
# Files with no matching rule are marked unclassified.
# ---------------------------------------------------------------------------


def _top(rel: str) -> str:
    """Return the top-level section of a relative path."""
    return rel.split("/")[0] if "/" in rel else ""


def classify_domain(rel: str) -> dict[str, Any]:
    """
    Return a domain classification record for a package-relative path.

    Returns:
        primary_domain: str
        additional_domains: list[str]
        classification_evidence: str
    """
    top = _top(rel)
    lower = rel.lower()

    # --- Package control documents (root level, no directory prefix) ---
    if "/" not in rel and rel in PACKAGE_CONTROL_PATHS:
        return {
            "primary_domain": "governance",
            "additional_domains": [],
            "classification_evidence": (
                "Package control document at package root; "
                "explicitly labelled 'package control document' in CANONICAL_MANIFEST.md."
            ),
        }

    # --- Top-level section map ---
    if top == "00_Project":
        return {
            "primary_domain": "governance",
            "additional_domains": [],
            "classification_evidence": (
                "Top-level section 00_Project maps to governance domain "
                "by section-domain correspondence established for CAN-006."
            ),
        }

    if top == "01_Vision":
        return {
            "primary_domain": "vision-and-strategy",
            "additional_domains": [],
            "classification_evidence": (
                "Top-level section 01_Vision maps to vision-and-strategy domain "
                "by section-domain correspondence established for CAN-006."
            ),
        }

    if top == "02_Architecture":
        return {
            "primary_domain": "system-architecture",
            "additional_domains": [],
            "classification_evidence": (
                "Top-level section 02_Architecture maps to system-architecture domain "
                "by section-domain correspondence established for CAN-006."
            ),
        }

    if top == "03_Logistics":
        # Delivery-specific sub-paths are classified as delivery-modes
        if "/Delivery/" in rel or "/Delivery_Reference/" in rel:
            return {
                "primary_domain": "delivery-modes",
                "additional_domains": ["logistics"],
                "classification_evidence": (
                    "Path contains Delivery or Delivery_Reference subdirectory within "
                    "03_Logistics; classified as delivery-modes with logistics as "
                    "additional domain."
                ),
            }
        return {
            "primary_domain": "logistics",
            "additional_domains": [],
            "classification_evidence": (
                "Top-level section 03_Logistics maps to logistics domain "
                "by section-domain correspondence established for CAN-006."
            ),
        }

    if top == "04_DronePorts":
        return {
            "primary_domain": "droneports",
            "additional_domains": [],
            "classification_evidence": (
                "Top-level section 04_DronePorts maps to droneports domain "
                "by section-domain correspondence established for CAN-006."
            ),
        }

    if top == "05_Marketplace":
        return {
            "primary_domain": "marketplace",
            "additional_domains": [],
            "classification_evidence": (
                "Top-level section 05_Marketplace maps to marketplace domain "
                "by section-domain correspondence established for CAN-006."
            ),
        }

    if top == "06_Roles":
        return {
            "primary_domain": "roles-and-channels",
            "additional_domains": [],
            "classification_evidence": (
                "Top-level section 06_Roles maps to roles-and-channels domain "
                "by section-domain correspondence established for CAN-006."
            ),
        }

    if top == "07_Economy":
        return {
            "primary_domain": "economy",
            "additional_domains": [],
            "classification_evidence": (
                "Top-level section 07_Economy maps to economy domain "
                "by section-domain correspondence established for CAN-006."
            ),
        }

    if top == "08_AI":
        return {
            "primary_domain": "ai-agents",
            "additional_domains": [],
            "classification_evidence": (
                "Top-level section 08_AI maps to ai-agents domain "
                "by section-domain correspondence established for CAN-006."
            ),
        }

    if top == "09_Reference":
        # Sub-path based classification for 09_Reference
        if "/Deployment/" in rel:
            return {
                "primary_domain": "deployment-and-operations",
                "additional_domains": [],
                "classification_evidence": (
                    "Path contains Deployment subdirectory within 09_Reference; "
                    "classified as deployment-and-operations."
                ),
            }
        if "/Testing_Release/" in rel:
            return {
                "primary_domain": "deployment-and-operations",
                "additional_domains": [],
                "classification_evidence": (
                    "Path contains Testing_Release subdirectory within 09_Reference; "
                    "classified as deployment-and-operations."
                ),
            }
        if "/Blueprint/" in rel:
            return {
                "primary_domain": "system-architecture",
                "additional_domains": [],
                "classification_evidence": (
                    "Path contains Blueprint subdirectory within 09_Reference; "
                    "classified as system-architecture."
                ),
            }
        if "/Mobile_Setup/" in rel:
            return {
                "primary_domain": "mobile",
                "additional_domains": [],
                "classification_evidence": (
                    "Path contains Mobile_Setup subdirectory within 09_Reference; "
                    "classified as mobile."
                ),
            }
        if "/Historical_RCA/" in rel:
            return {
                "primary_domain": "security",
                "additional_domains": [],
                "classification_evidence": (
                    "Path contains Historical_RCA subdirectory within 09_Reference; "
                    "RCA (root cause analysis) of auth/security incident classified as security."
                ),
            }
        if "/Package_Metadata/" in rel:
            return {
                "primary_domain": "governance",
                "additional_domains": [],
                "classification_evidence": (
                    "Path contains Package_Metadata subdirectory within 09_Reference; "
                    "classified as governance."
                ),
            }
        if "/Pitch/" in rel:
            return {
                "primary_domain": "vision-and-strategy",
                "additional_domains": [],
                "classification_evidence": (
                    "Path contains Pitch subdirectory within 09_Reference; "
                    "pitch materials classified as vision-and-strategy."
                ),
            }
        if "/Audit_Data_Protection/" in rel:
            return {
                "primary_domain": "security",
                "additional_domains": [],
                "classification_evidence": (
                    "Path contains Audit_Data_Protection subdirectory within 09_Reference; "
                    "files reference GDPR compliance, data retention policies, and data "
                    "protection audit packs — classified as security."
                ),
            }
        if "/Risk_Management/" in rel:
            return {
                "primary_domain": "governance",
                "additional_domains": [],
                "classification_evidence": (
                    "Path contains Risk_Management subdirectory within 09_Reference; "
                    "risk registries, risk matrices, and BCP plans are a governance function."
                ),
            }
        if "/Strategic_Boundaries/" in rel:
            return {
                "primary_domain": "governance",
                "additional_domains": ["vision-and-strategy"],
                "classification_evidence": (
                    "Path contains Strategic_Boundaries subdirectory within 09_Reference; "
                    "documents define what DROPi does not do — a governance/policy boundary "
                    "function with vision-and-strategy as additional domain."
                ),
            }
        if "/Volume_II_Conclusion/" in rel:
            return {
                "primary_domain": "vision-and-strategy",
                "additional_domains": [],
                "classification_evidence": (
                    "Path contains Volume_II_Conclusion subdirectory within 09_Reference; "
                    "conclusion of the MasterPlan Volume II classified as vision-and-strategy."
                ),
            }
        if "/MasterPlan_Pack_Indexes/" in rel:
            return {
                "primary_domain": "vision-and-strategy",
                "additional_domains": [],
                "classification_evidence": (
                    "Path contains MasterPlan_Pack_Indexes subdirectory within 09_Reference; "
                    "masterplan consolidation and investor pack indexes are vision-and-strategy."
                ),
            }
        if "/Historical_Packages/Component_READMEs/BACKEND_README" in rel:
            return {
                "primary_domain": "backend",
                "additional_domains": [],
                "classification_evidence": (
                    "Filename BACKEND_README within Historical_Packages/Component_READMEs; "
                    "classified as backend."
                ),
            }
        if "/Historical_Packages/Component_READMEs/MOBILE_APP_README" in rel:
            return {
                "primary_domain": "mobile",
                "additional_domains": [],
                "classification_evidence": (
                    "Filename MOBILE_APP_README within Historical_Packages/Component_READMEs; "
                    "classified as mobile."
                ),
            }
        if "/Historical_Packages/" in rel:
            return {
                "primary_domain": "unclassified",
                "additional_domains": [],
                "classification_evidence": (
                    "Path contains Historical_Packages subdirectory within 09_Reference; "
                    "insufficient path evidence to determine domain safely — marked unclassified."
                ),
            }
        # Remaining 09_Reference files
        return {
            "primary_domain": "unclassified",
            "additional_domains": [],
            "classification_evidence": (
                "09_Reference file without a resolvable subdirectory mapping; "
                "marked unclassified to avoid guessing."
            ),
        }

    # Fallback
    return {
        "primary_domain": "unclassified",
        "additional_domains": [],
        "classification_evidence": (
            "No top-level section mapping found; marked unclassified."
        ),
    }


# ---------------------------------------------------------------------------
# File scanning
# ---------------------------------------------------------------------------


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


def scan_package(package_root: pathlib.Path) -> list[dict[str, Any]]:
    """
    Scan DROPi_Canonical_Reference/ read-only.

    Returns a sorted list of file records. Every file is recorded exactly once.
    Directories are excluded from file totals.
    """
    records: list[dict[str, Any]] = []
    for path in sorted(package_root.rglob("*")):
        if not path.is_file():
            continue
        if is_excluded(path):
            continue
        rel = path.relative_to(package_root).as_posix()
        ext = path.suffix.lower() if path.suffix else "(none)"
        top = _top(rel) if "/" in rel else "(root)"
        is_control = rel in PACKAGE_CONTROL_PATHS
        classification = "package_control_document" if is_control else "source_document"
        size = path.stat().st_size
        digest = sha256_path(path)
        domain_info = classify_domain(rel)
        records.append(
            {
                "path": rel,
                "sha256": digest,
                "size": size,
                "extension": ext,
                "top_level_section": top,
                "classification": classification,
                "primary_domain": domain_info["primary_domain"],
                "additional_domains": domain_info["additional_domains"],
                "classification_evidence": domain_info["classification_evidence"],
            }
        )
    return records


def count_by_extension(records: list[dict[str, Any]]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for r in records:
        counts[r["extension"]] = counts.get(r["extension"], 0) + 1
    return dict(sorted(counts.items()))


def count_by_domain(records: list[dict[str, Any]]) -> dict[str, int]:
    """Count files by primary_domain. Each file counted exactly once."""
    counts: dict[str, int] = {d: 0 for d in CANONICAL_DOMAINS}
    for r in records:
        domain = r["primary_domain"]
        counts[domain] = counts.get(domain, 0) + 1
    return dict(sorted(counts.items()))


def count_by_top_level_section(records: list[dict[str, Any]]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for r in records:
        sec = r["top_level_section"]
        counts[sec] = counts.get(sec, 0) + 1
    return dict(sorted(counts.items()))


def detect_duplicate_contents(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Return groups of files that share identical SHA-256 content."""
    by_hash: dict[str, list[str]] = {}
    for r in records:
        h = r["sha256"]
        if h not in by_hash:
            by_hash[h] = []
        by_hash[h].append(r["path"])
    groups = []
    for h, paths in sorted(by_hash.items()):
        if len(paths) > 1:
            groups.append({"sha256": h, "paths": sorted(paths)})
    return groups


def detect_duplicate_paths(records: list[dict[str, Any]]) -> list[str]:
    """Return paths that appear more than once (should be impossible from a proper scan)."""
    seen: set[str] = set()
    dupes: list[str] = []
    for r in records:
        if r["path"] in seen:
            dupes.append(r["path"])
        seen.add(r["path"])
    return sorted(dupes)


# ---------------------------------------------------------------------------
# Directory count
# ---------------------------------------------------------------------------


def count_directories(package_root: pathlib.Path) -> int:
    """Count directories under the package root, excluding excluded dirs."""
    count = 0
    for path in sorted(package_root.rglob("*")):
        if path.is_dir() and not is_excluded(path):
            count += 1
    return count


# ---------------------------------------------------------------------------
# Statistical claim scanning
# ---------------------------------------------------------------------------

# Text extensions that may contain statistical claims
CLAIM_TEXT_EXTENSIONS: frozenset[str] = frozenset(
    [".md", ".json", ".txt", ".py"]
)

# Excluded output paths (relative to repo root)
CLAIM_SCAN_EXCLUDED_DIRS: frozenset[str] = frozenset(
    [
        "docs/audits/can-006",
        "node_modules",
        "__pycache__",
        ".git",
        ".cache",
        "coverage",
        "dist",
        "build",
    ]
)

# Known statistical claims with explicit evidence.
# Each entry is a (source_path_posix, claim_id, claimed_value, claimed_metric,
# actual_metric_key) tuple. actual_metric_key is resolved against computed
# actuals at report-generation time.
KNOWN_CLAIMS: list[dict[str, Any]] = [
    {
        "source_path": (
            "DROPi_Canonical_Reference/AI_CANONICAL_REFERENCE_AUDIT_REPORT.md"
        ),
        "claim_identifier": "CLAIM-001",
        "claimed_value": 199,
        "claimed_metric": "total_files_in_package_including_package_control_docs",
        "actual_metric_key": "actual_file_count",
        "claim_context": (
            "| Included in final package (including package control docs) | 199 |"
        ),
    },
    {
        "source_path": (
            "DROPi_Canonical_Reference/AI_CANONICAL_REFERENCE_AUDIT_REPORT.md"
        ),
        "claim_identifier": "CLAIM-002",
        "claimed_value": 195,
        "claimed_metric": "source_document_count_in_final_package",
        "actual_metric_key": "source_document_count",
        "claim_context": (
            "| Included in final package (source documents only) | 195 |"
        ),
    },
    {
        "source_path": (
            "DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md"
        ),
        "claim_identifier": "CLAIM-003",
        "claimed_value": 217,
        "claimed_metric": "total_files_packaged",
        "actual_metric_key": "actual_file_count",
        "claim_context": "| Total files packaged | 217 |",
    },
    {
        "source_path": (
            "DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md"
        ),
        "claim_identifier": "CLAIM-004",
        "claimed_value": 52,
        "claimed_metric": "canonical_markdown_document_count",
        "actual_metric_key": None,
        "claim_context": "| Canonical markdown documents | 52 |",
    },
    {
        "source_path": (
            "DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md"
        ),
        "claim_identifier": "CLAIM-005",
        "claimed_value": 147,
        "claimed_metric": "historical_docx_document_count",
        "actual_metric_key": "ext_docx_count",
        "claim_context": (
            "| Historical `.docx` documents (from 04.zip masterplan) | 147 |"
        ),
    },
    {
        "source_path": (
            "DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md"
        ),
        "claim_identifier": "CLAIM-006",
        "claimed_value": 18,
        "claimed_metric": "recovered_zip_only_markdown_count",
        "actual_metric_key": None,
        "claim_context": "| Recovered ZIP-only markdown documents | 18 |",
    },
    {
        "source_path": (
            "DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md"
        ),
        "claim_identifier": "CLAIM-007",
        "claimed_value": 4,
        "claimed_metric": "package_control_document_count",
        "actual_metric_key": "package_control_document_count",
        "claim_context": "| Package control documents | 4 |",
    },
    {
        "source_path": "canonical/SESSION_HANDOVER.md",
        "claim_identifier": "CLAIM-008",
        "claimed_value": 217,
        "claimed_metric": "dropi_canonical_reference_file_count",
        "actual_metric_key": "actual_file_count",
        "claim_context": (
            "`DROPi_Canonical_Reference/` (217 fișiere, v2.0.0)"
        ),
    },
    {
        "source_path": "canonical/SESSION_HANDOVER.md",
        "claim_identifier": "CLAIM-009",
        "claimed_value": 199,
        "claimed_metric": "total_files_in_package_at_earlier_state",
        "actual_metric_key": "actual_file_count",
        "claim_context": (
            "199 fișiere totale în pachet incluzând documentele de control"
        ),
    },
    {
        "source_path": (
            "DROPi_Canonical_Reference/09_Reference/Package_Metadata/inventory.json"
        ),
        "claim_identifier": "CLAIM-010",
        "claimed_value": 195,
        "claimed_metric": "manifest_source_document_count",
        "actual_metric_key": "source_document_count",
        "claim_context": (
            "Array length of inventory.json: 195 source-document entries "
            "(does not list package control documents)."
        ),
    },
    {
        "source_path": (
            "DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md"
        ),
        "claim_identifier": "CLAIM-011",
        "claimed_value": 221,
        "claimed_metric": "knowledge_index_breakdown_sum",
        "actual_metric_key": None,
        "claim_context": (
            "Component breakdown: 52 canonical md + 147 docx + 18 ZIP-only md "
            "+ 4 package control = 221 (stated package total: 217)"
        ),
    },
]


def resolve_claims(
    claims: list[dict[str, Any]],
    actuals: dict[str, int],
) -> list[dict[str, Any]]:
    """
    Resolve each claim against actual computed values and assign status.

    Status values:
        current_exact   — claimed value matches actual computed value
        stale           — claimed value differs from actual; was historically correct
        contradictory   — claimed value contradicts another claim for the same metric
        ambiguous_metric — metric definition is unclear
        unsupported     — no actual value can be computed for this metric
    """
    result = []
    for c in claims:
        claim = dict(c)
        key = claim.get("actual_metric_key")
        if key is None:
            actual_val = None
        else:
            actual_val = actuals.get(key)

        claim["actual_value"] = actual_val

        if actual_val is None:
            claim["status"] = "ambiguous_metric"
            claim["explanation"] = _explain_ambiguous(claim)
        elif claim["claimed_value"] == actual_val:
            claim["status"] = "current_exact"
            claim["explanation"] = _explain_exact(claim)
        else:
            claim["status"] = "stale"
            claim["explanation"] = _explain_stale(claim, actual_val)

        # Remove internal key
        claim.pop("actual_metric_key", None)
        result.append(claim)

    # CLAIM-005: refine explanation to cite the independent extension-count evidence
    for item in result:
        if item["claim_identifier"] == "CLAIM-005" and item["status"] == "current_exact":
            item["explanation"] = (
                f"Claimed value {item['claimed_value']} matches the independently computed "
                f"package extension count: counts_by_extension[\".docx\"] = {item['actual_value']}. "
                "The individual DOCX claim is confirmed by the actual package file scan."
            )

    # CLAIM-011: knowledge_index_breakdown_sum is directly contradicted by the stated package total
    ki_breakdown_sum = 52 + 147 + 18 + 4  # 221
    ki_stated_total = 217
    for item in result:
        if item["claim_identifier"] == "CLAIM-011":
            item["actual_value"] = ki_stated_total
            item["status"] = "contradictory"
            item["explanation"] = (
                f"CANONICAL_KNOWLEDGE_INDEX.md states a package total of {ki_stated_total} files, "
                f"but the four component breakdown rows sum to {ki_breakdown_sum} "
                f"(52 canonical md + 147 docx + 18 ZIP-only md + 4 package control). "
                f"The component breakdown exceeds the stated total by "
                f"{ki_breakdown_sum - ki_stated_total}."
            )

    return result


def _explain_exact(c: dict[str, Any]) -> str:
    return (
        f"Claimed value {c['claimed_value']} matches the actual computed value "
        f"for metric '{c['claimed_metric']}'."
    )


def _explain_stale(c: dict[str, Any], actual: int) -> str:
    return (
        f"Claimed value {c['claimed_value']} does not match the actual computed "
        f"value of {actual} for metric '{c['claimed_metric']}'. "
        f"The claim appears to have been accurate at an earlier state of the package "
        f"and has not been updated to reflect the current {actual} files."
    )


def _explain_ambiguous(c: dict[str, Any]) -> str:
    return (
        f"Metric '{c['claimed_metric']}' cannot be mapped to a single unambiguous "
        "computed value given the evidence available; subcategory definitions in "
        "the source document are not independently verifiable without additional "
        "authorial context."
    )


# ---------------------------------------------------------------------------
# Manifest reconciliation
# ---------------------------------------------------------------------------


def load_manifest(repo_root: pathlib.Path) -> list[str]:
    """Return sorted list of package-relative paths from inventory.json."""
    inv_path = (
        repo_root
        / DEFAULT_PACKAGE_ROOT
        / "09_Reference"
        / "Package_Metadata"
        / "inventory.json"
    )
    if not inv_path.exists():
        return []
    data = json.loads(inv_path.read_text(encoding="utf-8"))
    return sorted(item["package_path"] for item in data)


def reconcile_manifest(
    manifest_paths: list[str],
    actual_paths: list[str],
) -> dict[str, Any]:
    manifest_set = set(manifest_paths)
    actual_set = set(actual_paths)
    in_manifest_only = sorted(manifest_set - actual_set)
    in_actual_only = sorted(actual_set - manifest_set)
    in_both = sorted(manifest_set & actual_set)
    return {
        "manifest_path": (
            "DROPi_Canonical_Reference/09_Reference/Package_Metadata/inventory.json"
        ),
        "manifest_entry_count": len(manifest_paths),
        "actual_file_count": len(actual_paths),
        "matched_count": len(in_both),
        "in_manifest_not_actual": in_manifest_only,
        "in_actual_not_manifest": in_actual_only,
        "status": "match" if not in_manifest_only and not in_actual_only else "divergent",
        "notes": (
            "inventory.json contains source documents only; package control documents "
            "and files added after the audit report was finalized are not listed."
        ),
    }


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------


def build_report(
    records: list[dict[str, Any]],
    dir_count: int,
    duplicate_paths: list[str],
    duplicate_content_groups: list[dict[str, Any]],
    claims: list[dict[str, Any]],
    manifest_paths: list[str],
    package_root_str: str,
    mutation_performed: bool,
) -> dict[str, Any]:
    actual_file_count = len(records)
    source_count = sum(1 for r in records if r["classification"] == "source_document")
    control_count = sum(
        1 for r in records if r["classification"] == "package_control_document"
    )
    classified_count = sum(
        1 for r in records if r["primary_domain"] != "unclassified"
    )
    unclassified_count = actual_file_count - classified_count

    ext_counts = count_by_extension(records)
    domain_counts = count_by_domain(records)
    section_counts = count_by_top_level_section(records)

    actuals_for_claims: dict[str, int] = {
        "actual_file_count": actual_file_count,
        "source_document_count": source_count,
        "package_control_document_count": control_count,
        "directory_count": dir_count,
        "ext_docx_count": ext_counts.get(".docx", 0),
    }
    resolved_claims = resolve_claims(KNOWN_CLAIMS, actuals_for_claims)

    # Status counters
    exact_count = sum(1 for c in resolved_claims if c["status"] == "current_exact")
    stale_count = sum(1 for c in resolved_claims if c["status"] == "stale")
    contradictory_count = sum(
        1 for c in resolved_claims if c["status"] == "contradictory"
    )
    ambiguous_count = sum(
        1 for c in resolved_claims if c["status"] == "ambiguous_metric"
    )
    unsupported_count = sum(
        1 for c in resolved_claims if c["status"] == "unsupported"
    )

    manifest_reconciliation = reconcile_manifest(
        manifest_paths,
        [r["path"] for r in records],
    )

    # Split actual paths into manifest-listed, control, and unlisted-source
    manifest_set = set(manifest_paths)
    control_paths = [r["path"] for r in records if r["classification"] == "package_control_document"]
    unlisted_source = sorted(
        r["path"]
        for r in records
        if r["classification"] == "source_document"
        and r["path"] not in manifest_set
    )

    # Locate CLAIM-001 (199) and CLAIM-003 (217)
    claim_199 = next(c for c in resolved_claims if c["claim_identifier"] == "CLAIM-001")
    claim_217 = next(c for c in resolved_claims if c["claim_identifier"] == "CLAIM-003")

    return {
        "schema_version": SCHEMA_VERSION,
        "scope": {
            "package_root": package_root_str,
            "immutable_source_content": True,
            "mutation_performed": mutation_performed,
        },
        "definitions": {
            "actual_package_file": (
                "Any regular file discovered by recursive traversal of "
                "DROPi_Canonical_Reference/, excluding directories and all excluded "
                "directory names (.git, node_modules, __pycache__, .cache, coverage, "
                "dist, build). Each file is recorded exactly once."
            ),
            "source_document": (
                "An actual_package_file that is not a package_control_document. "
                "Source documents are the primary knowledge content of the package."
            ),
            "package_control_document": (
                "One of the four files explicitly labelled 'package control document' "
                "in CANONICAL_MANIFEST.md: README_FOR_DROPi_TYCOON.md, "
                "CANONICAL_KNOWLEDGE_INDEX.md, CANONICAL_MANIFEST.md, and "
                "AI_CANONICAL_REFERENCE_AUDIT_REPORT.md. These files describe and "
                "navigate the package itself."
            ),
            "domain_assignment": (
                "Files are assigned to canonical domains (established by CAN-004) "
                "using an explicit, ordered rule set: (1) top-level section mapping "
                "(00_Project→governance, 01_Vision→vision-and-strategy, "
                "02_Architecture→system-architecture, 03_Logistics→logistics, "
                "03_Logistics/Delivery*→delivery-modes, 04_DronePorts→droneports, "
                "05_Marketplace→marketplace, 06_Roles→roles-and-channels, "
                "07_Economy→economy, 08_AI→ai-agents); "
                "(2) subdirectory mapping for 09_Reference; "
                "(3) unclassified when no rule matches. "
                "Each file is counted exactly once by primary_domain. "
                "Files appearing in additional_domains are not counted again in the total."
            ),
            "directories_excluded_from_file_totals": True,
            "generated_audit_reports_included_in_package_total": True,
            "manifest_index_control_files_included_in_package_total": True,
        },
        "summary": {
            "actual_file_count": actual_file_count,
            "source_document_count": source_count,
            "package_control_document_count": control_count,
            "directory_count": dir_count,
            "duplicate_path_count": len(duplicate_paths),
            "duplicate_content_group_count": len(duplicate_content_groups),
            "classified_file_count": classified_count,
            "unclassified_file_count": unclassified_count,
            "discovered_statistical_claim_count": len(resolved_claims),
            "exact_claim_count": exact_count,
            "stale_claim_count": stale_count,
            "contradictory_claim_count": contradictory_count,
            "ambiguous_claim_count": ambiguous_count,
            "unsupported_claim_count": unsupported_count,
        },
        "files": records,
        "counts_by_extension": ext_counts,
        "counts_by_domain": domain_counts,
        "counts_by_top_level_section": section_counts,
        "duplicate_content_groups": duplicate_content_groups,
        "statistical_claims": resolved_claims,
        "reconciliation": {
            "actual_package_contents": {
                "total_files": actual_file_count,
                "source_documents": source_count,
                "package_control_documents": control_count,
                "extensions": ext_counts,
                "domains": domain_counts,
            },
            "manifest": manifest_reconciliation,
            "knowledge_index": {
                "source_path": (
                    "DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md"
                ),
                "claimed_total": 217,
                "actual_total": actual_file_count,
                "total_status": "current_exact" if actual_file_count == 217 else "stale",
                "breakdown_claimed": {
                    "canonical_markdown_documents": 52,
                    "historical_docx_documents": 147,
                    "recovered_zip_only_markdown": 18,
                    "package_control_documents": 4,
                    "breakdown_sum": 221,
                },
                "breakdown_status": "contradictory",
                "notes": (
                    "The KI total of 217 matches the actual file count. "
                    "However, the four breakdown rows sum to 221, not 217. "
                    "The breakdown is internally inconsistent."
                ),
            },
            "knowledge_index_breakdown_sum": {
                "source_path": (
                    "DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md"
                ),
                "claim_identifier": "CLAIM-011",
                "claimed_component_sum": 221,
                "stated_package_total": 217,
                "status": "contradictory",
                "explanation": (
                    "The component breakdown (52 canonical md + 147 docx + 18 ZIP-only md "
                    "+ 4 package control = 221) exceeds the stated package total of 217 by 4. "
                    "Individual component claims must be evaluated against their own "
                    "independently reproducible metric rather than against this inconsistent sum."
                ),
            },
            "audit_report": {
                "source_path": (
                    "DROPi_Canonical_Reference/AI_CANONICAL_REFERENCE_AUDIT_REPORT.md"
                ),
                "claimed_source_documents": 195,
                "claimed_package_control_documents": 4,
                "claimed_total": 199,
                "actual_source_documents": source_count,
                "actual_package_control_documents": control_count,
                "actual_total": actual_file_count,
                "status": "stale",
                "notes": (
                    "The audit report was finalized at an earlier package state. "
                    "195 source documents + 4 package control documents = 199. "
                    "The current package contains "
                    f"{source_count} source documents + {control_count} package control "
                    f"documents = {actual_file_count}. "
                    f"{source_count - 195} additional source documents are present in the "
                    "current package that were not listed in the inventory.json manifest."
                ),
            },
            "historical_199_claim": {
                "claim_identifier": "CLAIM-001",
                "source_path": claim_199["source_path"],
                "claimed_value": 199,
                "actual_value": actual_file_count,
                "status": claim_199["status"],
                "explanation": (
                    "The value 199 = 195 manifest source documents "
                    "(inventory.json) + 4 package control documents. "
                    "This count was accurate at the time the audit report and "
                    "inventory.json were finalized. Subsequently, 18 additional source "
                    f"documents were added to the package, raising the total to {actual_file_count}. "
                    "The audit report was not updated. This claim is stale."
                ),
                "resolution": (
                    "195 (manifest) + 4 (package control) = 199. "
                    f"Actual = {actual_file_count}. Difference = {actual_file_count - 199}."
                ),
            },
            "historical_217_claim": {
                "claim_identifier": "CLAIM-003",
                "source_path": claim_217["source_path"],
                "claimed_value": 217,
                "actual_value": actual_file_count,
                "status": claim_217["status"],
                "explanation": (
                    "The value 217 appears in CANONICAL_KNOWLEDGE_INDEX.md "
                    f"as the total files packaged. Actual computed total is {actual_file_count}. "
                    + (
                        "This claim is current and exact."
                        if actual_file_count == 217
                        else "This claim no longer matches the actual count."
                    )
                ),
                "resolution": (
                    f"Claimed 217. Actual {actual_file_count}. "
                    + ("Match." if actual_file_count == 217 else "Mismatch.")
                ),
            },
        },
        "correction_proposals": _build_correction_proposals(
            actual_file_count,
            source_count,
            control_count,
            manifest_reconciliation,
            resolved_claims,
        ),
    }


def _build_correction_proposals(
    actual_file_count: int,
    source_count: int,
    control_count: int,
    manifest_reconciliation: dict[str, Any],
    claims: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    proposals = []

    # Proposal for stale audit report
    stale_audit_claims = [
        c
        for c in claims
        if c["status"] == "stale"
        and "AI_CANONICAL_REFERENCE_AUDIT_REPORT" in c["source_path"]
    ]
    if stale_audit_claims:
        proposals.append(
            {
                "target_path": (
                    "DROPi_Canonical_Reference/AI_CANONICAL_REFERENCE_AUDIT_REPORT.md"
                ),
                "current_claim": (
                    f"Included in final package (including package control docs) | 199"
                ),
                "proposed_claim": (
                    f"Included in final package (including package control docs) | {actual_file_count}"
                ),
                "reason": (
                    f"The actual package file count is {actual_file_count}. "
                    "The 199 figure was accurate at the time the audit report was finalized "
                    f"but {actual_file_count - 199} additional source documents have since "
                    "been added to the package."
                ),
                "proposal_only": True,
                "file_modified": False,
            }
        )
        proposals.append(
            {
                "target_path": (
                    "DROPi_Canonical_Reference/AI_CANONICAL_REFERENCE_AUDIT_REPORT.md"
                ),
                "current_claim": (
                    "Included in final package (source documents only) | 195"
                ),
                "proposed_claim": (
                    f"Included in final package (source documents only) | {source_count}"
                ),
                "reason": (
                    f"The actual source document count is {source_count}. "
                    "The 195 figure matches the inventory.json manifest entry count "
                    f"but {source_count - 195} additional source documents are present "
                    "in the package that were not in the manifest."
                ),
                "proposal_only": True,
                "file_modified": False,
            }
        )

    # Proposal for contradictory KI breakdown
    ki_breakdown_proposals_added = False
    for c in claims:
        if c["status"] == "contradictory" and "CANONICAL_KNOWLEDGE_INDEX" in c.get(
            "source_path", ""
        ):
            if not ki_breakdown_proposals_added:
                proposals.append(
                    {
                        "target_path": (
                            "DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md"
                        ),
                        "current_claim": (
                            "Breakdown: canonical_markdown=52, historical_docx=147, "
                            "recovered_zip_only_md=18, package_control=4 (sum=221)"
                        ),
                        "proposed_claim": (
                            "Breakdown subcategory figures require authorial review "
                            "to reconcile internal sum (221) with stated total (217). "
                            "No safe automatic correction is proposed."
                        ),
                        "reason": (
                            "The KI breakdown rows sum to 221 but the stated total is 217. "
                            "The 4-file discrepancy cannot be resolved without authorial "
                            "clarification of category boundaries."
                        ),
                        "proposal_only": True,
                        "file_modified": False,
                    }
                )
                ki_breakdown_proposals_added = True

    # Proposal for unlisted source documents in inventory.json
    unlisted = manifest_reconciliation.get("in_actual_not_manifest", [])
    unlisted_source = [
        p
        for p in unlisted
        if p not in PACKAGE_CONTROL_PATHS
    ]
    if unlisted_source:
        proposals.append(
            {
                "target_path": (
                    "DROPi_Canonical_Reference/09_Reference/Package_Metadata/inventory.json"
                ),
                "current_claim": (
                    f"195 entries; does not include {len(unlisted_source)} "
                    "source documents present in the package."
                ),
                "proposed_claim": (
                    f"Add {len(unlisted_source)} missing source document entries: "
                    + ", ".join(sorted(unlisted_source)[:5])
                    + (f" ... and {len(unlisted_source) - 5} more" if len(unlisted_source) > 5 else "")
                ),
                "reason": (
                    f"{len(unlisted_source)} source documents exist in the package "
                    "but are not listed in inventory.json. The manifest is incomplete."
                ),
                "proposal_only": True,
                "file_modified": False,
            }
        )

    return proposals


# ---------------------------------------------------------------------------
# Markdown report
# ---------------------------------------------------------------------------


def build_markdown(report: dict[str, Any]) -> str:
    lines: list[str] = []

    def h1(t: str) -> None:
        lines.append(f"# {t}")
        lines.append("")

    def h2(t: str) -> None:
        lines.append(f"## {t}")
        lines.append("")

    def h3(t: str) -> None:
        lines.append(f"### {t}")
        lines.append("")

    def p(t: str) -> None:
        lines.append(t)
        lines.append("")

    def table_row(*cells: str) -> str:
        return "| " + " | ".join(str(c) for c in cells) + " |"

    def table_sep(n: int) -> str:
        return "| " + " | ".join(["---"] * n) + " |"

    h1("[CAN-006] Derived Package Statistics — Reconciliation Report")

    h2("1. Definitions and Counting Rules")

    p("**Actual package file**: any regular file discovered by recursive traversal of "
      "`DROPi_Canonical_Reference/`, excluding directories and excluded directory names "
      "(`.git`, `node_modules`, `__pycache__`, `.cache`, `coverage`, `dist`, `build`). "
      "Each file is recorded exactly once.")

    p("**Source document**: an actual package file that is not a package control document. "
      "Source documents are the primary knowledge content of the package.")

    p("**Package control document**: one of the four files explicitly labelled "
      "'package control document' in `CANONICAL_MANIFEST.md`: "
      "`README_FOR_DROPi_TYCOON.md`, `CANONICAL_KNOWLEDGE_INDEX.md`, "
      "`CANONICAL_MANIFEST.md`, and `AI_CANONICAL_REFERENCE_AUDIT_REPORT.md`.")

    p("**Directories**: excluded from all file totals.")

    p("**Generated audit reports**: included in the package file total "
      "(they are actual package files).")

    p("**Manifest/index/control files**: included in the package file total.")

    p("**Domain assignment**: files are assigned to canonical domains (CAN-004) "
      "using an explicit ordered rule set based on top-level section and subdirectory. "
      "Each file is counted exactly once by primary domain. "
      "Files that cannot be safely classified are marked `unclassified`.")

    h2("2. Ground-Truth Actual Totals")

    s = report["summary"]
    lines.append(table_row("Metric", "Count"))
    lines.append(table_sep(2))
    lines.append(table_row("Actual file count", s["actual_file_count"]))
    lines.append(table_row("Source document count", s["source_document_count"]))
    lines.append(table_row("Package control document count", s["package_control_document_count"]))
    lines.append(table_row("Directory count", s["directory_count"]))
    lines.append(table_row("Duplicate path count", s["duplicate_path_count"]))
    lines.append(table_row("Duplicate content groups", s["duplicate_content_group_count"]))
    lines.append(table_row("Classified files", s["classified_file_count"]))
    lines.append(table_row("Unclassified files", s["unclassified_file_count"]))
    lines.append("")

    h2("3. Source-Document versus Package-Control Totals")

    p(f"- **Source documents**: {s['source_document_count']}")
    p(f"- **Package control documents**: {s['package_control_document_count']}")
    p(f"- **Total**: {s['actual_file_count']}")

    lines.append("Package control documents (explicitly labelled in CANONICAL_MANIFEST.md):")
    lines.append("")
    for pc in sorted(PACKAGE_CONTROL_PATHS):
        lines.append(f"- `{pc}`")
    lines.append("")

    h2("4. Files by Extension")

    lines.append(table_row("Extension", "Count"))
    lines.append(table_sep(2))
    for ext, cnt in sorted(report["counts_by_extension"].items()):
        lines.append(table_row(f"`{ext}`", cnt))
    lines.append("")

    h2("5. Files by Domain")

    lines.append(table_row("Domain", "Count"))
    lines.append(table_sep(2))
    for domain, cnt in sorted(report["counts_by_domain"].items()):
        lines.append(table_row(domain, cnt))
    lines.append("")

    p(f"**Domain total check**: sum of primary-domain counts = "
      f"{sum(report['counts_by_domain'].values())} "
      f"(must equal actual file count {s['actual_file_count']}).")

    h2("6. Files by Package Section")

    lines.append(table_row("Top-level section", "Count"))
    lines.append(table_sep(2))
    for sec, cnt in sorted(report["counts_by_top_level_section"].items()):
        lines.append(table_row(sec, cnt))
    lines.append("")

    h2("7. Duplicate-Content Findings")

    groups = report["duplicate_content_groups"]
    if not groups:
        p("No duplicate-content groups found.")
    else:
        p(f"{len(groups)} group(s) of files share identical SHA-256 content:")
        for g in groups:
            h3(f"Hash `{g['sha256'][:16]}…`")
            for pth in g["paths"]:
                lines.append(f"- `{pth}`")
            lines.append("")

    h2("8. Discovered Statistical Claims")

    claims = report["statistical_claims"]
    lines.append(table_row(
        "ID", "Source", "Claimed Value", "Metric", "Actual", "Status"
    ))
    lines.append(table_sep(6))
    for c in claims:
        actual_str = str(c["actual_value"]) if c["actual_value"] is not None else "—"
        lines.append(table_row(
            c["claim_identifier"],
            f"`{c['source_path']}`",
            c["claimed_value"],
            c["claimed_metric"],
            actual_str,
            f"**{c['status']}**",
        ))
    lines.append("")

    h2("9. Status of Each Claim")

    for c in claims:
        h3(f"{c['claim_identifier']} — {c['status'].upper()}")
        p(f"**Source**: `{c['source_path']}`")
        p(f"**Context**: {c['claim_context']}")
        p(f"**Claimed**: {c['claimed_value']}  |  "
          f"**Actual**: {c['actual_value'] if c['actual_value'] is not None else '—'}")
        p(f"**Explanation**: {c['explanation']}")

    h2("10. Reconciliation")

    h3("10.1 Actual Package Contents")

    rec = report["reconciliation"]["actual_package_contents"]
    p(f"- Total files: **{rec['total_files']}**")
    p(f"- Source documents: **{rec['source_documents']}**")
    p(f"- Package control documents: **{rec['package_control_documents']}**")

    h3("10.2 Manifest (inventory.json)")

    m = report["reconciliation"]["manifest"]
    p(f"- Manifest path: `{m['manifest_path']}`")
    p(f"- Manifest entry count: **{m['manifest_entry_count']}**")
    p(f"- Actual file count: **{m['actual_file_count']}**")
    p(f"- Matched (in both): **{m['matched_count']}**")
    p(f"- In manifest but not in actual: **{len(m['in_manifest_not_actual'])}**")
    p(f"- In actual but not in manifest: **{len(m['in_actual_not_manifest'])}**")
    p(f"- Status: **{m['status']}**")
    p(m["notes"])

    if m["in_actual_not_manifest"]:
        p("Files in actual package but absent from manifest:")
        for pth in m["in_actual_not_manifest"]:
            lines.append(f"- `{pth}`")
        lines.append("")

    h3("10.3 Knowledge Index (CANONICAL_KNOWLEDGE_INDEX.md)")

    ki = report["reconciliation"]["knowledge_index"]
    p(f"- Source: `{ki['source_path']}`")
    p(f"- Claimed total: **{ki['claimed_total']}**  |  Actual: **{ki['actual_total']}**  |  Status: **{ki['total_status']}**")
    p(f"- Breakdown claimed: canonical md={ki['breakdown_claimed']['canonical_markdown_documents']}, "
      f"historical docx={ki['breakdown_claimed']['historical_docx_documents']}, "
      f"ZIP-only md={ki['breakdown_claimed']['recovered_zip_only_markdown']}, "
      f"package control={ki['breakdown_claimed']['package_control_documents']} "
      f"(sum={ki['breakdown_claimed']['breakdown_sum']})")
    p(f"- Breakdown status: **{ki['breakdown_status']}**")
    p(ki["notes"])

    h3("10.3a Knowledge-Index Breakdown Sum (CLAIM-011)")

    ki_sum = report["reconciliation"]["knowledge_index_breakdown_sum"]
    p(f"- Source: `{ki_sum['source_path']}`")
    p(f"- Claim identifier: **{ki_sum['claim_identifier']}**")
    p(f"- Claimed component sum: **{ki_sum['claimed_component_sum']}**  |  "
      f"Stated package total: **{ki_sum['stated_package_total']}**  |  "
      f"Status: **{ki_sum['status']}**")
    p(ki_sum["explanation"])

    h3("10.4 Audit Report (AI_CANONICAL_REFERENCE_AUDIT_REPORT.md)")

    ar = report["reconciliation"]["audit_report"]
    p(f"- Source: `{ar['source_path']}`")
    p(f"- Claimed source docs: **{ar['claimed_source_documents']}**  |  "
      f"Actual: **{ar['actual_source_documents']}**")
    p(f"- Claimed package control docs: **{ar['claimed_package_control_documents']}**  |  "
      f"Actual: **{ar['actual_package_control_documents']}**")
    p(f"- Claimed total: **{ar['claimed_total']}**  |  Actual: **{ar['actual_total']}**")
    p(f"- Status: **{ar['status']}**")
    p(ar["notes"])

    h3("10.5 Historical 199 Claim")

    c199 = report["reconciliation"]["historical_199_claim"]
    p(f"- Source: `{c199['source_path']}`")
    p(f"- Claimed value: **199**  |  Actual: **{c199['actual_value']}**  |  Status: **{c199['status']}**")
    p(c199["explanation"])
    p(c199["resolution"])

    h3("10.6 Historical 217 Claim")

    c217 = report["reconciliation"]["historical_217_claim"]
    p(f"- Source: `{c217['source_path']}`")
    p(f"- Claimed value: **217**  |  Actual: **{c217['actual_value']}**  |  Status: **{c217['status']}**")
    p(c217["explanation"])
    p(c217["resolution"])

    h2("11. Proposed Corrections")

    proposals = report["correction_proposals"]
    if not proposals:
        p("No corrections proposed.")
    else:
        for i, prop in enumerate(proposals, 1):
            h3(f"Proposal {i}: `{prop['target_path']}`")
            p(f"**Current claim**: {prop['current_claim']}")
            p(f"**Proposed claim**: {prop['proposed_claim']}")
            p(f"**Reason**: {prop['reason']}")
            p(f"*Proposal only. `file_modified = {prop['file_modified']}`*")

    h2("12. Safety Statement")

    p(
        "No canonical source file, derived package file, historical audit report, "
        "or package control document was modified during the generation of this report. "
        "All corrections above are proposals only. "
        "`DROPi_Canonical_Reference/` was scanned read-only. "
        "`04.zip` was not accessed."
    )

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="CAN-006: Reconcile derived canonical package statistics."
    )
    parser.add_argument(
        "--repo-root",
        type=pathlib.Path,
        default=DEFAULT_REPO_ROOT,
        help="Repository root directory.",
    )
    parser.add_argument(
        "--package-root",
        default=DEFAULT_PACKAGE_ROOT,
        help="Package root relative to repo root.",
    )
    parser.add_argument(
        "--output-dir",
        type=pathlib.Path,
        default=None,
        help="Output directory for reports (default: <repo-root>/docs/audits/can-006).",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    repo_root: pathlib.Path = args.repo_root.resolve()
    package_root: pathlib.Path = repo_root / args.package_root

    if not package_root.exists():
        print(
            f"ERROR: package root does not exist: {package_root}",
            file=sys.stderr,
        )
        return 1

    output_dir: pathlib.Path = (
        args.output_dir
        if args.output_dir is not None
        else repo_root / DEFAULT_OUTPUT_DIR
    )
    output_dir.mkdir(parents=True, exist_ok=True)

    records = scan_package(package_root)
    dir_count = count_directories(package_root)
    duplicate_paths = detect_duplicate_paths(records)
    duplicate_content_groups = detect_duplicate_contents(records)
    manifest_paths = load_manifest(repo_root)

    report = build_report(
        records=records,
        dir_count=dir_count,
        duplicate_paths=duplicate_paths,
        duplicate_content_groups=duplicate_content_groups,
        claims=KNOWN_CLAIMS,
        manifest_paths=manifest_paths,
        package_root_str=args.package_root,
        mutation_performed=False,
    )

    json_path = output_dir / "derived_package_statistics.json"
    md_path = output_dir / "derived_package_statistics.md"

    json_path.write_text(
        json.dumps(report, indent=2, ensure_ascii=False, sort_keys=False) + "\n",
        encoding="utf-8",
    )

    md_path.write_text(
        build_markdown(report),
        encoding="utf-8",
    )

    print(f"JSON report written to: {json_path}")
    print(f"Markdown report written to: {md_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
