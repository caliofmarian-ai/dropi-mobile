# DROPi — Admin Account Provisioning

> **One-time operation.** Run once after the first Railway deployment to create the
> `dropi.deliveries@gmail.com` system administrator account.

---

## Context

The Railway production database does not auto-seed accounts on deployment.
The admin account `dropi.deliveries@gmail.com` must be provisioned manually using
the `scripts/provision-admin.ts` script compiled to `dist/provision-admin.mjs`.

The script is **idempotent**: if the account already exists it prints a confirmation
and exits with code 0 without modifying anything.

---

## Administrator RBAC Fields

| Field | Value | Reason |
|-------|-------|--------|
| `role` | `"admin"` | Legacy system-level access gate |
| `dropiRole` | `"system_administrator"` | DROPi RBAC role |
| `channel` | `"ADMIN"` | DROPi operational channel |
| `isActive` | `true` | Account is usable immediately |
| `isVerified` | `true` | No document verification required |
| `emailVerified` | `true` | No email verification required |
| `isAIAgent` | `false` | Human account |
| `loginMethod` | `"password"` | Email + password authentication |

---

## Pre-conditions

1. The Railway deployment is live (migrations 0000–0013 have been applied, `pnpm start` is running).
2. You have the `DATABASE_URL` for the Railway MySQL service.
3. You have decided on a strong password for `dropi.deliveries@gmail.com`.

---

## Railway Execution Procedure (one-time)

### Step 1 — Merge and wait for deployment

Merge the PR that includes this change into `main`.  
Wait until Railway redeploys and the backend is healthy (`/api/health` returns 200).

### Step 2 — Add temporary environment variables in Railway Dashboard

In **Railway Dashboard → dropi-mobile service → Variables**, add **temporarily**:

| Variable | Value |
|----------|-------|
| `ADMIN_EMAIL` | `dropi.deliveries@gmail.com` |
| `ADMIN_PASSWORD` | *(choose a strong password — min 8 chars, 1 uppercase, 1 digit)* |
| `ADMIN_NAME` | `Super Admin` *(optional — this is the display name)* |

> **Security:** these variables are only needed for the provisioning run. Remove them
> immediately after the script completes (Step 5).

### Step 3 — Run the provisioning script via Railway CLI

Install the [Railway CLI](https://docs.railway.app/develop/cli) if you do not have it:
```bash
npm install -g @railway/cli
railway login
```

Then run the compiled provisioning script **inside the Railway service environment**:
```bash
railway run --service dropi-mobile node dist/provision-admin.mjs
```

The script reads `DATABASE_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from the Railway
environment. It does **not** need those values passed directly in the shell command.

**Expected output (first run):**
```
[provision-admin] Starting admin provisioning...
[provision-admin] Target email: dropi.deliveries@gmail.com
[provision-admin] Connecting to database...
[provision-admin] ✓ Admin account created successfully for dropi.deliveries@gmail.com
```

**Expected output (if already exists):**
```
[provision-admin] Starting admin provisioning...
[provision-admin] Target email: dropi.deliveries@gmail.com
[provision-admin] Connecting to database...
[provision-admin] ✓ Admin account already exists for dropi.deliveries@gmail.com — no changes made
```

If the script exits with code 1, read the error message (it will NOT contain the password
or DATABASE_URL). Common causes: wrong DATABASE_URL, DB unreachable, weak password.

### Step 4 — Verify the account (optional safe read-only SQL)

In Railway Dashboard → MySQL plugin → Query Console, run:

```sql
SELECT id, email, role, dropiRole, channel, isActive, isVerified, emailVerified, createdAt
FROM users
WHERE email = 'dropi.deliveries@gmail.com';
```

Expected: 1 row with `role='admin'`, `dropiRole='system_administrator'`, `channel='ADMIN'`,
`isActive=1`, `isVerified=1`, `emailVerified=1`.

### Step 5 — Remove the temporary environment variables

In Railway Dashboard → Variables, **delete** `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME`.  
These variables are no longer needed and should not remain in the environment.

### Step 6 — Test login

Open the DROPi mobile app and log in with:
- Email: `dropi.deliveries@gmail.com`
- Password: *(the password you chose in Step 2)*

---

## Local / Development Execution

To run locally (requires `DATABASE_URL` pointing to a dev/test database):

```bash
# Build first (required — the script is compiled, not run with tsx)
pnpm build

# Then provision
ADMIN_EMAIL=dropi.deliveries@gmail.com \
ADMIN_PASSWORD=YourStrongPassword1 \
ADMIN_NAME="Super Admin" \
DATABASE_URL="your-mysql-url" \
pnpm db:provision-admin
```

Or with tsx (no build required):
```bash
ADMIN_EMAIL=dropi.deliveries@gmail.com \
ADMIN_PASSWORD=YourStrongPassword1 \
DATABASE_URL="your-mysql-url" \
npx tsx scripts/provision-admin.ts
```

---

## Password Recovery (if the password is forgotten)

Use the normal DROPi "Forgot Password" flow:
1. On the login screen, tap **Forgot Password**.
2. Enter `dropi.deliveries@gmail.com`.
3. Check the inbox for the 6-digit reset code.
4. Enter the code and set a new password.

This requires `SMTP_USER` and `GMAIL_APP_PASSWORD` (or equivalent SMTP credentials) to be
configured in Railway.

---

## Repairing a Corrupted or Missing Password Hash

If the admin account exists in the database but login still fails with
"Invalid email or password", the stored `passwordHash` may be missing, corrupted,
or out of sync with the current `ADMIN_PASSWORD`.

Use `scripts/repair-admin-hash.ts` to verify and repair the hash in-place:

```bash
# Build first
pnpm build

# Run the repair tool
ADMIN_EMAIL=dropi.deliveries@gmail.com \
ADMIN_PASSWORD=YourCurrentPassword1 \
DATABASE_URL="your-mysql-url" \
pnpm db:repair-admin-hash
```

The script:
1. Looks up the admin row by email (normalised to lowercase).
2. Checks whether the stored hash is a valid bcrypt hash.
3. Runs `bcrypt.compare(ADMIN_PASSWORD, storedHash)`.
4. If any check fails (missing, invalid format, or mismatch), regenerates the hash
   with `bcrypt.hash(ADMIN_PASSWORD, 12)` and updates the row.
5. Exits 0 in both the "ok" and "repaired" cases; exits 1 only on a fatal error.

The script never logs the password, the old hash, or the new hash.

After running, redeploy the Railway service (or it will pick up the fixed hash on
the next login attempt without a redeployment, since the hash is read from the DB
on every login).

---

## Security Notes

- The `ADMIN_PASSWORD` is **never** stored in source code, logs, or commit messages.
- The provisioning script uses bcrypt with salt rounds = 12 (identical to normal registration).
- The provisioning script is idempotent — running it twice is safe and makes no changes on the second run.
- The repair script is also idempotent — if the hash is already correct it makes no changes.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` must be removed from Railway after provisioning/repair.
