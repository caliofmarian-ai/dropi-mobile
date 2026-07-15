# BLUEPRINT: DROPi Independent Deployment

> **Status:** Canonic | **Versiune:** 1.0 | **Data:** 2026-06-30
> **Principiu fundamental:** DROPi este o platformă complet independentă. Nu depinde de Expo Go, Manus, sau orice altă platformă terță pentru funcționare în producție.

---

## 1. Principii de Independență

| Principiu | Descriere |
|-----------|-----------|
| **Nume:** DROPi | Numele aplicației este "DROPi" — peste tot, fără excepție |
| **Server propriu** | Backend-ul rulează pe VPS/server propriu (orice Linux cu Node.js 20+) |
| **APK/IPA propriu** | Aplicația mobilă se compilează ca APK (Android) și IPA (iOS) standalone |
| **Bază de date proprie** | MySQL/PostgreSQL pe server propriu sau managed DB |
| **Push notifications proprii** | FCM (Firebase Cloud Messaging) direct, fără intermediari |
| **Domeniu propriu** | API și web dashboard pe domeniu propriu (ex: api.dropi.app, app.dropi.app) |
| **Fără dependență runtime de terți** | Nicio funcționalitate critică nu depinde de servicii care pot fi oprite de alții |

---

## 2. Arhitectura de Deployment Independent

```
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURA DROPi                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  VPS/Server  │    │   Database   │    │  Storage     │      │
│  │  (Node.js)   │    │  (MySQL)     │    │  (S3/MinIO)  │      │
│  │              │    │              │    │              │      │
│  │  - Express   │◄──►│  - Users     │    │  - Uploads   │      │
│  │  - tRPC API  │    │  - Orders    │    │  - Documents │      │
│  │  - WebSocket │    │  - Missions  │    │  - Avatars   │      │
│  │  - Auth      │    │  - Logs      │    │              │      │
│  └──────┬───────┘    └──────────────┘    └──────────────┘      │
│         │                                                       │
│         │ HTTPS (port 443)                                      │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Nginx/      │    ┌──────────────┐                           │
│  │  Reverse     │    │  FCM Server  │                           │
│  │  Proxy       │    │  (Push)      │                           │
│  │  + SSL       │    └──────────────┘                           │
│  └──────────────┘                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│  DROPi APK      │    │  DROPi IPA      │
│  (Android)      │    │  (iOS)          │
│  Standalone     │    │  Standalone     │
│  "DROPi" name   │    │  "DROPi" name   │
└─────────────────┘    └─────────────────┘
```

---

## 3. Componente și Independența Lor

### 3.1 Backend Server (Node.js + Express + tRPC)

| Aspect | Soluție Independentă |
|--------|---------------------|
| Runtime | Node.js 20+ pe orice Linux (Ubuntu, Debian, CentOS) |
| Process manager | PM2 sau systemd service |
| Reverse proxy | Nginx cu SSL (Let's Encrypt gratuit) |
| Environment | `.env` file pe server, fără dependență de cloud secrets |
| Build | `pnpm build` → `dist/index.js` (single file, zero dependencies externe la runtime) |
| Port | 3000 intern, 443 extern prin Nginx |

**Comandă de deployment:**
```bash
# Pe server propriu
git pull origin main
pnpm install --frozen-lockfile
pnpm build
pm2 restart dropi-api
```

### 3.2 Bază de Date (MySQL)

| Aspect | Soluție Independentă |
|--------|---------------------|
| Engine | MySQL 8.0+ sau MariaDB 10.6+ |
| Hosting | Pe același server sau managed DB (PlanetScale, DigitalOcean, etc.) |
| Migrații | Drizzle Kit (`pnpm db:push`) — nu depinde de niciun serviciu extern |
| Backup | `mysqldump` cron job zilnic → storage extern |
| Conexiune | Connection string în `.env` (`DATABASE_URL`) |

### 3.3 Push Notifications (FCM Direct)

| Aspect | Soluție Independentă |
|--------|---------------------|
| Provider | Firebase Cloud Messaging (FCM) — gratuit, fără limită |
| Alternativă | APNs direct pentru iOS (fără intermediar) |
| Server key | Stocat în `.env` pe server propriu |
| Token storage | Tabelă `pushTokens` în DB proprie |
| Independență | NU folosim Expo Push Service — trimitem direct la FCM/APNs |

**Migrare de la Expo Push la FCM:**
```
Expo Push API (intermediar) → ELIMINAT
FCM HTTP v1 API (direct) → IMPLEMENTAT
```

### 3.4 Aplicația Mobilă (APK/IPA)

| Aspect | Soluție Independentă |
|--------|---------------------|
| Build Android | EAS Build sau local cu `eas build --platform android` |
| Build iOS | EAS Build sau local cu Xcode |
| Distribuție | Google Play Store + Apple App Store |
| Sideload | APK direct (fără store) pentru testing |
| Actualizări | OTA updates prin server propriu (expo-updates cu self-hosted) |
| Numele | "DROPi" — configurat în `app.config.ts` |

**Important:** După Publish/Build, aplicația NU mai are nicio legătură cu Expo Go. Este APK standalone cu numele "DROPi".

### 3.5 File Storage

| Aspect | Soluție Independentă |
|--------|---------------------|
| Opțiune 1 | MinIO (self-hosted S3-compatible) pe server propriu |
| Opțiune 2 | DigitalOcean Spaces / Backblaze B2 (ieftin, S3-compatible) |
| Opțiune 3 | Folder local pe server cu Nginx serving |
| Interfață | S3-compatible API (funcționează cu orice provider) |

### 3.6 Email (SMTP)

| Aspect | Soluție Independentă |
|--------|---------------------|
| Provider | Orice SMTP: Gmail, Zoho, Mailgun, self-hosted Postfix |
| Configurare | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` în `.env` |
| Domeniu | noreply@dropi.app (cu SPF/DKIM pe domeniu propriu) |

---

## 4. Ce NU Este Independent (Și Alternativele)

| Dependență Curentă | Rol | Alternativă Independentă | Prioritate |
|---------------------|-----|--------------------------|-----------|
| Expo Push Service | Trimite push notifications | FCM direct + APNs direct | **CRITICĂ** — de migrat |
| EAS Build | Compilează APK/IPA | Local build cu Android Studio / Xcode | MEDIE |
| Expo OTA Updates | Actualizări fără store | Self-hosted update server | SCĂZUTĂ |
| Manus Platform | Development & hosting | VPS propriu (DigitalOcean, Hetzner, etc.) | La deployment |

---

## 5. Plan de Migrare la Independență Completă

### Faza 1: Server Propriu (Imediat la deployment)
1. Provizionare VPS (Ubuntu 24.04, 2GB RAM minim)
2. Instalare Node.js 20, MySQL 8, Nginx, PM2
3. Clone repository, `pnpm install`, `pnpm build`
4. Configurare Nginx cu SSL (Let's Encrypt)
5. Configurare `.env` cu toate secretele
6. `pnpm db:push` pentru migrații
7. `pm2 start dist/index.js --name dropi-api`

### Faza 2: Push Notifications Independente
1. Creare proiect Firebase (gratuit)
2. Generare `google-services.json` (Android) și `GoogleService-Info.plist` (iOS)
3. Migrare `server/push-notifications.ts` de la Expo Push API la FCM HTTP v1
4. Testare end-to-end pe device real

### Faza 3: Build și Distribuție
1. Configurare EAS Build (sau local build)
2. Generare APK signed cu keystore propriu
3. Upload pe Google Play Store (cont developer: $25 one-time)
4. Upload pe Apple App Store (cont developer: $99/an)

### Faza 4: Storage Independent
1. Instalare MinIO pe server sau conectare la Backblaze B2
2. Migrare fișiere existente
3. Update `STORAGE_URL` în `.env`

---

## 6. Cerințe Hardware Minime (Server Propriu)

| Componentă | Minim | Recomandat |
|------------|-------|-----------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 2 GB | 4 GB |
| Storage | 20 GB SSD | 50 GB SSD |
| Bandwidth | 1 TB/lună | 3 TB/lună |
| OS | Ubuntu 22.04+ | Ubuntu 24.04 LTS |
| Cost estimat | ~$6/lună (Hetzner) | ~$12/lună (DigitalOcean) |

---

## 7. Domenii și DNS

| Subdomeniu | Scop | Tip Record |
|------------|------|-----------|
| `api.dropi.app` | Backend API + WebSocket | A → IP server |
| `app.dropi.app` | Web dashboard (opțional) | A → IP server |
| `storage.dropi.app` | File storage (MinIO) | A → IP server |
| `mail.dropi.app` | Email sending | MX + SPF + DKIM |

---

## 8. Securitate pe Server Propriu

| Măsură | Implementare |
|--------|-------------|
| Firewall | UFW: doar porturile 22, 80, 443 deschise |
| SSH | Key-only auth, disable password login |
| SSL | Let's Encrypt auto-renew cu certbot |
| DB | Nu expune portul MySQL extern (doar localhost) |
| Secrets | `.env` file cu permisiuni 600, nu în git |
| Backup | Cron zilnic: DB dump + files → storage extern |
| Updates | `unattended-upgrades` pentru security patches |
| Rate limiting | Nginx rate limit pe API endpoints |
| Monitoring | PM2 monitoring + UptimeRobot (gratuit) |

---

## 9. Reguli Canonice

1. **Numele este "DROPi"** — nu "Dropy", nu "Dropi", nu "DROPI" (excepție: variabile de cod unde convenția cere uppercase)
2. **Zero dependență runtime de terți** — orice serviciu terț trebuie să aibă alternativă self-hosted documentată
3. **Toate datele pe server propriu** — nicio dată critică stocată exclusiv pe platforme terțe
4. **Push notifications direct** — FCM/APNs, fără intermediari (Expo Push Service se elimină)
5. **Build reproducibil** — oricine cu codul sursă poate genera APK-ul fără acces la servicii terțe
6. **Documentație completă** — orice pas de deployment documentat, fără "tribal knowledge"

---

## 10. Checklist Pre-Deployment

- [ ] VPS provizionat cu Ubuntu 24.04
- [ ] Node.js 20+, MySQL 8, Nginx, PM2 instalate
- [ ] Domeniu configurat cu DNS records
- [ ] SSL certificat activ (Let's Encrypt)
- [ ] `.env` configurat cu toate variabilele
- [ ] DB migrată (`pnpm db:push`)
- [ ] Server pornit și răspunde la health check
- [ ] Push notifications funcționale (FCM)
- [ ] APK generat și testat pe device real
- [ ] Backup automatizat configurat
- [ ] Monitoring activ (UptimeRobot)
- [ ] Numele "DROPi" verificat în APK, notificări, și store listing
