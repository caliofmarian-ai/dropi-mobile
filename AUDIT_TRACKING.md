# DROPi Mobile — Tracking Audit Items

> **STATUS: HISTORICAL / STALE SNAPSHOT — NOT CURRENT PRODUCT COMPLETION AUTHORITY**
>
> Acest fișier păstrează inventarul auditului din **30 iunie 2026** și cifra istorică `252/262 (96.2%)` pentru trasabilitate. Cifra de 96.2% descrie numai lista de 262 task-uri folosită atunci și **NU reprezintă procentul de implementare al produsului canonic DROPi actual**.
>
> Pentru starea curentă folosește:
> - `canonical/CURRENT_STATE.md`;
> - `BLUEPRINT/DROPi_ROADMAP_BY_LAYERS.md` + issue-urile materializate;
> - `docs/audits/2026-09-12-canonical-coverage-audit.md`;
> - current `main` și issue/PR evidence.
>
> Nu rescrie retroactiv acest snapshot ca și cum auditul din iunie ar fi avut roadmap-ul complet de astăzi.

**Sursă audit:** [`DROPI_STATUS_REPORT_2026-06-30.md`](./DROPI_STATUS_REPORT_2026-06-30.md)  
**Data audit:** 30 Iunie 2026  
**Stadiu la data auditului:** 252/262 task-uri completate (96.2%) — **valoare istorică**
**Ultima actualizare tracking istoric:** 2 Iulie 2026

---

## Items Pending (10 din 262) — inventar istoric

Bifează `[x]` numai când reconciliezi în mod explicit un item istoric cu issue/commit-ul actual; nu folosi tabelul pentru calculul progresului canonic curent.

| # | Item | Prioritate | Complexitate | Status | Rezolvat în |
|---|------|-----------|-------------|--------|-------------|
| 1 | Push notifications for order status | Medium | Medium | ⏳ Historical pending | — |
| 2 | Real-time WebSocket connections for live data | Low | Medium | ⏳ Historical pending | — |
| 3 | Backend API integration (replace mock data) | Medium | High | ⏳ Historical pending | — |
| 4 | Biometric authentication (Face ID / Fingerprint) | Low | Low | ⏳ Historical pending | — |
| 5 | Offline mode with data sync | Low | High | ⏳ Historical pending | — |
| 6 | QA-debugger validation Sprint 1-2 | Low | Low | ⏳ Historical pending | — |
| 7 | Language selector (EN, RO, TL) | Low | Medium | ⏳ Historical pending | — |
| 8 | Admin approval for operational roles | Medium | Low | ⏳ Historical pending | — |
| 9 | Delivery Partner "unverified" status | Medium | Low | ⏳ Historical pending | — |
| 10 | Guard on mission endpoints (block unverified) | Medium | Low | ⏳ Historical pending | — |

---

## Checklist Detaliat — istoric

### 🔴 Prioritate Înaltă (din recomandările auditului 2026-06-30)

- [ ] **Guards pe mission endpoints** — block delivery partners neverificați  
  _Fișiere relevante istorice: server routers, middleware auth_
- [ ] **Admin approval flow** — roluri operaționale (pilot, dispatcher etc.)  
  _Fișiere relevante istorice: `server/routers/roleApplications.ts`, ecran Admin Approvals_
- [ ] **Replace mock data** — înlocuire date statice cu date reale din DB pe toate dashboard-urile  
  _Fișiere relevante: ecrane cu date hardcodate_

### 🟡 Prioritate Medie

- [ ] **Push notifications** — notificări status comenzi (infrastructura expo-notifications există)  
  _Fișiere relevante: `app/`, expo-notifications config_
- [ ] **Delivery Partner "unverified" status** — afișare status neconfirmat în UI  
  _Fișiere relevante: ecran profil delivery partner_
- [ ] **Language selector (EN/RO/TL)** — internationalizare completă  
  _Fișiere relevante: adăugare i18n library_

### 🟢 Prioritate Joasă

- [ ] **Real-time WebSocket** — live data pe toate ecranele relevante (parțial implementat)  
  _Fișiere relevante: WebSocket/tracking hooks_
- [ ] **Biometric authentication** — Face ID / Fingerprint
  _Status actual trebuie citit din owner decision/roadmap, nu din acest snapshot._
- [ ] **Offline mode** — data sync cu AsyncStorage + request queue  
  _Status actual trebuie citit din #280 / roadmap._
- [ ] **QA-debugger validation Sprint 1-2** — validare completă a specificațiilor Sprint 1-2  
  _Înlocuit ca autoritate curentă de auditul canonic 2026-09-12 / #371 / #287._

---

## Recomandări din auditul istoric

Aceste recomandări sunt păstrate pentru provenance. Unele au fost implementate, altele au fost re-baselined sau extinse; verifică întotdeauna issue-urile și source-ul actual.

### Prioritate Înaltă
1. Guards pe mission endpoints.
2. Admin approval flow pentru roluri operaționale.
3. Replace mock data cu date reale din DB pe toate dashboard-urile.

### Prioritate Medie
4. Push notifications pe status changes.
5. Language selector (EN/RO/TL).
6. Pilot performance analytics dashboard.

### Prioritate Joasă
7. Biometric authentication.
8. Offline mode cu data sync.
9. Export leaderboard ca PDF/CSV.

---

## Reconciliation note — 2026-09-12

Auditul canonic actual a demonstrat că mai multe item-uri din lista de mai sus au evoluat semnificativ (de exemplu WebSocket/live tracking, mission guards, DB-backed media, RBAC/audit), în timp ce roadmap-ul canonic actual este mult mai larg decât cele 262 task-uri istorice. Din acest motiv nu se actualizează simplist `96.2%` la o valoare nouă.

Progresul curent este urmărit pe **faze și capabilități canonice**, nu pe această listă istorică.