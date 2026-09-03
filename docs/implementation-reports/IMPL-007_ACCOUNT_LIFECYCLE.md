# IMPL-007 — Account lifecycle completion

Issue: #164

## Objective

Complete the register, email-verification, password-recovery, logout, deactivation, and reactivation lifecycle without creating a parallel authentication system.

## Implemented contract

- Registration normalizes email identity before lookup and persistence.
- New email-verification and password-reset codes are protected at rest with a purpose-separated keyed digest; expiring pre-IMPL-007 plaintext codes remain temporarily compatible.
- Missing or malformed one-time-code expiries fail closed.
- Verification resend is throttled for one minute and a code is cleared if email delivery fails.
- Password-recovery requests and reset attempts are rate-limited.
- Password replacement revokes all persisted sessions atomically.
- Explicit tRPC logout revokes the current persisted server session.
- Approval-pending registration no longer creates an orphan server session and the native auth context no longer manufactures a local authenticated state from a null token.
- Administrative deactivation validates the target, prevents administrator self-deactivation, and revokes all target sessions in the same database transaction.
- Recovery UI no longer claims a code was server-verified before the reset request actually reaches the backend.
- All lifecycle transitions remain covered by existing audit events, with explicit session-revocation evidence added to password and deactivation audit details.

## Compatibility

The implementation keeps the existing tRPC procedure names and the six-digit user-facing recovery/verification experience. There is no database migration, Expo/native dependency change, app-version change, or runtime-version change.

Runtime remains `1.0.1`; the change is OTA-safe.

## Verification

The dedicated pull-request gate runs:

- one-time-code policy tests;
- account-lifecycle route tests;
- persistence source contracts;
- forgot-password and email-verification regressions;
- OAuth/JWT/session regressions;
- RBAC regressions;
- TypeScript validation;
- whitespace validation.
