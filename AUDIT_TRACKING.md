# DROPi Mobile — Tracking Audit Items

**Sursă audit:** [`DROPI_STATUS_REPORT_2026-06-30.md`](./DROPI_STATUS_REPORT_2026-06-30.md)  
**Data audit:** 30 Iunie 2026  
**Stadiu la data auditului:** 252/262 task-uri completate (96.2%)  
**Ultima actualizare tracking:** 2 Iulie 2026

---

## Items Pending (10 din 262)

Bifează `[x]` când un item este finalizat și adaugă data + linkul la PR/commit.

| # | Item | Prioritate | Complexitate | Status | Rezolvat în |
|---|------|-----------|-------------|--------|-------------|
| 1 | Push notifications for order status | Medium | Medium | ⏳ Pending | — |
| 2 | Real-time WebSocket connections for live data | Low | Medium | ⏳ Pending | — |
| 3 | Backend API integration (replace mock data) | Medium | High | ⏳ Pending | — |
| 4 | Biometric authentication (Face ID / Fingerprint) | Low | Low | ⏳ Pending | — |
| 5 | Offline mode with data sync | Low | High | ⏳ Pending | — |
| 6 | QA-debugger validation Sprint 1-2 | Low | Low | ⏳ Pending | — |
| 7 | Language selector (EN, RO, TL) | Low | Medium | ⏳ Pending | — |
| 8 | Admin approval for operational roles | Medium | Low | ⏳ Pending | — |
| 9 | Delivery Partner "unverified" status | Medium | Low | ⏳ Pending | — |
| 10 | Guard on mission endpoints (block unverified) | Medium | Low | ⏳ Pending | — |

---

## Checklist Detaliat

### 🔴 Prioritate Înaltă (din recomandările auditului)

- [ ] **Guards pe mission endpoints** — block delivery partners neverificați  
  _Fișiere relevante: server routers, middleware auth_
- [ ] **Admin approval flow** — roluri operaționale (pilot, dispatcher etc.)  
  _Fișiere relevante: `server/routers/roleApplications.ts`, ecran Admin Approvals_
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
  _Fișiere relevante: `components/live-tracking-map`, WebSocket hooks_
- [ ] **Biometric authentication** — Face ID / Fingerprint via expo-local-authentication  
  _Fișiere relevante: ecran Login/Profile_
- [ ] **Offline mode** — data sync cu AsyncStorage + request queue  
  _Fișiere relevante: lib/storage, API client_
- [ ] **QA-debugger validation Sprint 1-2** — validare completă a specificațiilor Sprint 1-2  
  _Fișiere relevante: `SPRINT_1_2_SPEC.md`_

---

## Recomandări din Audit (Secțiunea 10)

### Prioritate Înaltă
1. - [ ] Finalizare guards pe mission endpoints (block unverified delivery partners)
2. - [ ] Admin approval flow pentru roluri operaționale
3. - [ ] Replace mock data cu date reale din DB pe toate dashboard-urile

### Prioritate Medie
4. - [ ] Push notifications pe status changes (infrastructura există deja)
5. - [ ] Language selector (EN/RO/TL) — internationalizare
6. - [ ] Pilot performance analytics dashboard cu grafice

### Prioritate Joasă
7. - [ ] Biometric authentication (expo-local-authentication)
8. - [ ] Offline mode cu data sync (AsyncStorage + queue)
9. - [ ] Export leaderboard ca PDF/CSV

---

## Progres

| Data | Task finalizat | PR/Commit |
|------|---------------|-----------|
| — | — | — |

---

> **Instrucțiuni:** Când un task este finalizat, actualizează rândul corespunzător din tabelul de sus (schimbă `⏳ Pending` în `✅ Done`), bifează checklist-ul relevant, și adaugă data + linkul la commit/PR în tabelul de progres de la final.
