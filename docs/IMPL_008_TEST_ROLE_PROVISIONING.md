# IMPL-008 Test-Role Provisioning

## Purpose

This procedure materializes the canonical pre-production DROPi role population:

- 29 human test-role accounts
- 29 AI mirror accounts
- one persisted `humanPairId` from every AI mirror to its real human row
- the existing `dropi.deliveries@gmail.com` Super Admin remains unchanged

Email identities are derived from `ROLE_CONFIGS` through `shared/test-role-accounts.ts` and follow `docs/DROPI_TEST_EMAIL_REGISTRY.md`.

## Security boundary

Provisioning is disabled by default. It requires all three server-side variables:

```text
DROPI_TEST_ACCOUNT_PROVISIONING=enabled
DROPI_TEST_ACCOUNT_PASSWORD=<temporary secret test password>
DROPI_TEST_ACCOUNT_ZONE=<development/staging test zone>
```

`DROPI_TEST_ACCOUNT_PASSWORD` is a secret. Never commit it, never expose it through an `EXPO_PUBLIC_*` variable, and never paste it into issue/PR/chat logs.

The provisioner does not contain a default password and does not print the configured password.

## Operator procedure

1. Set the three variables on the backend service in the intended development/staging environment.
2. Redeploy the backend so the variables are active.
3. Sign in with the real System Administrator account.
4. Open **System Admin → Phantom Login Console**.
5. Select **Provision / reconcile 29 human + 29 AI** and confirm.
6. Verify the console lists paired human and AI identities and that AI rows show a real `humanPairId`.
7. Disable/remove `DROPI_TEST_ACCOUNT_PROVISIONING` and remove `DROPI_TEST_ACCOUNT_PASSWORD` after provisioning. Redeploy again.

The operation is idempotent: rerunning it reconciles the deterministic test identities instead of intentionally creating a second role population.

## Phantom validation

The Phantom Console receives an operator-safe projection only. Password hashes, reset credentials, email-verification tokens, IP/device fields, and other security credentials are not returned to the console.

Phantom entry is restricted to a real System Administrator / ADMIN session. The governed entry path rejects the current administrator identity and inactive targets before delegating to the canonical phantom-session implementation. A persistent **PHANTOM MODE · AUDITED** banner provides the exit action.

## Biometric scope

IMPL-008 provides the enrollment hook only. Face ID/fingerprint sign-in remains disabled while OWNER-001 / Issue #278 is unresolved. `expo-local-authentication` is intentionally not installed in this runtime.
