# DROPi — Mobile-First Setup Guide

> **Ghid de setup one-time complet din browser/telefon.**
> Niciun computer local nu este necesar.
> Estimat: 30–45 minute.

---

## Cerințe prealabile

- Cont GitHub (deja ai: `caliofmarian-ai`)
- Android phone cu browser
- Acces la email pentru verificarea conturilor noi

---

## Regulă de lucru obligatorie (mobile + cloud)

- Runtime-ul standard DROPi este: **telefon + Expo Dev Client + Railway cloud backend/agenți AI**.
- Pentru testele reale pe telefon, API-ul trebuie să fie URL-ul public Railway (`EXPO_PUBLIC_API_BASE_URL`).
- **Nu folosi localhost/127.0.0.1** ca backend pentru validarea fluxurilor mobile reale.

---

## Pasul 1 — Setup Expo EAS (OTA Updates)

### 1.1 Creează cont Expo

1. Deschide **https://expo.dev** pe telefon
2. Click **Sign Up** → completează email + parolă
3. Verifică email-ul (link de confirmare)

### 1.2 Creează proiectul Expo

1. Loghează-te la **https://expo.dev**
2. Click **+ New Project** (sau **Projects → Create a project**)
3. La **Name** introdu: `dropi-mobile`
4. La **Slug** introdu: `dropiexpodev`
5. Click **Create**
6. Copiază **Project ID** din pagina proiectului
   - Arată ca: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **Salvează-l** — îl vei folosi la pasul următor

### 1.3 Verifică `app.config.ts` (projectId + slug)

1. Deschide **https://github.com/caliofmarian-ai/dropi-mobile** pe telefon
2. Navighează la fișierul `app.config.ts`
3. Click pe iconița de **edit** (creion)
4. Confirmă că `extra.eas.projectId` este Project ID-ul real al proiectului Expo
5. Confirmă că `slug` este `dropiexpodev`
6. Dacă faci schimbări, deschide PR și apoi merge în `main`

### 1.4 Creează Expo Access Token

1. Mergi la **https://expo.dev/accounts/[username]/settings/access-tokens**
2. Click **Create token**
3. La **Name** introdu: `github-actions-dropi`
4. Click **Create**
5. **Copiază token-ul** — îl vei vedea o singură dată!

### 1.5 Adaugă `EXPO_TOKEN` în GitHub Secrets

1. Deschide **https://github.com/caliofmarian-ai/dropi-mobile/settings/secrets/actions**
2. Click **New repository secret**
3. La **Name** introdu: `EXPO_TOKEN`
4. La **Secret** paste token-ul copiat la pasul anterior
5. Click **Add secret**

✅ **După Pasul 1:** orice commit pe `main` → GitHub Actions → EAS Update OTA → telefon primește modificările în ~3 minute.

---

## Pasul 2 — Primul Build APK (Expo Dev Client)

> Acesta este singurul APK pe care îl instalezi manual. Tot ce urmează după = OTA.

1. Mergi la **https://expo.dev/accounts/[username]/projects/dropiexpodev/builds**
2. Click **New Build**
3. Setează:
   - **Platform:** Android
   - **Profile:** `development`
4. Click **Build**
5. Aștepți ~15–20 minute (build-ul rulează în cloud EAS)
6. Primești email cu link de download / vezi link în dashboard
7. Deschide link-ul pe telefon → descarcă APK → instalează
   - Pe Android: Settings → Security → Allow from this source

> **Notă:** APK-ul de `development` conține Expo Dev Client și se conectează la EAS Updates.
> La fiecare build nou OTA, aplicația se actualizează automat fără reinstalare.

---

## Pasul 3 — Setup Railway (Backend 24/7)

### 3.1 Creează cont Railway

1. Deschide **https://railway.app** pe telefon
2. Click **Login with GitHub** → autorizează Railway
3. Confirmă email dacă e solicitat

### 3.2 Creează proiectul Railway

1. În dashboard Railway, click **New Project**
2. Click **Deploy from GitHub repo**
3. Selectează `caliofmarian-ai/dropi-mobile`
4. Railway detectează automat `railway.toml` și configurează build-ul

### 3.3 Adaugă MySQL Database

1. În proiectul Railway, click **+ New**
2. Selectează **Database → Add MySQL**
3. Railway creează baza de date și generează automat `DATABASE_URL`
4. Click pe serviciul MySQL → tab **Variables** → copiază `DATABASE_URL`

### 3.4 Configurează variabilele de mediu

1. Click pe serviciul principal (aplicația Node.js)
2. Tab **Variables → Raw Editor**
3. Adaugă variabilele din `.env.example`:

```
DATABASE_URL=<valoarea copiată din MySQL plugin>
JWT_SECRET=<string random lung - generează la https://generate-secret.vercel.app/64>
NODE_ENV=production
PORT=3000
```

4. Variabilele opționale (adaugă când ai nevoie):
   - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` — pentru email
   - `STORAGE_ENDPOINT`, etc. — pentru upload imagini

5. Click **Deploy** (sau Railway face deploy automat la salvare)

### 3.5 Verifică că backend-ul rulează

1. În Railway, click pe serviciu → tab **Deployments**
2. Aștepți ca status-ul să devină **Active** (verde)
3. Click pe **Settings** → copiază **Public URL** (ex: `https://dropi-mobile-xxx.railway.app`)
4. Deschide URL-ul în browser → adaugă `/api/health` la final
5. Ar trebui să primești răspuns `{"status": "ok"}`

✅ **Backend-ul rulează 24/7 pe Railway.**

---

## Pasul 4 — Conectează aplicația mobilă la backend

1. În environment-ul folosit la build/update setează:
   - `EXPO_PUBLIC_API_BASE_URL=https://<serviciul-tău>.up.railway.app`
2. Confirmă că URL-ul este public și răspunde la `GET /api/health`
3. Rulează build/update și reinstalează Dev Client dacă ai schimbat env-ul la build-time
4. Testează login din telefon (nu din localhost)

---

## Workflow zilnic (după setup)

```
Tu (pe telefon):
  1. Editezi cod în GitHub Mobile sau Codespaces (browser)
  2. Commit pe main
  3. GitHub Actions rulează automat:
     ├── EAS Update OTA → telefon primește modificările (~3 min)
     └── Railway → deploy backend automat (pentru schimbări în server/)
```

**Tu nu mai atingi niciun terminal după setup.**

---

## Verificare finală (checklist)

| Pas | Verificare |
|-----|-----------|
| Expo project creat | `app.config.ts` are `slug: "dropiexpodev"` și `extra.eas.projectId` valid |
| EXPO_TOKEN în GitHub | GitHub Actions → EAS Update rulează cu succes |
| APK instalat pe telefon | Aplicația se deschide și se conectează la EAS |
| Railway activ | `GET /api/health` returnează `{"status":"ok"}` |
| OTA funcționează | La commit pe `main`, aplicația pe telefon se actualizează |

---

## Troubleshooting

### EAS Update eșuează în GitHub Actions
- Verifică că `EXPO_TOKEN` a fost adăugat corect în GitHub Secrets
- Verifică în `app.config.ts` că `slug` este `dropiexpodev` și `extra.eas.projectId` este valid
- Mergi la GitHub → tab Actions → click pe run-ul eșuat → citește log-ul

### APK-ul nu se conectează la EAS Updates
- Asigură-te că ai instalat APK-ul de `development` (nu `preview` sau `production`)
- Deschide aplicația → dacă afișează "Connected to EAS" ești gata

### Railway deploy eșuează
- Mergi la Railway → Deployments → click pe deploy → citește log-ul
- Verifică că toate variabilele obligatorii sunt setate (`DATABASE_URL`, `JWT_SECRET`)

---

## Scenarii care ar putea necesita computer (extrem rare)

| Scenariu | Alternativă fără computer |
|----------|--------------------------|
| Bug critic de build nativ | Deschide GitHub Codespace din browser |
| Debugging avansat server | Railway → Logs în timp real din dashboard |
| Database migrations manuale | Railway → MySQL plugin → Query Console |

---

> **Document creat:** 2026-07-07  
> **Actualizat:** 2026-07-07  
> Parte din strategia mobile-first DROPi.
