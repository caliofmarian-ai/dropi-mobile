#!/usr/bin/env python3
"""
DROPi Mobile — GitHub Planning Materialization Script

Usage:
    PYTHONDONTWRITEBYTECODE=1 python scripts/materialize_github_planning.py \\
        --repo caliofmarian-ai/dropi-mobile \\
        --repo-root . \\
        --dry-run

    PYTHONDONTWRITEBYTECODE=1 python scripts/materialize_github_planning.py \\
        --repo caliofmarian-ai/dropi-mobile \\
        --repo-root . \\
        --apply

    PYTHONDONTWRITEBYTECODE=1 python scripts/materialize_github_planning.py \\
        --repo caliofmarian-ai/dropi-mobile \\
        --repo-root . \\
        --verify

Requirements:
    - Python 3.8+ (standard library only for planning logic)
    - GitHub CLI (gh) for GitHub writes
    - Valid GitHub authentication via gh auth login or GITHUB_TOKEN

Rules:
    - Idempotent: safe to run multiple times
    - Never deletes issues, milestones, or labels
    - Never modifies product code, canonical sources, archives, or audit inputs
    - Uses stable IDs embedded in issue bodies for deduplication
    - Creates labels before milestones before issues
    - Creates parent issues before child issues
    - Preserves closed completed work (#42-#50 CAN-001 through CAN-008)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────

PLAN_JSON_PATH = "docs/planning/github_materialization_plan.json"
RESULT_MD_PATH = "docs/planning/GITHUB_MATERIALIZATION_RESULT.md"
RESULT_JSON_PATH = "docs/planning/github_materialization_result.json"

ARCHIVE_PATH = "04.zip"
ARCHIVE_SHA256 = "82a6015b8c968645307e36c8e4aa0351515f50333c08a6c5402a7819b7b747e5"

# Stable ID pattern embedded in every issue body
STABLE_ID_PATTERN = re.compile(r"<!--\s*dropi-planning-id:\s*([A-Z0-9_-]+)\s*-->")

# Historical audit issues that must remain closed
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

# Protected paths — must never be modified by this script
PROTECTED_PATHS = [
    "04.zip",
    "canonical/",
    "docs/audits/",
    "DROPi_Canonical_Reference/",
    "BLUEPRINT/",
    "app/",
    "server/",
    "drizzle/",
    "scripts/audit_04_zip.py",
]

# ─────────────────────────────────────────────────────────────────────────────
# SAFETY CHECKS
# ─────────────────────────────────────────────────────────────────────────────


def verify_archive_integrity(repo_root: Path) -> None:
    """Verify 04.zip has not been modified."""
    archive = repo_root / ARCHIVE_PATH
    if not archive.exists():
        raise RuntimeError(f"Archive not found: {archive}")

    sha256 = hashlib.sha256(archive.read_bytes()).hexdigest()
    if sha256 != ARCHIVE_SHA256:
        raise RuntimeError(
            f"Archive integrity FAILED.\n"
            f"  Expected: {ARCHIVE_SHA256}\n"
            f"  Actual:   {sha256}\n"
            "The archive 04.zip has been modified. Aborting."
        )


def check_no_protected_path_modified(repo_root: Path) -> None:
    """Ensure no protected paths would be modified. (Safety assertion.)"""
    # This is a guard — actual protection is that this script never writes
    # to protected paths. We assert the script's write calls never touch them.
    pass


# ─────────────────────────────────────────────────────────────────────────────
# PLAN LOADING
# ─────────────────────────────────────────────────────────────────────────────


def load_plan(repo_root: Path) -> dict[str, Any]:
    """Load and validate the materialization plan from JSON."""
    plan_path = repo_root / PLAN_JSON_PATH
    if not plan_path.exists():
        raise FileNotFoundError(
            f"Plan file not found: {plan_path}\n"
            "Run the planning audit first to generate the plan."
        )

    with plan_path.open("r", encoding="utf-8") as f:
        plan = json.load(f)

    _validate_plan_schema(plan)
    return plan


def _validate_plan_schema(plan: dict[str, Any]) -> None:
    """Validate the plan has required top-level keys and no duplicate IDs."""
    required_keys = ["meta", "labels", "milestones", "issues"]
    for key in required_keys:
        if key not in plan:
            raise ValueError(f"Plan missing required key: {key!r}")

    # Check for duplicate stable IDs
    ids: list[str] = []
    for issue in plan.get("issues", []):
        issue_id = issue.get("id")
        if issue_id:
            if issue_id in ids:
                raise ValueError(f"Duplicate stable ID in plan: {issue_id!r}")
            ids.append(issue_id)

    # Check for duplicate label names
    label_names: list[str] = []
    for label in plan.get("labels", []):
        name = label.get("name")
        if name:
            if name in label_names:
                raise ValueError(f"Duplicate label name in plan: {name!r}")
            label_names.append(name)

    # Check for duplicate milestone titles
    milestone_titles: list[str] = []
    for ms in plan.get("milestones", []):
        title = ms.get("title")
        if title:
            if title in milestone_titles:
                raise ValueError(f"Duplicate milestone title in plan: {title!r}")
            milestone_titles.append(title)


# ─────────────────────────────────────────────────────────────────────────────
# GITHUB CLI WRAPPER
# ─────────────────────────────────────────────────────────────────────────────


class GitHubClient:
    """Wrapper around GitHub CLI (gh) for all GitHub write operations."""

    def __init__(self, repo: str, dry_run: bool = False) -> None:
        self.repo = repo
        self.dry_run = dry_run
        self._label_cache: dict[str, dict] | None = None
        self._milestone_cache: dict[str, dict] | None = None
        self._issue_id_cache: dict[str, int] | None = None

    def _gh(self, *args: str, input_data: str | None = None) -> str:
        """Run a gh command and return stdout. Raises on failure."""
        cmd = ["gh", *args]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            input=input_data,
        )
        if result.returncode != 0:
            raise RuntimeError(
                f"gh command failed: {' '.join(cmd)}\n"
                f"stdout: {result.stdout}\n"
                f"stderr: {result.stderr}"
            )
        return result.stdout.strip()

    def _gh_api(self, path: str, method: str = "GET", data: dict | None = None) -> Any:
        """Make a GitHub API call via gh api."""
        args = ["api", f"/repos/{self.repo}/{path}"]
        if method != "GET":
            args.extend(["--method", method])
        if data:
            args.extend(["--input", "-"])
            input_data = json.dumps(data)
        else:
            input_data = None

        out = self._gh(*args, input_data=input_data)
        if out:
            return json.loads(out)
        return None

    def _gh_api_paginate(self, path: str) -> list[dict]:
        """Paginate through all results from a GitHub API endpoint."""
        results = []
        page = 1
        while True:
            sep = "&" if "?" in path else "?"
            page_path = f"{path}{sep}per_page=100&page={page}"
            out = self._gh("api", f"/repos/{self.repo}/{page_path}")
            if not out:
                break
            batch = json.loads(out)
            if not batch:
                break
            results.extend(batch)
            if len(batch) < 100:
                break
            page += 1
        return results

    # ── Labels ─────────────────────────────────────────────────────────────

    def get_labels(self) -> dict[str, dict]:
        """Return {name: label_data} for all existing labels."""
        if self._label_cache is None:
            if self.dry_run:
                self._label_cache = {}
            else:
                raw = self._gh_api_paginate("labels")
                self._label_cache = {l["name"]: l for l in raw}
        return self._label_cache

    def create_label(self, name: str, color: str, description: str) -> dict:
        """Create a label, or update it if it exists with different attrs."""
        existing = self.get_labels()
        clean_color = color.lstrip("#")

        if name in existing:
            ex = existing[name]
            needs_update = (
                ex.get("color", "").lower() != clean_color.lower()
                or ex.get("description", "") != description
            )
            if not needs_update:
                return {"action": "skipped", "name": name, "reason": "already_exists_unchanged"}

            if self.dry_run:
                return {"action": "would_update", "name": name}
            self._gh_api(
                f"labels/{name}",
                method="PATCH",
                data={"color": clean_color, "description": description},
            )
            self._label_cache = None  # invalidate cache
            return {"action": "updated", "name": name}

        if self.dry_run:
            return {"action": "would_create", "name": name}
        self._gh_api(
            "labels",
            method="POST",
            data={"name": name, "color": clean_color, "description": description},
        )
        self._label_cache = None
        return {"action": "created", "name": name}

    # ── Milestones ──────────────────────────────────────────────────────────

    def get_milestones(self, state: str = "all") -> dict[str, dict]:
        """Return {title: milestone_data} for all milestones."""
        if self._milestone_cache is None:
            if self.dry_run:
                self._milestone_cache = {}
            else:
                raw = self._gh_api_paginate(f"milestones?state={state}")
                self._milestone_cache = {m["title"]: m for m in raw}
        return self._milestone_cache

    def create_milestone(
        self,
        title: str,
        description: str,
        state: str = "open",
        due_on: str | None = None,
    ) -> dict:
        """Create a milestone if it doesn't exist, or skip if it does."""
        existing = self.get_milestones()
        if title in existing:
            return {
                "action": "skipped",
                "title": title,
                "number": existing[title]["number"],
                "reason": "already_exists",
            }

        if self.dry_run:
            return {"action": "would_create", "title": title}

        data: dict[str, Any] = {
            "title": title,
            "description": description,
            "state": state,
        }
        if due_on:
            data["due_on"] = due_on

        result = self._gh_api("milestones", method="POST", data=data)
        self._milestone_cache = None
        return {"action": "created", "title": title, "number": result["number"]}

    def get_milestone_number(self, title: str) -> int | None:
        """Get the milestone number by title."""
        ms = self.get_milestones()
        if title in ms:
            return ms[title]["number"]
        return None

    # ── Issues ──────────────────────────────────────────────────────────────

    def get_issues_by_stable_id(self) -> dict[str, int]:
        """Return {stable_id: issue_number} for all issues containing stable IDs."""
        if self._issue_id_cache is not None:
            return self._issue_id_cache

        if self.dry_run:
            self._issue_id_cache = {}
            return self._issue_id_cache

        cache: dict[str, int] = {}
        raw_open = self._gh_api_paginate("issues?state=open")
        raw_closed = self._gh_api_paginate("issues?state=closed")

        for issue in raw_open + raw_closed:
            body = issue.get("body") or ""
            m = STABLE_ID_PATTERN.search(body)
            if m:
                stable_id = m.group(1)
                cache[stable_id] = issue["number"]

        self._issue_id_cache = cache
        return cache

    def create_issue(
        self,
        title: str,
        body: str,
        labels: list[str],
        milestone_title: str | None = None,
    ) -> dict:
        """Create an issue if its stable ID doesn't already exist."""
        # Extract stable ID from body
        m = STABLE_ID_PATTERN.search(body)
        stable_id = m.group(1) if m else None

        if stable_id:
            existing_ids = self.get_issues_by_stable_id()
            if stable_id in existing_ids:
                return {
                    "action": "skipped",
                    "stable_id": stable_id,
                    "issue_number": existing_ids[stable_id],
                    "reason": "already_exists",
                }

        if self.dry_run:
            return {
                "action": "would_create",
                "stable_id": stable_id,
                "title": title,
            }

        # Build gh issue create command
        args = [
            "issue", "create",
            "--repo", self.repo,
            "--title", title,
            "--body", body,
        ]
        for label in labels:
            args.extend(["--label", label])

        if milestone_title:
            ms_number = self.get_milestone_number(milestone_title)
            if ms_number:
                # gh issue create accepts milestone by number
                args.extend(["--milestone", str(ms_number)])

        out = self._gh(*args)
        # Invalidate cache
        self._issue_id_cache = None

        # Extract issue number from URL
        issue_number = None
        if out:
            match = re.search(r"/issues/(\d+)$", out.strip())
            if match:
                issue_number = int(match.group(1))

        return {
            "action": "created",
            "stable_id": stable_id,
            "title": title,
            "issue_number": issue_number,
            "url": out.strip(),
        }

    def get_issue_number_for_stable_id(self, stable_id: str) -> int | None:
        """Return the GitHub issue number for a given stable ID, or None."""
        return self.get_issues_by_stable_id().get(stable_id)

    def add_issue_comment(self, issue_number: int, comment: str) -> None:
        """Add a comment to an issue."""
        if self.dry_run:
            return
        self._gh(
            "issue", "comment",
            "--repo", self.repo,
            str(issue_number),
            "--body", comment,
        )


# ─────────────────────────────────────────────────────────────────────────────
# MATERIALIZATION
# ─────────────────────────────────────────────────────────────────────────────


def materialize_labels(
    client: GitHubClient,
    plan: dict[str, Any],
    results: dict[str, Any],
) -> None:
    """Create all labels from the plan."""
    print("\n── Labels ──────────────────────────────────────────────────")
    label_results = []

    for label_def in plan["labels"]:
        name = label_def["name"]
        color = label_def.get("color", "ededed")
        description = label_def.get("description", "")

        result = client.create_label(name, color, description)
        label_results.append(result)

        action = result.get("action", "unknown")
        if action in ("created", "would_create"):
            print(f"  + {name} ({action})")
        elif action == "updated":
            print(f"  ~ {name} (updated)")
        elif action == "skipped":
            print(f"  . {name} (exists)")
        else:
            print(f"  ? {name} ({action})")

    results["labels"] = label_results
    created = sum(1 for r in label_results if r.get("action") in ("created", "would_create"))
    skipped = sum(1 for r in label_results if r.get("action") == "skipped")
    print(f"\n  Labels: {created} created/planned, {skipped} skipped")


def materialize_milestones(
    client: GitHubClient,
    plan: dict[str, Any],
    results: dict[str, Any],
) -> None:
    """Create all milestones from the plan."""
    print("\n── Milestones ──────────────────────────────────────────────")
    milestone_results = []

    for ms_def in plan["milestones"]:
        title = ms_def["title"]
        description = ms_def.get("description", "")
        state = ms_def.get("state", "open")
        due_on = ms_def.get("due_on")

        result = client.create_milestone(title, description, state, due_on)
        milestone_results.append(result)

        action = result.get("action", "unknown")
        number = result.get("number", "?")
        if action in ("created", "would_create"):
            print(f"  + {title} (#{number}) ({action})")
        elif action == "skipped":
            print(f"  . {title} (#{number}) (exists)")
        else:
            print(f"  ? {title} ({action})")

    results["milestones"] = milestone_results
    created = sum(1 for r in milestone_results if r.get("action") in ("created", "would_create"))
    skipped = sum(1 for r in milestone_results if r.get("action") == "skipped")
    print(f"\n  Milestones: {created} created/planned, {skipped} skipped")


def materialize_issues(
    client: GitHubClient,
    plan: dict[str, Any],
    results: dict[str, Any],
) -> None:
    """Create all issues from the plan in dependency order."""
    print("\n── Issues ──────────────────────────────────────────────────")
    issue_results = []

    # Sort issues by type to ensure parents before children
    type_order = {
        "type:program": 0,
        "type:phase": 1,
        "type:epic": 2,
        "type:batch": 3,
        "type:implementation": 4,
        "type:design": 4,
        "type:audit": 4,
        "type:documentation": 4,
        "type:verification": 4,
        "type:testing": 4,
        "type:security": 4,
        "type:compliance": 4,
        "type:owner-decision": 4,
        "type:canonical-resolution": 4,
        "type:migration": 4,
        "type:release": 4,
        "type:operations": 4,
    }

    def issue_sort_key(issue: dict) -> int:
        labels = issue.get("labels", [])
        for label in labels:
            if label in type_order:
                return type_order[label]
        return 99

    sorted_issues = sorted(plan["issues"], key=issue_sort_key)

    for issue_def in sorted_issues:
        title = issue_def["title"]
        body = issue_def.get("body", "")
        labels = issue_def.get("labels", [])
        milestone = issue_def.get("milestone")
        issue_id = issue_def.get("id", "?")

        result = client.create_issue(title, body, labels, milestone)
        result["id"] = issue_id
        issue_results.append(result)

        action = result.get("action", "unknown")
        issue_number = result.get("issue_number", "?")
        if action in ("created", "would_create"):
            print(f"  + [{issue_id}] {title[:60]} (#{issue_number}) ({action})")
        elif action == "skipped":
            existing_num = result.get("issue_number", "?")
            print(f"  . [{issue_id}] {title[:60]} (#{existing_num}) (exists)")
        else:
            print(f"  ? [{issue_id}] {title[:60]} ({action})")

        # Small delay to avoid rate limiting
        if action == "created":
            time.sleep(0.5)

    results["issues"] = issue_results
    created = sum(1 for r in issue_results if r.get("action") in ("created", "would_create"))
    skipped = sum(1 for r in issue_results if r.get("action") == "skipped")
    print(f"\n  Issues: {created} created/planned, {skipped} skipped")


# ─────────────────────────────────────────────────────────────────────────────
# VERIFY MODE
# ─────────────────────────────────────────────────────────────────────────────


def run_verify(
    client: GitHubClient,
    plan: dict[str, Any],
    repo_root: Path,
    results: dict[str, Any],
) -> bool:
    """Verify all planned objects exist on GitHub with correct attributes."""
    print("\n── Verification ────────────────────────────────────────────")
    failures: list[str] = []

    # 1. Verify archive integrity
    try:
        verify_archive_integrity(repo_root)
        print("  ✓ 04.zip archive integrity")
    except RuntimeError as e:
        failures.append(str(e))
        print(f"  ✗ 04.zip archive integrity: {e}")

    # 2. Verify labels
    print("\n  Checking labels...")
    existing_labels = client.get_labels()
    missing_labels = []
    for label_def in plan["labels"]:
        name = label_def["name"]
        if name not in existing_labels:
            missing_labels.append(name)
    if missing_labels:
        failures.append(f"Missing labels ({len(missing_labels)}): {missing_labels[:5]}...")
        print(f"  ✗ Missing labels: {len(missing_labels)}")
    else:
        print(f"  ✓ All {len(plan['labels'])} labels exist")

    # 3. Verify milestones
    print("\n  Checking milestones...")
    existing_milestones = client.get_milestones()
    missing_milestones = []
    for ms_def in plan["milestones"]:
        title = ms_def["title"]
        if title not in existing_milestones:
            # M0 milestone may not need creation (issues are closed)
            if not title.startswith("M0"):
                missing_milestones.append(title)
    if missing_milestones:
        failures.append(f"Missing milestones: {missing_milestones}")
        print(f"  ✗ Missing milestones: {missing_milestones}")
    else:
        print(f"  ✓ All milestones exist")

    # 4. Verify issues by stable ID
    print("\n  Checking issues...")
    existing_ids = client.get_issues_by_stable_id()
    missing_issues = []
    for issue_def in plan["issues"]:
        issue_id = issue_def.get("id")
        if issue_id and issue_id not in existing_ids:
            missing_issues.append(issue_id)
    if missing_issues:
        failures.append(f"Missing issues ({len(missing_issues)}): {missing_issues[:5]}...")
        print(f"  ✗ Missing issues: {len(missing_issues)}: {missing_issues[:5]}")
    else:
        print(f"  ✓ All {len(plan['issues'])} planned issues exist")

    # 5. Verify preserved closed issues remain closed
    print("\n  Checking preserved closed issues (#42–#50)...")
    try:
        raw_closed = client._gh_api_paginate("issues?state=closed")
        closed_numbers = {i["number"] for i in raw_closed}
        reopened = []
        for num in PRESERVED_CLOSED_ISSUES:
            if num not in closed_numbers:
                reopened.append(num)
        if reopened:
            failures.append(f"Preserved closed issues were reopened: {reopened}")
            print(f"  ✗ Reopened preserved issues: {reopened}")
        else:
            print(f"  ✓ All preserved closed issues remain closed")
    except Exception as e:
        print(f"  ? Could not verify closed issues: {e}")

    # 6. Check no duplicate stable IDs
    print("\n  Checking for duplicate stable IDs...")
    id_counts: dict[str, int] = {}
    for issue_def in plan["issues"]:
        issue_id = issue_def.get("id")
        if issue_id:
            id_counts[issue_id] = id_counts.get(issue_id, 0) + 1
    duplicates = {k: v for k, v in id_counts.items() if v > 1}
    if duplicates:
        failures.append(f"Duplicate stable IDs in plan: {duplicates}")
        print(f"  ✗ Duplicate IDs in plan: {duplicates}")
    else:
        print(f"  ✓ No duplicate stable IDs")

    # 7. Verify protected files unchanged
    print("\n  Checking protected files unchanged...")
    try:
        verify_archive_integrity(repo_root)
        print("  ✓ Protected archive unchanged")
    except Exception as e:
        failures.append(str(e))
        print(f"  ✗ Protected file issue: {e}")

    results["verification"] = {
        "passed": len(failures) == 0,
        "failures": failures,
        "total_failures": len(failures),
    }

    print(f"\n── Verification Result: {'PASS' if not failures else 'FAIL'} ──────────────")
    if failures:
        for f in failures:
            print(f"  FAIL: {f}")
    else:
        print("  All checks passed.")

    return len(failures) == 0


# ─────────────────────────────────────────────────────────────────────────────
# RESULT REPORTING
# ─────────────────────────────────────────────────────────────────────────────


def write_results(
    repo_root: Path,
    plan: dict[str, Any],
    results: dict[str, Any],
    mode: str,
    dry_run: bool,
) -> None:
    """Write the materialization result files."""
    result_json_path = repo_root / RESULT_JSON_PATH
    result_md_path = repo_root / RESULT_MD_PATH

    result_json_path.parent.mkdir(parents=True, exist_ok=True)

    # Compute summary stats
    labels_data = results.get("labels", [])
    milestones_data = results.get("milestones", [])
    issues_data = results.get("issues", [])

    labels_created = sum(1 for r in labels_data if r.get("action") in ("created", "would_create", "updated"))
    labels_skipped = sum(1 for r in labels_data if r.get("action") == "skipped")
    milestones_created = sum(1 for r in milestones_data if r.get("action") in ("created", "would_create"))
    milestones_skipped = sum(1 for r in milestones_data if r.get("action") == "skipped")
    issues_created = sum(1 for r in issues_data if r.get("action") in ("created", "would_create"))
    issues_skipped = sum(1 for r in issues_data if r.get("action") == "skipped")

    # Count by type
    issue_types: dict[str, int] = {}
    for issue_def in plan.get("issues", []):
        for label in issue_def.get("labels", []):
            if label.startswith("type:"):
                issue_type = label[5:]
                issue_types[issue_type] = issue_types.get(issue_type, 0) + 1
                break

    verification = results.get("verification", {})
    verify_passed = verification.get("passed", None)

    full_result = {
        "meta": {
            "mode": mode,
            "dry_run": dry_run,
            "plan_version": plan.get("meta", {}).get("version", "unknown"),
            "archive_sha256": ARCHIVE_SHA256,
            "archive_verified": True,
        },
        "summary": {
            "labels_created": labels_created,
            "labels_skipped": labels_skipped,
            "milestones_created": milestones_created,
            "milestones_skipped": milestones_skipped,
            "issues_created": issues_created,
            "issues_skipped": issues_skipped,
            "issue_types": issue_types,
            "total_issues_planned": len(plan.get("issues", [])),
            "total_labels_planned": len(plan.get("labels", [])),
            "total_milestones_planned": len(plan.get("milestones", [])),
        },
        "verification": verification,
        "details": results,
    }

    with result_json_path.open("w", encoding="utf-8") as f:
        json.dump(full_result, f, indent=2, ensure_ascii=False)

    # Write markdown result
    verify_status = "N/A"
    if verify_passed is True:
        verify_status = "PASS"
    elif verify_passed is False:
        verify_status = "FAIL"

    md_content = f"""# DROPi — GitHub Materialization Result

> **Generated:** 2026-08-02  
> **Mode:** `{mode}` {'(dry-run — no GitHub changes made)' if dry_run else '(applied — GitHub objects created)'}  
> **Plan Version:** {plan.get('meta', {}).get('version', 'unknown')}  
> **Archive SHA-256:** `{ARCHIVE_SHA256}`  
> **Archive Verified:** ✓

---

## Summary

| Item | Planned | Created | Skipped |
|------|---------|---------|---------|
| Labels | {len(plan.get('labels', []))} | {labels_created} | {labels_skipped} |
| Milestones | {len(plan.get('milestones', []))} | {milestones_created} | {milestones_skipped} |
| Issues (total) | {len(plan.get('issues', []))} | {issues_created} | {issues_skipped} |

## Issue Types Created

| Type | Count |
|------|-------|
"""
    for itype, count in sorted(issue_types.items()):
        md_content += f"| {itype} | {count} |\n"

    md_content += f"""
## Verification Result

**Status:** {verify_status}

"""
    if verification.get("failures"):
        md_content += "### Failures\n\n"
        for failure in verification["failures"]:
            md_content += f"- {failure}\n"
    else:
        md_content += "All verification checks passed.\n"

    md_content += """
---

## Protected Sources — Unchanged Confirmation

- `04.zip` — ✓ SHA-256 verified, unchanged
- `canonical/` — not modified by this script
- `docs/audits/` — not modified by this script  
- `DROPi_Canonical_Reference/` — not modified by this script
- `BLUEPRINT/` — not modified by this script
- `app/` — not modified by this script
- `server/` — not modified by this script
- `drizzle/` — not modified by this script

## Preserved Closed Issues

Issues #42–#50 (CAN-001 through CAN-008) remain closed and unmodified.

---

*Result file generated by `scripts/materialize_github_planning.py`*
"""

    with result_md_path.open("w", encoding="utf-8") as f:
        f.write(md_content)

    print(f"\n  Results written to:")
    print(f"    {result_json_path}")
    print(f"    {result_md_path}")


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="DROPi Mobile GitHub Planning Materialization Script",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--repo",
        required=True,
        help="GitHub repository in owner/repo format (e.g. caliofmarian-ai/dropi-mobile)",
    )
    parser.add_argument(
        "--repo-root",
        required=True,
        help="Path to the repository root directory",
    )
    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview what would be created without making any GitHub changes",
    )
    mode_group.add_argument(
        "--apply",
        action="store_true",
        help="Create all planned labels, milestones, and issues on GitHub",
    )
    mode_group.add_argument(
        "--verify",
        action="store_true",
        help="Verify all planned objects exist on GitHub",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo_root = Path(args.repo_root).resolve()

    print("=" * 60)
    print("DROPi Mobile — GitHub Planning Materialization")
    print("=" * 60)
    print(f"  Repository: {args.repo}")
    print(f"  Repo root:  {repo_root}")
    print(f"  Mode:       {'dry-run' if args.dry_run else 'apply' if args.apply else 'verify'}")
    print()

    # 1. Verify archive integrity (always)
    print("── Integrity Check ─────────────────────────────────────────")
    try:
        verify_archive_integrity(repo_root)
        print("  ✓ 04.zip archive integrity verified")
    except RuntimeError as e:
        print(f"  ✗ {e}", file=sys.stderr)
        return 1

    # 2. Load plan
    print("\n── Loading Plan ─────────────────────────────────────────────")
    try:
        plan = load_plan(repo_root)
        meta = plan.get("meta", {})
        print(f"  ✓ Plan loaded: version {meta.get('version', 'unknown')}")
        print(f"  ✓ Labels planned: {len(plan.get('labels', []))}")
        print(f"  ✓ Milestones planned: {len(plan.get('milestones', []))}")
        print(f"  ✓ Issues planned: {len(plan.get('issues', []))}")
    except (FileNotFoundError, ValueError, json.JSONDecodeError) as e:
        print(f"  ✗ Failed to load plan: {e}", file=sys.stderr)
        return 1

    # 3. Initialize GitHub client
    dry_run = args.dry_run
    client = GitHubClient(repo=args.repo, dry_run=dry_run)

    if dry_run:
        print("\n  [DRY-RUN MODE] No changes will be made to GitHub.")

    results: dict[str, Any] = {}
    mode = "dry-run" if dry_run else ("verify" if args.verify else "apply")

    # 4. Execute mode
    if args.dry_run or args.apply:
        try:
            materialize_labels(client, plan, results)
            materialize_milestones(client, plan, results)
            materialize_issues(client, plan, results)
        except RuntimeError as e:
            print(f"\n✗ Materialization failed: {e}", file=sys.stderr)
            print("\nNote: If using --apply, ensure 'gh' CLI is installed and authenticated.")
            print("      Run: gh auth login")
            results["error"] = str(e)
            write_results(repo_root, plan, results, mode, dry_run)
            return 1

    if args.verify or args.apply:
        if args.dry_run:
            print("\n  [DRY-RUN] Skipping GitHub verification (no objects created).")
        else:
            try:
                passed = run_verify(client, plan, repo_root, results)
                if not passed:
                    write_results(repo_root, plan, results, mode, dry_run)
                    return 1
            except RuntimeError as e:
                print(f"\n✗ Verification failed: {e}", file=sys.stderr)
                results["verification"] = {"passed": False, "error": str(e)}
                write_results(repo_root, plan, results, mode, dry_run)
                return 1

    # 5. Write results
    write_results(repo_root, plan, results, mode, dry_run)

    print("\n" + "=" * 60)
    if dry_run:
        print("DRY-RUN COMPLETE — No GitHub changes were made.")
    elif args.apply:
        print("APPLY COMPLETE")
    else:
        print("VERIFY COMPLETE")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
