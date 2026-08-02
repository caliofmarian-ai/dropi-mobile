"""Tests for CAN-008 — deterministic canonical package regeneration.

Run with:
    PYTHONDONTWRITEBYTECODE=1 python -m unittest -v \
        tests/test_regenerate_canonical_reference.py
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import pathlib
import shutil
import sys
import tempfile
import unittest

# ---------------------------------------------------------------------------
# Load the module under test without importing it as a package
# ---------------------------------------------------------------------------

_REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
_SCRIPT = _REPO_ROOT / "scripts" / "regenerate_canonical_reference.py"

_spec = importlib.util.spec_from_file_location("regenerate_canonical_reference", _SCRIPT)
_mod = importlib.util.module_from_spec(_spec)  # type: ignore[arg-type]
_spec.loader.exec_module(_mod)  # type: ignore[union-attr]

regen = _mod


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def sha256_path(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sha256_str(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def hash_tree(root: pathlib.Path) -> dict[str, str]:
    result: dict[str, str] = {}
    for path in sorted(root.rglob("*")):
        if path.is_file():
            rel = path.relative_to(root).as_posix()
            result[rel] = sha256_path(path)
    return result


def run_main(args: list[str]) -> int:
    """Run regen.main() with given args, return exit code."""
    try:
        return regen.main(args)
    except SystemExit as exc:
        return int(exc.code) if exc.code is not None else 0


# ---------------------------------------------------------------------------
# Load checked-in data once
# ---------------------------------------------------------------------------

_CAN007_PATH = _REPO_ROOT / "docs/audits/can-007/derived_package_provenance.json"
_CAN007 = json.loads(_CAN007_PATH.read_text(encoding="utf-8"))
_PACKAGE_ROOT = _REPO_ROOT / "DROPi_Canonical_Reference"
_ARCHIVE_PATH = _REPO_ROOT / "04.zip"
_MANIFEST_PATH = _REPO_ROOT / "docs/audits/can-008/regeneration_manifest.json"
_REPORT_PATH = _REPO_ROOT / "docs/audits/can-008/regeneration_report.md"
_PROCEDURE_PATH = _REPO_ROOT / "docs/CANONICAL_PACKAGE_REGENERATION.md"


# ---------------------------------------------------------------------------
# Test class
# ---------------------------------------------------------------------------


class TestRegenerateCanonicalReference(unittest.TestCase):
    """Comprehensive tests for CAN-008 regeneration tool."""

    # -----------------------------------------------------------------------
    # 1. Package file count
    # -----------------------------------------------------------------------

    def test_01_package_has_217_files(self) -> None:
        """Independent scan finds 217 checked-in package files."""
        files = [
            p
            for p in sorted(_PACKAGE_ROOT.rglob("*"))
            if p.is_file()
        ]
        self.assertEqual(len(files), 217, f"Expected 217 package files, found {len(files)}")

    # -----------------------------------------------------------------------
    # 2. CAN-007 record count
    # -----------------------------------------------------------------------

    def test_02_can007_has_217_records(self) -> None:
        """CAN-007 contains 217 provenance records."""
        records = _CAN007["records"]
        self.assertEqual(len(records), 217, f"Expected 217 CAN-007 records, found {len(records)}")

    # -----------------------------------------------------------------------
    # 3. Every package path appears exactly once in CAN-007
    # -----------------------------------------------------------------------

    def test_03_package_paths_unique_in_can007(self) -> None:
        """Every package path appears exactly once in CAN-007 records."""
        paths = [r["package_path"] for r in _CAN007["records"]]
        self.assertEqual(len(paths), len(set(paths)), "Duplicate package paths in CAN-007 records")

    # -----------------------------------------------------------------------
    # 4. Validate-existing mode: exit code 5 (NOT CERTIFIABLE)
    # -----------------------------------------------------------------------

    def test_04_validate_existing_exit_code(self) -> None:
        """Validation-only mode exits with code 5 (NOT CERTIFIABLE, documented)."""
        with tempfile.TemporaryDirectory() as tmp:
            code = run_main([
                "--repo-root", str(_REPO_ROOT),
                "--validate-existing",
                "--audit-output-dir", tmp,
            ])
        self.assertEqual(code, regen.EXIT_NOT_CERTIFIABLE)

    # -----------------------------------------------------------------------
    # 5. Missing/unsupported sources prevent false certification
    # -----------------------------------------------------------------------

    def test_05_unsupported_prevents_certifiable(self) -> None:
        """Unsupported records in CAN-007 block certification."""
        unsupported = [r for r in _CAN007["records"] if r["derived_status"] == "unsupported"]
        self.assertGreater(len(unsupported), 0, "Expected at least one unsupported record")
        with tempfile.TemporaryDirectory() as tmp:
            code = run_main([
                "--repo-root", str(_REPO_ROOT),
                "--validate-existing",
                "--audit-output-dir", tmp,
            ])
        self.assertNotEqual(code, regen.EXIT_PASS, "Unsupported files must prevent EXIT_PASS")

    # -----------------------------------------------------------------------
    # 6. copied_byte_identical: source matches expected hash
    # -----------------------------------------------------------------------

    def test_06_byte_identical_sources_match_expected(self) -> None:
        """Every copied_byte_identical output matches source and expected hash."""
        zip_index = regen.build_zip_index(_ARCHIVE_PATH)
        for record in _CAN007["records"]:
            if record["derived_status"] != "copied_byte_identical":
                continue
            src = record.get("source_path")
            expected_sha = record["package_sha256"]
            self.assertIsNotNone(src, f"No source_path for {record['package_path']}")
            src_bytes = regen.read_source_bytes(src, _REPO_ROOT, zip_index)
            self.assertIsNotNone(
                src_bytes,
                f"Source missing for {record['package_path']}: {src}",
            )
            actual_sha = regen.sha256_bytes(src_bytes)
            self.assertEqual(
                actual_sha,
                expected_sha,
                f"Source hash mismatch for {record['package_path']}",
            )

    # -----------------------------------------------------------------------
    # 7. copied_with_path_or_filename_variant: exact bytes preserved
    # -----------------------------------------------------------------------

    def test_07_path_variant_exact_bytes(self) -> None:
        """Every filename/path variant preserves exact expected bytes."""
        zip_index = regen.build_zip_index(_ARCHIVE_PATH)
        for record in _CAN007["records"]:
            if record["derived_status"] != "copied_with_path_or_filename_variant":
                continue
            src = record.get("source_path")
            expected_sha = record["package_sha256"]
            self.assertIsNotNone(src)
            src_bytes = regen.read_source_bytes(src, _REPO_ROOT, zip_index)
            self.assertIsNotNone(src_bytes, f"Source missing: {src}")
            actual = regen.sha256_bytes(src_bytes)
            self.assertEqual(
                actual,
                expected_sha,
                f"Variant bytes mismatch for {record['package_path']}",
            )

    # -----------------------------------------------------------------------
    # 8. Derived transformation is reproducible or explicitly fails
    # -----------------------------------------------------------------------

    def test_08_derived_transformation_not_certifiable(self) -> None:
        """derived_transformation records are marked not certifiable (no documented algorithm)."""
        zip_index = regen.build_zip_index(_ARCHIVE_PATH)
        for record in _CAN007["records"]:
            if record["derived_status"] != "derived_transformation":
                continue
            result = regen.compute_file_result(
                record, _REPO_ROOT, _PACKAGE_ROOT, zip_index
            )
            self.assertFalse(
                result["certifiable"],
                f"derived_transformation must not be certifiable: {record['package_path']}",
            )
            self.assertEqual(
                result["failure_reason"],
                "derived_transformation_algorithm_not_documented",
            )

    # -----------------------------------------------------------------------
    # 9. Package-control documents regenerate deterministically
    # -----------------------------------------------------------------------

    def test_09_package_control_deterministic(self) -> None:
        """Package-control documents validate hash and copy bytes deterministically."""
        zip_index = regen.build_zip_index(_ARCHIVE_PATH)
        ctrl_records = [r for r in _CAN007["records"] if r["derived_status"] == "package_control"]
        self.assertEqual(len(ctrl_records), 4, "Expected 4 package-control records")
        for record in ctrl_records:
            result = regen.compute_file_result(
                record, _REPO_ROOT, _PACKAGE_ROOT, zip_index
            )
            self.assertTrue(result["certifiable"], f"Package-control not certifiable: {record['package_path']}")
            self.assertEqual(result["regenerated_sha256"], result["expected_sha256"])
            self.assertTrue(result["byte_identical"])

    # -----------------------------------------------------------------------
    # 10. Manifest is deterministic
    # -----------------------------------------------------------------------

    def test_10_manifest_deterministic(self) -> None:
        """Two consecutive --validate-existing runs produce byte-identical manifests."""
        with tempfile.TemporaryDirectory() as tmp1:
            with tempfile.TemporaryDirectory() as tmp2:
                run_main(["--repo-root", str(_REPO_ROOT), "--validate-existing", "--audit-output-dir", tmp1])
                run_main(["--repo-root", str(_REPO_ROOT), "--validate-existing", "--audit-output-dir", tmp2])
                m1 = (pathlib.Path(tmp1) / "regeneration_manifest.json").read_bytes()
                m2 = (pathlib.Path(tmp2) / "regeneration_manifest.json").read_bytes()
                self.assertEqual(m1, m2, "Manifests from two consecutive runs differ")

    # -----------------------------------------------------------------------
    # 11. Markdown report is deterministic
    # -----------------------------------------------------------------------

    def test_11_markdown_report_deterministic(self) -> None:
        """Two consecutive --validate-existing runs produce byte-identical Markdown reports."""
        with tempfile.TemporaryDirectory() as tmp1:
            with tempfile.TemporaryDirectory() as tmp2:
                run_main(["--repo-root", str(_REPO_ROOT), "--validate-existing", "--audit-output-dir", tmp1])
                run_main(["--repo-root", str(_REPO_ROOT), "--validate-existing", "--audit-output-dir", tmp2])
                r1 = (pathlib.Path(tmp1) / "regeneration_report.md").read_bytes()
                r2 = (pathlib.Path(tmp2) / "regeneration_report.md").read_bytes()
                self.assertEqual(r1, r2, "Reports from two consecutive runs differ")

    # -----------------------------------------------------------------------
    # 12. Procedure documentation contains Termux instructions
    # -----------------------------------------------------------------------

    def test_12_procedure_has_termux_instructions(self) -> None:
        """Procedure documentation contains Termux/Android instructions."""
        text = _PROCEDURE_PATH.read_text(encoding="utf-8")
        self.assertIn("Termux", text)
        self.assertIn("pkg install python", text)

    # -----------------------------------------------------------------------
    # 13. Procedure documentation contains standard Linux instructions
    # -----------------------------------------------------------------------

    def test_13_procedure_has_linux_instructions(self) -> None:
        """Procedure documentation contains standard Linux instructions."""
        text = _PROCEDURE_PATH.read_text(encoding="utf-8")
        self.assertIn("Standard Linux", text)
        self.assertIn("mktemp -d", text)

    # -----------------------------------------------------------------------
    # 14. GitHub Actions compatibility is assessed honestly
    # -----------------------------------------------------------------------

    def test_14_github_actions_assessed_honestly(self) -> None:
        """GitHub Actions compatibility is assessed without false claims."""
        text = _PROCEDURE_PATH.read_text(encoding="utf-8")
        self.assertIn("GitHub Actions", text)
        # Must not claim unconditional full support
        self.assertNotIn("fully supported on GitHub Actions", text.lower())
        # Must include an honest assessment
        self.assertTrue(
            "compatible_with_clean_checkout" in text or "assessed" in text,
            "GitHub Actions assessment must be honest and present",
        )

    # -----------------------------------------------------------------------
    # 15. Repeated regeneration to two absolute temp directories is byte-identical
    # -----------------------------------------------------------------------

    def test_15_repeated_regeneration_byte_identical(self) -> None:
        """Two separate --output-dir regenerations produce byte-identical results."""
        with tempfile.TemporaryDirectory() as out1:
            with tempfile.TemporaryDirectory() as out2:
                with tempfile.TemporaryDirectory() as audit1:
                    with tempfile.TemporaryDirectory() as audit2:
                        run_main([
                            "--repo-root", str(_REPO_ROOT),
                            "--output-dir", out1,
                            "--audit-output-dir", audit1,
                        ])
                        run_main([
                            "--repo-root", str(_REPO_ROOT),
                            "--output-dir", out2,
                            "--audit-output-dir", audit2,
                        ])
                        h1 = hash_tree(pathlib.Path(out1))
                        h2 = hash_tree(pathlib.Path(out2))
                        self.assertEqual(h1, h2, "Two regenerations produced different output trees")

    # -----------------------------------------------------------------------
    # 16. Regeneration from an external CWD is byte-identical
    # -----------------------------------------------------------------------

    def test_16_external_cwd_byte_identical(self) -> None:
        """Regeneration from an external CWD matches regeneration from repo root CWD."""
        with tempfile.TemporaryDirectory() as external_cwd:
            with tempfile.TemporaryDirectory() as out1:
                with tempfile.TemporaryDirectory() as out2:
                    with tempfile.TemporaryDirectory() as audit1:
                        with tempfile.TemporaryDirectory() as audit2:
                            saved_cwd = os.getcwd()
                            try:
                                run_main([
                                    "--repo-root", str(_REPO_ROOT),
                                    "--output-dir", out1,
                                    "--audit-output-dir", audit1,
                                ])
                                os.chdir(external_cwd)
                                run_main([
                                    "--repo-root", str(_REPO_ROOT),
                                    "--output-dir", out2,
                                    "--audit-output-dir", audit2,
                                ])
                            finally:
                                os.chdir(saved_cwd)
                            h1 = hash_tree(pathlib.Path(out1))
                            h2 = hash_tree(pathlib.Path(out2))
                            self.assertEqual(h1, h2, "External CWD regeneration differs")

    # -----------------------------------------------------------------------
    # 17. Temporary directory paths do not appear in outputs
    # -----------------------------------------------------------------------

    def test_17_no_temp_dir_paths_in_outputs(self) -> None:
        """Output files do not contain temporary directory paths."""
        with tempfile.TemporaryDirectory() as tmp:
            with tempfile.TemporaryDirectory() as audit_tmp:
                run_main([
                    "--repo-root", str(_REPO_ROOT),
                    "--output-dir", tmp,
                    "--audit-output-dir", audit_tmp,
                ])
                manifest_text = (pathlib.Path(audit_tmp) / "regeneration_manifest.json").read_text(encoding="utf-8")
                report_text = (pathlib.Path(audit_tmp) / "regeneration_report.md").read_text(encoding="utf-8")
                self.assertNotIn(tmp, manifest_text, "Temp dir path leaked into manifest")
                self.assertNotIn(tmp, report_text, "Temp dir path leaked into report")
                self.assertNotIn(audit_tmp, manifest_text, "Audit temp dir leaked into manifest")

    # -----------------------------------------------------------------------
    # 18. No timestamps in outputs
    # -----------------------------------------------------------------------

    def test_18_no_timestamps_in_outputs(self) -> None:
        """Output manifest and report contain no timestamps."""
        manifest_text = _MANIFEST_PATH.read_text(encoding="utf-8")
        report_text = _REPORT_PATH.read_text(encoding="utf-8")
        import re
        # ISO 8601 datetime pattern
        ts_pattern = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}")
        self.assertIsNone(
            ts_pattern.search(manifest_text),
            "Timestamp found in manifest",
        )
        self.assertIsNone(
            ts_pattern.search(report_text),
            "Timestamp found in report",
        )

    # -----------------------------------------------------------------------
    # 19. Unsafe output paths are rejected
    # -----------------------------------------------------------------------

    def test_19_unsafe_output_path_rejected(self) -> None:
        """Unsafe output paths trigger EXIT_UNSAFE_PATH."""
        with tempfile.TemporaryDirectory() as audit_tmp:
            # Repo root
            code = run_main([
                "--repo-root", str(_REPO_ROOT),
                "--output-dir", str(_REPO_ROOT),
                "--audit-output-dir", audit_tmp,
            ])
            self.assertEqual(code, regen.EXIT_UNSAFE_PATH)

            # Package root itself
            code = run_main([
                "--repo-root", str(_REPO_ROOT),
                "--output-dir", str(_REPO_ROOT / "DROPi_Canonical_Reference"),
                "--audit-output-dir", audit_tmp,
            ])
            self.assertEqual(code, regen.EXIT_UNSAFE_PATH)

            # canonical/
            code = run_main([
                "--repo-root", str(_REPO_ROOT),
                "--output-dir", str(_REPO_ROOT / "canonical"),
                "--audit-output-dir", audit_tmp,
            ])
            self.assertEqual(code, regen.EXIT_UNSAFE_PATH)

            # BLUEPRINT/
            code = run_main([
                "--repo-root", str(_REPO_ROOT),
                "--output-dir", str(_REPO_ROOT / "BLUEPRINT"),
                "--audit-output-dir", audit_tmp,
            ])
            self.assertEqual(code, regen.EXIT_UNSAFE_PATH)

    # -----------------------------------------------------------------------
    # 20. In-place package mutation rejected by default
    # -----------------------------------------------------------------------

    def test_20_inplace_mutation_rejected(self) -> None:
        """DROPi_Canonical_Reference/ as output-dir is rejected."""
        with tempfile.TemporaryDirectory() as audit_tmp:
            code = run_main([
                "--repo-root", str(_REPO_ROOT),
                "--output-dir", str(_PACKAGE_ROOT),
                "--audit-output-dir", audit_tmp,
            ])
            self.assertEqual(code, regen.EXIT_UNSAFE_PATH)

    # -----------------------------------------------------------------------
    # 21. Path traversal is rejected
    # -----------------------------------------------------------------------

    def test_21_path_traversal_rejected(self) -> None:
        """Path traversal that resolves to a forbidden directory is rejected."""
        with tempfile.TemporaryDirectory() as audit_tmp:
            # DROPi_Canonical_Reference/../canonical resolves to canonical/ (forbidden)
            traversal = str(_REPO_ROOT / "DROPi_Canonical_Reference" / ".." / "canonical")
            code = run_main([
                "--repo-root", str(_REPO_ROOT),
                "--output-dir", traversal,
                "--audit-output-dir", audit_tmp,
            ])
            self.assertEqual(code, regen.EXIT_UNSAFE_PATH)

    # -----------------------------------------------------------------------
    # 22. Symlink escape is rejected
    # -----------------------------------------------------------------------

    def test_22_symlink_escape_rejected(self) -> None:
        """Symlink pointing to forbidden directory is rejected."""
        with tempfile.TemporaryDirectory() as tmp:
            symlink = pathlib.Path(tmp) / "sym_canonical"
            symlink.symlink_to(_REPO_ROOT / "canonical")
            with tempfile.TemporaryDirectory() as audit_tmp:
                code = run_main([
                    "--repo-root", str(_REPO_ROOT),
                    "--output-dir", str(symlink),
                    "--audit-output-dir", audit_tmp,
                ])
                self.assertEqual(code, regen.EXIT_UNSAFE_PATH)

    # -----------------------------------------------------------------------
    # 23. Missing source paths produce deterministic failure
    # -----------------------------------------------------------------------

    def test_23_missing_source_deterministic_failure(self) -> None:
        """compute_file_result with missing source returns source_exists=False."""
        zip_index = regen.build_zip_index(_ARCHIVE_PATH)
        fake_record = {
            "package_path": "test/fake.md",
            "package_sha256": "aabbcc",
            "primary_provenance_class": "derived_from_root_architecture_or_governance",
            "derived_status": "copied_byte_identical",
            "source_path": "nonexistent_source_file_xyz.md",
        }
        result = regen.compute_file_result(fake_record, _REPO_ROOT, _PACKAGE_ROOT, zip_index)
        self.assertFalse(result["source_exists"])
        self.assertEqual(result["failure_reason"], "source_missing")
        self.assertFalse(result["certifiable"])

    # -----------------------------------------------------------------------
    # 24. Divergent source hashes produce deterministic failure
    # -----------------------------------------------------------------------

    def test_24_divergent_source_hash_fails(self) -> None:
        """compute_file_result with wrong expected hash marks byte_identical=False."""
        zip_index = regen.build_zip_index(_ARCHIVE_PATH)
        # Use DECISION_LOG.md (known to exist) but with wrong expected hash
        real_src = "DECISION_LOG.md"
        fake_record = {
            "package_path": "fake/path.md",
            "package_sha256": "0" * 64,  # wrong hash
            "primary_provenance_class": "derived_from_root_architecture_or_governance",
            "derived_status": "copied_byte_identical",
            "source_path": real_src,
        }
        result = regen.compute_file_result(fake_record, _REPO_ROOT, _PACKAGE_ROOT, zip_index)
        self.assertTrue(result["source_exists"])
        self.assertFalse(result["byte_identical"])
        self.assertFalse(result["certifiable"])

    # -----------------------------------------------------------------------
    # 25. Unsupported provenance remains visible
    # -----------------------------------------------------------------------

    def test_25_unsupported_visible_in_manifest(self) -> None:
        """Unsupported files appear in manifest unsupported_files list."""
        manifest = json.loads(_MANIFEST_PATH.read_text(encoding="utf-8"))
        unsupported = manifest["unsupported_files"]
        self.assertGreater(len(unsupported), 0, "No unsupported files listed in manifest")
        can007_unsup = [r["package_path"] for r in _CAN007["records"] if r["derived_status"] == "unsupported"]
        self.assertEqual(sorted(unsupported), sorted(can007_unsup))

    # -----------------------------------------------------------------------
    # 26. counts_by_provenance_class sums correctly
    # -----------------------------------------------------------------------

    def test_26_counts_by_provenance_class_correct(self) -> None:
        """counts_by_provenance_class sums to 217."""
        manifest = json.loads(_MANIFEST_PATH.read_text(encoding="utf-8"))
        total = sum(manifest["counts_by_provenance_class"].values())
        self.assertEqual(total, 217)

    # -----------------------------------------------------------------------
    # 27. counts_by_derived_status sums correctly
    # -----------------------------------------------------------------------

    def test_27_counts_by_derived_status_correct(self) -> None:
        """counts_by_derived_status sums to 217."""
        manifest = json.loads(_MANIFEST_PATH.read_text(encoding="utf-8"))
        total = sum(manifest["counts_by_derived_status"].values())
        self.assertEqual(total, 217)

    # -----------------------------------------------------------------------
    # 28. 04.zip remains byte-identical
    # -----------------------------------------------------------------------

    def test_28_archive_unchanged(self) -> None:
        """04.zip SHA-256 remains at the expected value."""
        actual = sha256_path(_ARCHIVE_PATH)
        self.assertEqual(actual, regen.ARCHIVE_EXPECTED_SHA256)

    # -----------------------------------------------------------------------
    # 29. canonical/ remains unchanged after validation
    # -----------------------------------------------------------------------

    def test_29_canonical_dir_unchanged(self) -> None:
        """canonical/ directory is unchanged after running validation."""
        canonical_dir = _REPO_ROOT / "canonical"
        before = hash_tree(canonical_dir)
        with tempfile.TemporaryDirectory() as audit_tmp:
            run_main([
                "--repo-root", str(_REPO_ROOT),
                "--validate-existing",
                "--audit-output-dir", audit_tmp,
            ])
        after = hash_tree(canonical_dir)
        self.assertEqual(before, after, "canonical/ changed after validation")

    # -----------------------------------------------------------------------
    # 30. BLUEPRINT/ remains unchanged after validation
    # -----------------------------------------------------------------------

    def test_30_blueprint_dir_unchanged(self) -> None:
        """BLUEPRINT/ directory is unchanged after running validation."""
        blueprint_dir = _REPO_ROOT / "BLUEPRINT"
        before = hash_tree(blueprint_dir)
        with tempfile.TemporaryDirectory() as audit_tmp:
            run_main([
                "--repo-root", str(_REPO_ROOT),
                "--validate-existing",
                "--audit-output-dir", audit_tmp,
            ])
        after = hash_tree(blueprint_dir)
        self.assertEqual(before, after, "BLUEPRINT/ changed after validation")

    # -----------------------------------------------------------------------
    # 31. DROPi_Canonical_Reference/ unchanged during validation
    # -----------------------------------------------------------------------

    def test_31_package_unchanged_during_validation(self) -> None:
        """DROPi_Canonical_Reference/ is not modified during --validate-existing."""
        before = hash_tree(_PACKAGE_ROOT)
        with tempfile.TemporaryDirectory() as audit_tmp:
            run_main([
                "--repo-root", str(_REPO_ROOT),
                "--validate-existing",
                "--audit-output-dir", audit_tmp,
            ])
        after = hash_tree(_PACKAGE_ROOT)
        self.assertEqual(before, after, "Package root changed during validation")

    # -----------------------------------------------------------------------
    # 32. CAN-001 through CAN-007 reports unchanged
    # -----------------------------------------------------------------------

    def test_32_audit_inputs_unchanged(self) -> None:
        """CAN-001 through CAN-007 reports are unchanged after running validation."""
        before: dict[str, str] = {}
        for _, rel_path in regen.AUDIT_INPUT_PATHS:
            p = _REPO_ROOT / rel_path
            before[rel_path] = sha256_path(p)

        with tempfile.TemporaryDirectory() as audit_tmp:
            run_main([
                "--repo-root", str(_REPO_ROOT),
                "--validate-existing",
                "--audit-output-dir", audit_tmp,
            ])

        for rel_path, expected_sha in before.items():
            actual = sha256_path(_REPO_ROOT / rel_path)
            self.assertEqual(actual, expected_sha, f"Audit input changed: {rel_path}")

    # -----------------------------------------------------------------------
    # 33. Generator creates no Python bytecode artifacts
    # -----------------------------------------------------------------------

    def test_33_no_bytecode_artifacts(self) -> None:
        """No .pyc files exist in scripts/ or tests/ directories."""
        for directory in (_REPO_ROOT / "scripts", _REPO_ROOT / "tests"):
            for pyc in directory.rglob("*.pyc"):
                self.fail(f"Bytecode artifact found: {pyc}")
            pycache = directory / "__pycache__"
            if pycache.exists():
                entries = list(pycache.iterdir())
                self.assertEqual(
                    len(entries), 0,
                    f"__pycache__ not empty in {directory}: {entries}",
                )

    # -----------------------------------------------------------------------
    # 34. Checked-in CAN-008 JSON and Markdown match fresh regeneration
    # -----------------------------------------------------------------------

    def test_34_checkedin_matches_fresh_regeneration(self) -> None:
        """Checked-in regeneration_manifest.json and regeneration_report.md match a fresh --validate-existing run."""
        with tempfile.TemporaryDirectory() as audit_tmp:
            run_main([
                "--repo-root", str(_REPO_ROOT),
                "--validate-existing",
                "--audit-output-dir", audit_tmp,
            ])
            fresh_manifest = (pathlib.Path(audit_tmp) / "regeneration_manifest.json").read_bytes()
            fresh_report = (pathlib.Path(audit_tmp) / "regeneration_report.md").read_bytes()

        self.assertEqual(
            _MANIFEST_PATH.read_bytes(),
            fresh_manifest,
            "Checked-in regeneration_manifest.json does not match fresh generation",
        )
        self.assertEqual(
            _REPORT_PATH.read_bytes(),
            fresh_report,
            "Checked-in regeneration_report.md does not match fresh generation",
        )

    # -----------------------------------------------------------------------
    # Additional: package_control count is 4
    # -----------------------------------------------------------------------

    def test_package_control_count_is_4(self) -> None:
        """Exactly 4 package-control documents are identified."""
        manifest = json.loads(_MANIFEST_PATH.read_text(encoding="utf-8"))
        self.assertEqual(manifest["summary"]["package_control_count"], 4)

    # -----------------------------------------------------------------------
    # Additional: not_certifiable count matches unsupported + derived_transformation
    # -----------------------------------------------------------------------

    def test_not_certifiable_count(self) -> None:
        """not_certifiable_files contains exactly unsupported + derived_transformation records."""
        manifest = json.loads(_MANIFEST_PATH.read_text(encoding="utf-8"))
        nc = manifest["not_certifiable_files"]
        expected = sum(
            1
            for r in _CAN007["records"]
            if r["derived_status"] in ("unsupported", "derived_transformation")
        )
        self.assertEqual(len(nc), expected)

    # -----------------------------------------------------------------------
    # Additional: 04.zip entry sha matches CAN-001 for sampled entries
    # -----------------------------------------------------------------------

    def test_zip_index_matches_can001(self) -> None:
        """ZIP index SHA-256 values match CAN-001 entries for file entries."""
        can001 = json.loads((_REPO_ROOT / "docs/audits/can-001/04_zip_inventory.json").read_text(encoding="utf-8"))
        can001_by_path = {
            e["path"]: e["sha256"]
            for e in can001["entries"]
            if e.get("entry_type") == "file" and e.get("sha256")
        }
        zip_index = regen.build_zip_index(_ARCHIVE_PATH)
        for path, expected_sha in can001_by_path.items():
            if path in zip_index:
                self.assertEqual(
                    zip_index[path]["sha256"],
                    expected_sha,
                    f"ZIP index SHA mismatch for {path}",
                )

    # -----------------------------------------------------------------------
    # Additional: no --validate-existing AND --output-dir required
    # -----------------------------------------------------------------------

    def test_requires_mode_flag(self) -> None:
        """Invoking without --validate-existing or --output-dir exits with EXIT_UNSAFE_PATH."""
        with tempfile.TemporaryDirectory() as audit_tmp:
            code = run_main([
                "--repo-root", str(_REPO_ROOT),
                "--audit-output-dir", audit_tmp,
            ])
        self.assertEqual(code, regen.EXIT_UNSAFE_PATH)


if __name__ == "__main__":
    unittest.main(verbosity=2)
