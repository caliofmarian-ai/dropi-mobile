import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const registerPath = path.join(
  repositoryRoot,
  "docs/legal/legal-source-register.json",
);
const sourceRoot = path.join(repositoryRoot, "docs/legal/sources");

const allowedAuthorityClasses = new Set([
  "primary_normative",
  "primary_official_guidance",
  "primary_judgment",
  "secondary_change_alert",
]);
const allowedRelianceStates = new Set([
  "research_only",
  "pending_current_validation",
  "missing_primary_copy",
  "cannot_enable",
]);
const archivedStatuses = new Set(["archived"]);
const nonArchivedStatuses = new Set([
  "pending_upstream_access",
  "pending_primary_copy",
  "metadata_only",
]);

const errors = [];

function fail(message) {
  errors.push(message);
}

function listFiles(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

let register;
try {
  register = JSON.parse(readFileSync(registerPath, "utf8"));
} catch (error) {
  console.error(`Legal source register is not valid JSON: ${error.message}`);
  process.exit(1);
}

if (register.schemaVersion !== "1.0.0") {
  fail(`Unsupported schemaVersion: ${String(register.schemaVersion)}`);
}

if (!Array.isArray(register.sources) || register.sources.length === 0) {
  fail("sources must be a non-empty array");
}

const sourceIds = new Set();
const registeredArchivePaths = new Set();

for (const [index, source] of (register.sources ?? []).entries()) {
  const label = source.id || `sources[${index}]`;

  if (typeof source.id !== "string" || source.id.length === 0) {
    fail(`${label}: id is required`);
  } else if (sourceIds.has(source.id)) {
    fail(`${label}: duplicate id`);
  } else {
    sourceIds.add(source.id);
  }

  for (const field of ["jurisdiction", "authority", "citation", "title"]) {
    if (typeof source[field] !== "string" || source[field].trim() === "") {
      fail(`${label}: ${field} is required`);
    }
  }

  if (
    !Array.isArray(source.serviceDomains) ||
    source.serviceDomains.length === 0 ||
    source.serviceDomains.some((domain) => typeof domain !== "string")
  ) {
    fail(`${label}: serviceDomains must be a non-empty string array`);
  }

  if (!allowedAuthorityClasses.has(source.authorityClass)) {
    fail(
      `${label}: unsupported authorityClass ${String(source.authorityClass)}`,
    );
  }

  if (typeof source.normative !== "boolean") {
    fail(`${label}: normative must be boolean`);
  }

  try {
    const sourceUrl = new URL(source.officialUrl);
    if (sourceUrl.protocol !== "https:") {
      fail(`${label}: officialUrl must use HTTPS`);
    }
  } catch {
    fail(`${label}: officialUrl must be a valid URL`);
  }

  if (!source.snapshot || typeof source.snapshot !== "object") {
    fail(`${label}: snapshot is required`);
    continue;
  }

  if (source.snapshot.immutable !== true) {
    fail(`${label}: snapshot.immutable must be true`);
  }

  if (!source.reliance || !allowedRelianceStates.has(source.reliance.state)) {
    fail(`${label}: invalid reliance.state`);
  }

  if (
    source.authorityClass === "secondary_change_alert" &&
    source.reliance?.state !== "cannot_enable"
  ) {
    fail(`${label}: secondary source must be cannot_enable`);
  }

  if (archivedStatuses.has(source.snapshot.status)) {
    const { path: relativePath, sha256: expectedHash, bytes } = source.snapshot;

    if (typeof relativePath !== "string") {
      fail(`${label}: archived snapshot path is required`);
      continue;
    }

    const normalizedRelativePath = relativePath.split("/").join(path.sep);
    const absolutePath = path.resolve(repositoryRoot, normalizedRelativePath);
    const relativeToSourceRoot = path.relative(sourceRoot, absolutePath);

    if (
      relativeToSourceRoot.startsWith("..") ||
      path.isAbsolute(relativeToSourceRoot)
    ) {
      fail(`${label}: archived snapshot must be inside docs/legal/sources`);
      continue;
    }

    if (registeredArchivePaths.has(relativePath)) {
      fail(
        `${label}: archived path is registered more than once: ${relativePath}`,
      );
    }
    registeredArchivePaths.add(relativePath);

    if (!existsSync(absolutePath)) {
      fail(`${label}: archived file does not exist: ${relativePath}`);
      continue;
    }

    const actualBytes = statSync(absolutePath).size;
    if (!Number.isInteger(bytes) || bytes !== actualBytes) {
      fail(
        `${label}: byte length mismatch (registered ${bytes}, actual ${actualBytes})`,
      );
    }

    const actualHash = sha256(absolutePath);
    if (
      !/^[a-f0-9]{64}$/.test(expectedHash ?? "") ||
      expectedHash !== actualHash
    ) {
      fail(
        `${label}: SHA-256 mismatch (registered ${expectedHash}, actual ${actualHash})`,
      );
    }

    if (typeof source.retrievedAt !== "string") {
      fail(`${label}: archived source requires retrievedAt`);
    }
  } else if (nonArchivedStatuses.has(source.snapshot.status)) {
    for (const forbiddenField of ["path", "sha256", "bytes"]) {
      if (forbiddenField in source.snapshot) {
        fail(
          `${label}: ${source.snapshot.status} snapshot must not contain ${forbiddenField}`,
        );
      }
    }
  } else {
    fail(
      `${label}: unsupported snapshot.status ${String(source.snapshot.status)}`,
    );
  }
}

for (const absolutePath of listFiles(sourceRoot)) {
  const relativePath = path
    .relative(repositoryRoot, absolutePath)
    .split(path.sep)
    .join("/");
  if (!registeredArchivePaths.has(relativePath)) {
    fail(`Unregistered file in legal source corpus: ${relativePath}`);
  }
}

if (errors.length > 0) {
  console.error("Legal source validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Legal source validation passed: ${register.sources.length} records, ${registeredArchivePaths.size} immutable files.`,
);
