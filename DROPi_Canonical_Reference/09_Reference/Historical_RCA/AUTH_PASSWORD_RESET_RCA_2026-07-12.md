# DROPi — Auth / Password Reset RCA (2026-07-12)

## Scope

- Real-device evidence after PR #27 merge
- Current mobile auth client flow
- Current backend auth/reset implementation
- GitHub Actions evidence for the active mobile backend URL

## Proven evidence

### Mobile request path

- Login screen: `app/login.tsx`
- Client auth call: `lib/auth-context.tsx` → `apiCall("dropiAuth.login", ...)`
- Backend route: `server/routers.ts` → `dropiAuth`
- Login handler: `server/auth-router.ts` → `login`
- DB lookup: `server/db.ts` → `getUserByEmail`
- Password check: `bcrypt.compare(input.password, user.passwordHash)`

### Password reset path

- Screen: `app/forgot-password.tsx`
- Client auth call: `lib/auth-context.tsx` → `apiCall("dropiAuth.forgotPassword", ...)`
- Backend handler: `server/auth-router.ts` → `forgotPassword`
- User lookup: `db.getUserByEmail`
- Code persistence: `db.setResetToken`
- Email send: `sendRecoveryEmail(...)`
- Response to mobile: always success in the pre-fix code, even when delivery failed

### Production backend URL used by the mobile build

- GitHub Actions run `29192979619` (`EAS Build — Android APK (development)`) shows:
  - `EXPO_PUBLIC_API_BASE_URL: https://dropi-mobile-production.up.railway.app`
- This proves the fresh Android Development Build embeds the Railway production backend URL.

### Production backend/database architecture

- Runtime server reads `DATABASE_URL` or `MYSQL_URL` from env in `server/_core/env.ts`
- `server/db.ts` connects with `drizzle-orm/mysql2`
- Repository docs and handover describe Railway + MySQL plugin as the production backend/database setup

### Login result semantics

- `server/auth-router.ts` returns the same `Invalid email or password` error when:
  - user does not exist;
  - user exists but has no password hash;
  - password hash exists but `bcrypt.compare(...)` fails.
- Therefore the real-device login error alone does **not** prove whether the tested account exists.

### Seed/demo account evidence

- Demo/test accounts live in `lib/auth-context.tsx` only for local Demo Mode.
- The repo does **not** auto-seed those accounts on startup or deploy.
- `scripts/seed-accounts.ts` only prints SQL for manual execution; it is not wired into Railway build/deploy.
- Therefore any “expected account” based on Demo Mode or spec seed assumptions is not guaranteed to exist in production.

### Email delivery implementation mismatch

- Repo docs advertise generic SMTP envs: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Pre-fix backend code in `server/auth-router.ts` and `server/verification-router.ts` hardcoded Gmail transport and only used `GMAIL_APP_PASSWORD`
- That mismatch can make Railway email delivery fail even if generic SMTP envs are configured

### False-success / secret-logging bug in password reset

- Pre-fix `forgotPassword` flow:
  1. generated a reset code;
  2. persisted it with `db.setResetToken`;
  3. attempted SMTP;
  4. logged the code on failure;
  5. still returned success to mobile.
- This exactly matches the real-device symptom: verification screen + no email.

## Evidence table

| Stage | Expected behavior | Actual behavior before fix | Evidence | Verdict |
|---|---|---|---|---|
| Mobile config | Native build uses Railway API URL | Fresh PR #27 build embeds Railway URL | GitHub Actions run `29192979619` | Proven fixed in PR #27 |
| Login request path | UI reaches backend login procedure | `dropiAuth.login` posts email/password to backend | `app/login.tsx`, `lib/auth-context.tsx`, `server/auth-router.ts` | Proven |
| Login decision | Backend should distinguish account/password internally | Public response collapses missing user and wrong password into one error | `server/auth-router.ts` | Proven |
| Test/demo accounts | Expected test accounts available if intended for real login | No automatic seed on deploy | `lib/auth-context.tsx`, `scripts/seed-accounts.ts` | Proven gap |
| Reset code creation | Code should exist only when backend can continue reset flow safely | Code was persisted before confirming email delivery | `server/auth-router.ts` pre-fix | Proven bug |
| Email provider config | Backend should honor documented SMTP env contract | Runtime only supported Gmail app password | `server/auth-router.ts` pre-fix, `server/verification-router.ts` pre-fix, `.env.example`, `docs/MOBILE_FIRST_SETUP.md` | Proven mismatch |
| Reset API response | Mobile should not see success when email was not sent | Backend always returned success after SMTP failure | `server/auth-router.ts` pre-fix | Proven bug |
| Runtime/network stability | Backend URL should be reachable consistently | One real-device attempt reported `Network request failed` | Real-device observation only; no Railway log access from agent | Not proven root cause |

## Root causes

1. **Password-reset backend returned false success on SMTP failure.**
   - The reset code was created first, email delivery failure was swallowed, and the UI still advanced.

2. **Email transport implementation did not match the documented Railway env contract.**
   - Docs/env advertise generic SMTP settings, but runtime only used Gmail + `GMAIL_APP_PASSWORD`.

3. **Production login for the tested account is still not provable from the generic UI error alone.**
   - Backend intentionally uses the same error for “user missing” and “wrong password”.
   - The repo also does not auto-seed demo/test accounts into Railway production.

## Changes made

- Added `server/_core/mail.ts`
  - supports documented SMTP envs first;
  - falls back to Gmail app password when present;
  - masks email addresses in logs.
- Updated `server/auth-router.ts`
  - uses shared mail helper;
  - removes reset-code logging;
  - clears reset token and returns an error when password-reset email delivery fails.
- Updated `server/verification-router.ts`
  - uses the same shared mail helper for consistency with documented env config.
- Added tests:
  - `tests/mail-config.test.ts`
  - `tests/auth.forgot-password.test.ts`

## Validation

- `pnpm lint` ✅
- `pnpm test` ✅
- `pnpm build` ✅
- `pnpm check` ❌ pre-existing TypeScript issues outside this fix:
  - `app/order/[id].tsx`
  - `lib/trpc.ts`
  - `server/operations-router.ts`

## Remaining unverified items

- Exact production DB contents for the real-device test email
- Exact Railway production env presence by name for SMTP vars
- Railway runtime logs for the exact real-device attempts
- Exact cause of the intermittent `Network request failed`

These remain unverified because the agent could inspect repository code and GitHub Actions logs, but did not have direct Railway dashboard/database access in this session.
