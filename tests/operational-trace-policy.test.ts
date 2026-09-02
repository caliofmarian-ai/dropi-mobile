import test from "node:test";
import assert from "node:assert/strict";
import {
  RECEPTION_METHODS,
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
