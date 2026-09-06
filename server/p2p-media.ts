import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { p2pCommunityListings, p2pListingMedia } from "../drizzle/p2p-schema";
import { sdk } from "./_core/sdk";
import { getDb } from "./db";
import { evaluateRbacAccess } from "./rbac-policy";

export function p2pMediaPath(mediaUid: string): string {
  return `/api/p2p-media/${mediaUid}`;
}

async function authenticateOptional(req: Request) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}

export function registerP2pMediaRoutes(app: Express): void {
  app.get("/api/p2p-media/:mediaUid", async (req: Request, res: Response) => {
    try {
      const mediaUid = String(req.params.mediaUid || "").trim();
      if (!/^[0-9a-f-]{36}$/i.test(mediaUid)) {
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
          mediaUid: p2pListingMedia.mediaUid,
          ownerId: p2pListingMedia.ownerId,
          contentType: p2pListingMedia.contentType,
          byteLength: p2pListingMedia.byteLength,
          dataBase64: p2pListingMedia.dataBase64,
          listingStatus: p2pCommunityListings.status,
          expiresAt: p2pCommunityListings.expiresAt,
        })
        .from(p2pListingMedia)
        .innerJoin(p2pCommunityListings, eq(p2pListingMedia.listingId, p2pCommunityListings.id))
        .where(eq(p2pListingMedia.mediaUid, mediaUid))
        .limit(1);

      if (!row) {
        res.status(404).end();
        return;
      }

      const publicReadable =
        row.listingStatus === "approved" && new Date(row.expiresAt).getTime() > Date.now();

      if (!publicReadable) {
        const user = await authenticateOptional(req);
        if (!user) {
          res.status(401).end();
          return;
        }

        const isOwner = Boolean(user.isActive) && Number(user.id) === Number(row.ownerId);
        const adminDecision = evaluateRbacAccess(user, { channels: ["ADMIN"] });
        if (!isOwner && !adminDecision.allowed) {
          res.status(403).end();
          return;
        }
      }

      const buffer = Buffer.from(row.dataBase64, "base64");
      if (buffer.length !== row.byteLength) {
        res.status(500).json({ error: "Stored media integrity mismatch" });
        return;
      }

      res.setHeader("Content-Type", row.contentType);
      res.setHeader("Content-Length", String(row.byteLength));
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("Cache-Control", publicReadable ? "public, max-age=300" : "private, no-store");
      res.status(200).send(buffer);
    } catch (error) {
      console.error("[P2P_MEDIA] media read failed", error instanceof Error ? error.message : "unknown error");
      res.status(500).json({ error: "Media unavailable" });
    }
  });
}
