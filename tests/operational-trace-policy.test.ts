import test from "node:test";
import assert from "node:assert/strict";
import {
  RECEPTION_METHODS,
  assertB2bTransition,
  assertCompletionProof,
  requiresRecipientAttestation,
  traceChannelForTarget,
} from "../shared/operational-trace-policy";

for (const method of RECEPTION_METHODS) {
  test(`completion accepts canonical reception method ${method}`, () => {
    assert.equal(assertCompletionProof({ receptionMethod: method }).receptionMethod, method);
  });
}

test("passive and drone reception do not fabricate a recipient signature requirement", () => {
  assert.equal(requiresRecipientAttestation("leave_at_door"), false);
  assert.equal(requiresRecipientAttestation("leave_at_gate"), false);
  assert.equal(requiresRecipientAttestation("leave_in_yard"), false);
  assert.equal(requiresRecipientAttestation("drone_reception"), false);
});

test("proof artifacts reject inline/base64 bodies", () => {
  assert.throws(() => assertCompletionProof({ receptionMethod: "personal_handover", artifactUrl: "data:image/jpeg;base64,AAAA" }), /never inline\/base64/);
});

test("trace target maps to its operational channel", () => {
  assert.equal(traceChannelForTarget("order"), "C1");
  assert.equal(traceChannelForTarget("b2b"), "C2");
});

test("B2B custody accepts only the exact next operational state", () => {
  assert.doesNotThrow(() => assertB2bTransition("pending", "assigned"));
  assert.doesNotThrow(() => assertB2bTransition("assigned", "pickup_enroute"));
  assert.doesNotThrow(() => assertB2bTransition("pickup_enroute", "picked_up"));
  assert.doesNotThrow(() => assertB2bTransition("picked_up", "in_transit"));
  assert.doesNotThrow(() => assertB2bTransition("in_transit", "delivered"));
  assert.throws(() => assertB2bTransition("assigned", "delivered"), /Invalid B2B transition/);
  assert.throws(() => assertB2bTransition("pending", "picked_up"), /Invalid B2B transition/);
});

test("B2B exceptional terminal transitions are explicit and bounded", () => {
  assert.doesNotThrow(() => assertB2bTransition("picked_up", "failed", { allowFailure: true }));
  assert.doesNotThrow(() => assertB2bTransition("in_transit", "cancelled", { allowCancellation: true }));
  assert.throws(() => assertB2bTransition("delivered", "failed", { allowFailure: true }), /Invalid B2B transition/);
  assert.throws(() => assertB2bTransition("cancelled", "assigned", { allowCancellation: true }), /Invalid B2B transition/);
});
