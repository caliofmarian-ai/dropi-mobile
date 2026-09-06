import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");

test("account media writes are DROPi-owned and do not require Forge", () => {
  const storage = source("server/storage.ts");
  const schema = source("drizzle/account-media-schema.ts");

  assert.match(storage, /dropiAccountMedia/);
  assert.match(storage, /getDb\(\)/);
  assert.match(storage, /createHash\("sha256"\)/);
  assert.match(storage, /randomUUID\(\)/);
  assert.match(storage, /profile_photo/);
  assert.match(storage, /verification_document/);
  assert.doesNotMatch(storage, /BUILT_IN_FORGE_API_URL|BUILT_IN_FORGE_API_KEY|forgeApiUrl|forgeApiKey|presign/i);

  assert.match(schema, /longtext\("dataBase64"\)/);
  assert.match(schema, /varchar\("sha256", \{ length: 64 \}\)/);
  assert.match(schema, /"profile_photo"/);
  assert.match(schema, /"verification_document"/);
});

test("profile and verification uploads keep their existing validated call sites", () => {
  const auth = source("server/auth-router.ts");
  const verification = source("server/delivery-verification-router.ts");
  const storage = source("server/storage.ts");

  assert.match(auth, /uploadProfilePhoto:/);
  assert.match(auth, /File too large\. Maximum 5MB/);
  assert.match(auth, /image\/jpeg/);
  assert.match(auth, /storagePut\(key, buffer, input\.contentType\)/);

  assert.match(verification, /uploadDocument:/);
  assert.match(verification, /File too large\. Maximum size is 10MB/);
  assert.match(verification, /application\/pdf/);
  assert.match(verification, /storagePut\(storagePath, buffer, input\.contentType\)/);

  assert.match(storage, /Uploaded bytes do not match declared content type/);
  assert.match(storage, /buffer\.subarray\(0, 5\)\.toString\("ascii"\) === "%PDF-"/);
});

test("verification evidence is authorization-gated and integrity checked on every read", () => {
  const route = source("server/dropi-media.ts");
  const adminReader = source("server/verification-media-router.ts");

  assert.match(route, /purpose === "profile_photo" \|\| purpose === "generated_asset"/);
  assert.match(route, /sdk\.authenticateRequest/);
  assert.match(route, /Number\(user\.id\) === Number\(row\.ownerId\)/);
  assert.match(route, /evaluateRbacAccess\(user, \{ channels: \["ADMIN"\] \}\)/);
  assert.match(route, /"private, no-store"/);
  assert.match(route, /digest !== row\.sha256/);

  assert.match(adminReader, /adminProcedure/);
  assert.match(adminReader, /eq\(dropiAccountMedia\.ownerId, verification\.userId\)/);
  assert.match(adminReader, /actualHash !== media\.sha256/);
  assert.match(adminReader, /storage: "legacy" as const/);
  assert.match(adminReader, /Re-upload is required if the historical provider is unavailable/);
});

test("legacy Manus URLs remain compatibility-only while new routes are registered", () => {
  const index = source("server/_core/index.ts");
  const legacyProxy = source("server/_core/storageProxy.ts");
  const storage = source("server/storage.ts");

  assert.match(index, /registerStorageProxy\(app\)/);
  assert.match(index, /registerDropiMediaRoutes\(app\)/);
  assert.match(legacyProxy, /\/manus-storage\/\*/);
  assert.match(storage, /New writes never use Manus\/Forge/);
  assert.doesNotMatch(storage, /\/manus-storage\/\$\{/);
});

test("Railway migration and schema configuration include account media persistence", () => {
  const config = source("drizzle.config.ts");
  const migration = source("drizzle/0021_dropi_account_media.sql");
  const journal = source("drizzle/meta/_journal.json");
  const railway = source("railway.toml");

  assert.match(config, /account-media-schema\.ts/);
  assert.match(migration, /CREATE TABLE `dropiAccountMedia`/);
  assert.match(migration, /`dataBase64` longtext NOT NULL/);
  assert.match(migration, /`sha256` varchar\(64\) NOT NULL/);
  assert.match(journal, /0021_dropi_account_media/);
  assert.match(railway, /node dist\/migrate\.mjs/);
});

test("native profile and admin surfaces consume governed media correctly", () => {
  const profile = source("app/(tabs)/profile.tsx");
  const helper = source("lib/media-url.ts");
  const admin = source("app/admin/approvals.tsx");
  const routers = source("server/routers.ts");

  assert.match(profile, /resolveDropiMediaUrl\(currentPhoto\)/);
  assert.match(helper, /getApiBaseUrl\(\)/);
  assert.match(admin, /View Private Evidence/);
  assert.match(admin, /verificationMedia\.getByVerificationId/);
  assert.match(admin, /data:\$\{preview\.contentType\};base64/);
  assert.match(admin, /getContentUriAsync/);
  assert.match(routers, /verificationMedia: verificationMediaRouter/);
});
