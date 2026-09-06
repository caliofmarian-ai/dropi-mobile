import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("VER-378 governed verification evidence lifecycle", () => {
  it("materializes one-to-five ordered private evidence attachments in Drizzle and migration 0022", () => {
    const schema = source("drizzle/verification-evidence-schema.ts");
    const config = source("drizzle.config.ts");
    const migration = source("drizzle/0022_verification_evidence_attachments.sql");
    const journal = source("drizzle/meta/_journal.json");

    expect(config).toContain('"./drizzle/verification-evidence-schema.ts"');
    expect(schema).toContain('"verificationEvidenceAttachments"');
    expect(schema).toContain('references(() => verifications.id, { onDelete: "cascade" })');
    expect(schema).toContain('references(() => dropiAccountMedia.mediaUid, { onDelete: "restrict" })');
    expect(schema).toContain('["front", "back", "page", "evidence"]');
    expect(schema).toContain("ordinal");
    expect(schema).toContain("byteLength");
    expect(schema).toContain("sha256");
    expect(migration).toContain("CREATE TABLE `verificationEvidenceAttachments`");
    expect(migration).toContain("ON DELETE CASCADE");
    expect(migration).toContain("ON DELETE RESTRICT");
    expect(journal).toContain('"tag": "0022_verification_evidence_attachments"');
  });

  it("binds only owner-controlled DROPi verification media and submits the record plus attachments transactionally", () => {
    const router = source("server/delivery-verification-router.ts");

    expect(router).toContain("const MAX_EVIDENCE_ATTACHMENTS = 5");
    expect(router).toContain("z.array(evidenceSchema).min(1).max(MAX_EVIDENCE_ATTACHMENTS)");
    expect(router).toContain("The same evidence file cannot be attached twice");
    expect(router).toContain('eq(dropiAccountMedia.ownerId, userId)');
    expect(router).toContain('eq(dropiAccountMedia.purpose, "verification_document")');
    expect(router).toContain("mediaRows.length !== mediaUids.length");
    expect(router).toContain("await db.transaction(async (tx) =>");
    expect(router).toContain("tx.insert(verificationEvidenceAttachments)");
    expect(router).toContain("compatibilityUrl");
  });

  it("keeps single-URL history explicit while verifying every new attachment independently", () => {
    const media = source("server/verification-media-router.ts");

    expect(media).toContain('evidenceModel: "multi_attachment"');
    expect(media).toContain('evidenceModel: "legacy_single_url"');
    expect(media).toContain("attachmentRows.map((attachment) =>");
    expect(media).toContain("assertMediaIntegrity({");
    expect(media).toContain("Verification evidence metadata integrity check failed");
    expect(media).toContain("Verification evidence integrity check failed");
    expect(media).toContain("attachments,");
  });

  it("accepts only the governed image/PDF MIME set and storage validates matching file signatures", () => {
    const router = source("server/delivery-verification-router.ts");
    const storage = source("server/storage.ts");

    for (const mime of ["image/jpeg", "image/png", "image/webp", "application/pdf"]) {
      expect(router).toContain(`"${mime}"`);
      expect(storage).toContain(mime);
    }
    expect(storage).toContain('buffer.subarray(0, 5).toString("ascii") === "%PDF-"');
    expect(storage).toContain("Uploaded bytes do not match declared content type");
  });

  it("supports Android multi-image, repeated camera capture and PDF Files selection without a new picker module", () => {
    const screen = source("app/verify-documents.tsx");
    const pkg = source("package.json");

    expect(screen).toContain("allowsMultipleSelection: true");
    expect(screen).toContain("selectionLimit: remaining");
    expect(screen).toContain("handleTakePhoto");
    expect(screen).toContain("appendEvidence([");
    expect(screen).toContain('require("expo-file-system")');
    expect(screen).toContain('File.pickFileAsync(undefined, "application/pdf")');
    expect(screen).toContain("1–5 files");
    expect(pkg).not.toContain('"expo-document-picker"');
  });

  it("shows all verified attachments to Admin and preserves native PDF viewing", () => {
    const approvals = source("app/admin/approvals.tsx");

    expect(approvals).toContain("Review All Private Evidence");
    expect(approvals).toContain("evidenceBundle?.attachments.map");
    expect(approvals).toContain("Integrity verified");
    expect(approvals).toContain("openPdfPreview(attachment)");
    expect(approvals).toContain("getContentUriAsync");
    expect(approvals).toContain("data:${attachment.contentType};base64,${attachment.dataBase64}");
  });

  it("shows textual lifecycle states and keeps operational authority aligned with issue 373", () => {
    const screen = source("app/verify-documents.tsx");
    const lifecycle = source("shared/verification-lifecycle.ts");

    expect(lifecycle).toContain("VERIFICATION_EXPIRY_WARNING_DAYS = 30");
    expect(lifecycle).toContain('state: "expiring"');
    expect(lifecycle).toContain('state: "expired"');
    expect(lifecycle).toContain('label: "Pending review"');
    expect(lifecycle).toContain('label: "Rejected"');
    expect(lifecycle).toContain("Expiring · expires in");
    expect(lifecycle).toContain('label: "Expired"');
    expect(screen).toContain("{lifecycle.label}");
    expect(screen).toContain("Expiry:");
    expect(screen).toContain("Mission access requires an approved, unexpired driving or drone license.");
    expect(screen).toContain("Insurance, registration, background checks and other approved documents do not unlock missions by themselves.");
  });
});
