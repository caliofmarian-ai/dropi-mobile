"""
Tests for DROPi GitHub Planning Materialization

Run:
    PYTHONDONTWRITEBYTECODE=1 python -m unittest -v tests/test_materialize_github_planning.py
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Add scripts directory to path for imports
REPO_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts"))

import materialize_github_planning as mat

PLAN_PATH = REPO_ROOT / "docs" / "planning" / "github_materialization_plan.json"
ARCHIVE_PATH = REPO_ROOT / "04.zip"
ARCHIVE_SHA256 = "82a6015b8c968645307e36c8e4aa0351515f50333c08a6c5402a7819b7b747e5"
STABLE_ID_PATTERN = re.compile(r"<!--\s*dropi-planning-id:\s*([A-Z0-9_-]+)\s*-->")


def load_plan() -> dict:
    """Load the plan JSON for testing."""
    if not PLAN_PATH.exists():
        raise FileNotFoundError(f"Plan not found: {PLAN_PATH}")
    with PLAN_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


class TestArchiveIntegrity(unittest.TestCase):
    """Verify 04.zip has not been modified."""

    def test_archive_exists(self):
        self.assertTrue(ARCHIVE_PATH.exists(), f"04.zip not found at {ARCHIVE_PATH}")

    def test_archive_sha256(self):
        """04.zip SHA-256 must match the canonical value."""
        sha256 = hashlib.sha256(ARCHIVE_PATH.read_bytes()).hexdigest()
        self.assertEqual(
            sha256,
            ARCHIVE_SHA256,
            f"04.zip integrity FAILED. Archive has been modified.\n"
            f"Expected: {ARCHIVE_SHA256}\n"
            f"Actual:   {sha256}",
        )

    def test_verify_archive_integrity_function(self):
        """The verification function must pass without exception."""
        # Should not raise
        mat.verify_archive_integrity(REPO_ROOT)


class TestPlanFileExists(unittest.TestCase):
    """Verify plan file exists and is valid JSON."""

    def test_plan_json_exists(self):
        self.assertTrue(PLAN_PATH.exists(), f"Plan JSON not found: {PLAN_PATH}")

    def test_plan_yaml_exists(self):
        yaml_path = REPO_ROOT / "docs" / "planning" / "github_materialization_plan.yaml"
        self.assertTrue(yaml_path.exists(), f"Plan YAML not found: {yaml_path}")

    def test_plan_json_valid(self):
        """Plan JSON must be valid and parseable."""
        with PLAN_PATH.open("r", encoding="utf-8") as f:
            plan = json.load(f)
        self.assertIsInstance(plan, dict)

    def test_plan_has_required_keys(self):
        plan = load_plan()
        for key in ("meta", "labels", "milestones", "issues"):
            self.assertIn(key, plan, f"Plan missing required key: {key!r}")

    def test_plan_meta_has_archive_hash(self):
        plan = load_plan()
        meta = plan.get("meta", {})
        self.assertEqual(
            meta.get("archive_sha256"),
            ARCHIVE_SHA256,
            "Plan meta must contain correct archive SHA-256",
        )


class TestLabelSchema(unittest.TestCase):
    """Validate label definitions in the plan."""

    def setUp(self):
        self.plan = load_plan()
        self.labels = self.plan["labels"]

    def test_labels_is_list(self):
        self.assertIsInstance(self.labels, list)

    def test_minimum_label_count(self):
        """Plan must define at least 100 labels."""
        self.assertGreaterEqual(len(self.labels), 100, "Plan must define at least 100 labels")

    def test_no_duplicate_label_names(self):
        names = [l["name"] for l in self.labels]
        duplicates = [n for n in names if names.count(n) > 1]
        self.assertEqual(duplicates, [], f"Duplicate label names: {list(set(duplicates))}")

    def test_all_labels_have_name(self):
        for label in self.labels:
            self.assertIn("name", label, f"Label missing 'name': {label}")
            self.assertIsInstance(label["name"], str)
            self.assertTrue(label["name"].strip(), "Label name must not be empty")

    def test_all_labels_have_color(self):
        for label in self.labels:
            self.assertIn("color", label, f"Label {label.get('name')} missing 'color'")

    def test_type_labels_exist(self):
        """Required type labels must be present."""
        names = {l["name"] for l in self.labels}
        required = [
            "type:program", "type:phase", "type:epic", "type:batch",
            "type:implementation", "type:owner-decision", "type:canonical-resolution",
            "type:audit", "type:verification", "type:documentation",
        ]
        for name in required:
            self.assertIn(name, names, f"Required label missing: {name}")

    def test_status_labels_exist(self):
        names = {l["name"] for l in self.labels}
        required = [
            "status:ready", "status:in-progress", "status:blocked",
            "status:needs-owner-decision", "status:future", "status:done",
        ]
        for name in required:
            self.assertIn(name, names, f"Required status label missing: {name}")

    def test_priority_labels_exist(self):
        names = {l["name"] for l in self.labels}
        for p in ("priority:p0", "priority:p1", "priority:p2", "priority:p3"):
            self.assertIn(p, names, f"Required priority label missing: {p}")

    def test_platform_labels_exist(self):
        names = {l["name"] for l in self.labels}
        required = ["platform:android", "platform:backend", "platform:drone", "platform:web"]
        for name in required:
            self.assertIn(name, names, f"Required platform label missing: {name}")

    def test_phase_labels_exist(self):
        names = {l["name"] for l in self.labels}
        for phase in ("phase:m1-application-core", "phase:m2-audit-core", "phase:m3-logic-core"):
            self.assertIn(phase, names, f"Required phase label missing: {phase}")

    def test_authority_labels_exist(self):
        names = {l["name"] for l in self.labels}
        for auth in ("authority:04-zip", "authority:active-canon", "authority:blueprint"):
            self.assertIn(auth, names, f"Required authority label missing: {auth}")


class TestMilestoneSchema(unittest.TestCase):
    """Validate milestone definitions in the plan."""

    def setUp(self):
        self.plan = load_plan()
        self.milestones = self.plan["milestones"]

    def test_milestones_is_list(self):
        self.assertIsInstance(self.milestones, list)

    def test_minimum_milestone_count(self):
        self.assertGreaterEqual(len(self.milestones), 6, "Plan must define at least 6 milestones")

    def test_no_duplicate_milestone_titles(self):
        titles = [m["title"] for m in self.milestones]
        duplicates = [t for t in titles if titles.count(t) > 1]
        self.assertEqual(duplicates, [], f"Duplicate milestone titles: {list(set(duplicates))}")

    def test_all_milestones_have_title(self):
        for ms in self.milestones:
            self.assertIn("title", ms, f"Milestone missing 'title': {ms}")
            self.assertTrue(ms["title"].strip())

    def test_all_milestones_have_description(self):
        for ms in self.milestones:
            self.assertIn("description", ms, f"Milestone {ms.get('title')} missing 'description'")

    def test_m0_is_closed(self):
        """M0 milestone (canonical recovery) should be closed."""
        m0 = next((m for m in self.milestones if "M0" in m.get("title", "")), None)
        if m0:
            self.assertEqual(m0.get("state"), "closed", "M0 milestone should be closed (work done)")

    def test_m1_through_m6_are_open(self):
        for title_fragment in ("M1", "M2", "M3", "M4", "M5", "M6"):
            ms = next(
                (m for m in self.milestones if title_fragment + ":" in m.get("title", "") or
                 m.get("title", "").startswith(title_fragment)),
                None,
            )
            if ms:
                self.assertIn(
                    ms.get("state"),
                    ("open", None),
                    f"Milestone {ms.get('title')} should be open",
                )


class TestIssueSchema(unittest.TestCase):
    """Validate issue definitions in the plan."""

    def setUp(self):
        self.plan = load_plan()
        self.issues = self.plan["issues"]
        self.label_names = {l["name"] for l in self.plan["labels"]}
        self.milestone_titles = {m["title"] for m in self.plan["milestones"]}

    def test_issues_is_list(self):
        self.assertIsInstance(self.issues, list)

    def test_minimum_issue_count(self):
        self.assertGreaterEqual(len(self.issues), 50, "Plan must define at least 50 issues")

    def test_no_duplicate_ids(self):
        ids = [i.get("id") for i in self.issues if i.get("id")]
        duplicates = [x for x in ids if ids.count(x) > 1]
        self.assertEqual(duplicates, [], f"Duplicate issue IDs: {list(set(duplicates))}")

    def test_all_issues_have_id(self):
        for issue in self.issues:
            self.assertIn("id", issue, f"Issue missing 'id': {issue.get('title', '?')}")

    def test_all_issues_have_title(self):
        for issue in self.issues:
            self.assertIn("title", issue, f"Issue {issue.get('id')} missing 'title'")
            self.assertTrue(issue["title"].strip())

    def test_all_issues_have_body(self):
        for issue in self.issues:
            body = issue.get("body") or ""
            self.assertTrue(
                len(body) > 50,
                f"Issue {issue.get('id')} has empty or very short body",
            )

    def test_all_issues_have_stable_id_in_body(self):
        """Every issue body must contain the stable ID HTML comment."""
        for issue in self.issues:
            body = issue.get("body") or ""
            m = STABLE_ID_PATTERN.search(body)
            self.assertIsNotNone(
                m,
                f"Issue {issue.get('id')} body missing stable ID comment "
                f"'<!-- dropi-planning-id: {issue.get('id')} -->'",
            )
            if m:
                self.assertEqual(
                    m.group(1),
                    issue.get("id"),
                    f"Issue {issue.get('id')}: stable ID in body {m.group(1)!r} != issue id",
                )

    def test_all_issues_have_labels(self):
        for issue in self.issues:
            labels = issue.get("labels") or []
            self.assertTrue(
                len(labels) >= 1,
                f"Issue {issue.get('id')} has no labels",
            )

    def test_all_issue_labels_exist_in_plan(self):
        """Every label referenced by an issue must be defined in the labels section."""
        for issue in self.issues:
            for label in issue.get("labels", []):
                self.assertIn(
                    label,
                    self.label_names,
                    f"Issue {issue.get('id')} references undefined label: {label!r}",
                )

    def test_all_issue_milestones_exist_in_plan(self):
        """Every milestone referenced by an issue must be defined in the milestones section."""
        for issue in self.issues:
            ms = issue.get("milestone")
            if ms:
                self.assertIn(
                    ms,
                    self.milestone_titles,
                    f"Issue {issue.get('id')} references undefined milestone: {ms!r}",
                )

    def test_program_issue_exists(self):
        ids = {i.get("id") for i in self.issues}
        self.assertIn("PROG-001", ids, "Program issue PROG-001 must exist")

    def test_phase_issues_exist(self):
        ids = {i.get("id") for i in self.issues}
        for phase in ("PHASE-M1", "PHASE-M2", "PHASE-M3"):
            self.assertIn(phase, ids, f"Phase issue {phase} must exist")

    def test_epic_issues_exist(self):
        ids = {i.get("id") for i in self.issues}
        for epic in ("EPIC-001", "EPIC-002", "EPIC-003"):
            self.assertIn(epic, ids, f"Epic issue {epic} must exist")

    def test_batch_issues_exist(self):
        ids = {i.get("id") for i in self.issues}
        for batch in ("BATCH-001", "BATCH-002"):
            self.assertIn(batch, ids, f"Batch issue {batch} must exist")

    def test_owner_decision_issues_exist(self):
        ids = {i.get("id") for i in self.issues}
        self.assertIn("OWNER-001", ids, "Owner decision OWNER-001 must exist")

    def test_canonical_resolution_issues_exist(self):
        ids = {i.get("id") for i in self.issues}
        self.assertIn("CANON-RES-001", ids, "Canonical resolution CANON-RES-001 must exist")

    def test_owner_decision_issues_have_question(self):
        """Owner decision issues must contain explicit questions/options."""
        for issue in self.issues:
            if "OWNER-" in issue.get("id", ""):
                body = issue.get("body") or ""
                has_question = (
                    "?" in body or "option" in body.lower() or
                    "decision" in body.lower() or "question" in body.lower()
                )
                self.assertTrue(
                    has_question,
                    f"Owner decision issue {issue.get('id')} must contain explicit question/options",
                )

    def test_canonical_resolution_issues_cite_sources(self):
        """Canonical resolution issues must cite conflicting sources."""
        for issue in self.issues:
            if "CANON-RES-" in issue.get("id", ""):
                body = issue.get("body") or ""
                has_source = (
                    "canonical" in body.lower() or
                    "source" in body.lower() or
                    "04.zip" in body or
                    "BLUEPRINT" in body or
                    "canon" in body.lower()
                )
                self.assertTrue(
                    has_source,
                    f"Canonical resolution issue {issue.get('id')} must cite sources",
                )

    def test_blocked_issues_have_blocker_reference(self):
        """Issues labeled status:blocked must reference what blocks them."""
        for issue in self.issues:
            if "status:blocked" in issue.get("labels", []):
                body = issue.get("body") or ""
                has_blocker = (
                    "blocked" in body.lower() or
                    "OWNER-" in body or
                    "CANON-RES-" in body or
                    "depends" in body.lower() or
                    "conflict" in body.lower()
                )
                self.assertTrue(
                    has_blocker,
                    f"Blocked issue {issue.get('id')} must reference its blocker",
                )

    def test_implementation_issues_have_acceptance_criteria(self):
        """Implementation issues must have acceptance criteria."""
        for issue in self.issues:
            if "type:implementation" in issue.get("labels", []):
                body = issue.get("body") or ""
                has_criteria = (
                    "acceptance" in body.lower() or
                    "criteria" in body.lower() or
                    "definition of done" in body.lower() or
                    "[ ]" in body  # checklist items
                )
                self.assertTrue(
                    has_criteria,
                    f"Implementation issue {issue.get('id')} must have acceptance criteria",
                )

    def test_epics_reference_milestone(self):
        """Epic issues should be assigned to a milestone."""
        for issue in self.issues:
            if "type:epic" in issue.get("labels", []):
                ms = issue.get("milestone")
                self.assertIsNotNone(
                    ms,
                    f"Epic issue {issue.get('id')} must be assigned to a milestone",
                )

    def test_batch_issues_reference_epic(self):
        """Batch issue bodies should reference their parent epic."""
        epic_ids = {i.get("id") for i in self.issues if "type:epic" in i.get("labels", [])}
        for issue in self.issues:
            if "type:batch" in issue.get("labels", []):
                body = issue.get("body") or ""
                # Check that some EPIC-NNN reference exists in body
                has_epic_ref = bool(re.search(r"EPIC-\d+", body))
                self.assertTrue(
                    has_epic_ref,
                    f"Batch issue {issue.get('id')} must reference its parent epic",
                )

    def test_no_issues_reference_nonexistent_epic_ids(self):
        """Issue bodies should not reference epic IDs that don't exist in the plan."""
        existing_ids = {i.get("id") for i in self.issues}
        for issue in self.issues:
            body = issue.get("body") or ""
            # Find all EPIC-NNN references in body
            refs = re.findall(r"EPIC-\d+", body)
            for ref in refs:
                self.assertIn(
                    ref,
                    existing_ids,
                    f"Issue {issue.get('id')} references nonexistent epic {ref}",
                )


class TestPlanValidation(unittest.TestCase):
    """Test the plan validation logic."""

    def test_validate_plan_schema_valid(self):
        """Valid plan should pass schema validation."""
        plan = load_plan()
        # Should not raise
        mat._validate_plan_schema(plan)

    def test_validate_plan_schema_missing_key(self):
        """Plan missing required key should raise ValueError."""
        with self.assertRaises(ValueError):
            mat._validate_plan_schema({"meta": {}, "labels": [], "milestones": []})

    def test_validate_plan_schema_duplicate_ids(self):
        """Plan with duplicate issue IDs should raise ValueError."""
        plan = {
            "meta": {},
            "labels": [],
            "milestones": [],
            "issues": [
                {"id": "EPIC-001", "title": "A"},
                {"id": "EPIC-001", "title": "B"},  # duplicate
            ],
        }
        with self.assertRaises(ValueError):
            mat._validate_plan_schema(plan)

    def test_validate_plan_schema_duplicate_labels(self):
        """Plan with duplicate label names should raise ValueError."""
        plan = {
            "meta": {},
            "labels": [
                {"name": "type:epic", "color": "#abc"},
                {"name": "type:epic", "color": "#def"},  # duplicate
            ],
            "milestones": [],
            "issues": [],
        }
        with self.assertRaises(ValueError):
            mat._validate_plan_schema(plan)


class TestDryRunMode(unittest.TestCase):
    """Test dry-run mode creates no GitHub changes."""

    def _make_client(self) -> mat.GitHubClient:
        client = mat.GitHubClient(repo="caliofmarian-ai/dropi-mobile", dry_run=True)
        # Mock the _gh method to prevent any real API calls
        client._gh = MagicMock(side_effect=RuntimeError("gh must not be called in dry-run test"))
        client._label_cache = {}
        client._milestone_cache = {}
        client._issue_id_cache = {}
        return client

    def test_create_label_dry_run_returns_would_create(self):
        client = self._make_client()
        result = client.create_label("test:label", "#abc123", "test label")
        self.assertEqual(result["action"], "would_create")
        # gh must NOT have been called
        client._gh.assert_not_called()

    def test_create_label_dry_run_existing_skips(self):
        client = self._make_client()
        client._label_cache = {"test:label": {"name": "test:label", "color": "abc123", "description": "same"}}
        result = client.create_label("test:label", "#abc123", "same")
        self.assertEqual(result["action"], "skipped")

    def test_create_milestone_dry_run_returns_would_create(self):
        client = self._make_client()
        result = client.create_milestone("Test Milestone", "description")
        self.assertEqual(result["action"], "would_create")
        client._gh.assert_not_called()

    def test_create_issue_dry_run_returns_would_create(self):
        client = self._make_client()
        body = "<!-- dropi-planning-id: TEST-001 -->\nTest body"
        result = client.create_issue("Test Title", body, ["type:epic"])
        self.assertEqual(result["action"], "would_create")
        self.assertEqual(result["stable_id"], "TEST-001")
        client._gh.assert_not_called()

    def test_create_issue_dry_run_skips_existing(self):
        client = self._make_client()
        client._issue_id_cache = {"TEST-001": 99}
        body = "<!-- dropi-planning-id: TEST-001 -->\nTest body"
        result = client.create_issue("Test Title", body, ["type:epic"])
        self.assertEqual(result["action"], "skipped")
        self.assertEqual(result["issue_number"], 99)


class TestIdempotency(unittest.TestCase):
    """Test that the apply mode is idempotent."""

    def test_create_label_existing_unchanged_skips(self):
        """Creating an existing label with same attributes should skip."""
        client = mat.GitHubClient(repo="test/repo", dry_run=False)
        client._label_cache = {
            "type:epic": {"name": "type:epic", "color": "0075ca", "description": "Epic issues"}
        }
        # Mock _gh so it's never called
        client._gh = MagicMock(side_effect=RuntimeError("should not call gh"))
        result = client.create_label("type:epic", "#0075ca", "Epic issues")
        self.assertEqual(result["action"], "skipped")

    def test_create_issue_existing_by_stable_id_skips(self):
        """Creating an issue whose stable ID already exists should skip."""
        client = mat.GitHubClient(repo="test/repo", dry_run=False)
        client._issue_id_cache = {"EPIC-001": 123}
        client._gh = MagicMock(side_effect=RuntimeError("should not call gh"))
        body = "<!-- dropi-planning-id: EPIC-001 -->\ntest"
        result = client.create_issue("EPIC-001 title", body, [])
        self.assertEqual(result["action"], "skipped")
        self.assertEqual(result["issue_number"], 123)


class TestPreservedClosedIssues(unittest.TestCase):
    """Test that CAN-001 through CAN-008 issues are never recreated."""

    def test_preserved_issue_ids_defined(self):
        """The preserved closed issue numbers must be defined."""
        self.assertIn(42, mat.PRESERVED_CLOSED_ISSUES)
        self.assertIn(50, mat.PRESERVED_CLOSED_ISSUES)
        self.assertEqual(len(mat.PRESERVED_CLOSED_ISSUES), 9)

    def test_can_issues_not_in_plan(self):
        """The CAN-001–CAN-008 issues should NOT be in the new plan (they're closed)."""
        plan = load_plan()
        issue_titles = [i.get("title", "") for i in plan["issues"]]
        for title in (
            "[CAN-001]", "[CAN-002]", "[CAN-003]", "[CAN-004]",
            "[CAN-005]", "[CAN-006]", "[CAN-007]", "[CAN-008]",
        ):
            matching = [t for t in issue_titles if title in t]
            self.assertEqual(
                matching, [],
                f"Plan must not recreate closed audit issue {title}: found {matching}",
            )


class TestSourceHashes(unittest.TestCase):
    """Verify canonical source files have not been modified."""

    def test_04_zip_unchanged(self):
        sha256 = hashlib.sha256(ARCHIVE_PATH.read_bytes()).hexdigest()
        self.assertEqual(sha256, ARCHIVE_SHA256, "04.zip must not be modified")

    def test_protected_planning_files_exist(self):
        """Planning audit files must exist."""
        for name in (
            "CANONICAL_PLANNING_SOURCE_REGISTER.md",
            "CANONICAL_PLANNING_CONFLICTS.md",
            "IMPLEMENTATION_COVERAGE_AUDIT.md",
            "GITHUB_MATERIALIZATION_PLAN.md",
            "github_materialization_plan.json",
            "github_materialization_plan.yaml",
        ):
            path = REPO_ROOT / "docs" / "planning" / name
            self.assertTrue(path.exists(), f"Planning file not found: {name}")

    def test_canonical_files_exist(self):
        """Core canonical files must exist."""
        for name in (
            "canonical/SESSION_HANDOVER.md",
            "canonical/AI_DEVELOPMENT_HANDOVER_CANON.md",
            "canonical/AI_AGENT_SYSTEM.md",
            "canonical/DELIVERY_MULTIMODAL.md",
        ):
            path = REPO_ROOT / name
            self.assertTrue(path.exists(), f"Canonical file not found: {name}")


class TestVerifyLogic(unittest.TestCase):
    """Test the verify mode logic."""

    def _make_client_with_everything(self, plan: dict) -> mat.GitHubClient:
        """Create a mock client that has all plan objects."""
        client = mat.GitHubClient(repo="test/repo", dry_run=False)

        # All labels exist
        client._label_cache = {l["name"]: {"name": l["name"]} for l in plan["labels"]}

        # All milestones exist
        client._milestone_cache = {
            m["title"]: {"title": m["title"], "number": idx + 1}
            for idx, m in enumerate(plan["milestones"])
        }

        # All issues exist by stable ID
        client._issue_id_cache = {
            i["id"]: idx + 51
            for idx, i in enumerate(plan["issues"])
            if i.get("id")
        }

        # Mock _gh_api_paginate to return closed issues for preserved IDs
        def mock_paginate(path: str) -> list:
            if "closed" in path:
                return [{"number": n} for n in mat.PRESERVED_CLOSED_ISSUES]
            return []

        client._gh_api_paginate = mock_paginate
        return client

    def test_verify_passes_when_all_objects_exist(self):
        plan = load_plan()
        client = self._make_client_with_everything(plan)
        results: dict = {}
        passed = mat.run_verify(client, plan, REPO_ROOT, results)
        self.assertTrue(passed, f"Verify should pass: {results.get('verification', {}).get('failures')}")

    def test_verify_fails_when_labels_missing(self):
        plan = load_plan()
        client = self._make_client_with_everything(plan)
        # Remove some labels from cache
        client._label_cache = {}
        results: dict = {}
        passed = mat.run_verify(client, plan, REPO_ROOT, results)
        self.assertFalse(passed, "Verify should fail when labels are missing")

    def test_verify_fails_when_issues_missing(self):
        plan = load_plan()
        client = self._make_client_with_everything(plan)
        # Remove all issues from cache
        client._issue_id_cache = {}
        results: dict = {}
        passed = mat.run_verify(client, plan, REPO_ROOT, results)
        self.assertFalse(passed, "Verify should fail when issues are missing")

    def test_verify_detects_duplicate_ids_in_plan(self):
        """verify mode detects if plan has duplicate stable IDs."""
        plan = load_plan()
        # Inject a duplicate
        dup_issue = dict(plan["issues"][0])
        plan["issues"].append(dup_issue)
        try:
            mat._validate_plan_schema(plan)
            self.fail("Should have raised ValueError for duplicate IDs")
        except ValueError as e:
            self.assertIn("Duplicate", str(e))
        finally:
            plan["issues"].pop()


class TestCoverageAuditFiles(unittest.TestCase):
    """Test that all required planning output files exist."""

    def test_source_register_exists(self):
        path = REPO_ROOT / "docs" / "planning" / "CANONICAL_PLANNING_SOURCE_REGISTER.md"
        self.assertTrue(path.exists())

    def test_conflicts_register_exists(self):
        path = REPO_ROOT / "docs" / "planning" / "CANONICAL_PLANNING_CONFLICTS.md"
        self.assertTrue(path.exists())

    def test_coverage_audit_exists(self):
        path = REPO_ROOT / "docs" / "planning" / "IMPLEMENTATION_COVERAGE_AUDIT.md"
        self.assertTrue(path.exists())

    def test_materialization_plan_md_exists(self):
        path = REPO_ROOT / "docs" / "planning" / "GITHUB_MATERIALIZATION_PLAN.md"
        self.assertTrue(path.exists())

    def test_script_exists(self):
        path = REPO_ROOT / "scripts" / "materialize_github_planning.py"
        self.assertTrue(path.exists())


if __name__ == "__main__":
    unittest.main(verbosity=2)
