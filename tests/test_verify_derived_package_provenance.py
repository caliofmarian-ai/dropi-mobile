from __future__ import annotations

import pathlib
import unittest

from scripts.verify_derived_package_provenance import build_report


class TestVerifyDerivedPackageProvenance(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.repo_root = pathlib.Path(__file__).resolve().parents[1]
        cls.report = build_report(repo_root=cls.repo_root, package_root_name="DROPi_Canonical_Reference")

    def test_summary_counts_match_final_reviewed_values(self) -> None:
        self.assertEqual(
            self.report["summary"],
            {
                "package_files": 217,
                "provenance_records": 217,
                "supported": 210,
                "unsupported": 7,
                "missing_sources": 0,
                "ambiguous_sources": 0,
                "package_control": 4,
            },
        )

    def test_every_package_file_has_one_record(self) -> None:
        package_paths = [r["package_path"] for r in self.report["records"]]
        self.assertEqual(len(package_paths), 217)
        self.assertEqual(len(set(package_paths)), 217)

    def test_unsupported_files_are_expected(self) -> None:
        unsupported = [r["package_path"] for r in self.report["records"] if not r["supported"]]
        self.assertEqual(
            sorted(unsupported),
            sorted(
                [
                    "AI_CANONICAL_REFERENCE_AUDIT_REPORT.md",
                    "CANONICAL_KNOWLEDGE_INDEX.md",
                    "CANONICAL_MANIFEST.md",
                    "README_FOR_DROPi_TYCOON.md",
                    "09_Reference/Package_Metadata/inventory.json",
                    "00_Project/Status_Reports/AUDIT_TRACKING.md",
                    "00_Project/Status_Reports/SESSION_STATE.md",
                ]
            ),
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
