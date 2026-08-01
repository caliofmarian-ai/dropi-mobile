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
import zipfile

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
GENERATOR = (
    REPO_ROOT
    / "scripts"
    / "audit_canonical_filename_encoding.py"
)
ARCHIVE = REPO_ROOT / "04.zip"
OUTPUT_DIR = REPO_ROOT / "docs" / "audits" / "can-005"

EXPECTED_ARCHIVE_SHA256 = (
    "82a6015b8c968645307e36c8e4aa0351515f50333c08a6c5402a7819b7b747e5"
)

REPORT_JSON = OUTPUT_DIR / "filename_encoding_report.json"

SPEC = importlib.util.spec_from_file_location(
    "audit_canonical_filename_encoding",
    GENERATOR,
)

if SPEC is None or SPEC.loader is None:
    raise RuntimeError("Unable to import generator")

AUDIT = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = AUDIT
SPEC.loader.exec_module(AUDIT)


def sha256(path: pathlib.Path) -> str:
    digest = hashlib.sha256()

    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()


def run_generator(output_dir: pathlib.Path) -> None:
    subprocess.run(
        [
            sys.executable,
            str(GENERATOR),
            "--archive",
            str(ARCHIVE),
            "--repo-root",
            str(REPO_ROOT),
            "--output-dir",
            str(output_dir),
        ],
        check=True,
        env={
            **os.environ,
            "PYTHONDONTWRITEBYTECODE": "1",
        },
    )


class CanonicalFilenameEncodingTests(unittest.TestCase):
    def load_checked_in_report(self) -> dict:
        return json.loads(
            REPORT_JSON.read_text(encoding="utf-8")
        )

    def test_schema_version_is_correct(self) -> None:
        report = self.load_checked_in_report()

        self.assertEqual(1, report["schema_version"])

    def test_archive_sha256_is_expected(self) -> None:
        report = self.load_checked_in_report()

        self.assertEqual(
            EXPECTED_ARCHIVE_SHA256,
            report["authority"]["archive_sha256"],
        )

    def test_all_entries_have_required_fields(self) -> None:
        report = self.load_checked_in_report()

        required = {
            "archive_index",
            "archive_path",
            "crc32",
            "encoding_anomalies",
            "filename",
            "has_anomaly",
            "nfc_path",
            "path_changed_by_nfc",
            "unicode_form",
        }

        for entry in (
            report["anomaly_entries"] + report["clean_entries"]
        ):
            missing = required - set(entry)
            self.assertFalse(
                missing,
                f"Entry missing fields {missing}: "
                f"{entry.get('archive_path')}",
            )

    def test_summary_counts_are_consistent(self) -> None:
        report = self.load_checked_in_report()
        summary = report["summary"]

        self.assertEqual(
            summary["total_file_count"],
            summary["anomaly_file_count"]
            + summary["clean_file_count"],
        )

        self.assertEqual(
            summary["anomaly_file_count"],
            len(report["anomaly_entries"]),
        )

        self.assertEqual(
            summary["clean_file_count"],
            len(report["clean_entries"]),
        )

        self.assertEqual(
            summary["anomaly_file_count"],
            len(report["anomaly_paths"]),
        )

    def test_anomaly_paths_list_is_sorted(self) -> None:
        report = self.load_checked_in_report()

        paths = report["anomaly_paths"]

        self.assertEqual(paths, sorted(paths))

    def test_entry_lists_are_sorted_by_archive_path(
        self,
    ) -> None:
        report = self.load_checked_in_report()

        for key in ("anomaly_entries", "clean_entries"):
            paths = [
                entry["archive_path"]
                for entry in report[key]
            ]

            self.assertEqual(
                paths,
                sorted(paths),
                f"{key} is not sorted",
            )

    def test_encoding_anomaly_detection(self) -> None:
        mojibake_path = "folder/FileName\ufffd.txt"
        anomalies = AUDIT.encoding_anomalies(mojibake_path)

        self.assertIn("possible-mojibake", anomalies)
        self.assertEqual(anomalies, sorted(anomalies))

        clean_path = "folder/filename.txt"
        self.assertEqual(
            [],
            AUDIT.encoding_anomalies(clean_path),
        )

    def test_unicode_form_detection(self) -> None:
        ascii_text = "simple/ascii.txt"
        self.assertEqual(
            "NFC+NFD",
            AUDIT.unicode_form(ascii_text),
        )

        import unicodedata

        nfd_only = unicodedata.normalize("NFD", "café/doc.txt")
        nfc_only = unicodedata.normalize("NFC", "café/doc.txt")

        if nfd_only != nfc_only:
            self.assertEqual("NFD", AUDIT.unicode_form(nfd_only))
            self.assertEqual("NFC", AUDIT.unicode_form(nfc_only))

    def test_generation_does_not_modify_archive(self) -> None:
        archive_hash_before = sha256(ARCHIVE)

        with tempfile.TemporaryDirectory() as temporary:
            run_generator(
                pathlib.Path(temporary) / "generated"
            )

        archive_hash_after = sha256(ARCHIVE)

        self.assertEqual(archive_hash_before, archive_hash_after)

    def test_outputs_are_deterministic(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = pathlib.Path(temporary)
            first = root / "first"
            second = root / "second"

            run_generator(first)
            run_generator(second)

            for filename in (
                "filename_encoding_report.json",
                "filename_encoding_report.md",
                "README.md",
            ):
                self.assertEqual(
                    (first / filename).read_bytes(),
                    (second / filename).read_bytes(),
                )

    def test_checked_in_outputs_match_regeneration(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            generated = (
                pathlib.Path(temporary) / "generated"
            )

            run_generator(generated)

            for filename in (
                "filename_encoding_report.json",
                "filename_encoding_report.md",
                "README.md",
            ):
                self.assertEqual(
                    (OUTPUT_DIR / filename).read_bytes(),
                    (generated / filename).read_bytes(),
                )


if __name__ == "__main__":
    unittest.main(verbosity=2)
