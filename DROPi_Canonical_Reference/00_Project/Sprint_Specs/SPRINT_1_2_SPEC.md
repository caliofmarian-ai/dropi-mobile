# Sprint 1-2 — Specificație Tehnică: Autentificare Reală + Audit Core

> **Versiune:** 1.0 — 27 Iunie 2026  
> **Blueprint Reference:** Faza 2.1 + Faza 6.1  
> **Status:** DRAFT — Necesită aprobare înainte de implementare

---

## 1. Obiectiv

Transformarea sistemului de autentificare din **mock** (hardcoded demo accounts, AsyncStorage local) într-un sistem **real** (parolă + JWT + DB) cu audit logging activ din prima zi. La finalul acestui sprint:

1. Utilizatorii pot crea cont cu email + parolă
2. Utilizatorii se pot autentifica real (server-side validation)
3. Fiecare acțiune generează un audit log automat
4. Administratorul poate accesa orice cont în phantom mode
5. Demo Mode rămâne funcțional (buton separat pe login screen)
6. Toate cele 29 conturi test + 29 conturi AI agent sunt create în DB

---

## 2. Starea Actuală (Ce Avem)

| Componentă | Status | Fișier |
|------------|--------|--------|
| Mock auth provider | ✅ Funcțional | `lib/auth-context.tsx` — 29 conturi hardcoded |
| OAuth backend | ✅ Existent | `server/_core/oauth.ts` — Manus OAuth flow |
| JWT session | ✅ Existent | `server/_core/sdk.ts` — HS256 sign/verify |
| DB schema users | ✅ Parțial | `drizzle/schema.ts` — lipsesc câmpuri auth |
| DB schema audit | ✅ Existent | `drizzle/schema.ts` — tabel `auditLogs` |
| tRPC guards | ✅ Basic | `server/_core/trpc.ts` — public/protected/admin |
| Login screen | ✅ Mock | `app/login.tsx` — email + demo panel |
| App provider | ✅ Mock | `app/_layout.tsx` — wraps cu `AuthProvider` mock |

**Decizie arhitecturală:** NU înlocuim Manus OAuth complet. Adăugăm un **al doilea mod de autentificare** (email + parolă) care funcționează independent de Manus, conform cerința canonică: "Autentificarea DROPi trebuie să fie complet separată și independentă de Manus."

---

## 3. Schema DB — Extensii

### 3.1 Tabel `users` — Câmpuri Noi

```sql
ALTER TABLE users ADD COLUMN passwordHash VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN resetToken VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN resetTokenExpiry TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN isAIAgent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN agentMode ENUM('autonomous', 'assistant') NULL;
ALTER TABLE users ADD COLUMN humanPairId INT NULL;
ALTER TABLE users ADD COLUMN lastIp VARCHAR(45) NULL;
ALTER TABLE users ADD COLUMN lastDevice VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN failedLoginAttempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN lockedUntil TIMESTAMP NULL;
```

### 3.2 Tabel `auditLogs` — Câmpuri Noi

```sql
ALTER TABLE auditLogs ADD COLUMN channel ENUM('C1', 'C2', 'C3', 'ADMIN') NULL;
ALTER TABLE auditLogs ADD COLUMN isAIAction BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE auditLogs ADD COLUMN isPhantomMode BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE auditLogs ADD COLUMN phantomAdminId INT NULL;
ALTER TABLE auditLogs ADD COLUMN ipAddress VARCHAR(45) NULL;
ALTER TABLE auditLogs ADD COLUMN userAgent VARCHAR(500) NULL;
ALTER TABLE auditLogs ADD COLUMN sessionId VARCHAR(100) NULL;
ALTER TABLE auditLogs ADD COLUMN duration INT NULL;
```

### 3.3 Tabel Nou: `sessions`

```sql
CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  deviceInfo VARCHAR(255) NULL,
  ipAddress VARCHAR(45) NULL,
  isPhantom BOOLEAN NOT NULL DEFAULT FALSE,
  phantomAdminId INT NULL,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  lastActiveAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

---

## 4. API Endpoints (tRPC Routers)

### 4.1 Router: `dropiAuth`

| Procedure | Type | Input | Output | Guard |
|-----------|------|-------|--------|-------|
| `register` | mutation | `{email, password, name, dropiRole, channel, zone?}` | `{user, token}` | public |
| `login` | mutation | `{email, password}` | `{user, token}` | public |
| `logout` | mutation | — | `{success}` | protected |
| `me` | query | — | `User` | protected |
| `forgotPassword` | mutation | `{email}` | `{success, message}` | public |
| `resetPassword` | mutation | `{token, newPassword}` | `{success}` | public |
| `changePassword` | mutation | `{currentPassword, newPassword}` | `{success}` | protected |
| `updateProfile` | mutation | `{name?, zone?}` | `User` | protected |

### 4.2 Router: `adminAuth`

| Procedure | Type | Input | Output | Guard |
|-----------|------|-------|--------|-------|
| `listUsers` | query | `{channel?, role?, search?, page?, limit?}` | `{users[], total}` | admin |
| `phantomLogin` | mutation | `{targetUserId}` | `{token, user}` | admin |
| `exitPhantom` | mutation | — | `{token, user}` | admin |
| `toggleUserActive` | mutation | `{userId, isActive}` | `{success}` | admin |
| `changeUserRole` | mutation | `{userId, dropiRole, channel}` | `{success}` | admin |
| `createTestAccounts` | mutation | — | `{created: number}` | admin |

### 4.3 Router: `audit`

| Procedure | Type | Input | Output | Guard |
|-----------|------|-------|--------|-------|
| `list` | query | `{channel?, userId?, action?, severity?, from?, to?, page?, limit?}` | `{logs[], total}` | admin |
| `getByUser` | query | `{userId, page?, limit?}` | `{logs[], total}` | admin |
| `getByResource` | query | `{resourceType, resourceId}` | `{logs[]}` | admin |
| `getStats` | query | `{channel?, from?, to?}` | `{stats}` | admin |

---

## 5. Audit Middleware — Design

### 5.1 Principiu

Fiecare procedură tRPC (protected sau admin) generează automat un audit log. Middleware-ul interceptează **după** execuția procedurii și logează:

```typescript
// Pseudo-code
const auditMiddleware = t.middleware(async (opts) => {
  const startTime = Date.now();
  const result = await opts.next(opts);
  const duration = Date.now() - startTime;
  
  await logAudit({
    userId: opts.ctx.user.id,
    userRole: opts.ctx.user.dropiRole,
    action: opts.path,           // e.g., "dropiAuth.login"
    resourceType: extractResourceType(opts.path),
    resourceId: extractResourceId(opts.input),
    channel: opts.ctx.user.channel,
    isAIAction: opts.ctx.user.isAIAgent,
    isPhantomMode: opts.ctx.session?.isPhantom ?? false,
    phantomAdminId: opts.ctx.session?.phantomAdminId ?? null,
    ipAddress: getClientIp(opts.ctx.req),
    userAgent: opts.ctx.req.headers['user-agent'],
    sessionId: opts.ctx.session?.id,
    severity: result.ok ? 'info' : 'warning',
    details: { input: sanitize(opts.input), success: result.ok },
    duration,
  });
  
  return result;
});
```

### 5.2 Reguli de Logare

| Eveniment | Severity | Detalii Logate |
|-----------|----------|----------------|
| Login reușit | info | email, device, IP |
| Login eșuat | warning | email, motiv, IP |
| Register | info | email, rol, canal |
| Logout | info | — |
| Phantom mode enter | critical | admin ID, target user ID |
| Phantom mode exit | critical | admin ID |
| Password reset request | info | email |
| Password changed | warning | user ID |
| Role changed | critical | admin ID, old role, new role |
| User blocked/unblocked | critical | admin ID, target user ID |

### 5.3 Marcaje Distincte

- **Acțiuni AI:** `isAIAction = true` + prefix `[AI]` în action string
- **Phantom Mode:** `isPhantomMode = true` + `phantomAdminId` populat
- **Separare canale:** Fiecare log are `channel` setat conform utilizatorul care a făcut acțiunea

---

## 6. Fluxuri de Autentificare

### 6.1 Register Flow

```
Client                    Server                    DB
  |                         |                       |
  |-- POST register ------->|                       |
  |   {email,pass,role}     |                       |
  |                         |-- validate input ---->|
  |                         |-- check duplicate --->|
  |                         |-- hash password ----->|
  |                         |-- INSERT user ------->|
  |                         |-- create session ---->|
  |                         |-- AUDIT LOG --------->|
  |<-- {user, token} -------|                       |
  |                         |                       |
  [Store token in SecureStore]
```

### 6.2 Login Flow

```
Client                    Server                    DB
  |                         |                       |
  |-- POST login ---------->|                       |
  |   {email, password}     |                       |
  |                         |-- find user by email->|
  |                         |-- verify password --->|
  |                         |-- check locked ------>|
  |                         |-- create session ---->|
  |                         |-- AUDIT LOG --------->|
  |<-- {user, token} -------|                       |
  |                         |                       |
  [Store token in SecureStore]
```

### 6.3 Phantom Mode Flow

```
Admin                     Server                    DB
  |                         |                       |
  |-- POST phantomLogin --->|                       |
  |   {targetUserId}        |                       |
  |                         |-- verify admin ------>|
  |                         |-- get target user --->|
  |                         |-- create phantom      |
  |                         |   session ----------->|
  |                         |-- AUDIT LOG           |
  |                         |   (CRITICAL) -------->|
  |<-- {token, user} -------|                       |
  |                         |                       |
  [Admin sees target's dashboard]
  [All actions logged as phantom]
```

### 6.4 Password Recovery Flow

```
Client                    Server                    Gmail
  |                         |                       |
  |-- POST forgotPassword ->|                       |
  |   {email}               |                       |
  |                         |-- generate token ---->|
  |                         |-- store token+expiry->|
  |                         |-- send email -------->|-- email -->
  |<-- {success} -----------|                       |
  |                         |                       |
  [User clicks link in email]
  |                         |                       |
  |-- POST resetPassword -->|                       |
  |   {token, newPassword}  |                       |
  |                         |-- verify token ------>|
  |                         |-- hash new password ->|
  |                         |-- update user ------->|
  |                         |-- invalidate token -->|
  |                         |-- AUDIT LOG --------->|
  |<-- {success} -----------|                       |
```

---

## 7. Securitate

| Măsură | Implementare |
|--------|-------------|
| Password hashing | bcrypt (12 rounds) |
| JWT expiration | 7 zile (refresh la fiecare request) |
| Rate limiting login | 5 încercări / 15 min per IP |
| Account lockout | 10 încercări eșuate → lock 30 min |
| Reset token | UUID v4, expiră în 1 oră |
| Input validation | Zod schemas pe toate input-urile |
| Password requirements | Min 8 chars, 1 uppercase, 1 number |
| Session invalidation | Logout invalidează token-ul |

---

## 8. Conturi Test (Seed Data)

### 8.1 Cele 29 Conturi Umane

Toate conturile demo existente (din `DEMO_USERS`) vor fi migrate în DB cu parolă: `DROPi2026!` (pentru testare). Fiecare cont păstrează:
- Email-ul existent (e.g., `customer@dropi.app`)
- Rolul și canalul existent
- Zona: `Manila-Central`
- `isAIAgent: false`

### 8.2 Cele 29 Conturi AI Agent

Pentru fiecare cont uman, se creează un echivalent AI:
- Email: `ai.customer@dropi.app` (prefix `ai.`)
- Nume: `AI Customer Agent`
- `isAIAgent: true`
- `agentMode: 'autonomous'`
- `humanPairId: <id-ul contului uman pereche>`
- Aceleași permisiuni ca perechea umană

### 8.3 Contul Super Admin

- Email: `superadmin@dropi.app`
- Parolă: `DROPiAdmin2026!`
- Rol: `system_administrator`
- Canal: `ADMIN`
- Permisiuni speciale: `phantom_mode`, `manage_users`, `manage_settings`

---

## 9. UI Changes

### 9.1 Login Screen (Redesign)

```
┌─────────────────────────────┐
│         DROPi Logo          │
│                             │
│  ┌───────────────────────┐  │
│  │ Email                 │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Password        👁    │  │
│  └───────────────────────┘  │
│                             │
│  [      Login Button      ] │
│                             │
│  Forgot password?           │
│  Don't have an account?     │
│  Register →                 │
│                             │
│  ─────── or ───────         │
│                             │
│  [  Enter Demo Mode  ]      │
│  (test all 29 roles)        │
│                             │
└─────────────────────────────┘
```

### 9.2 Register Screen (Nou)

```
┌─────────────────────────────┐
│       Create Account        │
│                             │
│  Name: [________________]   │
│  Email: [_______________]   │
│  Password: [____________]   │
│  Confirm: [_____________]   │
│                             │
│  Channel: [C1 ▼]           │
│  Role: [Customer ▼]        │
│  Zone: [Manila-Central ▼]  │
│                             │
│  [    Create Account    ]   │
│                             │
│  Already have an account?   │
│  Login →                    │
└─────────────────────────────┘
```

### 9.3 Forgot Password Screen (Nou)

```
┌─────────────────────────────┐
│     Reset Password          │
│                             │
│  Enter your email address   │
│  and we'll send you a       │
│  reset link.                │
│                             │
│  Email: [_______________]   │
│                             │
│  [   Send Reset Link   ]   │
│                             │
│  ← Back to Login            │
└─────────────────────────────┘
```

---

## 10. Strategie de Migrare

### Pas 1: Extindere Schema DB
- Adăugare câmpuri noi la `users`
- Adăugare câmpuri noi la `auditLogs`
- Creare tabel `sessions`
- Rulare migrații

### Pas 2: Implementare Backend Auth
- Router `dropiAuth` (register, login, logout, me, forgot, reset)
- Router `adminAuth` (phantom, listUsers, toggleActive)
- Audit middleware pe toate procedurile

### Pas 3: Seed Data
- Creare cele 29 conturi test + 29 AI + superadmin
- Populare cu parolă hash-uită

### Pas 4: Actualizare Frontend
- Redesign `app/login.tsx`
- Creare `app/register.tsx`
- Creare `app/forgot-password.tsx`
- Actualizare `lib/auth-context.tsx` → apeluri API reale
- Păstrare Demo Mode ca opțiune separată

### Pas 5: Testare
- Unit tests: register, login, logout, phantom
- Integration tests: flow complet register → login → acțiune → audit log generat
- Verificare: demo mode încă funcționează

---

## 11. Dependențe Externe

| Dependență | Scop | Notă |
|------------|------|------|
| `bcrypt` / `bcryptjs` | Password hashing | bcryptjs pentru compatibilitate Node |
| Gmail API (MCP) | Trimitere email reset | Deja configurat în sesiune |
| — | — | Nu sunt necesare alte dependențe externe |

---

## 12. Criterii de Acceptare

- [ ] Un utilizator nou poate crea cont cu email + parolă
- [ ] Un utilizator existent poate face login cu email + parolă
- [ ] Password recovery funcționează via email (Gmail)
- [ ] Fiecare login/register/acțiune generează audit log
- [ ] Audit log-urile AI sunt marcate cu `isAIAction = true`
- [ ] Phantom mode funcționează (admin → orice cont)
- [ ] Phantom mode logat separat (`isPhantomMode = true`)
- [ ] Demo Mode încă funcționează (buton pe login screen)
- [ ] Toate cele 29 conturi test există în DB cu parolă
- [ ] Toate cele 29 conturi AI agent există în DB
- [ ] Rate limiting pe login (5 încercări / 15 min)
- [ ] Account lockout după 10 încercări eșuate
- [ ] qa-debugger validation: CONFORM

---

> **Următorul pas:** Aprobare de la tine, apoi implementare.
