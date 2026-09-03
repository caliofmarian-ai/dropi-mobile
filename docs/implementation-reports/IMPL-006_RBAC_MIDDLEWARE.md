# IMPL-006 — Canonical RBAC middleware enforcement

Issue: #163

## Objective

Enforce one canonical authorization graph for authenticated tRPC traffic so human users, AI agents, auditors, phantom sessions, and administrators cannot bypass role/channel/account validation.

## Implemented contract

- `protectedProcedure` now validates that the authenticated account is active and resolves to one of the 29 canonical DROPi roles.
- Non-owner identities must have a role/channel pair matching `shared/types.ts -> ROLE_CONFIGS`.
- AI-agent identities use the same evaluator and receive no RBAC bypass.
- The legacy platform `role=admin` marker is normalized to the canonical `system_administrator` / `ADMIN` node for authorization instead of forming a parallel permission system.
- `adminProcedure`, `auditInvestigatorProcedure`, and `phantomProcedure` all pass through the same RBAC evaluator.
- `rbacProcedure(requirement)` provides route-level role, channel, and permission constraints backed by the same canonical role registry.
- Permission checks read the canonical permission arrays from `ROLE_CONFIGS`; no second permission table or hard-coded shadow graph was added.

## Failure behavior

Authorization fails closed with `FORBIDDEN` for:

- inactive accounts;
- unknown/missing DROPi roles;
- role/channel mismatches;
- disallowed roles;
- disallowed channels;
- missing required permissions.

Unauthenticated callers continue to fail with `UNAUTHORIZED`.

## Verification

The dedicated PR gate runs:

- canonical RBAC policy tests;
- real tRPC middleware tests;
- OAuth/JWT/session regression tests;
- TypeScript validation;
- whitespace validation.

## Runtime scope

No database migration, Expo dependency, native module, app version, or runtime version change is required. This implementation remains OTA-safe for runtime `1.0.1`.
