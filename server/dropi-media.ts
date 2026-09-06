import { createHash } from "node:crypto";
import type { Express, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { dropiAccountMedia } from "../drizzle/account-media-schema";
import { sdk } from "./_core/sdk";
import { getDb } from "./db";
import { evaluateRbacAccess } from "./rbac-policy";
import type { DropiMediaPurpose } from "./storage";

const ROUTE_PURPOSE: Record<string, DropiMediaPurpose> = {
  profile: "profile_photo",
  verification: "verification_document",
  generated: "generated_asset",
  private: "private_asset",
};

function isPublicPurpose(purpose: DropiMediaPurpose): boolean {
  return purpose === "profile_photo" || purpose === "generated_asset";
}

async function authenticateOptional(req: Request) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}

function sendStoredMedia(
  res: Response,
  row: {
    contentType: string;
    byteLength: number;
    sha256: string;
    dataBase64: string;
    fileName: string;
  },
  publicReadable: boolean,
): void {
  const buffer = Buffer.from(row.dataBase64, "base64");
  const digest = createHash("sha256").update(buffer).digest("hex");
  if (buffer.length !== row.byteLength || digest !== row.sha256) {
    throw new Error("Stored DROPi media integrity mismatch");
  }

  const safeName = row.fileName.replace(/[^a-zA-Z0-9._-]/g, "_") || "file";
  res.setHeader("Content-Type", row.contentType);
  res.setHeader("Content-Length", String(row.byteLength));
  res.setHeader("Content-Disposition", `inline; filename="${safeName}"`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", publicReadable ? "public, max-age=300, immutable" : "private, no-store");
  res.status(200).send(buffer);
}

/**
 * Register DROPi-owned media delivery routes.
 *
 * Public: profile photos and generated assets.
 * Private: verification evidence and generic private media; only the owning
 * active account or canonical ADMIN authority can read these bytes.
 */
export function registerDropiMediaRoutes(app: Express): void {
  app.get("/api/dropi-media/:scope/:mediaUid/:sha256", async (req: Request, res: Response) => {
    try {
      const scope = String(req.params.scope || "").trim();
      const mediaUid = String(req.params.mediaUid || "").trim();
      const requestedHash = String(req.params.sha256 || "").trim().toLowerCase();
      const purpose = ROUTE_PURPOSE[scope];

      if (!purpose || !/^[0-9a-f-]{36}$/i.test(mediaUid) || !/^[0-9a-f]{64}$/.test(requestedHash)) {
        res.status(404).end();
        return;
      }

      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "Database unavailable" });
        return;
      }

      const [row] = await db
        .select({
          ownerId: dropiAccountMedia.ownerId,
          purpose: dropiAccountMedia.purpose,
          fileName: dropiAccountMedia.fileName,
          contentType: dropiAccountMedia.contentType,
          byteLength: dropiAccountMedia.byteLength,
          sha256: dropiAccountMedia.sha256,
          dataBase64: dropiAccountMedia.dataBase64,
        })
        .from(dropiAccountMedia)
        .where(and(
          eq(dropiAccountMedia.mediaUid, mediaUid),
          eq(dropiAccountMedia.purpose, purpose),
        ))
        .limit(1);

      if (!row || row.sha256 !== requestedHash) {
        res.status(404).end();
        return;
      }

      const publicReadable = isPublicPurpose(purpose);
      if (!publicReadable) {
        const user = await authenticateOptional(req);
        if (!user) {
          res.status(401).end();
          return;
        }

        const isOwner = Boolean(user.isActive) && row.ownerId !== null && Number(user.id) === Number(row.ownerId);
        const adminDecision = evaluateRbacAccess(user, { channels: ["ADMIN"] });
        if (!isOwner && !adminDecision.allowed) {
          res.status(403).end();
          return;
        }
      }

      sendStoredMedia(res, row, publicReadable);
    } catch (error) {
      console.error("[DROPI_MEDIA] media read failed", error instanceof Error ? error.message : "unknown error");
      res.status(500).json({ error: "Media unavailable" });
    }
  });
}
