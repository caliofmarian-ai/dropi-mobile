import { createHash, randomUUID } from "node:crypto";
import { and, eq, or } from "drizzle-orm";
import { dropiAccountMedia } from "../drizzle/account-media-schema";
import { getDb } from "./db";

export type DropiMediaPurpose =
  | "profile_photo"
  | "verification_document"
  | "generated_asset"
  | "private_asset";

const PURPOSE_ROUTE: Record<DropiMediaPurpose, string> = {
  profile_photo: "profile",
  verification_document: "verification",
  generated_asset: "generated",
  private_asset: "private",
};

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "").replace(/\\/g, "/");
}

function classifyPurpose(key: string): DropiMediaPurpose {
  if (key.startsWith("profile-photos/")) return "profile_photo";
  if (key.startsWith("verifications/")) return "verification_document";
  if (key.startsWith("generated/")) return "generated_asset";
  return "private_asset";
}

function inferOwnerId(key: string): number | null {
  const match = key.match(/(?:^|\/)user_(\d+)(?:[/. _-]|$)/i);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function safeFileName(key: string): string {
  const segment = key.split("/").pop() || "file";
  const sanitized = segment.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 255);
  return sanitized || "file";
}

function mediaUrl(purpose: DropiMediaPurpose, mediaUid: string, sha256: string): string {
  return `/api/dropi-media/${PURPOSE_ROUTE[purpose]}/${mediaUid}/${sha256}`;
}

function assertKnownFileSignature(buffer: Buffer, contentType: string, purpose: DropiMediaPurpose): void {
  if (purpose !== "profile_photo" && purpose !== "verification_document") return;

  const jpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const png = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  const pdf = buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-";

  const valid =
    (contentType === "image/jpeg" && jpeg) ||
    (contentType === "image/png" && png) ||
    (contentType === "image/webp" && webp) ||
    (contentType === "application/pdf" && purpose === "verification_document" && pdf);

  if (!valid) {
    throw new Error(`Uploaded bytes do not match declared content type: ${contentType}`);
  }
}

/**
 * Persist media in DROPi's canonical Railway MySQL database.
 *
 * New writes never use Manus/Forge. Access policy is carried by `purpose` and
 * enforced by /api/dropi-media routes. The legacy /manus-storage proxy remains
 * separately registered only so old persisted URLs are not rewritten or faked.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const db = await getDb();
  if (!db) throw new Error("DROPi media persistence unavailable: database not available");

  const sourceKey = normalizeKey(relKey);
  const purpose = classifyPurpose(sourceKey);
  const ownerId = inferOwnerId(sourceKey);

  if ((purpose === "profile_photo" || purpose === "verification_document") && !ownerId) {
    throw new Error(`DROPi media owner could not be derived for ${purpose}`);
  }

  const buffer = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
  if (buffer.length === 0) throw new Error("Cannot persist an empty media object");
  assertKnownFileSignature(buffer, contentType, purpose);

  const mediaUid = randomUUID();
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const url = mediaUrl(purpose, mediaUid, sha256);

  // A profile source key represents a replaceable singleton. Verification
  // evidence is append-only at the storage layer and is never deleted here.
  if (purpose === "profile_photo" && ownerId) {
    await db.delete(dropiAccountMedia).where(and(
      eq(dropiAccountMedia.ownerId, ownerId),
      eq(dropiAccountMedia.purpose, "profile_photo"),
      eq(dropiAccountMedia.sourceKey, sourceKey),
    ));
  }

  await db.insert(dropiAccountMedia).values({
    mediaUid,
    ownerId,
    purpose,
    sourceKey,
    fileName: safeFileName(sourceKey),
    contentType,
    byteLength: buffer.length,
    sha256,
    dataBase64: buffer.toString("base64"),
  });

  return { key: mediaUid, url };
}

/**
 * Resolve media previously written by the DROPi-owned provider.
 * `relKey` may be the opaque media UID or the original source key.
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const db = await getDb();
  if (!db) throw new Error("DROPi media persistence unavailable: database not available");

  const normalized = normalizeKey(relKey);
  const [row] = await db
    .select({
      mediaUid: dropiAccountMedia.mediaUid,
      purpose: dropiAccountMedia.purpose,
      sha256: dropiAccountMedia.sha256,
    })
    .from(dropiAccountMedia)
    .where(or(
      eq(dropiAccountMedia.mediaUid, normalized),
      eq(dropiAccountMedia.sourceKey, normalized),
    ))
    .limit(1);

  if (!row) throw new Error("DROPi media object not found");
  return { key: row.mediaUid, url: mediaUrl(row.purpose, row.mediaUid, row.sha256) };
}

/**
 * Kept for API compatibility. Private DROPi media URLs remain authorization-
 * gated and are not converted into bearer-free public links.
 */
export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const resolved = await storageGet(relKey);
  return resolved.url;
}
