import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const registerPath = "docs/legal/legal-source-register.json";
const register = JSON.parse(readFileSync(registerPath, "utf8"));
const byId = new Map(register.sources.map((source) => [source.id, source]));

const targets = [
  {
    id: "RO-OUG-13-2013-PORTAL-2026-09-15",
    path: "docs/legal/sources/ro/postal-delivery/RO-OUG-13-2013-PORTAL-2026-09-15.html",
    kind: "html",
    reliance: "pending_current_validation",
  },
  {
    id: "RO-ANCOM-DIGITAL-POSTAL-RESELLERS-2026-09-15",
    path: "docs/legal/sources/ro/postal-delivery/RO-ANCOM-DIGITAL-POSTAL-RESELLERS-2026-09-15.html",
    kind: "html",
    reliance: "research_only",
  },
  {
    id: "RO-OUG-34-2014-CURRENT",
    path: "docs/legal/sources/ro/consumer/RO-OUG-34-2014-CURRENT-2026-09-15.html",
    kind: "html",
    reliance: "research_only",
  },
  {
    id: "RO-OUG-18-2026",
    path: "docs/legal/sources/ro/consumer/RO-OUG-18-2026-2026-09-15.html",
    kind: "html",
    reliance: "research_only",
  },
  {
    id: "EU-REG-2022-2065-DSA",
    path: "docs/legal/sources/eu/dsa/EU-REG-2022-2065-DSA-2026-09-15.html",
    kind: "html",
    reliance: "research_only",
  },
  {
    id: "RO-LAW-50-2024",
    path: "docs/legal/sources/ro/dsa/RO-LAW-50-2024-2026-09-15.html",
    kind: "html",
    reliance: "research_only",
  },
  {
    id: "EU-REG-2023-988-GPSR-CONSOLIDATED-2026-05-29",
    path: "docs/legal/sources/eu/product-safety/EU-REG-2023-988-GPSR-CONSOLIDATED-2026-05-29-RETRIEVED-2026-09-15.html",
    kind: "html",
    reliance: "research_only",
  },
  {
    id: "RO-LAW-209-2019-CURRENT",
    path: "docs/legal/sources/ro/payments/RO-LAW-209-2019-CURRENT-2026-09-15.html",
    kind: "html",
    reliance: "research_only",
  },
  {
    id: "RO-LAW-190-2018-CURRENT",
    path: "docs/legal/sources/ro/data-protection/RO-LAW-190-2018-CURRENT-2026-09-15.html",
    kind: "html",
    reliance: "research_only",
  },
  {
    id: "RO-ONRC-CAEN-REV3-2026-09-15",
    path: "docs/legal/sources/ro/caen/RO-ONRC-CAEN-REV3-2026-09-15.pdf",
    kind: "pdf",
    reliance: "research_only",
  },
  {
    id: "RO-ONRC-CAEN-REV2-REV3-CORRESPONDENCE-2026-09-15",
    path: "docs/legal/sources/ro/caen/RO-ONRC-CAEN-REV2-REV3-CORRESPONDENCE-2026-09-15.pdf",
    kind: "pdf",
    reliance: "research_only",
  },
];

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function plausible(buffer, kind) {
  if (kind === "pdf") {
    return buffer.length > 5000 && buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  }
  const prefix = buffer.subarray(0, Math.min(buffer.length, 4096)).toString("utf8").toLowerCase();
  return buffer.length > 2500 && (prefix.includes("<!doctype") || prefix.includes("<html") || prefix.includes("<?xml"));
}

let archived = 0;
const failures = [];

for (const target of targets) {
  const source = byId.get(target.id);
  if (!source) {
    failures.push(`${target.id}: source record missing`);
    continue;
  }
  if (source.snapshot?.status === "archived") {
    console.log(`${target.id}: already archived`);
    continue;
  }

  try {
    const response = await fetch(source.officialUrl, {
      redirect: "follow",
      headers: {
        "user-agent": "DROPi legal evidence archiver/1.0 (+https://github.com/caliofmarian-ai/dropi-mobile)",
        accept: target.kind === "pdf" ? "application/pdf,*/*;q=0.8" : "text/html,application/xhtml+xml,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (!plausible(buffer, target.kind)) {
      throw new Error(`unexpected ${target.kind} payload (${buffer.length} bytes, content-type ${response.headers.get("content-type")})`);
    }

    mkdirSync(path.dirname(target.path), { recursive: true });
    writeFileSync(target.path, buffer);

    source.retrievedAt = "2026-09-15";
    source.snapshot = {
      status: "archived",
      path: target.path,
      sha256: sha256(buffer),
      bytes: buffer.length,
      immutable: true,
      qualifier: `Controlled byte snapshot fetched from the registered official URL on 2026-09-15. Archive proves reviewed bytes only; amendments, applicability, interpretation and later authority/provider changes remain separately gated.`,
    };
    source.reliance = {
      ...(source.reliance ?? {}),
      state: target.reliance,
      notes: `${source.reliance?.notes ?? ""} Controlled official bytes archived 2026-09-15; no operational approval implied.`.trim(),
    };

    archived += 1;
    console.log(`${target.id}: archived ${buffer.length} bytes ${source.snapshot.sha256}`);
  } catch (error) {
    failures.push(`${target.id}: ${error.message}`);
    console.warn(`${target.id}: left pending — ${error.message}`);
  }
}

register.generatedAt = "2026-09-15T00:00:00Z";
writeFileSync(registerPath, `${JSON.stringify(register, null, 2)}\n`);
console.log(`Archived ${archived} official sources; ${failures.length} remained pending.`);
if (failures.length) {
  for (const failure of failures) console.log(`PENDING ${failure}`);
}
