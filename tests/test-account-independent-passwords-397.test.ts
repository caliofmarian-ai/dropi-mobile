import { describe, expect, it } from "vitest";
import { passwordWriteForTestAccountReconciliation } from "../server/test-account-provisioning";

describe("AUTH-397 independent TEST passwords", () => {
  it("does not write over two different existing password hashes", () => {
    const humanHash = "$2b$12$existing-human-hash";
    const aiHash = "$2b$12$existing-ai-hash";
    const bootstrapHash = "$2b$12$bootstrap-hash";

    expect(passwordWriteForTestAccountReconciliation(humanHash, bootstrapHash)).toEqual({});
    expect(passwordWriteForTestAccountReconciliation(aiHash, bootstrapHash)).toEqual({});
  });

  it("uses the bootstrap hash only for a new or passwordless identity", () => {
    const bootstrapHash = "$2b$12$bootstrap-hash";

    expect(passwordWriteForTestAccountReconciliation(undefined, bootstrapHash)).toEqual({
      passwordHash: bootstrapHash,
    });
    expect(passwordWriteForTestAccountReconciliation(null, bootstrapHash)).toEqual({
      passwordHash: bootstrapHash,
    });
    expect(passwordWriteForTestAccountReconciliation("", bootstrapHash)).toEqual({
      passwordHash: bootstrapHash,
    });
  });
});
