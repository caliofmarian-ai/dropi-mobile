/**
 * Controlled CLI entrypoint for IMPL-008 test-role provisioning.
 *
 * Required server-side environment:
 *   DROPI_TEST_ACCOUNT_PROVISIONING=enabled
 *   DROPI_TEST_ACCOUNT_PASSWORD=<secret test password>
 *   DROPI_TEST_ACCOUNT_ZONE=<test zone for C1/C2/C3 identities>
 *
 * No password is hard-coded or printed. The implementation lives in the server
 * provisioning service so the same governed logic can be invoked from an
 * authenticated operator surface without creating a second account generator.
 */

import { provisionTestRoleAccounts } from "../server/test-account-provisioning";

async function main() {
  const result = await provisionTestRoleAccounts();
  console.log(
    `[IMPL-008] Test-role provisioning complete: ${result.humanAccounts} human + ${result.aiAccounts} AI mirrors across ${result.roles} roles.`,
  );
  console.log(
    `[IMPL-008] ${result.identitiesIncludingBaseSuperAdmin} canonical test identities including the unchanged base Super Admin.`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[IMPL-008] Provisioning failed: ${message}`);
  process.exitCode = 1;
});
