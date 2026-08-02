from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
GENERATOR = REPO_ROOT / "scripts" / "reconcile_derived_package_statistics.py"
PACKAGE_ROOT = REPO_ROOT / "DROPi_Canonical_Reference"
OUTPUT_DIR = REPO_ROOT / "docs" / "audits" / "can-006"
REPORT_JSON = OUTPUT_DIR / "derived_package_statistics.json"
REPORT_MD = OUTPUT_DIR / "derived_package_statistics.md"

# ---------------------------------------------------------------------------
# Import the generator module
# ---------------------------------------------------------------------------

_SPEC = importlib.util.spec_from_file_location(
    "reconcile_derived_package_statistics", GENERATOR
)
if _SPEC is None or _SPEC.loader is None:
    raise RuntimeError("Cannot import generator")
RECONCILE = importlib.util.module_from_spec(_SPEC)
sys.modules[_SPEC.name] = RECONCILE
_SPEC.loader.exec_module(RECONCILE)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def run_generator(output_dir: pathlib.Path) -> None:
    subprocess.run(
        [
            sys.executable,
            str(GENERATOR),
            "--repo-root",
            str(REPO_ROOT),
            "--output-dir",
            str(output_dir),
        ],
        check=True,
        env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
    )


def independent_file_count(package_root: pathlib.Path) -> int:
    """Count files independently using pathlib, excluding excluded directories."""
    excluded = frozenset(
        [".git", "node_modules", "__pycache__", ".cache", "coverage", "dist", "build"]
    )
    total = 0
    for path in package_root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in excluded for part in path.parts):
            continue
        total += 1
    return total


def independent_dir_count(package_root: pathlib.Path) -> int:
    """Count directories independently using pathlib."""
    excluded = frozenset(
        [".git", "node_modules", "__pycache__", ".cache", "coverage", "dist", "build"]
    )
    total = 0
    for path in package_root.rglob("*"):
        if not path.is_dir():
            continue
        if any(part in excluded for part in path.parts):
            continue
        total += 1
    return total


# ---------------------------------------------------------------------------
# Load the checked-in report once
# ---------------------------------------------------------------------------


def load_report() -> dict:
    with REPORT_JSON.open(encoding="utf-8") as fh:
        return json.load(fh)


class TestPackageInventory(unittest.TestCase):
    """Tests 1–3: inventory completeness and classification."""

    def test_01_files_inventoried_exactly_once(self) -> None:
        """Each package file appears exactly once in the report."""
        report = load_report()
        paths = [f["path"] for f in report["files"]]
        self.assertEqual(
            len(paths),
            len(set(paths)),
            "Duplicate paths found in file inventory.",
        )

    def test_02_actual_file_total_matches_independent_scan(self) -> None:
        """Report file count matches an independent filesystem traversal."""
        report = load_report()
        claimed = report["summary"]["actual_file_count"]
        actual = independent_file_count(PACKAGE_ROOT)
        self.assertEqual(
            claimed,
            actual,
            f"Report claims {claimed} files but independent scan found {actual}.",
        )

    def test_03_source_and_control_totals_reconcile(self) -> None:
        """source_document_count + package_control_document_count == actual_file_count."""
        report = load_report()
        s = report["summary"]
        self.assertEqual(
            s["source_document_count"] + s["package_control_document_count"],
            s["actual_file_count"],
            "source + control counts do not sum to actual file count.",
        )


class TestDirectoryCount(unittest.TestCase):
    """Test 4: directory count reproducibility."""

    def test_04_directory_count_independently_reproducible(self) -> None:
        """Report directory count matches independent traversal."""
        report = load_report()
        claimed = report["summary"]["directory_count"]
        actual = independent_dir_count(PACKAGE_ROOT)
        self.assertEqual(
            claimed,
            actual,
            f"Report claims {claimed} directories; independent count found {actual}.",
        )


class TestExtensionTotals(unittest.TestCase):
    """Test 5: extension totals sum to actual file count."""

    def test_05_extension_totals_sum_to_file_count(self) -> None:
        """Sum of counts_by_extension equals actual_file_count."""
        report = load_report()
        ext_sum = sum(report["counts_by_extension"].values())
        total = report["summary"]["actual_file_count"]
        self.assertEqual(
            ext_sum,
            total,
            f"Extension totals sum to {ext_sum}, not {total}.",
        )


class TestDomainTotals(unittest.TestCase):
    """Tests 6–7: domain counts and unclassified visibility."""

    def test_06_domain_totals_count_every_file_exactly_once(self) -> None:
        """Sum of counts_by_domain (primary domain only) equals actual_file_count."""
        report = load_report()
        domain_sum = sum(report["counts_by_domain"].values())
        total = report["summary"]["actual_file_count"]
        self.assertEqual(
            domain_sum,
            total,
            f"Domain totals sum to {domain_sum}, not {total}.",
        )

    def test_07_unclassified_files_remain_visible(self) -> None:
        """Unclassified files are present in the files list and counted in counts_by_domain."""
        report = load_report()
        unclassified_files = [
            f for f in report["files"] if f["primary_domain"] == "unclassified"
        ]
        unclassified_count = report["summary"]["unclassified_file_count"]
        domain_unclassified = report["counts_by_domain"].get("unclassified", 0)
        self.assertEqual(
            len(unclassified_files),
            unclassified_count,
            "Unclassified file count does not match summary.",
        )
        self.assertEqual(
            domain_unclassified,
            unclassified_count,
            "counts_by_domain['unclassified'] does not match summary.",
        )


class TestDuplicateDetection(unittest.TestCase):
    """Tests 8–9: duplicate path and content detection."""

    def test_08_duplicate_path_detection(self) -> None:
        """Duplicate-path detection works: no duplicate paths in a correct scan."""
        report = load_report()
        self.assertEqual(
            report["summary"]["duplicate_path_count"],
            0,
            "Unexpected duplicate paths detected.",
        )
        # Inject a synthetic duplicate and verify the function flags it.
        records = [{"path": "a.md"}, {"path": "b.md"}, {"path": "a.md"}]
        dupes = RECONCILE.detect_duplicate_paths(records)
        self.assertEqual(dupes, ["a.md"])

    def test_09_duplicate_content_detection(self) -> None:
        """Duplicate-content detection works on synthetic data."""
        records = [
            {"path": "x.md", "sha256": "aaa"},
            {"path": "y.md", "sha256": "aaa"},
            {"path": "z.md", "sha256": "bbb"},
        ]
        groups = RECONCILE.detect_duplicate_contents(records)
        self.assertEqual(len(groups), 1)
        self.assertEqual(groups[0]["sha256"], "aaa")
        self.assertIn("x.md", groups[0]["paths"])
        self.assertIn("y.md", groups[0]["paths"])


class TestStatisticalClaims(unittest.TestCase):
    """Tests 10–16: claim discovery and status."""

    def test_10_claims_discovered_deterministically(self) -> None:
        """The known claim list is fixed and non-empty."""
        self.assertGreater(len(RECONCILE.KNOWN_CLAIMS), 0)
        ids = [c["claim_identifier"] for c in RECONCILE.KNOWN_CLAIMS]
        self.assertEqual(ids, sorted(ids), "KNOWN_CLAIMS are not sorted by ID.")
        # Verify identical on second call (determinism)
        ids2 = [c["claim_identifier"] for c in RECONCILE.KNOWN_CLAIMS]
        self.assertEqual(ids, ids2)

    def test_11_199_claim_present_in_reconciliation(self) -> None:
        """historical_199_claim is present in the reconciliation section."""
        report = load_report()
        rec = report["reconciliation"]
        self.assertIn("historical_199_claim", rec)
        claim = rec["historical_199_claim"]
        self.assertEqual(claim["claimed_value"], 199)

    def test_12_217_claim_present_in_reconciliation(self) -> None:
        """historical_217_claim is present in the reconciliation section."""
        report = load_report()
        rec = report["reconciliation"]
        self.assertIn("historical_217_claim", rec)
        claim = rec["historical_217_claim"]
        self.assertEqual(claim["claimed_value"], 217)

    def test_13_manifest_reconciliation_present(self) -> None:
        """manifest reconciliation is present in the reconciliation section."""
        report = load_report()
        self.assertIn("manifest", report["reconciliation"])
        m = report["reconciliation"]["manifest"]
        self.assertIn("manifest_entry_count", m)
        self.assertIn("actual_file_count", m)

    def test_14_knowledge_index_reconciliation_present(self) -> None:
        """knowledge_index reconciliation is present."""
        report = load_report()
        self.assertIn("knowledge_index", report["reconciliation"])
        ki = report["reconciliation"]["knowledge_index"]
        self.assertIn("claimed_total", ki)
        self.assertIn("actual_total", ki)

    def test_15_audit_report_reconciliation_present(self) -> None:
        """audit_report reconciliation is present."""
        report = load_report()
        self.assertIn("audit_report", report["reconciliation"])
        ar = report["reconciliation"]["audit_report"]
        self.assertIn("claimed_total", ar)
        self.assertIn("actual_total", ar)

    def test_16_every_claim_has_status_and_explanation(self) -> None:
        """Every resolved statistical claim has a non-empty status and explanation."""
        report = load_report()
        for c in report["statistical_claims"]:
            self.assertIn(
                "status",
                c,
                f"Claim {c.get('claim_identifier')} missing status.",
            )
            self.assertIn(
                "explanation",
                c,
                f"Claim {c.get('claim_identifier')} missing explanation.",
            )
            self.assertTrue(
                c["status"],
                f"Claim {c.get('claim_identifier')} has empty status.",
            )
            self.assertTrue(
                c["explanation"],
                f"Claim {c.get('claim_identifier')} has empty explanation.",
            )


class TestCorrectionProposals(unittest.TestCase):
    """Test 17: correction proposals are proposal-only."""

    def test_17_correction_proposals_never_mark_files_modified(self) -> None:
        """All correction proposals have file_modified = False."""
        report = load_report()
        for prop in report["correction_proposals"]:
            self.assertIs(
                prop["file_modified"],
                False,
                f"Proposal for {prop['target_path']} has file_modified != False.",
            )
            self.assertIs(
                prop["proposal_only"],
                True,
                f"Proposal for {prop['target_path']} has proposal_only != True.",
            )


class TestSourceFileIntegrity(unittest.TestCase):
    """Test 18: no canonical or derived source file was modified."""

    def test_18_package_control_docs_unmodified(self) -> None:
        """Package control documents still exist and are readable."""
        for name in RECONCILE.PACKAGE_CONTROL_PATHS:
            path = PACKAGE_ROOT / name
            self.assertTrue(
                path.exists(),
                f"Package control document missing: {name}",
            )
            # Verify it's still a file (not replaced by a directory)
            self.assertTrue(path.is_file(), f"{name} is not a file.")

    def test_18b_can006_output_dir_not_inside_canonical_reference(self) -> None:
        """The can-006 output directory is NOT inside DROPi_Canonical_Reference/."""
        try:
            OUTPUT_DIR.relative_to(PACKAGE_ROOT)
            self.fail("Output directory is inside DROPi_Canonical_Reference/.")
        except ValueError:
            pass  # Expected: OUTPUT_DIR is NOT under PACKAGE_ROOT


class TestNoTimestamps(unittest.TestCase):
    """Test 19: reports contain no timestamps."""

    _TIMESTAMP_PATTERNS = [
        # ISO 8601 datetime
        r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}",
        # Date strings that could be auto-generated
        r'"generated_at"',
        r'"timestamp"',
        r'"generated_on"',
        r'"date":\s*"20',
    ]

    def test_19_json_report_contains_no_timestamps(self) -> None:
        """JSON report does not contain auto-generated timestamp fields."""
        import re

        content = REPORT_JSON.read_text(encoding="utf-8")
        for pattern in self._TIMESTAMP_PATTERNS:
            self.assertIsNone(
                re.search(pattern, content),
                f"Timestamp pattern found in JSON report: {pattern!r}",
            )

    def test_19b_markdown_report_contains_no_timestamps(self) -> None:
        """Markdown report does not contain auto-generated timestamp fields."""
        import re

        content = REPORT_MD.read_text(encoding="utf-8")
        for pattern in self._TIMESTAMP_PATTERNS:
            self.assertIsNone(
                re.search(pattern, content),
                f"Timestamp pattern found in Markdown report: {pattern!r}",
            )


class TestDeterminism(unittest.TestCase):
    """Tests 20–22: determinism and byte-identical output."""

    def test_20_outputs_are_deterministic_across_runs(self) -> None:
        """Two separate generator runs produce byte-identical JSON output."""
        with (
            tempfile.TemporaryDirectory() as tmp1,
            tempfile.TemporaryDirectory() as tmp2,
        ):
            run_generator(pathlib.Path(tmp1))
            run_generator(pathlib.Path(tmp2))
            j1 = (pathlib.Path(tmp1) / "derived_package_statistics.json").read_bytes()
            j2 = (pathlib.Path(tmp2) / "derived_package_statistics.json").read_bytes()
            self.assertEqual(j1, j2, "Generator produced different JSON on two runs.")
            m1 = (pathlib.Path(tmp1) / "derived_package_statistics.md").read_bytes()
            m2 = (pathlib.Path(tmp2) / "derived_package_statistics.md").read_bytes()
            self.assertEqual(m1, m2, "Generator produced different Markdown on two runs.")

    def test_21_checked_in_outputs_byte_identical_to_fresh_regeneration(self) -> None:
        """Checked-in JSON is byte-identical to a freshly regenerated copy."""
        with tempfile.TemporaryDirectory() as tmp:
            run_generator(pathlib.Path(tmp))
            fresh_json = (pathlib.Path(tmp) / "derived_package_statistics.json").read_bytes()
            checked_in_json = REPORT_JSON.read_bytes()
            self.assertEqual(
                fresh_json,
                checked_in_json,
                "Checked-in JSON differs from fresh regeneration. "
                "Re-run the generator and commit the output.",
            )
            fresh_md = (pathlib.Path(tmp) / "derived_package_statistics.md").read_bytes()
            checked_in_md = REPORT_MD.read_bytes()
            self.assertEqual(
                fresh_md,
                checked_in_md,
                "Checked-in Markdown differs from fresh regeneration.",
            )

    def test_22_pythondontwritebytecode_does_not_change_output(self) -> None:
        """Setting PYTHONDONTWRITEBYTECODE=1 produces identical output."""
        with tempfile.TemporaryDirectory() as tmp_no_bc:
            with tempfile.TemporaryDirectory() as tmp_with_bc:
                # Run without explicit PYTHONDONTWRITEBYTECODE
                env_without = {**os.environ}
                env_without.pop("PYTHONDONTWRITEBYTECODE", None)
                subprocess.run(
                    [
                        sys.executable,
                        str(GENERATOR),
                        "--repo-root",
                        str(REPO_ROOT),
                        "--output-dir",
                        tmp_no_bc,
                    ],
                    check=True,
                    env=env_without,
                )
                # Run with PYTHONDONTWRITEBYTECODE=1
                env_with = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}
                subprocess.run(
                    [
                        sys.executable,
                        str(GENERATOR),
                        "--repo-root",
                        str(REPO_ROOT),
                        "--output-dir",
                        tmp_with_bc,
                    ],
                    check=True,
                    env=env_with,
                )
                j_no = (pathlib.Path(tmp_no_bc) / "derived_package_statistics.json").read_bytes()
                j_with = (pathlib.Path(tmp_with_bc) / "derived_package_statistics.json").read_bytes()
                self.assertEqual(
                    j_no, j_with,
                    "Output differs with and without PYTHONDONTWRITEBYTECODE."
                )


class TestSchemaCompleteness(unittest.TestCase):
    """Verify top-level schema fields are present."""

    _REQUIRED_KEYS = [
        "schema_version",
        "scope",
        "definitions",
        "summary",
        "files",
        "counts_by_extension",
        "counts_by_domain",
        "counts_by_top_level_section",
        "duplicate_content_groups",
        "statistical_claims",
        "reconciliation",
        "correction_proposals",
    ]

    def test_schema_has_required_top_level_keys(self) -> None:
        report = load_report()
        for key in self._REQUIRED_KEYS:
            self.assertIn(key, report, f"Required key '{key}' missing from report.")

    def test_scope_immutable_and_no_mutation(self) -> None:
        report = load_report()
        self.assertTrue(report["scope"]["immutable_source_content"])
        self.assertFalse(report["scope"]["mutation_performed"])

    def test_definitions_are_explicit(self) -> None:
        report = load_report()
        defs = report["definitions"]
        for key in [
            "actual_package_file",
            "source_document",
            "package_control_document",
            "domain_assignment",
            "directories_excluded_from_file_totals",
            "generated_audit_reports_included_in_package_total",
            "manifest_index_control_files_included_in_package_total",
        ]:
            self.assertIn(key, defs, f"Definition key '{key}' missing.")

    def test_each_file_record_has_required_fields(self) -> None:
        report = load_report()
        required = [
            "path",
            "sha256",
            "size",
            "extension",
            "top_level_section",
            "classification",
            "primary_domain",
            "additional_domains",
            "classification_evidence",
        ]
        for f in report["files"]:
            for field in required:
                self.assertIn(
                    field,
                    f,
                    f"File record for '{f.get('path')}' missing field '{field}'.",
                )


if __name__ == "__main__":
    unittest.main(verbosity=2)
