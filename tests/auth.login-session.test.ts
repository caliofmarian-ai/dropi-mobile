/**
 * Regression test: jose v6 WebCrypto API availability during login
 *
 * jose v6 uses the bare `crypto` identifier (WebCrypto API) internally.
 * On Node.js < 19, this identifier is not exposed as an automatic global in
 * ESM module scope without the `--experimental-global-webcrypto` flag.
 * The production entry point (`server/_core/index.ts`) polyfills
 * `globalThis.crypto` so that jose works on Node.js 18 and later.
 *
 * This test exercises the exact SignJWT / jwtVerify code path used by
 * `sdk.createSessionToken` to prove no `ReferenceError: crypto is not defined`
 * is thrown during a login or registration call.
 */

import { describe, expect, it } from "vitest";
import { SignJWT, jwtVerify } from "jose";

describe("jose WebCrypto API — session token creation (login regression)", () => {
  const SECRET = new TextEncoder().encode(
    "test-jwt-secret-32-bytes-minimum-for-hs256",
  );

  it("creates a signed JWT without ReferenceError: crypto is not defined", async () => {
    const expirationSeconds = Math.floor(Date.now() / 1000) + 3600;

    const token = await new SignJWT({
      openId: "dropi_test_openid",
      appId: "test-app",
      name: "Test User",
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(SECRET);

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // header.payload.signature
  });

  it("verifies a JWT without ReferenceError: crypto is not defined", async () => {
    const token = await new SignJWT({ openId: "test", appId: "app", name: "U" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
      .sign(SECRET);

    const { payload } = await jwtVerify(token, SECRET, {
      algorithms: ["HS256"],
    });

    expect(payload["openId"]).toBe("test");
    expect(payload["appId"]).toBe("app");
    expect(payload["name"]).toBe("U");
  });

  it("rejects a JWT signed with a different secret", async () => {
    const wrongSecret = new TextEncoder().encode(
      "wrong-jwt-secret-32-bytes-minimum-xxxxxxxxxxx",
    );

    const token = await new SignJWT({ openId: "test", appId: "app", name: "U" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
      .sign(wrongSecret);

    await expect(
      jwtVerify(token, SECRET, { algorithms: ["HS256"] }),
    ).rejects.toThrow();
  });
});
