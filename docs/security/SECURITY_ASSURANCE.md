# DROPi Security Assurance — Repository Scope

## Certification Boundary

This document records factual repository-level security assurance for M2. It does not certify an external penetration test, production infrastructure, regulatory acceptance, or capabilities that are not yet implemented.

The Security Baseline remains authoritative for its deployment boundary: repository code can enforce application behavior, but it cannot by itself prove the externally negotiated TLS version or encryption properties of every managed database/volume byte.

## Authentication and Account Integrity

- Registration derives account activation and delivery-partner verification state server-side.
- The database service enforces the delivery-partner verification invariant independently of the registration router: a delivery partner cannot be created as verified by omission or by requesting `isVerified=true`.
- Moving an existing account into the delivery-partner role resets verification to false; verification must then come from the governed verification flow.
- Delivery-partner operational verification is evidence-derived: only an approved, unexpired `driving_license` or `drone_license` qualifies. Approved insurance, vehicle registration, background checks, or `other` evidence do not grant mission authority.
- `users.isVerified` is a materialized operational flag, not an independent source of authority. It is reconciled from current qualifying evidence, and loss/expiry of the last qualifying license forces the pilot out of the available pool.
- Verification status, admin review messaging, pilot selection, live tracking, and mission guards use the same operational-verification policy so non-license approval cannot silently grant pilot capability.
- Email-verification and password-reset six-digit credentials use Node cryptographic randomness rather than `Math.random()`.
- Existing login/session, account-lock, rate-limit, and protected-procedure regressions remain part of the permanent assurance gate.

## Operational and Channel Integrity

- Live tracking authenticates the first WebSocket message with the existing session mechanism.
- Pilot identity is derived from the authenticated user, not from a client-supplied `pilotId`.
- Pilot broadcast requires the delivery-partner role, current qualifying verification evidence, active account, and assignment to the target.
- Automatic and COS pilot selection refresh operational verification before candidate selection; manual assignment also checks current qualifying evidence before rating eligibility.
- Subscriber authorization is checked against the target resource; C1 order and B2B stream namespaces remain distinct.
- Proof-backed completion and operational-evidence persistence remain authoritative; a WebSocket `delivery_complete` message cannot complete an order or B2B delivery.
- Cross-layer regressions preserve C1/C2/C3/ADMIN separation, STOP/fallback/failure distinctions, and audit/privacy boundaries already certified in M2.

## Account Media Integrity and Privacy

- New profile-photo and delivery-partner verification uploads are persisted in the canonical DROPi MySQL database through `dropiAccountMedia`; new writes do not require Manus/Forge storage variables or an ephemeral Railway filesystem.
- Profile photos and generated assets are public-readable only through opaque DROPi media URLs containing a UUID and SHA-256 digest.
- Verification documents and generic private media are authentication-gated; only the active owning account or canonical ADMIN authority can read the bytes.
- Account-media reads verify both the persisted byte length and SHA-256 digest before returning content. Profile/verification uploads also reject JPEG, PNG, WebP or PDF payloads whose file signatures do not match the declared MIME type.
- Admin verification review retrieves private evidence through an `adminProcedure` and re-checks owner binding, byte length and SHA-256 before preview.
- Historical `/manus-storage/...` values are retained only as an explicit backward-compatibility surface. They are not silently rewritten, claimed as migrated, or used for new account-media writes; unavailable legacy evidence requires re-upload.
- Migration `0021_dropi_account_media` is applied by the existing fail-closed Railway startup migration runner before the API starts.

## Marketplace and Payment Boundary

The current C1 Marketplace order path is a real order/purchase-intent path, not a payment-provider certification:

- the client supplies product identity and quantity, not an authoritative unit price;
- the server loads approved active products and derives unit price and order total from stored product data;
- stock consumption and order creation are transaction-bound;
- the order starts in the canonical `initiated` state and proceeds through governed state transitions.

No active external payment provider, card authorization, settlement, refund processor, or wallet settlement authority was found in this M2 security-assurance scope. Therefore this batch **does not claim payment-provider security certification**. When the Payments epic materializes those capabilities, its provider callbacks, financial state transitions, reconciliation, refunds, and settlement require their own security certification rather than mock evidence.

## Vulnerability Management

`docs/security/VULNERABILITY_MANAGEMENT.md` defines finding intake, severity/ownership, patch handling, the authorized penetration-test checklist, and evidence required for closure. Dependabot performs weekly dependency review for npm and GitHub Actions; dependency changes still pass normal permanent gates.

## Known External Evidence Gates

The following remain deployment/assessment facts and must not be inferred from source code alone:

- actual TLS protocol negotiated at every production ingress/egress hop;
- managed database/volume encryption implementation and key custody outside the application-managed secret envelope;
- results of an independent external penetration test;
- security properties of a future payment provider or financial settlement system.

Until such evidence exists, DROPi documentation and authority exports must not present those properties as certified facts.
