# [CAN-008] Canonical Package Regeneration Report

## 1. Scope

- Package root: `DROPi_Canonical_Reference`
- Validation mode: `validate_existing`
- Package-control files are regenerated from documented inputs; existing package bytes are never used as the generation source.

## 2. GitHub Actions assessment

| Field | Value |
| --- | --- |
| Assessment | assessed_compatible_with_clean_checkout |
| Execution evidence for this PR | not_exercised_in_actual_github_actions_for_this_pr |
| Notes | Requires Python 3.9+, standard library only. GitHub Actions compatibility was assessed for a clean checkout and was not exercised in an actual workflow run for this PR. Termux requires the python package. All modes run without network access. |

## 3. Package-control generation rules

| Path | Semantic role | Generator | Documented inputs |
| --- | --- | --- | --- |
| `AI_CANONICAL_REFERENCE_AUDIT_REPORT.md` | `recovery_audit_summary` | `generate_audit_report_from_statistics_and_provenance` | `docs/audits/can-006/derived_package_statistics.json`, `docs/audits/can-007/derived_package_provenance.json`, `04.zip` |
| `CANONICAL_KNOWLEDGE_INDEX.md` | `navigation_index` | `generate_knowledge_index_from_statistics_and_provenance` | `docs/audits/can-006/derived_package_statistics.json`, `docs/audits/can-007/derived_package_provenance.json` |
| `CANONICAL_MANIFEST.md` | `package_inventory_manifest` | `generate_manifest_from_package_inventory_and_provenance` | `docs/audits/can-006/derived_package_statistics.json`, `docs/audits/can-007/derived_package_provenance.json` |
| `README_FOR_DROPi_TYCOON.md` | `consumer_usage_readme` | `generate_readme_from_package_metadata` | `docs/audits/can-006/derived_package_statistics.json`, `docs/audits/can-007/derived_package_provenance.json`, `04.zip` |

## 4. Summary

| Metric | Count |
| --- | ---: |
| `expected_package_file_count` | 217 |
| `actually_regenerated_from_source_count` | 213 |
| `retained_existing_fallback_count` | 4 |
| `package_control_regenerated_count` | 4 |
| `package_control_unreproducible_count` | 4 |
| `byte_identical_regenerated_count` | 209 |
| `byte_identical_file_count` | 213 |
| `divergent_file_count` | 4 |
| `authoritative_divergent_file_count` | 0 |
| `missing_source_count` | 0 |
| `unsupported_source_count` | 3 |
| `undocumented_transformation_count` | 1 |
| `certifiable_file_count` | 209 |
| `non_certifiable_file_count` | 8 |
| `summary_totals_reconcile` | True |
| `deterministic_repetition_passed` | True |

## 5. Source categories

| Source category | Count |
| --- | ---: |
| `authoritative_source` | 209 |
| `generated_package_control` | 4 |
| `retained_existing_fallback` | 1 |
| `unsupported` | 3 |

## 6. Package-control regeneration evidence

| Path | Expected SHA-256 | Generated SHA-256 | Byte-identical | Certifiable | Failure reason |
| --- | --- | --- | --- | --- | --- |
| `AI_CANONICAL_REFERENCE_AUDIT_REPORT.md` | `aed212bb97cd0a3ef5f718ae803c603e58d5f518904272cc986fa39101a66037` | `7c9effb1fb2e2521ce886133966c5fdff4f78a89b3207f84bb2b2a47b0316f15` | False | False | package_control_audit_report_checked_in_bytes_depend_on_undocumented_curated_audit_narrative |
| `CANONICAL_KNOWLEDGE_INDEX.md` | `2dba1c2d35f92d1b8f88adf37b993eda52c274aaaa43db26b21b1a6f82c5fe59` | `bdbb14424764e821a8bfe245e92fbe74a382668e5b74c107d2a0d3af7868f3b9` | False | False | package_control_knowledge_index_checked_in_bytes_depend_on_undocumented_curated_navigation_text |
| `CANONICAL_MANIFEST.md` | `c4271bb1dd46a295862b1767fff46a3bba80e949efd56f2f0143bbf9734f4503` | `09841d76ce7996f248040e0cdc19bc8c93be8f4324d960f2e0cba6fbd9d70116` | False | False | package_control_manifest_checked_in_bytes_depend_on_undocumented_curated_per_document_metadata |
| `README_FOR_DROPi_TYCOON.md` | `207ffa0ce3435f44d4e3603a97fb3a66b942efbcceb435f06e0ebb46d63356d4` | `b68883d7439a65eaacac789fadbfcf6fa57616b5d5e53e0836016683c7c43afc` | False | False | package_control_readme_checked_in_bytes_depend_on_undocumented_branch_commit_generation_metadata |

## 7. Certification blockers

| Package path | Source category | Failure reason |
| --- | --- | --- |
| `00_Project/Governance/SESSION_HANDOVER.md` | `retained_existing_fallback` | derived_transformation_algorithm_not_documented |
| `00_Project/Status_Reports/AUDIT_TRACKING.md` | `unsupported` | unsupported_no_deterministic_source |
| `00_Project/Status_Reports/SESSION_STATE.md` | `unsupported` | unsupported_no_deterministic_source |
| `09_Reference/Package_Metadata/inventory.json` | `unsupported` | unsupported_no_deterministic_source |
| `AI_CANONICAL_REFERENCE_AUDIT_REPORT.md` | `generated_package_control` | package_control_audit_report_checked_in_bytes_depend_on_undocumented_curated_audit_narrative |
| `CANONICAL_KNOWLEDGE_INDEX.md` | `generated_package_control` | package_control_knowledge_index_checked_in_bytes_depend_on_undocumented_curated_navigation_text |
| `CANONICAL_MANIFEST.md` | `generated_package_control` | package_control_manifest_checked_in_bytes_depend_on_undocumented_curated_per_document_metadata |
| `README_FOR_DROPi_TYCOON.md` | `generated_package_control` | package_control_readme_checked_in_bytes_depend_on_undocumented_branch_commit_generation_metadata |

## 8. Full file results

| Package path | Derived status | Source category | Regeneration method | Regenerated from authoritative source | Regenerated from documented inputs | Byte-identical | Certifiable | Failure reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `00_Project/Decision_Log/DECISION_LOG.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `00_Project/Governance/AGENTS.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `00_Project/Governance/AI_DEVELOPMENT_CHARTER.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 16.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16.0.1.0_ANEXA 16.A ╤В╨Р╨д RACI DE GUVERNANтХЪ╨ктФА╨Т.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16.0.1.1_ANEXA 16.B ╤В╨Р╨д MATRICE DE DECIZIE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16.0.1.2_ANEXA 16.C ╤В╨Р╨д FLUX DE ESCALADARE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16.0.1.3_ANEXA 16.D ╤В╨Р╨д REGISTRU POLITICI INTERNE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16.0.1.4_ANEXA 16.E ╤В╨Р╨д REGISTRU SUSPENDтФА╨ТRI -OPRIRI.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16.0.1_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 16.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16.0.2_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 16.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16.0_CAPITOLUL 16 ╤В╨Р╨д GUVERNANтХЪ╨ктФА╨Т.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16_GUVERNANтХЪ╨ктФА╨Т TEHNICтФА╨Т_OWNERSHIP тХЪ╨иI RESPONSABILITтФА╨ТтХЪ╨кI.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `00_Project/Governance/PROJECT_TRANSFER.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `00_Project/Governance/SESSION_HANDOVER.md` | `derived_transformation` | `retained_existing_fallback` | `retained_existing_fallback` | False | False | True | False | derived_transformation_algorithm_not_documented |
| `00_Project/Indexes/canonical_README.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `00_Project/Recovered_04_ZIP/00_README_START_HERE/Canon_Rules.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `00_Project/Recovered_04_ZIP/00_README_START_HERE/Change_Log.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `00_Project/Recovered_04_ZIP/00_README_START_HERE/Project_Overview.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `00_Project/Recovered_04_ZIP/INDEX.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `00_Project/Recovered_04_ZIP/README.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `00_Project/Sprint_Specs/SPRINT_1_2_SPEC.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `00_Project/Status_Reports/AUDIT_TRACKING.md` | `unsupported` | `unsupported` | `retained_existing_fallback` | False | False | True | False | unsupported_no_deterministic_source |
| `00_Project/Status_Reports/DROPI_STATUS_REPORT_2026-06-30.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `00_Project/Status_Reports/SESSION_STATE.md` | `unsupported` | `unsupported` | `retained_existing_fallback` | False | False | True | False | unsupported_no_deterministic_source |
| `01_Vision/MasterPlan_Complete/Masterplan Dropi ( detaliat).docx` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `01_Vision/MasterPlan_Volume_I/01_FUNDAMENT & STRATEGIE/00_CUPRINS GENERAL _INDEX FINAL.docx` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `01_Vision/MasterPlan_Volume_I/01_FUNDAMENT & STRATEGIE/01_EXECUTIVE SUMMARY (EXTINS).docx` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `01_Vision/MasterPlan_Volume_I/01_FUNDAMENT & STRATEGIE/02_PROBLEMA GLOBALтФА╨Т A LOGISTICII ULTIMULUI KILOMETRU.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `01_Vision/MasterPlan_Volume_I/01_FUNDAMENT & STRATEGIE/03_SOLUтХЪ╨кIA DROPi- ARHITECTURтФА╨Т LOGISTICтФА╨Т SISTEMICтФА╨Т.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `01_Vision/MasterPlan_Volume_I/01_FUNDAMENT & STRATEGIE/04_DIFERENтХЪ╨кIEREA STRATEGICтФА╨Т DROPi.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `01_Vision/MasterPlan_Volume_I/01_FUNDAMENT & STRATEGIE/05_ZONA 0- FILIPINE PUNCTUL DE START STRATEGIC.docx` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `01_Vision/Recovered_04_ZIP/01_MASTER_PLAN/MASTER_PLAN_DROPi.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `01_Vision/Recovered_04_ZIP/02_VOLUME_I_STRATEGY/Cap_01_Executive_Summary.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `01_Vision/Recovered_04_ZIP/02_VOLUME_I_STRATEGY/Cap_02_Problem_Space.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `01_Vision/Recovered_04_ZIP/02_VOLUME_I_STRATEGY/Cap_03_Solution_Overview.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `01_Vision/Recovered_04_ZIP/02_VOLUME_I_STRATEGY/Cap_04_Differentiation.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `01_Vision/Recovered_04_ZIP/02_VOLUME_I_STRATEGY/Cap_05_Zone_0_Philippines.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `01_Vision/Recovered_04_ZIP/02_VOLUME_I_STRATEGY/INDEX.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.0.0.1_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 8.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLELE 8╤В╨Р╨г12.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.0.1.0_ANEXA 8.A ╤В╨Р╨д MAPARE ROLURI ^0 PERMISIUNI (RBAC).docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.0.1.1_ANEXA 8.B ╤В╨Р╨д ORDER LIFECYCLE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.0.1.2_ANEXA 8.C ╤В╨Р╨д FALLBACK ^0 INTERVENтХЪ╨кIE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.0.1.3_ANEXA 8.D ╤В╨Р╨д SUPERVIZARE PILOT.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.0.1_ANEXE CAPITOLUL 8.docx` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.1.0_CAPITOLUL 8 ╤В╨Р╨д DEZVOLTAREA APLICAтХЪ╨кIEI DROPi -CORE OPERAтХЪ╨кIONAL.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.X AbsenтХЪ╨лa marketplace-ului din aplicaтХЪ╨лia DROPi.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.X.1_ALINIERE CAP. 8 ╤В╨Ц╨д CAP. 11.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.X.2_DIAGRAMтФА╨Т SECVENтХЪ╨кIALтФА╨Т CANONICтФА╨Т.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08_DEZVOLTAREA APLICAтХЪ╨кIEI DROPi -EXECUтХЪ╨кIE PAS CU PAS.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Blueprint/DROPi_6_LAYERS_EXPLAINED.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `02_Architecture/Core/ARCHITECTURE.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `02_Architecture/Core/canonical-structure.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `02_Architecture/Design/design.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `02_Architecture/Digital_Infrastructure/02_PRODUS & TEHNOLOGIE/14.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 14.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Digital_Infrastructure/02_PRODUS & TEHNOLOGIE/14.0_CAPITOLUL 14 ╤В╨Р╨д ARHITECTURA DIGITALтФА╨Т.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Digital_Infrastructure/02_PRODUS & TEHNOLOGIE/14_ARHITECTURA INFRASTRUCTURII DIGITALE DROPi.docx` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `02_Architecture/Historical_Archive/SYSTEM_ARCHITECTURE.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Integrations/02_PRODUS & TEHNOLOGIE/15.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 15.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Integrations/02_PRODUS & TEHNOLOGIE/15.0_CAPITOLUL 15 ╤В╨Р╨д INTEGRARE & ECOSISTEM.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Integrations/02_PRODUS & TEHNOLOGIE/15.1_ANEXA 15.A ╤В╨Р╨д TIPURI DE INTEGRARE & DREPTURI.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Integrations/02_PRODUS & TEHNOLOGIE/15.2_ANEXA 15.B ╤В╨Р╨д MODEL API ^0 WEBHOOK.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Integrations/02_PRODUS & TEHNOLOGIE/15.3_ANEXA 15.C ╤В╨Р╨д CHECKLIST DE INTEGRARE PARTENER.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Integrations/02_PRODUS & TEHNOLOGIE/15.4_ANEXA 15.D ╤В╨Р╨д AUDIT - SUSPENDARE INTEGRARE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `02_Architecture/Integrations/02_PRODUS & TEHNOLOGIE/15_INTEGRARE -INTEROPERABILITATE тХЪ╨иI ECOSISTEM.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `03_Logistics/Delivery/DELIVERY_MULTIMODAL.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `03_Logistics/Delivery_Reference/canonical-delivery-reference.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `03_Logistics/Supervised_Autonomous_Delivery/02_PRODUS & TEHNOLOGIE/11.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 11.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `03_Logistics/Supervised_Autonomous_Delivery/02_PRODUS & TEHNOLOGIE/11.0.1ANEXA 11.A ╤В╨Р╨д SCENARII DE INTERVENтХЪ╨кIE PILOT.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `03_Logistics/Supervised_Autonomous_Delivery/02_PRODUS & TEHNOLOGIE/11.0.2_ANEXA 11.B ╤В╨Р╨д GESTIONARE INCIDENTE OPERAтХЪ╨кIONALE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `03_Logistics/Supervised_Autonomous_Delivery/02_PRODUS & TEHNOLOGIE/11.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 11.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `03_Logistics/Supervised_Autonomous_Delivery/02_PRODUS & TEHNOLOGIE/11.1_CAPITOLUL 11 ╤В╨Р╨д LIVRARE AUTONOMтФА╨Т SUPERVIZATтФА╨Т.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `03_Logistics/Supervised_Autonomous_Delivery/02_PRODUS & TEHNOLOGIE/11_LIVRAREA AUTONOMтФА╨Т SUPERVIZATтФА╨Т _PROCEDURI_LIMITE_FALLBACK_ AUDIT.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `04_DronePorts/MasterPlan/02_PRODUS & TEHNOLOGIE/09.0.0.1_ANEXA 9.A ╤В╨Р╨д EVENIMENTE DRONEPORT ^0 LOGARE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `04_DronePorts/MasterPlan/02_PRODUS & TEHNOLOGIE/09.0.0.2_ANEXA 9.B ╤В╨Р╨д PROCESE PERMISE - INTERZISE DRONEPORT.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `04_DronePorts/MasterPlan/02_PRODUS & TEHNOLOGIE/09.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLELE 9╤В╨Р╨г12.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `04_DronePorts/MasterPlan/02_PRODUS & TEHNOLOGIE/09.0.1_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 9.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `04_DronePorts/MasterPlan/02_PRODUS & TEHNOLOGIE/09_INFRASTRUCTURA DRONEPORT -STANDARD^LJ HARDWARE-J SOFTWARE-J PROCEDURI.docx` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `05_Marketplace/Derived_Analyses/marketplace-canonical-analysis.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `05_Marketplace/Derived_Blueprints/BLUEPRINT_MARKETPLACE_DROPI.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `05_Marketplace/Implementation/MARKETPLACE_IMPLEMENTATION_PLAN.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `05_Marketplace/MasterPlan_Product/02_PRODUS & TEHNOLOGIE/06.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 6.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/MasterPlan_Product/02_PRODUS & TEHNOLOGIE/06.0_CAPITOLUL 6 ╤В╨Р╨д PRODUSUL DROPi.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/MasterPlan_Product/02_PRODUS & TEHNOLOGIE/06.1_ANEXA 6.A ╤В╨Р╨д HARTтФА╨Т PRODUS -PRODUCT MAP.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/MasterPlan_Product/02_PRODUS & TEHNOLOGIE/06.2_ANEXA 6.B ╤В╨Р╨д SEPARARE RESPONSABILITтФА╨ТтХЪ╨кI.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/MasterPlan_Product/02_PRODUS & TEHNOLOGIE/06.3_ANEXA 6.C ╤В╨Р╨д PRINCIPII DE DESIGN PRODUS.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/MasterPlan_Product/02_PRODUS & TEHNOLOGIE/06.4_ANEXA 6.D ╤В╨Р╨д REGULI DE EVOLUтХЪ╨кIE PRODUS.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/MasterPlan_Product/02_PRODUS & TEHNOLOGIE/06.5_ALINIERE CAP. 6 ╤В╨Ц╨д 7 ╤В╨Ц╨д 8.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/MasterPlan_Product/02_PRODUS & TEHNOLOGIE/06.X_Marketplace-ul DROPi ╤В╨Р╨д poziтХЪ╨лionare corectтФА╨У.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/MasterPlan_Product/02_PRODUS & TEHNOLOGIE/06_PRODUSUL DROPi (SITE ^M APLICAтХЪ╨кIE ^M INFRASTRUCTURтФА╨Т).docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Recovered_04_ZIP/Cap_06_Product_DROPi/Anexa 6B тАФ Marketplace Controlat DROPi.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Recovered_04_ZIP/Cap_06_Product_DROPi/B2B_Logistics_Partners.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Recovered_04_ZIP/Cap_06_Product_DROPi/Cap_06_Product.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Recovered_04_ZIP/Cap_06_Product_DROPi/Delivery_Multimodal.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Recovered_04_ZIP/Cap_06_Product_DROPi/Marketplace_Financial_Flow.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Recovered_04_ZIP/Cap_06_Product_DROPi/Pre_Orchestrare_Zonala.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Recovered_04_ZIP/Cap_06_Product_DROPi/Pricing_Transparency.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Recovered_04_ZIP/Cap_06_Product_DROPi/Reputation_Ranking_System.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.0.0.0_CONSOLIDARE FINALтФА╨Т ╤В╨Р╨д VOLUMUL II.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 7.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.0.1_MAPARE COMPLETтФА╨Т CAPITOLE 7╤В╨Р╨г12.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.0.2_CONSOLIDARE FINALтФА╨Т ╤В╨Р╨д VOLUMUL II.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.1.1TABEL DE RISC LEGAL ╤В╨Р╨д APARIтХЪ╨кIE ACCIDENTALтФА╨Т PE SITE-UL DROPi.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.1.2PROCEDURтФА╨Т OFICIALтФА╨Т ╤В╨Р╨д SITE INCIDENT RESPONSE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.1.3_CHECKLIST QA ╤В╨Р╨д тФЬ╨ЮNAINTE DE FIECARE DEPLOY SITE DROPi.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.1.4_ANEXтФА╨Т ╤В╨Р╨д PROCEDURтФА╨Т ROLLBACK POST-DEPLOY.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.1_CE NU APARE NICIODATтФА╨Т PE SITE-UL DROPi.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.2_RACI ╤В╨Р╨д APROBARE тХЪ╨иI RESPONSABILITтФА╨ТтХЪ╨кI SITE DROPi.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.3_ANEXтФА╨Т ╤В╨Р╨д TEMPLATE ╤В╨Р╨оSAFE PUBLIC STATEMENTS╤В╨Р╨н.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.4_ANEXтФА╨Т ╤В╨Р╨д SITE GOVERNANCE CHARTER.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.5_CHECKLIST ╤В╨Р╨д PUBLIC APPEARANCE - INTERVIEW.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.6.0_CHECKLIST ╤В╨Р╨д TRAINING INTERN -ONBOARDING COMUNICARE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.6.1_TEST DE VALIDARE INTERNтФА╨Т ╤В╨Р╨д COMUNICARE PUBLICтФА╨Т (PASS -FAIL).docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.6.2_CURRICULUM DE TRAINING INTERN ╤В╨Р╨д COMUNICARE PUBLICтФА╨Т DROPi.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.6.3_FORMULAR INTERN ╤В╨Р╨д COMMUNICATION COMPLIANCE ACKNOWLEDGEMENT.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.6_ANEXтФА╨Т ╤В╨Р╨д ╤В╨Р╨оRED LINES╤В╨Р╨н -SUBIECTE INTERZISE ABSOLUT.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.X.1_ANEXA 7.X ╤В╨Р╨д REGULI DE DESIGN UI MARKETPLACE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.X_Marketplace-ul тФЬ╨╛n cadrul site-ului DROPi.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07_DEZVOLTAREA SITE-ULUI DROPi -PRINCIPII тХЪ╨иI EXECUтХЪ╨кIE PAS CU PAS.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `06_Roles/AI_Agent_System/AI_AGENT_SYSTEM.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `06_Roles/Pilot_Selection/BLUEPRINT_PILOT_SELECTION_SYSTEM.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `06_Roles/Registration/DROPi_REGISTRATION_FLOW_REPORT.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `07_Economy/Business_Legal_Scaling/03_BUSINESS, LEGAL & SCALARE/21_MODELUL ECONOMIC COMPLET DROPi.docx` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `07_Economy/Business_Legal_Scaling/03_BUSINESS, LEGAL & SCALARE/22_GO-TO-MARKET FILIPINE _ZONA 0.docx` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `07_Economy/Business_Legal_Scaling/03_BUSINESS, LEGAL & SCALARE/23_COMPLIANCE MULTI-тХЪ╨кARтФА╨Т тХЪ╨иI ADAPTAREA LA UNIUNEA EUROPEANтФА╨Т _EASA.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `07_Economy/Business_Legal_Scaling/03_BUSINESS, LEGAL & SCALARE/24_FRANCIZARE, OPERATORI ZONALI тХЪ╨иI REPLICARE GLOBALтФА╨Т.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `07_Economy/Business_Legal_Scaling/03_BUSINESS, LEGAL & SCALARE/25_STRATEGIA DE INVESTIтХЪ╨кII тХЪ╨иI FINANтХЪ╨кARE DROPi.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `07_Economy/Business_Legal_Scaling/03_BUSINESS, LEGAL & SCALARE/26_ROADMAP 0╤В╨Р╨г36 LUNI _EXECUтХЪ╨кIE DISCIPLINATтФА╨Т.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `07_Economy/Business_Legal_Scaling/03_BUSINESS, LEGAL & SCALARE/27_SCENARII DE EXIT тХЪ╨иI VIITORUL DROPi _REALIST_ NU SPECULATIV.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `07_Economy/KPI_Unit_Economics/02_PRODUS & TEHNOLOGIE/18.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 18.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `07_Economy/KPI_Unit_Economics/02_PRODUS & TEHNOLOGIE/18.0.1_ANEXA 18.A ╤В╨Р╨д LISTтФА╨Т KPI CANONICI.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `07_Economy/KPI_Unit_Economics/02_PRODUS & TEHNOLOGIE/18.0.2_ANEXA 18.B ╤В╨Р╨д STRUCTURтФА╨Т UNIT ECONOMICS.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `07_Economy/KPI_Unit_Economics/02_PRODUS & TEHNOLOGIE/18.0.3_ANEXA 18.C ╤В╨Р╨д PRAGURI KPI ^0 ESCALADARE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `07_Economy/KPI_Unit_Economics/02_PRODUS & TEHNOLOGIE/18.0.4_ANEXA 18.D ╤В╨Р╨д RAPORTARE KPI & AUDIT.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `07_Economy/KPI_Unit_Economics/02_PRODUS & TEHNOLOGIE/18.0_CAPITOLUL 18 ╤В╨Р╨д KPI-METRICI тХЪ╨иI UNIT ECONOMICS.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `07_Economy/KPI_Unit_Economics/02_PRODUS & TEHNOLOGIE/18_KPI_METRICI тХЪ╨иI UNIT ECONOMICS.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `07_Economy/Recovered_Contracts/Merchant_Terms.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `08_AI/DSS/02_PRODUS & TEHNOLOGIE/10.0.0.1_ANEXA 10.A ╤В╨Р╨д GUARDRAILS DSS -REGULI STRICTE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `08_AI/DSS/02_PRODUS & TEHNOLOGIE/10.0.0.2_ANEXA 10.B ╤В╨Р╨д EXEMPLE DE RECOMANDтФА╨ТRI DSS.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `08_AI/DSS/02_PRODUS & TEHNOLOGIE/10.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 10.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `08_AI/DSS/02_PRODUS & TEHNOLOGIE/10.1_CAPITOLUL 10 ╤В╨Р╨д AI ASISTAT -DSS.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `08_AI/DSS/02_PRODUS & TEHNOLOGIE/10_AI ASISTAT-ARHITECTURA DECIZIONALтФА╨Т DROPi.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `08_AI/Governance/AI_DEVELOPMENT_HANDOVER_CANON.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `09_Reference/Audit_Data_Protection/02_PRODUS & TEHNOLOGIE/12.0.0_ANEXA 12.A ╤В╨Р╨д STRUCTURтФА╨Т LOG-URI.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Audit_Data_Protection/02_PRODUS & TEHNOLOGIE/12.0.1_ANEXA 12.B ╤В╨Р╨д POLITICтФА╨Т DE RETENтХЪ╨кIE DATE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Audit_Data_Protection/02_PRODUS & TEHNOLOGIE/12.0.2_ANEXA 12.C ╤В╨Р╨д CHECKLIST GDPR COMPLIANCE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Audit_Data_Protection/02_PRODUS & TEHNOLOGIE/12.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 12.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Audit_Data_Protection/02_PRODUS & TEHNOLOGIE/12.1_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 12.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Audit_Data_Protection/02_PRODUS & TEHNOLOGIE/12_SISTEMUL DE DATE_ LOG-URI_ TRASABILITATE тХЪ╨иI PROTECтХЪ╨кIA DATELOR.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Blueprint/Analyses/DROPi_ROADMAP_COMPARISON.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `09_Reference/Blueprint/DROPi_ROADMAP_BY_LAYERS.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `09_Reference/Blueprint/Historical_Archive/IMPLEMENTATION_ROADMAP.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Blueprint/INDEX.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `09_Reference/Blueprint/Sprint_Roadmap/BLUEPRINT_SPRINT_ROADMAP.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `09_Reference/Blueprint/Sprint_Roadmap/DROPi_NEXT_SPRINT_TASKS.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `09_Reference/Deployment/ADMIN_PROVISIONING.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `09_Reference/Deployment/BLUEPRINT_INDEPENDENT_DEPLOYMENT.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `09_Reference/Deployment/DEPLOYMENT.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `09_Reference/Deployment/Historical_Archive/DEPLOYMENT_GUIDE.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Historical_Packages/Component_READMEs/BACKEND_README.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Historical_Packages/Component_READMEs/MOBILE_APP_README.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Historical_Packages/Component_READMEs/WEBSITE_README.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Historical_RCA/AUTH_PASSWORD_RESET_RCA_2026-07-12.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `09_Reference/MasterPlan_Pack_Indexes/02_PRODUS & TEHNOLOGIE/00.0_CONSOLIDARE FINALтФА╨Т ╤В╨Р╨д VOLUMUL II.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/MasterPlan_Pack_Indexes/02_PRODUS & TEHNOLOGIE/00.1_PACHET INVESTITORI ╤В╨Р╨д EXECUTIVE ^LM AUDIT EXTRACTS.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/MasterPlan_Pack_Indexes/02_PRODUS & TEHNOLOGIE/00_CONSOLIDARE FINALтФА╨Т ╤В╨Р╨д VOLUMUL II.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Mobile_Setup/MOBILE_FIRST_SETUP.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `09_Reference/Package_Metadata/inventory.json` | `unsupported` | `unsupported` | `retained_existing_fallback` | False | False | True | False | unsupported_no_deterministic_source |
| `09_Reference/Periodic_Updates/periodic-updates.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `09_Reference/Pitch/04_PITCH/00.0_DROPi ╤В╨Р╨д OFFICIAL PITCH DECK.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Pitch/04_PITCH/00.1_DROPi ╤В╨Р╨д OFFICIAL SPEAKER NOTES (ENGLISH).docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Pitch/04_PITCH/01.0_DROPi ╤В╨Р╨д PITCH DECK OFICIAL_RO.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Pitch/04_PITCH/01.1_DROPi ╤В╨Р╨д SPEAKER NOTES OFICIALE (ROMтФЬ╨ТNтФА╨Т).docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Pitch/04_PITCH/02.0_DROPi ╤В╨Р╨д OPISYAL NA PITCH DECK_TL.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Pitch/04_PITCH/02.1_DROPi ╤В╨Р╨д SPEAKER NOTES (TAGALOG)_Para sa Opisyal na Pitch Deck.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Pitch/04_PITCH/03.0_DROPi ╤В╨Р╨д OFFICIAL LGU -- GOVERNMENT PITCH.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Pitch/PRESENTATION_SCRIPT.md` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/ROADMAP.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `09_Reference/Risk_Management/02_PRODUS & TEHNOLOGIE/17.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 17.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Risk_Management/02_PRODUS & TEHNOLOGIE/17.0.1_ANEXA 17.A ╤В╨Р╨д REGISTRU DE RISC.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Risk_Management/02_PRODUS & TEHNOLOGIE/17.0.2_ANEXA 17.B ╤В╨Р╨д MATRICE RISC -PROBABILITATE тФЬ╨з IMPACT.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Risk_Management/02_PRODUS & TEHNOLOGIE/17.0.3_ANEXA 17.C ╤В╨Р╨д PLANURI DE CONTINUITATE (BCP).docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Risk_Management/02_PRODUS & TEHNOLOGIE/17.0.4_ANEXA 17.D ╤В╨Р╨д CHECKLIST MANAGEMENT RISC.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Risk_Management/02_PRODUS & TEHNOLOGIE/17.0_CAPITOLUL 17 ╤В╨Р╨д MANAGEMENTUL RISCULUI.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Risk_Management/02_PRODUS & TEHNOLOGIE/17_MANAGEMENTUL RISCULUI _OPERAтХЪ╨кIONAL_TEHNIC_ LEGAL тХЪ╨иI REPUTAтХЪ╨кIONAL.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 19.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19.0_CAPITOLUL 19 ╤В╨Р╨д CE NU FACE DROPi.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19.1.1_ANEXA 19.A ╤В╨Р╨д LISTтФА╨Т DE EXCLUDERI OPERAтХЪ╨кIONALE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19.1.2_ANEXA 19.B ╤В╨Р╨д LIMITтФА╨ТRI CONTRACTUALE STANDARD.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19.1.3_ANEXA 19.C ╤В╨Р╨д GHID DE PREVENIRE A AтХЪ╨иTEPTтФА╨ТRILOR FALSE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19.1.4_ANEXA 19.D ╤В╨Р╨д UTILIZARE тФЬ╨ЮN AUDIT si DUE DILIGENCE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19.1.5_ANEXA 19.E ╤В╨Р╨д MECANISM DE APLICARE INTERNтФА╨Т.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19.1.6_ANEXA 19.F ╤В╨Р╨д DECLARAтХЪ╨кIE DE POZIтХЪ╨кIONARE OFICIALтФА╨Т.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19.1_ANEXE CAPITOLUL 19 ╤В╨Р╨д ╤В╨Р╨оCE NU FACE DROPi╤В╨Р╨н.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19_CE NU FACE DROPi _DELIMITтФА╨ТRI STRATEGICE тХЪ╨иI DEFENSIVE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13.0.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 13.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 13.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13.0.1_CHECKLIST 13.A ╤В╨Р╨д TESTARE FUNCтХЪ╨кIONALтФА╨Т.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13.0.2_CHECKLIST 13.B ╤В╨Р╨д TESTARE DE INTEGRARE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13.0.3_CHECKLIST 13.C ╤В╨Р╨д TESTARE DE SIGURANтХЪ╨ктФА╨Т.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13.0.4_CHECKLIST 13.D ╤В╨Р╨д TESTARE RBAC -ROLURI ^0 PERMISIUNI.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13.0.5_CHECKLIST 13.E ╤В╨Р╨д CHECKLIST DE RELEASE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13.0.6_CHECKLIST 13.F ╤В╨Р╨д ROLLBACK READINESS.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13.0_CAPITOLUL 13 ╤В╨Р╨д TESTARE- QA - RELEASE DISCIPLINE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13_TESTARE_ QA_DISCIPLINтФА╨Т DE RELEASE тХЪ╨иI ROLLBACK.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Testing_Release/Blueprints/BLUEPRINT_TESTING_FORMAT.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `09_Reference/Testing_Release/Blueprints/BLUEPRINT_TESTING_REQUIREMENTS.md` | `copied_byte_identical` | `authoritative_source` | `copy_exact_source_bytes` | True | True | True | True |  |
| `09_Reference/Volume_II_Conclusion/02_PRODUS & TEHNOLOGIE/20.0.1_ANEXA 20.A ╤В╨Р╨д CHECKLIST DE ELIGIBILITATE VOLUMUL III.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Volume_II_Conclusion/02_PRODUS & TEHNOLOGIE/20.0.2_ANEXA 20.B ╤В╨Р╨д DECLARAтХЪ╨кIE OFICIALтФА╨Т DE тФЬ╨ЮNCHIDERE VOLUMUL II.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Volume_II_Conclusion/02_PRODUS & TEHNOLOGIE/20.0.3_ANEXA 20.C ╤В╨Р╨д DECIZIE DE TRECERE -TEMPLATE.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Volume_II_Conclusion/02_PRODUS & TEHNOLOGIE/20.0_CAPITOLUL 20 ╤В╨Р╨д CONCLUZIA VOLUMULUI II.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `09_Reference/Volume_II_Conclusion/02_PRODUS & TEHNOLOGIE/20_CONCLUZIA VOLUMULUI II тХЪ╨иI CRITERIILE DE TRECERE LA VOLUMUL III.docx` | `copied_with_path_or_filename_variant` | `authoritative_source` | `copy_exact_source_bytes_path_variant` | True | True | True | True |  |
| `AI_CANONICAL_REFERENCE_AUDIT_REPORT.md` | `package_control` | `generated_package_control` | `generate_audit_report_from_statistics_and_provenance` | False | True | False | False | package_control_audit_report_checked_in_bytes_depend_on_undocumented_curated_audit_narrative |
| `CANONICAL_KNOWLEDGE_INDEX.md` | `package_control` | `generated_package_control` | `generate_knowledge_index_from_statistics_and_provenance` | False | True | False | False | package_control_knowledge_index_checked_in_bytes_depend_on_undocumented_curated_navigation_text |
| `CANONICAL_MANIFEST.md` | `package_control` | `generated_package_control` | `generate_manifest_from_package_inventory_and_provenance` | False | True | False | False | package_control_manifest_checked_in_bytes_depend_on_undocumented_curated_per_document_metadata |
| `README_FOR_DROPi_TYCOON.md` | `package_control` | `generated_package_control` | `generate_readme_from_package_metadata` | False | True | False | False | package_control_readme_checked_in_bytes_depend_on_undocumented_branch_commit_generation_metadata |

## 9. Determinism guarantees

| Property | Value |
| --- | --- |
| deterministic_repetition_passed | True |
| no_absolute_paths | True |
| no_random_values | True |
| no_timestamps | True |
| sorted_filesystem_traversal | True |
| sorted_zip_traversal | True |
| stable_json_key_ordering | True |
| stable_markdown_ordering | True |
| stable_newlines | True |

