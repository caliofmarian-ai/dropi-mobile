from __future__ import annotations

import hashlib
import importlib.util
import json
import pathlib
import re
import subprocess
import sys
import tempfile
import unittest
import warnings
import zipfile

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
GENERATOR = REPO_ROOT / "scripts" / "audit_04_zip.py"
ARCHIVE = REPO_ROOT / "04.zip"
OUTPUT_DIR = REPO_ROOT / "docs" / "audits" / "can-001"

EXPECTED_SHA256 = (
    "82a6015b8c968645307e36c8e4aa0351515f50333c08a6c5402a7819b7b747e5"
)

SPEC = importlib.util.spec_from_file_location(
    "audit_04_zip",
    GENERATOR,
)

if SPEC is None or SPEC.loader is None:
    raise RuntimeError(
        "Unable to import audit_04_zip.py"
    )

AUDIT = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = AUDIT
SPEC.loader.exec_module(AUDIT)


def sha256(path: pathlib.Path) -> str:
    digest = hashlib.sha256()

    with path.open("rb") as stream:
        for chunk in iter(
            lambda: stream.read(1024 * 1024),
            b"",
        ):
            digest.update(chunk)

    return digest.hexdigest()


def run_generator(
    archive: pathlib.Path,
    repo_root: pathlib.Path,
    output_dir: pathlib.Path,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
            sys.executable,
            str(GENERATOR),
            "--archive",
            str(archive),
            "--repo-root",
            str(repo_root),
            "--output-dir",
            str(output_dir),
            "--allow-other-archive-hash",
        ],
        check=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


class AuthoritativeArchiveTests(unittest.TestCase):
    def test_archive_byte_identity(self) -> None:
        before = sha256(ARCHIVE)

        self.assertEqual(
            EXPECTED_SHA256,
            before,
        )

        with tempfile.TemporaryDirectory() as temp:
            run_generator(
                ARCHIVE,
                REPO_ROOT,
                pathlib.Path(temp) / "output",
            )

        after = sha256(ARCHIVE)

        self.assertEqual(
            before,
            after,
        )

    def test_inventory_count_and_exact_paths(self) -> None:
        inventory = json.loads(
            (
                OUTPUT_DIR / "04_zip_inventory.json"
            ).read_text(encoding="utf-8")
        )

        with zipfile.ZipFile(
            ARCHIVE,
            "r",
        ) as archive:
            infos = archive.infolist()

        self.assertEqual(
            len(infos),
            inventory["archive"]["entry_count"],
        )

        self.assertEqual(
            len(infos),
            len(inventory["entries"]),
        )

        self.assertEqual(
            list(range(len(infos))),
            [
                entry["index"]
                for entry in inventory["entries"]
            ],
        )

        self.assertEqual(
            [
                info.filename
                for info in infos
            ],
            [
                entry["path"]
                for entry in inventory["entries"]
            ],
        )

    def test_per_entry_hash_reproducibility(self) -> None:
        inventory = json.loads(
            (
                OUTPUT_DIR / "04_zip_inventory.json"
            ).read_text(encoding="utf-8")
        )

        with zipfile.ZipFile(
            ARCHIVE,
            "r",
        ) as archive:
            infos = archive.infolist()

            for entry in inventory["entries"]:
                info = infos[entry["index"]]

                if (
                    info.is_dir()
                    or not entry["readable"]
                ):
                    continue

                with archive.open(
                    info,
                    "r",
                ) as stream:
                    digest = hashlib.sha256(
                        stream.read()
                    ).hexdigest()

                self.assertEqual(
                    digest,
                    entry["sha256"],
                )

    def test_deterministic_outputs_and_no_timestamps(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = pathlib.Path(temp)
            first = root / "first"
            second = root / "second"

            run_generator(
                ARCHIVE,
                REPO_ROOT,
                first,
            )

            run_generator(
                ARCHIVE,
                REPO_ROOT,
                second,
            )

            for filename in (
                "04_zip_inventory.json",
                "04_zip_inventory.md",
                "README.md",
            ):
                self.assertEqual(
                    (
                        first / filename
                    ).read_bytes(),
                    (
                        second / filename
                    ).read_bytes(),
                )

            combined = (
                (
                    first / "04_zip_inventory.json"
                ).read_text(encoding="utf-8")
                + (
                    first / "04_zip_inventory.md"
                ).read_text(encoding="utf-8")
                + (
                    first / "README.md"
                ).read_text(encoding="utf-8")
            )

            forbidden_patterns = (
                r'"generated_at"\s*:',
                r'"timestamp"\s*:',
                r'"created_at"\s*:',
                r'"updated_at"\s*:',
                (
                    r"\b20\d{2}-\d{2}-\d{2}"
                    r"T\d{2}:\d{2}"
                ),
            )

            for pattern in forbidden_patterns:
                self.assertIsNone(
                    re.search(
                        pattern,
                        combined,
                        re.IGNORECASE,
                    )
                )

    def test_duplicate_detection(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = pathlib.Path(temp)
            archive_path = root / "duplicates.zip"
            output_dir = root / "output"

            with warnings.catch_warnings():
                warnings.simplefilter("ignore")

                with zipfile.ZipFile(
                    archive_path,
                    "w",
                    compression=zipfile.ZIP_STORED,
                ) as archive:
                    archive.writestr(
                        "same.txt",
                        b"identical",
                    )
                    archive.writestr(
                        "same.txt",
                        b"identical",
                    )
                    archive.writestr(
                        "different-name.txt",
                        b"identical",
                    )

            run_generator(
                archive_path,
                root,
                output_dir,
            )

            inventory = json.loads(
                (
                    output_dir
                    / "04_zip_inventory.json"
                ).read_text(encoding="utf-8")
            )

            self.assertEqual(
                3,
                len(inventory["entries"]),
            )

            self.assertIn(
                "same.txt",
                inventory["duplicate_paths"],
            )

            self.assertTrue(
                inventory["entries"][0][
                    "duplicate_path"
                ]
            )

            self.assertTrue(
                inventory["entries"][1][
                    "duplicate_path"
                ]
            )

            self.assertFalse(
                inventory["entries"][2][
                    "duplicate_path"
                ]
            )

            self.assertTrue(
                all(
                    entry["duplicate_content"]
                    for entry
                    in inventory["entries"]
                )
            )

    def test_encoding_anomaly_without_renaming(
        self,
    ) -> None:
        anomalous_name = (
            "MasterPlan/PoliticÄƒ_Ã®nregistrare.md"
        )

        with tempfile.TemporaryDirectory() as temp:
            root = pathlib.Path(temp)
            archive_path = root / "encoding.zip"
            output_dir = root / "output"

            with zipfile.ZipFile(
                archive_path,
                "w",
            ) as archive:
                archive.writestr(
                    anomalous_name,
                    b"content",
                )

            run_generator(
                archive_path,
                root,
                output_dir,
            )

            inventory = json.loads(
                (
                    output_dir
                    / "04_zip_inventory.json"
                ).read_text(encoding="utf-8")
            )

            entry = inventory["entries"][0]

            self.assertEqual(
                anomalous_name,
                entry["path"],
            )

            self.assertTrue(
                entry["encoding_anomalies"]
            )

    def test_unreadable_entry_is_not_skipped(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = pathlib.Path(temp)
            archive_path = root / "corrupt.zip"

            with zipfile.ZipFile(
                archive_path,
                "w",
                compression=zipfile.ZIP_STORED,
            ) as archive:
                archive.writestr(
                    "corrupt.txt",
                    b"original-content",
                )

            raw = bytearray(
                archive_path.read_bytes()
            )

            offset = raw.find(
                b"original-content"
            )

            self.assertGreaterEqual(
                offset,
                0,
            )

            raw[offset] ^= 0x01
            archive_path.write_bytes(raw)

            inventory = AUDIT.inventory_archive(
                archive_path=archive_path,
                repo_root=root,
                output_dir=root / "output",
            )

            self.assertEqual(
                1,
                len(inventory["entries"]),
            )

            self.assertFalse(
                inventory["entries"][0][
                    "readable"
                ]
            )

            self.assertIsNotNone(
                inventory["entries"][0][
                    "read_error"
                ]
            )

            self.assertEqual(
                [0],
                inventory[
                    "unreadable_entry_indexes"
                ],
            )

    def test_repository_counterpart_detection(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = pathlib.Path(temp)
            archive_path = root / "counterpart.zip"
            output_dir = root / "output"

            counterpart = (
                root
                / "canonical"
                / "docs"
                / "00_MasterPlan"
                / "folder"
                / "document.md"
            )

            counterpart.parent.mkdir(
                parents=True
            )

            counterpart.write_text(
                "repository content",
                encoding="utf-8",
            )

            with zipfile.ZipFile(
                archive_path,
                "w",
            ) as archive:
                archive.writestr(
                    "folder/document.md",
                    b"archive content",
                )

            run_generator(
                archive_path,
                root,
                output_dir,
            )

            inventory = json.loads(
                (
                    output_dir
                    / "04_zip_inventory.json"
                ).read_text(encoding="utf-8")
            )

            self.assertEqual(
                (
                    "canonical/docs/00_MasterPlan/"
                    "folder/document.md"
                ),
                inventory["entries"][0][
                    "repository_counterpart"
                ],
            )

    def test_checked_in_reports_match_regeneration(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temp:
            generated = (
                pathlib.Path(temp)
                / "generated"
            )

            run_generator(
                ARCHIVE,
                REPO_ROOT,
                generated,
            )

            for filename in (
                "04_zip_inventory.json",
                "04_zip_inventory.md",
                "README.md",
            ):
                self.assertEqual(
                    (
                        OUTPUT_DIR / filename
                    ).read_bytes(),
                    (
                        generated / filename
                    ).read_bytes(),
                )


if __name__ == "__main__":
    unittest.main(verbosity=2)
