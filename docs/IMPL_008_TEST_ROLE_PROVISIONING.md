# IMPL-008 Test-Role Provisioning

## Purpose

This procedure materializes the canonical pre-production DROPi role population:

- 29 human test-role accounts
- 29 AI mirror accounts
- one persisted `humanPairId` from every AI mirror to its real human row
- the existing `dropi.deliveries@gmail.com` Super Admin remains unchanged

Email identities are derived from `ROLE_CONFIGS` through `shared/test-role-accounts.ts` and follow `docs/DROPI_TEST_EMAIL_REGISTRY.md`.

## Security boundary

The preferred operator flow is self-service from **System Admin → Phantom Login Console**. Only the real base Super Admin identity may run it, and an existing Phantom session is rejected.

The operator provides two values for the provisioning request:

- a temporary shared test password with at least 12 characters, one uppercase letter, and one number
- a development/staging operating zone for C1/C2/C3 identities

The password is sent only in the authenticated provisioning request, is immediately converted to a bcrypt hash for the test identities, is cleared from the mobile form after success, and is removed by the audit-input sanitizer before the ADMIN audit record is persisted. It is not committed or stored as an `EXPO_PUBLIC_*` value.

A CLI fallback remains available for controlled server-side operations. That path is disabled by default and requires:

```text
DROPI_TEST_ACCOUNT_PROVISIONING=enabled
DROPI_TEST_ACCOUNT_PASSWORD=<temporary secret test password>
DROPI_TEST_ACCOUNT_ZONE=<development/staging test zone>
```

The provisioner contains no default password and never prints the configured password.

## Operator procedure

1. Sign in with the real `dropi.deliveries@gmail.com` System Administrator account.
2. Open **System Admin → Phantom Login Console**.
3. Enter the test operating zone.
4. Enter a temporary shared test password. Do not reuse the Super Admin password.
5. Select **Provision / reconcile 29 human + 29 AI** and confirm.
6. Verify the console lists all persisted identities and that every AI row shows a real `humanPairId`.
7. Test Human → AI → Phantom → Exit Phantom flows before closing Issue #165.

No Railway provisioning variables or backend redeploy are required for this preferred operator flow.

The operation is idempotent: rerunning it reconciles the deterministic test identities instead of intentionally creating a second role population. Reconciliation also revokes stale sessions and push registrations for those test identities.

## Phantom validation

The Phantom Console receives an operator-safe projection only. Password hashes, reset credentials, email-verification tokens, IP/device fields, and other security credentials are not returned to the console.

Phantom entry is restricted to a real System Administrator / ADMIN session. The governed entry path rejects the current administrator identity and inactive targets before delegating to the canonical phantom-session implementation. A persistent **PHANTOM MODE · AUDITED** banner provides the exit action.

## Biometric scope

IMPL-008 provides the enrollment hook only. Face ID/fingerprint sign-in remains disabled while OWNER-001 / Issue #278 is unresolved. `expo-local-authentication` is intentionally not installed in this runtime.
