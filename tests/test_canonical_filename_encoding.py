from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import unicodedata
import unittest

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

REPORT_JSON = OUTPUT_DIR / "canonical_filename_encoding_inventory.json"

# SHA-256 of each immutable CAN-001–CAN-004 input file; must not change.
EXPECTED_INPUT_HASHES: dict[str, str] = {
    "docs/audits/can-001/04_zip_inventory.json": (
        "7e3668793b3005f373e38c8e45d60e032a4e828deeb5665851a9281f4af7f74c"
    ),
    "docs/audits/can-002/masterplan_comparison.json": (
        "440a4b5d0a64460fcc756519ec60c7e46a1a6e35820de3ff7ddaca49496fc3a9"
    ),
    "docs/audits/can-003/zip_markdown_inventory.json": (
        "b77db92e1c36af480deff8b8ccae92e001d3b610a7196e668700360cfdda41ad"
    ),
    "docs/audits/can-004/canonical_authority_matrix.json": (
        "6c4ad00295bfdc8689a39efe2c9bd955987f6519cb61f5d62f4abcb3407a3a14"
    ),
}

SPEC = importlib.util.spec_from_file_location(
    "audit_canonical_filename_encoding",
    GENERATOR,
)

if SPEC is None or SPEC.loader is None:
    raise RuntimeError("Unable to import generator")

AUDIT = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = AUDIT
SPEC.loader.exec_module(AUDIT)


def sha256_file(path: pathlib.Path) -> str:
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

    # ------------------------------------------------------------------
    # 1. Archive entry count and hash
    # ------------------------------------------------------------------

    def test_archive_entry_count_and_hash(self) -> None:
        report = self.load_checked_in_report()
        authority = report["authority"]

        self.assertEqual(
            299,
            authority["archive_entry_count"],
            "Expected exactly 299 archive entries (dirs + files)",
        )
        self.assertEqual(
            EXPECTED_ARCHIVE_SHA256,
            authority["archive_sha256"],
            "Archive SHA-256 does not match",
        )

    # ------------------------------------------------------------------
    # 2. Historical preservation — nothing was modified
    # ------------------------------------------------------------------

    def test_historical_preservation(self) -> None:
        report = self.load_checked_in_report()

        for record in report["inventory"]:
            path = record.get("original_archive_name", "?")
            self.assertIs(
                False,
                record["historical_bytes_modified"],
                f"historical_bytes_modified must be False: {path}",
            )
            self.assertIs(
                False,
                record["historical_name_modified"],
                f"historical_name_modified must be False: {path}",
            )

        self.assertEqual(
            EXPECTED_ARCHIVE_SHA256,
            sha256_file(ARCHIVE),
            "Archive file was modified",
        )

    # ------------------------------------------------------------------
    # 3. Complete mapping fields in every record
    # ------------------------------------------------------------------

    def test_required_fields_in_every_record(self) -> None:
        report = self.load_checked_in_report()
        required = {
            "scope",
            "original_archive_name",
            "extracted_repository_name",
            "mapping_relation",
            "detected_encoding_anomalies",
            "readable_proposed_display_name",
            "affected_references",
            "risk_assessment",
            "historical_bytes_modified",
            "historical_name_modified",
        }

        for record in report["inventory"]:
            missing = required - set(record)
            self.assertFalse(
                missing,
                f"Record missing fields {missing}: "
                f"{record.get('original_archive_name')}",
            )

    # ------------------------------------------------------------------
    # 4. Structured risk assessment
    # ------------------------------------------------------------------

    def test_risk_assessment_structure(self) -> None:
        report = self.load_checked_in_report()
        valid_levels = {"high", "medium", "low", "none"}

        for record in report["inventory"]:
            risk = record["risk_assessment"]
            path = record.get("original_archive_name", "?")

            self.assertIn(
                risk["level"],
                valid_levels,
                f"Invalid risk level for {path}",
            )
            self.assertIsInstance(
                risk["has_mojibake_in_archive_name"],
                bool,
                f"has_mojibake_in_archive_name not bool for {path}",
            )
            self.assertIsInstance(
                risk["archive_and_extracted_names_differ"],
                bool,
                f"archive_and_extracted_names_differ not bool for {path}",
            )
            self.assertIsInstance(
                risk["affected_reference_count"],
                int,
                f"affected_reference_count not int for {path}",
            )

    # ------------------------------------------------------------------
    # 5. Mojibake detection function — unit test
    # ------------------------------------------------------------------

    def test_mojibake_detection_function(self) -> None:
        mojibake_path = "folder/FileName\ufffd.txt"
        anomalies = AUDIT.encoding_anomalies(mojibake_path)

        self.assertIn("possible-mojibake", anomalies)
        self.assertEqual(anomalies, sorted(anomalies))

        clean_path = "folder/filename.txt"
        self.assertEqual([], AUDIT.encoding_anomalies(clean_path))

    # ------------------------------------------------------------------
    # 6. Unicode NFC detection function — unit test
    # ------------------------------------------------------------------

    def test_unicode_nfc_detection_function(self) -> None:
        ascii_text = "simple/ascii.txt"
        self.assertEqual("NFC+NFD", AUDIT.unicode_form(ascii_text))

        nfd_only = unicodedata.normalize("NFD", "café/doc.txt")
        nfc_only = unicodedata.normalize("NFC", "café/doc.txt")

        if nfd_only != nfc_only:
            self.assertEqual("NFD", AUDIT.unicode_form(nfd_only))
            self.assertEqual("NFC", AUDIT.unicode_form(nfc_only))

    # ------------------------------------------------------------------
    # 7. Display proposal is metadata only — no files mutated
    # ------------------------------------------------------------------

    def test_display_proposal_is_metadata_only(self) -> None:
        report = self.load_checked_in_report()

        for record in report["inventory"]:
            self.assertIn(
                "readable_proposed_display_name",
                record,
                f"Missing display name for "
                f"{record.get('original_archive_name')}",
            )

        # Archive must not have been modified
        self.assertEqual(
            EXPECTED_ARCHIVE_SHA256,
            sha256_file(ARCHIVE),
            "Archive was modified during generation",
        )

    # ------------------------------------------------------------------
    # 8. Collision groups structure
    # ------------------------------------------------------------------

    def test_collision_groups_structure(self) -> None:
        report = self.load_checked_in_report()
        groups = report["nfc_collision_groups"]

        self.assertIsInstance(groups, list)

        for group in groups:
            self.assertIn(
                "collision_key",
                group,
                "Collision group missing collision_key",
            )
            self.assertIn(
                "proposed_names",
                group,
                "Collision group missing proposed_names",
            )
            self.assertIsInstance(group["proposed_names"], list)

    # ------------------------------------------------------------------
    # 9. Immutable CAN-001–CAN-004 inputs
    # ------------------------------------------------------------------

    def test_input_audits_not_modified(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            run_generator(pathlib.Path(temporary) / "generated")

        for rel_path, expected_hash in EXPECTED_INPUT_HASHES.items():
            actual = sha256_file(REPO_ROOT / rel_path)
            self.assertEqual(
                expected_hash,
                actual,
                f"Input audit modified: {rel_path}",
            )

    # ------------------------------------------------------------------
    # 10. Outputs are deterministic
    # ------------------------------------------------------------------

    def test_outputs_are_deterministic(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = pathlib.Path(temporary)
            first = root / "first"
            second = root / "second"

            run_generator(first)
            run_generator(second)

            for filename in (
                "canonical_filename_encoding_inventory.json",
                "canonical_filename_encoding_inventory.md",
                "README.md",
            ):
                self.assertEqual(
                    (first / filename).read_bytes(),
                    (second / filename).read_bytes(),
                    f"{filename} differs between runs",
                )

    # ------------------------------------------------------------------
    # 11. Checked-in outputs byte-identical to fresh regeneration
    # ------------------------------------------------------------------

    def test_checked_in_outputs_match_regeneration(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            generated = pathlib.Path(temporary) / "generated"

            run_generator(generated)

            for filename in (
                "canonical_filename_encoding_inventory.json",
                "canonical_filename_encoding_inventory.md",
                "README.md",
            ):
                self.assertEqual(
                    (OUTPUT_DIR / filename).read_bytes(),
                    (generated / filename).read_bytes(),
                    f"Checked-in {filename} differs from regeneration",
                )


if __name__ == "__main__":
    unittest.main(verbosity=2)
