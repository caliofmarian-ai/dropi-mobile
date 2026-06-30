# BLUEPRINT: Sprint Roadmap & Prioritizare Elemente Pending

**Versiune:** 1.0  
**Data:** 30 Iunie 2026  
**Status:** Activ — Document Canonic Permanent  
**Referințe:** masterplan.md, BLUEPRINT_MARKETPLACE_DROPI.md, BLUEPRINT_PILOT_SELECTION_SYSTEM.md

---

## 1. Scop

Acest blueprint definește strategia permanentă de prioritizare a elementelor rămase în dezvoltarea DROPi Mobile. Servește ca referință pentru orice sesiune viitoare de lucru, asigurând că deciziile de implementare respectă ordinea corectă de priorități.

---

## 2. Metodologie de Evaluare (Permanentă)

Orice element nou adăugat în todo.md trebuie evaluat pe aceste 4 axe:

| Axă | Descriere | Pondere |
|-----|-----------|---------|
| **Impact Utilizator** | Cât de vizibil/critic este pentru end-user | 30% |
| **Conformitate Blueprint** | Cât de obligatoriu este conform documentației canonice | 30% |
| **Dependențe Tehnice** | Câte alte funcționalități depind de acest item | 25% |
| **Efort de Implementare** | Inversul complexității (5 = ușor, 1 = foarte complex) | 15% |

**Formula:** `Scor = (Impact × 0.30) + (Conformitate × 0.30) + (Dependențe × 0.25) + (Efort × 0.15)`

**Clasificare:**
- **4.00–5.00** → Sprint imediat (CRITIC)
- **3.00–3.99** → Sprint următor (MEDIU)
- **2.00–2.99** → Planificat (SCĂZUT)
- **sub 2.00** → Amânat / Nice-to-have

---

## 3. Inventar Curent: 10 Elemente Pending

### 3.1 Clasament Final

| Rang | Element | Scor | Sprint | Status |
|------|---------|------|--------|--------|
| **1** | Delivery Partner "unverified" status | **4.85** | 6A | ⏳ Pending |
| **2** | Guard on mission endpoints (block unverified) | **4.60** | 6A | ⏳ Pending |
| **3** | Admin approval for operational roles | **4.15** | 6A | ⏳ Pending |
| **4** | Push notifications for order status | **3.20** | 6B | ⏳ Pending |
| **5** | Backend API integration (replace mock data) | **3.20** | 6B–6C | ⏳ Pending |
| **6** | QA-debugger validation Sprint 1-2 | **2.80** | 6A (paralel) | ⏳ Pending |
| **7** | Real-time WebSocket for live data | **2.40** | 7 | ⏳ Pending |
| **8** | Biometric authentication (Face ID/Fingerprint) | **2.20** | 7 | ⏳ Pending |
| **9** | Language selector (EN/RO/TL) | **2.20** | 7 | ⏳ Pending |
| **10** | Offline mode with data sync | **2.15** | 8+ | ⏳ Pending |

---

## 4. Sprint 6A — Securitate Operațională (CRITIC)

### 4.1 Obiectiv

Închide toate breșele de securitate operațională. Fără aceste elemente, platforma permite operare neautorizată de către piloți neverificați și auto-promovare la roluri critice.

### 4.2 Task-uri

| # | Task | Descriere Tehnică | Dependență | Efort |
|---|------|-------------------|-----------|-------|
| 1 | Delivery Partner "unverified" status | La register cu rol `delivery_partner`, setează `isVerified = false`. UI arată banner "Verificare necesară" pe dashboard pilot. | Niciuna | 15 min |
| 2 | Guard pe mission endpoints | Middleware pe `b2bDelivery.pilotUpdateStatus`, `pilotSelection.updateAvailability`, `pilotSelection.updatePosition` — verifică `isVerified === true` | Task #1 | 20 min |
| 3 | Admin approval gate | La register cu rol operațional (ops_manager, emergency_coordinator, fleet_manager, droneport_operator, safety_officer, authority roles), setează `isActive = false` + crează automat roleApplication cu status "pending" | Niciuna | 20 min |
| 4 | QA-debugger validation | Rulează qa-debugger pe Sprint 1-2 deliverables | Niciuna | 10 min |

### 4.3 Criterii de Acceptare

- Un delivery partner nou înregistrat NU poate accepta misiuni
- Un delivery partner verificat (admin-approved) POATE accepta misiuni
- Un utilizator care se înregistrează ca "Operations Manager" primește cont inactiv + notificare admin
- Admin-ul poate aproba/respinge din `/app/admin/approvals.tsx`
- Audit log înregistrează toate acțiunile de aprobare/respingere

### 4.4 Matrice de Risc (Dacă NU se implementează)

| Risc | Severitate | Probabilitate | Impact |
|------|-----------|---------------|--------|
| Pilot fără permis execută livrări | CRITIC | Ridicată | Responsabilitate legală |
| Utilizator se auto-promovează la Emergency Coordinator | RIDICAT | Medie | Acces neautorizat la funcții critice |
| Pilot fără asigurare provoacă accident | CRITIC | Scăzută | Răspundere civilă |

---

## 5. Sprint 6B — Experiență Utilizator (MEDIU)

### 5.1 Obiectiv

Îmbunătățire UX prin notificări push și înlocuirea datelor mock cu date reale din DB.

### 5.2 Task-uri

| # | Task | Descriere Tehnică | Efort |
|---|------|-------------------|-------|
| 1 | Push notifications pe order status | Hook pe `b2bDelivery.updateStatus` și `b2bDelivery.pilotUpdateStatus` → trimite notificare push la customer/merchant | 45 min |
| 2 | Replace mock data — Customer Dashboard | Conectează stats (orders count, active deliveries, spending) la endpoint-uri reale | 30 min |
| 3 | Replace mock data — Delivery Partner Dashboard | Conectează stats (missions completed, rating, earnings) la endpoint-uri reale | 30 min |
| 4 | Replace mock data — C2/C3 Dashboards | Conectează pending queue, active ops, stats la endpoint-uri reale | 1-2 ore |

### 5.3 Criterii de Acceptare

- Clientul primește notificare push când comanda schimbă status
- Dashboard-urile afișează date reale din DB (nu hardcoded numbers)
- Dacă nu există date, se afișează "No data yet" (nu numere fictive)

---

## 6. Sprint 7 — Polish & Convenience (SCĂZUT)

### 6.1 Obiectiv

Features de confort care îmbunătățesc experiența dar nu sunt critice pentru operare.

### 6.2 Task-uri

| # | Task | Descriere Tehnică | Efort |
|---|------|-------------------|-------|
| 1 | Biometric auth | expo-local-authentication: Face ID / Fingerprint ca alternativă la password | 20 min |
| 2 | WebSocket extins | Canale WS pentru: order updates, notification feed, dashboard refresh | 2-3 ore |
| 3 | Language selector (i18n) | Framework i18n (expo-localization + react-i18next), extragere string-uri din 45 ecrane, traduceri EN/RO/TL | 4-6 ore |

### 6.3 Criterii de Acceptare

- Biometric: Utilizatorul poate activa Face ID/Fingerprint din Settings
- WebSocket: Dashboard-urile se actualizează în real-time fără pull-to-refresh
- i18n: Selector de limbă la first launch, persistat în AsyncStorage

---

## 7. Sprint 8+ — Complexitate Ridicată (AMÂNAT)

### 7.1 Offline Mode with Data Sync

**Justificare amânare:** Complexitate disproporționată (conflict resolution, queue management, retry logic, partial sync). Nu este necesar până la lansare în zone rurale fără semnal stabil.

**Prerequisite pentru implementare:**
- Toate endpoint-urile trebuie să fie finalizate (Sprint 6B complet)
- Arhitectură de sync definită (optimistic updates vs pessimistic)
- Strategie de conflict resolution documentată
- Test plan pentru scenarii offline/online transitions

**Efort estimat:** 2-3 zile de lucru dedicat

---

## 8. Reguli de Actualizare a Acestui Blueprint

1. **La adăugarea unui element nou în todo.md:** Evaluează pe cele 4 axe, calculează scorul, inserează în clasamentul din §3.1 la poziția corectă
2. **La completarea unui element:** Marchează cu ✅ în §3.1, actualizează status
3. **La schimbarea priorităților:** Recalculează scorurile afectate, re-sortează clasamentul
4. **La începutul fiecărui sprint:** Consultă acest blueprint pentru a determina ce se implementează
5. **Niciodată nu se implementează un element cu scor < 3.00 înaintea unuia cu scor ≥ 3.00**

---

## 9. Dependențe între Elemente (Graf)

```
[3] Delivery Partner "unverified"
         │
         ▼
[2] Guard on mission endpoints ──► Pilot nu poate opera fără verificare
         │
         ▼
[4] Push notifications ──► Notifică pilot când verificarea e aprobată
         │
         ▼
[5] Replace mock data ──► Dashboard-ul pilot arată date reale
         │
         ▼
[7] WebSocket live ──► Updates în real-time pe dashboard
         │
         ▼
[10] Offline mode ──► Funcționare fără conexiune
```

Elementele [1] Admin approval, [6] QA validation, [8] Biometric, [9] Language sunt **independente** — pot fi implementate în orice ordine.

---

## 10. Metrici de Succes Post-Sprint

| Sprint | Metrică | Target |
|--------|---------|--------|
| 6A | Zero piloți neverificați cu acces la misiuni | 100% |
| 6A | Zero roluri operaționale auto-activate | 100% |
| 6B | Notificări push livrate în < 5 secunde | 95% |
| 6B | Dashboard-uri cu date reale (nu mock) | 80% ecrane |
| 7 | Biometric login success rate | 99% |
| 7 | i18n coverage (string-uri traduse) | 100% |
| 8+ | Offline operation fără data loss | 99.9% |

---

**Document canonic. Consultă înainte de orice sesiune de implementare.**
