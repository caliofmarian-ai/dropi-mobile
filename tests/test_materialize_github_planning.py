from __future__ import annotations

import hashlib
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

REPO_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts"))

import materialize_github_planning as mat

PLAN_PATH = REPO_ROOT / "docs" / "planning" / "github_materialization_plan.json"
ARCHIVE_PATH = REPO_ROOT / "04.zip"


def load_plan() -> dict:
    return json.loads(PLAN_PATH.read_text(encoding="utf-8"))


class FakeGitHubClient:
    def __init__(self, plan: dict):
        self.repo = "caliofmarian-ai/dropi-mobile"
        self.dry_run = False
        self._plan = plan
        self.repo_reads = 0
        self.labels_reads = 0
        self.milestones_reads = 0
        self.issue_reads = 0
        self.issue_number_reads = 0
        self.pull_reads = 0

        self.labels = {
            label["name"]: {
                "name": label["name"],
                "color": str(label.get("color", "ededed")).lstrip("#"),
                "description": label.get("description", ""),
            }
            for label in plan["labels"]
        }
        self.milestones = {
            milestone["title"]: {
                "title": milestone["title"],
                "number": index + 1,
                "state": milestone.get("state", "open"),
                "description": milestone.get("description", ""),
                "due_on": milestone.get("due_on"),
            }
            for index, milestone in enumerate(plan["milestones"])
        }
        self.issues = {}
        for index, issue in enumerate(plan["issues"], start=100):
            labels = [{"name": name} for name in issue.get("labels", [])]
            body = mat.build_issue_body_with_links(
                issue,
                {item["id"]: idx for idx, item in enumerate(plan["issues"], start=100)},
                {item["id"] for item in plan["issues"]},
            )
            self.issues[issue["id"]] = {
                "number": index,
                "title": issue["title"],
                "body": body,
                "labels": labels,
                "milestone": {"title": issue.get("milestone")} if issue.get("milestone") else None,
                "state": "open",
                "html_url": f"https://github.com/example/repo/issues/{index}",
            }
        for number, title in mat.PRESERVED_CLOSED_ISSUES.items():
            self.issues[f"PRESERVED-{number}"] = {
                "number": number,
                "title": title,
                "body": "",
                "labels": [],
                "milestone": None,
                "state": "closed",
                "html_url": f"https://github.com/example/repo/issues/{number}",
            }

    def get_repository_metadata(self):
        self.repo_reads += 1
        return {"full_name": self.repo, "default_branch": "main", "private": False, "open_issues_count": 1}

    def get_labels(self):
        self.labels_reads += 1
        return self.labels

    def get_milestones(self, state: str = "all"):
        self.milestones_reads += 1
        return self.milestones

    def get_issues(self, state: str = "all"):
        self.issue_reads += 1
        return list(self.issues.values())

    def get_pull_requests(self, state: str = "all"):
        self.pull_reads += 1
        return [{"number": 60, "state": "open"}]

    def get_issue_by_number(self, issue_number: int):
        self.issue_number_reads += 1
        for issue in self.issues.values():
            if issue["number"] == issue_number:
                return issue
        raise KeyError(issue_number)

    def get_issues_by_stable_id(self):
        self.issue_reads += 1
        return {
            issue_id: issue
            for issue_id, issue in self.issues.items()
            if not issue_id.startswith("PRESERVED-")
        }

    def get_duplicate_stable_ids(self):
        return {}


class TestArchiveIntegrity(unittest.TestCase):
    def test_archive_exists(self):
        self.assertTrue(ARCHIVE_PATH.exists())

    def test_archive_sha256_matches(self):
        sha256 = hashlib.sha256(ARCHIVE_PATH.read_bytes()).hexdigest()
        self.assertEqual(sha256, mat.ARCHIVE_SHA256)

    def test_verify_archive_integrity(self):
        mat.verify_archive_integrity(REPO_ROOT)


class TestPlanSchema(unittest.TestCase):
    def test_plan_file_exists(self):
        self.assertTrue(PLAN_PATH.exists())

    def test_plan_has_required_keys(self):
        plan = load_plan()
        for key in ("meta", "labels", "milestones", "issues"):
            self.assertIn(key, plan)

    def test_plan_has_expected_scale(self):
        plan = load_plan()
        self.assertGreaterEqual(len(plan["labels"]), 100)
        self.assertGreaterEqual(len(plan["milestones"]), 6)
        self.assertGreaterEqual(len(plan["issues"]), 50)

    def test_validate_plan_schema_rejects_duplicate_ids(self):
        plan = load_plan()
        duplicate = dict(plan["issues"][0])
        plan["issues"].append(duplicate)
        with self.assertRaises(ValueError):
            mat._validate_plan_schema(plan)


class TestHelpers(unittest.TestCase):
    def test_strip_managed_links(self):
        body = "base\n\n<!-- dropi-materialization-links:start -->\nkeep\n<!-- dropi-materialization-links:end -->\n"
        self.assertEqual(mat.strip_managed_links(body), "base")

    def test_build_issue_body_with_links_adds_real_issue_numbers(self):
        body = "<!-- dropi-planning-id: CHILD-001 -->\nParent PROG-001 and EPIC-001"
        issue = {"id": "CHILD-001", "body": body}
        rendered = mat.build_issue_body_with_links(issue, {"PROG-001": 1, "EPIC-001": 2, "CHILD-001": 3}, {"PROG-001", "EPIC-001", "CHILD-001"})
        self.assertIn("PROG-001 → #1", rendered)
        self.assertIn("EPIC-001 → #2", rendered)
        self.assertNotIn("CHILD-001 → #3", rendered)

    @patch("materialize_github_planning.get_branch_diff_paths")
    def test_forbidden_branch_changes_raise(self, mock_diff):
        mock_diff.return_value = ["canonical/SESSION_HANDOVER.md"]
        with self.assertRaises(RuntimeError):
            mat.ensure_only_allowed_branch_changes(REPO_ROOT)

    @patch("materialize_github_planning.get_branch_diff_paths")
    def test_allowed_branch_changes_pass(self, mock_diff):
        mock_diff.return_value = [
            "docs/planning/GITHUB_MATERIALIZATION_RESULT.md",
            "scripts/materialize_github_planning.py",
        ]
        changed = mat.ensure_only_allowed_branch_changes(REPO_ROOT)
        self.assertEqual(len(changed), 2)


class TestDryRunSemantics(unittest.TestCase):
    def test_dry_run_missing_label_is_planned_not_created(self):
        client = mat.GitHubClient(repo="test/repo", dry_run=True)
        client._label_cache = {}
        result = client.create_or_update_label({"name": "x", "color": "abc123", "description": "d"})
        self.assertEqual(result["action"], "planned")
        self.assertNotEqual(result["action"], "created")

    def test_dry_run_missing_milestone_is_planned_not_created(self):
        client = mat.GitHubClient(repo="test/repo", dry_run=True)
        client._milestone_cache = {}
        result = client.create_or_update_milestone({"title": "M1", "description": "d"})
        self.assertEqual(result["action"], "planned")

    def test_dry_run_missing_issue_is_planned_not_created(self):
        client = mat.GitHubClient(repo="test/repo", dry_run=True)
        client._issue_map_cache = {}
        client._milestone_cache = {"M1": {"number": 1}}
        issue = {"id": "TEST-001", "title": "T", "body": "<!-- dropi-planning-id: TEST-001 -->\nbody", "labels": [], "milestone": "M1"}
        result = client.ensure_issue_state(issue, issue["body"])
        self.assertEqual(result["action"], "planned")


class TestVerification(unittest.TestCase):
    def test_verify_passes_with_complete_remote_state(self):
        plan = load_plan()
        client = FakeGitHubClient(plan)
        results = {}
        with patch("materialize_github_planning.ensure_only_allowed_branch_changes", return_value=[]):
            passed = mat.run_verify(client, plan, REPO_ROOT, results)
        self.assertTrue(passed)
        self.assertTrue(results["verification"]["passed"])
        self.assertGreater(client.labels_reads, 0)
        self.assertGreater(client.milestones_reads, 0)
        self.assertGreater(client.issue_reads, 0)
        self.assertGreater(client.issue_number_reads, 0)
        self.assertGreater(client.pull_reads, 0)
        self.assertGreater(client.repo_reads, 0)

    def test_verify_fails_on_duplicate_remote_stable_ids(self):
        plan = load_plan()
        client = FakeGitHubClient(plan)
        client.get_duplicate_stable_ids = lambda: {"EPIC-001": [123, 456]}
        results = {}
        with patch("materialize_github_planning.ensure_only_allowed_branch_changes", return_value=[]):
            passed = mat.run_verify(client, plan, REPO_ROOT, results)
        self.assertFalse(passed)
        self.assertIn("Duplicate canonical ID EPIC-001", "\n".join(results["verification"]["failures"]))


class TestResultReporting(unittest.TestCase):
    def setUp(self):
        self.temp_dir = Path(tempfile.mkdtemp(prefix="dropi-materialize-tests-"))
        (self.temp_dir / "docs" / "planning").mkdir(parents=True, exist_ok=True)

    def tearDown(self):
        shutil.rmtree(self.temp_dir)

    def _plan(self):
        return {
            "meta": {"version": "1.0.0"},
            "labels": [{"name": "type:program"}],
            "milestones": [{"title": "M1", "description": "desc"}],
            "issues": [{"id": "PROG-001", "type": "program", "title": "Program", "body": "<!-- dropi-planning-id: PROG-001 -->", "labels": ["type:program"], "milestone": "M1"}],
        }

    def test_write_results_records_apply_verify_and_idempotency(self):
        plan = self._plan()
        first_apply = {
            "labels": {"summary": {"planned": 1, "existing": 0, "created": 1, "updated": 0, "skipped": 0, "failed": 0, "verified": 0}, "entries": [{"name": "type:program", "action": "created"}]},
            "milestones": {"summary": {"planned": 1, "existing": 0, "created": 1, "updated": 0, "skipped": 0, "failed": 0, "verified": 0}, "entries": [{"title": "M1", "number": 7, "action": "created"}]},
            "issues": {"summary": {"planned": 1, "existing": 0, "created": 1, "updated": 0, "skipped": 0, "failed": 0, "verified": 0}, "entries": [{"id": "PROG-001", "type": "program", "issue_number": 99, "action": "created"}], "issue_type_summary": {"program": {"planned": 1, "existing": 0, "created": 1, "updated": 0, "skipped": 0, "failed": 0, "verified": 0}}},
            "issue_number_mappings": {"PROG-001": 99},
            "milestone_number_mappings": {"M1": 7},
            "label_names": ["type:program"],
        }
        verify = {
            "passed": True,
            "failures": [],
            "issue_number_mappings": {"PROG-001": 99},
        }
        second_apply = {
            "labels": {"summary": {"planned": 1, "existing": 1, "created": 0, "updated": 0, "skipped": 0, "failed": 0, "verified": 0}, "entries": [{"name": "type:program", "action": "existing"}]},
            "milestones": {"summary": {"planned": 1, "existing": 1, "created": 0, "updated": 0, "skipped": 0, "failed": 0, "verified": 0}, "entries": [{"title": "M1", "number": 7, "action": "existing"}]},
            "issues": {"summary": {"planned": 1, "existing": 1, "created": 0, "updated": 0, "skipped": 0, "failed": 0, "verified": 0}, "entries": [{"id": "PROG-001", "type": "program", "issue_number": 99, "action": "existing"}], "issue_type_summary": {"program": {"planned": 1, "existing": 1, "created": 0, "updated": 0, "skipped": 0, "failed": 0, "verified": 0}}},
            "issue_number_mappings": {"PROG-001": 99},
            "milestone_number_mappings": {"M1": 7},
            "label_names": ["type:program"],
        }

        mat.write_results(self.temp_dir, plan, {"apply": first_apply}, "apply", False)
        mat.write_results(self.temp_dir, plan, {"verification": verify}, "verify", False)
        mat.write_results(self.temp_dir, plan, {"apply": second_apply}, "apply", False)
        final = mat.write_results(self.temp_dir, plan, {"verification": verify}, "verify", False)

        self.assertTrue(final["summary"]["idempotency"]["passed"])
        self.assertEqual(final["summary"]["idempotency"]["duplicate_issues_created"], 0)
        self.assertEqual(final["first_apply"]["issue_number_mappings"]["PROG-001"], 99)
        self.assertEqual(final["first_verify"]["issue_number_mappings"]["PROG-001"], 99)

        result_json = json.loads((self.temp_dir / "docs" / "planning" / "github_materialization_result.json").read_text(encoding="utf-8"))
        result_md = (self.temp_dir / "docs" / "planning" / "GITHUB_MATERIALIZATION_RESULT.md").read_text(encoding="utf-8")

        self.assertNotEqual(result_json["meta"]["mode"], "dry-run")
        self.assertNotIn("N/A", result_md)
        self.assertIn("Canonical ID → GitHub Issue Number", result_md)
        self.assertIn("PROG-001: #99", result_md)
        self.assertIn("Idempotency passed: True", result_md)

    def test_write_results_detects_duplicate_second_apply_creations(self):
        plan = self._plan()
        first_apply = {
            "labels": {"summary": {"planned": 1, "existing": 0, "created": 1, "updated": 0, "skipped": 0, "failed": 0, "verified": 0}, "entries": []},
            "milestones": {"summary": {"planned": 1, "existing": 0, "created": 1, "updated": 0, "skipped": 0, "failed": 0, "verified": 0}, "entries": []},
            "issues": {"summary": {"planned": 1, "existing": 0, "created": 1, "updated": 0, "skipped": 0, "failed": 0, "verified": 0}, "entries": [], "issue_type_summary": {}},
            "issue_number_mappings": {},
            "milestone_number_mappings": {},
            "label_names": [],
        }
        second_apply = {
            "labels": {"summary": {"planned": 1, "existing": 0, "created": 1, "updated": 0, "skipped": 0, "failed": 0, "verified": 0}, "entries": []},
            "milestones": {"summary": {"planned": 1, "existing": 0, "created": 0, "updated": 0, "skipped": 0, "failed": 0, "verified": 0}, "entries": []},
            "issues": {"summary": {"planned": 1, "existing": 0, "created": 1, "updated": 0, "skipped": 0, "failed": 0, "verified": 0}, "entries": [], "issue_type_summary": {}},
            "issue_number_mappings": {},
            "milestone_number_mappings": {},
            "label_names": [],
        }
        mat.write_results(self.temp_dir, plan, {"apply": first_apply}, "apply", False)
        final = mat.write_results(self.temp_dir, plan, {"apply": second_apply}, "apply", False)
        self.assertFalse(final["summary"]["idempotency"]["passed"])
        self.assertEqual(final["summary"]["idempotency"]["duplicate_labels_created"], 1)
        self.assertEqual(final["summary"]["idempotency"]["duplicate_issues_created"], 1)




class TestOptimization(unittest.TestCase):
    """Regression and benchmark tests proving O(1) lookup behaviour."""

    # ------------------------------------------------------------------ helpers

    def _make_idempotent_issue_map(self, plan: dict) -> dict:
        """Build an issue_map as it would exist after a successful APPLY #1.

        Every issue has its full body (base content + managed-links section)
        and all fields in sync with the plan definition.
        """
        issues_list = plan["issues"]
        issue_number_by_id = {item["id"]: i + 100 for i, item in enumerate(issues_list)}
        plan_issue_ids = {item["id"] for item in issues_list}
        issue_map: dict = {}
        for i, issue_def in enumerate(issues_list):
            full_body = mat.build_issue_body_with_links(
                issue_def, issue_number_by_id, plan_issue_ids
            )
            issue_map[issue_def["id"]] = {
                "number": i + 100,
                "title": issue_def["title"],
                "body": full_body,
                "labels": [{"name": n} for n in sorted(issue_def.get("labels", []))],
                "milestone": (
                    {"title": issue_def["milestone"], "number": 1}
                    if issue_def.get("milestone")
                    else None
                ),
                "state": "open",
            }
        return issue_map

    # --------------------------------------------------------------- Fix #1 tests

    def test_ensure_issue_state_existing_when_body_has_managed_links(self):
        """ensure_issue_state must return 'existing' when the only diff is the
        managed-links section already appended by a previous APPLY run."""
        plan = load_plan()
        issue_def = plan["issues"][0]
        base_body = mat.strip_managed_links(issue_def.get("body", ""))
        body_with_links = (
            f"{base_body}\n\n{mat.MANAGED_LINKS_START}\n"
            "## GitHub Materialization Links\n\n"
            f"- SOME-REF → #42\n{mat.MANAGED_LINKS_END}\n"
        )
        client = mat.GitHubClient(repo="test/repo", dry_run=False)
        client._issue_map_cache = {
            issue_def["id"]: {
                "number": 100,
                "title": issue_def["title"],
                "body": body_with_links,
                "labels": [{"name": n} for n in sorted(issue_def.get("labels", []))],
                "milestone": (
                    {"title": issue_def.get("milestone")} if issue_def.get("milestone") else None
                ),
                "state": "open",
            }
        }
        result = client.ensure_issue_state(issue_def, base_body)
        self.assertEqual(result["action"], "existing",
                         "ensure_issue_state must not trigger an update when body differs only by managed links")

    def test_full_idempotency_all_issues_return_existing(self):
        """Regression: every issue returns 'existing' on idempotency run.

        Simulates the state after a successful APPLY #1: all issues exist on
        GitHub with managed-links sections already appended.  A second APPLY
        must classify every issue as 'existing', not 'updated'.
        """
        plan = load_plan()
        client = mat.GitHubClient(repo="test/repo", dry_run=False)
        client._issue_map_cache = self._make_idempotent_issue_map(plan)

        non_existing: list[str] = []
        for issue_def in plan["issues"]:
            base_body = mat.strip_managed_links(issue_def.get("body", ""))
            result = client.ensure_issue_state(issue_def, base_body)
            if result["action"] != "existing":
                non_existing.append(f"{issue_def['id']}: {result['action']}")

        self.assertEqual(
            non_existing, [],
            "All issues must be 'existing' on idempotency run. Non-existing: "
            + ", ".join(non_existing[:5]),
        )

    # --------------------------------------------------------------- Fix #2 tests

    def test_update_issue_patches_cache_without_full_refresh(self):
        """update_issue must patch the caches in-place; api_call_count must
        not jump by more than 1 (the PATCH call itself)."""

        class _FakeGH(mat.GitHubClient):
            def _gh(self, *args: str, input_data: str | None = None) -> str:  # type: ignore[override]
                self._api_call_count += 1
                # Simulate a PATCH response with the updated body
                import json as _json
                return _json.dumps({"number": 99, "body": "new body", "title": "T", "labels": [], "milestone": None})

        client = _FakeGH(repo="test/repo", dry_run=False)
        client._issues_cache = [{"number": 99, "body": "old body", "title": "T", "labels": [], "milestone": None}]
        client._issue_map_cache = {"STABLE-001": {"number": 99, "body": "old body", "title": "T", "labels": [], "milestone": None}}

        before = client._api_call_count
        client.update_issue(99, {"body": "new body"})
        self.assertEqual(client._api_call_count - before, 1, "Exactly one API call for update_issue")
        # Cache must now reflect the new body — no extra fetch required
        self.assertEqual(client._issue_map_cache["STABLE-001"]["body"], "new body")
        self.assertEqual(client._issues_cache[0]["body"], "new body")

    def test_create_issue_adds_to_cache_without_full_refresh(self):
        """create_issue must add the new issue to caches; api_call_count must
        not jump by more than 1 (the POST call itself)."""

        class _FakeGH(mat.GitHubClient):
            def _gh(self, *args: str, input_data: str | None = None) -> str:  # type: ignore[override]
                self._api_call_count += 1
                import json as _json
                body = "<!-- dropi-planning-id: NEW-001 -->\nbody"
                return _json.dumps({"number": 200, "body": body, "title": "New", "labels": [], "milestone": None})

        client = _FakeGH(repo="test/repo", dry_run=False)
        client._issues_cache = []
        client._issue_map_cache = {}
        client._milestone_cache = {}

        issue_def = {"id": "NEW-001", "title": "New", "body": "<!-- dropi-planning-id: NEW-001 -->\nbody", "labels": []}
        before = client._api_call_count
        result = client.create_issue(issue_def, issue_def["body"])
        self.assertEqual(client._api_call_count - before, 1, "Exactly one API call for create_issue")
        self.assertEqual(result["action"], "created")
        self.assertIn("NEW-001", client._issue_map_cache, "Created issue must be in issue_map_cache")
        self.assertEqual(len(client._issues_cache), 1, "Created issue must be in issues_cache")

    # --------------------------------------------------------------- Benchmark tests

    def test_api_call_count_is_bounded_on_idempotency_run(self):
        """Benchmark: the total number of _gh() calls during a full idempotency
        run of ensure_issue_state over all plan issues must be O(1), not O(N).

        Because caches are pre-populated and no writes occur, the only calls
        are the initial cache-population fetches (label/milestone/issue pages).
        The hard upper bound is set conservatively at 20 calls for N=228 issues.
        """
        plan = load_plan()
        N = len(plan["issues"])

        class _CountingGH(mat.GitHubClient):
            def _gh(self, *args: str, input_data: str | None = None) -> str:  # type: ignore[override]
                self._api_call_count += 1
                raise RuntimeError("Unexpected network call during idempotency test")

        client = _CountingGH(repo="test/repo", dry_run=False)
        client._issue_map_cache = self._make_idempotent_issue_map(plan)
        # Labels and milestones are not checked in ensure_issue_state unless
        # they differ; with caches pre-populated, no network call should occur.

        before = client._api_call_count
        for issue_def in plan["issues"]:
            base_body = mat.strip_managed_links(issue_def.get("body", ""))
            client.ensure_issue_state(issue_def, base_body)
        total_calls = client._api_call_count - before

        self.assertEqual(
            total_calls, 0,
            f"Zero API calls expected on full idempotency run over {N} issues, "
            f"got {total_calls}. Old code would have made ~{N * 3} calls.",
        )

    def test_timing_fields_present_in_materialize_plan_once_result(self):
        """timing and api_calls_total fields must be present in the result."""
        plan = {
            "meta": {"version": "1.0"},
            "labels": [{"name": "type:program", "color": "ededed", "description": ""}],
            "milestones": [{"title": "M1", "description": "", "state": "open"}],
            "issues": [{"id": "P-001", "type": "program", "title": "T", "body": "<!-- dropi-planning-id: P-001 -->", "labels": ["type:program"], "milestone": "M1"}],
        }

        class _FakeGH(mat.GitHubClient):
            def _gh(self, *args: str, input_data: str | None = None) -> str:  # type: ignore[override]
                self._api_call_count += 1
                import json as _json
                if "issues" in args and "--method" not in args:
                    return _json.dumps([])
                if "issues" in args and "POST" in args:
                    body = "<!-- dropi-planning-id: P-001 -->"
                    return _json.dumps({"number": 51, "body": body, "title": "T", "labels": [], "milestone": None})
                if "labels" in args and "--method" not in args:
                    return _json.dumps([])
                if "labels" in args and "POST" in args:
                    return _json.dumps({"name": "type:program", "color": "ededed", "description": ""})
                if "milestones" in args and "--method" not in args:
                    return _json.dumps([])
                if "milestones" in args and "POST" in args:
                    return _json.dumps({"number": 1, "title": "M1", "state": "open", "description": "", "due_on": None})
                return _json.dumps([])

        client = _FakeGH(repo="test/repo", dry_run=True)
        client._issues_cache = []
        client._issue_map_cache = {}
        client._label_cache = {}
        client._milestone_cache = {}

        result = mat.materialize_plan_once(client, plan)
        self.assertIn("timing", result)
        self.assertIn("total_s", result["timing"])
        self.assertIn("api_calls_total", result)
        self.assertIsInstance(result["timing"]["total_s"], float)

    def test_byte_identical_issue_bodies_across_runs(self):
        """Regression: build_issue_body_with_links must produce byte-identical
        output on repeated calls with the same inputs (determinism check)."""
        plan = load_plan()
        issues_list = plan["issues"]
        issue_number_by_id = {item["id"]: i + 100 for i, item in enumerate(issues_list)}
        plan_issue_ids = {item["id"] for item in issues_list}

        for issue_def in issues_list[:10]:  # spot-check first 10
            body1 = mat.build_issue_body_with_links(issue_def, issue_number_by_id, plan_issue_ids)
            body2 = mat.build_issue_body_with_links(issue_def, issue_number_by_id, plan_issue_ids)
            self.assertEqual(body1, body2,
                             f"build_issue_body_with_links must be deterministic for {issue_def['id']}")
            # Idempotency: stripping managed links from the built body and
            # re-building should yield the same body
            stripped = mat.strip_managed_links(body1)
            body3 = mat.build_issue_body_with_links(
                {**issue_def, "body": stripped + "\n<!-- dropi-planning-id: " + issue_def["id"] + " -->"},
                issue_number_by_id,
                plan_issue_ids,
            )
            # strip+rebuild result must have the same links section
            links1 = body1[body1.find(mat.MANAGED_LINKS_START):] if mat.MANAGED_LINKS_START in body1 else ""
            links3 = body3[body3.find(mat.MANAGED_LINKS_START):] if mat.MANAGED_LINKS_START in body3 else ""
            self.assertEqual(links1, links3,
                             f"Managed-links section must be stable across strip+rebuild for {issue_def['id']}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
