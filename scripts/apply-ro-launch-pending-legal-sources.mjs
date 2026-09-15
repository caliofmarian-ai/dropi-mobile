import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const registerPath = resolve("docs/legal/legal-source-register.json");
const register = JSON.parse(readFileSync(registerPath, "utf8"));

const entries = [
  {
    id: "RO-OUG-13-2013-PORTAL-2026-09-15",
    jurisdiction: "RO",
    serviceDomains: ["parcel_delivery"],
    authority: "Government of Romania / Romanian Legislative Portal",
    citation: "Emergency Ordinance No. 13/2013 — official consolidation interface verified 2026-09-15",
    title: "Postal services — official Legislative Portal source",
    authorityClass: "primary_normative",
    normative: true,
    officialUrl: "https://legislatie.just.ro/Public/DetaliiDocumentAfis/217438",
    language: "ro",
    retrievedAt: "2026-09-15",
    snapshot: {
      status: "pending_primary_copy",
      immutable: true,
      qualifier: "Official Legislative Portal endpoint identified. Controlled repository bytes/hash are not yet archived; visible consolidation history must be reconciled with current ANCOM guidance before reliance."
    },
    reliance: {
      state: "pending_current_validation",
      reviewBy: "before_ro_delivery_role_design",
      notes: "Does not replace the stale 2019 ANCOM snapshot until a controlled current primary copy and applicability review exist."
    }
  },
  {
    id: "RO-ANCOM-DIGITAL-POSTAL-RESELLERS-2026-09-15",
    jurisdiction: "RO",
    serviceDomains: ["parcel_delivery"],
    authority: "National Authority for Management and Regulation in Communications",
    citation: "ANCOM guidance for digital platforms reselling postal services, verified 2026-09-15",
    title: "Digital platforms reselling postal services",
    authorityClass: "primary_official_guidance",
    normative: false,
    officialUrl: "https://infocentru.ancom.ro/platformele-digitale-care-revand-servicii-postale/",
    language: "ro",
    retrievedAt: "2026-09-15",
    snapshot: {
      status: "pending_primary_copy",
      immutable: true,
      qualifier: "Official ANCOM guidance endpoint verified; controlled HTML snapshot/hash remains to be archived."
    },
    reliance: {
      state: "missing_primary_copy",
      reviewBy: "before_ro_postal_resale_design",
      notes: "Supports reseller/effective-provider disclosure analysis; controlling law and Decision 925/2023 still govern."
    }
  },
  {
    id: "RO-ANCOM-POSTAL-RESELLER-REGISTER-2026-09-15",
    jurisdiction: "RO",
    serviceDomains: ["parcel_delivery"],
    authority: "National Authority for Management and Regulation in Communications",
    citation: "ANCOM list of postal-service resellers, verified 2026-09-15",
    title: "Postal providers reselling postal services",
    authorityClass: "primary_official_guidance",
    normative: false,
    officialUrl: "https://www.ancom.ro/reglementare-ro/servicii-postale/furnizori-servicii-postale/furnizori-servicii-postale-revanzatori/",
    language: "ro",
    retrievedAt: "2026-09-15",
    snapshot: {
      status: "metadata_only",
      immutable: true,
      qualifier: "Dynamic official register/list endpoint. A controlled verification method and time-stamped evidence are required for provider checks."
    },
    reliance: {
      state: "research_only",
      reviewBy: "before_carrier_or_reseller_authority_verification",
      notes: "Dynamic list is evidence source, not a permanent authorization assertion."
    }
  },
  {
    id: "RO-OUG-34-2014-CURRENT",
    jurisdiction: "RO",
    serviceDomains: ["marketplace", "consumer_contracts"],
    authority: "Government of Romania",
    citation: "Emergency Ordinance No. 34/2014 — consolidated Legislative Portal form verified 2026-09-15",
    title: "Consumer rights in contracts concluded with professionals",
    authorityClass: "primary_normative",
    normative: true,
    officialUrl: "https://legislatie.just.ro/Public/DetaliiDocument/307805",
    language: "ro",
    retrievedAt: "2026-09-15",
    snapshot: {
      status: "pending_primary_copy",
      immutable: true,
      qualifier: "Official consolidated Portal endpoint verified, including 2026 amendment annotations; controlled repository copy/hash remains pending."
    },
    reliance: {
      state: "missing_primary_copy",
      reviewBy: "before_ro_marketplace_design",
      notes: "Article 6^1 Marketplace disclosures and Article 11^1 withdrawal flow require exact provision-to-control review."
    }
  },
  {
    id: "RO-OUG-18-2026",
    jurisdiction: "RO",
    serviceDomains: ["marketplace", "consumer_contracts"],
    authority: "Government of Romania",
    citation: "Emergency Ordinance No. 18/2026",
    title: "2026 amendments to Romanian consumer distance-contract law",
    authorityClass: "primary_normative",
    normative: true,
    officialUrl: "https://legislatie.just.ro/Public/DetaliiDocumentAfis/308474",
    language: "ro",
    retrievedAt: "2026-09-15",
    snapshot: {
      status: "pending_primary_copy",
      immutable: true,
      qualifier: "Official act endpoint verified; controlled repository copy/hash remains pending."
    },
    reliance: {
      state: "missing_primary_copy",
      reviewBy: "before_ro_marketplace_design",
      notes: "Application dates include 19 June 2026 for Article II point 13 (online withdrawal function) and 27 September 2026 for specified other amendments."
    }
  },
  {
    id: "EU-REG-2022-2065-DSA",
    jurisdiction: "EU",
    serviceDomains: ["marketplace", "intermediary_services"],
    authority: "European Union",
    citation: "Regulation (EU) 2022/2065",
    title: "Digital Services Act",
    authorityClass: "primary_normative",
    normative: true,
    officialUrl: "https://eur-lex.europa.eu/eli/reg/2022/2065/oj",
    language: "en",
    retrievedAt: "2026-09-15",
    snapshot: {
      status: "pending_primary_copy",
      immutable: true,
      qualifier: "Official EUR-Lex endpoint verified; controlled repository copy/hash remains pending."
    },
    reliance: {
      state: "missing_primary_copy",
      reviewBy: "before_ro_dsa_design",
      notes: "Article 19 and Article 29 micro/small exclusions require enterprise-size and service-scope analysis; they do not remove all DSA duties."
    }
  },
  {
    id: "RO-LAW-50-2024",
    jurisdiction: "RO",
    serviceDomains: ["marketplace", "intermediary_services"],
    authority: "Parliament of Romania",
    citation: "Law No. 50/2024",
    title: "Romanian measures for application of Regulation (EU) 2022/2065",
    authorityClass: "primary_normative",
    normative: true,
    officialUrl: "https://legislatie.just.ro/public/DetaliiDocument/280106",
    language: "ro",
    retrievedAt: "2026-09-15",
    snapshot: {
      status: "pending_primary_copy",
      immutable: true,
      qualifier: "Official Legislative Portal endpoint verified; controlled repository copy/hash remains pending."
    },
    reliance: {
      state: "missing_primary_copy",
      reviewBy: "before_ro_dsa_design",
      notes: "Romanian DSA implementation/coordination and sanction framework."
    }
  },
  {
    id: "EU-REG-2023-988-GPSR-CONSOLIDATED-2026-05-29",
    jurisdiction: "EU",
    serviceDomains: ["marketplace", "product_safety"],
    authority: "European Union",
    citation: "Regulation (EU) 2023/988, consolidated 2026-05-29",
    title: "General Product Safety Regulation",
    authorityClass: "primary_normative",
    normative: true,
    officialUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02023R0988-20260529",
    language: "en",
    retrievedAt: "2026-09-15",
    snapshot: {
      status: "pending_primary_copy",
      immutable: true,
      qualifier: "Official consolidated EUR-Lex endpoint verified; controlled repository PDF/hash remains pending."
    },
    reliance: {
      state: "missing_primary_copy",
      reviewBy: "before_ro_marketplace_product_activation",
      notes: "Article 22 Marketplace product-safety controls require provision-to-control mapping and category review."
    }
  },
  {
    id: "RO-LAW-209-2019-CURRENT",
    jurisdiction: "RO",
    serviceDomains: ["payments", "marketplace"],
    authority: "Parliament of Romania",
    citation: "Law No. 209/2019 — Legislative Portal form verified 2026-09-15",
    title: "Payment services",
    authorityClass: "primary_normative",
    normative: true,
    officialUrl: "https://legislatie.just.ro/Public/DetaliiDocument/219736",
    language: "ro",
    retrievedAt: "2026-09-15",
    snapshot: {
      status: "pending_primary_copy",
      immutable: true,
      qualifier: "Official Legislative Portal endpoint verified; controlled repository copy/hash remains pending."
    },
    reliance: {
      state: "missing_primary_copy",
      reviewBy: "before_ro_live_payments",
      notes: "Payment perimeter still requires selected-PSP and exact money-flow review."
    }
  },
  {
    id: "RO-LAW-190-2018-CURRENT",
    jurisdiction: "RO",
    serviceDomains: ["all"],
    authority: "Parliament of Romania",
    citation: "Law No. 190/2018 — Legislative Portal form verified 2026-09-15",
    title: "Romanian measures implementing Regulation (EU) 2016/679",
    authorityClass: "primary_normative",
    normative: true,
    officialUrl: "https://legislatie.just.ro/Public/DetaliiDocument/203151",
    language: "ro",
    retrievedAt: "2026-09-15",
    snapshot: {
      status: "pending_primary_copy",
      immutable: true,
      qualifier: "Official Legislative Portal endpoint verified; controlled repository copy/hash remains pending."
    },
    reliance: {
      state: "missing_primary_copy",
      reviewBy: "before_ro_personal_data_design",
      notes: "Use with GDPR and current ANSPDCP/EDPB guidance; does not by itself determine launch retention or DPIA."
    }
  },
  {
    id: "RO-ONRC-CAEN-REV3-2026-09-15",
    jurisdiction: "RO",
    serviceDomains: ["marketplace", "parcel_delivery", "platform_intermediation"],
    authority: "National Trade Register Office",
    citation: "CAEN Rev.3 complete structure — official ONRC-hosted copy verified 2026-09-15",
    title: "CAEN Rev.3 complete structure",
    authorityClass: "primary_official_guidance",
    normative: false,
    officialUrl: "https://www.onrc.ro/documente/caen/CAEN_Rev.3_structura_completa.pdf",
    language: "ro",
    retrievedAt: "2026-09-15",
    snapshot: {
      status: "pending_primary_copy",
      immutable: true,
      qualifier: "Official ONRC-hosted PDF identified; repository binary/hash remains to be archived."
    },
    reliance: {
      state: "missing_primary_copy",
      reviewBy: "before_ro_entity_filing",
      notes: "Confirms classification labels including 4791/4792/5320/5330; classification does not substitute for sector authorization."
    }
  },
  {
    id: "RO-ONRC-CAEN-REV2-REV3-CORRESPONDENCE-2026-09-15",
    jurisdiction: "RO",
    serviceDomains: ["marketplace", "parcel_delivery", "platform_intermediation"],
    authority: "National Trade Register Office",
    citation: "CAEN Rev.2 to Rev.3 correspondence — official ONRC-hosted copy verified 2026-09-15",
    title: "CAEN Rev.2 / CAEN Rev.3 correspondence",
    authorityClass: "primary_official_guidance",
    normative: false,
    officialUrl: "https://www.onrc.ro/documente/anunturi/Corespondenta-CAEN-Rev.2-CAEN-Rev.3.pdf",
    language: "ro",
    retrievedAt: "2026-09-15",
    snapshot: {
      status: "pending_primary_copy",
      immutable: true,
      qualifier: "Official ONRC-hosted PDF identified; repository binary/hash remains to be archived."
    },
    reliance: {
      state: "missing_primary_copy",
      reviewBy: "before_ro_entity_filing",
      notes: "Describes 5330 as intermediation without the intermediary itself providing postal/courier service; factual ANCOM role remains separately classified."
    }
  }
];

const existing = new Set(register.sources.map((source) => source.id));
let added = 0;
for (const entry of entries) {
  if (!existing.has(entry.id)) {
    register.sources.push(entry);
    existing.add(entry.id);
    added += 1;
  }
}

register.generatedAt = "2026-09-15T00:00:00Z";
writeFileSync(registerPath, `${JSON.stringify(register, null, 2)}\n`);
console.log(`Added ${added} pending Romania launch legal-source records.`);
