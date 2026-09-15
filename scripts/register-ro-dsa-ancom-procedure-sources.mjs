import { readFileSync, writeFileSync } from "node:fs";

const path = "docs/legal/legal-source-register.json";
const register = JSON.parse(readFileSync(path, "utf8"));
const existing = new Set(register.sources.map((source) => source.id));

const entries = [
  {
    id: "RO-ANCOM-DSA-PROCEDURE-CONSULTATION-2024",
    jurisdiction: "RO",
    serviceDomains: ["marketplace", "intermediary_services"],
    authority: "National Authority for Management and Regulation in Communications",
    citation: "ANCOM consultation draft — information procedure for intermediary-service providers, 2024",
    title: "Draft information procedure for intermediary-service providers",
    authorityClass: "primary_official_guidance",
    normative: false,
    officialUrl: "https://www.ancom.ro/consultare/proiect-de-decizie-privind-procedura-de-informare-pentru-furnizorii-de-servicii-intermediare-o-noua-versiune-a-proiectului-de-decizie/",
    language: "ro",
    retrievedAt: "2026-09-15",
    snapshot: {
      status: "pending_primary_copy",
      immutable: true,
      qualifier: "Official consultation material identified. It is a draft/proposal and must never be treated as the final Article 5 procedure without an adopted current ANCOM act."
    },
    reliance: {
      state: "pending_current_validation",
      reviewBy: "before_ro_dsa_filing_or_service_start",
      notes: "Discovery/legislative-history evidence only; cannot enable or define a production filing form."
    }
  },
  {
    id: "RO-ANCOM-ACTION-PLAN-2026",
    jurisdiction: "RO",
    serviceDomains: ["marketplace", "intermediary_services"],
    authority: "National Authority for Management and Regulation in Communications",
    citation: "ANCOM 2026 action-plan consultation — digital services section",
    title: "ANCOM 2026 action-plan material concerning DSA secondary legislation",
    authorityClass: "primary_official_guidance",
    normative: false,
    officialUrl: "https://www.ancom.ro/despre-noi/media/comunicate-de-presa/ancom-consulta-proiectul-planului-de-actiuni-pentru-anul-2026/",
    language: "ro",
    retrievedAt: "2026-09-15",
    snapshot: {
      status: "pending_primary_copy",
      immutable: true,
      qualifier: "Official ANCOM page identified; controlled snapshot still pending. The page states the intermediary-provider information procedure is planned for development in 2026."
    },
    reliance: {
      state: "research_only",
      reviewBy: "before_ro_dsa_filing_or_service_start",
      notes: "Supports keeping the 2024 consultation draft non-final; recheck ANCOM immediately before any Article 5 filing."
    }
  },
  {
    id: "RO-ANCOM-DECISION-333-2024-CURRENT",
    jurisdiction: "RO",
    serviceDomains: ["marketplace", "intermediary_services", "parcel_delivery"],
    authority: "National Authority for Management and Regulation in Communications",
    citation: "ANCOM Decision No. 333/2024 — current Legislative Portal form",
    title: "Communication of documents through My ANCOM",
    authorityClass: "primary_normative",
    normative: true,
    officialUrl: "https://legislatie.just.ro/Public/DetaliiDocument/285331",
    language: "ro",
    retrievedAt: "2026-09-15",
    snapshot: {
      status: "pending_primary_copy",
      immutable: true,
      qualifier: "Official current Legislative Portal endpoint identified; controlled repository snapshot remains pending. Current form includes Romanian intermediary-service providers among eligible My ANCOM beneficiaries."
    },
    reliance: {
      state: "missing_primary_copy",
      reviewBy: "before_ro_dsa_filing_or_my_ancom_workflow",
      notes: "Electronic-communications framework evidence; does not by itself establish the final Law 50/2024 Article 5 information procedure."
    }
  },
  {
    id: "RO-ANCOM-DECISION-463-2025",
    jurisdiction: "RO",
    serviceDomains: ["marketplace", "intermediary_services", "parcel_delivery"],
    authority: "National Authority for Management and Regulation in Communications",
    citation: "ANCOM Decision No. 463/2025",
    title: "Amendment of Decision No. 333/2024 concerning My ANCOM",
    authorityClass: "primary_normative",
    normative: true,
    officialUrl: "https://legislatie.just.ro/Public/DetaliiDocument/301520?isFormaDeBaza=True&rep=True",
    language: "ro",
    retrievedAt: "2026-09-15",
    snapshot: {
      status: "pending_primary_copy",
      immutable: true,
      qualifier: "Official Legislative Portal endpoint identified; controlled repository snapshot remains pending."
    },
    reliance: {
      state: "missing_primary_copy",
      reviewBy: "before_ro_dsa_filing_or_my_ancom_workflow",
      notes: "Read with the current consolidated Decision 333/2024; does not substitute for a separately adopted Article 5 information procedure."
    }
  }
];

let added = 0;
for (const entry of entries) {
  if (!existing.has(entry.id)) {
    register.sources.push(entry);
    existing.add(entry.id);
    added += 1;
  }
}

register.generatedAt = "2026-09-15T00:00:00Z";
writeFileSync(path, `${JSON.stringify(register, null, 2)}\n`);
console.log(`Added ${added} ANCOM DSA procedure source records.`);
