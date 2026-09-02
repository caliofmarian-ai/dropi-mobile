import assert from "node:assert/strict";
import test from "node:test";
import {
  AUDIT_CHANNELS,
  buildAuditAttribution,
  isAuditChannel,
  requireAuditChannel,
  requirePhantomAdminId,
} from "../server/audit-policy";

test("only the four governed audit channels are accepted", () => {
  assert.deepEqual(AUDIT_CHANNELS, ["C1", "C2", "C3", "ADMIN"]);
  for (const channel of AUDIT_CHANNELS) assert.equal(isAuditChannel(channel), true);
  assert.equal(isAuditChannel("all"), false);
  assert.equal(isAuditChannel(null), false);
  assert.throws(() => requireAuditChannel("UNKNOWN"), /Audit channel/);
});

test("real actions carry a channel and no phantom identity", () => {
  assert.deepEqual(buildAuditAttribution("C1", null), {
    channel: "C1",
    isPhantomMode: false,
    phantomAdminId: null,
  });
});

test("phantom actions retain the target channel and administrator identity", () => {
  assert.deepEqual(buildAuditAttribution("C1", { isPhantom: true, phantomAdminId: 91 }), {
    channel: "C1",
    isPhantomMode: true,
    phantomAdminId: 91,
  });
});

test("phantom attribution fails closed without a valid administrator identity", () => {
  assert.throws(() => requirePhantomAdminId({ isPhantom: false, phantomAdminId: null }), /phantom session/i);
  assert.throws(() => buildAuditAttribution("C1", { isPhantom: true, phantomAdminId: null }), /administrator identity/i);
  assert.throws(() => buildAuditAttribution("C1", { isPhantom: true, phantomAdminId: -2 }), /administrator identity/i);
});
