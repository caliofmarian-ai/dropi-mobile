# [CAN-008] Canonical Package Regeneration Report

## 1. Scope

- Package root: `DROPi_Canonical_Reference`
- Source mutation performed: False
- Package mutation performed: False
- Historical archive mutation performed: False

## 2. Authority hierarchy

1. `04.zip` — historical immutable authoritative archive
2. `canonical/docs/00_MasterPlan/` — extracted accessible copy
3. `canonical/*.md` — later approved active canon
4. Root architecture/governance and BLUEPRINT sources — approved source inputs
5. `DROPi_Canonical_Reference/` — derived, reproducible, read-only output

## 3. Input audit dependencies

| Audit | Path | SHA-256 |
| --- | --- | --- |
| CAN001_REPORT | `docs/audits/can-001/04_zip_inventory.json` | `7e3668793b3005f373e38c8e45d60e032a4e828deeb5665851a9281f4af7f74c` |
| CAN002_REPORT | `docs/audits/can-002/masterplan_comparison.json` | `440a4b5d0a64460fcc756519ec60c7e46a1a6e35820de3ff7ddaca49496fc3a9` |
| CAN003_REPORT | `docs/audits/can-003/zip_markdown_inventory.json` | `b77db92e1c36af480deff8b8ccae92e001d3b610a7196e668700360cfdda41ad` |
| CAN004_REPORT | `docs/audits/can-004/canonical_authority_matrix.json` | `6c4ad00295bfdc8689a39efe2c9bd955987f6519cb61f5d62f4abcb3407a3a14` |
| CAN005_REPORT | `docs/audits/can-005/canonical_filename_encoding_inventory.json` | `3a9d17a3a6ea4dbbc3e69e0c20f6362e16c65d951dd380e4685e15e8f4fcd0b1` |
| CAN006_REPORT | `docs/audits/can-006/derived_package_statistics.json` | `c33ed1d29833850037567643befe30c4ad602e057694b471135e52c40576a713` |
| CAN007_REPORT | `docs/audits/can-007/derived_package_provenance.json` | `826a64ff5bb173b04ca27263c181682538a8dfc014e0944e12f988657b234132` |
| 04.zip | `04.zip` | `82a6015b8c968645307e36c8e4aa0351515f50333c08a6c5402a7819b7b747e5` |

## 4. Regeneration algorithm

1. Load CAN-007 provenance records (217 records).
2. Validate 04.zip SHA-256 against known expected value.
3. Build ZIP entry index (sorted traversal).
4. For each record (sorted by package_path):
   - `package_control`: validate existing package SHA → copy bytes.
   - `copied_byte_identical` / `copied_with_path_or_filename_variant`:
     read source → validate SHA → write to output.
   - `derived_transformation`: no documented algorithm → retain existing (non-certifiable).
   - `unsupported`: no deterministic source → retain existing (non-certifiable).
5. Produce deterministic manifest and report.

## 5. Safety rules

- `DROPi_Canonical_Reference/` is never overwritten in default operation.
- `04.zip` is never modified (read-only via zipfile).
- `canonical/` is never modified.
- `BLUEPRINT/` is never modified.
- Output directory must be explicitly specified and external.
- Path traversal and symlink escapes are rejected.
- No timestamps, UUIDs, or random values in outputs.

## 6. Environment compatibility

| Environment | Status | Notes |
| --- | --- | --- |
| Termux/Android | compatible | Requires `python` package |
| Standard Linux | compatible | Python 3.9+, stdlib only |
| GitHub Actions | compatible_with_clean_checkout | ubuntu-latest tested |

## 7. Package totals

| Metric | Count |
| --- | ---: |
| Expected package files | 217 |
| Regenerated files | 217 |
| Byte-identical files | 217 |
| Divergent files | 0 |
| Missing sources | 0 |
| Unsupported files | 3 |
| Package-control documents | 4 |
| Regeneration certifiable | NOT CERTIFIABLE |
| Deterministic repetition passed | True |

## 8. Counts by provenance class

| Provenance class | Count |
| --- | ---: |
| `recovered_directly_from_04_zip` | 28 |
| `copied_from_extracted_masterplan` | 147 |
| `copied_from_active_canonical` | 6 |
| `derived_from_root_architecture_or_governance` | 23 |
| `derived_from_blueprint` | 6 |
| `package_control_document` | 4 |
| `unknown_or_unsupported` | 3 |

## 9. Counts by derived status

| Derived status | Count |
| --- | ---: |
| `copied_byte_identical` | 43 |
| `copied_with_path_or_filename_variant` | 166 |
| `normalized_content_equivalent` | 0 |
| `derived_transformation` | 1 |
| `package_control` | 4 |
| `unsupported` | 3 |

## 10. Full file-result table

| Package path | Provenance class | Derived status | Expected SHA-256 | Regenerated SHA-256 | Byte-identical | Certifiable | Failure reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `00_Project/Decision_Log/DECISION_LOG.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `6a715a2c095397a6…` | `6a715a2c095397a6…` | True | True |  |
| `00_Project/Governance/AGENTS.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `c52ca4dddf325aab…` | `c52ca4dddf325aab…` | True | True |  |
| `00_Project/Governance/AI_DEVELOPMENT_CHARTER.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `ff955eaa83b00e55…` | `ff955eaa83b00e55…` | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 16.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `b9e520d2d757590e…` | `b9e520d2d757590e…` | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16.0.1.0_ANEXA 16.A ╤В╨Р╨д RACI DE GUVERNANтХЪ╨ктФА╨Т.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `159b0ce636c30ec8…` | `159b0ce636c30ec8…` | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16.0.1.1_ANEXA 16.B ╤В╨Р╨д MATRICE DE DECIZIE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `d3f8586e5bc0a8e8…` | `d3f8586e5bc0a8e8…` | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16.0.1.2_ANEXA 16.C ╤В╨Р╨д FLUX DE ESCALADARE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `2169390ca46d4b95…` | `2169390ca46d4b95…` | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16.0.1.3_ANEXA 16.D ╤В╨Р╨д REGISTRU POLITICI INTERNE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `db1ff0679ca92174…` | `db1ff0679ca92174…` | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16.0.1.4_ANEXA 16.E ╤В╨Р╨д REGISTRU SUSPENDтФА╨ТRI -OPRIRI.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `5d41fcf274813824…` | `5d41fcf274813824…` | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16.0.1_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 16.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `ce9b212a1eac164d…` | `ce9b212a1eac164d…` | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16.0.2_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 16.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `99dcce2109317874…` | `99dcce2109317874…` | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16.0_CAPITOLUL 16 ╤В╨Р╨д GUVERNANтХЪ╨ктФА╨Т.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `951aec9a9c99c720…` | `951aec9a9c99c720…` | True | True |  |
| `00_Project/Governance/MasterPlan_Governance/02_PRODUS & TEHNOLOGIE/16_GUVERNANтХЪ╨ктФА╨Т TEHNICтФА╨Т_OWNERSHIP тХЪ╨иI RESPONSABILITтФА╨ТтХЪ╨кI.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `dddcfe540084bbf5…` | `dddcfe540084bbf5…` | True | True |  |
| `00_Project/Governance/PROJECT_TRANSFER.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `0bd181e18e574044…` | `0bd181e18e574044…` | True | True |  |
| `00_Project/Governance/SESSION_HANDOVER.md` | `copied_from_active_canonical` | `derived_transformation` | `caadec73eea5cd3f…` | `caadec73eea5cd3f…` | True | False | derived_transformation_algorithm_not_documented |
| `00_Project/Indexes/canonical_README.md` | `copied_from_active_canonical` | `copied_byte_identical` | `776224d49b35dacd…` | `776224d49b35dacd…` | True | True |  |
| `00_Project/Recovered_04_ZIP/00_README_START_HERE/Canon_Rules.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `2abfcb639956c5c9…` | `2abfcb639956c5c9…` | True | True |  |
| `00_Project/Recovered_04_ZIP/00_README_START_HERE/Change_Log.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `9385c6093140be70…` | `9385c6093140be70…` | True | True |  |
| `00_Project/Recovered_04_ZIP/00_README_START_HERE/Project_Overview.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `222f6a9938981bb8…` | `222f6a9938981bb8…` | True | True |  |
| `00_Project/Recovered_04_ZIP/INDEX.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `a820dc55c65986d6…` | `a820dc55c65986d6…` | True | True |  |
| `00_Project/Recovered_04_ZIP/README.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `fc20e5a23eaee41e…` | `fc20e5a23eaee41e…` | True | True |  |
| `00_Project/Sprint_Specs/SPRINT_1_2_SPEC.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `fd792037bddda224…` | `fd792037bddda224…` | True | True |  |
| `00_Project/Status_Reports/AUDIT_TRACKING.md` | `unknown_or_unsupported` | `unsupported` | `992308428d2f76e4…` | `992308428d2f76e4…` | True | False | unsupported_no_deterministic_source |
| `00_Project/Status_Reports/DROPI_STATUS_REPORT_2026-06-30.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `6a28d0ed2a3cdc85…` | `6a28d0ed2a3cdc85…` | True | True |  |
| `00_Project/Status_Reports/SESSION_STATE.md` | `unknown_or_unsupported` | `unsupported` | `82e06ec4615aeca5…` | `82e06ec4615aeca5…` | True | False | unsupported_no_deterministic_source |
| `01_Vision/MasterPlan_Complete/Masterplan Dropi ( detaliat).docx` | `copied_from_extracted_masterplan` | `copied_byte_identical` | `7b5d6f64670b0a49…` | `7b5d6f64670b0a49…` | True | True |  |
| `01_Vision/MasterPlan_Volume_I/01_FUNDAMENT & STRATEGIE/00_CUPRINS GENERAL _INDEX FINAL.docx` | `copied_from_extracted_masterplan` | `copied_byte_identical` | `6ddb024e3bdabf37…` | `6ddb024e3bdabf37…` | True | True |  |
| `01_Vision/MasterPlan_Volume_I/01_FUNDAMENT & STRATEGIE/01_EXECUTIVE SUMMARY (EXTINS).docx` | `copied_from_extracted_masterplan` | `copied_byte_identical` | `472baa0f2fac9b44…` | `472baa0f2fac9b44…` | True | True |  |
| `01_Vision/MasterPlan_Volume_I/01_FUNDAMENT & STRATEGIE/02_PROBLEMA GLOBALтФА╨Т A LOGISTICII ULTIMULUI KILOMETRU.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `06851769f942e2ef…` | `06851769f942e2ef…` | True | True |  |
| `01_Vision/MasterPlan_Volume_I/01_FUNDAMENT & STRATEGIE/03_SOLUтХЪ╨кIA DROPi- ARHITECTURтФА╨Т LOGISTICтФА╨Т SISTEMICтФА╨Т.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `154712d8059488f8…` | `154712d8059488f8…` | True | True |  |
| `01_Vision/MasterPlan_Volume_I/01_FUNDAMENT & STRATEGIE/04_DIFERENтХЪ╨кIEREA STRATEGICтФА╨Т DROPi.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `64159789bccf7d90…` | `64159789bccf7d90…` | True | True |  |
| `01_Vision/MasterPlan_Volume_I/01_FUNDAMENT & STRATEGIE/05_ZONA 0- FILIPINE PUNCTUL DE START STRATEGIC.docx` | `copied_from_extracted_masterplan` | `copied_byte_identical` | `2355e782cb9fc5ff…` | `2355e782cb9fc5ff…` | True | True |  |
| `01_Vision/Recovered_04_ZIP/01_MASTER_PLAN/MASTER_PLAN_DROPi.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `4bcc8bb199a070a6…` | `4bcc8bb199a070a6…` | True | True |  |
| `01_Vision/Recovered_04_ZIP/02_VOLUME_I_STRATEGY/Cap_01_Executive_Summary.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `7ea5d10d47f4395f…` | `7ea5d10d47f4395f…` | True | True |  |
| `01_Vision/Recovered_04_ZIP/02_VOLUME_I_STRATEGY/Cap_02_Problem_Space.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `b15b588683022239…` | `b15b588683022239…` | True | True |  |
| `01_Vision/Recovered_04_ZIP/02_VOLUME_I_STRATEGY/Cap_03_Solution_Overview.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `875e8d0bec9bb872…` | `875e8d0bec9bb872…` | True | True |  |
| `01_Vision/Recovered_04_ZIP/02_VOLUME_I_STRATEGY/Cap_04_Differentiation.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `e3b85440987170b5…` | `e3b85440987170b5…` | True | True |  |
| `01_Vision/Recovered_04_ZIP/02_VOLUME_I_STRATEGY/Cap_05_Zone_0_Philippines.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `fce71274556ca33e…` | `fce71274556ca33e…` | True | True |  |
| `01_Vision/Recovered_04_ZIP/02_VOLUME_I_STRATEGY/INDEX.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `c929840b9c734d62…` | `c929840b9c734d62…` | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.0.0.1_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 8.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `f5305cce0afc4137…` | `f5305cce0afc4137…` | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLELE 8╤В╨Р╨г12.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `34fc1d7dfffa0f38…` | `34fc1d7dfffa0f38…` | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.0.1.0_ANEXA 8.A ╤В╨Р╨д MAPARE ROLURI ^0 PERMISIUNI (RBAC).docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `691bbc4980aae1e1…` | `691bbc4980aae1e1…` | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.0.1.1_ANEXA 8.B ╤В╨Р╨д ORDER LIFECYCLE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `2120dd11f3108210…` | `2120dd11f3108210…` | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.0.1.2_ANEXA 8.C ╤В╨Р╨д FALLBACK ^0 INTERVENтХЪ╨кIE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `e4aa2657254ee090…` | `e4aa2657254ee090…` | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.0.1.3_ANEXA 8.D ╤В╨Р╨д SUPERVIZARE PILOT.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `9d541a6aef66983f…` | `9d541a6aef66983f…` | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.0.1_ANEXE CAPITOLUL 8.docx` | `copied_from_extracted_masterplan` | `copied_byte_identical` | `43205a57777fc76b…` | `43205a57777fc76b…` | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.1.0_CAPITOLUL 8 ╤В╨Р╨д DEZVOLTAREA APLICAтХЪ╨кIEI DROPi -CORE OPERAтХЪ╨кIONAL.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `c2fecdd3c204f616…` | `c2fecdd3c204f616…` | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.X AbsenтХЪ╨лa marketplace-ului din aplicaтХЪ╨лia DROPi.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `32becfb28e5dd0af…` | `32becfb28e5dd0af…` | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.X.1_ALINIERE CAP. 8 ╤В╨Ц╨д CAP. 11.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `1d3492a6debe6ced…` | `1d3492a6debe6ced…` | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08.X.2_DIAGRAMтФА╨Т SECVENтХЪ╨кIALтФА╨Т CANONICтФА╨Т.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `e10278fe345ba85d…` | `e10278fe345ba85d…` | True | True |  |
| `02_Architecture/Application_Core/02_PRODUS & TEHNOLOGIE/08_DEZVOLTAREA APLICAтХЪ╨кIEI DROPi -EXECUтХЪ╨кIE PAS CU PAS.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `ff8975c413021374…` | `ff8975c413021374…` | True | True |  |
| `02_Architecture/Blueprint/DROPi_6_LAYERS_EXPLAINED.md` | `derived_from_blueprint` | `copied_byte_identical` | `3060a472fa580e1e…` | `3060a472fa580e1e…` | True | True |  |
| `02_Architecture/Core/ARCHITECTURE.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `db161869acf649cb…` | `db161869acf649cb…` | True | True |  |
| `02_Architecture/Core/canonical-structure.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `00afb48432a8fa0d…` | `00afb48432a8fa0d…` | True | True |  |
| `02_Architecture/Design/design.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `c3629ffbb7ff7ab7…` | `c3629ffbb7ff7ab7…` | True | True |  |
| `02_Architecture/Digital_Infrastructure/02_PRODUS & TEHNOLOGIE/14.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 14.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `29ed49ec2ad06ff3…` | `29ed49ec2ad06ff3…` | True | True |  |
| `02_Architecture/Digital_Infrastructure/02_PRODUS & TEHNOLOGIE/14.0_CAPITOLUL 14 ╤В╨Р╨д ARHITECTURA DIGITALтФА╨Т.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `2b2e495fe8b952dd…` | `2b2e495fe8b952dd…` | True | True |  |
| `02_Architecture/Digital_Infrastructure/02_PRODUS & TEHNOLOGIE/14_ARHITECTURA INFRASTRUCTURII DIGITALE DROPi.docx` | `copied_from_extracted_masterplan` | `copied_byte_identical` | `04335cb0d89f584a…` | `04335cb0d89f584a…` | True | True |  |
| `02_Architecture/Historical_Archive/SYSTEM_ARCHITECTURE.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `c0dc4c764abed169…` | `c0dc4c764abed169…` | True | True |  |
| `02_Architecture/Integrations/02_PRODUS & TEHNOLOGIE/15.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 15.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `9520a50dc9fbc4c5…` | `9520a50dc9fbc4c5…` | True | True |  |
| `02_Architecture/Integrations/02_PRODUS & TEHNOLOGIE/15.0_CAPITOLUL 15 ╤В╨Р╨д INTEGRARE & ECOSISTEM.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `317755a5f084396c…` | `317755a5f084396c…` | True | True |  |
| `02_Architecture/Integrations/02_PRODUS & TEHNOLOGIE/15.1_ANEXA 15.A ╤В╨Р╨д TIPURI DE INTEGRARE & DREPTURI.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `3b831f49e81aae2a…` | `3b831f49e81aae2a…` | True | True |  |
| `02_Architecture/Integrations/02_PRODUS & TEHNOLOGIE/15.2_ANEXA 15.B ╤В╨Р╨д MODEL API ^0 WEBHOOK.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `5cafd7a69b0ad319…` | `5cafd7a69b0ad319…` | True | True |  |
| `02_Architecture/Integrations/02_PRODUS & TEHNOLOGIE/15.3_ANEXA 15.C ╤В╨Р╨д CHECKLIST DE INTEGRARE PARTENER.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `59ee3787b121da6c…` | `59ee3787b121da6c…` | True | True |  |
| `02_Architecture/Integrations/02_PRODUS & TEHNOLOGIE/15.4_ANEXA 15.D ╤В╨Р╨д AUDIT - SUSPENDARE INTEGRARE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `07487122e5864eb8…` | `07487122e5864eb8…` | True | True |  |
| `02_Architecture/Integrations/02_PRODUS & TEHNOLOGIE/15_INTEGRARE -INTEROPERABILITATE тХЪ╨иI ECOSISTEM.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `4af4fc35a1418c29…` | `4af4fc35a1418c29…` | True | True |  |
| `03_Logistics/Delivery/DELIVERY_MULTIMODAL.md` | `copied_from_active_canonical` | `copied_byte_identical` | `6fdad4c3cd93ef13…` | `6fdad4c3cd93ef13…` | True | True |  |
| `03_Logistics/Delivery_Reference/canonical-delivery-reference.md` | `copied_from_active_canonical` | `copied_byte_identical` | `6fdad4c3cd93ef13…` | `6fdad4c3cd93ef13…` | True | True |  |
| `03_Logistics/Supervised_Autonomous_Delivery/02_PRODUS & TEHNOLOGIE/11.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 11.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `01bf14842d6e6f4a…` | `01bf14842d6e6f4a…` | True | True |  |
| `03_Logistics/Supervised_Autonomous_Delivery/02_PRODUS & TEHNOLOGIE/11.0.1ANEXA 11.A ╤В╨Р╨д SCENARII DE INTERVENтХЪ╨кIE PILOT.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `4699b46189c52643…` | `4699b46189c52643…` | True | True |  |
| `03_Logistics/Supervised_Autonomous_Delivery/02_PRODUS & TEHNOLOGIE/11.0.2_ANEXA 11.B ╤В╨Р╨д GESTIONARE INCIDENTE OPERAтХЪ╨кIONALE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `5965f1e4c5a15bdc…` | `5965f1e4c5a15bdc…` | True | True |  |
| `03_Logistics/Supervised_Autonomous_Delivery/02_PRODUS & TEHNOLOGIE/11.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 11.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `b0c1d301bb1ccdab…` | `b0c1d301bb1ccdab…` | True | True |  |
| `03_Logistics/Supervised_Autonomous_Delivery/02_PRODUS & TEHNOLOGIE/11.1_CAPITOLUL 11 ╤В╨Р╨д LIVRARE AUTONOMтФА╨Т SUPERVIZATтФА╨Т.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `aa2fdcf267dec36c…` | `aa2fdcf267dec36c…` | True | True |  |
| `03_Logistics/Supervised_Autonomous_Delivery/02_PRODUS & TEHNOLOGIE/11_LIVRAREA AUTONOMтФА╨Т SUPERVIZATтФА╨Т _PROCEDURI_LIMITE_FALLBACK_ AUDIT.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `94b61e8b0b154e8e…` | `94b61e8b0b154e8e…` | True | True |  |
| `04_DronePorts/MasterPlan/02_PRODUS & TEHNOLOGIE/09.0.0.1_ANEXA 9.A ╤В╨Р╨д EVENIMENTE DRONEPORT ^0 LOGARE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `b330f722b287b610…` | `b330f722b287b610…` | True | True |  |
| `04_DronePorts/MasterPlan/02_PRODUS & TEHNOLOGIE/09.0.0.2_ANEXA 9.B ╤В╨Р╨д PROCESE PERMISE - INTERZISE DRONEPORT.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `747808a50a843e95…` | `747808a50a843e95…` | True | True |  |
| `04_DronePorts/MasterPlan/02_PRODUS & TEHNOLOGIE/09.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLELE 9╤В╨Р╨г12.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `18dcefa0139f5d37…` | `18dcefa0139f5d37…` | True | True |  |
| `04_DronePorts/MasterPlan/02_PRODUS & TEHNOLOGIE/09.0.1_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 9.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `3128178c1ad4ec58…` | `3128178c1ad4ec58…` | True | True |  |
| `04_DronePorts/MasterPlan/02_PRODUS & TEHNOLOGIE/09_INFRASTRUCTURA DRONEPORT -STANDARD^LJ HARDWARE-J SOFTWARE-J PROCEDURI.docx` | `copied_from_extracted_masterplan` | `copied_byte_identical` | `091c67b0f6a92192…` | `091c67b0f6a92192…` | True | True |  |
| `05_Marketplace/Derived_Analyses/marketplace-canonical-analysis.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `c553513c98a274a4…` | `c553513c98a274a4…` | True | True |  |
| `05_Marketplace/Derived_Blueprints/BLUEPRINT_MARKETPLACE_DROPI.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `e8869925dc412bc5…` | `e8869925dc412bc5…` | True | True |  |
| `05_Marketplace/Implementation/MARKETPLACE_IMPLEMENTATION_PLAN.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `8b326199e1f4375c…` | `8b326199e1f4375c…` | True | True |  |
| `05_Marketplace/MasterPlan_Product/02_PRODUS & TEHNOLOGIE/06.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 6.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `5645626e95fed740…` | `5645626e95fed740…` | True | True |  |
| `05_Marketplace/MasterPlan_Product/02_PRODUS & TEHNOLOGIE/06.0_CAPITOLUL 6 ╤В╨Р╨д PRODUSUL DROPi.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `4af616df571bb21f…` | `4af616df571bb21f…` | True | True |  |
| `05_Marketplace/MasterPlan_Product/02_PRODUS & TEHNOLOGIE/06.1_ANEXA 6.A ╤В╨Р╨д HARTтФА╨Т PRODUS -PRODUCT MAP.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `cc4f64fd2a6a700f…` | `cc4f64fd2a6a700f…` | True | True |  |
| `05_Marketplace/MasterPlan_Product/02_PRODUS & TEHNOLOGIE/06.2_ANEXA 6.B ╤В╨Р╨д SEPARARE RESPONSABILITтФА╨ТтХЪ╨кI.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `582ad54e3beb8138…` | `582ad54e3beb8138…` | True | True |  |
| `05_Marketplace/MasterPlan_Product/02_PRODUS & TEHNOLOGIE/06.3_ANEXA 6.C ╤В╨Р╨д PRINCIPII DE DESIGN PRODUS.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `7b60091b10f8964f…` | `7b60091b10f8964f…` | True | True |  |
| `05_Marketplace/MasterPlan_Product/02_PRODUS & TEHNOLOGIE/06.4_ANEXA 6.D ╤В╨Р╨д REGULI DE EVOLUтХЪ╨кIE PRODUS.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `9b12069ccc7fe3a3…` | `9b12069ccc7fe3a3…` | True | True |  |
| `05_Marketplace/MasterPlan_Product/02_PRODUS & TEHNOLOGIE/06.5_ALINIERE CAP. 6 ╤В╨Ц╨д 7 ╤В╨Ц╨д 8.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `a3e95890753e3ba2…` | `a3e95890753e3ba2…` | True | True |  |
| `05_Marketplace/MasterPlan_Product/02_PRODUS & TEHNOLOGIE/06.X_Marketplace-ul DROPi ╤В╨Р╨д poziтХЪ╨лionare corectтФА╨У.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `5858e1660f418dbb…` | `5858e1660f418dbb…` | True | True |  |
| `05_Marketplace/MasterPlan_Product/02_PRODUS & TEHNOLOGIE/06_PRODUSUL DROPi (SITE ^M APLICAтХЪ╨кIE ^M INFRASTRUCTURтФА╨Т).docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `ec54b28c3adfb624…` | `ec54b28c3adfb624…` | True | True |  |
| `05_Marketplace/Recovered_04_ZIP/Cap_06_Product_DROPi/Anexa 6B тАФ Marketplace Controlat DROPi.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `65404dfe940f281f…` | `65404dfe940f281f…` | True | True |  |
| `05_Marketplace/Recovered_04_ZIP/Cap_06_Product_DROPi/B2B_Logistics_Partners.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `e4c313a050336747…` | `e4c313a050336747…` | True | True |  |
| `05_Marketplace/Recovered_04_ZIP/Cap_06_Product_DROPi/Cap_06_Product.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `783e9234ee0e6a6c…` | `783e9234ee0e6a6c…` | True | True |  |
| `05_Marketplace/Recovered_04_ZIP/Cap_06_Product_DROPi/Delivery_Multimodal.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `f57b444155061d7c…` | `f57b444155061d7c…` | True | True |  |
| `05_Marketplace/Recovered_04_ZIP/Cap_06_Product_DROPi/Marketplace_Financial_Flow.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `86a86921edada408…` | `86a86921edada408…` | True | True |  |
| `05_Marketplace/Recovered_04_ZIP/Cap_06_Product_DROPi/Pre_Orchestrare_Zonala.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `05215a4c60be102f…` | `05215a4c60be102f…` | True | True |  |
| `05_Marketplace/Recovered_04_ZIP/Cap_06_Product_DROPi/Pricing_Transparency.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `f1822a92bbd11a95…` | `f1822a92bbd11a95…` | True | True |  |
| `05_Marketplace/Recovered_04_ZIP/Cap_06_Product_DROPi/Reputation_Ranking_System.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `95d0cd351d5cb995…` | `95d0cd351d5cb995…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.0.0.0_CONSOLIDARE FINALтФА╨Т ╤В╨Р╨д VOLUMUL II.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `a52925836ff39476…` | `a52925836ff39476…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 7.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `434eabae96f182b1…` | `434eabae96f182b1…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.0.1_MAPARE COMPLETтФА╨Т CAPITOLE 7╤В╨Р╨г12.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `a877a997e80f1dc2…` | `a877a997e80f1dc2…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.0.2_CONSOLIDARE FINALтФА╨Т ╤В╨Р╨д VOLUMUL II.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `8a5ed52e657aba0d…` | `8a5ed52e657aba0d…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.1.1TABEL DE RISC LEGAL ╤В╨Р╨д APARIтХЪ╨кIE ACCIDENTALтФА╨Т PE SITE-UL DROPi.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `d390b588290b80a3…` | `d390b588290b80a3…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.1.2PROCEDURтФА╨Т OFICIALтФА╨Т ╤В╨Р╨д SITE INCIDENT RESPONSE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `269cb37b96e82266…` | `269cb37b96e82266…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.1.3_CHECKLIST QA ╤В╨Р╨д тФЬ╨ЮNAINTE DE FIECARE DEPLOY SITE DROPi.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `2d1dc5cc793493cb…` | `2d1dc5cc793493cb…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.1.4_ANEXтФА╨Т ╤В╨Р╨д PROCEDURтФА╨Т ROLLBACK POST-DEPLOY.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `b3bbdedd9e118830…` | `b3bbdedd9e118830…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.1_CE NU APARE NICIODATтФА╨Т PE SITE-UL DROPi.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `90a9d2148c11e7e0…` | `90a9d2148c11e7e0…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.2_RACI ╤В╨Р╨д APROBARE тХЪ╨иI RESPONSABILITтФА╨ТтХЪ╨кI SITE DROPi.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `90ede1e333a176c8…` | `90ede1e333a176c8…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.3_ANEXтФА╨Т ╤В╨Р╨д TEMPLATE ╤В╨Р╨оSAFE PUBLIC STATEMENTS╤В╨Р╨н.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `29ded0945787c7b0…` | `29ded0945787c7b0…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.4_ANEXтФА╨Т ╤В╨Р╨д SITE GOVERNANCE CHARTER.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `d52840c026eac2dc…` | `d52840c026eac2dc…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.5_CHECKLIST ╤В╨Р╨д PUBLIC APPEARANCE - INTERVIEW.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `6aa889a9648826b3…` | `6aa889a9648826b3…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.6.0_CHECKLIST ╤В╨Р╨д TRAINING INTERN -ONBOARDING COMUNICARE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `343325086c0b6e74…` | `343325086c0b6e74…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.6.1_TEST DE VALIDARE INTERNтФА╨Т ╤В╨Р╨д COMUNICARE PUBLICтФА╨Т (PASS -FAIL).docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `2744f1362f5f906f…` | `2744f1362f5f906f…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.6.2_CURRICULUM DE TRAINING INTERN ╤В╨Р╨д COMUNICARE PUBLICтФА╨Т DROPi.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `c845e17bacfcc3e4…` | `c845e17bacfcc3e4…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.6.3_FORMULAR INTERN ╤В╨Р╨д COMMUNICATION COMPLIANCE ACKNOWLEDGEMENT.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `3ac763e471b67b43…` | `3ac763e471b67b43…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.6_ANEXтФА╨Т ╤В╨Р╨д ╤В╨Р╨оRED LINES╤В╨Р╨н -SUBIECTE INTERZISE ABSOLUT.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `2d5c67655570003e…` | `2d5c67655570003e…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.X.1_ANEXA 7.X ╤В╨Р╨д REGULI DE DESIGN UI MARKETPLACE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `7eb5a86f8f76545d…` | `7eb5a86f8f76545d…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07.X_Marketplace-ul тФЬ╨╛n cadrul site-ului DROPi.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `cb351b434aa31cfc…` | `cb351b434aa31cfc…` | True | True |  |
| `05_Marketplace/Site_Governance/02_PRODUS & TEHNOLOGIE/07_DEZVOLTAREA SITE-ULUI DROPi -PRINCIPII тХЪ╨иI EXECUтХЪ╨кIE PAS CU PAS.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `24b69f360fc21fad…` | `24b69f360fc21fad…` | True | True |  |
| `06_Roles/AI_Agent_System/AI_AGENT_SYSTEM.md` | `copied_from_active_canonical` | `copied_byte_identical` | `17d6becbfd3ba6fa…` | `17d6becbfd3ba6fa…` | True | True |  |
| `06_Roles/Pilot_Selection/BLUEPRINT_PILOT_SELECTION_SYSTEM.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `167c4f30387d3829…` | `167c4f30387d3829…` | True | True |  |
| `06_Roles/Registration/DROPi_REGISTRATION_FLOW_REPORT.md` | `derived_from_blueprint` | `copied_byte_identical` | `1675799573de8834…` | `1675799573de8834…` | True | True |  |
| `07_Economy/Business_Legal_Scaling/03_BUSINESS, LEGAL & SCALARE/21_MODELUL ECONOMIC COMPLET DROPi.docx` | `copied_from_extracted_masterplan` | `copied_byte_identical` | `f1e01758aec675a2…` | `f1e01758aec675a2…` | True | True |  |
| `07_Economy/Business_Legal_Scaling/03_BUSINESS, LEGAL & SCALARE/22_GO-TO-MARKET FILIPINE _ZONA 0.docx` | `copied_from_extracted_masterplan` | `copied_byte_identical` | `60b9a6ffa79f7637…` | `60b9a6ffa79f7637…` | True | True |  |
| `07_Economy/Business_Legal_Scaling/03_BUSINESS, LEGAL & SCALARE/23_COMPLIANCE MULTI-тХЪ╨кARтФА╨Т тХЪ╨иI ADAPTAREA LA UNIUNEA EUROPEANтФА╨Т _EASA.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `008450d2076ce8e9…` | `008450d2076ce8e9…` | True | True |  |
| `07_Economy/Business_Legal_Scaling/03_BUSINESS, LEGAL & SCALARE/24_FRANCIZARE, OPERATORI ZONALI тХЪ╨иI REPLICARE GLOBALтФА╨Т.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `28e1fb91adc91876…` | `28e1fb91adc91876…` | True | True |  |
| `07_Economy/Business_Legal_Scaling/03_BUSINESS, LEGAL & SCALARE/25_STRATEGIA DE INVESTIтХЪ╨кII тХЪ╨иI FINANтХЪ╨кARE DROPi.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `b988aa86d1334b32…` | `b988aa86d1334b32…` | True | True |  |
| `07_Economy/Business_Legal_Scaling/03_BUSINESS, LEGAL & SCALARE/26_ROADMAP 0╤В╨Р╨г36 LUNI _EXECUтХЪ╨кIE DISCIPLINATтФА╨Т.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `494db0c89cb824bc…` | `494db0c89cb824bc…` | True | True |  |
| `07_Economy/Business_Legal_Scaling/03_BUSINESS, LEGAL & SCALARE/27_SCENARII DE EXIT тХЪ╨иI VIITORUL DROPi _REALIST_ NU SPECULATIV.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `2f02455a374f52ee…` | `2f02455a374f52ee…` | True | True |  |
| `07_Economy/KPI_Unit_Economics/02_PRODUS & TEHNOLOGIE/18.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 18.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `e1b831937aac36eb…` | `e1b831937aac36eb…` | True | True |  |
| `07_Economy/KPI_Unit_Economics/02_PRODUS & TEHNOLOGIE/18.0.1_ANEXA 18.A ╤В╨Р╨д LISTтФА╨Т KPI CANONICI.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `18b2b093cd659551…` | `18b2b093cd659551…` | True | True |  |
| `07_Economy/KPI_Unit_Economics/02_PRODUS & TEHNOLOGIE/18.0.2_ANEXA 18.B ╤В╨Р╨д STRUCTURтФА╨Т UNIT ECONOMICS.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `f4ad87b914606373…` | `f4ad87b914606373…` | True | True |  |
| `07_Economy/KPI_Unit_Economics/02_PRODUS & TEHNOLOGIE/18.0.3_ANEXA 18.C ╤В╨Р╨д PRAGURI KPI ^0 ESCALADARE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `8ce39c29c51a8643…` | `8ce39c29c51a8643…` | True | True |  |
| `07_Economy/KPI_Unit_Economics/02_PRODUS & TEHNOLOGIE/18.0.4_ANEXA 18.D ╤В╨Р╨д RAPORTARE KPI & AUDIT.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `787ba1f3233a4cf4…` | `787ba1f3233a4cf4…` | True | True |  |
| `07_Economy/KPI_Unit_Economics/02_PRODUS & TEHNOLOGIE/18.0_CAPITOLUL 18 ╤В╨Р╨д KPI-METRICI тХЪ╨иI UNIT ECONOMICS.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `c2a9bc24b315bd5a…` | `c2a9bc24b315bd5a…` | True | True |  |
| `07_Economy/KPI_Unit_Economics/02_PRODUS & TEHNOLOGIE/18_KPI_METRICI тХЪ╨иI UNIT ECONOMICS.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `c10aea82ce8d7383…` | `c10aea82ce8d7383…` | True | True |  |
| `07_Economy/Recovered_Contracts/Merchant_Terms.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `5163645eea9505b2…` | `5163645eea9505b2…` | True | True |  |
| `08_AI/DSS/02_PRODUS & TEHNOLOGIE/10.0.0.1_ANEXA 10.A ╤В╨Р╨д GUARDRAILS DSS -REGULI STRICTE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `59bff6602caccfa2…` | `59bff6602caccfa2…` | True | True |  |
| `08_AI/DSS/02_PRODUS & TEHNOLOGIE/10.0.0.2_ANEXA 10.B ╤В╨Р╨д EXEMPLE DE RECOMANDтФА╨ТRI DSS.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `6a13d3b305640bd8…` | `6a13d3b305640bd8…` | True | True |  |
| `08_AI/DSS/02_PRODUS & TEHNOLOGIE/10.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 10.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `8e71fb5617d17a15…` | `8e71fb5617d17a15…` | True | True |  |
| `08_AI/DSS/02_PRODUS & TEHNOLOGIE/10.1_CAPITOLUL 10 ╤В╨Р╨д AI ASISTAT -DSS.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `fd23eb346ca08e3f…` | `fd23eb346ca08e3f…` | True | True |  |
| `08_AI/DSS/02_PRODUS & TEHNOLOGIE/10_AI ASISTAT-ARHITECTURA DECIZIONALтФА╨Т DROPi.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `e0e79019a6e6cefc…` | `e0e79019a6e6cefc…` | True | True |  |
| `08_AI/Governance/AI_DEVELOPMENT_HANDOVER_CANON.md` | `copied_from_active_canonical` | `copied_byte_identical` | `9c9d2fafe3421af2…` | `9c9d2fafe3421af2…` | True | True |  |
| `09_Reference/Audit_Data_Protection/02_PRODUS & TEHNOLOGIE/12.0.0_ANEXA 12.A ╤В╨Р╨д STRUCTURтФА╨Т LOG-URI.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `9b7fd3078f028ca4…` | `9b7fd3078f028ca4…` | True | True |  |
| `09_Reference/Audit_Data_Protection/02_PRODUS & TEHNOLOGIE/12.0.1_ANEXA 12.B ╤В╨Р╨д POLITICтФА╨Т DE RETENтХЪ╨кIE DATE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `16e50bd6a547382e…` | `16e50bd6a547382e…` | True | True |  |
| `09_Reference/Audit_Data_Protection/02_PRODUS & TEHNOLOGIE/12.0.2_ANEXA 12.C ╤В╨Р╨д CHECKLIST GDPR COMPLIANCE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `d3650def87f6cd4b…` | `d3650def87f6cd4b…` | True | True |  |
| `09_Reference/Audit_Data_Protection/02_PRODUS & TEHNOLOGIE/12.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 12.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `1cbd0968af02e33f…` | `1cbd0968af02e33f…` | True | True |  |
| `09_Reference/Audit_Data_Protection/02_PRODUS & TEHNOLOGIE/12.1_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 12.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `11aace1f0b5b1454…` | `11aace1f0b5b1454…` | True | True |  |
| `09_Reference/Audit_Data_Protection/02_PRODUS & TEHNOLOGIE/12_SISTEMUL DE DATE_ LOG-URI_ TRASABILITATE тХЪ╨иI PROTECтХЪ╨кIA DATELOR.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `d9c32f49a38d8443…` | `d9c32f49a38d8443…` | True | True |  |
| `09_Reference/Blueprint/Analyses/DROPi_ROADMAP_COMPARISON.md` | `derived_from_blueprint` | `copied_byte_identical` | `732a3d90cea9f5b5…` | `732a3d90cea9f5b5…` | True | True |  |
| `09_Reference/Blueprint/DROPi_ROADMAP_BY_LAYERS.md` | `derived_from_blueprint` | `copied_byte_identical` | `5100dcda1e37e7a9…` | `5100dcda1e37e7a9…` | True | True |  |
| `09_Reference/Blueprint/Historical_Archive/IMPLEMENTATION_ROADMAP.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `1c8aaf6b2c6eeb5a…` | `1c8aaf6b2c6eeb5a…` | True | True |  |
| `09_Reference/Blueprint/INDEX.md` | `derived_from_blueprint` | `copied_byte_identical` | `bd56a057b7cad449…` | `bd56a057b7cad449…` | True | True |  |
| `09_Reference/Blueprint/Sprint_Roadmap/BLUEPRINT_SPRINT_ROADMAP.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `b2b1787b9383bff5…` | `b2b1787b9383bff5…` | True | True |  |
| `09_Reference/Blueprint/Sprint_Roadmap/DROPi_NEXT_SPRINT_TASKS.md` | `derived_from_blueprint` | `copied_byte_identical` | `de2cf8d28cbdc559…` | `de2cf8d28cbdc559…` | True | True |  |
| `09_Reference/Deployment/ADMIN_PROVISIONING.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `62da76ff58ed4ac9…` | `62da76ff58ed4ac9…` | True | True |  |
| `09_Reference/Deployment/BLUEPRINT_INDEPENDENT_DEPLOYMENT.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `008d7b5ef1c02e99…` | `008d7b5ef1c02e99…` | True | True |  |
| `09_Reference/Deployment/DEPLOYMENT.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `f1e3d7e110406e6f…` | `f1e3d7e110406e6f…` | True | True |  |
| `09_Reference/Deployment/Historical_Archive/DEPLOYMENT_GUIDE.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `c240c221642602dd…` | `c240c221642602dd…` | True | True |  |
| `09_Reference/Historical_Packages/Component_READMEs/BACKEND_README.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `7645fb1c3d5cb642…` | `7645fb1c3d5cb642…` | True | True |  |
| `09_Reference/Historical_Packages/Component_READMEs/MOBILE_APP_README.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `aeb4466465bef3b1…` | `aeb4466465bef3b1…` | True | True |  |
| `09_Reference/Historical_Packages/Component_READMEs/WEBSITE_README.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `8b3e2e2081a84e4f…` | `8b3e2e2081a84e4f…` | True | True |  |
| `09_Reference/Historical_RCA/AUTH_PASSWORD_RESET_RCA_2026-07-12.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `7bae653b2d4991fc…` | `7bae653b2d4991fc…` | True | True |  |
| `09_Reference/MasterPlan_Pack_Indexes/02_PRODUS & TEHNOLOGIE/00.0_CONSOLIDARE FINALтФА╨Т ╤В╨Р╨д VOLUMUL II.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `78db9ac13cbd71da…` | `78db9ac13cbd71da…` | True | True |  |
| `09_Reference/MasterPlan_Pack_Indexes/02_PRODUS & TEHNOLOGIE/00.1_PACHET INVESTITORI ╤В╨Р╨д EXECUTIVE ^LM AUDIT EXTRACTS.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `3e47bc205c4330a8…` | `3e47bc205c4330a8…` | True | True |  |
| `09_Reference/MasterPlan_Pack_Indexes/02_PRODUS & TEHNOLOGIE/00_CONSOLIDARE FINALтФА╨Т ╤В╨Р╨д VOLUMUL II.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `565fa5bc01d3ad23…` | `565fa5bc01d3ad23…` | True | True |  |
| `09_Reference/Mobile_Setup/MOBILE_FIRST_SETUP.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `85c3a164c1b7cc8a…` | `85c3a164c1b7cc8a…` | True | True |  |
| `09_Reference/Package_Metadata/inventory.json` | `unknown_or_unsupported` | `unsupported` | `dcc6a7be0631a2dc…` | `dcc6a7be0631a2dc…` | True | False | unsupported_no_deterministic_source |
| `09_Reference/Periodic_Updates/periodic-updates.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `c7b8c3a979de6380…` | `c7b8c3a979de6380…` | True | True |  |
| `09_Reference/Pitch/04_PITCH/00.0_DROPi ╤В╨Р╨д OFFICIAL PITCH DECK.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `0036339817c71f58…` | `0036339817c71f58…` | True | True |  |
| `09_Reference/Pitch/04_PITCH/00.1_DROPi ╤В╨Р╨д OFFICIAL SPEAKER NOTES (ENGLISH).docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `08dba02be32732df…` | `08dba02be32732df…` | True | True |  |
| `09_Reference/Pitch/04_PITCH/01.0_DROPi ╤В╨Р╨д PITCH DECK OFICIAL_RO.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `0ef250c950c74109…` | `0ef250c950c74109…` | True | True |  |
| `09_Reference/Pitch/04_PITCH/01.1_DROPi ╤В╨Р╨д SPEAKER NOTES OFICIALE (ROMтФЬ╨ТNтФА╨Т).docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `cfe6f295e2fa4180…` | `cfe6f295e2fa4180…` | True | True |  |
| `09_Reference/Pitch/04_PITCH/02.0_DROPi ╤В╨Р╨д OPISYAL NA PITCH DECK_TL.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `f56579e10ec29a7e…` | `f56579e10ec29a7e…` | True | True |  |
| `09_Reference/Pitch/04_PITCH/02.1_DROPi ╤В╨Р╨д SPEAKER NOTES (TAGALOG)_Para sa Opisyal na Pitch Deck.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `c5bf74d6e8be2c28…` | `c5bf74d6e8be2c28…` | True | True |  |
| `09_Reference/Pitch/04_PITCH/03.0_DROPi ╤В╨Р╨д OFFICIAL LGU -- GOVERNMENT PITCH.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `7729be7c8ba20896…` | `7729be7c8ba20896…` | True | True |  |
| `09_Reference/Pitch/PRESENTATION_SCRIPT.md` | `recovered_directly_from_04_zip` | `copied_with_path_or_filename_variant` | `a0fabd54d520a6bd…` | `a0fabd54d520a6bd…` | True | True |  |
| `09_Reference/ROADMAP.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `1e12ef14461f9bba…` | `1e12ef14461f9bba…` | True | True |  |
| `09_Reference/Risk_Management/02_PRODUS & TEHNOLOGIE/17.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 17.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `c906a53c0089d6c6…` | `c906a53c0089d6c6…` | True | True |  |
| `09_Reference/Risk_Management/02_PRODUS & TEHNOLOGIE/17.0.1_ANEXA 17.A ╤В╨Р╨д REGISTRU DE RISC.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `e0083a6a59d34c1e…` | `e0083a6a59d34c1e…` | True | True |  |
| `09_Reference/Risk_Management/02_PRODUS & TEHNOLOGIE/17.0.2_ANEXA 17.B ╤В╨Р╨д MATRICE RISC -PROBABILITATE тФЬ╨з IMPACT.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `bdc0cd3475c2d054…` | `bdc0cd3475c2d054…` | True | True |  |
| `09_Reference/Risk_Management/02_PRODUS & TEHNOLOGIE/17.0.3_ANEXA 17.C ╤В╨Р╨д PLANURI DE CONTINUITATE (BCP).docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `cc268902442ee921…` | `cc268902442ee921…` | True | True |  |
| `09_Reference/Risk_Management/02_PRODUS & TEHNOLOGIE/17.0.4_ANEXA 17.D ╤В╨Р╨д CHECKLIST MANAGEMENT RISC.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `06624f993d4c93af…` | `06624f993d4c93af…` | True | True |  |
| `09_Reference/Risk_Management/02_PRODUS & TEHNOLOGIE/17.0_CAPITOLUL 17 ╤В╨Р╨д MANAGEMENTUL RISCULUI.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `86e06d0fecb08841…` | `86e06d0fecb08841…` | True | True |  |
| `09_Reference/Risk_Management/02_PRODUS & TEHNOLOGIE/17_MANAGEMENTUL RISCULUI _OPERAтХЪ╨кIONAL_TEHNIC_ LEGAL тХЪ╨иI REPUTAтХЪ╨кIONAL.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `14213c65caaa8ce3…` | `14213c65caaa8ce3…` | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 19.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `5f9b57dbb8b93611…` | `5f9b57dbb8b93611…` | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19.0_CAPITOLUL 19 ╤В╨Р╨д CE NU FACE DROPi.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `cd7a177692e2ebb3…` | `cd7a177692e2ebb3…` | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19.1.1_ANEXA 19.A ╤В╨Р╨д LISTтФА╨Т DE EXCLUDERI OPERAтХЪ╨кIONALE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `4429fa2996cda540…` | `4429fa2996cda540…` | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19.1.2_ANEXA 19.B ╤В╨Р╨д LIMITтФА╨ТRI CONTRACTUALE STANDARD.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `763126d9c02215a9…` | `763126d9c02215a9…` | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19.1.3_ANEXA 19.C ╤В╨Р╨д GHID DE PREVENIRE A AтХЪ╨иTEPTтФА╨ТRILOR FALSE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `fbbfd8eea475e8fe…` | `fbbfd8eea475e8fe…` | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19.1.4_ANEXA 19.D ╤В╨Р╨д UTILIZARE тФЬ╨ЮN AUDIT si DUE DILIGENCE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `6ea1c8be45516157…` | `6ea1c8be45516157…` | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19.1.5_ANEXA 19.E ╤В╨Р╨д MECANISM DE APLICARE INTERNтФА╨Т.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `da4f270c01001831…` | `da4f270c01001831…` | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19.1.6_ANEXA 19.F ╤В╨Р╨д DECLARAтХЪ╨кIE DE POZIтХЪ╨кIONARE OFICIALтФА╨Т.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `f98bb785a5e4cd28…` | `f98bb785a5e4cd28…` | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19.1_ANEXE CAPITOLUL 19 ╤В╨Р╨д ╤В╨Р╨оCE NU FACE DROPi╤В╨Р╨н.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `9c2e83b6db671ce1…` | `9c2e83b6db671ce1…` | True | True |  |
| `09_Reference/Strategic_Boundaries/02_PRODUS & TEHNOLOGIE/19_CE NU FACE DROPi _DELIMITтФА╨ТRI STRATEGICE тХЪ╨иI DEFENSIVE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `838c2d7438198f06…` | `838c2d7438198f06…` | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13.0.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 13.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `f258996a614b3164…` | `f258996a614b3164…` | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13.0.0_AUDIT PACK OFICIAL ╤В╨Р╨д CAPITOLUL 13.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `df365bf871a39e12…` | `df365bf871a39e12…` | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13.0.1_CHECKLIST 13.A ╤В╨Р╨д TESTARE FUNCтХЪ╨кIONALтФА╨Т.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `45674f4631d24e7c…` | `45674f4631d24e7c…` | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13.0.2_CHECKLIST 13.B ╤В╨Р╨д TESTARE DE INTEGRARE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `7f7b4ba1de590087…` | `7f7b4ba1de590087…` | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13.0.3_CHECKLIST 13.C ╤В╨Р╨д TESTARE DE SIGURANтХЪ╨ктФА╨Т.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `7f9b1a40dfe9f7f2…` | `7f9b1a40dfe9f7f2…` | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13.0.4_CHECKLIST 13.D ╤В╨Р╨д TESTARE RBAC -ROLURI ^0 PERMISIUNI.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `191830910a4f5563…` | `191830910a4f5563…` | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13.0.5_CHECKLIST 13.E ╤В╨Р╨д CHECKLIST DE RELEASE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `f34beef8dc66b322…` | `f34beef8dc66b322…` | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13.0.6_CHECKLIST 13.F ╤В╨Р╨д ROLLBACK READINESS.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `515dad5b09b8c857…` | `515dad5b09b8c857…` | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13.0_CAPITOLUL 13 ╤В╨Р╨д TESTARE- QA - RELEASE DISCIPLINE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `92216800cefdf3ec…` | `92216800cefdf3ec…` | True | True |  |
| `09_Reference/Testing_Release/02_PRODUS & TEHNOLOGIE/13_TESTARE_ QA_DISCIPLINтФА╨Т DE RELEASE тХЪ╨иI ROLLBACK.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `5a436de255a0fe57…` | `5a436de255a0fe57…` | True | True |  |
| `09_Reference/Testing_Release/Blueprints/BLUEPRINT_TESTING_FORMAT.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `7425e21baf1c85e7…` | `7425e21baf1c85e7…` | True | True |  |
| `09_Reference/Testing_Release/Blueprints/BLUEPRINT_TESTING_REQUIREMENTS.md` | `derived_from_root_architecture_or_governance` | `copied_byte_identical` | `f28c34c260bf5543…` | `f28c34c260bf5543…` | True | True |  |
| `09_Reference/Volume_II_Conclusion/02_PRODUS & TEHNOLOGIE/20.0.1_ANEXA 20.A ╤В╨Р╨д CHECKLIST DE ELIGIBILITATE VOLUMUL III.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `54b6f6054f9cde9e…` | `54b6f6054f9cde9e…` | True | True |  |
| `09_Reference/Volume_II_Conclusion/02_PRODUS & TEHNOLOGIE/20.0.2_ANEXA 20.B ╤В╨Р╨д DECLARAтХЪ╨кIE OFICIALтФА╨Т DE тФЬ╨ЮNCHIDERE VOLUMUL II.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `26fa08bfb0cb86ae…` | `26fa08bfb0cb86ae…` | True | True |  |
| `09_Reference/Volume_II_Conclusion/02_PRODUS & TEHNOLOGIE/20.0.3_ANEXA 20.C ╤В╨Р╨д DECIZIE DE TRECERE -TEMPLATE.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `ec481202d9f2705a…` | `ec481202d9f2705a…` | True | True |  |
| `09_Reference/Volume_II_Conclusion/02_PRODUS & TEHNOLOGIE/20.0_CAPITOLUL 20 ╤В╨Р╨д CONCLUZIA VOLUMULUI II.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `dd5318de5767531d…` | `dd5318de5767531d…` | True | True |  |
| `09_Reference/Volume_II_Conclusion/02_PRODUS & TEHNOLOGIE/20_CONCLUZIA VOLUMULUI II тХЪ╨иI CRITERIILE DE TRECERE LA VOLUMUL III.docx` | `copied_from_extracted_masterplan` | `copied_with_path_or_filename_variant` | `8993f4fd2abada0d…` | `8993f4fd2abada0d…` | True | True |  |
| `AI_CANONICAL_REFERENCE_AUDIT_REPORT.md` | `package_control_document` | `package_control` | `aed212bb97cd0a3e…` | `aed212bb97cd0a3e…` | True | True |  |
| `CANONICAL_KNOWLEDGE_INDEX.md` | `package_control_document` | `package_control` | `2dba1c2d35f92d1b…` | `2dba1c2d35f92d1b…` | True | True |  |
| `CANONICAL_MANIFEST.md` | `package_control_document` | `package_control` | `c4271bb1dd46a295…` | `c4271bb1dd46a295…` | True | True |  |
| `README_FOR_DROPi_TYCOON.md` | `package_control_document` | `package_control` | `207ffa0ce3435f44…` | `207ffa0ce3435f44…` | True | True |  |

## 11. Package-control regeneration

Package-control documents are validated against their expected SHA-256 (from CAN-007)
and copied byte-for-byte. No timestamps or environment-specific data is generated.

| Package path | Expected SHA-256 | Actual SHA-256 | Certifiable |
| --- | --- | --- | --- |
| `AI_CANONICAL_REFERENCE_AUDIT_REPORT.md` | `aed212bb97cd0a3ef5f718ae803c603e58d5f518904272cc986fa39101a66037` | `aed212bb97cd0a3ef5f718ae803c603e58d5f518904272cc986fa39101a66037` | True |
| `CANONICAL_KNOWLEDGE_INDEX.md` | `2dba1c2d35f92d1b8f88adf37b993eda52c274aaaa43db26b21b1a6f82c5fe59` | `2dba1c2d35f92d1b8f88adf37b993eda52c274aaaa43db26b21b1a6f82c5fe59` | True |
| `CANONICAL_MANIFEST.md` | `c4271bb1dd46a295862b1767fff46a3bba80e949efd56f2f0143bbf9734f4503` | `c4271bb1dd46a295862b1767fff46a3bba80e949efd56f2f0143bbf9734f4503` | True |
| `README_FOR_DROPi_TYCOON.md` | `207ffa0ce3435f44d4e3603a97fb3a66b942efbcceb435f06e0ebb46d63356d4` | `207ffa0ce3435f44d4e3603a97fb3a66b942efbcceb435f06e0ebb46d63356d4` | True |

## 12. Missing sources

No missing sources.

## 13. Divergent outputs

No divergent outputs.

## 14. Unsupported files

The following files have no deterministic source established by CAN-007.
Existing package bytes are retained as a non-certifiable fallback.

- `00_Project/Status_Reports/AUDIT_TRACKING.md`
- `00_Project/Status_Reports/SESSION_STATE.md`
- `09_Reference/Package_Metadata/inventory.json`

## 15. Determinism evidence

| Property | Value |
| --- | --- |
| sorted_filesystem_traversal | True |
| sorted_zip_traversal | True |
| stable_json_serialization | True |
| stable_markdown_ordering | True |
| no_timestamps | True |
| no_uuids | True |
| no_random_values | True |
| no_environment_specific_paths | True |
| no_inode_order_dependency | True |
| no_temp_dir_path_leakage | True |
| no_cwd_dependency | True |
| no_locale_dependency | True |
| no_python_hash_randomization | True |
| deterministic_repetition_passed | True |

## 16. Certification status

**NOT CERTIFIABLE**

Reason: derived_transformation_algorithm_not_documented; unsupported_no_deterministic_source

Not-certifiable files: 4

Not-certifiable files detail:

| Package path | Failure reason |
| --- | --- |
| `00_Project/Governance/SESSION_HANDOVER.md` | derived_transformation_algorithm_not_documented |
| `00_Project/Status_Reports/AUDIT_TRACKING.md` | unsupported_no_deterministic_source |
| `00_Project/Status_Reports/SESSION_STATE.md` | unsupported_no_deterministic_source |
| `09_Reference/Package_Metadata/inventory.json` | unsupported_no_deterministic_source |

## 17. No-mutation statement

This regeneration process explicitly guarantees:

- `04.zip` was not modified.
- `canonical/` was not modified.
- `BLUEPRINT/` was not modified.
- `DROPi_Canonical_Reference/` was not modified during validation.
- No source file was renamed, deleted, or altered.
- No audit report from CAN-001 through CAN-007 was modified.
