#!/usr/bin/env python3
"""Build a deterministic DROPi Canonical Authority Matrix."""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import pathlib
import sys
from typing import Any, Iterable

SCHEMA_VERSION = 1

AUTHORITATIVE_ARCHIVE_SHA256 = (
    "82a6015b8c968645307e36c8e4aa0351515f50333c08a6c5402a7819b7b747e5"
)

AUTHORITY_ORDER = (
    {
        "rank": 1,
        "source_class": "historical_authoritative_archive",
        "location": "04.zip",
        "meaning": (
            "Immutable historical canonical authority. Historical bytes and "
            "paths must not be silently rewritten."
        ),
    },
    {
        "rank": 2,
        "source_class": "extracted_working_copy",
        "location": "canonical/docs/00_MasterPlan/",
        "meaning": (
            "Accessible extracted working copy. It remains subordinate to "
            "its mapped authoritative archive source."
        ),
    },
    {
        "rank": 3,
        "source_class": "later_approved_active_canon",
        "location": "canonical/*.md and canonical/**/*.md",
        "meaning": (
            "Later approved active canon when provenance and approval are "
            "explicitly documented."
        ),
    },
    {
        "rank": 4,
        "source_class": "derived_reference",
        "location": "DROPi_Canonical_Reference/",
        "meaning": (
            "Regenerable derived reference. It cannot independently override "
            "the historical archive or an approved active canon."
        ),
    },
    {
        "rank": 5,
        "source_class": "implementation_or_operational_material",
        "location": "remaining repository paths",
        "meaning": (
            "Implementation and operational material subordinate to the "
            "canonical authority chain."
        ),
    },
)

DOMAINS: tuple[dict[str, Any], ...] = (
    {
        "id": "vision-and-strategy",
        "name": "Vision and strategy",
        "keywords": (
            "vision", "strategy", "strategic", "executive", "problem",
            "solution", "differentiation", "market", "zone_0",
        ),
        "implementation_relevance": (
            "Defines product purpose, operating model, launch sequence, "
            "market positioning, and strategic boundaries."
        ),
    },
    {
        "id": "system-architecture",
        "name": "System architecture",
        "keywords": (
            "architecture", "system_design", "system-overview", "technical",
            "platform", "ecosystem", "component", "service",
        ),
        "implementation_relevance": (
            "Constrains system boundaries, components, integrations, and "
            "cross-service responsibilities."
        ),
    },
    {
        "id": "governance",
        "name": "Governance",
        "keywords": (
            "governance", "authority", "canon_rules", "canonical",
            "decision", "policy", "standard", "protocol",
        ),
        "implementation_relevance": (
            "Defines who may approve changes and which materials are "
            "authoritative or subordinate."
        ),
    },
    {
        "id": "roles-and-channels",
        "name": "Roles and channels",
        "keywords": (
            "role", "roles", "channel", "customer", "partner", "pilot",
            "admin", "owner", "company", "host", "courier",
        ),
        "implementation_relevance": (
            "Defines actor capabilities, access boundaries, communication "
            "channels, and role-specific workflows."
        ),
    },
    {
        "id": "marketplace",
        "name": "Marketplace",
        "keywords": (
            "marketplace", "catalog", "product", "merchant", "seller",
            "portfolio", "order", "commerce",
        ),
        "implementation_relevance": (
            "Defines discovery, offers, ordering, merchant participation, "
            "and customer marketplace behavior."
        ),
    },
    {
        "id": "logistics",
        "name": "Logistics",
        "keywords": (
            "logistics", "delivery", "shipment", "parcel", "courier",
            "dispatch", "route", "transport", "fulfillment",
        ),
        "implementation_relevance": (
            "Defines parcel movement, assignment, routing, fallback, and "
            "delivery lifecycle."
        ),
    },
    {
        "id": "droneports",
        "name": "DronePorts",
        "keywords": (
            "droneport", "drone_port", "drone-port", "locker", "hub",
            "landing", "host",
        ),
        "implementation_relevance": (
            "Defines fixed and mobile DronePort roles, custody, storage, "
            "landing, collection, and handover."
        ),
    },
    {
        "id": "delivery-modes",
        "name": "Delivery modes",
        "keywords": (
            "delivery_mode", "delivery-mode", "air", "aerial", "ground",
            "drone", "van", "bike", "weather", "fallback",
        ),
        "implementation_relevance": (
            "Defines aerial and ground delivery modes, selection logic, "
            "constraints, and fallback behavior."
        ),
    },
    {
        "id": "economy",
        "name": "Economy",
        "keywords": (
            "economy", "wallet", "payment", "pricing", "commission",
            "fee", "reward", "promo", "withdraw", "monetization",
        ),
        "implementation_relevance": (
            "Defines balances, payment flows, fees, commissions, incentives, "
            "withdrawals, and promotional value."
        ),
    },
    {
        "id": "ai-agents",
        "name": "AI agents",
        "keywords": (
            "ai_agent", "ai-agent", "agent", "assistant", "automation",
            "llm", "ollama", "reporting_protocol",
        ),
        "implementation_relevance": (
            "Defines AI responsibilities, permitted actions, reporting, "
            "human approval, and operational boundaries."
        ),
    },
    {
        "id": "mobile",
        "name": "Mobile",
        "keywords": (
            "mobile", "android", "ios", "expo", "react_native",
            "react-native", "application", "app_",
        ),
        "implementation_relevance": (
            "Defines mobile client responsibilities, flows, screens, "
            "authentication, and platform behavior."
        ),
    },
    {
        "id": "backend",
        "name": "Backend",
        "keywords": (
            "backend", "server", "api", "trpc", "endpoint", "service",
            "queue", "worker",
        ),
        "implementation_relevance": (
            "Defines server-side services, APIs, business rules, jobs, and "
            "integration responsibilities."
        ),
    },
    {
        "id": "database",
        "name": "Database",
        "keywords": (
            "database", "data_model", "data-model", "schema", "table",
            "entity", "migration", "storage",
        ),
        "implementation_relevance": (
            "Defines persistent entities, relationships, constraints, "
            "migrations, and data ownership."
        ),
    },
    {
        "id": "security",
        "name": "Security",
        "keywords": (
            "security", "authentication", "authorization", "auth",
            "permission", "privacy", "secret", "token", "encryption",
            "threat",
        ),
        "implementation_relevance": (
            "Defines authentication, authorization, privacy, secrets, threat "
            "controls, and security boundaries."
        ),
    },
    {
        "id": "deployment-and-operations",
        "name": "Deployment and operations",
        "keywords": (
            "deployment", "deploy", "railway", "operations", "runbook",
            "monitoring", "logging", "incident", "release", "environment",
            "backup",
        ),
        "implementation_relevance": (
            "Defines environments, deployment, observability, incident "
            "response, releases, and operational continuity."
        ),
    },
)


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()

    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()


def load_json(path: pathlib.Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_search_text(*parts: str) -> str:
    return " ".join(parts).casefold().replace("-", "_").replace(" ", "_")


def keyword_score(
    path: str,
    filename: str,
    classification: str,
    keywords: Iterable[str],
) -> tuple[int, list[str]]:
    text = normalize_search_text(path, filename, classification)
    matches = sorted(
        {
            keyword
            for keyword in keywords
            if keyword.casefold().replace("-", "_") in text
        }
    )

    return len(matches), matches


def candidate(
    *,
    path: str,
    source_class: str,
    classification: str,
    sha256: str | None,
    keywords: Iterable[str],
    provenance: str,
    counterpart: str | None = None,
    relation: str | None = None,
) -> dict[str, Any] | None:
    score, matched_keywords = keyword_score(
        path,
        pathlib.PurePosixPath(path).name,
        classification,
        keywords,
    )

    if score == 0:
        return None

    return {
        "path": path,
        "source_class": source_class,
        "document_classification": classification,
        "sha256": sha256,
        "keyword_score": score,
        "matched_keywords": matched_keywords,
        "provenance": provenance,
        "mapped_counterpart": counterpart,
        "mapping_relation": relation,
    }


EXCLUDED_SCAN_DIRECTORIES = {
    ".git",
    ".cache",
    ".expo",
    ".next",
    ".turbo",
    ".vite",
    "node_modules",
    "coverage",
    "dist",
    "build",
    "tmp",
    "temp",
}


def repository_markdown_paths(
    repo_root: pathlib.Path,
    output_dir: pathlib.Path,
) -> list[pathlib.Path]:
    output_resolved = output_dir.resolve()
    rows: list[pathlib.Path] = []

    for path in repo_root.rglob("*.md"):
        if not path.is_file():
            continue

        relative_path = path.relative_to(repo_root)
        relative = relative_path.as_posix()

        if any(
            part in EXCLUDED_SCAN_DIRECTORIES
            for part in relative_path.parts
        ):
            continue

        try:
            path.resolve().relative_to(output_resolved)
            continue
        except ValueError:
            pass

        rows.append(path)

    return sorted(
        rows,
        key=lambda value: value.relative_to(repo_root).as_posix(),
    )


def active_canon_candidates(
    repo_root: pathlib.Path,
    output_dir: pathlib.Path,
    keywords: Iterable[str],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    for path in repository_markdown_paths(repo_root, output_dir):
        relative = path.relative_to(repo_root).as_posix()

        if not relative.startswith("canonical/"):
            continue

        if relative.startswith("canonical/docs/00_MasterPlan/"):
            continue

        row = candidate(
            path=relative,
            source_class="later_approved_active_canon_candidate",
            classification="repository_canonical_markdown",
            sha256=sha256_file(path),
            keywords=keywords,
            provenance=(
                "Repository path under canonical/. Approval status must be "
                "confirmed through explicit governance or merged decision."
            ),
        )

        if row is not None:
            rows.append(row)

    return sorted(
        rows,
        key=lambda row: (
            -row["keyword_score"],
            row["path"],
        ),
    )


def derived_candidates(
    repo_root: pathlib.Path,
    output_dir: pathlib.Path,
    keywords: Iterable[str],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    for path in repository_markdown_paths(repo_root, output_dir):
        relative = path.relative_to(repo_root).as_posix()

        if not relative.startswith("DROPi_Canonical_Reference/"):
            continue

        row = candidate(
            path=relative,
            source_class="derived_reference",
            classification="derived_repository_markdown",
            sha256=sha256_file(path),
            keywords=keywords,
            provenance=(
                "Derived reference package. Subordinate to historical and "
                "approved active canonical sources."
            ),
        )

        if row is not None:
            rows.append(row)

    return sorted(
        rows,
        key=lambda row: (
            -row["keyword_score"],
            row["path"],
        ),
    )


def operational_candidates(
    repo_root: pathlib.Path,
    output_dir: pathlib.Path,
    keywords: Iterable[str],
) -> list[dict[str, Any]]:
    operational_tokens = (
        "deploy",
        "deployment",
        "runbook",
        "operations",
        "incident",
        "release",
        "monitor",
        "logging",
        "migration",
        "railway",
        "environment",
        "backup",
    )

    rows: list[dict[str, Any]] = []

    for path in repository_markdown_paths(repo_root, output_dir):
        relative = path.relative_to(repo_root).as_posix()
        lowered = relative.casefold()

        if not any(token in lowered for token in operational_tokens):
            continue

        row = candidate(
            path=relative,
            source_class="operational_document",
            classification="repository_operational_markdown",
            sha256=sha256_file(path),
            keywords=keywords,
            provenance=(
                "Operational repository material. It is subordinate to the "
                "canonical authority chain."
            ),
        )

        if row is not None:
            rows.append(row)

    return sorted(
        rows,
        key=lambda row: (
            -row["keyword_score"],
            row["path"],
        ),
    )


def historical_markdown_candidates(
    can003: dict[str, Any],
    keywords: Iterable[str],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    mapping_by_archive_path = {
        row["archive"]["archive_path"]: row
        for row in can003["mappings"]
    }

    for archive_entry in can003["archive_entries"]:
        archive_path = archive_entry["archive_path"]
        mapping = mapping_by_archive_path.get(archive_path)
        counterpart = None
        relation = None

        if mapping is not None:
            relation = mapping["classification"]

            if mapping["repository"] is not None:
                counterpart = mapping["repository"]["repository_path"]

        row = candidate(
            path=archive_path,
            source_class="historical_authoritative_markdown",
            classification=archive_entry["classification"],
            sha256=archive_entry["sha256"],
            keywords=keywords,
            provenance="CAN-003 inventory of Markdown inside immutable 04.zip.",
            counterpart=counterpart,
            relation=relation,
        )

        if row is not None:
            rows.append(row)

    return sorted(
        rows,
        key=lambda row: (
            -row["keyword_score"],
            row["path"],
        ),
    )


def historical_masterplan_candidates(
    can002: dict[str, Any],
    keywords: Iterable[str],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    for mapping in can002["mappings"]:
        archive = mapping["archive"]
        local = mapping["local"]

        row = candidate(
            path=archive["archive_path"],
            source_class="historical_authoritative_docx",
            classification="masterplan_docx",
            sha256=archive["sha256"],
            keywords=keywords,
            provenance=(
                "CAN-002 one-to-one mapping of authoritative MasterPlan DOCX "
                "inside immutable 04.zip."
            ),
            counterpart=local["repository_path"],
            relation=mapping["classification"],
        )

        if row is not None:
            rows.append(row)

    return sorted(
        rows,
        key=lambda row: (
            -row["keyword_score"],
            row["path"],
        ),
    )


def select_primary(
    historical_candidates: list[dict[str, Any]],
) -> dict[str, Any] | None:
    if not historical_candidates:
        return None

    return historical_candidates[0]


def build_domain_row(
    domain: dict[str, Any],
    can002: dict[str, Any],
    can003: dict[str, Any],
    repo_root: pathlib.Path,
    output_dir: pathlib.Path,
) -> dict[str, Any]:
    keywords = domain["keywords"]

    historical = (
        historical_masterplan_candidates(can002, keywords)
        + historical_markdown_candidates(can003, keywords)
    )

    historical = sorted(
        historical,
        key=lambda row: (
            -row["keyword_score"],
            0 if row["source_class"].endswith("docx") else 1,
            row["path"],
        ),
    )

    primary = select_primary(historical)

    extracted_working_copy = None

    if primary is not None and primary["mapped_counterpart"]:
        extracted_working_copy = {
            "path": primary["mapped_counterpart"],
            "mapping_relation": primary["mapping_relation"],
            "authority_status": (
                "subordinate_extracted_copy"
            ),
        }

    active_candidates = active_canon_candidates(
        repo_root,
        output_dir,
        keywords,
    )

    derived = derived_candidates(
        repo_root,
        output_dir,
        keywords,
    )

    operational = operational_candidates(
        repo_root,
        output_dir,
        keywords,
    )

    conflicts: list[dict[str, Any]] = []
    unresolved: list[str] = []

    if primary is None:
        unresolved.append(
            "No domain-specific historical source was identified by the "
            "deterministic keyword audit. Manual authority assignment is required."
        )

    if len(active_candidates) == 0:
        unresolved.append(
            "No later active-canon candidate was identified under canonical/."
        )
    elif len(active_candidates) > 1:
        conflicts.append(
            {
                "type": "multiple_active_canon_candidates",
                "paths": [
                    row["path"]
                    for row in active_candidates
                ],
                "resolution": (
                    "No automatic winner selected. Explicit approval provenance "
                    "is required."
                ),
            }
        )

    non_primary_historical = [
        row
        for row in historical
        if primary is None or row["path"] != primary["path"]
    ]

    if non_primary_historical:
        conflicts.append(
            {
                "type": "additional_historical_candidates",
                "paths": [
                    row["path"]
                    for row in non_primary_historical
                ],
                "resolution": (
                    "Candidates remain subordinate or potentially conflicting "
                    "until explicit section-level authority is documented."
                ),
            }
        )

    owner = {
        "status": "unresolved",
        "value": None,
        "reason": (
            "CAN-004 source audits do not provide an explicit canonical owner "
            "for this domain."
        ),
    }

    approval = {
        "status": "unresolved",
        "value": None,
        "reason": (
            "CAN-004 source audits do not provide explicit domain-level approval "
            "authority or approval provenance."
        ),
    }

    current_repository_paths = sorted(
        {
            path
            for path in (
                (
                    [extracted_working_copy["path"]]
                    if extracted_working_copy is not None
                    else []
                )
                + [row["path"] for row in active_candidates]
                + [row["path"] for row in derived]
                + [row["path"] for row in operational]
            )
            if path
        }
    )

    chain = [
        {
            "rank": 1,
            "role": "primary_historical_source",
            "value": primary,
        },
        {
            "rank": 2,
            "role": "extracted_working_copy",
            "value": extracted_working_copy,
        },
        {
            "rank": 3,
            "role": "later_approved_active_canon",
            "value": (
                active_candidates[0]
                if len(active_candidates) == 1
                else None
            ),
            "candidates": active_candidates,
        },
        {
            "rank": 4,
            "role": "derived_references",
            "value": derived,
        },
        {
            "rank": 5,
            "role": "operational_documents",
            "value": operational,
        },
    ]

    return {
        "domain_id": domain["id"],
        "domain": domain["name"],
        "search_keywords": list(keywords),
        "authority_chain": chain,
        "primary_historical_source": primary,
        "historical_candidates": historical,
        "extracted_working_copy": extracted_working_copy,
        "later_approved_active_canon": (
            active_candidates[0]
            if len(active_candidates) == 1
            else None
        ),
        "active_canon_candidates": active_candidates,
        "derived_references": derived,
        "operational_documents": operational,
        "conflicting_or_superseded_documents": conflicts,
        "canonical_owner": owner,
        "approval_authority": approval,
        "implementation_relevance": domain["implementation_relevance"],
        "current_repository_paths": current_repository_paths,
        "unresolved_authority": unresolved,
    }


def build_matrix(
    *,
    repo_root: pathlib.Path,
    output_dir: pathlib.Path,
    can001_path: pathlib.Path,
    can002_path: pathlib.Path,
    can003_path: pathlib.Path,
) -> dict[str, Any]:
    can001 = load_json(can001_path)
    can002 = load_json(can002_path)
    can003 = load_json(can003_path)

    archive_hashes = {
        can001["archive"]["sha256"],
        can002["authority"]["archive_sha256"],
        can003["authority"]["archive_sha256"],
    }

    if archive_hashes != {AUTHORITATIVE_ARCHIVE_SHA256}:
        raise ValueError(
            "CAN-001, CAN-002, and CAN-003 do not agree on the archive hash"
        )

    domains = [
        build_domain_row(
            domain,
            can002,
            can003,
            repo_root,
            output_dir,
        )
        for domain in DOMAINS
    ]

    unresolved_domain_ids = [
        row["domain_id"]
        for row in domains
        if (
            row["unresolved_authority"]
            or row["canonical_owner"]["status"] == "unresolved"
            or row["approval_authority"]["status"] == "unresolved"
        )
    ]

    conflict_domain_ids = [
        row["domain_id"]
        for row in domains
        if row["conflicting_or_superseded_documents"]
    ]

    counts = collections.Counter()

    for row in domains:
        if row["primary_historical_source"] is not None:
            counts["domains_with_historical_primary"] += 1

        if row["extracted_working_copy"] is not None:
            counts["domains_with_extracted_copy"] += 1

        if row["later_approved_active_canon"] is not None:
            counts["domains_with_single_active_canon"] += 1

        if row["derived_references"]:
            counts["domains_with_derived_references"] += 1

        if row["operational_documents"]:
            counts["domains_with_operational_documents"] += 1

    return {
        "schema_version": SCHEMA_VERSION,
        "authority_order": list(AUTHORITY_ORDER),
        "source_audits": {
            "can_001": {
                "path": can001_path.relative_to(repo_root).as_posix(),
                "archive_sha256": can001["archive"]["sha256"],
                "archive_entry_count": can001["archive"]["entry_count"],
            },
            "can_002": {
                "path": can002_path.relative_to(repo_root).as_posix(),
                "archive_sha256": can002["authority"]["archive_sha256"],
                "masterplan_docx_count": can002["summary"]["archive_docx_count"],
                "mapped_masterplan_count": can002["summary"]["mapped_archive_count"],
            },
            "can_003": {
                "path": can003_path.relative_to(repo_root).as_posix(),
                "archive_sha256": can003["authority"]["archive_sha256"],
                "archive_markdown_count": can003["summary"]["archive_markdown_count"],
                "mapped_markdown_count": can003["summary"]["mapped_archive_count"],
            },
        },
        "summary": {
            "domain_count": len(domains),
            "domains_with_historical_primary": counts[
                "domains_with_historical_primary"
            ],
            "domains_with_extracted_copy": counts[
                "domains_with_extracted_copy"
            ],
            "domains_with_single_active_canon": counts[
                "domains_with_single_active_canon"
            ],
            "domains_with_derived_references": counts[
                "domains_with_derived_references"
            ],
            "domains_with_operational_documents": counts[
                "domains_with_operational_documents"
            ],
            "domains_with_visible_conflicts": len(conflict_domain_ids),
            "domains_with_unresolved_authority": len(unresolved_domain_ids),
        },
        "conflict_domain_ids": conflict_domain_ids,
        "unresolved_domain_ids": unresolved_domain_ids,
        "domains": domains,
    }


def json_bytes(matrix: dict[str, Any]) -> bytes:
    return (
        json.dumps(
            matrix,
            ensure_ascii=False,
            indent=2,
            sort_keys=True,
        )
        + "\n"
    ).encode("utf-8")


def compact_paths(
    rows: list[dict[str, Any]],
    limit: int = 4,
) -> str:
    paths = [row["path"] for row in rows]

    if not paths:
        return "None identified"

    selected = paths[:limit]
    text = "<br>".join(f"`{path}`" for path in selected)

    if len(paths) > limit:
        text += f"<br>… +{len(paths) - limit} more"

    return text


def matrix_markdown(matrix: dict[str, Any]) -> str:
    summary = matrix["summary"]

    lines = [
        "# DROPi Canonical Authority Matrix",
        "",
        "## Purpose",
        "",
        "This matrix documents the authority chain discovered from the completed "
        "CAN-001, CAN-002, and CAN-003 audits.",
        "",
        "It does not silently select an authority where ownership, approval, "
        "provenance, or conflict resolution is absent. Such cases remain "
        "explicitly unresolved.",
        "",
        "## Global authority order",
        "",
        "| Rank | Source class | Location | Authority meaning |",
        "|---:|---|---|---|",
    ]

    for row in matrix["authority_order"]:
        lines.append(
            f"| {row['rank']} | {row['source_class']} | "
            f"`{row['location']}` | {row['meaning']} |"
        )

    lines.extend(
        [
            "",
            "## Summary",
            "",
            f"- Canonical domains: {summary['domain_count']}",
            f"- Domains with historical primary candidate: "
            f"{summary['domains_with_historical_primary']}",
            f"- Domains with mapped extracted copy: "
            f"{summary['domains_with_extracted_copy']}",
            f"- Domains with one active-canon candidate: "
            f"{summary['domains_with_single_active_canon']}",
            f"- Domains with derived references: "
            f"{summary['domains_with_derived_references']}",
            f"- Domains with operational documents: "
            f"{summary['domains_with_operational_documents']}",
            f"- Domains with visible conflicts: "
            f"{summary['domains_with_visible_conflicts']}",
            f"- Domains with unresolved authority: "
            f"{summary['domains_with_unresolved_authority']}",
            "",
            "## Authority matrix",
            "",
            "| Domain | Primary historical source | Extracted working copy | "
            "Later active canon | Derived references | Operational documents | "
            "Conflicts/unresolved authority | Implementation relevance |",
            "|---|---|---|---|---|---|---|---|",
        ]
    )

    for row in matrix["domains"]:
        primary = row["primary_historical_source"]
        primary_text = (
            f"`{primary['path']}`"
            if primary is not None
            else "Unresolved"
        )

        extracted = row["extracted_working_copy"]
        extracted_text = (
            f"`{extracted['path']}`"
            if extracted is not None
            else "None identified"
        )

        active = row["later_approved_active_canon"]
        active_text = (
            f"`{active['path']}`"
            if active is not None
            else (
                "Unresolved"
                if row["active_canon_candidates"]
                else "None identified"
            )
        )

        conflict_count = len(
            row["conflicting_or_superseded_documents"]
        )

        unresolved_count = len(row["unresolved_authority"])

        authority_text = (
            f"conflicts: {conflict_count}; "
            f"unresolved findings: {unresolved_count}; "
            "owner: unresolved; approval authority: unresolved"
        )

        lines.append(
            f"| {row['domain']} | {primary_text} | {extracted_text} | "
            f"{active_text} | {compact_paths(row['derived_references'])} | "
            f"{compact_paths(row['operational_documents'])} | "
            f"{authority_text} | {row['implementation_relevance']} |"
        )

    lines.extend(
        [
            "",
            "## Domain authority chains",
            "",
        ]
    )

    for row in matrix["domains"]:
        lines.extend(
            [
                f"### {row['domain']}",
                "",
                f"**Implementation relevance:** "
                f"{row['implementation_relevance']}",
                "",
                "**Authority chain:**",
                "",
            ]
        )

        for chain_item in row["authority_chain"]:
            value = chain_item["value"]

            if isinstance(value, dict):
                value_text = f"`{value.get('path', 'unresolved')}`"
            elif isinstance(value, list):
                value_text = (
                    ", ".join(
                        f"`{item['path']}`"
                        for item in value
                    )
                    if value
                    else "None identified"
                )
            elif value is None:
                value_text = "Unresolved or not identified"
            else:
                value_text = str(value)

            lines.append(
                f"{chain_item['rank']}. "
                f"**{chain_item['role']}** — {value_text}"
            )

        lines.extend(
            [
                "",
                "**Canonical owner:** unresolved — no explicit domain owner "
                "was established by CAN-001–CAN-003.",
                "",
                "**Approval authority:** unresolved — no explicit domain-level "
                "approval provenance was established by CAN-001–CAN-003.",
                "",
                "**Conflicts and potentially superseded candidates:**",
                "",
            ]
        )

        if row["conflicting_or_superseded_documents"]:
            for conflict in row[
                "conflicting_or_superseded_documents"
            ]:
                lines.append(
                    f"- `{conflict['type']}`: "
                    + ", ".join(
                        f"`{path}`"
                        for path in conflict["paths"]
                    )
                )
                lines.append(
                    f"  - Resolution status: {conflict['resolution']}"
                )
        else:
            lines.append("- No candidate conflict detected by this audit.")

        lines.extend(
            [
                "",
                "**Unresolved authority findings:**",
                "",
            ]
        )

        if row["unresolved_authority"]:
            for finding in row["unresolved_authority"]:
                lines.append(f"- {finding}")
        else:
            lines.append(
                "- No additional unresolved source-selection finding; "
                "ownership and approval remain unresolved."
            )

        lines.append("")

    lines.extend(
        [
            "## Interpretation rules",
            "",
            "- A keyword match identifies a candidate; it does not silently "
            "grant approval or canonical ownership.",
            "- A mapped extracted copy remains subordinate to its authoritative "
            "archive source.",
            "- A derived reference never independently overrides an earlier "
            "authority level.",
            "- Multiple active-canon candidates remain unresolved until explicit "
            "approval provenance identifies the winner.",
            "- Implementation and operational documents must conform to the "
            "resolved authority chain.",
            "- CAN-004 records uncertainty instead of inventing missing governance.",
            "",
        ]
    )

    return "\n".join(lines)


def readme_text() -> str:
    return """# CAN-004 audit artifacts

This directory contains the deterministic DROPi Canonical Authority Matrix.

## Inputs

- `docs/audits/can-001/04_zip_inventory.json`
- `docs/audits/can-002/masterplan_comparison.json`
- `docs/audits/can-003/zip_markdown_inventory.json`
- repository Markdown paths used only for deterministic candidate discovery

## Outputs

- `canonical_authority_matrix.json`
- `canonical_authority_matrix.md`
- `README.md`

## Safety and interpretation

- The historical archive remains the highest historical authority.
- Extracted copies remain subordinate to their archive sources.
- Derived references remain subordinate.
- Keyword discovery does not create approval or ownership.
- Missing owner or approval evidence is marked `unresolved`.
- Multiple candidates are displayed rather than silently reconciled.
- No canonical source content is changed.

## Regenerate

    python scripts/build_canonical_authority_matrix.py \
      --repo-root . \
      --output-dir docs/audits/can-004

## Tests

    python -m unittest -v tests/test_canonical_authority_matrix.py
"""


def write_outputs(
    matrix: dict[str, Any],
    output_dir: pathlib.Path,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    (
        output_dir / "canonical_authority_matrix.json"
    ).write_bytes(json_bytes(matrix))

    (
        output_dir / "canonical_authority_matrix.md"
    ).write_text(
        matrix_markdown(matrix),
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
        description="Build the DROPi Canonical Authority Matrix."
    )

    parser.add_argument("--repo-root", default=".")
    parser.add_argument(
        "--output-dir",
        default="docs/audits/can-004",
    )
    parser.add_argument(
        "--can-001",
        default="docs/audits/can-001/04_zip_inventory.json",
    )
    parser.add_argument(
        "--can-002",
        default="docs/audits/can-002/masterplan_comparison.json",
    )
    parser.add_argument(
        "--can-003",
        default="docs/audits/can-003/zip_markdown_inventory.json",
    )

    return parser.parse_args(argv)


def main(
    argv: Iterable[str] | None = None,
) -> int:
    args = parse_args(argv)

    repo_root = pathlib.Path(args.repo_root).resolve()
    output_dir = pathlib.Path(args.output_dir).resolve()

    can001_path = pathlib.Path(args.can_001).resolve()
    can002_path = pathlib.Path(args.can_002).resolve()
    can003_path = pathlib.Path(args.can_003).resolve()

    for source in (
        can001_path,
        can002_path,
        can003_path,
    ):
        if not source.is_file():
            raise FileNotFoundError(
                f"required source audit does not exist: {source}"
            )

    matrix = build_matrix(
        repo_root=repo_root,
        output_dir=output_dir,
        can001_path=can001_path,
        can002_path=can002_path,
        can003_path=can003_path,
    )

    write_outputs(matrix, output_dir)

    summary = matrix["summary"]

    print(f"Canonical domains: {summary['domain_count']}")
    print(
        "Domains with historical primary: "
        f"{summary['domains_with_historical_primary']}"
    )
    print(
        "Domains with visible conflicts: "
        f"{summary['domains_with_visible_conflicts']}"
    )
    print(
        "Domains with unresolved authority: "
        f"{summary['domains_with_unresolved_authority']}"
    )
    print(f"Output directory: {output_dir}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
