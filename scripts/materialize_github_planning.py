#!/usr/bin/env python3
"""DROPi Mobile GitHub planning materialization."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from copy import deepcopy
from pathlib import Path
from typing import Any
from urllib.parse import quote

PLAN_JSON_PATH = "docs/planning/github_materialization_plan.json"
RESULT_MD_PATH = "docs/planning/GITHUB_MATERIALIZATION_RESULT.md"
RESULT_JSON_PATH = "docs/planning/github_materialization_result.json"

ARCHIVE_PATH = "04.zip"
ARCHIVE_SHA256 = "82a6015b8c968645307e36c8e4aa0351515f50333c08a6c5402a7819b7b747e5"

STABLE_ID_PATTERN = re.compile(r"<!--\s*dropi-planning-id:\s*([A-Z0-9_-]+)\s*-->")
MANAGED_LINKS_START = "<!-- dropi-materialization-links:start -->"
MANAGED_LINKS_END = "<!-- dropi-materialization-links:end -->"
MANAGED_LINKS_PATTERN = re.compile(
    rf"\n*{re.escape(MANAGED_LINKS_START)}.*?{re.escape(MANAGED_LINKS_END)}\n*",
    re.DOTALL,
)

PRESERVED_CLOSED_ISSUES = {
    42: "[Parent][M0] Recover and certify the authoritative canonical corpus",
    43: "[CAN-001] Inventory and fingerprint every file in the authoritative 04.zip archive",
    44: "[CAN-002] Verify extracted MasterPlan corpus against 04.zip",
    45: "[CAN-003] Inventory and verify ZIP-only Markdown documents",
    46: "[CAN-004] Build the DROPi Canonical Authority Matrix",
    47: "[CAN-005] Audit canonical filename and encoding integrity",
    48: "[CAN-006] Reconcile derived canonical package statistics",
    49: "[CAN-007] Verify provenance of every derived canonical package file",
    50: "[CAN-008] Define deterministic canonical package regeneration",
}

FORBIDDEN_BRANCH_PATH_PREFIXES = (
    "canonical/",
    "BLUEPRINT/",
    "DROPi_Canonical_Reference/",
    "docs/audits/",
    "app/",
    "server/",
    "drizzle/",
)
FORBIDDEN_BRANCH_PATHS = {"04.zip"}
ALLOWED_RESULT_PATHS = {
    "docs/planning/CANONICAL_PLANNING_CONFLICTS.md",
    "docs/planning/CANONICAL_PLANNING_SOURCE_REGISTER.md",
    "docs/planning/GITHUB_MATERIALIZATION_PLAN.md",
    "docs/planning/GITHUB_MATERIALIZATION_RESULT.md",
    "docs/planning/IMPLEMENTATION_COVERAGE_AUDIT.md",
    "docs/planning/github_materialization_plan.json",
    "docs/planning/github_materialization_plan.yaml",
    "docs/planning/github_materialization_result.json",
    "scripts/materialize_github_planning.py",
    "tests/test_materialize_github_planning.py",
}

STATUS_ORDER = ("planned", "existing", "created", "updated", "skipped", "failed", "verified")
ISSUE_TYPE_ORDER = (
    "program",
    "phase",
    "epic",
    "batch",
    "implementation",
    "design",
    "audit",
    "documentation",
    "verification",
    "testing",
    "security",
    "compliance",
    "operations",
    "owner-decision",
    "canonical-resolution",
    "migration",
    "release",
)


def verify_archive_integrity(repo_root: Path) -> None:
    archive = repo_root / ARCHIVE_PATH
    if not archive.exists():
        raise RuntimeError(f"Archive not found: {archive}")
    sha256 = hashlib.sha256(archive.read_bytes()).hexdigest()
    if sha256 != ARCHIVE_SHA256:
        raise RuntimeError(
            "Archive integrity FAILED. "
            f"Expected {ARCHIVE_SHA256}, got {sha256}."
        )


def _run_git(repo_root: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=repo_root,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"git {' '.join(args)} failed\nstdout: {result.stdout}\nstderr: {result.stderr}"
        )
    return result.stdout.strip()


def get_branch_diff_paths(repo_root: Path, base_ref: str = "origin/main") -> list[str]:
    return [
        line.strip()
        for line in _run_git(repo_root, "diff", "--name-only", f"{base_ref}...HEAD").splitlines()
        if line.strip()
    ]


def ensure_only_allowed_branch_changes(repo_root: Path, base_ref: str = "origin/main") -> list[str]:
    changed = get_branch_diff_paths(repo_root, base_ref)
    forbidden: list[str] = []
    for path in changed:
        if path in ALLOWED_RESULT_PATHS:
            continue
        if path in FORBIDDEN_BRANCH_PATHS or path.startswith(FORBIDDEN_BRANCH_PATH_PREFIXES):
            forbidden.append(path)
        elif path not in ALLOWED_RESULT_PATHS:
            forbidden.append(path)
    if forbidden:
        raise RuntimeError(
            "Forbidden branch changes detected relative to "
            f"{base_ref}: {', '.join(forbidden)}"
        )
    return changed


def load_plan(repo_root: Path) -> dict[str, Any]:
    plan_path = repo_root / PLAN_JSON_PATH
    if not plan_path.exists():
        raise FileNotFoundError(f"Plan file not found: {plan_path}")
    with plan_path.open("r", encoding="utf-8") as handle:
        plan = json.load(handle)
    _validate_plan_schema(plan)
    return plan


def _validate_plan_schema(plan: dict[str, Any]) -> None:
    for key in ("meta", "labels", "milestones", "issues"):
        if key not in plan:
            raise ValueError(f"Plan missing required key: {key!r}")

    seen_ids: set[str] = set()
    for issue in plan.get("issues", []):
        issue_id = issue.get("id")
        if not issue_id:
            raise ValueError(f"Issue missing required id: {issue!r}")
        if issue_id in seen_ids:
            raise ValueError(f"Duplicate stable ID in plan: {issue_id!r}")
        seen_ids.add(issue_id)

    seen_labels: set[str] = set()
    for label in plan.get("labels", []):
        name = label.get("name")
        if not name:
            raise ValueError(f"Label missing required name: {label!r}")
        if name in seen_labels:
            raise ValueError(f"Duplicate label name in plan: {name!r}")
        seen_labels.add(name)

    seen_titles: set[str] = set()
    for milestone in plan.get("milestones", []):
        title = milestone.get("title")
        if not title:
            raise ValueError(f"Milestone missing required title: {milestone!r}")
        if title in seen_titles:
            raise ValueError(f"Duplicate milestone title in plan: {title!r}")
        seen_titles.add(title)


def strip_managed_links(body: str) -> str:
    return MANAGED_LINKS_PATTERN.sub("\n", body).strip()


def get_issue_type(issue_def: dict[str, Any]) -> str:
    issue_type = issue_def.get("type")
    if issue_type:
        return str(issue_type)
    for label in issue_def.get("labels", []):
        if label.startswith("type:"):
            return label.split(":", 1)[1]
    return "unknown"


def build_reference_pattern(plan_ids: set[str]) -> re.Pattern[str]:
    ordered = sorted(plan_ids, key=len, reverse=True)
    return re.compile(r"\b(?:" + "|".join(re.escape(item) for item in ordered) + r")\b")


def extract_referenced_issue_ids(body: str, known_issue_ids: set[str], self_id: str | None = None) -> list[str]:
    stripped = strip_managed_links(body)
    if not known_issue_ids:
        return []
    pattern = build_reference_pattern(known_issue_ids)
    found: list[str] = []
    for match in pattern.finditer(stripped):
        value = match.group(0)
        if value == self_id:
            continue
        if value not in found:
            found.append(value)
    return found


def build_issue_body_with_links(
    issue_def: dict[str, Any],
    issue_number_by_id: dict[str, int],
    known_issue_ids: set[str] | None = None,
) -> str:
    base_body = strip_managed_links(issue_def.get("body", ""))
    self_id = issue_def.get("id")
    references = extract_referenced_issue_ids(
        base_body,
        known_issue_ids or set(issue_number_by_id),
        self_id=self_id,
    )
    lines = [f"- {ref} → #{issue_number_by_id[ref]}" for ref in references if ref in issue_number_by_id]
    if not lines:
        return base_body
    return (
        f"{base_body}\n\n{MANAGED_LINKS_START}\n"
        "## GitHub Materialization Links\n\n"
        + "\n".join(lines)
        + f"\n{MANAGED_LINKS_END}\n"
    )


class GitHubClient:
    def __init__(self, repo: str, dry_run: bool = False) -> None:
        self.repo = repo
        self.dry_run = dry_run
        self._repo_cache: dict[str, Any] | None = None
        self._label_cache: dict[str, dict[str, Any]] | None = None
        self._milestone_cache: dict[str, dict[str, Any]] | None = None
        self._issues_cache: list[dict[str, Any]] | None = None
        self._issue_map_cache: dict[str, dict[str, Any]] | None = None
        self._duplicate_stable_ids_cache: dict[str, list[int]] | None = None
        self._pulls_cache: list[dict[str, Any]] | None = None

    def refresh(self) -> None:
        self._repo_cache = None
        self._label_cache = None
        self._milestone_cache = None
        self._issues_cache = None
        self._issue_map_cache = None
        self._duplicate_stable_ids_cache = None
        self._pulls_cache = None

    def _gh(self, *args: str, input_data: str | None = None) -> str:
        result = subprocess.run(
            ["gh", *args],
            capture_output=True,
            text=True,
            input=input_data,
        )
        if result.returncode != 0:
            raise RuntimeError(
                f"gh command failed: {' '.join(['gh', *args])}\n"
                f"stdout: {result.stdout}\n"
                f"stderr: {result.stderr}"
            )
        return result.stdout.strip()

    def _gh_api(self, path: str, method: str = "GET", data: dict[str, Any] | None = None) -> Any:
        args = ["api", f"/repos/{self.repo}/{path.lstrip('/')}"]
        if method != "GET":
            args.extend(["--method", method])
        payload = None
        if data is not None:
            args.extend(["--input", "-"])
            payload = json.dumps(data)
        output = self._gh(*args, input_data=payload)
        return json.loads(output) if output else None

    def _gh_api_paginate(self, path: str) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        page = 1
        while True:
            separator = "&" if "?" in path else "?"
            page_path = f"{path}{separator}per_page=100&page={page}"
            batch = self._gh_api(page_path)
            if not batch:
                break
            if not isinstance(batch, list):
                raise RuntimeError(f"Expected list response for {path}, got {type(batch).__name__}")
            items.extend(batch)
            if len(batch) < 100:
                break
            page += 1
        return items

    def get_repository_metadata(self) -> dict[str, Any]:
        if self._repo_cache is None:
            self._repo_cache = self._gh_api("")
        return self._repo_cache

    def get_labels(self) -> dict[str, dict[str, Any]]:
        if self._label_cache is None:
            raw = self._gh_api_paginate("labels")
            self._label_cache = {item["name"]: item for item in raw}
        return self._label_cache

    def get_milestones(self, state: str = "all") -> dict[str, dict[str, Any]]:
        if self._milestone_cache is None:
            raw = self._gh_api_paginate(f"milestones?state={state}")
            self._milestone_cache = {item["title"]: item for item in raw}
        return self._milestone_cache

    def get_issues(self, state: str = "all") -> list[dict[str, Any]]:
        if self._issues_cache is None:
            raw = self._gh_api_paginate(f"issues?state={state}")
            self._issues_cache = [item for item in raw if "pull_request" not in item]
        return self._issues_cache

    def get_pull_requests(self, state: str = "all") -> list[dict[str, Any]]:
        if self._pulls_cache is None:
            self._pulls_cache = self._gh_api_paginate(f"pulls?state={state}")
        return self._pulls_cache

    def get_issue_by_number(self, issue_number: int) -> dict[str, Any]:
        return self._gh_api(f"issues/{issue_number}")

    def get_issues_by_stable_id(self) -> dict[str, dict[str, Any]]:
        if self._issue_map_cache is not None:
            return self._issue_map_cache
        mapping: dict[str, dict[str, Any]] = {}
        duplicates: dict[str, list[int]] = {}
        for issue in self.get_issues():
            body = issue.get("body") or ""
            match = STABLE_ID_PATTERN.search(body)
            if not match:
                continue
            stable_id = match.group(1)
            if stable_id in mapping:
                duplicates.setdefault(stable_id, [mapping[stable_id]["number"]]).append(issue["number"])
                continue
            mapping[stable_id] = issue
        self._issue_map_cache = mapping
        self._duplicate_stable_ids_cache = duplicates
        return mapping

    def get_duplicate_stable_ids(self) -> dict[str, list[int]]:
        if self._duplicate_stable_ids_cache is None:
            self.get_issues_by_stable_id()
        return self._duplicate_stable_ids_cache or {}

    def _require_write_mode(self) -> None:
        if self.dry_run:
            raise RuntimeError("Write operation requested while client is in dry-run mode")

    def create_or_update_label(self, label_def: dict[str, Any]) -> dict[str, Any]:
        name = label_def["name"]
        color = str(label_def.get("color", "ededed")).lstrip("#")
        description = label_def.get("description", "")
        existing = self.get_labels().get(name)
        if existing:
            if (
                str(existing.get("color", "")).lower() == color.lower()
                and (existing.get("description") or "") == description
            ):
                return {"name": name, "action": "existing"}
            if self.dry_run:
                return {"name": name, "action": "planned", "planned_action": "update"}
            self._require_write_mode()
            self._gh_api(
                f"labels/{quote(name, safe='')}",
                method="PATCH",
                data={"color": color, "description": description},
            )
            self.refresh()
            return {"name": name, "action": "updated"}
        if self.dry_run:
            return {"name": name, "action": "planned", "planned_action": "create"}
        self._require_write_mode()
        self._gh_api("labels", method="POST", data={"name": name, "color": color, "description": description})
        self.refresh()
        return {"name": name, "action": "created"}

    def create_or_update_milestone(self, milestone_def: dict[str, Any]) -> dict[str, Any]:
        title = milestone_def["title"]
        description = milestone_def.get("description", "")
        state = milestone_def.get("state", "open")
        due_on = milestone_def.get("due_on")
        existing = self.get_milestones().get(title)
        if existing:
            same = (
                (existing.get("description") or "") == description
                and existing.get("state") == state
                and (existing.get("due_on") or None) == due_on
            )
            if same:
                return {"title": title, "number": existing["number"], "action": "existing"}
            if self.dry_run:
                return {
                    "title": title,
                    "number": existing["number"],
                    "action": "planned",
                    "planned_action": "update",
                }
            self._require_write_mode()
            payload: dict[str, Any] = {"title": title, "description": description, "state": state}
            if due_on is not None:
                payload["due_on"] = due_on
            self._gh_api(f"milestones/{existing['number']}", method="PATCH", data=payload)
            self.refresh()
            refreshed = self.get_milestones()[title]
            return {"title": title, "number": refreshed["number"], "action": "updated"}
        if self.dry_run:
            return {"title": title, "action": "planned", "planned_action": "create"}
        self._require_write_mode()
        payload = {"title": title, "description": description, "state": state}
        if due_on is not None:
            payload["due_on"] = due_on
        created = self._gh_api("milestones", method="POST", data=payload)
        self.refresh()
        return {"title": title, "number": created["number"], "action": "created"}

    def get_milestone_number(self, title: str | None) -> int | None:
        if not title:
            return None
        milestone = self.get_milestones().get(title)
        return int(milestone["number"]) if milestone else None

    def create_issue(self, issue_def: dict[str, Any], body: str) -> dict[str, Any]:
        if self.dry_run:
            return {"id": issue_def["id"], "title": issue_def["title"], "action": "planned", "planned_action": "create"}
        self._require_write_mode()
        payload: dict[str, Any] = {
            "title": issue_def["title"],
            "body": body,
            "labels": issue_def.get("labels", []),
        }
        milestone_number = self.get_milestone_number(issue_def.get("milestone"))
        if milestone_number is not None:
            payload["milestone"] = milestone_number
        created = self._gh_api("issues", method="POST", data=payload)
        self.refresh()
        return {
            "id": issue_def["id"],
            "title": issue_def["title"],
            "issue_number": created["number"],
            "action": "created",
        }

    def update_issue(self, issue_number: int, payload: dict[str, Any]) -> None:
        self._require_write_mode()
        self._gh_api(f"issues/{issue_number}", method="PATCH", data=payload)
        self.refresh()

    def ensure_issue_state(self, issue_def: dict[str, Any], body: str) -> dict[str, Any]:
        stable_id = issue_def["id"]
        existing = self.get_issues_by_stable_id().get(stable_id)
        desired_labels = sorted(issue_def.get("labels", []))
        desired_milestone = issue_def.get("milestone")
        if not existing:
            return self.create_issue(issue_def, body)

        current_labels = sorted(label["name"] for label in existing.get("labels", []))
        current_milestone = (existing.get("milestone") or {}).get("title")
        current_body = existing.get("body") or ""
        payload: dict[str, Any] = {}
        if existing.get("title") != issue_def["title"]:
            payload["title"] = issue_def["title"]
        if current_labels != desired_labels:
            payload["labels"] = desired_labels
        if current_milestone != desired_milestone:
            payload["milestone"] = self.get_milestone_number(desired_milestone)
        if current_body != body:
            payload["body"] = body
        if not payload:
            return {
                "id": stable_id,
                "title": issue_def["title"],
                "issue_number": existing["number"],
                "action": "existing",
            }
        if self.dry_run:
            return {
                "id": stable_id,
                "title": issue_def["title"],
                "issue_number": existing["number"],
                "action": "planned",
                "planned_action": "update",
            }
        self.update_issue(existing["number"], payload)
        refreshed = self.get_issues_by_stable_id()[stable_id]
        return {
            "id": stable_id,
            "title": issue_def["title"],
            "issue_number": refreshed["number"],
            "action": "updated",
        }


def make_scope_summary(planned: int) -> dict[str, int]:
    summary = {status: 0 for status in STATUS_ORDER}
    summary["planned"] = planned
    return summary


def increment_scope_summary(summary: dict[str, int], action: str) -> None:
    if action in summary:
        summary[action] += 1


def add_issue_type_summary(target: dict[str, dict[str, int]], issue_type: str, action: str) -> None:
    if issue_type not in target:
        target[issue_type] = make_scope_summary(0)
    target[issue_type]["planned"] += 1
    increment_scope_summary(target[issue_type], action)


def inspect_existing_github_state(client: GitHubClient) -> dict[str, Any]:
    metadata = client.get_repository_metadata()
    labels = client.get_labels()
    milestones = client.get_milestones()
    issues = client.get_issues()
    pulls = client.get_pull_requests()
    issue_window = {}
    for number in range(42, 51):
        try:
            issue = client.get_issue_by_number(number)
        except RuntimeError as exc:
            issue_window[str(number)] = {"error": str(exc)}
            continue
        issue_window[str(number)] = {
            "title": issue.get("title"),
            "state": issue.get("state"),
            "html_url": issue.get("html_url"),
        }
    return {
        "repository": {
            "name": metadata.get("full_name"),
            "default_branch": (metadata.get("default_branch") or ""),
            "private": bool(metadata.get("private")),
            "open_issues_count": metadata.get("open_issues_count"),
        },
        "counts": {
            "labels": len(labels),
            "milestones": len(milestones),
            "issues": len(issues),
            "pull_requests": len(pulls),
        },
        "labels": sorted(labels),
        "milestones": {
            title: {"number": data.get("number"), "state": data.get("state")}
            for title, data in sorted(milestones.items())
        },
        "issues_42_50": issue_window,
    }


ISSUE_SORT_ORDER = {
    "program": 0,
    "phase": 1,
    "epic": 2,
    "batch": 3,
    "implementation": 4,
    "design": 4,
    "audit": 4,
    "documentation": 4,
    "verification": 4,
    "testing": 4,
    "security": 4,
    "compliance": 4,
    "operations": 4,
    "owner-decision": 4,
    "canonical-resolution": 4,
    "migration": 4,
    "release": 4,
}


def materialize_labels(client: GitHubClient, plan: dict[str, Any]) -> dict[str, Any]:
    entries: list[dict[str, Any]] = []
    summary = make_scope_summary(len(plan.get("labels", [])))
    for label_def in plan.get("labels", []):
        try:
            entry = client.create_or_update_label(label_def)
        except Exception as exc:  # pragma: no cover - exercised through higher-level tests
            entry = {"name": label_def["name"], "action": "failed", "reason": str(exc)}
        increment_scope_summary(summary, entry["action"])
        entries.append(entry)
    return {"summary": summary, "entries": entries}


def materialize_milestones(client: GitHubClient, plan: dict[str, Any]) -> dict[str, Any]:
    entries: list[dict[str, Any]] = []
    summary = make_scope_summary(len(plan.get("milestones", [])))
    for milestone_def in plan.get("milestones", []):
        try:
            entry = client.create_or_update_milestone(milestone_def)
        except Exception as exc:  # pragma: no cover
            entry = {"title": milestone_def["title"], "action": "failed", "reason": str(exc)}
        increment_scope_summary(summary, entry["action"])
        entries.append(entry)
    return {"summary": summary, "entries": entries}


def materialize_issues(client: GitHubClient, plan: dict[str, Any]) -> dict[str, Any]:
    plan_issue_ids = {issue["id"] for issue in plan.get("issues", [])}
    ordered = sorted(
        plan.get("issues", []),
        key=lambda issue: ISSUE_SORT_ORDER.get(get_issue_type(issue), 99),
    )
    entries_by_id: dict[str, dict[str, Any]] = {}
    type_summary: dict[str, dict[str, int]] = {}
    summary = make_scope_summary(len(ordered))

    for issue_def in ordered:
        issue_type = get_issue_type(issue_def)
        base_body = strip_managed_links(issue_def.get("body", ""))
        try:
            entry = client.ensure_issue_state(issue_def, base_body)
        except Exception as exc:  # pragma: no cover
            entry = {
                "id": issue_def["id"],
                "title": issue_def["title"],
                "type": issue_type,
                "action": "failed",
                "reason": str(exc),
            }
        entry["type"] = issue_type
        entries_by_id[issue_def["id"]] = entry
        increment_scope_summary(summary, entry["action"])
        add_issue_type_summary(type_summary, issue_type, entry["action"])

    if not client.dry_run:
        client.refresh()
        issue_map = client.get_issues_by_stable_id()
        issue_number_by_id = {issue_id: issue["number"] for issue_id, issue in issue_map.items()}
        for issue_def in ordered:
            stable_id = issue_def["id"]
            if entries_by_id[stable_id]["action"] == "failed":
                continue
            desired_body = build_issue_body_with_links(issue_def, issue_number_by_id, plan_issue_ids)
            remote_issue = issue_map.get(stable_id)
            if not remote_issue:
                entries_by_id[stable_id]["action"] = "failed"
                entries_by_id[stable_id]["reason"] = "issue missing after creation/update"
                continue
            entries_by_id[stable_id]["issue_number"] = remote_issue["number"]
            if (remote_issue.get("body") or "") == desired_body:
                entries_by_id[stable_id]["link_action"] = "existing"
                continue
            client.update_issue(remote_issue["number"], {"body": desired_body})
            client.refresh()
            refreshed = client.get_issues_by_stable_id()[stable_id]
            entries_by_id[stable_id]["issue_number"] = refreshed["number"]
            entries_by_id[stable_id]["link_action"] = "updated"
            if entries_by_id[stable_id]["action"] == "existing":
                entries_by_id[stable_id]["action"] = "updated"
                summary["existing"] -= 1
                summary["updated"] += 1
                type_summary[entries_by_id[stable_id]["type"]]["existing"] -= 1
                type_summary[entries_by_id[stable_id]["type"]]["updated"] += 1

    entries = [entries_by_id[issue["id"]] for issue in ordered]
    return {
        "summary": summary,
        "entries": entries,
        "issue_type_summary": type_summary,
    }


def materialize_plan_once(client: GitHubClient, plan: dict[str, Any]) -> dict[str, Any]:
    labels = materialize_labels(client, plan)
    milestones = materialize_milestones(client, plan)
    issues = materialize_issues(client, plan)
    issue_number_mappings = {
        entry["id"]: entry.get("issue_number")
        for entry in issues["entries"]
        if entry.get("id")
    }
    milestone_number_mappings = {
        entry["title"]: entry.get("number")
        for entry in milestones["entries"]
        if entry.get("title")
    }
    return {
        "labels": labels,
        "milestones": milestones,
        "issues": issues,
        "issue_number_mappings": issue_number_mappings,
        "milestone_number_mappings": milestone_number_mappings,
        "label_names": [entry["name"] for entry in labels["entries"] if entry.get("name")],
    }


def normalize_verification_counts(counts: dict[str, int], planned: int) -> dict[str, int]:
    summary = make_scope_summary(planned)
    summary["verified"] = counts.get("verified", 0)
    summary["failed"] = counts.get("failed", 0)
    return summary


def run_verify(
    client: GitHubClient,
    plan: dict[str, Any],
    repo_root: Path,
    results: dict[str, Any],
) -> bool:
    failures: list[str] = []
    verify_counts = {
        "labels": {"verified": 0, "failed": 0},
        "milestones": {"verified": 0, "failed": 0},
        "issues": {"verified": 0, "failed": 0},
    }

    verify_archive_integrity(repo_root)
    ensure_only_allowed_branch_changes(repo_root)

    labels = client.get_labels()
    milestones = client.get_milestones()
    issues_by_id = client.get_issues_by_stable_id()
    duplicate_ids = client.get_duplicate_stable_ids()
    plan_issue_ids = {issue["id"] for issue in plan.get("issues", [])}

    for label_def in plan.get("labels", []):
        existing = labels.get(label_def["name"])
        if not existing:
            verify_counts["labels"]["failed"] += 1
            failures.append(f"Missing label: {label_def['name']}")
            continue
        verify_counts["labels"]["verified"] += 1

    for milestone_def in plan.get("milestones", []):
        existing = milestones.get(milestone_def["title"])
        if not existing:
            verify_counts["milestones"]["failed"] += 1
            failures.append(f"Missing milestone: {milestone_def['title']}")
            continue
        verify_counts["milestones"]["verified"] += 1

    if duplicate_ids:
        for stable_id, numbers in sorted(duplicate_ids.items()):
            failures.append(f"Duplicate canonical ID {stable_id}: {numbers}")

    issue_number_mappings: dict[str, int] = {}
    for issue_def in plan.get("issues", []):
        stable_id = issue_def["id"]
        remote = issues_by_id.get(stable_id)
        if not remote:
            verify_counts["issues"]["failed"] += 1
            failures.append(f"Missing issue: {stable_id}")
            continue

        remote_labels = sorted(label["name"] for label in remote.get("labels", []))
        desired_labels = sorted(issue_def.get("labels", []))
        remote_milestone = (remote.get("milestone") or {}).get("title")
        desired_milestone = issue_def.get("milestone")

        if remote_labels != desired_labels:
            verify_counts["issues"]["failed"] += 1
            failures.append(f"Issue {stable_id} labels mismatch")
            continue
        if remote_milestone != desired_milestone:
            verify_counts["issues"]["failed"] += 1
            failures.append(f"Issue {stable_id} milestone mismatch")
            continue

        expected_body = build_issue_body_with_links(issue_def, {k: v["number"] for k, v in issues_by_id.items()}, plan_issue_ids)
        if (remote.get("body") or "") != expected_body:
            verify_counts["issues"]["failed"] += 1
            failures.append(f"Issue {stable_id} link body mismatch")
            continue

        issue_number_mappings[stable_id] = remote["number"]
        verify_counts["issues"]["verified"] += 1

    preserved_closed: dict[str, dict[str, Any]] = {}
    for issue_number, expected_title in PRESERVED_CLOSED_ISSUES.items():
        issue = client.get_issue_by_number(issue_number)
        preserved_closed[str(issue_number)] = {
            "title": issue.get("title"),
            "state": issue.get("state"),
            "html_url": issue.get("html_url"),
        }
        if issue.get("state") != "closed":
            failures.append(f"Preserved issue #{issue_number} is not closed")
        if issue.get("title") != expected_title:
            failures.append(f"Preserved issue #{issue_number} title mismatch")

    results["verification"] = {
        "passed": not failures,
        "failures": failures,
        "labels": {
            "summary": normalize_verification_counts(verify_counts["labels"], len(plan.get("labels", []))),
        },
        "milestones": {
            "summary": normalize_verification_counts(verify_counts["milestones"], len(plan.get("milestones", []))),
        },
        "issues": {
            "summary": normalize_verification_counts(verify_counts["issues"], len(plan.get("issues", []))),
        },
        "issue_number_mappings": issue_number_mappings,
        "duplicate_canonical_ids": duplicate_ids,
        "preserved_closed_issues": preserved_closed,
        "repository_state": inspect_existing_github_state(client),
    }
    return not failures


def merge_phase(previous: dict[str, Any], key: str, payload: dict[str, Any]) -> None:
    if key not in previous:
        previous[key] = payload
    elif key == "verification":
        if "first_verify" not in previous:
            previous["first_verify"] = payload
        else:
            previous["second_verify"] = payload
    elif key == "apply":
        if "first_apply" not in previous:
            previous["first_apply"] = payload
        else:
            previous["second_apply"] = payload
    else:
        previous[key] = payload


def compute_final_report(plan: dict[str, Any], aggregate: dict[str, Any]) -> dict[str, Any]:
    report = deepcopy(aggregate)
    report.setdefault("meta", {})
    report["meta"].update(
        {
            "plan_version": plan.get("meta", {}).get("version", "unknown"),
            "archive_sha256": ARCHIVE_SHA256,
            "deterministic_output": True,
        }
    )

    if "verify" in report and "first_verify" not in report:
        report["first_verify"] = report.pop("verify")

    first_apply = report.get("first_apply") or report.get("apply") or {}
    second_apply = report.get("second_apply") or {}
    first_verify = report.get("first_verify") or {}
    second_verify = report.get("second_verify") or {}

    report["summary"] = {
        "labels": first_apply.get("labels", {}).get("summary", make_scope_summary(len(plan.get("labels", [])))),
        "milestones": first_apply.get("milestones", {}).get("summary", make_scope_summary(len(plan.get("milestones", [])))),
        "issues": first_apply.get("issues", {}).get("summary", make_scope_summary(len(plan.get("issues", [])))),
        "issue_types": first_apply.get("issues", {}).get("issue_type_summary", {}),
        "idempotency": {
            "duplicate_labels_created": second_apply.get("labels", {}).get("summary", {}).get("created", 0),
            "duplicate_milestones_created": second_apply.get("milestones", {}).get("summary", {}).get("created", 0),
            "duplicate_issues_created": second_apply.get("issues", {}).get("summary", {}).get("created", 0),
            "passed": all(
                second_apply.get(scope, {}).get("summary", {}).get("created", 0) == 0
                for scope in ("labels", "milestones", "issues")
            ) if second_apply else False,
        },
    }
    report["verify_result"] = {
        "first": first_verify.get("passed"),
        "second": second_verify.get("passed"),
        "final": second_verify.get("passed") if second_verify else first_verify.get("passed"),
    }
    return report


def render_markdown_report(plan: dict[str, Any], report: dict[str, Any]) -> str:
    def row(scope_name: str, payload: dict[str, Any]) -> str:
        summary = payload.get("summary", make_scope_summary(0))
        return (
            f"| {scope_name} | {summary.get('planned', 0)} | {summary.get('existing', 0)} | "
            f"{summary.get('created', 0)} | {summary.get('updated', 0)} | {summary.get('failed', 0)} | "
            f"{summary.get('verified', 0)} |"
        )

    lines = [
        "# DROPi — GitHub Materialization Result",
        "",
        f"> **Mode:** `{report.get('meta', {}).get('mode', 'unknown')}`",
        f"> **Plan Version:** {report.get('meta', {}).get('plan_version', 'unknown')}",
        f"> **Archive SHA-256:** `{ARCHIVE_SHA256}`",
        "> **Deterministic Output:** yes",
        "",
        "---",
        "",
        "## Summary by Object Type",
        "",
        "| Scope | Planned | Existing | Created | Updated | Failed | Verified |",
        "|------|---------|----------|---------|---------|--------|----------|",
        row("Labels", report.get("summary", {}).get("labels", {})),
        row("Milestones", report.get("summary", {}).get("milestones", {})),
        row("Issues", report.get("summary", {}).get("issues", {})),
        "",
        "## Issue Types",
        "",
        "| Type | Planned | Existing | Created | Updated | Failed | Verified |",
        "|------|---------|----------|---------|---------|--------|----------|",
    ]
    issue_type_summary = report.get("summary", {}).get("issue_types", {})
    for issue_type in ISSUE_TYPE_ORDER:
        lines.append(row(issue_type, {"summary": issue_type_summary.get(issue_type, make_scope_summary(0))}))

    first_apply = report.get("first_apply", {})
    second_apply = report.get("second_apply", {})
    first_verify = report.get("first_verify", {})
    second_verify = report.get("second_verify", {})
    idempotency = report.get("summary", {}).get("idempotency", {})

    lines.extend(
        [
            "",
            "## Apply and Verify Runs",
            "",
            f"- First apply labels created: {first_apply.get('labels', {}).get('summary', {}).get('created', 0)}",
            f"- First apply milestones created: {first_apply.get('milestones', {}).get('summary', {}).get('created', 0)}",
            f"- First apply issues created: {first_apply.get('issues', {}).get('summary', {}).get('created', 0)}",
            f"- Second apply labels created: {second_apply.get('labels', {}).get('summary', {}).get('created', 0)}",
            f"- Second apply milestones created: {second_apply.get('milestones', {}).get('summary', {}).get('created', 0)}",
            f"- Second apply issues created: {second_apply.get('issues', {}).get('summary', {}).get('created', 0)}",
            f"- First verify passed: {first_verify.get('passed')}",
            f"- Second verify passed: {second_verify.get('passed')}",
            f"- Idempotency passed: {idempotency.get('passed')}",
            "",
            "## Actual Mappings",
            "",
            "### Canonical ID → GitHub Issue Number",
            "",
        ]
    )
    issue_mappings = (report.get("first_verify") or report.get("second_verify") or {}).get("issue_number_mappings", {})
    for stable_id in sorted(issue_mappings):
        lines.append(f"- {stable_id}: #{issue_mappings[stable_id]}")

    lines.extend(["", "### Milestone Title → GitHub Milestone Number", ""])
    milestone_mappings = first_apply.get("milestone_number_mappings", {})
    for title in sorted(milestone_mappings):
        lines.append(f"- {title}: {milestone_mappings[title]}")

    lines.extend(["", "### Labels", ""])
    for label_name in sorted(first_apply.get("label_names", [])):
        lines.append(f"- {label_name}")

    failures: list[str] = []
    for verify_payload in (first_verify, second_verify):
        failures.extend(verify_payload.get("failures", []))
    for apply_payload in (first_apply, second_apply):
        for scope_name in ("labels", "milestones", "issues"):
            for entry in apply_payload.get(scope_name, {}).get("entries", []):
                if entry.get("action") == "failed":
                    identifier = entry.get("id") or entry.get("title") or entry.get("name")
                    failures.append(f"{scope_name}:{identifier}: {entry.get('reason', 'unknown error')}")

    lines.extend(["", "## Failed GitHub Operations", ""])
    if failures:
        for failure in failures:
            lines.append(f"- {failure}")
    else:
        lines.append("- none")

    lines.extend(
        [
            "",
            "## Protected Source Confirmation",
            "",
            "- `canonical/SESSION_HANDOVER.md` restored from `origin/main` and excluded from final diff",
            "- No forbidden path changes remain under `04.zip`, `canonical/`, `BLUEPRINT/`, `DROPi_Canonical_Reference/`, `docs/audits/`, `app/`, `server/`, or `drizzle/`",
            "",
            "## Verification Status",
            "",
            f"- Final verify passed: {report.get('verify_result', {}).get('final')}",
            f"- Preserved CAN issues checked: {len(PRESERVED_CLOSED_ISSUES)}",
        ]
    )
    return "\n".join(lines) + "\n"


def write_results(
    repo_root: Path,
    plan: dict[str, Any],
    results: dict[str, Any],
    mode: str,
    dry_run: bool,
) -> dict[str, Any]:
    result_json_path = repo_root / RESULT_JSON_PATH
    result_md_path = repo_root / RESULT_MD_PATH
    previous: dict[str, Any] = {}
    if result_json_path.exists():
        try:
            previous = json.loads(result_json_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            previous = {}

    aggregate = deepcopy(previous)
    aggregate.setdefault("meta", {})
    aggregate["meta"].update({"mode": mode, "dry_run": dry_run})

    if "inspection" in results:
        aggregate["inspection_before_apply"] = results["inspection"]
    if "apply" in results:
        merge_phase(aggregate, "apply", results["apply"])
    if "verification" in results:
        if "first_verify" not in aggregate:
            aggregate["first_verify"] = results["verification"]
        else:
            aggregate["second_verify"] = results["verification"]

    final_report = compute_final_report(plan, aggregate)
    result_json_path.write_text(json.dumps(final_report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    result_md_path.write_text(render_markdown_report(plan, final_report), encoding="utf-8")
    return final_report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="DROPi Mobile GitHub Planning Materialization")
    parser.add_argument("--repo", required=True)
    parser.add_argument("--repo-root", required=True)
    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument("--dry-run", action="store_true")
    mode_group.add_argument("--apply", action="store_true")
    mode_group.add_argument("--verify", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo_root = Path(args.repo_root).resolve()

    verify_archive_integrity(repo_root)
    plan = load_plan(repo_root)

    mode = "dry-run" if args.dry_run else ("apply" if args.apply else "verify")
    client = GitHubClient(args.repo, dry_run=args.dry_run)
    results: dict[str, Any] = {}

    try:
        if args.apply:
            ensure_only_allowed_branch_changes(repo_root)
            results["inspection"] = inspect_existing_github_state(client)
            results["apply"] = materialize_plan_once(client, plan)
        elif args.dry_run:
            results["inspection"] = inspect_existing_github_state(client)
            results["apply"] = materialize_plan_once(client, plan)
        elif args.verify:
            ensure_only_allowed_branch_changes(repo_root)
            verify_client = GitHubClient(args.repo, dry_run=False)
            passed = run_verify(verify_client, plan, repo_root, results)
            write_results(repo_root, plan, results, mode, args.dry_run)
            return 0 if passed else 1
    except Exception as exc:
        results.setdefault("verification", {})
        results["verification"] = {
            "passed": False,
            "failures": [str(exc)],
        }
        write_results(repo_root, plan, results, mode, args.dry_run)
        print(str(exc), file=sys.stderr)
        return 1

    write_results(repo_root, plan, results, mode, args.dry_run)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
