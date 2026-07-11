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
| **Data** | 2026-07-11 |
| **Branch activ** | `copilot/fix-apk-versioning-errors` |
| **Agent** | GitHub Copilot Coding Agent |

### Ce s-a făcut în această sesiune:
- **Fix versionare APK + login mobil după update**
  - `eas.json`:
    - `cli.appVersionSource` schimbat din `local` în `remote`
    - `autoIncrement: true` adăugat pe profilele `development`, `preview`, `production`
  - Efect: EAS crește build/version code-ul la fiecare build nou, deci APK-urile Android se pot instala corect ca update peste cele vechi.
  - `constants/oauth.ts`:
    - eliminată schema deep-link derivată dintr-un `bundleId` hardcodat și învechit (`com.app.dropimobile`)
    - redirect-ul OAuth nativ folosește acum `Linking.createURL("/oauth/callback")`, adică schema reală a build-ului Expo instalat
  - Efect: login-ul mobil nu mai trimite callback-ul pe o schemă greșită după build/update.
  - Validare:
    - `pnpm lint` ✅ (warnings existente, fără erori noi)
    - `pnpm build` ✅
    - `pnpm test` ✅ (2 teste skipped controlat din cauza env opțional)
    - `npx expo config --type public` ✅
  - Commit: `4d4b9dd fix: update apk versioning and mobile auth redirect`

---

## 2. Starea Curentă a Proiectului

### ✅ Funcții terminate
- Implementare sistem AI Agent Orchestrator
- Configurare EAS Build pentru Android APK + iOS (`eas.json`) — **fixat**
- Documente canonice de bază: `AI_DEVELOPMENT_HANDOVER_CANON.md`, `AI_AGENT_SYSTEM.md`, `DELIVERY_MULTIMODAL.md`
- Infrastructură cloud: `railway.toml`, `eas-update.yml` (OTA), `eas-build-android.yml` (APK), EAS config în `app.config.ts`
- Ghid setup mobile-first: `docs/MOBILE_FIRST_SETUP.md`

### 🔄 În progres
- Branch curent: `copilot/fix-apk-versioning-errors` (versionare EAS remote + redirect OAuth nativ)
- PR `copilot/funcioneaz-aplicaia-server` a fost deja merged în `main` (workflow-urile EAS au rulat cu succes)

### ✅ Setup cloud complet (2026-07-07)
- `EAS_PROJECT_ID` adăugat ca GitHub Actions Variable ✅
- `EXPO_TOKEN` adăugat în GitHub Secrets ✅
- Railway conectat la GitHub, MySQL adăugat, variabile setate (`DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`) ✅
- Backend activ pe Railway ✅

### 🔴 Blocate
- Nicio blocare tehnică critică în cod; pentru test SMTP live este necesar secret valid (`GMAIL_APP_PASSWORD` sau `SMTP_PASS`) în environment-ul de execuție

---

## 3. Pasul Următor Concret

**Fixul pentru versionarea APK și login-ul mobil după update este aplicat în `copilot/fix-apk-versioning-errors`.**

**Pasul imediat următor:**
1. Deschide PR pentru branch-ul curent și fă merge în `main`
2. Confirmă în GitHub Actions că rulează din nou cu succes:
   - `eas-build-android.yml`
   - `eas-update.yml`
3. Instalează APK-ul nou peste cel existent și verifică pe telefon:
   - login complet
   - dispariția mesajului de tip “incompatible update”
   - update OTA după un commit nou în `main`
4. Dacă UI arată în continuare `Version 1.0.0`, ține cont că acum se auto-incrementează **build/versionCode**; versiunea semantică vizibilă (`1.0.0`) se schimbă doar când o mărim manual în `app.config.ts`

**Următorul task de dezvoltare:** Verificare E2E mobilă pe Railway după merge (auth + OTA + live tracking)

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

---

## 5. Contexte Importante

### GitHub Actions Workflows
| Workflow | Fișier | Trigger | Scop |
|----------|--------|---------|------|
| EAS Build Android | `eas-build-android.yml` | push main | Construiește APK development Android |
| EAS Update OTA | `eas-update.yml` | push main | Trimite update OTA pe telefon |
| Railway Notify | `railway-notify.yml` | push main (server/) | Confirmă deploy backend |

### Branch-uri active
| Branch | Scop | Status |
|--------|------|--------|
| `copilot/fix-apk-versioning-errors` | Fix versionare EAS build + redirect OAuth nativ | Activ, necesită PR/merge |
| `copilot/funcioneaz-aplicaia-server` | Eliminare fallback localhost pe mobile runtime + fail-fast config API | Merged în `main` |

### Probleme cunoscute / Datorie tehnică
- `eas.json` — fix top-level update key aplicat ✅
- `app.config.ts` slug — fix aplicat, `slug` aliniat la `"dropiexpodev"` ✅
- `eas.json` versioning — mutat pe `remote` + `autoIncrement` ✅
- `constants/oauth.ts` folosea o schemă derivată din `bundleId` hardcodat, diferită de schema reală a app-ului (`manus20260627`) ✅ fixat
- `react/no-unescaped-entities` în ecrane mobile — fixat (0 errors la lint) ✅
- Test SMTP live depinde de secret email în environment (`GMAIL_APP_PASSWORD`/`SMTP_PASS`) ⚠️
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

Acest document: **v1.7.0**
Data creării: 2026-07-07
Ultima actualizare: 2026-07-11
Actualizat de: GitHub Copilot Coding Agent — fix versionare EAS remote + redirect OAuth nativ.

> **REAMINTIRE:** Orice agent care lucrează pe DROPi TREBUIE să actualizeze acest fișier la sfârșitul sesiunii. Fără actualizare = next agent pornește orb.
