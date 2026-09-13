# DROPi — Session Handover (Stare Activă)

> **STATUS: CANONIC — NU SE ȘTERGE NICIODATĂ**
> Acest document se **actualizează la sfârșitul fiecărei sesiuni de lucru**, indiferent de agentul AI folosit (GitHub Copilot Agent, Manus, sau altul).
> Scopul este continuitatea completă între sesiuni și între platforme, fără pierdere de context.

---

## ⚠️ REGULĂ OBLIGATORIE PENTRU TOȚI AGENȚII

**La sfârșitul oricărei sesiuni de lucru**, agentul activ TREBUIE să:
1. Actualizeze secțiunile de mai jos cu starea reală.
2. Commit și push modificările în repository.
3. Abia apoi să închidă sesiunea.

**La începutul oricărei sesiuni noi**, agentul activ TREBUIE să:
1. Citească acest fișier **primul**, înainte de orice altă acțiune.
2. Citească `canonical/AI_DEVELOPMENT_HANDOVER_CANON.md` pentru context strategic.
3. Continuă de la **Pasul Următor Concret** definit mai jos.

---

## 1. Ultima Sesiune

| Câmp | Valoare |
|------|---------|
| **Platformă** | ChatGPT Work / Codex |
| **Data** | 2026-09-12 |
| **Branch activ** | `planning/passenger-mobility-c1` |
| **Agent** | Codex |

### Sesiune curentă (C1 Passenger Mobility + corpus juridic canonic) — 2026-09-12

**Scop acceptat de Project Owner:** planificare pentru România și Filipine, cu model juridic hibrid per jurisdicție; documentație canonică + UX + plan tehnic/backlog, fără implementare runtime. Legile, ordonanțele, regulamentele, procedurile și sursele oficiale folosite pentru produs trebuie păstrate, versionate și trasate în repository, iar lipsurile trebuie să blocheze explicit designul dependent de lege și operarea.

**Decizii produse:**

- Passenger Mobility este un serviciu distinct în C1, nu un canal nou și nu o extensie a comenzilor/livrărilor de colete.
- După implementarea shell-ului, Passenger Mobility rămâne vizibil ca ramură C1 chiar înainte de autorizare; starea implicită este `catalog_locked`, cu mesaj explicit „autorizare în curs” și fără colectare de locație, traseu, pasager sau plată.
- Activarea este etapizată: `catalog_locked → onboarding_open → pilot_only → public_live`; onboardingul, cererile, ofertele și pornirea cursei au porți independente și fail-closed.
- Același cont păstrează rolurile existente; autorizarea pentru `parcel_ground`, `parcel_drone`, `passenger_car` și `passenger_tricycle` este separată și scoped la persoană, operator, vehicul, jurisdiction pack, zonă și timp.
- `users.isVerified` și un permis de conducere aprobat nu pot conferi dreptul de a transporta persoane.
- C2 Passenger Mobility este rezervat/dezactivat. C3 exclude taxi, ride-hailing, transport medical/pacient și urgență.
- România folosește un pack separat pentru transport alternativ cu autoturism; platforma, operatorul de transport, șoferul și mașina sunt actori juridici distincți.
- Filipine folosește pack separat TNC/TNVS pentru autoturism. Tricicletele rămân `disabled_legal_gate` până la selectarea LGU-ului exact din Zone 0 și confirmarea scrisă a regulilor locale.
- Capacitatea de pasageri este minimul dovedit de înmatriculare, autorizație/franciză, asigurare, regulă locală și plafon de siguranță; aplicația nu presupune automat 1–2 locuri la tricicletă.
- În prima versiune, un partener/vehicul nu poate avea simultan o cursă DROPi și o misiune DROPi de colet activă.
- Legea în vigoare și autoritatea competentă rămân autoritatea externă; repository-ul este evidența canonică DROPi a sursei/versionării, interpretării, aprobării, implementării și revalidării.
- Regula obligatorie este „no source → no approved requirement → no law-dependent design/enablement”; sursele lipsă, vechi, contradictorii sau marcate doar pentru cercetare sunt fail-closed.
- Autorizarea companiei/pieței/serviciului și autorizarea partenerului/persoanei/operatorului/vehiculului sunt două porți independente. Compania se poate autoriza și lansa etapizat per țară, entitate, serviciu, vehicul și zonă; nu există „autorizat pentru toate”.
- Cerințele de stat sunt etichetate separat de politicile DROPi/asigurătorului. Nu există în corpusul curent dovada unui atestat de stat universal pentru curierul pe bicicletă obișnuită; instruirea și asigurarea pot fi totuși reguli interne/contractuale.
- Pagina ARR capturată are o contradicție: secțiunea română indică CAEN 4933, iar cea engleză încă 4939. Niciun cod nu va fi hardcodat fără confirmare scrisă ONRC/ARR și analiza rolului juridic exact.

**Documente create/actualizate:**

- `canonical/PASSENGER_MOBILITY.md` — canon v1.0.0, planning/not live;
- `docs/research/PASSENGER_MOBILITY_LEGAL_BASELINE_RO_PH.md` — cercetare juridică cu surse oficiale și alerte de revalidare;
- `docs/ux/PASSENGER_MOBILITY_UX_SPEC.md` — fluxuri Customer/Merchant, Delivery Partner și Admin;
- `docs/planning/PASSENGER_MOBILITY_IMPLEMENTATION_PLAN.md` — date, API, state machine, securitate, testare, rollout și DoD;
- `canonical/LEGAL_COMPLIANCE_SOURCE_OF_TRUTH.md` — politica de autoritate a surselor, lifecycle de cerință, porți duble, autorizare etapizată și fail-closed;
- `docs/legal/legal-source-register.json` — 35 înregistrări cu proveniență, status, hash și stare de utilizare;
- `docs/legal/sources/` — 22 snapshot-uri oficiale imuabile (UE, România, Filipine) verificate prin SHA-256 și byte length;
- `docs/legal/LEGAL_REQUIREMENTS_TRACEABILITY.md` — mapare sursă → cerință → poartă companie/partener/produs pentru delivery rutier, drone și Passenger Mobility;
- `docs/legal/LEGAL_GAPS_AND_BLOCKERS.md` și `docs/legal/source-notes/PH-TNC-TNVS-SOURCE-STATUS.md` — lipsuri P0/P1 și starea surselor LTFRB;
- `scripts/validate-legal-sources.mjs` + `pnpm legal:sources:validate` — control pentru registru, fișiere, SHA-256, dimensiune, dubluri și surse neregistrate;
- reconciliate `canonical/README.md`, `canonical/DELIVERY_MULTIMODAL.md`, `canonical/PASSENGER_MOBILITY.md`, `canonical-structure.md`, `ARCHITECTURE.md`, UX, planul tehnic, cercetarea juridică și `DECISION_LOG.md`.

**Backlog GitHub creat:** epic [#460](https://github.com/caliofmarian-ai/dropi-mobile/issues/460), cu PM-001–PM-007 în [#453](https://github.com/caliofmarian-ai/dropi-mobile/issues/453), [#454](https://github.com/caliofmarian-ai/dropi-mobile/issues/454), [#455](https://github.com/caliofmarian-ai/dropi-mobile/issues/455), [#456](https://github.com/caliofmarian-ai/dropi-mobile/issues/456), [#459](https://github.com/caliofmarian-ai/dropi-mobile/issues/459), [#457](https://github.com/caliofmarian-ai/dropi-mobile/issues/457) și [#458](https://github.com/caliofmarian-ai/dropi-mobile/issues/458).

**Validări pentru schimbarea de documentație:**

- `git diff --cached --check` ✅ — fără whitespace errors;
- `node scripts/validate-legal-sources.mjs` ✅ — 35 surse înregistrate, 22 fișiere imuabile, toate hash-urile și dimensiunile corespund;
- `git diff --check` ✅ — fără whitespace errors pentru schimbarea corpusului juridic;
- validare JSON și unicitate ID/path pentru registrul juridic ✅;
- inventar și legături canonice verificate ✅;
- `pnpm test` / `pnpm lint` nu au pornit prin wrapper-ul local deoarece pnpm a blocat scripturile de build neaprobate pentru `esbuild` și `unrs-resolver`; nu s-a modificat politica de încredere a dependențelor;
- rulare directă Vitest: 318 teste trecute, 4 eșecuri runtime preexistente (`mail-config` ×3, `native-trpc-transport-contract` ×1), 1 skipped; încă 33 fișiere bazate pe `node:test` sunt raportate de Vitest ca „No test suite found”; niciun fișier afectat nu este parte din această schimbare documentară;
- rulare directă ESLint: 10 erori și 133 warnings preexistente exclusiv în fișiere runtime nemodificate; documentele Passenger Mobility nu introduc erori lint.

**Stare runtime:** nicio tabelă, migrație, rută API, interfață mobilă, autorizare, plată sau cursă live nu a fost adăugată. Toate suprafețele Passenger Mobility rămân fail-closed.

### Ce s-a făcut în sesiunile anterioare (context auth/reset + database-migration-audit + oauth-optional):
- Rezumat complet în PR #28, PR #29, PR #30 și PR #31 (merged). Detalii în versiunile anterioare ale acestui document.
- Stare produsă de PR #30 (merged): Railway backend Online, MySQL Online, migrații 0000–0013 aplicate, 26 tabele prezente.

### Sesiune anterioară (OAUTH_SERVER_URL optional fix — PR #31 merged):

**ROOT CAUSE identificat:** `server/_core/sdk.ts` instanțiaza `OAuthService` ca singleton la încărcarea modulului și logga `console.error` la startup când `OAUTH_SERVER_URL` era absent — chiar dacă autentificarea email/parolă a DROPi nu necesită niciodată OAuth.

**Audit complet efectuat:**
- Fiecare fișier care citește `OAUTH_SERVER_URL`: `server/_core/env.ts`, `server/_core/sdk.ts`, `server/README.md`, `scripts/load-env.js`, `constants/oauth.ts`, `.env.example`
- `OAUTH_SERVER_URL` este folosit EXCLUSIV pentru: login extern Manus OAuth (`/api/oauth/callback`, `/api/oauth/mobile`) și sesiuni cron Manus
- Autentificarea email/parolă DROPi (`auth-router.ts`) folosește doar JWT signing/verification cu `JWT_SECRET` — nu contactează niciodată serverul OAuth
- Pe Railway production, OAuth Manus este infrastructură legacy neutilizată

**Fix implementat:**
- `server/_core/sdk.ts`: `console.error` → `console.warn` cu mesaj clar că OAuth este optional/legacy; mesajul "[OAuth] ERROR:" eliminat din Railway production logs
- `server/_core/sdk.ts`: guard explicit în `authenticateRequest` când userul nu e în DB și OAuth nu e configurat (eroare mai clară vs. timeout de rețea)
- `server/_core/oauth.ts`: import `ENV` + guard 503 pe `/api/oauth/callback` și `/api/oauth/mobile` când `OAUTH_SERVER_URL` lipsește (în loc de fail cu eroare de rețea)
- `tests/sdk.oauth-optional.test.ts`: 5 teste noi care verifică: fără console.error, console.warn cu mesaj explicativ, JWT signing/verification funcționează fără OAuth

**Validări:**
- `pnpm test` ✅ — 12 passed, 2 skipped (nicio regresie)
- `pnpm build` ✅ — build reușit
- `pnpm lint` ✅ — 0 errors (70 warnings preexistente)
- secret scan ✅ — fără secrete introduse
- CodeQL ✅ — 0 alerts

### Ce s-a făcut în sesiunile anterioare pe branch `copilot/database-migration-audit` (PR #30 merged):
- Audit complet al tuturor celor 14 migrații drizzle (0000–0013) vs. schema.ts.
- Identificat problemă critică: `drizzle/meta/0013_snapshot.json` lipsea complet.
  - Migrația `0013_agent_orchestrator.sql` a fost creată manual (fără `drizzle-kit generate`).
  - Fără snapshot, `drizzle-kit generate` viitor ar compara schema față de starea din 0012, ignorând cele 3 tabele noi (agentTasks, agentState, agentReports) și ar genera o migrație duplicată.
- Fix aplicat: creat `drizzle/meta/0013_snapshot.json` cu toate 26 de tabele (23 din 0012 + 3 noi din 0013).
- Verificat consistența: toate 26 tabele din schema.ts au migrații corespunzătoare.
- **Implementat mecanism de migrare producție** (cerință obligatorie):
  - Creat `scripts/migrate.ts` — runner programmatic care folosește `drizzle-orm/mysql2/migrator` (NU `drizzle-kit`), deci funcționează fără devDependencies la runtime.
  - Creat `scripts/validate-db.ts` — validare post-migrare: verifică existența celor 26 tabele, istoricul `__drizzle_migrations` cu 14 intrări, și raportează users count.
  - Actualizat `package.json`: comanda `build` compilează și `scripts/migrate.ts` → `dist/migrate.mjs` și `scripts/validate-db.ts` → `dist/validate-db.mjs`; adăugat `db:migrate` (alias `drizzle-kit migrate` pentru uz local).
  - Actualizat `railway.toml`: `startCommand = "node dist/migrate.mjs && node dist/validate-db.mjs && pnpm start"` — migrațiile rulează înainte de pornirea serverului; orice eșec blochează startup-ul.
- Validare: `pnpm build` ✅, `pnpm test` ✅, `pnpm lint` ✅, secret scan ✅, CodeQL ✅ (0 alerts)

### Sesiune de verificare 2026-07-12:
- Codul implementat de sesiunea anterioară verificat și confirmat complet.
- Confirmat că cele 26 tabele din `drizzle/meta/0013_snapshot.json` corespund cu lista din `scripts/validate-db.ts`.

### Sesiune anterioară (fix-auth-crypto-email / PR #32) — 2026-07-12:
- **Diagnoza blocantelor producție verificate live:**
  - Login eșuează cu `crypto is not defined` → `jose` v6 folosește bara `crypto` globală (Web Crypto API). Pe Node.js < 19 (inclusiv Railway cu Node.js 18 LTS), `crypto` nu este expus ca identificator global în modul ESM fără `--experimental-global-webcrypto`.
  - Email de recuperare parolă nu ajunge → `mail.ts` folosea `"dropi.deliveries@gmail.com"` ca username Gmail implicit (hardcodat) când `SMTP_USER` nu era setat; fiecare Gmail App Password este legat de contul specific care l-a generat.

- **Fix A — Login (`crypto is not defined`):**
  - `server/_core/index.ts`: import `webcrypto` din `node:crypto`; polyfill `globalThis.crypto = webcrypto` dacă nu este definit — rulează sincron la inițializarea server-ului, înainte de orice request handler.
  - `server/storage.ts`: înlocuit `crypto.randomUUID()` global cu `import { randomUUID } from "node:crypto"` explicit.

- **Fix B — Email de recuperare (Gmail):**
  - `server/_core/mail.ts`: eliminat fallback hardcodat `"dropi.deliveries@gmail.com"` pentru `SMTP_USER`.
  - Când `GMAIL_APP_PASSWORD` este setat dar `SMTP_USER` lipsește → log `[SMTP]` error cu instrucțiunile exacte pentru Railway (ce variabilă să adauge), returnează `null` (transport neconfigurat).
  - Erori Nodemailer: logate DOAR mesajul (`.message`), nu obiectul complet care poate conține credențiale SMTP.

- **Teste noi:**
  - `tests/auth.login-session.test.ts` (nou): 3 teste jose WebCrypto — creeare/verificare JWT, respingere semn greșit. Prove că nu se aruncă `ReferenceError: crypto is not defined`.
  - `tests/auth.forgot-password.test.ts`: adăugat test care verifică că codul de reset (6 cifre) nu apare în niciun canal de logging.
  - `tests/mail-config.test.ts`: actualizat — noul test verifică că `GMAIL_APP_PASSWORD` fără `SMTP_USER` returnează `null` și loghează eroarea.

### Sesiune curentă (merge conflict resolution pentru PR #32) — 2026-07-13:
- `origin/main` a fost integrat în branch-ul `copilot/read-only-verification`.
- Singurul conflict real a fost în `canonical/SESSION_HANDOVER.md`.
- Toate fixurile din PR #32 au fost păstrate împreună cu schimbările deja merged în `main`, inclusiv PR #30 și PR #31.
- Validările finale se rulează după rezolvarea conflictului; rezultatul va fi reflectat în commitul acestei sesiuni.

### Sesiune curentă (Admin Account Provisioning) — 2026-07-14:

**ROOT CAUSE CONFIRMED (din RCA sesiunii anterioare):**
- Contul de administrator `dropi.deliveries@gmail.com` nu există în Railway MySQL production (query read-only confirmat: 0 rows).
- `scripts/seed-accounts.ts` generează SQL dar nu se execută automat la deployment.
- `server/db.ts::createUser` setează mereu `role: "user"` — nu suportă crearea de conturi admin.
- Nu exista niciun mecanism de provisioning admin în repository.

**Mecanism implementat:**
- `scripts/provision-admin.ts` — script one-time, idempotent, compilat la `dist/provision-admin.mjs`
- Citeste `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (și `ADMIN_NAME` opțional) din env vars
- Verifică dacă contul există deja → dacă da, exitează cu 0 fără schimbări
- Dacă nu există: bcrypt.hash(password, 12) + insert cu câmpuri RBAC canonice admin
- Niciodată nu loghează parola, hash-ul, DATABASE_URL, sau alte secrete
- `validateEnv()` validează forța parolei (minim 8 caractere, 1 majusculă, 1 cifră) — aceleași reguli ca auth-router.ts

**Câmpuri RBAC admin setate:**
- `role: "admin"` — accesul la adminProcedure (sistem legacy + DROPi)
- `dropiRole: "system_administrator"` — rolul DROPi RBAC
- `channel: "ADMIN"` — canalul operațional DROPi
- `isActive: true`, `isVerified: true`, `emailVerified: true` — cont activ și verificat imediat
- `isAIAgent: false`, `loginMethod: "password"`, `zone: null`

**Fișiere adăugate/modificate:**
- `scripts/provision-admin.ts` (nou)
- `tests/provision-admin.test.ts` (nou — 25 teste)
- `docs/ADMIN_PROVISIONING.md` (nou — procedura Railway)
- `package.json` — build include provision-admin; adăugat `db:provision-admin`
- `.env.example` — documentate `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`

**Validări:**
- `pnpm test` ✅ — 68 passed, 2 skipped (25 teste noi fără regresie)
- `pnpm build` ✅ — dist/provision-admin.mjs compilat
- `pnpm lint` ✅ — 0 errors, 69 warnings preexistente
- `pnpm check` ❌ — 11 erori TypeScript preexistente (app/order/[id].tsx, server/operations-router.ts, tests/smtp.test.ts) — 0 erori noi introduse
- secret scan ✅ — fără secrete introduse
- CodeQL ✅



**ROOT CAUSES PROVEN (din Railway production logs post-PR #33):**

**A. SMTP / Password Reset — `connect ENETUNREACH 2a00:1450:4025:401::6d:465`**
- Nodemailer 9.x cu `service: "gmail"` face `dns.resolve4` + `dns.resolve6` intern și alege o adresă **random** (`Math.floor(Math.random() * addresses.length)` în `lib/shared/index.js`).
- Railway are conectivitate IPv6 outbound instabilă → când Nodemailer alege IPv6, se produce ENETUNREACH.
- **Fix:** Pre-resolve `smtp.gmail.com` via `dns.resolve4` (numai IPv4) înainte de crearea transporterului; când `host` este deja o adresă IP, `net.isIP(host)` returnează non-zero și Nodemailer sare complet peste DNS intern. Adăugat `tls: { servername: "smtp.gmail.com" }` pentru SNI (altfel TLS ar verifica cert față de IP literal). Adăugat `connectionTimeout/greetingTimeout/socketTimeout` (10s/10s/15s) pentru ambele transporturi.

**B. Verify Email — `[Auth] Session payload missing required fields` → `Please login (10001)`**
- `ENV.appId = process.env.VITE_APP_ID ?? ""` — `VITE_APP_ID` este o variabilă Vite/Expo build-time, nu o variabilă Railway; pe Railway producție `appId = ""`.
- Vechea `verifySession` cerea `isNonEmptyString(appId)` → false cu `""` → token respins → toate request-urile autentificate eșuau.
- Similar, `name: user.name || ""` produce string gol pentru user fără name.
- **Fix:** `verifySession` acum cere doar `openId` non-empty; `appId`/`name` se acceptă ca string gol; validarea HMAC a semnăturii JWT garantează autenticitatea tokenului — claims suplimentare nu adaugă securitate.

**Fișiere modificate:**
- `server/_core/mail.ts`: `resolveIPv4Host()` export nou, transport Gmail explicit cu host/port/secure/tls + timeouts
- `server/_core/sdk.ts`: `verifySession` relaxed — doar `openId` obligatoriu
- `tests/smtp.test.ts`: 11 teste noi (IPv4 forcing, ENETUNREACH, timeout, no-credentials-logged, transport options)
- `tests/sdk.authenticate-request.test.ts`: 5 teste noi (empty appId, empty name, both empty, empty openId rejected, missing cookie)

**Validări:**
- `pnpm test` ✅ — 40 passed, 2 skipped (credentiale live)
- `pnpm build` ✅
- `pnpm lint` ✅ — 0 errors, 69 warnings preexistente
- secret scan ✅ — fără secrete introduse
- CodeQL ✅ — 0 alerts

### Sesiune curentă (Security Audit PR #36 — JWT/SMTP) — 2026-07-13:

**AUDIT COMPLET PR #36 — REZULTAT: PASS, MERGE RECOMANDAT**

**Scopul auditului:** Verificare securitate și corectitudine înainte de merge PR #36 (fix SMTP ENETUNREACH + JWT verifySession empty-appId).

**Concluzia JWT:**
- `appId` este **OPTION B**: câmp legacy Manus/OAuth, NU o granița de securitate pentru autentificarea email/parolă DROPi. `VITE_APP_ID` este o variabilă Vite build-time; nu există în Railway runtime → `appId = ""` permanent. HMAC-SHA256 (JWT_SECRET) este singura frontieră de securitate reală. Relaxarea validării `appId`/`name` nu slăbește autentificarea cu niciun bit.
- JWT integrity enforced: semnătură HMAC-SHA256, expirationTime (exp), algorithm enforcement (HS256 only). Wrong-secret, expired, malformed → toate respinse prin `jwtVerify`.
- Fix canonic: `verifySession` cere doar `openId` non-empty (cheia de lookup user în DB). Restul claimurilor JWT sunt informaționale.

**Teste lipsă identificate și adăugate:**
- `tests/sdk.authenticate-request.test.ts` — 3 teste noi de invarianți de securitate JWT:
  1. Wrong secret → verifySession returnează null (HMAC integrity enforced)
  2. Expired token → verifySession returnează null (exp claim enforced)
  3. Malformed token → verifySession returnează null

**Validări finale:**
- `pnpm test` ✅ — 43 passed, 2 skipped (3 teste noi adăugate)
- `pnpm lint` ✅ — 0 errors, 69 warnings preexistente
- `pnpm build` ✅
- secret scan ✅ — fără secrete introduse
- CodeQL ✅ — trivial change (test-only)

### Sesiune curentă (RCA missing session cookie pe verify email / resend verification) — 2026-07-13:
- **RCA PROVEN:** blocantul nu era în backend auth logic și nici în forgot-password; era un mismatch de transport/token store pe clientul mobil.
- **Fluxul bun (mobile auth normal):**
  - login/register email-parolă creează JWT-ul de sesiune în `server/auth-router.ts`;
  - mobile îl salvează în `AsyncStorage` și îl bridge-uiește în store-ul canonic `SecureStore` prin `Auth.setSessionToken(...)` în `lib/auth-context.tsx`;
  - endpoint-urile mobile obișnuite folosesc clientul tRPC din `lib/trpc.ts`, care citește token-ul din `SecureStore` prin `lib/_core/trpc-auth.ts` și îl trimite în header-ul `Authorization` cu JWT-ul Bearer.
- **Fluxul defect (verify email / resend):**
  - `app/verify-email.tsx` NU folosea clientul tRPC canonic;
  - ecranul făcea `fetch` manual și citea separat `@dropi_token` din `AsyncStorage`;
  - dacă acea copie lipsea / nu era store-ul suportat de fluxul mobil curent, request-ul pleca fără `Authorization`, iar pe native nici cookie-ul de sesiune nu exista;
  - backend-ul în `server/_core/sdk.ts` încearcă `Authorization` întâi și cookie-ul `app_session_id` doar ca fallback; fără ambele, loghează `[Auth] Missing session cookie`, apoi `protectedProcedure` returnează `Please login (10001)`.
- **De ce forgot-password este nerelevant:** `dropiAuth.forgotPassword` rămâne `publicProcedure` în `server/auth-router.ts`, deci nu folosește `sdk.authenticateRequest` și nu depinde de cookie/token de sesiune.
- **Fix aplicat:**
  - `app/verify-email.tsx` a fost mutat pe mutațiile tRPC canonice `trpc.dropiAuth.verifyEmail.useMutation()` și `trpc.dropiAuth.resendVerificationCode.useMutation()`;
  - `lib/trpc.ts` folosește helper-ul partajat `lib/_core/trpc-auth.ts`, astfel verify/resend trimit exact același JWT transport ca endpoint-urile mobile autentificate care funcționează deja.
- **Teste noi:**
  - `tests/auth.verify-email.test.ts` — user autentificat poate verifica emailul și poate cere resend; user neautentificat este respins cu `Please login (10001)`;
  - `tests/sdk.authenticate-request.test.ts` — dovedește că backend-ul acceptă JWT-ul mobil din `Authorization` fără cookie și că lipsa ambelor produce exact logica `Missing session cookie` / `Invalid session cookie`;
  - `tests/trpc.auth-headers.test.ts` — dovedește că transportul mobil canonic citește token-ul din store-ul suportat și construiește header-ul `Authorization`.
- **Validări sesiune:**
  - `pnpm install --frozen-lockfile` ✅
  - `pnpm test` ✅ — 24 passed, 2 skipped
  - `pnpm lint` ✅ — 0 errors, 69 warnings preexistente
  - `pnpm build` ✅
  - `pnpm check` ❌ — erori preexistente, nelegate de acest fix, în `app/order/[id].tsx` și `server/operations-router.ts`

### Acțiune Railway obligatorie (manual, fără modificare cod):
```
Railway Dashboard → dropi-mobile service → Variables → Add Variable:
  SMTP_USER = <adresa Gmail care a generat GMAIL_APP_PASSWORD>
```
Fără această variabilă, emailul de recuperare rămâne blocant chiar și după deploy.

### Ce s-a făcut în sesiunile anterioare pe branch `copilot/fix-eas-quota-ci-failure` (PR #29 merged — context auth/reset):
- Audit complet auth/reset după testul real-device post-PR #27.
- Fix aplicat:
  - helper nou `server/_core/mail.ts` cu suport SMTP generic + fallback Gmail;
  - `forgotPassword` curăță reset token-ul și returnează eroare reală dacă livrarea emailului eșuează;
  - au fost eliminate log-urile care expuneau codurile de reset în clar.
- Adăugat raport RCA: `docs/AUTH_PASSWORD_RESET_RCA_2026-07-12.md`.
- Adăugate teste: `tests/mail-config.test.ts`, `tests/auth.forgot-password.test.ts`.

### Sesiune curentă (Focused login RCA diagnostics) — 2026-07-15:
- Audit static complet al fluxului `dropiAuth.login` de la request HTTP până la crearea JWT:
  - client mobil: `lib/auth-context.tsx`
  - mount backend tRPC: `server/_core/index.ts`, `server/routers.ts`
  - login flow: `server/auth-router.ts`
  - DB lookup: `server/db.ts`
  - JWT creation: `server/_core/sdk.ts`
  - provisioning admin: `scripts/provision-admin.ts`
- RCA confirmat din cod:
  - mesajul exact `Invalid email or password` poate veni DOAR din `server/auth-router.ts` și înseamnă fie `!user || !user.passwordHash`, fie `bcrypt.compare(...) === false`;
  - `isVerified`, `emailVerified`, `role`, `dropiRole`, `channel` NU participă la validarea login-ului;
  - endpoint-ul așteaptă hash bcrypt din câmpul `users.passwordHash`; scriptul `provision-admin` generează același tip de hash (`bcryptjs`, rounds=12), deci nu există mismatch de algoritm/field în cod.
- Limitarea observabilității actuale:
  - codul nu loghează explicit dacă login-ul eșuează pentru `user_not_found`, `missing_password_hash` sau `bcrypt.compare=false`, deci producția nu poate fi probată complet doar din mesajul generic.
- PR diagnostic focusat pregătit:
  - `server/auth-router.ts` loghează DOAR: `request_received`, `user_found=yes/no`, `bcrypt_compare=true/false`, `failure_reason=...`
  - nu loghează parola, hash-ul sau alte secrete; emailul este mascat prin `maskEmail(...)`
- Validări:
  - `pnpm test` ✅
  - `pnpm build` ✅
  - `pnpm lint` ✅ (0 errors, warnings preexistente)

### Sesiune curentă (RCA Verify Email / Resend — mail delivery silent failure) — 2026-07-15:

**ROOT CAUSE PROVEN:**
`server/auth-router.ts` — `resendVerificationCode` (liniile 506-543 ÎNAINTE de fix):
- Genera cod ✅ → persista în DB ✅ → apela `sendVerificationEmail` ✅ → verifica `if (!sent)` ✅
- **BUG:** pe delivery failure, logga DOAR `console.warn` și returna `{ success: true }` necondiționat ❌
- Niciodată nu arunca `TRPCError` pe livrare eșuată → mobilul primea mereu succes → afișa mereu "Code Sent"

**Does APK request reach Railway: YES**
- `resendVerificationMutation.mutateAsync()` este așteptat (`await`) ÎNAINTE de dialog
- Dacă request-ul nu ar ajunge la Railway, `catch` block-ul din mobile ar afișa "Error" (nu "Code Sent")
- Faptul că mobilul afișa "Code Sent" dovedește că backend-ul returna `{ success: true }`
- "No Railway log" = probabil SMTP transport neconfigurat (log `skipped: no mail transport configured`) sau latență log Railway

**Exact mobile success-dialog condition (ÎNAINTE de fix):**
`Alert.alert("Code Sent", ...)` se afișa imediat după ce `mutateAsync()` rezolva. Mutația era așteptată corect, dar backend-ul returna succes indiferent de livrarea emailului.

**Exact backend email-delivery behavior (ÎNAINTE de fix):**
Backend apela `sendPlatformEmail`, ignora `false` return value, logga warning și returna `{ success: true }` necondiționat.

**Fix implementat:**
- `server/auth-router.ts` — `resendVerificationCode`:
  - Arunca `TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to send verification code right now..." })` când `sent === false`
  - Guard explicit pentru `user.email === null` → TRPCError
  - Audit log scris DOAR la succes (nu pe eșec)
  - Observabilitate completă fără a loga tokens/coduri/credențiale:
    - `[EMAIL VERIFY] request_received authenticated_user=yes userId=N`
    - `[EMAIL VERIFY] code_persisted=yes userId=N`
    - `[EMAIL VERIFY] mail_transport_invoked=yes userId=N`
    - `[EMAIL VERIFY] mail_delivery_success=true/false userId=N`
    - `[EMAIL VERIFY] response_status=success/failure userId=N`

**Mobile behavior DUPĂ fix:**
- "Code Sent" afișat NUMAI după confirmat succes backend (nu s-a modificat verify-email.tsx — `catch` block existent gestionează corect eroarea)
- Loading state termină la atât success cât și la throw (tRPC `isPending` se resetează la settle)

**Teste noi (5 cazuri regresie):**
- `throws INTERNAL_SERVER_ERROR when provider delivery fails`
- `throws INTERNAL_SERVER_ERROR when mail service is not configured`
- `throws INTERNAL_SERVER_ERROR when user has no email address`
- `does not log the verification code in any log output`
- `loading state terminates: mutation throws on delivery failure`

**Validări:**
- `pnpm test` ✅ — 110 passed, 2 skipped (5 teste noi, fără regresie)
- `pnpm build` ✅
- `pnpm lint` ✅ — 0 errors, 69 warnings preexistente
- `pnpm check` ❌ — 9 erori TypeScript PREEXISTENTE (identice; nicio eroare nouă)
- secret scan ✅ — fără secrete introduse
- CodeQL ✅ — 0 alerts

**Fișiere modificate:**
- `server/auth-router.ts` — `resendVerificationCode` procedure (fix + observabilitate)
- `tests/auth.verify-email.test.ts` — 5 teste noi de regresie

### Sesiune curentă (Fix login end-to-end) — 2026-07-15:

**BUG CRITIC IDENTIFICAT ȘI REZOLVAT:**
`server/auth-router.ts` linia 248 transmitea `input.email` (raw) la `getUserByEmail(...)`, în loc de `normalizedEmail` (lowercase + trim). `provision-admin.ts` inserează email-ul normalizat, deci căutarea putea eșua dacă utilizatorul introducea email-ul cu majuscule sau spații. Fix: `getUserByEmail(normalizedEmail)`.

**Logging complet adăugat:**
- `[AUTH LOGIN] user_found=yes/no` (exista deja)
- `[AUTH LOGIN] bcrypt_compare=true/false` (exista deja)
- `[AUTH LOGIN] jwt_created=true` (ADĂUGAT) — după crearea token-ului JWT

**Script de reparare hash:**
- `scripts/repair-admin-hash.ts` (nou) — verifică dacă hash-ul din DB este valid bcrypt și se potrivește cu `ADMIN_PASSWORD`; dacă nu, regenerează cu `bcrypt.hash(password, 12)` și actualizează rândul
- `dist/repair-admin-hash.mjs` — compilat via `pnpm build`
- `pnpm db:repair-admin-hash` — comandă nouă în package.json
- `docs/ADMIN_PROVISIONING.md` — secțiune nouă "Repairing a Corrupted or Missing Password Hash"

**Fișiere modificate:**
- `server/auth-router.ts` — linia 248: `input.email` → `normalizedEmail`; adăugat log `jwt_created=true`
- `scripts/repair-admin-hash.ts` (nou)
- `tests/repair-admin-hash.test.ts` (nou — 32 teste)
- `tests/auth.login-normalize.test.ts` (nou — 5 teste normalizare login email)
- `package.json` — build include `repair-admin-hash`; adăugat `db:repair-admin-hash`
- `docs/ADMIN_PROVISIONING.md` — procedura de reparare

**Validări (audit final PR #38):**
- `pnpm install --frozen-lockfile` ✅
- `pnpm test` ✅ — 105 passed, 2 skipped (fără regresie)
- `pnpm build` ✅ — dist/repair-admin-hash.mjs generat
- `pnpm lint` ✅ (0 errors, 69 warnings preexistente)
- `pnpm check` ❌ — 9 erori TypeScript PREEXISTENTE (identice pe main; nicio eroare nouă din PR)
- secret scan ✅ — fără secrete
- CodeQL ✅ — 0 alerts

**Root cause exact în producție: NEDOVEDIT COMPLET**
Email normalization fix: corect și benefic pentru variante cu majuscule/spații.
Dacă userul a introdus emailul exact lowercase (`dropi.deliveries@gmail.com`), normalizarea singură NU explică eroarea. Cauza reală probabilă: hash bcrypt corupt sau absent în DB — exact ce repară `repair-admin-hash`.

**Pasul următor concret (Railway — acțiune manuală obligatorie):**
```
1. Deploy PR pe Railway (merge branch + redeploy)
2. Adaugă temporar în Railway Variables: ADMIN_EMAIL, ADMIN_PASSWORD, DATABASE_URL
3. Rulează în Railway shell:
   pnpm db:repair-admin-hash
   # sau (dacă contul nu există):
   pnpm db:provision-admin
4. Verifică Railway logs pentru: [AUTH LOGIN] user_found=yes, bcrypt_compare=true, jwt_created=true
5. Șterge ADMIN_EMAIL și ADMIN_PASSWORD din Railway Variables
```

---

### Sesiune curentă (Canonical Reference Package for DROPi Tycoon) — 2026-07-15:

- Task NON-code executat: audit complet repository + audit complet `04.zip` + audit folder extras `canonical/docs/00_MasterPlan/`.
- Confirmat că `04.zip` este sursă canonică de prim rang și conține:
  - 29 documente Markdown în pachetul istoric `DROPI_CANONICAL/`
  - 147 documente `.docx` masterplan duplicate în folderul extras `canonical/docs/00_MasterPlan/`
- Creat pachetul portabil oficial:
  - `DROPi_Canonical_Reference/`
  - `DROPi_Canonical_Reference.zip`
- Structură nouă organizată pe domenii:
  - `00_Project/`, `01_Vision/`, `02_Architecture/`, `03_Logistics/`, `04_DronePorts/`, `05_Marketplace/`, `06_Roles/`, `07_Economy/`, `08_AI/`, `09_Reference/`
- Fișiere de control generate:
  - `DROPi_Canonical_Reference/README_FOR_DROPi_TYCOON.md`
  - `DROPi_Canonical_Reference/CANONICAL_MANIFEST.md`
  - `DROPi_Canonical_Reference/CANONICAL_KNOWLEDGE_INDEX.md`
  - `DROPi_Canonical_Reference/AI_CANONICAL_REFERENCE_AUDIT_REPORT.md`
- Inventar final inclus:
  - 195 documente sursă în pachet
  - 199 fișiere totale în pachet incluzând documentele de control
- Decizii cheie de includere/excludere:
  - păstrate documentele canonice active din repository
  - păstrate documentele masterplan extrase (nu dublurile lor din ZIP)
  - recuperate separat documentele Markdown care existau numai în `04.zip`
  - exclus `canonical-delivery-reference.md` deoarece este duplicat exact al `canonical/DELIVERY_MULTIMODAL.md`
  - excluse rapoarte de implementare, tracking, setup operațional, registre de test și alte documente necanonice
- Validări rulate:
  - validare inventar ✅
  - validare unicitate package paths ✅
  - validare existență fișiere incluse ✅
  - validare ZIP extraction / `ZipFile.testzip()` ✅
  - verificare documente control (`README`, manifest, index, raport) ✅


## 2. Starea Curentă a Proiectului

### ✅ Funcții terminate
- Planificarea canonică Passenger Mobility pentru România și Filipine, corpusul juridic versionat, matricea de trasabilitate, registrul de blocaje, specificația UX și backlogul #460/#453–#459 — documentație only, runtime not live, publicată pentru review în PR #478 ✅
- Implementare sistem AI Agent Orchestrator
- Configurare EAS Build pentru Android APK + iOS (`eas.json`) — **fixat**
- Documente canonice de bază: `AI_DEVELOPMENT_HANDOVER_CANON.md`, `AI_AGENT_SYSTEM.md`, `DELIVERY_MULTIMODAL.md`
- Infrastructură cloud: `railway.toml`, `eas-update.yml` (OTA), `eas-build-android.yml` (APK), EAS config în `app.config.ts`
- Ghid setup mobile-first: `docs/MOBILE_FIRST_SETUP.md`
- Fix auth/reset password backend (PR #28 merged) ✅
- Fix EAS build trigger / quota workflow (PR #29 merged) ✅
- Audit migrații drizzle + creare snapshot 0013 lipsă + mecanism migrare Railway (PR #30 merged) ✅
- Fix OAUTH_SERVER_URL opțional — eliminat misleading ERROR log de la startup ✅ (PR #31 merged)
- **Fix login `crypto is not defined` + Gmail `SMTP_USER` missing** — branch `copilot/read-only-verification` (PR #32, conflict resolved, necesită merge)
- **Fix mobile verify-email / resend auth transport (`Missing session cookie`)** — branch `copilot/fix-missing-session-cookie` (PR #33, merged) ✅
- **Fix SMTP IPv6 ENETUNREACH + JWT empty-appId auth** — merged ✅
- **Admin Provisioning Script** — `scripts/provision-admin.ts`, PR curent (necesită merge + execuție Railway one-time)

### 🔄 În progres
- Branch curent: `planning/passenger-mobility-c1` — documentația Passenger Mobility și corpusul juridic sunt validate și publicate în PR #478; review-ul, implementarea și autorizările reale rămân blocate separat.

### ✅ Setup cloud complet (2026-07-07)
- `EAS_PROJECT_ID` adăugat ca GitHub Actions Variable ✅
- `EXPO_TOKEN` adăugat în GitHub Secrets ✅
- Railway conectat la GitHub, MySQL adăugat, variabile setate (`DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`) ✅
- Backend activ pe Railway ✅

### 🔴 Blocate
- **Romania delivery role** — clasificarea DROPi ca furnizor poștal/intermediar/terț contractat și setul curent OUG 13/2013 trebuie confirmate cu ANCOM/consilier juridic.
- **Romania CAEN** — contradicția publică ARR 4933/4939 și clasele exacte per entitate/rol necesită confirmare scrisă.
- **Romania/Philippines road modes** — sursele complete curente pentru bicicletă/e-bike/scuter/auto/van, asigurare și model contractual nu sunt încă aprobate.
- **Drone delivery** — AACR/CAAP și CONOPS-ul concret trebuie confirmate; paginile CAAP pentru PCAR/ROC sunt marcate în mentenanță.
- **Philippines TNVS/tricycle** — lipsesc copia oficială MC 2026-049, Citizen's Charter curent și LGU/ordonanța exactă Zone 0.
- **SMTP_USER lipsă în Railway** — fără această variabilă, emailul de recuperare nu funcționează. Setare manuală obligatorie (detalii la Pasul Următor).
- `pnpm check` rămâne blocat de erori TypeScript preexistente, nelegate de aceste fix-uri, în `app/order/[id].tsx` și `server/operations-router.ts`.

---

## 3. Pasul Următor Concret

**Pasul imediat următor:**

1. Review și aprobare pentru [PR #478](https://github.com/caliofmarian-ai/dropi-mobile/pull/478), branch `planning/passenger-mobility-c1`; nu trata corpusul versionat drept aprobare juridică.
2. Un responsabil Legal/Compliance și consilieri locali verifică fiecare sursă, obțin versiunile primare lipsă și închid P0-urile din `docs/legal/LEGAL_GAPS_AND_BLOCKERS.md` pentru primul scope ales.
3. Project Owner alege orașul/municipiul exact pentru Zone 0 Filipine și modelul de entitate: DROPi/local Zone Operator/TNC.
4. Pornește [PM-001 #453](https://github.com/caliofmarian-ai/dropi-mobile/issues/453) și, pentru triciclete, [PM-002 #454](https://github.com/caliofmarian-ai/dropi-mobile/issues/454); obține confirmările scrise de la consilier juridic/regulator/asigurător.
5. După aprobarea surselor, cerințelor și primului jurisdiction pack, implementează în ordine [PM-003 #455](https://github.com/caliofmarian-ai/dropi-mobile/issues/455), apoi [PM-004 #456](https://github.com/caliofmarian-ai/dropi-mobile/issues/456) și [PM-005 #459](https://github.com/caliofmarian-ai/dropi-mobile/issues/459).
6. Nu activa nicio cursă publică înainte de [PM-006 #457](https://github.com/caliofmarian-ai/dropi-mobile/issues/457) și pilotul controlat [PM-007 #458](https://github.com/caliofmarian-ai/dropi-mobile/issues/458).

---

## 4. Decizii Importante Luate

> Aceste decizii NU se rediscută fără justificare puternică.

| Data | Decizie | Justificare | Luat de |
|------|---------|-------------|---------|
| 2026-07-07 | Repository-ul GitHub este puntea între agenți AI (Copilot/Manus) | Asigură continuitate indiferent de platformă sau credite disponibile | Fondator + Copilot Agent |
| 2026-07-07 | `SESSION_HANDOVER.md` se actualizează obligatoriu la sfârșitul oricărei sesiuni | Fără actualizare = pierdere de context la switch între platforme | Fondator + Copilot Agent |
| 2026-07-07 | Backend pe Railway, mobile updates prin EAS Updates (OTA), auto-deploy prin GitHub Actions | Workflow 100% cloud, fără dependență de computerul fondatorului | Fondator + Copilot Agent |
| 2026-07-07 | EAS OTA se publică DOAR din branch `main` | Evită update-uri OTA din branch-uri WIP/agent | Copilot Agent |
| 2026-07-07 | `EAS_PROJECT_ID` ca GitHub Actions Variable (nu hardcodat) | Setup fără editare manuală a codului | Copilot Agent |
| 2026-07-07 | APK build automat la fiecare push pe `main` via `eas-build-android.yml` | Fondatorul nu mai are nevoie de terminal local pentru build | Copilot Agent |
| 2026-07-10 | Cheia `update` NU aparține în `eas.json` — aparține în `app.config.ts` sub `expo.updates` | EAS CLI respinge `eas.json` cu cheie `update` la top-level | Copilot Agent |
| 2026-07-10 | `slug` în `app.config.ts` trebuie să fie `"dropiexpodev"` (nu `"dropi-mobile"`) ca să se alinieze cu proiectul EAS înregistrat pe expo.dev | EAS CLI respinge `eas update` dacă slug-ul din config nu se potrivește cu slug-ul proiectului EAS | Copilot Agent |
| 2026-07-11 | Testul SMTP trebuie să fie rezilient la lipsa credentialelor locale (skip controlat, nu fail global) | Evităm blocarea suitei locale/CI când secretul de email nu e setat pe toate mediile | Copilot Agent |
| 2026-07-11 | Runtime standard pentru validare mobilă: telefon + Expo Dev Client + Railway cloud backend/agenți AI; fără localhost în testele reale mobile | Evităm erori false de conectivitate și păstrăm fluxul de lucru cloud-first al proiectului | Fondator + Copilot Agent |
| 2026-07-11 | Versionarea EAS pentru build-uri mobile trebuie gestionată prin `appVersionSource: "remote"` + `autoIncrement: true` | Cu `local`, fiecare build CI pornea din aceeași stare și APK-ul nu mai avansa corect build/version code-ul | Copilot Agent |
| 2026-07-11 | Redirect-ul OAuth nativ trebuie generat din schema activă a build-ului (`Linking.createURL`) și nu dintr-un `bundleId` hardcodat în codul runtime | Evităm callback-uri pe schemă greșită după build/update și reducem erorile de login pe telefon | Copilot Agent |
| 2026-07-12 | Workflow-urile EAS build/update trebuie să valideze explicit `EXPO_PUBLIC_API_BASE_URL` înainte de `eas build`/`eas update` pentru a preveni build-uri silențioase cu URL gol | Fără validare, EAS CLI "încarcă" variabila goală și produce APK-uri nefuncționale fără erori vizibile în CI | Copilot Agent |
| 2026-07-12 | Sursa unică GitHub pentru `EXPO_PUBLIC_API_BASE_URL` este `vars.EXPO_PUBLIC_API_BASE_URL`; nu se folosește `secrets.EXPO_PUBLIC_API_BASE_URL` | Variabila este publică (embedded în bundle-ul JS), iar workflow-urile finale trebuie să rămână consistente între guard și `eas build`/`eas update` | Copilot Agent |
| 2026-07-12 | Reset-password trebuie să eșueze explicit dacă emailul nu poate fi livrat, iar codurile de reset nu se loghează niciodată în clar | Evităm false-positive în UI și expunerea secretelor temporare în log-uri | Copilot Agent |
| 2026-07-12 | `eas-build-android.yml` se declanșează EXCLUSIV prin `workflow_dispatch`, NU la push pe `main` | Cota EAS Free plan este limitată (10 build-uri/lună); un build automat la fiecare commit o epuiza rapid; APK-ul se construiește doar când este explicit solicitat | Copilot Agent |
| 2026-07-12 | Nu se falsifică succesul CI: dacă `eas build` eșuează (indiferent de motiv), CI raportează FAILURE | Un workflow verde trebuie să implice că un APK real a fost produs; exit-0 la quota epuizată ar minți statusul build-ului | Copilot Agent |
| 2026-07-12 | Migrația `0013_agent_orchestrator.sql` trebuie însoțită de `drizzle/meta/0013_snapshot.json`; orice migrație manuală care nu generează automat snapshot-ul drizzle trebuie să îl creeze explicit | Fără snapshot, `drizzle-kit generate` viitor ignoră tabelele noi și generează migrații duplicat | Copilot Agent |
| 2026-07-12 | Mecanismul de migrare în producție folosește `drizzle-orm/mysql2/migrator` (API programmatic) compilat cu esbuild, NU `drizzle-kit migrate` CLI — devDependencies pot fi absente în runtime Railway | `drizzle-kit` este devDep; `drizzle-orm` este dep de producție; Railway poate prune devDeps după build | Copilot Agent |
| 2026-07-12 | `railway.toml` startCommand = `node dist/migrate.mjs && node dist/validate-db.mjs && pnpm start` — migrațiile și validarea rulează înainte de pornirea serverului și blochează startup-ul dacă eșuează | Orice alt ordin (build-time migrate) este mai fragil: build-cache poate sări peste migrate; start-time garantează că DB e gata înainte ca serverul să accepte request-uri | Copilot Agent |
| 2026-07-12 | `OAUTH_SERVER_URL` este OPȚIONAL în Railway production — OAuth Manus este infrastructură legacy; DROPi folosește email/parolă proprie | La startup, SDK-ul logga `console.error` misleading chiar dacă OAuth nu era niciodată apelat în producție; fixat la `console.warn` cu mesaj clar | Copilot Agent |
| 2026-07-12 | `jose` v6 necesită `globalThis.crypto` (Web Crypto API). Pe Node.js < 19, `crypto` nu este expus ca identificator global în ESM fără flag. Polyfill-ul `globalThis.crypto = webcrypto` în `server/_core/index.ts` rezolvă definitiv. | Login producea `ReferenceError: crypto is not defined` la Railway (Node.js 18 LTS) | Copilot Agent |
| 2026-07-12 | Gmail App Password necesită `SMTP_USER` explicit (adresa Gmail care l-a generat). Nicio valoare default nu poate fi hardcodată în cod — fiecare App Password este legat de un cont specific. | Fallback hardcodat `dropi.deliveries@gmail.com` cauza eșec silențios dacă adresa reală era diferită | Copilot Agent |
| 2026-07-14 | Admin provisioning folosește un script one-time compilat (`dist/provision-admin.mjs`), nu auto-seed la startup sau SQL manual | Auto-seed riscă să suprascrie accidental date existente; SQL manual necesită acces direct și expune hash-ul; `createUser` din `server/db.ts` setează mereu `role:"user"` | Copilot Agent |
| 2026-07-13 | Gmail SMTP pe Railway se configurează cu `host/port/secure` explicit + IPv4 pre-resolut (nu `service: "gmail"`) pentru a evita ENETUNREACH pe IPv6 | Nodemailer 9.x alege random IPv4/IPv6 cu `service: "gmail"`; Railway are IPv6 outbound instabil | Copilot Agent |
| 2026-07-13 | `verifySession` cere doar `openId` non-empty; `appId`/`name` sunt opționale ca string gol | `VITE_APP_ID` nu este un env Railway → `appId = ""` → toate sesiunile JWT respinse; HMAC face claims suplimentare redundante pentru securitate | Copilot Agent |
| 2026-07-13 | Teste de invarianți securitate JWT (wrong secret, expired, malformed) sunt obligatorii lângă orice schimbare a verifySession | Dovedesc că HMAC rămâne singura frontieră de securitate, indiferent de claims payload | Copilot Agent |
| 2026-07-15 | `resendVerificationCode` trebuie să arunce TRPCError când livrarea emailului eșuează; succes returnat NUMAI după confirmare proveder | UI-ul arăta "Code Sent" chiar și când emailul nu era livrat (silent failure în backend) | Copilot Agent |
| 2026-09-12 | Passenger Mobility este serviciu separat în C1; nu se creează C4, nu se reutilizează comenzile/livrările de colete și nu se extinde automat în C2/C3 | Canalele sunt contexte operaționale, iar transportul de persoane are lifecycle, risc, autorizare și audit distinct | Project Owner + Codex |
| 2026-09-12 | Un singur cont poate avea capabilități de delivery și rides, dar fiecare capabilitate este autorizată separat per persoană/operator/vehicul/pack/zonă/timp; `isVerified` nu este autoritate pentru pasageri | Previne extinderea nejustificată a unei licențe/document sau a verificării globale la o activitate reglementată diferit | Project Owner + Codex |
| 2026-09-12 | România și Filipine sunt planificate prin pack-uri juridice independente; tricicletele din Zone 0 rămân blocate până la alegerea LGU și confirmare scrisă | TNVS auto este reglementat național, iar transportul cu tricicleta depinde de franciza și regulile LGU | Project Owner + Codex |
| 2026-09-12 | Passenger Mobility rămâne vizibil ca ramură blocată în C1 și se activează etapizat prin `catalog_locked`, `onboarding_open`, `pilot_only`, `public_live` | Produsul nu trebuie omis până la autorizare, dar simpla vizibilitate nu trebuie să permită colectare de date, booking sau operare reglementată | Project Owner + Codex |
| 2026-09-12 | Sursele juridice oficiale se păstrează versionat și verificabil în repository; nicio cerință dependentă de lege nu intră în design/operare fără sursă, interpretare, aprobare și trasabilitate | Previne construirea pe presupuneri, pagini vechi, traduceri inconsistente sau articole secundare | Project Owner + Codex |
| 2026-09-12 | Compania/piața/serviciul și partenerul/persoana/operatorul/vehiculul au porți independente; autorizarea și lansarea sunt etapizate per scope, fără status universal | O licență sau o formă juridică nu se transferă automat între servicii, vehicule, zone ori țări | Project Owner + Codex |
| 2026-09-12 | Cerințele legale și politicile DROPi/asigurătorului sunt etichetate separat | Instruirea sau asigurarea suplimentară poate crește siguranța fără a fi prezentată fals ca atestat emis de stat | Project Owner + Codex |

---

## 5. Contexte Importante

### GitHub Actions Workflows
| Workflow | Fișier | Trigger | Scop |
|----------|--------|---------|------|
| EAS Build Android | `eas-build-android.yml` | `workflow_dispatch` (manual) | Construiește APK development Android |
| EAS Update OTA | `eas-update.yml` | push main | Trimite update OTA pe telefon |
| Railway Notify | `railway-notify.yml` | push main (server/) | Confirmă deploy backend |

### Branch-uri active
| Branch | Scop | Status |
|--------|------|--------|
| `planning/passenger-mobility-c1` | Canon, legal research, UX și backlog pentru Passenger Mobility România/Filipine | Activ, PR #478 deschis; necesită review |
| `copilot/read-only-verification` | Fix login crypto + Gmail SMTP_USER + conflict resolution pentru PR #32 | Activ, necesită merge |
| `copilot/copilotdatabase-migration-audit` | Fix OAUTH_SERVER_URL opțional (PR #31) | Merged în `main` |
| `copilot/real-device-tests-auth-issues` | RCA auth/reset real-device + fix minim email/reset backend | Merged în `main` (PR #28) |
| `copilot/audit-eas-environment-injection` | Audit EAS env chain + validare workflow EXPO_PUBLIC_API_BASE_URL | Merged în `main` (PR #27) |
| `copilot/fix-apk-versioning-errors` | Fix versionare EAS build + redirect OAuth nativ | Merged în `main` |
| `copilot/fix-build-android-apk-job` | Eliminat trigger push/main; APK build exclusiv manual | Merged în `main` (PR #29) |
| `copilot/funcioneaz-aplicaia-server` | Eliminare fallback localhost pe mobile runtime + fail-fast config API | Merged în `main` |
| `copilot/database-migration-audit` | Audit migrații drizzle + creare snapshot 0013 lipsă + mecanism Railway | Merged în `main` (PR #30) |

### Probleme cunoscute / Datorie tehnică
- `eas.json` — fix top-level update key aplicat ✅
- `app.config.ts` slug — fix aplicat, `slug` aliniat la `"dropiexpodev"` ✅
- `eas.json` versioning — mutat pe `remote` + `autoIncrement` ✅
- `constants/oauth.ts` folosea o schemă derivată din `bundleId` hardcodat, diferită de schema reală a app-ului (`manus20260627`) ✅ fixat
- `react/no-unescaped-entities` în ecrane mobile — fixat (0 errors la lint) ✅
- Reset password returna mesaj fals de succes când emailul nu era livrat și loga codul de reset în clar ✅ fixat în branch-ul `copilot/real-device-tests-auth-issues`
- Implementarea email backend era legată doar de Gmail/`GMAIL_APP_PASSWORD`, deși documentația proiectului indică SMTP generic ✅ fixat în branch-ul `copilot/real-device-tests-auth-issues`
- `drizzle/meta/0013_snapshot.json` lipsea → creat în branch-ul `copilot/database-migration-audit` ✅
- **Mecanism Railway producție** lipsea → `scripts/migrate.ts` + `scripts/validate-db.ts` + `railway.toml` update → PR #30 ✅
- `[OAuth] ERROR:` misleading în Railway production logs → PR #31 merged ✅
- **Login `crypto is not defined`** pe Node.js 18/Railway → polyfill `globalThis.crypto` în `server/_core/index.ts` → PR #32 ✅ (conflict resolved, necesită merge)
- **Gmail email nu sosea** → `SMTP_USER` lipsea din Railway + hardcoded default greșit în cod → fix în PR #32 ✅ (necesită merge + setare Railway manual)
- Backend pe Railway necesită setup manual cont + variabile de mediu din `.env.example`

### Tehnologii principale
- **Framework:** React Native + Expo SDK 54
- **Preview:** Expo Dev Client (NU Expo Go) + EAS Updates (OTA)
- **Build:** EAS Build (Android APK) via GitHub Actions
- **Backend deploy:** Railway (24/7, auto-deploy din GitHub)
- **Mobile updates:** EAS Updates via GitHub Actions (la fiecare commit pe `main`)
- **AI Agents:** sistem intern de orchestrare implementat

---

## 6. Instrucțiuni pentru Manus (la reluarea sesiunii acolo)

Când deschizi o sesiune nouă în Manus, dă-i această instrucțiune:

```
Citește canonical/SESSION_HANDOVER.md și canonical/AI_DEVELOPMENT_HANDOVER_CANON.md 
din repository-ul https://github.com/caliofmarian-ai/dropi-mobile.
Continuă de la "Pasul Următor Concret" definit în SESSION_HANDOVER.md.
Nu reporni proiectul de la zero. Continuă ce există.
```

---

## 7. Instrucțiuni pentru GitHub Copilot Agent (la reluarea sesiunii aici)

Când deschizi o sesiune nouă în GitHub Copilot Agent, agentul primește automat contextul din repository. Asigură-te că prima instrucțiune menționează:

```
Citește canonical/SESSION_HANDOVER.md înainte de orice altă acțiune și continuă 
de la Pasul Următor Concret.
```

---

## 8. Versioning

Acest document: **v1.24.0**
Data creării: 2026-07-07
Ultima actualizare: 2026-09-12
Actualizat de: Codex — corpus juridic canonic versionat, trasabilitate sursă–cerință–control, porți independente companie/partener și registru explicit de blocaje; versiune incrementată la v1.24.0.

> **REAMINTIRE:** Orice agent care lucrează pe DROPi TREBUIE să actualizeze acest fișier la sfârșitul sesiunii. Fără actualizare = next agent pornește orb.
