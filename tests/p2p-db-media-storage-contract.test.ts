import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

test("P2P listing media is persisted in its own canonical DB table", () => {
  const schema = source("drizzle/p2p-schema.ts");
  const migration = source("drizzle/0020_p2p_db_media.sql");
  assert.match(schema, /p2pListingMedia/);
  assert.match(schema, /dataBase64: longtext/);
  assert.match(migration, /CREATE TABLE `p2pListingMedia`/);
  assert.match(migration, /`dataBase64` longtext NOT NULL/);
});

test("Community Offer media persistence is atomic and no longer requires Forge storage", () => {
  const router = source("server/p2p-router.ts");
  assert.doesNotMatch(router, /storagePut|BUILT_IN_FORGE_API/);
  assert.match(router, /prepareListingImages/);
  assert.match(router, /await db\.transaction\(async \(tx\)/);
  assert.match(router, /tx\.insert\(p2pListingMedia\)/);
  assert.match(router, /p2pMediaPath\(image\.mediaUid\)/);
  assert.match(router, /mediaStorage: "dropi_db"/);
});

test("P2P media route is public only for approved unexpired listings", () => {
  const route = source("server/p2p-media.ts");
  const index = source("server/_core/index.ts");
  assert.match(index, /registerP2pMediaRoutes\(app\)/);
  assert.match(route, /row\.listingStatus === "approved"/);
  assert.match(route, /new Date\(row\.expiresAt\)\.getTime\(\) > Date\.now\(\)/);
  assert.match(route, /sdk\.authenticateRequest/);
  assert.match(route, /Number\(user\.id\) === Number\(row\.ownerId\)/);
  assert.match(route, /evaluateRbacAccess\(user, \{ channels: \["ADMIN"\] \}\)/);
  assert.match(route, /"private, no-store"/);
});

test("P2P moderation requests protected media with the authenticated session token", () => {
  const moderation = source("app/admin/p2p-moderation.tsx");
  const mediaUrl = source("lib/p2p-media-url.ts");
  assert.match(moderation, /const \{ user, token \} = useDropiAuth\(\)/);
  assert.match(moderation, /p2pMediaSource\(url, token\)/);
  assert.match(mediaUrl, /Authorization: `Bearer \$\{token\}`/);
});
