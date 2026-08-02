"""Tests for CAN-008 deterministic canonical package regeneration."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import pathlib
import shutil
import tempfile
import unittest

_REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
_SCRIPT = _REPO_ROOT / "scripts" / "regenerate_canonical_reference.py"

_spec = importlib.util.spec_from_file_location("regenerate_canonical_reference", _SCRIPT)
_mod = importlib.util.module_from_spec(_spec)  # type: ignore[arg-type]
_spec.loader.exec_module(_mod)  # type: ignore[union-attr]
regen = _mod

_CAN007 = json.loads((_REPO_ROOT / regen.CAN007_REL_PATH).read_text(encoding="utf-8"))
_PACKAGE_ROOT = _REPO_ROOT / regen.DEFAULT_PACKAGE_ROOT_NAME
_MANIFEST_PATH = _REPO_ROOT / "docs/audits/can-008/regeneration_manifest.json"
_REPORT_PATH = _REPO_ROOT / "docs/audits/can-008/regeneration_report.md"
_PROCEDURE_PATH = _REPO_ROOT / "docs/CANONICAL_PACKAGE_REGENERATION.md"
_README_PATH = _REPO_ROOT / "docs/audits/can-008/README.md"

EXPECTED_PACKAGE_CONTROL_PATHS = [
    "AI_CANONICAL_REFERENCE_AUDIT_REPORT.md",
    "CANONICAL_KNOWLEDGE_INDEX.md",
    "CANONICAL_MANIFEST.md",
    "README_FOR_DROPi_TYCOON.md",
]
MUTATED_PACKAGE_CONTROL_PATH = "README_FOR_DROPi_TYCOON.md"


def sha256_path(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def hash_tree(root: pathlib.Path) -> dict[str, str]:
    result: dict[str, str] = {}
    for path in sorted(root.rglob("*")):
        if path.is_file():
            result[path.relative_to(root).as_posix()] = sha256_path(path)
    return result


def run_main(args: list[str]) -> int:
    try:
        return regen.main(args)
    except SystemExit as exc:
        return int(exc.code) if exc.code is not None else 0


def fresh_manifest(repo_root: pathlib.Path = _REPO_ROOT) -> dict[str, object]:
    with tempfile.TemporaryDirectory() as audit_tmp:
        code = run_main([
            "--repo-root", str(repo_root),
            "--validate-existing",
            "--audit-output-dir", audit_tmp,
        ])
        if code != regen.EXIT_NOT_CERTIFIABLE:
            raise AssertionError(f"Expected EXIT_NOT_CERTIFIABLE, got {code}")
        manifest_path = pathlib.Path(audit_tmp) / "regeneration_manifest.json"
        return json.loads(manifest_path.read_text(encoding="utf-8"))


def copy_repo(root: pathlib.Path) -> pathlib.Path:
    temp_root = pathlib.Path(tempfile.mkdtemp()) / root.name
    shutil.copytree(
        root,
        temp_root,
        ignore=shutil.ignore_patterns(".git", "node_modules", "__pycache__", "dist", "build", "coverage"),
    )
    return temp_root


class TestRegenerateCanonicalReference(unittest.TestCase):
    def test_01_package_has_217_files(self) -> None:
        files = [path for path in sorted(_PACKAGE_ROOT.rglob("*")) if path.is_file()]
        self.assertEqual(len(files), 217)

    def test_02_can007_has_217_records(self) -> None:
        self.assertEqual(len(_CAN007["records"]), 217)

    def test_03_exact_four_package_control_paths(self) -> None:
        actual = sorted(
            record["package_path"]
            for record in _CAN007["records"]
            if record["derived_status"] == "package_control"
        )
        self.assertEqual(actual, EXPECTED_PACKAGE_CONTROL_PATHS)
        self.assertEqual(list(regen.PACKAGE_CONTROL_PATHS), EXPECTED_PACKAGE_CONTROL_PATHS)

    def test_04_validate_existing_exit_code(self) -> None:
        with tempfile.TemporaryDirectory() as audit_tmp:
            code = run_main([
                "--repo-root", str(_REPO_ROOT),
                "--validate-existing",
                "--audit-output-dir", audit_tmp,
            ])
        self.assertEqual(code, regen.EXIT_NOT_CERTIFIABLE)

    def test_05_package_control_semantics_are_explicit(self) -> None:
        zip_index = regen.build_zip_index(_REPO_ROOT / regen.ARCHIVE_REL_PATH)
        for record in _CAN007["records"]:
            if record["derived_status"] != "package_control":
                continue
            result = regen.compute_file_result(record, _REPO_ROOT, _PACKAGE_ROOT, zip_index)
            self.assertEqual(result["source_category"], regen.SOURCE_CATEGORY_PACKAGE_CONTROL)
            self.assertEqual(result["regeneration_method"], regen.PACKAGE_CONTROL_METADATA[record["package_path"]]["generator"])
            self.assertFalse(result["regenerated_from_authoritative_source"])
            self.assertTrue(result["regenerated_from_documented_inputs"])
            self.assertTrue(result["source_exists"])
            self.assertEqual(result["package_control_role"], regen.PACKAGE_CONTROL_METADATA[record["package_path"]]["role"])
            self.assertEqual(result["documented_inputs"], regen.PACKAGE_CONTROL_METADATA[record["package_path"]]["documented_inputs"])
            self.assertEqual(result["byte_identical"], result["regenerated_sha256"] == result["expected_sha256"])

    def test_06_fallback_semantics_are_explicit(self) -> None:
        zip_index = regen.build_zip_index(_REPO_ROOT / regen.ARCHIVE_REL_PATH)
        for record in _CAN007["records"]:
            if record["derived_status"] not in {"unsupported", "derived_transformation"}:
                continue
            result = regen.compute_file_result(record, _REPO_ROOT, _PACKAGE_ROOT, zip_index)
            self.assertEqual(result["regeneration_method"], regen.METHOD_RETAINED_FALLBACK)
            self.assertFalse(result["regenerated_from_authoritative_source"])
            self.assertFalse(result["regenerated_from_documented_inputs"])
            self.assertFalse(result["certifiable"])
            self.assertIsNotNone(result["failure_reason"])
        unsupported_results = [
            regen.compute_file_result(record, _REPO_ROOT, _PACKAGE_ROOT, zip_index)
            for record in _CAN007["records"]
            if record["derived_status"] == "unsupported"
        ]
        self.assertTrue(all(result["source_category"] == regen.SOURCE_CATEGORY_UNSUPPORTED for result in unsupported_results))
        derived_result = next(
            regen.compute_file_result(record, _REPO_ROOT, _PACKAGE_ROOT, zip_index)
            for record in _CAN007["records"]
            if record["derived_status"] == "derived_transformation"
        )
        self.assertEqual(derived_result["source_category"], regen.SOURCE_CATEGORY_FALLBACK)
        self.assertEqual(derived_result["failure_reason"], "derived_transformation_algorithm_not_documented")

    def test_07_summary_counts_exclude_retained_fallback(self) -> None:
        manifest = fresh_manifest()
        summary = manifest["summary"]
        self.assertEqual(summary["expected_package_file_count"], 217)
        self.assertEqual(summary["retained_existing_fallback_count"], 4)
        self.assertEqual(summary["unsupported_source_count"], 3)
        self.assertEqual(summary["undocumented_transformation_count"], 1)
        self.assertTrue(summary["summary_totals_reconcile"])
        self.assertEqual(
            summary["actually_regenerated_from_source_count"] + summary["retained_existing_fallback_count"],
            summary["expected_package_file_count"],
        )
        self.assertEqual(
            summary["byte_identical_regenerated_count"],
            sum(
                1
                for result in manifest["file_results"]
                if result["regenerated_from_documented_inputs"] and result["byte_identical"]
            ),
        )

    def test_08_blockers_are_honest_and_reconcile(self) -> None:
        manifest = fresh_manifest()
        blockers = manifest["certification_blockers"]
        summary = manifest["summary"]
        self.assertEqual(len(blockers), summary["non_certifiable_file_count"])
        blocker_paths = {item["package_path"] for item in blockers}
        self.assertIn("00_Project/Governance/SESSION_HANDOVER.md", blocker_paths)
        self.assertIn("00_Project/Status_Reports/AUDIT_TRACKING.md", blocker_paths)
        self.assertIn("00_Project/Status_Reports/SESSION_STATE.md", blocker_paths)
        self.assertIn("09_Reference/Package_Metadata/inventory.json", blocker_paths)
        package_control_unreproducible = sum(
            1 for item in manifest["package_control_results"] if not item["certifiable"]
        )
        self.assertEqual(summary["package_control_unreproducible_count"], package_control_unreproducible)
        self.assertGreaterEqual(summary["non_certifiable_file_count"], 4)

    def test_09_package_control_generation_is_deterministic(self) -> None:
        context = regen.build_package_control_context(_REPO_ROOT)
        first = {
            path: regen.generate_package_control_bytes(path, context)
            for path in EXPECTED_PACKAGE_CONTROL_PATHS
        }
        second = {
            path: regen.generate_package_control_bytes(path, context)
            for path in EXPECTED_PACKAGE_CONTROL_PATHS
        }
        self.assertEqual(first, second)

    def test_10_package_control_mutation_does_not_change_generated_bytes(self) -> None:
        temp_repo = copy_repo(_REPO_ROOT)
        self.addCleanup(lambda: shutil.rmtree(temp_repo.parent, ignore_errors=True))

        baseline_context = regen.build_package_control_context(_REPO_ROOT)
        baseline_bytes = regen.generate_package_control_bytes(MUTATED_PACKAGE_CONTROL_PATH, baseline_context)

        mutated_file = temp_repo / regen.DEFAULT_PACKAGE_ROOT_NAME / MUTATED_PACKAGE_CONTROL_PATH
        mutated_file.write_text("MUTATED PACKAGE CONTROL BYTES\n", encoding="utf-8")

        mutated_context = regen.build_package_control_context(temp_repo)
        mutated_bytes = regen.generate_package_control_bytes(MUTATED_PACKAGE_CONTROL_PATH, mutated_context)
        self.assertEqual(mutated_bytes, baseline_bytes)
        self.assertNotEqual(sha256_path(mutated_file), hashlib.sha256(mutated_bytes).hexdigest())

    def test_11_mutation_validation_detects_checked_in_package_divergence(self) -> None:
        temp_repo = copy_repo(_REPO_ROOT)
        self.addCleanup(lambda: shutil.rmtree(temp_repo.parent, ignore_errors=True))

        mutated_file = temp_repo / regen.DEFAULT_PACKAGE_ROOT_NAME / MUTATED_PACKAGE_CONTROL_PATH
        mutated_file.write_text("MUTATED PACKAGE CONTROL BYTES\n", encoding="utf-8")

        manifest = fresh_manifest(temp_repo)
        mutated_result = next(
            item for item in manifest["package_control_results"] if item["package_path"] == MUTATED_PACKAGE_CONTROL_PATH
        )
        self.assertFalse(mutated_result["checked_in_package_matches_expected"])
        self.assertNotEqual(mutated_result["existing_package_sha256"], mutated_result["expected_sha256"])

    def test_12_external_regeneration_ignores_package_control_mutation(self) -> None:
        temp_repo = copy_repo(_REPO_ROOT)
        self.addCleanup(lambda: shutil.rmtree(temp_repo.parent, ignore_errors=True))
        mutated_file = temp_repo / regen.DEFAULT_PACKAGE_ROOT_NAME / MUTATED_PACKAGE_CONTROL_PATH
        mutated_file.write_text("MUTATED PACKAGE CONTROL BYTES\n", encoding="utf-8")

        with tempfile.TemporaryDirectory() as out1, tempfile.TemporaryDirectory() as out2:
            with tempfile.TemporaryDirectory() as audit1, tempfile.TemporaryDirectory() as audit2:
                code1 = run_main([
                    "--repo-root", str(_REPO_ROOT),
                    "--output-dir", out1,
                    "--audit-output-dir", audit1,
                ])
                code2 = run_main([
                    "--repo-root", str(temp_repo),
                    "--output-dir", out2,
                    "--audit-output-dir", audit2,
                ])
                self.assertEqual(code1, regen.EXIT_NOT_CERTIFIABLE)
                self.assertEqual(code2, regen.EXIT_NOT_CERTIFIABLE)
                self.assertEqual(
                    sha256_path(pathlib.Path(out1) / MUTATED_PACKAGE_CONTROL_PATH),
                    sha256_path(pathlib.Path(out2) / MUTATED_PACKAGE_CONTROL_PATH),
                )

    def test_13_repeated_external_regenerations_match_full_tree(self) -> None:
        with tempfile.TemporaryDirectory() as out1, tempfile.TemporaryDirectory() as out2:
            with tempfile.TemporaryDirectory() as audit1, tempfile.TemporaryDirectory() as audit2:
                code1 = run_main([
                    "--repo-root", str(_REPO_ROOT),
                    "--output-dir", out1,
                    "--audit-output-dir", audit1,
                ])
                code2 = run_main([
                    "--repo-root", str(_REPO_ROOT),
                    "--output-dir", out2,
                    "--audit-output-dir", audit2,
                ])
                self.assertEqual(code1, regen.EXIT_NOT_CERTIFIABLE)
                self.assertEqual(code2, regen.EXIT_NOT_CERTIFIABLE)
                self.assertEqual(hash_tree(pathlib.Path(out1)), hash_tree(pathlib.Path(out2)))

    def test_14_outputs_contain_no_temp_paths_or_timestamps(self) -> None:
        with tempfile.TemporaryDirectory() as out_dir, tempfile.TemporaryDirectory() as audit_tmp:
            run_main([
                "--repo-root", str(_REPO_ROOT),
                "--output-dir", out_dir,
                "--audit-output-dir", audit_tmp,
            ])
            manifest_text = (pathlib.Path(audit_tmp) / "regeneration_manifest.json").read_text(encoding="utf-8")
            report_text = (pathlib.Path(audit_tmp) / "regeneration_report.md").read_text(encoding="utf-8")
            self.assertNotIn(out_dir, manifest_text)
            self.assertNotIn(out_dir, report_text)
            self.assertNotRegex(manifest_text, r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}")
            self.assertNotRegex(report_text, r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}")

    def test_15_github_actions_wording_is_honest(self) -> None:
        manifest = fresh_manifest()
        env = manifest["environment_compatibility"]
        self.assertEqual(env["github_actions"], "assessed_compatible_with_clean_checkout")
        self.assertEqual(
            env["github_actions_execution"],
            "not_exercised_in_actual_github_actions_for_this_pr",
        )
        procedure_text = _PROCEDURE_PATH.read_text(encoding="utf-8")
        report_text = _REPORT_PATH.read_text(encoding="utf-8")
        self.assertIn("assessed_compatible_with_clean_checkout", procedure_text)
        self.assertIn("not_exercised_in_actual_github_actions_for_this_pr", procedure_text)
        self.assertIn("assessed_compatible_with_clean_checkout", report_text)
        self.assertNotIn("tested with ubuntu-latest", procedure_text)
        self.assertNotIn("tested with ubuntu-latest", report_text)

    def test_16_checked_in_outputs_match_fresh_generation(self) -> None:
        with tempfile.TemporaryDirectory() as audit_tmp:
            code = run_main([
                "--repo-root", str(_REPO_ROOT),
                "--validate-existing",
                "--audit-output-dir", audit_tmp,
            ])
            self.assertEqual(code, regen.EXIT_NOT_CERTIFIABLE)
            self.assertEqual(
                _MANIFEST_PATH.read_bytes(),
                (pathlib.Path(audit_tmp) / "regeneration_manifest.json").read_bytes(),
            )
            self.assertEqual(
                _REPORT_PATH.read_bytes(),
                (pathlib.Path(audit_tmp) / "regeneration_report.md").read_bytes(),
            )

    def test_17_compare_with_checked_in_package_reports_divergence(self) -> None:
        with tempfile.TemporaryDirectory() as out_dir, tempfile.TemporaryDirectory() as audit_tmp:
            code = run_main([
                "--repo-root", str(_REPO_ROOT),
                "--output-dir", out_dir,
                "--compare-with", regen.DEFAULT_PACKAGE_ROOT_NAME,
                "--audit-output-dir", audit_tmp,
            ])
        self.assertEqual(code, regen.EXIT_DIVERGENT)

    def test_18_unsafe_output_paths_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as audit_tmp:
            code = run_main([
                "--repo-root", str(_REPO_ROOT),
                "--output-dir", str(_REPO_ROOT),
                "--audit-output-dir", audit_tmp,
            ])
            self.assertEqual(code, regen.EXIT_UNSAFE_PATH)
            code = run_main([
                "--repo-root", str(_REPO_ROOT),
                "--output-dir", str(_PACKAGE_ROOT),
                "--audit-output-dir", audit_tmp,
            ])
            self.assertEqual(code, regen.EXIT_UNSAFE_PATH)

    def test_19_requires_validate_or_output_dir(self) -> None:
        with tempfile.TemporaryDirectory() as audit_tmp:
            code = run_main([
                "--repo-root", str(_REPO_ROOT),
                "--audit-output-dir", audit_tmp,
            ])
        self.assertEqual(code, regen.EXIT_UNSAFE_PATH)

    def test_20_docs_state_non_certifiable_package_control_status(self) -> None:
        readme_text = _README_PATH.read_text(encoding="utf-8")
        self.assertIn("NOT CERTIFIABLE", readme_text)
        self.assertIn("package-control", readme_text.lower())
        self.assertIn("README_FOR_DROPi_TYCOON.md", readme_text)
        self.assertIn("CANONICAL_MANIFEST.md", readme_text)


if __name__ == "__main__":
    unittest.main(verbosity=2)
