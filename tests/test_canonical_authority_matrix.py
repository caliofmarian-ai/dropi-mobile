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
GENERATOR = (
    REPO_ROOT
    / "scripts"
    / "build_canonical_authority_matrix.py"
)
OUTPUT_DIR = (
    REPO_ROOT
    / "docs"
    / "audits"
    / "can-004"
)

MATRIX_JSON = OUTPUT_DIR / "canonical_authority_matrix.json"

CAN001 = (
    REPO_ROOT
    / "docs"
    / "audits"
    / "can-001"
    / "04_zip_inventory.json"
)

CAN002 = (
    REPO_ROOT
    / "docs"
    / "audits"
    / "can-002"
    / "masterplan_comparison.json"
)

CAN003 = (
    REPO_ROOT
    / "docs"
    / "audits"
    / "can-003"
    / "zip_markdown_inventory.json"
)

REQUIRED_DOMAIN_IDS = {
    "vision-and-strategy",
    "system-architecture",
    "governance",
    "roles-and-channels",
    "marketplace",
    "logistics",
    "droneports",
    "delivery-modes",
    "economy",
    "ai-agents",
    "mobile",
    "backend",
    "database",
    "security",
    "deployment-and-operations",
}

REQUIRED_DOMAIN_FIELDS = {
    "domain_id",
    "domain",
    "primary_historical_source",
    "extracted_working_copy",
    "later_approved_active_canon",
    "derived_references",
    "operational_documents",
    "conflicting_or_superseded_documents",
    "canonical_owner",
    "approval_authority",
    "implementation_relevance",
    "current_repository_paths",
    "authority_chain",
    "unresolved_authority",
}

SPEC = importlib.util.spec_from_file_location(
    "canonical_authority_matrix",
    GENERATOR,
)

if SPEC is None or SPEC.loader is None:
    raise RuntimeError("Unable to import CAN-004 generator")

MATRIX = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MATRIX
SPEC.loader.exec_module(MATRIX)


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
            "--repo-root",
            str(REPO_ROOT),
            "--output-dir",
            str(output_dir),
            "--can-001",
            str(CAN001),
            "--can-002",
            str(CAN002),
            "--can-003",
            str(CAN003),
        ],
        check=True,
        env={
            **os.environ,
            "PYTHONDONTWRITEBYTECODE": "1",
        },
    )


class CanonicalAuthorityMatrixTests(unittest.TestCase):
    def load_checked_in_matrix(self) -> dict:
        return json.loads(
            MATRIX_JSON.read_text(encoding="utf-8")
        )

    def test_required_domains_exist_exactly_once(self) -> None:
        matrix = self.load_checked_in_matrix()

        domain_ids = [
            row["domain_id"]
            for row in matrix["domains"]
        ]

        self.assertEqual(
            len(domain_ids),
            len(set(domain_ids)),
        )

        self.assertEqual(
            REQUIRED_DOMAIN_IDS,
            set(domain_ids),
        )

        self.assertEqual(
            15,
            matrix["summary"]["domain_count"],
        )

    def test_every_domain_has_required_fields(self) -> None:
        matrix = self.load_checked_in_matrix()

        for row in matrix["domains"]:
            self.assertFalse(
                REQUIRED_DOMAIN_FIELDS.difference(row),
                row["domain_id"],
            )

            self.assertEqual(
                5,
                len(row["authority_chain"]),
            )

            self.assertEqual(
                [1, 2, 3, 4, 5],
                [
                    item["rank"]
                    for item in row["authority_chain"]
                ],
            )

    def test_derived_documents_are_subordinate(self) -> None:
        matrix = self.load_checked_in_matrix()

        order = matrix["authority_order"]

        self.assertEqual(
            [1, 2, 3, 4, 5],
            [row["rank"] for row in order],
        )

        derived = next(
            row
            for row in order
            if row["source_class"] == "derived_reference"
        )

        historical = next(
            row
            for row in order
            if row["source_class"]
            == "historical_authoritative_archive"
        )

        self.assertGreater(
            derived["rank"],
            historical["rank"],
        )

        self.assertIn(
            "cannot independently override",
            derived["meaning"],
        )

    def test_unresolved_authority_is_visible(self) -> None:
        matrix = self.load_checked_in_matrix()

        self.assertGreater(
            matrix["summary"][
                "domains_with_unresolved_authority"
            ],
            0,
        )

        for row in matrix["domains"]:
            self.assertEqual(
                "unresolved",
                row["canonical_owner"]["status"],
            )

            self.assertEqual(
                "unresolved",
                row["approval_authority"]["status"],
            )

    def test_conflicts_are_structured(self) -> None:
        matrix = self.load_checked_in_matrix()

        for row in matrix["domains"]:
            for conflict in row[
                "conflicting_or_superseded_documents"
            ]:
                self.assertIn("type", conflict)
                self.assertIn("paths", conflict)
                self.assertIn("resolution", conflict)
                self.assertIsInstance(
                    conflict["paths"],
                    list,
                )

    def test_primary_sources_come_from_04_zip(self) -> None:
        matrix = self.load_checked_in_matrix()

        for row in matrix["domains"]:
            primary = row["primary_historical_source"]

            if primary is None:
                continue

            self.assertTrue(
                primary["path"].startswith("04/"),
                primary["path"],
            )

            self.assertIn(
                primary["source_class"],
                {
                    "historical_authoritative_docx",
                    "historical_authoritative_markdown",
                },
            )

    def test_extracted_copy_is_subordinate(self) -> None:
        matrix = self.load_checked_in_matrix()

        for row in matrix["domains"]:
            extracted = row["extracted_working_copy"]

            if extracted is None:
                continue

            self.assertEqual(
                "subordinate_extracted_copy",
                extracted["authority_status"],
            )

    def test_input_audit_hashes_agree(self) -> None:
        matrix = self.load_checked_in_matrix()

        hashes = {
            value["archive_sha256"]
            for value in matrix["source_audits"].values()
        }

        self.assertEqual(
            {
                "82a6015b8c968645307e36c8e4aa0351515f50333c08a6c5402a7819b7b747e5"
            },
            hashes,
        )

    def test_generation_does_not_modify_inputs(self) -> None:
        before = {
            path: sha256(path)
            for path in (CAN001, CAN002, CAN003)
        }

        with tempfile.TemporaryDirectory() as temporary:
            run_generator(
                pathlib.Path(temporary) / "generated"
            )

        after = {
            path: sha256(path)
            for path in (CAN001, CAN002, CAN003)
        }

        self.assertEqual(before, after)

    def test_outputs_are_deterministic(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = pathlib.Path(temporary)
            first = root / "first"
            second = root / "second"

            run_generator(first)
            run_generator(second)

            for filename in (
                "canonical_authority_matrix.json",
                "canonical_authority_matrix.md",
                "README.md",
            ):
                self.assertEqual(
                    (first / filename).read_bytes(),
                    (second / filename).read_bytes(),
                )

    def test_checked_in_outputs_match_regeneration(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            generated = (
                pathlib.Path(temporary)
                / "generated"
            )

            run_generator(generated)

            for filename in (
                "canonical_authority_matrix.json",
                "canonical_authority_matrix.md",
                "README.md",
            ):
                self.assertEqual(
                    (OUTPUT_DIR / filename).read_bytes(),
                    (generated / filename).read_bytes(),
                )


if __name__ == "__main__":
    unittest.main(verbosity=2)
