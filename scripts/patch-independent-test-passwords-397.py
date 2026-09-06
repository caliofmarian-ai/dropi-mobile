from pathlib import Path

service_path = Path("server/test-account-provisioning.ts")
service = service_path.read_text()

old = """async function clearStaleDeviceAccess(tx: DbTransaction, userId: number) {
  // Reconciliation may rotate the shared test password. Revoke every previous
  // server session and push registration for the test identity in the same
  // transaction so stale devices cannot remain authenticated or receive pushes.
"""
new = """async function clearStaleDeviceAccess(tx: DbTransaction, userId: number) {
  // Reconciliation refreshes governed identity fields and may change role/zone
  // authority. Revoke every previous server session and push registration for the
  // test identity even though an existing account's password is preserved.
"""
assert old in service
service = service.replace(old, new)

anchor = """async function reconcileIdentity(
  tx: DbTransaction,
  input: {
"""
helper = """export function passwordWriteForTestAccountReconciliation(
  existingPasswordHash: string | null | undefined,
  bootstrapPasswordHash: string,
): { passwordHash?: string } {
  if (typeof existingPasswordHash === \"string\" && existingPasswordHash.trim().length > 0) {
    return {};
  }
  return { passwordHash: bootstrapPasswordHash };
}

async function reconcileIdentity(
  tx: DbTransaction,
  input: {
"""
assert anchor in service
service = service.replace(anchor, helper, 1)

assert "    passwordHash: string;\n" in service
service = service.replace("    passwordHash: string;\n", "    bootstrapPasswordHash: string;\n", 1)

assert "    passwordHash: input.passwordHash,\n" in service
service = service.replace("    passwordHash: input.passwordHash,\n", "", 1)

old_existing = """  if (existing) {
    await tx.update(users).set(values).where(eq(users.id, existing.id));
    await clearStaleDeviceAccess(tx, existing.id);
    return existing.id;
  }

  const result = await tx.insert(users).values(values);
"""
new_existing = """  if (existing) {
    const credentialValues = passwordWriteForTestAccountReconciliation(
      existing.passwordHash,
      input.bootstrapPasswordHash,
    );
    await tx.update(users).set({ ...values, ...credentialValues }).where(eq(users.id, existing.id));
    await clearStaleDeviceAccess(tx, existing.id);
    return existing.id;
  }

  const result = await tx.insert(users).values({
    ...values,
    passwordHash: input.bootstrapPasswordHash,
  });
"""
assert old_existing in service
service = service.replace(old_existing, new_existing, 1)

old_doc = """ * Server environment values are the only credential/zone authority. Neither the
 * mobile Phantom Console nor another request may provide a competing password.
 * Delivery Partner verification remains governed by reviewed qualifying evidence;
"""
new_doc = """ * Server environment values provide the bootstrap credential for newly created TEST
 * identities and the canonical zone. Existing TEST password hashes are preserved so
 * each account may keep an independent password set through normal recovery/reset.
 * Neither the mobile Phantom Console nor another request may provide a competing
 * bootstrap password. Delivery Partner verification remains governed by reviewed qualifying evidence;
"""
assert old_doc in service
service = service.replace(old_doc, new_doc, 1)

assert "  const passwordHash = await bcrypt.hash(password, 12);\n" in service
service = service.replace(
    "  const passwordHash = await bcrypt.hash(password, 12);\n",
    "  const bootstrapPasswordHash = await bcrypt.hash(password, 12);\n",
    1,
)
service = service.replace("        passwordHash,\n", "        bootstrapPasswordHash,\n")
service_path.write_text(service)

ui_path = Path("app/admin/phantom-console.tsx")
ui = ui_path.read_text()
replacements = {
    "Railway/server environment is the only password and zone authority. The mobile app never asks for or transmits the shared test password. Reconciliation rotates every canonical test-account hash and revokes stale test sessions.":
    "Railway/server environment provides the bootstrap password for newly created test accounts and the canonical zone. The mobile app never asks for or transmits the bootstrap password. Existing test-account passwords are preserved, so each account can keep its own password after recovery. Reconciliation refreshes governed identity fields and revokes stale test sessions.",
    "This will rotate/reconcile 29 human test identities and 29 AI role agents using the server-owned password and zone ${controlStatus.provisioning.zone}. Existing test-account sessions and push registrations will be revoked. The real base Super Admin is not modified.":
    "This will reconcile 29 human test identities and 29 AI role agents using the server-owned bootstrap password only for missing/new identities and zone ${controlStatus.provisioning.zone}. Existing test-account passwords are preserved. Existing sessions and push registrations will be revoked. The real base Super Admin is not modified.",
    "${result.humanAccounts} human + ${result.aiAccounts} AI role agents across ${result.roles} roles now use the authoritative server configuration.":
    "${result.humanAccounts} human + ${result.aiAccounts} AI role agents across ${result.roles} roles were reconciled. Existing passwords were preserved; only newly created identities use the server bootstrap password.",
    "Password configured {controlStatus?.provisioning.passwordConfigured ? \"✓\" : \"✕\"}":
    "Bootstrap password configured {controlStatus?.provisioning.passwordConfigured ? \"✓\" : \"✕\"}",
}
for old_text, new_text in replacements.items():
    assert old_text in ui, old_text
    ui = ui.replace(old_text, new_text, 1)
ui_path.write_text(ui)

contract_path = Path("tests/test-account-provisioning-contract.test.ts")
contract = contract_path.read_text()
contract = contract.replace(
    'it("uses server environment as the single password and zone authority", () => {',
    'it("uses server environment as bootstrap-password and zone authority", () => {',
)
contract = contract.replace(
    'expect(consoleScreen).toContain("Railway/server environment is the only password and zone authority");',
    'expect(consoleScreen).toContain("Railway/server environment provides the bootstrap password for newly created test accounts");',
)
contract = contract.replace(
    'expect(consoleScreen).toContain("The mobile app never asks for or transmits the shared test password");',
    'expect(consoleScreen).toContain("The mobile app never asks for or transmits the bootstrap password");',
)
marker = """  it("materializes AI pairing from the persisted human row ID inside one transaction", () => {
"""
new_test = """  it("preserves independent existing passwords and uses bootstrap only when a password is missing", () => {
    const service = source("server/test-account-provisioning.ts");

    expect(service).toContain("passwordWriteForTestAccountReconciliation");
    expect(service).toContain("existing.passwordHash");
    expect(service).toContain("input.bootstrapPasswordHash");
    expect(service).toContain(".set({ ...values, ...credentialValues })");
    expect(service).toContain("passwordHash: input.bootstrapPasswordHash");
    expect(service).not.toContain("Reconciliation may rotate the shared test password");
  });

  it("materializes AI pairing from the persisted human row ID inside one transaction", () => {
"""
assert marker in contract
contract = contract.replace(marker, new_test, 1)
contract_path.write_text(contract)

behavior = Path("tests/test-account-independent-passwords-397.test.ts")
behavior.write_text('''import { describe, expect, it } from "vitest";\nimport { passwordWriteForTestAccountReconciliation } from "../server/test-account-provisioning";\n\ndescribe("AUTH-397 independent TEST passwords", () => {\n  it("does not write over two different existing password hashes", () => {\n    const humanHash = "$2b$12$existing-human-hash";\n    const aiHash = "$2b$12$existing-ai-hash";\n    const bootstrapHash = "$2b$12$bootstrap-hash";\n\n    expect(passwordWriteForTestAccountReconciliation(humanHash, bootstrapHash)).toEqual({});\n    expect(passwordWriteForTestAccountReconciliation(aiHash, bootstrapHash)).toEqual({});\n  });\n\n  it("uses the bootstrap hash only for a new or passwordless identity", () => {\n    const bootstrapHash = "$2b$12$bootstrap-hash";\n\n    expect(passwordWriteForTestAccountReconciliation(undefined, bootstrapHash)).toEqual({\n      passwordHash: bootstrapHash,\n    });\n    expect(passwordWriteForTestAccountReconciliation(null, bootstrapHash)).toEqual({\n      passwordHash: bootstrapHash,\n    });\n    expect(passwordWriteForTestAccountReconciliation("", bootstrapHash)).toEqual({\n      passwordHash: bootstrapHash,\n    });\n  });\n});\n''')

wf_path = Path(".github/workflows/validate-impl-008-pr.yml")
wf = wf_path.read_text()
assert "      - tests/test-account-provisioning-contract.test.ts\n" in wf
wf = wf.replace(
    "      - tests/test-account-provisioning-contract.test.ts\n",
    "      - tests/test-account-provisioning-contract.test.ts\n      - tests/test-account-independent-passwords-397.test.ts\n",
    1,
)
assert "          tests/test-account-provisioning-contract.test.ts\n" in wf
wf = wf.replace(
    "          tests/test-account-provisioning-contract.test.ts\n",
    "          tests/test-account-provisioning-contract.test.ts\n          tests/test-account-independent-passwords-397.test.ts\n",
    1,
)
wf_path.write_text(wf)
