# Owner Android Validation Follow-up — 2026-09-06

This note records Android owner-validation findings after PR #376.

## Confirmed PASS

- Profile media persisted after app restart.
- Verification image upload succeeded.
- Admin could open private evidence and integrity verification succeeded.
- Admin approval succeeded.

## Follow-up issues

- #377 — profile-photo crop framing.
- #378 — multi-file/PDF verification evidence and lifecycle status visibility.
- #379 — canonical test-account reconciliation and password-recovery delivery.
- #380 — deterministic C1 drone/terrestrial mission fixtures for owner QA.

## #379 contract

Canonical test-account credentials and zone are server-authoritative. Phantom Console no longer accepts a shared credential from the mobile client. The base Super Admin can inspect non-secret provisioning readiness, reconcile the canonical test-role population from server configuration, inspect non-secret mail readiness, and invoke the real public password-recovery flow for the canonical TEST HUMAN Delivery Partner alias.

After deploy, live owner acceptance must confirm direct Delivery Partner login and delivery of the password-recovery message to the canonical base inbox. Secrets and recovery codes must never be committed to this repository.
