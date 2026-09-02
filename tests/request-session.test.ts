import assert from "node:assert/strict";
import test from "node:test";
import { COOKIE_NAME } from "../shared/const.js";
import { getRequestSessionToken } from "../server/request-session";

test("Authorization bearer token takes precedence over cookies", () => {
  const token = getRequestSessionToken({
    headers: {
      authorization: "Bearer bearer-token",
      cookie: `${COOKIE_NAME}=cookie-token`,
    },
  } as any);
  assert.equal(token, "bearer-token");
});

test("session cookie is used when Authorization is absent", () => {
  const token = getRequestSessionToken({
    headers: { cookie: `${COOKIE_NAME}=cookie-token` },
  } as any);
  assert.equal(token, "cookie-token");
});

test("missing transport returns null", () => {
  assert.equal(getRequestSessionToken({ headers: {} } as any), null);
});
