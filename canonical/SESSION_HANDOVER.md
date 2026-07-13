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
| **Platformă** | GitHub Copilot Agent |
| **Data** | 2026-07-13 |
| **Branch activ** | `copilot/read-only-verification` |
| **Agent** | GitHub Copilot Coding Agent |

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

---

## 2. Starea Curentă a Proiectului

### ✅ Funcții terminate
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

### 🔄 În progres
- Branch curent: `copilot/read-only-verification` — rezolvare conflict PR #32; necesită push + merge + acțiune Railway manuală.

### ✅ Setup cloud complet (2026-07-07)
- `EAS_PROJECT_ID` adăugat ca GitHub Actions Variable ✅
- `EXPO_TOKEN` adăugat în GitHub Secrets ✅
- Railway conectat la GitHub, MySQL adăugat, variabile setate (`DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`) ✅
- Backend activ pe Railway ✅

### 🔴 Blocate
- **SMTP_USER lipsă în Railway** — fără această variabilă emailul de recuperare nu funcționează. Setare manuală obligatorie (detalii la Pasul Următor).
- Este încă necesară confirmarea din Railway că variabilele SMTP sunt setate pe serviciul de producție (doar nume, fără valori).
- Este încă necesară verificarea real-device după deploy că reset-password returnează eroare reală când providerul nu poate trimite și succes doar când emailul este livrat.

---

## 3. Pasul Următor Concret

**Pasul imediat următor:**
1. Finalizează push-ul branch-ului `copilot/read-only-verification` cu commitul de conflict resolution pentru PR #32.
2. Railway va redeploya automat după merge.
3. **OBLIGATORIU — înainte de testul pe telefon:** adaugă în Railway Dashboard → `dropi-mobile` service → Variables:
   - `SMTP_USER` = adresa Gmail care a generat `GMAIL_APP_PASSWORD`
   (fără aceasta, emailul de recuperare rămâne blocat)
4. Testează pe telefon (cu contul deja creat în producție):
   - **Login** → trebuie să reușească (fără `crypto is not defined`)
   - **Forgot Password** → emailul de reset trebuie să ajungă
5. Dacă login eșuează în continuare → verifică Railway logs pentru erori noi.
6. Dacă emailul nu ajunge → verifică Railway logs pentru `[SMTP]` entries; mesajele de eroare acum arată exact ce lipsește.

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
| 2026-07-12 | Erorile Nodemailer se loghează DOAR ca `.message` (nu obiect complet) pentru a nu expune credențiale SMTP sau detalii de conexiune sensibile în log-urile Railway | Obiectul complet de eroare Nodemailer poate include `auth` details în unele versiuni | Copilot Agent |

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

Acest document: **v1.20.0**
Data creării: 2026-07-07
Ultima actualizare: 2026-07-13
Actualizat de: GitHub Copilot Coding Agent — Merge conflict resolution pentru PR #32: integrat schimbările deja merged în `main` (PR #30 și PR #31) cu fixurile auth/crypto/email din branch-ul `copilot/read-only-verification`; versiune incrementată la v1.20.0.

> **REAMINTIRE:** Orice agent care lucrează pe DROPi TREBUIE să actualizeze acest fișier la sfârșitul sesiunii. Fără actualizare = next agent pornește orb.
