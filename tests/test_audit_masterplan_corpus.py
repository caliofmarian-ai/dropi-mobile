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
GENERATOR = REPO_ROOT / "scripts" / "audit_masterplan_corpus.py"
ARCHIVE = REPO_ROOT / "04.zip"
LOCAL_ROOT = REPO_ROOT / "canonical" / "docs" / "00_MasterPlan"
OUTPUT_DIR = REPO_ROOT / "docs" / "audits" / "can-002"

ARCHIVE_PREFIX = (
    "04/DROPI_CANONICAL/01_CANONICAL_DOCS/00_MasterPlan/"
)

EXPECTED_SHA256 = (
    "82a6015b8c968645307e36c8e4aa0351515f50333c08a6c5402a7819b7b747e5"
)

SPEC = importlib.util.spec_from_file_location(
    "audit_masterplan_corpus",
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
            "--archive-prefix",
            ARCHIVE_PREFIX,
            "--local-root",
            str(LOCAL_ROOT),
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


class MasterPlanCorpusTests(unittest.TestCase):
    def synthetic_report(
        self,
        archive_files: dict[str, bytes],
        local_files: dict[str, bytes],
    ) -> dict:
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)

        root = pathlib.Path(temporary.name)
        archive_path = root / "sample.zip"
        local_root = root / "canonical" / "docs" / "00_MasterPlan"
        local_root.mkdir(parents=True)

        prefix = "root/master/"

        with zipfile.ZipFile(archive_path, "w") as archive:
            for path, content in archive_files.items():
                archive.writestr(prefix + path, content)

        for path, content in local_files.items():
            destination = local_root / path
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(content)

        return AUDIT.compare_corpus(
            archive_path=archive_path,
            archive_prefix=prefix,
            local_root=local_root,
            repo_root=root,
        )

    def test_real_corpus_is_fully_mapped(self) -> None:
        archive_hash_before = sha256(ARCHIVE)

        report = AUDIT.compare_corpus(
            archive_path=ARCHIVE,
            archive_prefix=ARCHIVE_PREFIX,
            local_root=LOCAL_ROOT,
            repo_root=REPO_ROOT,
        )

        summary = report["summary"]

        self.assertEqual(EXPECTED_SHA256, archive_hash_before)
        self.assertEqual(147, summary["archive_docx_count"])
        self.assertEqual(147, summary["local_docx_count"])
        self.assertEqual(147, summary["mapped_archive_count"])
        self.assertEqual(147, summary["mapped_local_count"])
        self.assertEqual(147, summary["mapping_count"])
        self.assertEqual(
            9,
            summary["exact_path_and_content_match_count"],
        )
        self.assertEqual(
            138,
            summary[
                "content_identical_path_encoding_variant_count"
            ],
        )
        self.assertEqual(
            0,
            summary["same_path_divergent_content_count"],
        )
        self.assertEqual(
            0,
            summary["missing_archive_source_count"],
        )
        self.assertEqual(
            0,
            summary["additional_local_file_count"],
        )
        self.assertEqual(
            0,
            summary["ambiguous_hash_group_count"],
        )
        self.assertEqual(archive_hash_before, sha256(ARCHIVE))

    def test_exact_path_and_content_mapping(self) -> None:
        report = self.synthetic_report(
            {"same.docx": b"same"},
            {"same.docx": b"same"},
        )

        self.assertEqual(
            "exact_path_and_content_match",
            report["mappings"][0]["classification"],
        )

    def test_unique_hash_maps_encoding_variant(self) -> None:
        report = self.synthetic_report(
            {"archive-name.docx": b"same"},
            {"local-name.docx": b"same"},
        )

        self.assertEqual(
            1,
            report["summary"][
                "content_identical_path_encoding_variant_count"
            ],
        )
        self.assertEqual(
            "unique_sha256",
            report["mappings"][0]["mapping_basis"],
        )
        self.assertEqual(
            0,
            report["summary"]["missing_archive_source_count"],
        )
        self.assertEqual(
            0,
            report["summary"]["additional_local_file_count"],
        )

    def test_same_path_divergent_content(self) -> None:
        report = self.synthetic_report(
            {"same.docx": b"archive"},
            {"same.docx": b"local"},
        )

        self.assertEqual(
            1,
            report["summary"]["same_path_divergent_content_count"],
        )

    def test_genuine_missing_and_additional(self) -> None:
        report = self.synthetic_report(
            {"missing.docx": b"archive-only"},
            {"additional.docx": b"local-only"},
        )

        self.assertEqual(
            1,
            report["summary"]["missing_archive_source_count"],
        )
        self.assertEqual(
            1,
            report["summary"]["additional_local_file_count"],
        )

    def test_ambiguous_duplicate_hash_is_not_guessed(self) -> None:
        report = self.synthetic_report(
            {
                "archive-a.docx": b"same",
                "archive-b.docx": b"same",
            },
            {
                "local-a.docx": b"same",
                "local-b.docx": b"same",
            },
        )

        self.assertEqual(
            1,
            report["summary"]["ambiguous_hash_group_count"],
        )
        self.assertEqual(
            2,
            report["summary"]["missing_archive_source_count"],
        )
        self.assertEqual(
            2,
            report["summary"]["additional_local_file_count"],
        )

    def test_outputs_are_deterministic(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = pathlib.Path(temporary)
            first = root / "first"
            second = root / "second"

            run_generator(first)
            run_generator(second)

            for filename in (
                "masterplan_comparison.json",
                "masterplan_comparison.md",
                "README.md",
            ):
                self.assertEqual(
                    (first / filename).read_bytes(),
                    (second / filename).read_bytes(),
                )

    def test_checked_in_outputs_match_regeneration(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            output = pathlib.Path(temporary) / "output"
            run_generator(output)

            for filename in (
                "masterplan_comparison.json",
                "masterplan_comparison.md",
                "README.md",
            ):
                self.assertEqual(
                    (OUTPUT_DIR / filename).read_bytes(),
                    (output / filename).read_bytes(),
                )


if __name__ == "__main__":
    unittest.main(verbosity=2)
