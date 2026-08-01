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
GENERATOR = REPO_ROOT / "scripts" / "audit_zip_markdown.py"
ARCHIVE = REPO_ROOT / "04.zip"
OUTPUT_DIR = REPO_ROOT / "docs" / "audits" / "can-003"

EXPECTED_ARCHIVE_SHA256 = (
    "82a6015b8c968645307e36c8e4aa0351515f50333c08a6c5402a7819b7b747e5"
)

SPEC = importlib.util.spec_from_file_location(
    "audit_zip_markdown",
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


def synthetic_report(
    archive_files: dict[str, bytes],
    repository_files: dict[str, bytes],
) -> dict:
    temporary = tempfile.TemporaryDirectory()

    root = pathlib.Path(temporary.name)
    archive_path = root / "sample.zip"

    with zipfile.ZipFile(archive_path, "w") as archive:
        for path, content in archive_files.items():
            archive.writestr(path, content)

    for path, content in repository_files.items():
        destination = root / path
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(content)

    report = AUDIT.compare_markdown_corpus(
        archive_path=archive_path,
        repo_root=root,
    )

    temporary.cleanup()

    return report


class ZipMarkdownAuditTests(unittest.TestCase):
    def test_real_archive_inventory_is_complete(self) -> None:
        archive_hash_before = sha256(ARCHIVE)

        report = AUDIT.compare_markdown_corpus(
            archive_path=ARCHIVE,
            repo_root=REPO_ROOT,
        )

        self.assertEqual(
            EXPECTED_ARCHIVE_SHA256,
            archive_hash_before,
        )

        with zipfile.ZipFile(ARCHIVE, "r") as archive:
            markdown_infos = [
                info
                for info in archive.infolist()
                if not info.is_dir()
                and pathlib.PurePosixPath(
                    info.filename
                ).suffix.casefold() == ".md"
            ]

        self.assertEqual(
            len(markdown_infos),
            report["summary"]["archive_markdown_count"],
        )

        self.assertEqual(
            len(markdown_infos),
            report["summary"]["mapping_count"],
        )

        self.assertEqual(
            [info.filename for info in markdown_infos],
            [
                row["archive_path"]
                for row in report["archive_entries"]
            ],
        )

        self.assertEqual(
            archive_hash_before,
            sha256(ARCHIVE),
        )

    def test_exact_byte_match(self) -> None:
        report = synthetic_report(
            {"root/docs/readme.md": b"# Same\n"},
            {"docs/readme.md": b"# Same\n"},
        )

        self.assertEqual(
            "exact_byte_match",
            report["mappings"][0]["classification"],
        )

    def test_normalized_text_match(self) -> None:
        report = synthetic_report(
            {"root/docs/readme.md": b"# Same\r\n\r\n"},
            {"docs/readme.md": b"# Same\n"},
        )

        self.assertEqual(
            "normalized_text_match",
            report["mappings"][0]["classification"],
        )

    def test_unique_hash_path_variant(self) -> None:
        report = synthetic_report(
            {"root/archive-name.md": b"same"},
            {"recovered/local-name.md": b"same"},
        )

        self.assertEqual(
            "content_identical_path_variant",
            report["mappings"][0]["classification"],
        )

    def test_unique_normalized_path_variant(self) -> None:
        report = synthetic_report(
            {"root/archive-name.md": b"same\r\n"},
            {"recovered/local-name.md": b"same\n"},
        )

        self.assertEqual(
            "normalized_content_path_variant",
            report["mappings"][0]["classification"],
        )

    def test_divergent_counterpart(self) -> None:
        report = synthetic_report(
            {"root/docs/readme.md": b"archive"},
            {"docs/readme.md": b"repository"},
        )

        self.assertEqual(
            "divergent_counterpart",
            report["mappings"][0]["classification"],
        )

    def test_archive_only_document(self) -> None:
        report = synthetic_report(
            {"root/archive-only.md": b"missing"},
            {},
        )

        self.assertEqual(
            "archive_only_missing_counterpart",
            report["mappings"][0]["classification"],
        )

    def test_document_classification(self) -> None:
        self.assertEqual(
            "canonical_governance",
            AUDIT.classify_markdown(
                "docs/CANONICAL_AUTHORITY_POLICY.md"
            ),
        )

        self.assertEqual(
            "canonical_index_or_navigation",
            AUDIT.classify_markdown(
                "docs/README.md"
            ),
        )

        self.assertEqual(
            "operational_document",
            AUDIT.classify_markdown(
                "docs/DEPLOYMENT_RUNBOOK.md"
            ),
        )

        self.assertEqual(
            "canonical_chapter_or_masterplan",
            AUDIT.classify_markdown(
                "MasterPlan/chapter-01.md"
            ),
        )

    def test_outputs_are_deterministic(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = pathlib.Path(temporary)
            first = root / "first"
            second = root / "second"

            environment = {
                **os.environ,
                "PYTHONDONTWRITEBYTECODE": "1",
            }

            command = [
                sys.executable,
                str(GENERATOR),
                "--archive",
                str(ARCHIVE),
                "--repo-root",
                str(REPO_ROOT),
                "--allow-other-archive-hash",
            ]

            subprocess.run(
                command
                + ["--output-dir", str(first)],
                check=True,
                env=environment,
            )

            subprocess.run(
                command
                + ["--output-dir", str(second)],
                check=True,
                env=environment,
            )

            for filename in (
                "zip_markdown_inventory.json",
                "zip_markdown_inventory.md",
                "README.md",
            ):
                self.assertEqual(
                    (first / filename).read_bytes(),
                    (second / filename).read_bytes(),
                )

    def test_checked_in_outputs_match_regeneration(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            generated = pathlib.Path(temporary) / "generated"

            subprocess.run(
                [
                    sys.executable,
                    str(GENERATOR),
                    "--archive",
                    str(ARCHIVE),
                    "--repo-root",
                    str(REPO_ROOT),
                    "--output-dir",
                    str(generated),
                ],
                check=True,
                env={
                    **os.environ,
                    "PYTHONDONTWRITEBYTECODE": "1",
                },
            )

            for filename in (
                "zip_markdown_inventory.json",
                "zip_markdown_inventory.md",
                "README.md",
            ):
                self.assertEqual(
                    (OUTPUT_DIR / filename).read_bytes(),
                    (generated / filename).read_bytes(),
                )


if __name__ == "__main__":
    unittest.main(verbosity=2)
