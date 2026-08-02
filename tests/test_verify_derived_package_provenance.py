from __future__ import annotations

import hashlib
import json
import pathlib
import re
import subprocess
import sys
import tempfile
import unittest

from scripts.verify_derived_package_provenance import (
    OFFICIAL_DERIVED_STATUSES,
    OFFICIAL_PROVENANCE_CLASSES,
    build_markdown,
    build_report,
    main,
)


def sha256_path(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def tree_fingerprint(root: pathlib.Path) -> str:
    entries: list[str] = []
    for p in sorted(root.rglob("*")):
        if p.is_file():
            rel = p.relative_to(root).as_posix()
            entries.append(f"{rel}:{sha256_path(p)}")
    return hashlib.sha256("\n".join(entries).encode("utf-8")).hexdigest()


class TestVerifyDerivedPackageProvenance(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.repo_root = pathlib.Path(__file__).resolve().parents[1]
        cls.report = build_report(repo_root=cls.repo_root, package_root_name="DROPi_Canonical_Reference")
        cls.records = cls.report["records"]
        cls.by_path = {r["package_path"]: r for r in cls.records}

    def test_independent_package_scan_count(self) -> None:
        self.assertEqual(self.report["summary"]["package_file_count"], 217)

    def test_exactly_one_record_per_package_file(self) -> None:
        self.assertEqual(len(self.records), 217)
        self.assertEqual(len({r["package_path"] for r in self.records}), 217)
        self.assertEqual(self.report["summary"]["provenance_record_count"], 217)

    def test_only_official_provenance_classes(self) -> None:
        allowed = set(OFFICIAL_PROVENANCE_CLASSES)
        self.assertEqual(set(self.report["counts_by_provenance_class"].keys()), allowed)
        self.assertTrue(all(r["primary_provenance_class"] in allowed for r in self.records))

    def test_only_official_derived_statuses(self) -> None:
        allowed = set(OFFICIAL_DERIVED_STATUSES)
        self.assertEqual(set(self.report["counts_by_derived_status"].keys()), allowed)
        self.assertTrue(all(r["derived_status"] in allowed for r in self.records))

    def test_all_required_fields_exist(self) -> None:
        required = {
            "package_path",
            "package_sha256",
            "package_size",
            "extension",
            "primary_provenance_class",
            "derived_status",
            "source_path",
            "source_exists",
            "source_sha256",
            "content_relation",
            "matching_method",
            "candidate_sources",
            "evidence",
            "confidence",
            "unsupported_reason",
        }
        for r in self.records:
            self.assertTrue(required.issubset(set(r.keys())))

    def test_supported_non_control_has_existing_source(self) -> None:
        for r in self.records:
            if r["supported"] and r["primary_provenance_class"] != "package_control_document":
                self.assertTrue(r["source_exists"], r["package_path"])
                self.assertIsNotNone(r["source_path"], r["package_path"])

    def test_byte_identical_records_have_equal_hashes(self) -> None:
        for r in self.records:
            if r["derived_status"] == "copied_byte_identical":
                self.assertTrue(r["source_exists"], r["package_path"])
                self.assertIsNotNone(r["source_sha256"], r["package_path"])
                self.assertEqual(r["source_sha256"], r["package_sha256"], r["package_path"])
                self.assertEqual(r["content_relation"], "byte_identical")
                self.assertIn("sha256", r["matching_method"].lower())

    def test_package_controls_are_supported_and_not_unsupported(self) -> None:
        controls = {
            "AI_CANONICAL_REFERENCE_AUDIT_REPORT.md",
            "CANONICAL_KNOWLEDGE_INDEX.md",
            "CANONICAL_MANIFEST.md",
            "README_FOR_DROPi_TYCOON.md",
        }
        for p in controls:
            r = self.by_path[p]
            self.assertEqual(r["primary_provenance_class"], "package_control_document")
            self.assertEqual(r["derived_status"], "package_control")
            self.assertTrue(r["supported"])
            self.assertIsNone(r["unsupported_reason"])
        self.assertTrue(controls.isdisjoint(set(self.report["unsupported_files"])))

    def test_unsupported_records_class_and_status(self) -> None:
        for r in self.records:
            if r["derived_status"] == "unsupported":
                self.assertEqual(r["primary_provenance_class"], "unknown_or_unsupported")
                self.assertFalse(r["supported"])
                self.assertIsNotNone(r["unsupported_reason"])

    def test_missing_and_ambiguous_visibility(self) -> None:
        self.assertIn("missing_sources", self.report)
        self.assertIn("ambiguous_sources", self.report)
        self.assertIsInstance(self.report["missing_sources"], list)
        self.assertIsInstance(self.report["ambiguous_sources"], list)

    def test_candidate_sources_are_sorted(self) -> None:
        for r in self.records:
            self.assertEqual(r["candidate_sources"], sorted(r["candidate_sources"]))

    def test_totals_reconcile_to_217(self) -> None:
        self.assertEqual(sum(self.report["counts_by_provenance_class"].values()), 217)
        self.assertEqual(sum(self.report["counts_by_derived_status"].values()), 217)

    def test_duplicate_content_detection_present(self) -> None:
        self.assertGreaterEqual(len(self.report["duplicate_content_groups"]), 1)
        self.assertEqual(
            self.report["summary"]["duplicate_content_group_count"],
            len(self.report["duplicate_content_groups"]),
        )

    def test_no_mutation_of_canonical_sources_when_generating(self) -> None:
        zip_before = sha256_path(self.repo_root / "04.zip")
        canonical_before = tree_fingerprint(self.repo_root / "canonical")
        blueprint_before = tree_fingerprint(self.repo_root / "BLUEPRINT")
        package_before = tree_fingerprint(self.repo_root / "DROPi_Canonical_Reference")

        with tempfile.TemporaryDirectory() as tmpdir:
            rc = main(["--repo-root", str(self.repo_root), "--output-dir", tmpdir])
            self.assertEqual(rc, 0)

        self.assertEqual(zip_before, sha256_path(self.repo_root / "04.zip"))
        self.assertEqual(canonical_before, tree_fingerprint(self.repo_root / "canonical"))
        self.assertEqual(blueprint_before, tree_fingerprint(self.repo_root / "BLUEPRINT"))
        self.assertEqual(package_before, tree_fingerprint(self.repo_root / "DROPi_Canonical_Reference"))

    def test_cli_output_dir_flag_honoured_byte_identical_to_checked_in(self) -> None:
        """--output-dir passed on the CLI must be used (not ignored) and produce
        output byte-identical to the checked-in docs/audits/can-007 files."""
        checked_json = (self.repo_root / "docs/audits/can-007/derived_package_provenance.json").read_bytes()
        checked_md = (self.repo_root / "docs/audits/can-007/derived_package_provenance.md").read_bytes()

        with tempfile.TemporaryDirectory() as tmpdir:
            out_dir = pathlib.Path(tmpdir)
            result = subprocess.run(
                [sys.executable, str(self.repo_root / "scripts/verify_derived_package_provenance.py"),
                 "--repo-root", str(self.repo_root),
                 "--output-dir", tmpdir],
                capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            gen_json = (out_dir / "derived_package_provenance.json").read_bytes()
            gen_md = (out_dir / "derived_package_provenance.md").read_bytes()

        self.assertEqual(gen_json, checked_json, "CLI-generated JSON must be byte-identical to checked-in")
        self.assertEqual(gen_md, checked_md, "CLI-generated Markdown must be byte-identical to checked-in")

    def test_relative_cwd_output_byte_identical_to_absolute_output(self) -> None:
        """A relative --output-dir (resolved from CWD) must produce the same bytes
        as an absolute --output-dir, verifying CWD-relative anchoring works."""
        with tempfile.TemporaryDirectory() as cwd_tmp, tempfile.TemporaryDirectory() as abs_tmp:
            rel_subdir = "out"
            rel_out = pathlib.Path(cwd_tmp) / rel_subdir

            result_rel = subprocess.run(
                [sys.executable, str(self.repo_root / "scripts/verify_derived_package_provenance.py"),
                 "--repo-root", str(self.repo_root),
                 "--output-dir", rel_subdir],
                capture_output=True, text=True, cwd=cwd_tmp,
            )
            self.assertEqual(result_rel.returncode, 0, result_rel.stderr)

            result_abs = subprocess.run(
                [sys.executable, str(self.repo_root / "scripts/verify_derived_package_provenance.py"),
                 "--repo-root", str(self.repo_root),
                 "--output-dir", abs_tmp],
                capture_output=True, text=True,
            )
            self.assertEqual(result_abs.returncode, 0, result_abs.stderr)

            rel_json = (rel_out / "derived_package_provenance.json").read_bytes()
            abs_json = (pathlib.Path(abs_tmp) / "derived_package_provenance.json").read_bytes()
            rel_md = (rel_out / "derived_package_provenance.md").read_bytes()
            abs_md = (pathlib.Path(abs_tmp) / "derived_package_provenance.md").read_bytes()

        self.assertEqual(rel_json, abs_json, "relative-CWD JSON must be byte-identical to absolute-path JSON")
        self.assertEqual(rel_md, abs_md, "relative-CWD Markdown must be byte-identical to absolute-path Markdown")
        # Output must not land inside repo_root when a relative CWD outside it is used
        self.assertFalse((self.repo_root / rel_subdir).exists(), "output must not be written inside repo_root")

    def test_no_output_path_in_report_content(self) -> None:
        """The output directory path must not appear anywhere in the generated JSON or Markdown."""
        with tempfile.TemporaryDirectory() as tmpdir:
            out_dir = pathlib.Path(tmpdir)
            result = subprocess.run(
                [sys.executable, str(self.repo_root / "scripts/verify_derived_package_provenance.py"),
                 "--repo-root", str(self.repo_root),
                 "--output-dir", tmpdir],
                capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            gen_json = (out_dir / "derived_package_provenance.json").read_text(encoding="utf-8")
            gen_md = (out_dir / "derived_package_provenance.md").read_text(encoding="utf-8")

        self.assertNotIn(tmpdir, gen_json, "output dir path must not appear in generated JSON")
        self.assertNotIn(tmpdir, gen_md, "output dir path must not appear in generated Markdown")

    def test_no_timestamps_in_generated_outputs(self) -> None:
        md = build_markdown(self.report)
        js = json.dumps(self.report, ensure_ascii=False, indent=2, sort_keys=True)
        self.assertIsNone(re.search(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}", md))
        self.assertIsNone(re.search(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}", js))

    def test_deterministic_regeneration_and_byte_identical_checked_in_outputs(self) -> None:
        checked_json = (self.repo_root / "docs/audits/can-007/derived_package_provenance.json").read_bytes()
        checked_md = (self.repo_root / "docs/audits/can-007/derived_package_provenance.md").read_bytes()

        with tempfile.TemporaryDirectory() as tmpdir:
            out_dir = pathlib.Path(tmpdir)
            rc1 = main(["--repo-root", str(self.repo_root), "--output-dir", str(out_dir)])
            self.assertEqual(rc1, 0)
            first_json = (out_dir / "derived_package_provenance.json").read_bytes()
            first_md = (out_dir / "derived_package_provenance.md").read_bytes()

            rc2 = main(["--repo-root", str(self.repo_root), "--output-dir", str(out_dir)])
            self.assertEqual(rc2, 0)
            second_json = (out_dir / "derived_package_provenance.json").read_bytes()
            second_md = (out_dir / "derived_package_provenance.md").read_bytes()

        self.assertEqual(first_json, second_json)
        self.assertEqual(first_md, second_md)
        self.assertEqual(checked_json, first_json)
        self.assertEqual(checked_md, first_md)


if __name__ == "__main__":
    unittest.main(verbosity=2)
